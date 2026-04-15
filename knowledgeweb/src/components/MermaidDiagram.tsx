import { useEffect, useRef, useState } from 'react'

type MermaidDiagramProps = {
  content: string
}

export default function MermaidDiagram({ content }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const renderIdRef = useRef(`mermaid-${Math.random().toString(36).slice(2)}`)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    const render = async () => {
      try {
        setError('')
        const mermaid = (await import('mermaid')).default

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
          theme: 'default',
        })

        const normalized = (content || '').replace(/\\n/g, '\n').trim()
        const { svg } = await mermaid.render(renderIdRef.current, normalized)

        if (mounted && containerRef.current) {
          containerRef.current.innerHTML = svg
        }
      } catch (e) {
        if (!mounted) return
        const message = e instanceof Error ? e.message : 'Unknown Mermaid render error'
        setError(message)
      }
    }

    void render()

    return () => {
      mounted = false
    }
  }, [content])

  if (error) {
    return (
      <div>
        <div className="meta">Mermaid render error, fallback plain text:</div>
        <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{content}</pre>
      </div>
    )
  }

  return <div ref={containerRef} style={{ overflowX: 'auto' }} />
}
