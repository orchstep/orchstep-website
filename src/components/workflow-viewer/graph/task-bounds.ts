/**
 * Recalculate task container bounds to tightly fit their children.
 * Uses measured (actual rendered) dimensions when available.
 */

const PADDING = 30
const HEADER_HEIGHT = 50
const DEFAULT_CHILD_WIDTH = 240
const DEFAULT_CHILD_HEIGHT = 60

interface FlowNode {
  id: string
  position: { x: number; y: number }
  parentId?: string
  type?: string
  style?: Record<string, any>
  data?: any
  measured?: { width?: number; height?: number }
  [key: string]: any
}

export function recalcTaskBounds(nodes: FlowNode[]): FlowNode[] | null {
  const taskNodes = nodes.filter(n => n.type === 'task')
  if (taskNodes.length === 0) return null

  let changed = false
  let updated = [...nodes]

  for (const task of taskNodes) {
    const children = updated.filter(n => n.parentId === task.id)
    if (children.length === 0) continue

    // Child positions are relative to parent.
    // Use measured dimensions (actual rendered size) for accurate bounds.
    const childRects = children.map(c => ({
      x: c.position.x,
      y: c.position.y,
      w: getWidth(c),
      h: getHeight(c),
    }))

    const minX = Math.min(...childRects.map(r => r.x))
    const minY = Math.min(...childRects.map(r => r.y))
    const maxX = Math.max(...childRects.map(r => r.x + r.w))
    const maxY = Math.max(...childRects.map(r => r.y + r.h))

    // Content box: the bounding box of all children
    const contentWidth = maxX - minX
    const contentHeight = maxY - minY

    // Desired container size: content + padding on all 4 sides + header
    const desiredWidth = contentWidth + PADDING * 2
    const desiredHeight = contentHeight + PADDING * 2 + HEADER_HEIGHT

    // Where children top-left corner should be inside the container
    const idealMinX = PADDING
    const idealMinY = PADDING + HEADER_HEIGHT

    // How much to shift children to normalize their position
    const shiftX = idealMinX - minX
    const shiftY = idealMinY - minY

    const currentWidth = task.style?.width ?? task.measured?.width ?? desiredWidth
    const currentHeight = task.style?.height ?? task.measured?.height ?? desiredHeight

    const sizeDiff = Math.abs(desiredWidth - currentWidth) > 2 ||
                     Math.abs(desiredHeight - currentHeight) > 2
    const positionDiff = Math.abs(shiftX) > 1 || Math.abs(shiftY) > 1

    if (sizeDiff || positionDiff) {
      updated = updated.map(n => {
        if (n.id === task.id) {
          return {
            ...n,
            position: positionDiff ? {
              x: n.position.x - shiftX,
              y: n.position.y - shiftY,
            } : n.position,
            style: {
              ...n.style,
              width: desiredWidth,
              height: desiredHeight,
            },
          }
        }
        if (n.parentId === task.id && positionDiff) {
          return {
            ...n,
            position: {
              x: n.position.x + shiftX,
              y: n.position.y + shiftY,
            },
          }
        }
        return n
      })
      changed = true
    }
  }

  return changed ? updated : null
}

function getWidth(node: FlowNode): number {
  // Prefer measured (actual DOM size), then style, then default
  return node.measured?.width ?? node.style?.width ?? DEFAULT_CHILD_WIDTH
}

function getHeight(node: FlowNode): number {
  if (node.type === 'mergeDot') return 10
  return node.measured?.height ?? node.style?.height ?? DEFAULT_CHILD_HEIGHT
}
