import React, { useCallback, useRef } from 'react'
import { FolderOpen } from 'lucide-react'
import { NodeHandles } from './NodeHandles'
import { useReactFlow } from '@xyflow/react'
import type { GraphNode } from '../../types'

interface TaskGroupData extends GraphNode {
  collapsed?: boolean
  onToggleCollapse?: () => void
}

const RESIZE_HANDLE_SIZE = 12
const PADDING = 30
const HEADER_HEIGHT = 50
const MAX_EXTRA_PADDING = 60

export function TaskGroupNode({ id, data }: { id: string; data: TaskGroupData }) {
  const collapsed = data.collapsed
  const onToggleCollapse = data.onToggleCollapse
  const stepCount = data.metadata.stepCount ?? 0
  const { setNodes, getNodes } = useReactFlow()
  const resizing = useRef<{
    startX: number; startY: number
    startW: number; startH: number
    minW: number; minH: number
    maxW: number; maxH: number
  } | null>(null)

  const onResizeStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    const nodeEl = document.querySelector(`[data-id="${id}"]`) as HTMLElement
    if (!nodeEl) return

    const rect = nodeEl.getBoundingClientRect()
    const zoom = rect.width / (parseFloat(nodeEl.style.width) || rect.width)

    const allNodes = getNodes()
    const children = allNodes.filter((n: any) => n.parentId === id)

    // Min size: must contain all children
    let minW = 200
    let minH = HEADER_HEIGHT + PADDING * 2

    if (children.length > 0) {
      const maxChildRight = Math.max(...children.map((c: any) => {
        const w = c.measured?.width ?? c.style?.width ?? 240
        return c.position.x + w
      }))
      const maxChildBottom = Math.max(...children.map((c: any) => {
        const h = c.measured?.height ?? c.style?.height ?? 60
        return c.position.y + h
      }))
      minW = Math.max(minW, maxChildRight + PADDING)
      minH = Math.max(minH, maxChildBottom + PADDING)
    }

    // Max size: children bounds + limited extra padding (prevent swallowing other tasks)
    const maxW = minW + MAX_EXTRA_PADDING
    const maxH = minH + MAX_EXTRA_PADDING

    resizing.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW: parseFloat(nodeEl.style.width) || rect.width / zoom,
      startH: parseFloat(nodeEl.style.height) || rect.height / zoom,
      minW, minH, maxW, maxH,
    }

    const onMouseMove = (ev: MouseEvent) => {
      if (!resizing.current) return
      const dx = (ev.clientX - resizing.current.startX) / zoom
      const dy = (ev.clientY - resizing.current.startY) / zoom
      const newW = Math.min(resizing.current.maxW, Math.max(resizing.current.minW, resizing.current.startW + dx))
      const newH = Math.min(resizing.current.maxH, Math.max(resizing.current.minH, resizing.current.startH + dy))

      setNodes(nodes => nodes.map(n =>
        n.id === id ? { ...n, style: { ...n.style, width: newW, height: newH } } : n
      ))
    }

    const onMouseUp = () => {
      resizing.current = null
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [id, setNodes, getNodes])

  return (
    <div
      style={{
        border: '2px solid var(--task-border, #333)',
        borderRadius: 8,
        background: 'var(--node-bg, white)',
        width: '100%',
        height: '100%',
        boxShadow: 'var(--shadow)',
        position: 'relative',
      }}
    >
      <NodeHandles />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 10px',
          background: 'var(--task-header-bg, #f0f0f0)',
          borderBottom: '1px solid var(--panel-border, #ddd)',
          borderRadius: '6px 6px 0 0',
          cursor: 'pointer',
        }}
        onClick={onToggleCollapse}
      >
        <FolderOpen size={14} color="#333" />
        <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary, #666)' }}>
          Task
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary, #111)', flex: 1 }}>
          {data.label}
        </span>
        {collapsed && (
          <span style={{ fontSize: 10, color: 'var(--text-secondary, #888)' }}>
            {stepCount} steps
          </span>
        )}
        {onToggleCollapse && (
          <span style={{ fontSize: 12, color: '#999' }}>
            {collapsed ? '\u25b8' : '\u25be'}
          </span>
        )}
      </div>
      <div
        className="nodrag"
        onMouseDown={onResizeStart}
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: RESIZE_HANDLE_SIZE,
          height: RESIZE_HANDLE_SIZE,
          cursor: 'nwse-resize',
          borderRight: '2px solid #999',
          borderBottom: '2px solid #999',
          borderRadius: '0 0 6px 0',
          opacity: 0.4,
        }}
        title="Drag to resize"
      />
    </div>
  )
}
