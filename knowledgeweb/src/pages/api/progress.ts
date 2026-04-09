import type { NextApiRequest, NextApiResponse } from 'next'
import { graphData } from '@/lib/graphData'

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  const entities = graphData.entities || []
  const hasEntities = entities.length > 0
  const hasRules = entities.some(
    (x) => (x as { type: string }).type === 'rule' || (x as { type: string }).type === 'open_issue'
  )

  const generatedAt = (graphData as { generatedAt?: string }).generatedAt || null
  const isFresh =
    generatedAt !== null &&
    Number.isFinite(Date.parse(generatedAt)) &&
    Date.now() - Date.parse(generatedAt) < 1000 * 60 * 60 * 24

  const steps = [
    {
      id: 1,
      title: 'Đọc code/docs để hiểu hệ thống',
      status: hasEntities ? 'done' : 'todo',
    },
    {
      id: 2,
      title: 'Tạo tài liệu toàn cảnh/bao quát',
      status: hasEntities ? 'done' : 'todo',
    },
    {
      id: 3,
      title: 'Tạo tài liệu trung gian module/flow/domain',
      status: hasEntities ? 'done' : 'todo',
    },
    {
      id: 4,
      title: 'Tạo tài liệu chi tiết rules/state/KPI/edge cases',
      status: hasRules ? 'done' : 'todo',
    },
    {
      id: 5,
      title: 'Cập nhật delta khi có thay đổi mới',
      status: isFresh ? 'done' : 'todo',
    },
    {
      id: 6,
      title: 'Đồng bộ và hiển thị lên knowledge web',
      status: hasEntities ? 'done' : 'todo',
    },
  ]

  res.status(200).json({ generatedAt, steps })
}
