import React from 'react'
import { NodeHandles } from './NodeHandles'
import { RefreshCw } from 'lucide-react'
import type { GraphNode } from '../../types'

export function LoopNode({ data, selected }: { data: GraphNode; selected?: boolean }) {
  const color = '#9b59b6'
  const loop = data.metadata.loopConfig

  let loopInfo = ''
  if (loop) {
    if (loop.items) loopInfo = `items: ${loop.items}`
    else if (loop.count != null) loopInfo = `count: ${loop.count}`
    else if (loop.range) loopInfo = `range: ${loop.range[0]}..${loop.range[1]}`
  }

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
        <RefreshCw size={16} color={color} />
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-primary, #111)' }}>
            {data.label}
          </div>
          {loopInfo && (
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-secondary, #888)',
                marginTop: 2,
                fontFamily: 'monospace',
              }}
            >
              {loopInfo}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
