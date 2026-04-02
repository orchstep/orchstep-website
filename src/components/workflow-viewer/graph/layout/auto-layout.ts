import dagre from '@dagrejs/dagre'
import type { GraphNode, GraphEdge, Direction } from '../../types'

interface PositionedNode {
  id: string
  position: { x: number; y: number }
  data: GraphNode
  type: string
  parentId?: string
  extent?: 'parent'
  draggable?: boolean
  style?: Record<string, unknown>
}

const NODE_WIDTH = 240
const NODE_HEIGHT = 60
const TASK_PADDING = 30
const TASK_HEADER = 50
const TASK_GAP = 40

export function computeLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  direction: Direction
): PositionedNode[] {
  if (nodes.length === 0) return []

  const dagreDir = direction === 'AUTO' ? 'TB' : direction

  // Step 1: Layout non-task nodes using dagre
  const g = new dagre.graphlib.Graph()
  g.setGraph({
    rankdir: dagreDir,
    nodesep: 40,
    ranksep: 60,
    marginx: 20,
    marginy: 20,
  })
  g.setDefaultEdgeLabel(() => ({}))

  for (const node of nodes) {
    if (node.type === 'task') continue
    const height = node.type === 'merge-dot' ? 10 : NODE_HEIGHT
    // Condition nodes with long expressions need more width
    let width = NODE_WIDTH
    if (node.type === 'condition' && node.metadata.condition) {
      width = Math.max(NODE_WIDTH, Math.min(400, node.metadata.condition.length * 7 + 80))
    }
    g.setNode(node.id, { width, height, label: node.label })
  }

  for (const edge of edges) {
    if (edge.source === edge.target) continue
    if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
      g.setEdge(edge.source, edge.target)
    }
  }

  dagre.layout(g)

  // Step 2: Collect absolute positions
  const absPositions = new Map<string, { x: number; y: number; w: number; h: number }>()
  for (const node of nodes) {
    if (node.type === 'task') continue
    const dn = g.node(node.id)
    if (!dn) continue
    absPositions.set(node.id, {
      x: dn.x - (dn.width || NODE_WIDTH) / 2,
      y: dn.y - (dn.height || NODE_HEIGHT) / 2,
      w: dn.width || NODE_WIDTH,
      h: dn.height || NODE_HEIGHT,
    })
  }

  // Step 3: Compute task bounds from children
  const taskBounds = new Map<string, { x: number; y: number; w: number; h: number }>()
  for (const node of nodes) {
    if (node.type !== 'task') continue
    const children = nodes.filter(n => n.parentId === node.id)
    const childBounds = children
      .map(c => absPositions.get(c.id))
      .filter((p): p is { x: number; y: number; w: number; h: number } => p != null)

    if (childBounds.length === 0) {
      taskBounds.set(node.id, { x: 0, y: 0, w: NODE_WIDTH + TASK_PADDING * 2, h: 80 })
      continue
    }

    const minX = Math.min(...childBounds.map(p => p.x)) - TASK_PADDING
    const minY = Math.min(...childBounds.map(p => p.y)) - TASK_PADDING - TASK_HEADER
    const maxX = Math.max(...childBounds.map(p => p.x + p.w)) + TASK_PADDING
    const maxY = Math.max(...childBounds.map(p => p.y + p.h)) + TASK_PADDING
    taskBounds.set(node.id, { x: minX, y: minY, w: maxX - minX, h: maxY - minY })
  }

  // Step 4: Save original task bounds (before any repositioning)
  // Children's relative positions are computed from original dagre layout,
  // so we need the original bounds to calculate relative coords correctly.
  const originalTaskBounds = new Map<string, { x: number; y: number; w: number; h: number }>()
  for (const [id, bounds] of taskBounds) {
    originalTaskBounds.set(id, { ...bounds })
  }

  // Step 5: For AUTO mode, reposition tasks using a task-level dagre graph
  if (direction === 'AUTO') {
    repositionTasksAuto(nodes, edges, taskBounds, absPositions)
    // Update original bounds after AUTO repositioning (AUTO shifts children too)
    for (const [id, bounds] of taskBounds) {
      originalTaskBounds.set(id, { ...bounds })
    }
  }

  // Step 6: Spread tasks apart to maintain gaps
  spreadTasks(taskBounds, TASK_GAP)

  // Step 7: Build positioned nodes
  // For children: compute relative position using ORIGINAL bounds (pre-spread),
  // because absPositions reflect the pre-spread layout.
  const positioned: PositionedNode[] = []

  for (const node of nodes) {
    if (node.type !== 'task') continue
    const bounds = taskBounds.get(node.id)!
    positioned.push({
      id: node.id,
      position: { x: bounds.x, y: bounds.y },
      data: node,
      type: 'task',
      draggable: true,
      style: { width: bounds.w, height: bounds.h, zIndex: -1 },
    })
  }

  for (const node of nodes) {
    if (node.type === 'task') continue
    const abs = absPositions.get(node.id)
    if (!abs) continue

    const origParentBounds = node.parentId ? originalTaskBounds.get(node.parentId) : null
    if (origParentBounds) {
      positioned.push({
        id: node.id,
        position: { x: abs.x - origParentBounds.x, y: abs.y - origParentBounds.y },
        data: node,
        type: node.type === 'merge-dot' ? 'mergeDot' : node.type,
        parentId: node.parentId,
        extent: 'parent',
        draggable: true,
      })
    } else {
      positioned.push({
        id: node.id,
        position: { x: abs.x, y: abs.y },
        data: node,
        type: node.type === 'merge-dot' ? 'mergeDot' : node.type,
        draggable: true,
      })
    }
  }

  return positioned
}

