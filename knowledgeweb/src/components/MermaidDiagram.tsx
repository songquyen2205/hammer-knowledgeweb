import { useEffect, useRef } from 'react'
import mermaid from 'mermaid'

interface MermaidDiagramProps {
  content: string
}

export default function MermaidDiagram({ content }: MermaidDiagramProps) {
  const divRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!divRef.current) return

    const renderDiagram = async () => {
      try {
        mermaid.contentLoaded()
        const { svg } = await mermaid.render('mermaid-diagram', content)
        if (divRef.current) {
          divRef.current.innerHTML = svg
        }
      } catch (error) {
        console.error('Mermaid render error:', error)
        if (divRef.current) {
          divRef.current.innerHTML = `<div style="color: red; padding: 10px; border: 1px solid red; border-radius: 4px;">
            Loi render diagram: ${(error as Error)?.message || 'Unknown error'}
          </div>`
        }
      }
    }

    renderDiagram()
  }, [content])

  return <div ref={divRef} style={{ overflow: 'auto' }} />
}
