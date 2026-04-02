import { parse as parseYaml } from 'yaml'
import type { GraphNode, GraphEdge, ParseResult, ParseError } from '../types'
import { parseSteps } from './parse-steps'
import { detectCycles } from './cycle-detector'

/**
 * Parse an OrchStep workflow YAML string into a graph data structure
 * suitable for React Flow rendering.
 */
export function parseWorkflowYaml(yamlString: string): ParseResult {
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []
  const errors: ParseError[] = []

  // Handle empty input
  if (!yamlString || yamlString.trim() === '') {
    return { nodes, edges, errors }
  }

  // Parse YAML
  let doc: Record<string, unknown>
  try {
    doc = parseYaml(yamlString)
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to parse YAML'
    errors.push({ message, severity: 'error' })
    return { nodes, edges, errors }
  }

  if (!doc || typeof doc !== 'object') {
    return { nodes, edges, errors }
  }

  // Extract modules map for module-call resolution
  const modules = new Map<string, { source: string }>()
  if (Array.isArray(doc.modules)) {
    for (const mod of doc.modules as Array<Record<string, unknown>>) {
      if (mod.name && mod.source) {
        modules.set(mod.name as string, { source: mod.source as string })
      }
    }
  }

  // No tasks defined
  const tasks = doc.tasks as Record<string, Record<string, unknown>> | undefined
  if (!tasks || typeof tasks !== 'object') {
    return { nodes, edges, errors }
  }

  // Process each task
  for (const [taskName, taskDef] of Object.entries(tasks)) {
    const taskNodeId = `task:${taskName}`

    // Create task node
    const taskNode: GraphNode = {
      id: taskNodeId,
      type: 'task',
      label: taskName,
      metadata: {
        description: taskDef.desc as string | undefined,
        variables: taskDef.vars as Record<string, unknown> | undefined,
        stepCount: Array.isArray(taskDef.steps)
          ? (taskDef.steps as unknown[]).length
          : 0,
      },
    }
    nodes.push(taskNode)

    // Parse steps
    if (Array.isArray(taskDef.steps)) {
      const stepResult = parseSteps(taskName, taskDef.steps as unknown[], modules)
      nodes.push(...stepResult.nodes)
      edges.push(...stepResult.edges)
    }

    // Task-level catch
    if (Array.isArray(taskDef.catch)) {
      const catchSteps = taskDef.catch as Array<Record<string, unknown>>
      for (let i = 0; i < catchSteps.length; i++) {
        const catchStep = catchSteps[i]
        const catchNodeId = `error-handler:${taskName}.catch_${i}`
        nodes.push({
          id: catchNodeId,
          type: 'error-handler',
          label: (catchStep.name as string) ?? `catch_${i}`,
          parentId: taskNodeId,
          metadata: {
            catch: true,
            func: catchStep.func as string | undefined,
            command: catchStep.do as string | undefined,
          },
        })
        edges.push({
          id: `edge:${taskNodeId}->${catchNodeId}`,
          source: taskNodeId,
          target: catchNodeId,
          type: 'error-path',
        })
      }
    }

    // Task-level finally
    if (Array.isArray(taskDef.finally)) {
      const finallySteps = taskDef.finally as Array<Record<string, unknown>>
      for (let i = 0; i < finallySteps.length; i++) {
        const finallyStep = finallySteps[i]
        const finallyNodeId = `error-handler:${taskName}.finally_${i}`
        nodes.push({
          id: finallyNodeId,
          type: 'error-handler',
          label: (finallyStep.name as string) ?? `finally_${i}`,
          parentId: taskNodeId,
          metadata: {
            finally: true,
            func: finallyStep.func as string | undefined,
            command: finallyStep.do as string | undefined,
          },
        })
        edges.push({
          id: `edge:${taskNodeId}->${finallyNodeId}`,
          source: taskNodeId,
          target: finallyNodeId,
          type: 'cleanup-path',
        })
      }
    }
  }

  // Run cycle detection
  const cycleWarnings = detectCycles(edges)
  errors.push(...cycleWarnings)

  return { nodes, edges, errors }
}
