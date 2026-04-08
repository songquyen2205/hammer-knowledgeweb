import graph from '@/data/graph.generated.json'
import { seedGraphData } from '@/data/seed'
import { GraphData } from '@/data/types'

const generated = graph as GraphData

export const graphData: GraphData =
  generated?.entities?.length > 0 ? generated : seedGraphData
