import React from 'react'
import { NodeHandles } from './NodeHandles'
import { AlertTriangle, Shield } from 'lucide-react'
import type { GraphNode } from '../../types'

export function ErrorHandlerNode({ data, selected }: { data: GraphNode; selected?: boolean }) {
  const isCatch = data.id.includes('.catch_')
  const color = isCatch ? '#e76f51' : '#6c757d'
  const Icon = isCatch ? AlertTriangle : Shield
  const typeLabel = isCatch ? 'CATCH' : 'FINALLY'

  return (
    <div
      style={{
        background: 'var(--node-bg, white)',
        border: `1.5px dashed ${color}`,
        borderRadius: 6,
        padding: '8px 12px',
        minWidth: 180,
        boxShadow: selected
          ? `var(--shadow), 0 0 0 3px ${color}33`
          : 'var(--shadow)',
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
