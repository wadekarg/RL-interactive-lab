import { useState } from 'react'
import { banditPythonCode, type PythonCodeEntry } from '../../content/banditPythonCode'

type AlgorithmType = 'epsilon-greedy' | 'ucb' | 'thompson-sampling'

interface Props {
  algorithmType: AlgorithmType
  onAlgorithmChange: (type: AlgorithmType) => void
}

export function BanditPythonTab({ algorithmType, onAlgorithmChange }: Props) {
  const [copied, setCopied] = useState(false)
  const entry: PythonCodeEntry = banditPythonCode[algorithmType]

  const handleCopy = () => {
    navigator.clipboard.writeText(entry.code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="space-y-6">

      {/* Algorithm selector */}
      <div>
        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
          Select Algorithm
        </h3>
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(banditPythonCode) as AlgorithmType[]).map((type) => (
            <button
              key={type}
              onClick={() => onAlgorithmChange(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border-0 cursor-pointer transition-colors ${
                algorithmType === type
                  ? 'bg-primary text-white'
                  : 'bg-surface text-text-muted hover:text-text hover:bg-surface-lighter'
              }`}
            >
              {banditPythonCode[type].name}
            </button>
          ))}
        </div>
      </div>

      {/* Code block */}
      <div className="bg-surface rounded-xl border border-surface-lighter overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-surface-light border-b border-surface-lighter">
          <div className="flex items-center gap-2">
            <span className="text-base">🐍</span>
            <span className="text-sm font-semibold text-text">{entry.name}</span>
            <span className="text-xs text-text-muted">— Python Implementation</span>
          </div>
          <button
            onClick={handleCopy}
            className="text-xs font-medium px-3 py-1 rounded-md border-0 cursor-pointer transition-colors bg-surface-lighter text-text-muted hover:text-text hover:bg-primary/20"
          >
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>
        <pre className="p-4 overflow-x-auto text-sm leading-relaxed m-0">
          <code className="text-text font-mono whitespace-pre">{entry.code}</code>
        </pre>
      </div>

      {/* How it works */}
      <div className="bg-surface-light rounded-xl border border-surface-lighter p-5">
        <h3 className="text-sm font-bold text-primary-light uppercase tracking-wider mb-3">
          How It Works
        </h3>
        <div className="space-y-3">
          {entry.explanations.map((exp, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className="text-xs font-mono text-accent-yellow bg-accent-yellow/10 px-2 py-0.5 rounded whitespace-nowrap mt-0.5">
                {exp.lines}
              </span>
              <p className="text-sm text-text-muted leading-relaxed m-0">{exp.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Try it yourself */}
      <div className="bg-surface-light rounded-xl border border-surface-lighter p-5">
        <h3 className="text-sm font-bold text-accent-green uppercase tracking-wider mb-2">
          Try It Yourself
        </h3>
        <p className="text-sm text-text-muted mb-3">
          Copy the code above, save it as a <code className="text-xs bg-surface px-1.5 py-0.5 rounded text-primary-light">.py</code> file, and run:
        </p>
        <div className="bg-surface rounded-lg p-3 font-mono text-xs text-text">
          {entry.runInstructions}
        </div>
      </div>
    </div>
  )
}
