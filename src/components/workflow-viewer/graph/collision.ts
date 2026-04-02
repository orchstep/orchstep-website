/**
 * Collision detection for task container nodes.
 * Prevents task nodes from overlapping when dragged.
 */

const MIN_GAP = 20

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

function getNodeRect(node: { position: { x: number; y: number }; style?: any }): Rect {
  return {
    x: node.position.x,
    y: node.position.y,
    width: node.style?.width ?? 280,
    height: node.style?.height ?? 100,
  }
}

function rectsOverlap(a: Rect, b: Rect, gap: number): boolean {
  return !(
    a.x + a.width + gap <= b.x ||
    b.x + b.width + gap <= a.x ||
    a.y + a.height + gap <= b.y ||
    b.y + b.height + gap <= a.y
  )
}

/**
 * After a task node is dragged, resolve ALL overlaps with other tasks.
 * Pushes the dragged node to the nearest non-overlapping position,
 * checking all four directions and picking the smallest displacement.
 */
export function resolveTaskCollision(
  draggedId: string,
  nodes: Array<{ id: string; position: { x: number; y: number }; type?: string; style?: any }>
): { x: number; y: number } | null {
  const dragged = nodes.find(n => n.id === draggedId)
  if (!dragged || dragged.type !== 'task') return null

  const otherTasks = nodes.filter(n => n.id !== draggedId && n.type === 'task')
  const draggedRect = getNodeRect(dragged)

  // Find all overlapping tasks
  const overlapping = otherTasks.filter(other =>
    rectsOverlap(draggedRect, getNodeRect(other), MIN_GAP)
  )

  if (overlapping.length === 0) return null

  // For each overlapping task, compute the push needed in each direction.
  // Take the direction with the smallest push that resolves ALL overlaps.
  const pos = { x: dragged.position.x, y: dragged.position.y }

  // Iteratively resolve collisions (up to 10 rounds to handle chain reactions)
  for (let round = 0; round < 10; round++) {
    const currentRect: Rect = { ...draggedRect, x: pos.x, y: pos.y }
    let worstOverlap: { other: Rect; pushX: number; pushY: number } | null = null
    let worstArea = 0

    for (const other of otherTasks) {
      const otherRect = getNodeRect(other)
      if (!rectsOverlap(currentRect, otherRect, MIN_GAP)) continue

      // Calculate overlap area to find the worst collision
      const overlapX = Math.min(currentRect.x + currentRect.width, otherRect.x + otherRect.width) -
        Math.max(currentRect.x, otherRect.x) + MIN_GAP
      const overlapY = Math.min(currentRect.y + currentRect.height, otherRect.y + otherRect.height) -
        Math.max(currentRect.y, otherRect.y) + MIN_GAP
      const area = overlapX * overlapY

      if (area > worstArea) {
        worstArea = area

        // Compute minimum push in each direction
        const pushRight = otherRect.x + otherRect.width + MIN_GAP - currentRect.x
        const pushLeft = -(currentRect.x + currentRect.width + MIN_GAP - otherRect.x)
        const pushDown = otherRect.y + otherRect.height + MIN_GAP - currentRect.y
        const pushUp = -(currentRect.y + currentRect.height + MIN_GAP - otherRect.y)

        // Pick the smallest absolute push
        const candidates = [
          { pushX: pushRight, pushY: 0 },
          { pushX: pushLeft, pushY: 0 },
          { pushX: 0, pushY: pushDown },
          { pushX: 0, pushY: pushUp },
        ]

        const best = candidates.reduce((a, b) =>
          Math.abs(a.pushX) + Math.abs(a.pushY) < Math.abs(b.pushX) + Math.abs(b.pushY) ? a : b
        )

        worstOverlap = { other: otherRect, ...best }
      }
    }

    if (!worstOverlap) break // No more overlaps

    pos.x += worstOverlap.pushX
    pos.y += worstOverlap.pushY
  }

  // Only return if position actually changed
  if (pos.x === dragged.position.x && pos.y === dragged.position.y) return null
  return pos
}
