import fs from 'node:fs/promises'
import type { IncomingMessage, ServerResponse } from 'node:http'
import path from 'node:path'
import type { Plugin, ViteDevServer } from 'vite'

const MEALS_PATH = '/api/meals'

type HttpServer = Pick<ViteDevServer, 'config' | 'middlewares'>

function todayISO(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function dataPaths(root: string) {
  const dir = path.join(root, 'data')
  return {
    dir,
    meals: path.join(dir, 'meals.json'),
    prev: path.join(dir, 'meals.prev.json'),
    stamp: path.join(dir, '.backup-day'),
  }
}

async function rotateYesterdayBackup(root: string): Promise<void> {
  const files = dataPaths(root)
  await fs.mkdir(files.dir, { recursive: true })
  const today = todayISO()
  let stamped = ''
  try {
    stamped = (await fs.readFile(files.stamp, 'utf8')).trim()
  } catch {
    stamped = ''
  }
  if (stamped === today) return
  try {
    await fs.copyFile(files.meals, files.prev)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
  await fs.writeFile(files.stamp, `${today}\n`, 'utf8')
}

async function atomicWrite(filePath: string, contents: string): Promise<void> {
  const tmp = `${filePath}.${process.pid}.tmp`
  await fs.writeFile(tmp, contents, 'utf8')
  await fs.copyFile(tmp, filePath)
  await fs.unlink(tmp)
}

async function readMealsFile(root: string): Promise<string> {
  try {
    return await fs.readFile(dataPaths(root).meals, 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return '[]\n'
    throw error
  }
}

function sendJson(res: ServerResponse, status: number, body: string): void {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(body)
}

function sendError(res: ServerResponse, status: number, message: string): void {
  sendJson(res, status, `${JSON.stringify({ error: message })}\n`)
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

async function handleMeals(
  req: IncomingMessage,
  res: ServerResponse,
  root: string,
): Promise<void> {
  if (req.method === 'GET') {
    await rotateYesterdayBackup(root)
    sendJson(res, 200, await readMealsFile(root))
    return
  }

  if (req.method === 'PUT') {
    const raw = await readBody(req)
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      sendError(res, 400, 'That file is not valid JSON.')
      return
    }
    if (!Array.isArray(parsed)) {
      sendError(res, 400, 'JSON must be an array of days.')
      return
    }
    await rotateYesterdayBackup(root)
    await fs.mkdir(dataPaths(root).dir, { recursive: true })
    await atomicWrite(dataPaths(root).meals, `${JSON.stringify(parsed, null, 2)}\n`)
    sendJson(res, 200, '{"ok":true}\n')
    return
  }

  res.statusCode = 405
  res.setHeader('Allow', 'GET, PUT')
  res.end()
}

export function mealsApi(): Plugin {
  function attach(server: HttpServer) {
    server.middlewares.use((req, res, next) => {
      const url = req.url?.split('?')[0]
      if (url !== MEALS_PATH) {
        next()
        return
      }
      void handleMeals(req, res, server.config.root).catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Unknown error'
        sendError(res, 500, message)
      })
    })
  }

  return {
    name: 'meals-api',
    configureServer: attach,
    configurePreviewServer: attach,
  }
}
