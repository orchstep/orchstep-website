import type { GraphEdge, ParseError } from '../types'

/**
 * Detect circular task references using DFS on task-call edges.
 * Returns warnings (not errors) for each cycle found.
 */
export function detectCycles(edges: GraphEdge[]): ParseError[] {
  // Build adjacency list from task-call edges
  // We need to map: source task -> target task
  // Source is like "step:taskA.stepName", target is like "task:taskB"
  const taskCallEdges = edges.filter(
    (e) =>
      e.type === 'task-call' ||
      ((e.type === 'conditional-true' ||
        e.type === 'conditional-false' ||
        e.type === 'conditional-elif') &&
        e.target.startsWith('task:'))
  )
  if (taskCallEdges.length === 0) return []

  // Build: task -> [called tasks]
  const adj = new Map<string, Set<string>>()

  for (const edge of taskCallEdges) {
    // Extract source task name from step id "step:taskName.stepName"
    const sourceMatch = edge.source.match(/^step:([^.]+)\./)
    if (!sourceMatch) continue
    const sourceTask = sourceMatch[1]
    // Extract target task name from "task:taskName"
    const targetTask = edge.target.replace(/^task:/, '')

    if (!adj.has(sourceTask)) adj.set(sourceTask, new Set())
    adj.get(sourceTask)!.add(targetTask)
  }

  // DFS cycle detection
  const warnings: ParseError[] = []
  const visited = new Set<string>()
  const inStack = new Set<string>()

  function dfs(node: string, path: string[]): boolean {
    if (inStack.has(node)) {
      const cycleStart = path.indexOf(node)
      const cycle = [...path.slice(cycleStart), node]
      warnings.push({
        message: `Circular task reference detected: ${cycle.join(' -> ')}`,
        severity: 'warning',
      })
      return true
    }
    if (visited.has(node)) return false

    visited.add(node)
    inStack.add(node)
    path.push(node)

    const neighbors = adj.get(node)
    if (neighbors) {
      for (const next of neighbors) {
        dfs(next, path)
      }
    }

    path.pop()
    inStack.delete(node)
    return false
  }

  for (const node of adj.keys()) {
    if (!visited.has(node)) {
      dfs(node, [])
    }
  }

  return warnings
}
