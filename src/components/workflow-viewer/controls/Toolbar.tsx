import React, { useState, useRef, useEffect } from 'react'
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  ArrowDown,
  ArrowRight,
  Search,
  Map,
  Moon,
  Sun,
  Download,
  Copy,
  Sparkles,
  ChevronsDownUp,
  ChevronsUpDown,
} from 'lucide-react'
import type { Direction, Theme } from '../types'

interface ToolbarProps {
  direction: Direction
  theme: Theme
  minimapVisible: boolean
  searchQuery: string
  allCollapsed: boolean
  onDirectionChange: (d: Direction) => void
  onThemeChange: (t: Theme) => void
  onFitView: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onToggleMinimap: () => void
  onSearchChange: (q: string) => void
  onExport: () => void
  onCopy: () => void
  onCollapseAll: () => void
  onExpandAll: () => void
}

const btnStyle: React.CSSProperties = {
  background: 'none',
  border: '1px solid var(--panel-border, #e0e0e0)',
  borderRadius: 4,
  padding: '4px 8px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  color: 'var(--text-primary, #111)',
  fontSize: 12,
}

export function Toolbar({
  direction,
  theme,
  minimapVisible,
  searchQuery,
  allCollapsed,
  onDirectionChange,
  onThemeChange,
  onFitView,
  onZoomIn,
  onZoomOut,
  onToggleMinimap,
  onSearchChange,
  onExport,
  onCopy,
  onCollapseAll,
  onExpandAll,
}: ToolbarProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [searchOpen])

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSearchOpen(false)
      onSearchChange('')
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '6px 12px',
        gap: 6,
        borderBottom: '1px solid var(--panel-border, #e0e0e0)',
        background: 'var(--panel-bg, white)',
        flexShrink: 0,
      }}
    >
      {/* Left controls */}
      <div style={{ display: 'flex', gap: 4 }}>
        <button style={btnStyle} onClick={onZoomIn} title="Zoom In">
          <ZoomIn size={14} />
        </button>
        <button style={btnStyle} onClick={onZoomOut} title="Zoom Out">
          <ZoomOut size={14} />
        </button>
        <button style={btnStyle} onClick={onFitView} title="Fit View">
          <Maximize2 size={14} />
        </button>
        <button
          style={btnStyle}
          onClick={() => {
            const next = direction === 'AUTO' ? 'TB' : direction === 'TB' ? 'LR' : 'AUTO'
            onDirectionChange(next)
          }}
          title={direction === 'AUTO' ? 'Smart Layout' : direction === 'TB' ? 'Vertical' : 'Horizontal'}
        >
          {direction === 'AUTO' ? <Sparkles size={14} /> : direction === 'TB' ? <ArrowDown size={14} /> : <ArrowRight size={14} />}
          <span style={{ fontSize: 11 }}>{direction === 'AUTO' ? 'Smart' : direction === 'TB' ? 'Vertical' : 'Horizontal'}</span>
        </button>
        <button
          style={btnStyle}
          onClick={allCollapsed ? onExpandAll : onCollapseAll}
          title={allCollapsed ? 'Expand All Tasks' : 'Collapse All Tasks'}
        >
          {allCollapsed ? <ChevronsUpDown size={14} /> : <ChevronsDownUp size={14} />}
        </button>
      </div>

      {/* Center: search */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        {searchOpen ? (
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search nodes..."
            style={{
              padding: '4px 8px',
              border: '1px solid var(--panel-border, #e0e0e0)',
              borderRadius: 4,
              fontSize: 12,
              width: 200,
              background: 'var(--node-bg, white)',
              color: 'var(--text-primary, #111)',
              outline: 'none',
            }}
          />
        ) : (
          <button style={btnStyle} onClick={() => setSearchOpen(true)} title="Search">
            <Search size={14} />
            <span>Search</span>
          </button>
        )}
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', gap: 4 }}>
        <button
          style={{ ...btnStyle, ...(minimapVisible ? { background: 'var(--canvas-bg, #fafafa)' } : {}) }}
          onClick={onToggleMinimap}
          title="Toggle Minimap"
        >
          <Map size={14} />
        </button>
        <button
          style={btnStyle}
          onClick={() => onThemeChange(theme === 'light' ? 'dark' : 'light')}
          title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        >
          {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
        </button>
        <button style={btnStyle} onClick={onExport} title="Export PNG">
          <Download size={14} />
        </button>
        <button style={btnStyle} onClick={onCopy} title="Copy to Clipboard">
          <Copy size={14} />
        </button>
      </div>
    </div>
  )
}
