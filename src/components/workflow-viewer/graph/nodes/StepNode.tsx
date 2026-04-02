import React from 'react'
import { getNodeColor, getNodeIcon } from '../../theme'
import { NodeHandles } from './NodeHandles'
import type { GraphNode } from '../../types'

export function StepNode({ data, selected }: { data: GraphNode; selected?: boolean }) {
  const color = getNodeColor(data.type, data.metadata.func)
  const Icon = getNodeIcon(data.type, data.metadata.func)
  const typeLabel = data.metadata.func ?? 'step'

  return (
    <div
      style={{
        background: 'var(--node-bg, white)',
        border: `1.5px solid ${color}`,
        borderRadius: 6,
        padding: '8px 12px',
        minWidth: 180,
        boxShadow: selected
          ? `var(--shadow), 0 0 0 3px ${color}33`
          : 'var(--shadow)',
        cursor: 'pointer',
      }}
    >
      <NodeHandles />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon size={16} color={color} />
        <div>
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              textTransform: 'uppercase',
              color: color,
              letterSpacing: '0.05em',
            }}
          >
            {typeLabel}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-primary, #111)' }}>
            {data.label}
          </div>
        </div>
      </div>
    </div>
  )
}
