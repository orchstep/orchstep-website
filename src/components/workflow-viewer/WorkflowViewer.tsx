import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { toPng, toBlob } from 'html-to-image'
import { parseWorkflowYaml } from './parser/yaml-to-graph'
import { Toolbar } from './controls/Toolbar'
import { DetailPanel } from './panel/DetailPanel'
import { WorkflowGraph } from './graph/WorkflowGraph'
import { LIGHT_THEME, DARK_THEME } from './theme'
import type { WorkflowViewerProps, GraphNode, Direction, Theme } from './types'

export function WorkflowViewer({
  yaml,
  direction: initialDirection = 'AUTO',
  theme: initialTheme = 'light',
  onNodeClick,
  collapsed: initialCollapsed = false,
  interactive = true,
  className,
}: WorkflowViewerProps) {
  const [direction, setDirection] = useState<Direction>(initialDirection)
  const [theme, setTheme] = useState<Theme>(initialTheme)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [minimapVisible, setMinimapVisible] = useState(false)
  const [collapsedTasks, setCollapsedTasks] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<string | null>(null)
  const [panelMode, setPanelMode] = useState<'sidebar' | 'float'>('float')
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  const graphRef = useRef<{ fitView: () => void; zoomIn: () => void; zoomOut: () => void } | null>(null)

  const parseResult = useMemo(() => parseWorkflowYaml(yaml), [yaml])

  const themeVars = theme === 'dark' ? DARK_THEME : LIGHT_THEME

  // Initialize collapsed state
  useEffect(() => {
    if (initialCollapsed) {
      const taskIds = parseResult.nodes.filter(n => n.type === 'task').map(n => n.id)
      setCollapsedTasks(new Set(taskIds))
    }
  }, [initialCollapsed, parseResult.nodes])

  const handleNodeSelect = useCallback(
    (node: GraphNode | null, clickPos?: { x: number; y: number }) => {
      setSelectedNode(node)
      if (clickPos) setClickPosition(clickPos)
      if (node && onNodeClick) {
        onNodeClick(node)
      }
    },
    [onNodeClick],
  )

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }, [])

  const handleExport = useCallback(async () => {
    const el = document.querySelector('.react-flow') as HTMLElement
    if (!el) return
    try {
      const dataUrl = await toPng(el, {
        backgroundColor: theme === 'dark' ? '#1a1a2e' : '#fafafa',
      })
      const a = document.createElement('a')
      a.download = 'workflow.png'
      a.href = dataUrl
      a.click()
      showToast('Exported!')
    } catch (err) {
      console.error('Export failed:', err)
    }
  }, [theme, showToast])

  const handleCopy = useCallback(async () => {
    const el = document.querySelector('.react-flow') as HTMLElement
    if (!el) return
    try {
      const blob = await toBlob(el, {
        backgroundColor: theme === 'dark' ? '#1a1a2e' : '#fafafa',
      })
      if (blob) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        showToast('Copied!')
      }
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }, [theme, showToast])

  const handleToggleTask = useCallback((taskId: string) => {
    setCollapsedTasks(prev => {
      const next = new Set(prev)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      return next
    })
  }, [])

  const handleCollapseAll = useCallback(() => {
    const taskIds = parseResult.nodes.filter(n => n.type === 'task').map(n => n.id)
    setCollapsedTasks(new Set(taskIds))
  }, [parseResult.nodes])

  const handleExpandAll = useCallback(() => {
    setCollapsedTasks(new Set())
  }, [])

  const allCollapsed = useMemo(() => {
    const taskIds = parseResult.nodes.filter(n => n.type === 'task').map(n => n.id)
    return taskIds.length > 0 && taskIds.every(id => collapsedTasks.has(id))
  }, [parseResult.nodes, collapsedTasks])

  const errors = parseResult.errors.filter((e) => e.severity === 'error')
  const warnings = parseResult.errors.filter((e) => e.severity === 'warning')
  const hasNodes = parseResult.nodes.length > 0

  return (
    <div
      className={className}
      data-theme={theme}
      style={{
        ...themeVars,
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: 'var(--canvas-bg)',
        color: 'var(--text-primary)',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        position: 'relative',
      } as React.CSSProperties}
    >
      {/* Toast notification */}
      {toast && (
        <div
          style={{
            position: 'absolute',
            top: 60,
            left: '50%',
            transform: 'translateX(-50%)',
            background: theme === 'dark' ? '#444' : '#333',
            color: 'white',
            padding: '6px 16px',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
            zIndex: 100,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {toast}
        </div>
      )}

      {/* Error banner */}
      {errors.length > 0 && (
        <div
          style={{
            padding: '8px 16px',
            background: '#fde8e1',
            color: '#8b2500',
            fontSize: 13,
            borderBottom: '1px solid #e76f51',
          }}
        >
          {errors.map((e, i) => (
            <div key={i}>{e.message}</div>
          ))}
        </div>
      )}

      {/* Warning banner */}
      {warnings.length > 0 && (
        <div
          style={{
            padding: '8px 16px',
            background: '#fff3cd',
            color: '#856404',
            fontSize: 13,
            borderBottom: '1px solid #e9c46a',
          }}
        >
          {warnings.map((w, i) => (
            <div key={i}>{w.message}</div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      {interactive && (
        <Toolbar
          direction={direction}
          theme={theme}
          minimapVisible={minimapVisible}
          searchQuery={searchQuery}
          allCollapsed={allCollapsed}
          onDirectionChange={setDirection}
          onThemeChange={setTheme}
          onFitView={() => graphRef.current?.fitView()}
          onZoomIn={() => graphRef.current?.zoomIn()}
          onZoomOut={() => graphRef.current?.zoomOut()}
          onToggleMinimap={() => setMinimapVisible((v) => !v)}
          onSearchChange={setSearchQuery}
          onExport={handleExport}
          onCopy={handleCopy}
          onCollapseAll={handleCollapseAll}
          onExpandAll={handleExpandAll}
        />
      )}

      {/* Graph area */}
      {hasNodes ? (
        <div style={{ flex: 1, position: 'relative' }}>
          <WorkflowGraph
            ref={graphRef}
            nodes={parseResult.nodes}
            edges={parseResult.edges}
            direction={direction}
            theme={theme}
            searchQuery={searchQuery}
            minimapVisible={minimapVisible}
            collapsedTasks={collapsedTasks}
            onNodeSelect={handleNodeSelect}
            onToggleTask={handleToggleTask}
          />
          {selectedNode && (
            <DetailPanel
              node={selectedNode}
              mode={panelMode}
              onClose={() => setSelectedNode(null)}
              onToggleMode={() => setPanelMode(m => m === 'sidebar' ? 'float' : 'sidebar')}
              clickPosition={clickPosition}
            />
          )}
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary, #888)',
            fontSize: 14,
          }}
        >
          {yaml?.trim()
            ? 'No tasks found in workflow'
            : 'Paste an OrchStep YAML to visualize'}
        </div>
      )}
    </div>
  )
}
