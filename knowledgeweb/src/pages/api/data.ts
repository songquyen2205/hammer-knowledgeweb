import type { NextApiRequest, NextApiResponse } from 'next'
import { graphData } from '@/lib/graphData'

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json(graphData)
}
