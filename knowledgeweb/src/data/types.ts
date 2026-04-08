export type GraphEntity = {
  slug: string
  type: 'actor' | 'module' | 'flow' | 'concept' | 'metric' | 'system' | 'source'
  title: string
  subtitle: string
  summary: string
  detail: string
  color: string
  tags: string[]
  highlights: string[]
  questions: string[]
  diagram?: string
  mockup_description?: string
  notes_for_dev?: string
  notes_for_designer?: string
  notes_for_client?: string
}

export type GraphEdge = {
  from: string
  to: string
  type: string
  label: string
}

export type Scenario = {
  slug: string
  title: string
  summary: string
  mood: string
  steps: Array<{ entitySlug: string; caption: string }>
}

export type GraphData = {
  generatedAt: string
  sourceOfTruth: string
  assumptions: string[]
  migrationLog: {
    oldFoldersChecked: string[]
    oldFoldersFound: string[]
    filesRead: number
    mergedLines: number
    deletedFolders: string[]
  }
  entities: GraphEntity[]
  edges: GraphEdge[]
  scenarios: Scenario[]
}
