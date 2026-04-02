/**
 * Smart edge routing: pick the closest source/target handles
 * based on the relative positions of connected nodes.
 * Accounts for parent-child nesting when computing absolute positions.
 */

interface NodeRect {
  x: number
  y: number
  width: number
  height: number
}

type Side = 'top' | 'right' | 'bottom' | 'left'

function getNodeCenter(rect: NodeRect): { cx: number; cy: number } {
  return {
    cx: rect.x + rect.width / 2,
    cy: rect.y + rect.height / 2,
  }
}

function sideToSourceHandle(side: Side): string {
  return side // source handles: 'top-source', 'right', 'bottom', 'left'
  // Actually: top-source, right, bottom, left
}

function sideToTargetHandle(side: Side): string {
  if (side === 'top') return 'top'
  return `${side}-target`
}

/**
 * Given two node rects (absolute positions), determine which side of source
 * should connect to which side of target for the best visual path.
 *
 * Uses a more nuanced approach than pure closest-side:
 * - When nodes are clearly to the side, use horizontal routing
 * - When nodes are clearly above/below, use vertical routing
 * - When nodes overlap horizontally or vertically, pick the side that
 *   avoids routing through either node's body
 */
export function getBestHandles(
  source: NodeRect,
  target: NodeRect
): { sourceHandle: string; targetHandle: string } {
  const s = getNodeCenter(source)
  const t = getNodeCenter(target)

  const dx = t.cx - s.cx
  const dy = t.cy - s.cy

  // Check if nodes overlap on either axis
  const overlapX = !(source.x + source.width < target.x || target.x + target.width < source.x)
  const overlapY = !(source.y + source.height < target.y || target.y + target.height < source.y)

  let sourceSide: Side
  let targetSide: Side

  if (overlapX && overlapY) {
    // Nodes overlap in both axes (one is inside the other or very close)
    // Route from the side with most clearance
    if (Math.abs(dx) > Math.abs(dy)) {
      sourceSide = dx > 0 ? 'right' : 'left'
      targetSide = dx > 0 ? 'left' : 'right'
    } else {
      sourceSide = dy > 0 ? 'bottom' : 'top'
      targetSide = dy > 0 ? 'top' : 'bottom'
    }
  } else if (overlapX) {
    // Nodes overlap horizontally — route vertically
    sourceSide = dy > 0 ? 'bottom' : 'top'
    targetSide = dy > 0 ? 'top' : 'bottom'
  } else if (overlapY) {
    // Nodes overlap vertically — route horizontally
    sourceSide = dx > 0 ? 'right' : 'left'
    targetSide = dx > 0 ? 'left' : 'right'
  } else {
    // No overlap — use dominant direction
    if (Math.abs(dx) > Math.abs(dy)) {
      sourceSide = dx > 0 ? 'right' : 'left'
      targetSide = dx > 0 ? 'left' : 'right'
    } else {
      sourceSide = dy > 0 ? 'bottom' : 'top'
      targetSide = dy > 0 ? 'top' : 'bottom'
    }
  }

  return {
    sourceHandle: sourceSide === 'top' ? 'top-source' : sourceSide,
    targetHandle: sideToTargetHandle(targetSide),
  }
}

/**
 * Get the absolute position of a node, accounting for parent offset.
 * For task (parent) nodes, uses the style width/height.
 * For child nodes, adds parent position to get absolute coords.
 */
export function getAbsolutePosition(
  nodeId: string,
  nodes: Array<{ id: string; position: { x: number; y: number }; parentId?: string; style?: any; data?: any }>
): NodeRect {
  const node = nodes.find(n => n.id === nodeId)
  if (!node) return { x: 0, y: 0, width: 240, height: 60 }

  let x = node.position.x
  let y = node.position.y

  // If node has a parent, add parent's absolute position
  if (node.parentId) {
    const parent = nodes.find(n => n.id === node.parentId)
    if (parent) {
      x += parent.position.x
      y += parent.position.y
    }
  }

  // Determine dimensions
  const width = node.style?.width ?? 240
  const height = node.style?.height ?? 60

  return { x, y, width, height }
}
