import { useState, useRef, useEffect, useCallback } from 'react'
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { python } from '@codemirror/lang-python'
import { oneDark } from '@codemirror/theme-one-dark'
import { defaultKeymap, indentWithTab } from '@codemirror/commands'
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching } from '@codemirror/language'
import { banditPythonCode } from '../../content/banditPythonCode'

type AlgorithmType = 'epsilon-greedy' | 'ucb' | 'thompson-sampling'

interface Props {
  algorithmType: AlgorithmType
  onAlgorithmChange: (type: AlgorithmType) => void
}

// Pyodide singleton — loaded once, reused across runs
let pyodideInstance: any = null
let pyodideLoadPromise: Promise<any> | null = null

async function loadPyodideRuntime(): Promise<any> {
  if (pyodideInstance) return pyodideInstance
  if (pyodideLoadPromise) return pyodideLoadPromise

  pyodideLoadPromise = (async () => {
    if (!(window as any).loadPyodide) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js'
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('Failed to load Pyodide'))
        document.head.appendChild(script)
      })
    }
    const pyodide = await (window as any).loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/',
    })
    await pyodide.loadPackage('numpy')
    pyodideInstance = pyodide
    return pyodide
  })()

  return pyodideLoadPromise
}

export function BanditPythonTab({ algorithmType, onAlgorithmChange }: Props) {
  const entry: PythonCodeEntry = banditPythonCode[algorithmType]
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [isLoadingPyodide, setIsLoadingPyodide] = useState(false)
  const [copied, setCopied] = useState(false)
  const [pyodideReady, setPyodideReady] = useState(!!pyodideInstance)

  // CodeMirror refs
  const editorContainerRef = useRef<HTMLDivElement>(null)
  const editorViewRef = useRef<EditorView | null>(null)
  const codeRef = useRef(entry.code)

  // Initialize CodeMirror
  useEffect(() => {
    if (!editorContainerRef.current) return

    // Destroy previous editor if exists
    if (editorViewRef.current) {
      editorViewRef.current.destroy()
    }

    const state = EditorState.create({
      doc: entry.code,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        bracketMatching(),
        python(),
        oneDark,
        syntaxHighlighting(defaultHighlightStyle),
        keymap.of([...defaultKeymap, indentWithTab]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            codeRef.current = update.state.doc.toString()
          }
        }),
        EditorView.theme({
          '&': {
            fontSize: '13px',
            borderRadius: '0 0 12px 12px',
          },
          '.cm-content': {
            fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", "Cascadia Code", Consolas, monospace',
            padding: '12px 0',
          },
          '.cm-gutters': {
            borderRight: '1px solid rgba(255,255,255,0.06)',
            backgroundColor: 'transparent',
          },
          '.cm-lineNumbers .cm-gutterElement': {
            padding: '0 8px 0 12px',
            minWidth: '32px',
            fontSize: '11px',
            color: 'rgba(255,255,255,0.25)',
          },
          '.cm-activeLine': {
            backgroundColor: 'rgba(255,255,255,0.03)',
          },
          '.cm-activeLineGutter': {
            backgroundColor: 'rgba(255,255,255,0.03)',
          },
          '&.cm-focused': {
            outline: 'none',
          },
          '.cm-scroller': {
            overflow: 'auto',
          },
        }),
      ],
    })

    const view = new EditorView({
      state,
      parent: editorContainerRef.current,
    })

    editorViewRef.current = view
    codeRef.current = entry.code

    return () => {
      view.destroy()
    }
  }, [algorithmType]) // eslint-disable-line react-hooks/exhaustive-deps

  // Clear output when algorithm changes
  useEffect(() => {
    setOutput('')
  }, [algorithmType])

  const handleCopy = () => {
    navigator.clipboard.writeText(codeRef.current).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleDownload = () => {
    const blob = new Blob([codeRef.current], { type: 'text/x-python' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bandit_${entry.id.replace(/-/g, '_')}.py`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleReset = () => {
    if (editorViewRef.current) {
      editorViewRef.current.dispatch({
        changes: {
          from: 0,
          to: editorViewRef.current.state.doc.length,
          insert: entry.code,
        },
      })
    }
    codeRef.current = entry.code
    setOutput('')
  }

  const handleRun = useCallback(async () => {
    setIsRunning(true)
    setOutput('')

    try {
      if (!pyodideInstance) {
        setIsLoadingPyodide(true)
        setOutput('⏳ Loading Python runtime (first time only, ~10s)...')
        await loadPyodideRuntime()
        setIsLoadingPyodide(false)
        setPyodideReady(true)
      }

      // Capture stdout/stderr
      pyodideInstance.runPython(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = StringIO()
`)

      try {
        pyodideInstance.runPython(codeRef.current)
      } catch (pyErr: any) {
        const stderr = pyodideInstance.runPython('sys.stderr.getvalue()')
        setOutput('❌ ' + (stderr || pyErr.message || 'Python error'))
        setIsRunning(false)
        return
      }

      const stdout = pyodideInstance.runPython('sys.stdout.getvalue()')
      const stderr = pyodideInstance.runPython('sys.stderr.getvalue()')
      setOutput(stdout + (stderr ? '\n' + stderr : '') || '(no output — add print() statements)')
    } catch (err: any) {
      setOutput('❌ Error: ' + (err.message || 'Unknown error'))
      setIsLoadingPyodide(false)
    } finally {
      setIsRunning(false)
    }
  }, [])

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

      {/* Code editor */}
      <div className="bg-[#282c34] rounded-xl border border-surface-lighter overflow-hidden shadow-lg">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#21252b] border-b border-[#181a1f]">
          <div className="flex items-center gap-2">
            {/* Traffic light dots */}
            <div className="flex gap-1.5 mr-2">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <div className="w-3 h-3 rounded-full bg-[#28c840]" />
            </div>
            <span className="text-sm font-semibold text-[#abb2bf]">{entry.name}</span>
            <span className="text-xs text-[#636d83]">python</span>
            {pyodideReady && (
              <span className="text-[10px] text-[#98c379] bg-[#98c379]/10 px-1.5 py-0.5 rounded font-medium">
                Runtime ready
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="text-xs font-medium px-3 py-1.5 rounded-md border border-[#3e4451] cursor-pointer transition-colors bg-transparent text-[#636d83] hover:text-[#abb2bf] hover:border-[#528bff]"
              title="Reset to original code"
            >
              ↺ Reset
            </button>
            <button
              onClick={handleCopy}
              className="text-xs font-medium px-3 py-1.5 rounded-md border border-[#3e4451] cursor-pointer transition-colors bg-transparent text-[#636d83] hover:text-[#abb2bf] hover:border-[#528bff]"
            >
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
            <button
              onClick={handleDownload}
              className="text-xs font-medium px-3 py-1.5 rounded-md border border-[#3e4451] cursor-pointer transition-colors bg-transparent text-[#636d83] hover:text-[#abb2bf] hover:border-[#528bff]"
              title="Download as .py file"
            >
              ⬇ Download
            </button>
            <button
              onClick={handleRun}
              disabled={isRunning}
              className={`text-xs font-bold px-5 py-1.5 rounded-md border-0 cursor-pointer transition-all ${
                isRunning
                  ? 'bg-[#98c379]/30 text-[#98c379]/50 cursor-not-allowed'
                  : 'bg-[#98c379] text-[#282c34] hover:bg-[#7ec05a] shadow-md shadow-[#98c379]/20'
              }`}
            >
              {isRunning ? (isLoadingPyodide ? '⏳ Loading...' : '⏳ Running...') : '▶ Run'}
            </button>
          </div>
        </div>

        {/* CodeMirror editor */}
        <div ref={editorContainerRef} className="max-h-[500px] overflow-auto" />
      </div>

      {/* Output */}
      {output && (
        <div className="bg-[#1e1e1e] rounded-xl border border-surface-lighter overflow-hidden shadow-lg">
          <div className="px-4 py-2 bg-[#252526] border-b border-[#1e1e1e] flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#636d83] uppercase tracking-widest">Output</span>
          </div>
          <pre className="p-4 text-sm font-mono leading-relaxed m-0 whitespace-pre-wrap" style={{
            fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Consolas, monospace',
            color: output.startsWith('❌') ? '#e06c75' : output.startsWith('⏳') ? '#e5c07b' : '#98c379',
          }}>
            {output}
          </pre>
        </div>
      )}

    </div>
  )
}
