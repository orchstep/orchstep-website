import React, { useState } from 'react'
import { X, ChevronDown, ChevronRight, PanelRightClose, MessageSquare } from 'lucide-react'
import { getNodeColor, getNodeIcon } from '../theme'
import type { GraphNode } from '../types'

export type PanelMode = 'sidebar' | 'float'

interface DetailPanelProps {
  node: GraphNode
  mode: PanelMode
  onClose: () => void
  onToggleMode: () => void
  /** Position hint for float mode (absolute px from React Flow viewport) */
  clickPosition?: { x: number; y: number }
}

function Section({
  title,
  collapsible,
  defaultCollapsed,
  children,
}: {
  title: string
  collapsible?: boolean
  defaultCollapsed?: boolean
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed ?? false)

  return (
    <div style={{ borderBottom: '1px solid var(--panel-border, #e0e0e0)', padding: '10px 16px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          cursor: collapsible ? 'pointer' : 'default',
          userSelect: 'none',
        }}
        onClick={collapsible ? () => setCollapsed(!collapsed) : undefined}
      >
        {collapsible &&
          (collapsed ? <ChevronRight size={14} color="var(--text-secondary, #888)" /> : <ChevronDown size={14} color="var(--text-secondary, #888)" />)}
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary, #888)', letterSpacing: '0.05em' }}>
          {title}
        </span>
      </div>
      {!collapsed && <div style={{ marginTop: 6 }}>{children}</div>}
    </div>
  )
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 4, fontSize: 13 }}>
      <span style={{ color: 'var(--text-secondary, #888)', minWidth: 80, flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'var(--text-primary, #111)', wordBreak: 'break-word' }}>{String(value)}</span>
    </div>
  )
}

function KeyValueList({ record }: { record: Record<string, unknown> }) {
  return (
    <div>
      {Object.entries(record).map(([k, v]) => (
        <KV key={k} label={k} value={JSON.stringify(v)} />
      ))}
    </div>
  )
}

function PanelContent({ node }: { node: GraphNode }) {
  const m = node.metadata

  return (
    <>
      {m.description && (
        <Section title="Description">
          <div style={{ fontSize: 13, color: 'var(--text-primary, #111)' }}>{m.description}</div>
        </Section>
      )}

      {m.command && (
        <Section title="Command">
          <pre style={{ fontSize: 12, fontFamily: 'monospace', background: 'var(--canvas-bg, #fafafa)', padding: 8, borderRadius: 4, overflow: 'auto', margin: 0, color: 'var(--text-primary, #111)' }}>
            {m.command}
          </pre>
        </Section>
      )}

      {m.condition && (
        <Section title="Condition">
          <code style={{ fontSize: 12, color: 'var(--text-primary, #111)' }}>{m.condition}</code>
        </Section>
      )}

      {m.variables && Object.keys(m.variables).length > 0 && (
        <Section title="Variables" collapsible defaultCollapsed={false}>
          <KeyValueList record={m.variables} />
        </Section>
      )}

      {m.with && Object.keys(m.with).length > 0 && (
        <Section title="Parameters" collapsible defaultCollapsed={false}>
          <KeyValueList record={m.with} />
        </Section>
      )}

      {m.outputs && Object.keys(m.outputs).length > 0 && (
        <Section title="Outputs" collapsible defaultCollapsed={false}>
          <KeyValueList record={m.outputs} />
        </Section>
      )}

      {(m.timeout || m.retry) && (
        <Section title="Resilience">
          {m.timeout && <KV label="Timeout" value={m.timeout} />}
          {m.totalTimeout && <KV label="Total Timeout" value={m.totalTimeout} />}
          {m.retry && (
            <>
              <KV label="Max Attempts" value={m.retry.maxAttempts} />
              {m.retry.interval && <KV label="Interval" value={m.retry.interval} />}
              {m.retry.backoffRate && <KV label="Backoff Rate" value={m.retry.backoffRate} />}
              {m.retry.maxDelay && <KV label="Max Delay" value={m.retry.maxDelay} />}
              {m.retry.jitter != null && <KV label="Jitter" value={m.retry.jitter} />}
              {m.retry.when && <KV label="When" value={m.retry.when} />}
            </>
          )}
        </Section>
      )}

      {m.loopConfig && (
        <Section title="Loop Config">
          {m.loopConfig.items && <KV label="Items" value={m.loopConfig.items} />}
          {m.loopConfig.count != null && <KV label="Count" value={m.loopConfig.count} />}
          {m.loopConfig.range && <KV label="Range" value={`${m.loopConfig.range[0]}..${m.loopConfig.range[1]}`} />}
          {m.loopConfig.as && <KV label="As" value={m.loopConfig.as} />}
          {m.loopConfig.until && <KV label="Until" value={m.loopConfig.until} />}
          {m.loopConfig.delay && <KV label="Delay" value={m.loopConfig.delay} />}
          {m.loopConfig.onError && <KV label="On Error" value={m.loopConfig.onError} />}
        </Section>
      )}

      {(m.catch || m.finally || m.onError) && (
        <Section title="Error Handling">
          {m.onError && <KV label="On Error" value={m.onError} />}
          {m.catch && <KV label="Has Catch" value="yes" />}
          {m.finally && <KV label="Has Finally" value="yes" />}
        </Section>
      )}

      {(m.moduleName || m.moduleSource) && (
        <Section title="Module">
          {m.moduleName && <KV label="Name" value={m.moduleName} />}
          {m.moduleSource && <KV label="Source" value={m.moduleSource} />}
        </Section>
      )}

      {m.taskRef && (
        <Section title="Task Reference">
          <KV label="Task" value={m.taskRef} />
        </Section>
      )}

      {m.yamlSnippet && (
        <Section title="Raw YAML" collapsible defaultCollapsed>
          <pre style={{ fontSize: 11, fontFamily: 'monospace', background: 'var(--canvas-bg, #fafafa)', padding: 8, borderRadius: 4, overflow: 'auto', margin: 0, maxHeight: 200, color: 'var(--text-primary, #111)' }}>
            {m.yamlSnippet}
          </pre>
        </Section>
      )}
    </>
  )
}

