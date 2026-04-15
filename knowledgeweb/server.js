const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')
const { URL } = require('node:url')
const { spawnSync } = require('node:child_process')
const net = require('node:net')

const appRoot = __dirname
const repoRoot = path.resolve(appRoot, '..')
const dataFile = path.join(appRoot, 'src', 'data', 'graph.generated.json')
const rawMarkdownFile = path.join(appRoot, 'src', 'data', 'raw-markdown.generated.json')
const htmlFile = path.join(appRoot, 'public', 'index.html')
const publicDir = path.join(appRoot, 'public')
const runtimeFile = path.join(appRoot, '.knowledgeweb-runtime.json')
const portFile = path.join(appRoot, '.knowledgeweb-port')
const args = process.argv.slice(2)
const isSyncOnce = args.includes('--sync-once')

const markdownSources = [
  'NotecuaQuyen/knowledge-base.md',
  'NotecuaQuyen/hammer_wallet.md',
  'NotecuaQuyen/hammer_businessmodel.md',
  'NotecuaQuyen/hammer_toan-bo-du-an.md',
  'NotecuaQuyen/thuat-ngu.md',
  'NotecuaQuyen/kpi.md',
  'NotecuaQuyen/open-issues.md',
  'README.md',
  '.github/copilot-instructions.md',
]

const oldFolders = ['docs', 'Quyennote', 'docs-old', 'Notion-export']

const watchTargets = [
  path.join(repoRoot, 'NotecuaQuyen'),
  path.join(repoRoot, 'README.md'),
  path.join(repoRoot, 'hammer-api', 'config', 'routes.rb'),
  path.join(repoRoot, 'hammer-api', 'app', 'models'),
]

let syncTimer = null

const safeReadJson = () => {
  try {
    return JSON.parse(fs.readFileSync(dataFile, 'utf-8'))
  } catch {
    return {
      generatedAt: new Date(0).toISOString(),
      sourceOfTruth: 'NotecuaQuyen/knowledge-base.md',
      assumptions: ['Graph data chưa được đồng bộ.'],
      migrationLog: {
        oldFoldersChecked: oldFolders,
        oldFoldersFound: oldFolders.filter((f) => fs.existsSync(path.join(repoRoot, f))),
        filesRead: 0,
        mergedLines: 0,
        deletedFolders: [],
      },
      entities: [],
      edges: [],
      scenarios: [],
    }
  }
}

const normalize = (text) =>
  String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

const scoreEntity = (entity, question) => {
  const tokens = normalize(question).split(/[^a-z0-9]+/).filter(Boolean)
  const haystack = normalize(
    [
      entity.title,
      entity.subtitle,
      entity.summary,
      entity.detail,
      ...(entity.tags || []),
      ...(entity.highlights || []),
      ...(entity.questions || []),
    ].join(' ')
  )

  return tokens.reduce((sum, token) => sum + (haystack.includes(token) ? 2 : 0), 0)
}

const localAnswer = (question, graph) => {
  const top = [...(graph.entities || [])]
    .map((entity) => ({ entity, score: scoreEntity(entity, question) }))
    .sort((a, b) => b.score - a.score)
    .filter((x) => x.score > 0)
    .slice(0, 3)

  if (!top.length) {
    return 'Không tìm thấy kết quả phù hợp trong tri thức nội bộ. Hãy hỏi theo actor/module/flow cụ thể.'
  }

  const lines = top
    .map(
      ({ entity }, idx) =>
        `${idx + 1}. ${entity.title} (${entity.type})\n- ${entity.summary}\n- Highlight: ${(entity.highlights || []).join(', ')}`
    )
    .join('\n')

  const assumptions = (graph.assumptions || []).length
    ? `\nGiả định đang mở: ${graph.assumptions.join(' | ')}`
    : ''

  return `Trả lời grounded theo dữ liệu nội bộ:\n${lines}${assumptions}`
}

const runSync = () => {
  const script = path.join(appRoot, 'scripts', 'sync-knowledge.mjs')
  const result = spawnSync(process.execPath, [script], {
    cwd: appRoot,
    stdio: 'inherit',
  })
  return result.status === 0
}

