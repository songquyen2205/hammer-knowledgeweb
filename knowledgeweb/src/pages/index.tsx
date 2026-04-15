import { GraphEntity } from '@/data/types'
import { buildGroundingContext, localAnswer } from '@/lib/grounding'
import { graphData } from '@/lib/graphData'
import MermaidDiagram from '@/components/MermaidDiagram'
import axios from 'axios'
import type { ChangeEvent } from 'react'
import { useMemo, useState } from 'react'

const data = graphData

type EntityFilter = GraphEntity['type'] | 'all'

const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

const isMermaidStart = (input: string) => {
  const first = (input || '').trim().split('\n')[0] || ''
  return /^(graph|flowchart|sequenceDiagram|stateDiagram|classDiagram|erDiagram)/.test(first)
}

export default function HomePage() {
  const [filter, setFilter] = useState<EntityFilter>('all')
  const [q, setQ] = useState('')
  const [selectedSlug, setSelectedSlug] = useState(data.entities[0]?.slug || '')
  const [ask, setAsk] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)

  const entities = useMemo(() => {
    const term = normalize(q)
    return data.entities.filter((e) => {
      const okType = filter === 'all' || e.type === filter
      const text = normalize([e.title, e.subtitle, e.summary, ...e.tags].join(' '))
      return okType && (!term || text.includes(term))
    })
  }, [filter, q])

  const selected = useMemo(() => {
    return data.entities.find((e) => e.slug === selectedSlug) || entities[0]
  }, [selectedSlug, entities])

  const relation = useMemo(() => {
    if (!selected) return []
    return data.edges.filter((e) => e.from === selected.slug || e.to === selected.slug)
  }, [selected])

  const scenario = useMemo(() => {
    if (!selected) return []
    return data.scenarios.filter((s) => s.steps.some((st) => st.entitySlug === selected.slug))
  }, [selected])

  const submitAsk = async () => {
    if (!ask.trim()) {
      setAnswer('Vui long nhap cau hoi.')
      return
    }

    setLoading(true)
    try {
      const res = await axios.post('/api/ask', {
        question: ask,
        groundingContext: buildGroundingContext(),
      })

      if (typeof res.data?.answer === 'string' && res.data.answer.trim()) {
        setAnswer(res.data.answer)
      } else {
        setAnswer(localAnswer(ask))
      }
    } catch {
      setAnswer(`${localAnswer(ask)}\n\n(Fallback local vi model API chua kha dung.)`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="layout">
      <header className="header">
        <h1>Hammer Knowledge Web</h1>
        <p>
          Object explorer + Ask AI grounded tren tri thuc noi bo. Source uu tien: {data.sourceOfTruth}
        </p>
      </header>

      <section className="grid">
        <aside className="card side">
          <div className="stack">
            <div>
              <label htmlFor="q">Search</label>
              <input
                id="q"
                value={q}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
                placeholder="tim theo keyword"
              />
            </div>
            <div>
              <label htmlFor="f">Filter type</label>
              <select
                id="f"
                value={filter}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilter(e.target.value as EntityFilter)}
              >
                <option value="all">all</option>
                <option value="actor">actor</option>
                <option value="module">module</option>
                <option value="flow">flow</option>
                <option value="concept">concept</option>
                <option value="metric">metric</option>
                <option value="system">system</option>
                <option value="source">source</option>
                <option value="rule">rule</option>
                <option value="open_issue">open_issue</option>
              </select>
            </div>
            <ul className="list">
              {entities.map((e: GraphEntity) => (
                <li key={e.slug}>
                  <button
                    className={selected?.slug === e.slug ? 'active' : ''}
                    onClick={() => setSelectedSlug(e.slug)}
                  >
                    <strong>{e.title}</strong>
                    <div className="meta">{e.type} | {e.subtitle}</div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <article className="card content">
          {!selected ? (
            <div>Khong co entity.</div>
          ) : (
            <div className="stack">
              <section className="section">
                <span className="badge" style={{ background: selected.color }}>{selected.type}</span>
                <h2 style={{ margin: 0 }}>{selected.title}</h2>
                <div className="meta" style={{ marginBottom: 8 }}>{selected.subtitle}</div>
                <p>{selected.summary}</p>
                <p className="meta">{selected.detail}</p>
                <div className="chips">
                  {selected.tags.map((tag) => (
                    <span key={tag} className="chip">{tag}</span>
                  ))}
                </div>
              </section>

              <section className="section">
                <h3>Relation panel</h3>
                <ul>
                  {relation.map((r, idx) => (
                    <li key={`${r.from}-${r.to}-${idx}`}>
                      {r.from} -&gt; {r.to} ({r.type}: {r.label})
                    </li>
                  ))}
                </ul>
              </section>

              <section className="section">
                <h3>Scenarios</h3>
                {scenario.length === 0 && <div className="meta">Entity nay chua nam trong scenario nao.</div>}
                {scenario.map((s) => (
                  <div key={s.slug} style={{ marginBottom: 10 }}>
                    <strong>{s.title}</strong>
                    <div className="meta" style={{ marginBottom: 4 }}>{s.summary}</div>
                    <ul>
                      {s.steps.map((st, i: number) => (
                        <li key={`${s.slug}-${st.entitySlug}-${i}`}>
                          {i + 1}. {st.entitySlug}: {st.caption}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>

              <section className="section">
                <h3>Diagram</h3>
                {!selected.diagram && <div className="meta">Entity nay chua co diagram.</div>}
                {!!selected.diagram && isMermaidStart(selected.diagram) && (
                  <MermaidDiagram content={selected.diagram} />
                )}
                {!!selected.diagram && !isMermaidStart(selected.diagram) && (
                  <div>
                    <div className="meta">Mermaid syntax khong hop le, fallback plain text:</div>
                    <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{selected.diagram}</pre>
                  </div>
                )}
              </section>

              {(selected.mockupImageUrl || selected.mockupDescription) && (
                <section className="section">
                  <h3>Mockup</h3>
                  {selected.mockupImageUrl && (
                    <img
                      src={selected.mockupImageUrl}
                      alt={`Mockup ${selected.title}`}
                      style={{ width: '100%', maxWidth: 920, borderRadius: 10, border: '1px solid #d6d6d6' }}
                    />
                  )}
                  {selected.mockupDescription && (
                    <pre style={{ whiteSpace: 'pre-wrap', marginTop: 10 }}>{selected.mockupDescription}</pre>
                  )}
                </section>
              )}

              {selected.notesForDev && (
                <section className="section">
                  <h3>Notes for Dev</h3>
                  <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{selected.notesForDev}</pre>
                </section>
              )}

              {selected.notesForDesigner && (
                <section className="section">
                  <h3>Notes for Designer</h3>
                  <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{selected.notesForDesigner}</pre>
                </section>
              )}

              {selected.notesForClient && (
                <section className="section">
                  <h3>Notes for Client</h3>
                  <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{selected.notesForClient}</pre>
                </section>
              )}

              <section className="section">
                <h3>Ask AI grounded</h3>
                <div className="stack">
                  <textarea
                    rows={4}
                    value={ask}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setAsk(e.target.value)}
                    placeholder="Dat cau hoi ve actor, flow, module..."
                  />
                  <button onClick={submitAsk} disabled={loading}>{loading ? 'Dang xu ly...' : 'Hoi Ask AI'}</button>
                  <textarea rows={10} value={answer} readOnly />
                </div>
              </section>

              <section className="section">
                <h3>Data metadata</h3>
                <div className="meta">generatedAt: {data.generatedAt}</div>
                <div className="meta">sourceOfTruth: {data.sourceOfTruth}</div>
                <div className="meta">
                  migrationLog: oldFoldersFound={data.migrationLog.oldFoldersFound.length}, filesRead={data.migrationLog.filesRead}, mergedLines={data.migrationLog.mergedLines}
                </div>
              </section>
            </div>
          )}
        </article>
      </section>
    </main>
  )
}
