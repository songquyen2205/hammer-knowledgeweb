import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

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

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  // In serverless/deployed environments the repo root is not available.
  // Resolve relative to the knowledgeweb package root (two levels up from pages/api/).
  const appRoot = path.resolve(process.cwd())
  const repoRoot = path.resolve(appRoot, '..')

  const files = markdownSources
    .map((rel) => ({ rel, abs: path.join(repoRoot, rel) }))
    .filter((x) => {
      try {
        return fs.existsSync(x.abs)
      } catch {
        return false
      }
    })
    .map((x) => {
      try {
        return { path: x.rel, content: fs.readFileSync(x.abs, 'utf-8') }
      } catch {
        return null
      }
    })
    .filter((x): x is { path: string; content: string } => x !== null)

  res.status(200).json({ files })
}