const setupWatch = () => {
  const trigger = () => {
    if (syncTimer) clearTimeout(syncTimer)
    syncTimer = setTimeout(() => {
      runSync()
    }, 300)
  }

  watchTargets.forEach((target) => {
    if (!fs.existsSync(target)) return

    try {
      const stat = fs.statSync(target)
      if (stat.isDirectory()) {
        fs.watch(target, { recursive: true }, trigger)
      } else {
        fs.watch(target, trigger)
      }
    } catch {
      // ignore invalid watcher target
    }
  })
}

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
      if (body.length > 1024 * 1024) {
        reject(new Error('payload too large'))
      }
    })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })

const findFreePort = async (startPort) => {
  const available = (port) =>
    new Promise((resolve) => {
      const tester = net.createServer()
      tester.once('error', () => resolve(false))
      tester.once('listening', () => tester.close(() => resolve(true)))
      tester.listen(port, '127.0.0.1')
    })

  let port = startPort
  while (!(await available(port))) port += 1
  return port
}

const sendJson = (res, status, payload) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(payload))
}

const projectSlug = () => path.basename(repoRoot).toLowerCase().replace(/[^a-z0-9]+/g, '-')

const deterministicPort = (slug) => {
  let hash = 0
  for (const ch of slug) {
    hash = (hash * 33 + ch.charCodeAt(0)) % 900
  }
  return 3100 + hash
}

const resolvePreferredPort = () => {
  const slug = projectSlug()
  const computed = deterministicPort(slug)

  if (!fs.existsSync(portFile)) {
    fs.writeFileSync(portFile, `${computed}\n`, 'utf-8')
    return computed
  }

  const raw = fs.readFileSync(portFile, 'utf-8').trim()
  const saved = Number(raw)
  if (Number.isInteger(saved) && saved >= 1024 && saved <= 65535) {
    return saved
  }

  fs.writeFileSync(portFile, `${computed}\n`, 'utf-8')
  return computed
}

const buildExtractedObjects = (graph) => ({
  actors: (graph.entities || []).filter((x) => x.type === 'actor'),
  modules: (graph.entities || []).filter((x) => x.type === 'module'),
  flows: (graph.entities || []).filter((x) => x.type === 'flow'),
  dataKpis: (graph.entities || []).filter((x) => x.type === 'metric' || x.type === 'concept' || x.type === 'source'),
  rulesOpenIssues: [
    ...(graph.assumptions || []).map((text, idx) => ({ slug: `assumption-${idx + 1}`, type: 'open_issue', title: 'Giả định mở', summary: text })),
    ...(graph.entities || []).filter((x) => x.type === 'rule' || x.type === 'open_issue'),
  ],
})

const readRawMarkdown = () => {
  try {
    const parsed = JSON.parse(fs.readFileSync(rawMarkdownFile, 'utf-8'))
    if (Array.isArray(parsed?.files)) return parsed.files
  } catch {
    // fallback below
  }

  return markdownSources
    .map((rel) => ({ rel, abs: path.join(repoRoot, rel) }))
    .filter((x) => fs.existsSync(x.abs))
    .map((x) => ({ path: x.rel, content: fs.readFileSync(x.abs, 'utf-8') }))
}

