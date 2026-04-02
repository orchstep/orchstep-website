import React from 'react'
import { Handle, Position } from '@xyflow/react'

const handleStyle: React.CSSProperties = {
  width: 6,
  height: 6,
  background: 'transparent',
  border: 'none',
}

/**
 * Renders 4 handles (top, right, bottom, left) on each side of the node.
 * Each has a source and target variant so edges can connect from any direction.
 */
export function NodeHandles() {
  return (
    <>
      <Handle type="target" position={Position.Top} id="top" style={handleStyle} />
      <Handle type="target" position={Position.Right} id="right-target" style={handleStyle} />
      <Handle type="target" position={Position.Bottom} id="bottom-target" style={handleStyle} />
      <Handle type="target" position={Position.Left} id="left-target" style={handleStyle} />
      <Handle type="source" position={Position.Top} id="top-source" style={handleStyle} />
      <Handle type="source" position={Position.Right} id="right" style={handleStyle} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={handleStyle} />
      <Handle type="source" position={Position.Left} id="left" style={handleStyle} />
    </>
  )
}
