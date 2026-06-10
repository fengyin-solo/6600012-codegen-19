import { useState, useCallback, useRef } from 'react'
import { useSimStore } from '../store/simulation'
import type { ObserverNote, SimulationParams, SimMode } from '../types'

const MODE_LABELS: Record<SimMode, string> = {
  gravity: '重力吸引',
  collision: '弹性碰撞',
  fluid: '流体模拟',
  vortex: '漩涡旋转',
}

function captureCanvasScreenshot(): string | null {
  const canvas = document.querySelector('canvas')
  if (!canvas) return null
  try {
    return canvas.toDataURL('image/png')
  } catch {
    return null
  }
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function SnapshotParams({ params, mode }: { params: SimulationParams; mode: SimMode }) {
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      <span className="px-1.5 py-0.5 bg-blue-900/60 text-blue-300 text-[10px] rounded">
        {MODE_LABELS[mode]}
      </span>
      <span className="px-1.5 py-0.5 bg-gray-700/60 text-gray-300 text-[10px] rounded">
        G={params.gravity.toFixed(1)}
      </span>
      <span className="px-1.5 py-0.5 bg-gray-700/60 text-gray-300 text-[10px] rounded">
        D={params.damping.toFixed(3)}
      </span>
      <span className="px-1.5 py-0.5 bg-gray-700/60 text-gray-300 text-[10px] rounded">
        B={params.bounce.toFixed(2)}
      </span>
      <span className="px-1.5 py-0.5 bg-gray-700/60 text-gray-300 text-[10px] rounded">
        A={params.attractorStrength.toFixed(1)}
      </span>
      <span className="px-1.5 py-0.5 bg-gray-700/60 text-gray-300 text-[10px] rounded">
        N={params.particleCount}
      </span>
    </div>
  )
}

