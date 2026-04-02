import React from 'react'
import { NodeHandles } from './NodeHandles'
import { GitFork } from 'lucide-react'
import type { GraphNode } from '../../types'

export function ConditionNode({ data, selected }: { data: GraphNode; selected?: boolean }) {
  const color = '#e9c46a'

  return (
    <div
      style={{
        position: 'relative',
        background: 'var(--node-bg, white)',
        border: `1.5px solid ${color}`,
        borderRadius: 6,
        padding: '12px 12px 8px',
        minWidth: 180,
        boxShadow: selected
          ? `var(--shadow), 0 0 0 3px ${color}33`
          : 'var(--shadow)',
      }}
    >
      <NodeHandles />
      <div
        style={{
          position: 'absolute',
          top: -8,
          left: 8,
          background: color,
          color: '#fff',
          fontSize: 9,
          fontWeight: 700,
          padding: '1px 6px',
          borderRadius: 3,
        }}
      >
        IF
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <GitFork size={16} color={color} />
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-primary, #111)' }}>
            {data.label}
          </div>
          {data.metadata.condition && (
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-secondary, #888)',
                marginTop: 2,
                fontFamily: 'monospace',
              }}
            >
              {data.metadata.condition}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
