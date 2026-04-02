import React from 'react'
import { getBezierPath, BaseEdge, EdgeLabelRenderer } from '@xyflow/react'
import { EDGE_COLORS, EDGE_STYLES } from '../../theme'
import type { EdgeType } from '../../types'

interface CustomEdgeProps {
  id: string
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
  sourcePosition: any
  targetPosition: any
  data?: { edgeType?: EdgeType; label?: string; color?: string }
  markerEnd?: string
}

const LABEL_COLORS: Record<string, { bg: string; fg: string }> = {
  'conditional-true': { bg: '#d4edda', fg: '#155724' },
  'conditional-false': { bg: '#fde8e1', fg: '#8b2500' },
  'conditional-elif': { bg: '#fff3cd', fg: '#856404' },
  'error-path': { bg: '#fde8e1', fg: '#8b2500' },
  'cleanup-path': { bg: '#e9ecef', fg: '#495057' },
  'loop-body': { bg: '#f3e5f5', fg: '#6a1b9a' },
  'task-call': { bg: '#e9ecef', fg: '#333' },
  'module-call': { bg: '#d6eaf8', fg: '#1a5276' },
}

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: CustomEdgeProps) {
  const edgeType = data?.edgeType ?? 'sequential'
  const color = data?.color ?? EDGE_COLORS[edgeType] ?? '#999'
  const styleType = EDGE_STYLES[edgeType] ?? 'solid'

  let strokeDasharray: string | undefined
  if (styleType === 'dashed') strokeDasharray = '6 3'
  else if (styleType === 'dotted') strokeDasharray = '2 3'

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  })

  const label = data?.label
  const labelStyle = LABEL_COLORS[edgeType]

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{ stroke: color, strokeWidth: 2, strokeDasharray }}
      />
      {label && labelStyle && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
              fontSize: 10,
              fontWeight: 600,
              background: labelStyle.bg,
              color: labelStyle.fg,
              padding: '1px 6px',
              borderRadius: 8,
              whiteSpace: 'nowrap',
            }}
            className="nodrag nopan"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
