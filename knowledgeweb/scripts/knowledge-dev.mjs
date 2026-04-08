import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const cwd = process.cwd()
const runtimeFile = path.resolve(cwd, '.knowledgeweb-runtime.json')
const serverFile = path.resolve(cwd, 'server.js')

if (!fs.existsSync(serverFile)) {
  console.error('[knowledge:dev] Missing server.js')
  process.exit(1)
}

const child = spawn(process.execPath, [serverFile], {
  cwd,
  stdio: 'inherit',
})

child.on('error', (err) => {
  console.error('[knowledge:dev] failed to start', err)
  process.exit(1)
})

child.on('exit', (code) => {
  if (code !== 0) {
    console.error(`[knowledge:dev] exited with code ${code}`)
    process.exit(code || 1)
  }
})

process.on('SIGINT', () => {
  if (!child.killed) child.kill('SIGINT')
})

process.on('SIGTERM', () => {
  if (!child.killed) child.kill('SIGTERM')
})

setTimeout(() => {
  if (fs.existsSync(runtimeFile)) {
    try {
      const runtime = JSON.parse(fs.readFileSync(runtimeFile, 'utf-8'))
      if (runtime?.url) {
        console.log(runtime.url)
      }
    } catch {
      // ignore runtime parse errors
    }
  }
}, 800)