/**
 * AUTO layout: reposition task containers using a task-level dagre graph.
 * Connected tasks flow naturally, unconnected tasks placed alongside.
 * Produces a staggered layout with reduced edge tangles.
 */
function repositionTasksAuto(
  nodes: GraphNode[],
  edges: GraphEdge[],
  taskBounds: Map<string, { x: number; y: number; w: number; h: number }>,
  absPositions: Map<string, { x: number; y: number; w: number; h: number }>
) {
  const taskNodes = nodes.filter(n => n.type === 'task')
  if (taskNodes.length <= 1) return

  const tg = new dagre.graphlib.Graph()
  tg.setGraph({
    rankdir: 'TB',
    nodesep: TASK_GAP * 2,
    ranksep: TASK_GAP * 2,
    marginx: 20,
    marginy: 20,
  })
  tg.setDefaultEdgeLabel(() => ({}))

  for (const task of taskNodes) {
    const bounds = taskBounds.get(task.id)!
    tg.setNode(task.id, { width: bounds.w, height: bounds.h })
  }

  // Cross-task edges
  for (const edge of edges) {
    const sourceTask = findParentTask(edge.source, nodes)
    const targetTask = findParentTask(edge.target, nodes)
    if (sourceTask && targetTask && sourceTask !== targetTask) {
      if (tg.hasNode(sourceTask) && tg.hasNode(targetTask)) {
        tg.setEdge(sourceTask, targetTask)
      }
    }
  }

  dagre.layout(tg)

  // Apply new task positions, shifting children accordingly
  for (const task of taskNodes) {
    const dt = tg.node(task.id)
    if (!dt) continue

    const oldBounds = taskBounds.get(task.id)!
    const newX = dt.x - dt.width / 2
    const newY = dt.y - dt.height / 2
    const dx = newX - oldBounds.x
    const dy = newY - oldBounds.y

    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
      // Shift children
      for (const node of nodes) {
        if (node.parentId !== task.id) continue
        const abs = absPositions.get(node.id)
        if (abs) {
          abs.x += dx
          abs.y += dy
        }
      }
      taskBounds.set(task.id, { x: newX, y: newY, w: oldBounds.w, h: oldBounds.h })
    }
  }
}

function findParentTask(nodeId: string, nodes: GraphNode[]): string | undefined {
  if (nodeId.startsWith('task:')) return nodeId
  const node = nodes.find(n => n.id === nodeId)
  return node?.parentId
}



/**
 * Push task containers apart to maintain minimum gaps.
 */
function spreadTasks(
  taskBounds: Map<string, { x: number; y: number; w: number; h: number }>,
  gap: number
) {
  const tasks = Array.from(taskBounds.entries())
  if (tasks.length <= 1) return

  for (let round = 0; round < 20; round++) {
    let moved = false

    for (let i = 0; i < tasks.length; i++) {
      for (let j = i + 1; j < tasks.length; j++) {
        const a = tasks[i][1]
        const b = tasks[j][1]

        // Check if they overlap (with gap)
        const noOverlapX = a.x + a.w + gap <= b.x || b.x + b.w + gap <= a.x
        const noOverlapY = a.y + a.h + gap <= b.y || b.y + b.h + gap <= a.y
        if (noOverlapX || noOverlapY) continue

        // They overlap — compute how much
        const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) + gap
        const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) + gap
        if (overlapX <= 0 || overlapY <= 0) continue

        // Push apart in direction of minimum overlap
        if (overlapX < overlapY) {
          const push = overlapX / 2
          if (a.x <= b.x) { a.x -= push; b.x += push }
          else { a.x += push; b.x -= push }
        } else {
          const push = overlapY / 2
          if (a.y <= b.y) { a.y -= push; b.y += push }
          else { a.y += push; b.y -= push }
        }
        moved = true
      }
    }
    if (!moved) break
  }

  for (const [id, bounds] of tasks) {
    taskBounds.set(id, bounds)
  }
}
