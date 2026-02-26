import { useState, useEffect, useRef, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import katex from 'katex'

/* ══════════════════════════════════════════
   SHARED GUIDE PAGE PRIMITIVES
   Used by guide pages, learn chapters, etc.
   ══════════════════════════════════════════ */

export function Eq({ tex, inline }: { tex: string; inline?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (ref.current) {
      katex.render(tex, ref.current, { throwOnError: false, displayMode: !inline })
    }
  }, [tex, inline])
  return <span ref={ref} className={inline ? 'inline-block align-middle mx-0.5' : 'block my-3 overflow-x-auto'} />
}

export function Accordion({ title, number, defaultOpen, children }: {
  title: string; number: number; defaultOpen?: boolean; children: ReactNode
}) {
  const [open, setOpen] = useState(!!defaultOpen)
  const bodyRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number | undefined>(defaultOpen ? undefined : 0)

  useEffect(() => {
    if (!bodyRef.current) return
    if (open) {
      setHeight(bodyRef.current.scrollHeight)
      const id = setTimeout(() => setHeight(undefined), 300)
      return () => clearTimeout(id)
    } else {
      setHeight(bodyRef.current.scrollHeight)
      requestAnimationFrame(() => setHeight(0))
    }
  }, [open])

  return (
    <div className="bg-surface-light rounded-xl border border-surface-lighter overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-6 py-4 cursor-pointer bg-transparent border-0 text-left hover:bg-surface-lighter/30 transition-colors"
      >
        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary-light text-sm font-bold flex items-center justify-center">
          {number}
        </span>
        <span className="text-lg font-bold text-text flex-1">{title}</span>
        <span className={`text-text-muted transition-transform duration-300 text-xl ${open ? 'rotate-180' : ''}`}>
          &#9662;
        </span>
      </button>
      <div
        ref={bodyRef}
        style={{ height: height !== undefined ? `${height}px` : 'auto', overflow: 'hidden', transition: 'height 0.3s ease' }}
      >
        <div className="px-6 pb-6 pt-2">{children}</div>
      </div>
    </div>
  )
}

export function Callout({ type, title, children }: {
  type: 'insight' | 'think' | 'try'; title?: string; children: ReactNode
}) {
  const styles = {
    insight: 'border-l-4 border-accent-green bg-accent-green/5',
    think: 'border-l-4 border-accent-yellow bg-accent-yellow/5',
    try: 'border-l-4 border-primary bg-primary/5',
  }
  const labels = { insight: 'Key Insight', think: 'Think About It', try: 'Try It' }
  const labelColors = { insight: 'text-accent-green', think: 'text-accent-yellow', try: 'text-primary-light' }

  return (
    <div className={`${styles[type]} rounded-r-lg p-4 my-4`}>
      <p className={`text-xs font-bold uppercase tracking-wider ${labelColors[type]} mb-1`}>
        {title ?? labels[type]}
      </p>
      <div className="text-sm text-text leading-relaxed">{children}</div>
    </div>
  )
}

export function StepBox({ steps }: { steps: { label: string; detail: string; type: 'explore' | 'exploit' | 'neutral' }[] }) {
  const colors = {
    explore: 'border-accent-blue bg-accent-blue/10',
    exploit: 'border-accent-green bg-accent-green/10',
    neutral: 'border-surface-lighter bg-surface',
  }
  const badges = {
    explore: <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-accent-blue/20 text-accent-blue">Explore</span>,
    exploit: <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-accent-green/20 text-accent-green">Exploit</span>,
    neutral: null,
  }
  return (
    <div className="flex flex-col gap-2 my-4">
      {steps.map((s, i) => (
        <div key={i} className={`border-l-4 ${colors[s.type]} rounded-r-lg p-3`}>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-bold text-text">Step {i + 1}: {s.label}</span>
            {badges[s.type]}
          </div>
          <p className="text-xs text-text-muted leading-relaxed m-0">{s.detail}</p>
        </div>
      ))}
    </div>
  )
}

export function SimButton({ label, to, className }: { label?: string; to?: string; className?: string }) {
  return (
    <Link
      to={to ?? '/'}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium no-underline hover:bg-primary-dark transition-colors ${className ?? ''}`}
    >
      <span>{'\uD83D\uDE80'}</span> {label ?? 'Try it in the Simulator'}
    </Link>
  )
}

/** Navigation between chapters */
export function ChapterNav({ prev, next }: {
  prev?: { path: string; label: string }
  next?: { path: string; label: string }
}) {
  return (
    <div className="flex justify-between items-center mt-10 pt-6 border-t border-surface-lighter">
      {prev ? (
        <Link to={prev.path} className="text-sm text-primary-light hover:underline no-underline">
          &larr; {prev.label}
        </Link>
      ) : <div />}
      <Link to="/learn" className="text-xs text-text-muted hover:text-text no-underline">
        All Chapters
      </Link>
      {next ? (
        <Link to={next.path} className="text-sm text-primary-light hover:underline no-underline">
          {next.label} &rarr;
        </Link>
      ) : <div />}
    </div>
  )
}