const buildProgressSteps = () => {
  const graph = safeReadJson()
  const now = Date.now()
  const generatedAt = Date.parse(graph.generatedAt || '')
  const isFresh = Number.isFinite(generatedAt) && now - generatedAt < 1000 * 60 * 60 * 24

  const has = (rel) => fs.existsSync(path.join(repoRoot, rel))
  const hasEntities = (graph.entities || []).length > 0
  const hasRules = (graph.entities || []).some((x) => x.type === 'rule' || x.type === 'open_issue')

  const steps = [
    {
      id: 1,
      title: 'Đọc code/docs để hiểu hệ thống',
      status: hasEntities ? 'done' : 'todo',
    },
    {
      id: 2,
      title: 'Tạo tài liệu toàn cảnh/bao quát',
      status: has('NotecuaQuyen/knowledge-base.md') && has('NotecuaQuyen/hammer_businessmodel.md') ? 'done' : 'todo',
    },
    {
      id: 3,
      title: 'Tạo tài liệu trung gian module/flow/domain',
      status: has('NotecuaQuyen/hammer_toan-bo-du-an.md') ? 'done' : 'todo',
    },
    {
      id: 4,
      title: 'Tạo tài liệu chi tiết rules/state/KPI/edge cases',
      status: hasRules && has('NotecuaQuyen/kpi.md') && has('NotecuaQuyen/open-issues.md') ? 'done' : 'todo',
    },
    {
      id: 5,
      title: 'Cập nhật delta khi có thay đổi mới',
      status: isFresh ? 'in-progress' : 'todo',
    },
    {
      id: 6,
      title: 'Đồng bộ và hiển thị lên knowledge web',
      status: has('knowledgeweb/public/index.html') && has('knowledgeweb/src/data/graph.generated.json') ? 'done' : 'todo',
    },
  ]

  if (isFresh) {
    steps[4].status = 'done'
  }

  return {
    generatedAt: graph.generatedAt || null,
    steps,
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const reqUrl = new URL(req.url || '/', 'http://localhost')

    if (reqUrl.pathname === '/health') {
      sendJson(res, 200, { status: 'ok', project: projectSlug(), ts: Date.now() })
      return
    }

    if (reqUrl.pathname === '/api/data') {
      sendJson(res, 200, safeReadJson())
      return
    }

    if (reqUrl.pathname === '/api/raw-markdown') {
      sendJson(res, 200, { files: readRawMarkdown() })
      return
    }

    if (reqUrl.pathname === '/api/extracted') {
      const graph = safeReadJson()
      sendJson(res, 200, buildExtractedObjects(graph))
      return
    }

    if (reqUrl.pathname === '/api/progress') {
      sendJson(res, 200, buildProgressSteps())
      return
    }

    if (reqUrl.pathname === '/api/ask' && req.method === 'POST') {
      const raw = await readBody(req).catch(() => '{}')
      const payload = JSON.parse(raw || '{}')
      const question = String(payload.question || '').trim()
      const graph = safeReadJson()

      let answer = ''
      const modelUrl = process.env.KNOWLEDGE_MODEL_URL
      const modelToken = process.env.KNOWLEDGE_MODEL_TOKEN

      if (modelUrl && modelToken && typeof fetch === 'function') {
        try {
          const remote = await fetch(modelUrl, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${modelToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              question,
              groundingContext: JSON.stringify(graph),
            }),
          })

          const json = await remote.json()
          answer = String(json.answer || json.output_text || '')
        } catch {
          answer = ''
        }
      }

      if (!answer) {
        answer = localAnswer(question, graph)
      }

      sendJson(res, 200, { answer })
      return
    }

    if (reqUrl.pathname === '/' || reqUrl.pathname === '/index.html') {
      const html = fs.readFileSync(htmlFile, 'utf-8')
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(html)
      return
    }

    // Serve static files from public/ (e.g. /vendor/mermaid.min.js)
    const staticFile = path.resolve(path.join(publicDir, reqUrl.pathname))
    if (staticFile.startsWith(publicDir + path.sep)) {
      try {
        if (fs.existsSync(staticFile) && fs.statSync(staticFile).isFile()) {
          const mimeMap = {
            '.js':    'application/javascript; charset=utf-8',
            '.css':   'text/css; charset=utf-8',
            '.json':  'application/json; charset=utf-8',
            '.png':   'image/png',
            '.svg':   'image/svg+xml',
            '.ico':   'image/x-icon',
            '.woff2': 'font/woff2',
            '.woff':  'font/woff',
            '.ttf':   'font/ttf',
          }
          const ct = mimeMap[path.extname(staticFile).toLowerCase()] || 'application/octet-stream'
          res.writeHead(200, { 'Content-Type': ct })
          fs.createReadStream(staticFile).pipe(res)
          return
        }
      } catch {
        // fall through to 404
      }
    }

    sendJson(res, 404, { error: 'not found' })
  } catch (error) {
    sendJson(res, 500, { error: 'internal_error', message: error.message })
  }
})

const boot = async () => {
  const syncOk = runSync()
  if (!syncOk) {
    console.error('[knowledgeweb] Đồng bộ dữ liệu thất bại.')
    process.exit(1)
  }

  if (isSyncOnce) {
    console.log('[knowledgeweb] Đồng bộ dữ liệu thành công (--sync-once).')
    process.exit(0)
  }

  setupWatch()
  const preferredPort = resolvePreferredPort()
  const port = await findFreePort(preferredPort)

  server.listen(port, '127.0.0.1', () => {
    const url = `http://localhost:${port}`
    fs.writeFileSync(runtimeFile, JSON.stringify({ port, url, generatedAt: new Date().toISOString() }, null, 2) + '\n', 'utf-8')
    console.log(url)
  })
}

boot()
