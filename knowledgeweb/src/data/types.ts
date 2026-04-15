export type GraphEntity = {
  slug: string
  type: 'actor' | 'module' | 'flow' | 'concept' | 'metric' | 'system' | 'source' | 'rule' | 'open_issue'
  title: string
  subtitle: string
  summary: string
  detail: string
  color: string
  tags: string[]
  highlights: string[]
  questions: string[]
  diagram?: string
  mockupImageUrl?: string
  mockupDescription?: string
  notesForDev?: string
  notesForDesigner?: string
  notesForClient?: string
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
