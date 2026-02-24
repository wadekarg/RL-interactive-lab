import { useEffect, useRef } from 'react'
import katex from 'katex'

interface ExplainerSection {
  title: string
  content: string
  equation?: string
}

interface AlgorithmExplainerProps {
  name: string
  description: string
  sections: ExplainerSection[]
}

function RenderedEquation({ tex }: { tex: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) {
      katex.render(tex, ref.current, {
        throwOnError: false,
        displayMode: true,
      })
    }
  }, [tex])

  return <div ref={ref} className="my-2 overflow-x-auto" />
}

export function AlgorithmExplainer({ name, description, sections }: AlgorithmExplainerProps) {
  return (
    <div className="bg-surface-light rounded-xl border border-surface-lighter p-4">
      <h2 className="text-lg font-bold text-primary-light mb-1">{name}</h2>
      <p className="text-sm text-text-muted mb-4">{description}</p>

      <div className="flex flex-col gap-4">
        {sections.map((section) => (
          <div key={section.title}>
            <h4 className="text-sm font-semibold text-text mb-1">{section.title}</h4>
            <p className="text-sm text-text-muted leading-relaxed">{section.content}</p>
            {section.equation && <RenderedEquation tex={section.equation} />}
          </div>
        ))}
      </div>
    </div>
  )
}
