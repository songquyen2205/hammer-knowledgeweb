import { GraphEntity } from '@/data/types'
import { graphData } from '@/lib/graphData'

const data = graphData

const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

const tokenize = (text: string) =>
  normalize(text)
    .split(/[^a-z0-9]+/)
    .filter(Boolean)

const scoreEntity = (entity: GraphEntity, query: string): number => {
  const q = tokenize(query)
  const corpus = normalize(
    [
      entity.title,
      entity.subtitle,
      entity.summary,
      entity.detail,
      ...entity.tags,
      ...entity.highlights,
      ...entity.questions,
    ].join(' ')
  )

  return q.reduce((sum, t) => sum + (corpus.includes(t) ? 2 : 0), 0)
}

export const buildGroundingContext = () => {
  const entities = data.entities
    .map((e) => `- ${e.slug} | ${e.type} | ${e.title}: ${e.summary}`)
    .join('\n')
  const edges = data.edges
    .map((e) => `- ${e.from} -> ${e.to} (${e.type}: ${e.label})`)
    .join('\n')

  return [
    `Source of truth: ${data.sourceOfTruth}`,
    'Entities:',
    entities,
    'Edges:',
    edges,
  ].join('\n')
}

export const localAnswer = (question: string) => {
  const ranked = data.entities
    .map((entity) => ({ entity, score: scoreEntity(entity, question) }))
    .sort((a, b) => b.score - a.score)

  const top = ranked.filter((x) => x.score > 0).slice(0, 3)

  if (!top.length) {
    return 'Khong tim thay match ro trong tri thuc noi bo. Hay hoi theo actor/module/flow cu the.'
  }

  const core = top
    .map(
      ({ entity }, idx) =>
        `${idx + 1}. ${entity.title} (${entity.type})\n- ${entity.summary}\n- Highlight: ${entity.highlights.join(', ')}`
    )
    .join('\n')

  const assumptions = data.assumptions.length
    ? `\nGia dinh dang mo: ${data.assumptions.join(' | ')}`
    : ''

  return `Tra loi grounded theo du lieu noi bo:\n${core}${assumptions}`
}
