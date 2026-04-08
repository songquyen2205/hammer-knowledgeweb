import chokidar from 'chokidar'
import path from 'node:path'
import { spawn } from 'node:child_process'

const root = path.resolve(process.cwd(), '..')

const watchTargets = [
  path.join(root, 'NotecuaQuyen', '**', '*.md'),
  path.join(root, 'README.md'),
  path.join(root, 'hammer-api', 'config', 'routes.rb'),
  path.join(root, 'hammer-api', 'app', 'models', '*.rb'),
]

let syncing = false
let pending = false

const runSync = () => {
  if (syncing) {
    pending = true
    return
  }

  syncing = true
  const child = spawn(process.execPath, [path.resolve(process.cwd(), 'scripts/sync-knowledge.mjs')], {
    stdio: 'inherit',
  })

  child.on('exit', () => {
    syncing = false
    if (pending) {
      pending = false
      runSync()
    }
  })
}

console.log('[knowledge:watch] watching for docs/source changes...')
console.log(`[knowledge:watch] targets=${watchTargets.length}`)

runSync()

const watcher = chokidar.watch(watchTargets, {
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 300,
    pollInterval: 50,
  },
})

watcher.on('all', (event, filePath) => {
  console.log(`[knowledge:watch] ${event}: ${filePath}`)
  runSync()
})
