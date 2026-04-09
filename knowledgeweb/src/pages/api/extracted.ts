import type { NextApiRequest, NextApiResponse } from 'next'
import { graphData } from '@/lib/graphData'
import { GraphEntity } from '@/data/types'

type ExtractedEntity = GraphEntity & { type: string }

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  const entities = (graphData.entities || []) as ExtractedEntity[]
  const assumptions = graphData.assumptions || []

  res.status(200).json({
    actors: entities.filter((x) => x.type === 'actor'),
    modules: entities.filter((x) => x.type === 'module'),
    flows: entities.filter((x) => x.type === 'flow'),
    dataKpis: entities.filter((x) => x.type === 'metric' || x.type === 'concept' || x.type === 'source'),
    rulesOpenIssues: [
      ...assumptions.map((text, idx) => ({
        slug: `assumption-${idx + 1}`,
        type: 'open_issue',
        title: 'Giả định mở',
        summary: text,
      })),
      ...entities.filter((x) => x.type === 'rule' || x.type === 'open_issue'),
    ],
  })
}