function PanelHeader({ node, onClose, onToggleMode, mode }: {
  node: GraphNode; onClose: () => void; onToggleMode: () => void; mode: PanelMode
}) {
  const color = getNodeColor(node.type, node.metadata.func)
  const Icon = getNodeIcon(node.type, node.metadata.func)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 16px',
      borderBottom: '1px solid var(--panel-border, #e0e0e0)',
      background: 'var(--panel-bg, white)',
      borderRadius: mode === 'float' ? '8px 8px 0 0' : undefined,
    }}>
      <Icon size={18} color={color} />
      <span style={{
        flex: 1, fontSize: 15, fontWeight: 600,
        color: 'var(--text-primary, #111)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {node.label}
      </span>
      <button
        onClick={onToggleMode}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-secondary, #888)' }}
        title={mode === 'sidebar' ? 'Switch to floating window' : 'Switch to sidebar'}
      >
        {mode === 'sidebar' ? <MessageSquare size={14} /> : <PanelRightClose size={14} />}
      </button>
      <button
        onClick={onClose}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-secondary, #888)' }}
      >
        <X size={16} />
      </button>
    </div>
  )
}

export function DetailPanel({ node, mode, onClose, onToggleMode, clickPosition }: DetailPanelProps) {
  if (mode === 'sidebar') {
    return (
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: 320,
        height: '100%',
        background: 'var(--panel-bg, white)',
        borderLeft: '1px solid var(--panel-border, #e0e0e0)',
        boxShadow: '-2px 0 8px rgba(0,0,0,0.06)',
        overflowY: 'auto',
        zIndex: 10,
      }}>
        <PanelHeader node={node} onClose={onClose} onToggleMode={onToggleMode} mode={mode} />
        <PanelContent node={node} />
      </div>
    )
  }

  // Float mode: position to the right of the clicked node, or left if no room
  const panelWidth = 320
  const panelHeight = 450
  const offset = 260 // push well clear of the node

  let floatX: number
  let floatY: number

  if (clickPosition) {
    // Try placing to the right of the node
    const rightX = clickPosition.x + offset
    // If it would overflow the right edge, place to the left instead
    if (rightX + panelWidth > window.innerWidth - 20) {
      floatX = clickPosition.x - offset - panelWidth
    } else {
      floatX = rightX
    }
    // Vertically center near the click, clamped to viewport
    floatY = clickPosition.y - 60
  } else {
    floatX = 100
    floatY = 100
  }

  // Clamp to viewport
  floatX = Math.max(10, Math.min(floatX, window.innerWidth - panelWidth - 10))
  floatY = Math.max(10, Math.min(floatY, window.innerHeight - panelHeight - 10))

  return (
    <div
      style={{
        position: 'fixed',
        left: floatX,
        top: floatY,
        width: 320,
        maxHeight: 450,
        background: 'var(--panel-bg, white)',
        border: '1px solid var(--panel-border, #e0e0e0)',
        borderRadius: 8,
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        overflowY: 'auto',
        zIndex: 20,
      }}
    >
      <PanelHeader node={node} onClose={onClose} onToggleMode={onToggleMode} mode={mode} />
      <PanelContent node={node} />
    </div>
  )
}