export default function ObserverNotes() {
  const notes = useSimStore((s) => s.notes)
  const addNote = useSimStore((s) => s.addNote)
  const updateNote = useSimStore((s) => s.updateNote)
  const deleteNote = useSimStore((s) => s.deleteNote)
  const mode = useSimStore((s) => s.mode)

  const [draft, setDraft] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [previewId, setPreviewId] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const getCurrentSimParams = useCallback((): SimulationParams => {
    const s = useSimStore.getState()
    return {
      mode: s.mode,
      particleCount: s.particleCount,
      gravity: s.gravity,
      damping: s.damping,
      bounce: s.bounce,
      attractorStrength: s.attractorStrength,
      slowMotion: s.slowMotion,
      paused: s.paused,
    }
  }, [])

  const handleAddNote = useCallback(() => {
    if (!draft.trim()) return
    const screenshot = captureCanvasScreenshot()
    const note: ObserverNote = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      content: draft.trim(),
      screenshot,
      simMode: mode,
      simParams: getCurrentSimParams(),
    }
    addNote(note)
    setDraft('')
    textareaRef.current?.focus()
  }, [draft, mode, addNote, getCurrentSimParams])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        handleAddNote()
      }
    },
    [handleAddNote],
  )

  const startEditing = useCallback((note: ObserverNote) => {
    setEditingId(note.id)
    setEditContent(note.content)
  }, [])

  const saveEditing = useCallback(
    (id: string) => {
      if (editContent.trim()) {
        updateNote(id, editContent.trim())
      }
      setEditingId(null)
      setEditContent('')
    },
    [editContent, updateNote],
  )

  const cancelEditing = useCallback(() => {
    setEditingId(null)
    setEditContent('')
  }, [])

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }, [])

  const exportNotes = useCallback(() => {
    if (notes.length === 0) return
    const lines = notes.map((n) => {
      const header = `[${formatTime(n.timestamp)}] 模式: ${MODE_LABELS[n.simMode]}`
      const params = `  参数: G=${n.simParams.gravity} D=${n.simParams.damping} B=${n.simParams.bounce} A=${n.simParams.attractorStrength} N=${n.simParams.particleCount}`
      const content = `  ${n.content}`
      const hasScreenshot = n.screenshot ? '  [含截图]' : ''
      return `${header}\n${params}\n${content}${hasScreenshot}`
    })
    const text = `实验观察记录\n${'='.repeat(40)}\n\n${lines.join('\n\n')}`
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `观察记录_${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }, [notes])

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-white">📝 观察者笔记</h3>
          <button
            onClick={exportNotes}
            disabled={notes.length === 0}
            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300 text-[10px] rounded"
          >
            导出记录
          </button>
        </div>
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="记录观察结论... (Ctrl+Enter 提交，自动截图)"
          rows={3}
          className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-xs text-gray-200 placeholder-gray-500 resize-none focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={handleAddNote}
          disabled={!draft.trim()}
          className="mt-1.5 w-full py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs rounded font-medium"
        >
          📸 截图并记录
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {notes.length === 0 && (
          <div className="text-center text-gray-500 text-xs py-8">
            暂无观察记录<br />
            <span className="text-[10px]">在模拟过程中随时记录实验观察</span>
          </div>
        )}
        {notes.map((note) => (
          <div
            key={note.id}
            className="bg-gray-800/70 rounded border border-gray-700 overflow-hidden"
          >
            <div
              className="flex items-start gap-2 p-2 cursor-pointer hover:bg-gray-750"
              onClick={() => toggleExpand(note.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 whitespace-nowrap">
                    {formatTime(note.timestamp)}
                  </span>
                  <span className="px-1.5 py-0.5 bg-blue-900/50 text-blue-300 text-[10px] rounded">
                    {MODE_LABELS[note.simMode]}
                  </span>
                  {note.screenshot && (
                    <span className="text-[10px] text-green-400">📸</span>
                  )}
                </div>
                {editingId === note.id ? (
                  <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                      className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-gray-200 resize-none focus:outline-none focus:border-blue-500"
                    />
                    <div className="flex gap-1 mt-1">
                      <button
                        onClick={() => saveEditing(note.id)}
                        className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] rounded"
                      >
                        保存
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="px-2 py-0.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-[10px] rounded"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-0.5 text-xs text-gray-200 whitespace-pre-wrap break-words">
                    {note.content}
                  </p>
                )}
              </div>
              {editingId !== note.id && (
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      startEditing(note)
                    }}
                    className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white text-xs"
                    title="编辑"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteNote(note.id)
                    }}
                    className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-red-400 text-xs"
                    title="删除"
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>

            {expandedId === note.id && (
              <div className="border-t border-gray-700 px-2 pb-2">
                {note.screenshot && (
                  <div className="mt-2">
                    {previewId === note.id ? (
                      <div
                        className="cursor-pointer"
                        onClick={() => setPreviewId(null)}
                      >
                        <img
                          src={note.screenshot}
                          alt="截图"
                          className="w-full rounded border border-gray-600"
                        />
                        <p className="text-[10px] text-gray-500 mt-0.5 text-center">点击收起</p>
                      </div>
                    ) : (
                      <div
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          setPreviewId(note.id)
                        }}
                      >
                        <img
                          src={note.screenshot}
                          alt="截图"
                          className="w-24 h-16 object-cover rounded border border-gray-600"
                        />
                        <p className="text-[10px] text-gray-500 mt-0.5">点击查看大图</p>
                      </div>
                    )}
                  </div>
                )}
                <SnapshotParams params={note.simParams} mode={note.simMode} />
              </div>
            )}
          </div>
        ))}
      </div>

      {notes.length > 0 && (
        <div className="p-2 border-t border-gray-700 text-center">
          <span className="text-[10px] text-gray-500">
            共 {notes.length} 条观察记录
          </span>
        </div>
      )}

      {previewId && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8"
          onClick={() => setPreviewId(null)}
        >
          <div className="max-w-4xl max-h-full overflow-auto">
            {(() => {
              const note = notes.find((n) => n.id === previewId)
              if (!note?.screenshot) return null
              return (
                <img
                  src={note.screenshot}
                  alt="截图预览"
                  className="max-w-full rounded shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                />
              )
            })()}
          </div>
          <p className="absolute bottom-4 text-gray-400 text-xs">点击空白区域关闭预览</p>
        </div>
      )}
    </div>
  )
}
