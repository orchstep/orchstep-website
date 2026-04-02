import { stringify } from 'yaml'
import type {
  GraphNode,
  GraphEdge,
  NodeMetadata,
  LoopInfo,
  RetryInfo,
} from '../types'

interface ParseStepsResult {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

/**
 * Parse steps array from a task into graph nodes and edges.
 */
export function parseSteps(
  taskName: string,
  steps: unknown[],
  modules: Map<string, { source: string }>
): ParseStepsResult {
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []
  let prevNodeId: string | null = null

  for (const rawStep of steps) {
    const step = rawStep as Record<string, unknown>
    const stepName = step.name as string
    if (!stepName) continue

    const result = parseSingleStep(taskName, step, modules)
    nodes.push(...result.nodes)
    edges.push(...result.edges)

    // Connect to previous step with sequential edge
    const mainNodeId = result.mainNodeId
    if (prevNodeId && mainNodeId) {
      edges.push({
        id: `edge:${prevNodeId}->${mainNodeId}`,
        source: prevNodeId,
        target: mainNodeId,
        type: 'sequential',
      })
    }

    // Track the last node for sequential chaining
    prevNodeId = result.lastNodeId ?? mainNodeId
  }

  return { nodes, edges }
}

interface SingleStepResult {
  nodes: GraphNode[]
  edges: GraphEdge[]
  mainNodeId: string
  lastNodeId?: string
}

function parseSingleStep(
  taskName: string,
  step: Record<string, unknown>,
  modules: Map<string, { source: string }>
): SingleStepResult {
  const stepName = step.name as string
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []

  // Determine step type and create appropriate node
  if (step.if != null) {
    return parseConditionalStep(taskName, step, modules)
  }

  if (step.loop != null) {
    return parseLoopStep(taskName, step)
  }

  if (step.module != null) {
    return parseModuleStep(taskName, step, modules)
  }

  if (step.task != null && step.if == null) {
    // Plain task reference (no condition)
    return parseTaskRefStep(taskName, step)
  }

  // Plain step
  const nodeId = `step:${taskName}.${stepName}`
  const metadata = extractMetadata(step)
  const node: GraphNode = {
    id: nodeId,
    type: 'step',
    label: stepName,
    parentId: `task:${taskName}`,
    metadata,
  }
  nodes.push(node)

  // Step-level catch/finally
  const errorResult = parseStepErrorHandling(taskName, stepName, nodeId, step)
  nodes.push(...errorResult.nodes)
  edges.push(...errorResult.edges)

  return {
    nodes,
    edges,
    mainNodeId: nodeId,
    lastNodeId: errorResult.lastNodeId,
  }
}

function parseConditionalStep(
  taskName: string,
  step: Record<string, unknown>,
  _modules: Map<string, { source: string }>
): SingleStepResult {
  const stepName = step.name as string
  const conditionNodeId = `condition:${taskName}.${stepName}`
  const mergeNodeId = `merge:${taskName}.${stepName}`
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []

  const elifBranches: Array<{ condition: string; taskOrSteps: string }> = []
  if (Array.isArray(step.elif)) {
    for (const branch of step.elif as Array<Record<string, unknown>>) {
      elifBranches.push({
        condition: String(branch.if ?? ''),
        taskOrSteps: String(branch.task ?? ''),
      })
    }
  }

  const metadata: NodeMetadata = {
    condition: String(step.if),
    taskRef: step.task as string | undefined,
    yamlSnippet: generateSnippet(step),
    elifBranches: elifBranches.length > 0 ? elifBranches : undefined,
  }

  // Condition node
  nodes.push({
    id: conditionNodeId,
    type: 'condition',
    label: stepName,
    parentId: `task:${taskName}`,
    metadata,
  })

  // Track whether all branches go to external tasks (no inline steps)
  let allBranchesExternal = true

  // True branch -> task reference
  if (step.task) {
    const targetTaskId = `task:${step.task}`
    edges.push({
      id: `edge:${conditionNodeId}->${targetTaskId}:true`,
      source: conditionNodeId,
      target: targetTaskId,
      type: 'conditional-true',
      label: 'true',
    })
  } else if (step.then) {
    allBranchesExternal = false
  }

  // False branch -> else task
  if (step.else && typeof step.else === 'string') {
    const elseTaskId = `task:${step.else}`
    edges.push({
      id: `edge:${conditionNodeId}->${elseTaskId}:false`,
      source: conditionNodeId,
      target: elseTaskId,
      type: 'conditional-false',
      label: 'false',
    })
  } else if (step.else) {
    allBranchesExternal = false
  }

  // Elif branches
  if (Array.isArray(step.elif)) {
    for (const branch of step.elif as Array<Record<string, unknown>>) {
      if (branch.task) {
        const elifTaskId = `task:${branch.task}`
        edges.push({
          id: `edge:${conditionNodeId}->${elifTaskId}:elif`,
          source: conditionNodeId,
          target: elifTaskId,
          type: 'conditional-elif',
          label: String(branch.if ?? 'elif'),
        })
      } else {
        allBranchesExternal = false
      }
    }
  }

  // Only create merge dot when branches have inline steps that rejoin
  // When all branches go to external tasks, there's no convergence point
  if (!allBranchesExternal) {
    nodes.push({
      id: mergeNodeId,
      type: 'merge-dot',
      label: '',
      parentId: `task:${taskName}`,
      metadata: {},
    })
  }

  return {
    nodes,
    edges,
    mainNodeId: conditionNodeId,
    lastNodeId: allBranchesExternal ? conditionNodeId : mergeNodeId,
  }
}

function parseLoopStep(
  taskName: string,
  step: Record<string, unknown>
): SingleStepResult {
  const stepName = step.name as string
  const nodeId = `loop:${taskName}.${stepName}`
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []

  const loopConfig = extractLoopConfig(step.loop)
  const metadata = extractMetadata(step)
  metadata.loopConfig = loopConfig

  nodes.push({
    id: nodeId,
    type: 'loop',
    label: stepName,
    parentId: `task:${taskName}`,
    metadata,
  })

  // Self-loop edge for loop body
  edges.push({
    id: `edge:${nodeId}->${nodeId}:loop`,
    source: nodeId,
    target: nodeId,
    type: 'loop-body',
    label: 'loop',
  })

  return { nodes, edges, mainNodeId: nodeId }
}

function parseModuleStep(
  taskName: string,
  step: Record<string, unknown>,
  modules: Map<string, { source: string }>
): SingleStepResult {
  const stepName = step.name as string
  const nodeId = `step:${taskName}.${stepName}`
  const moduleName = step.module as string
  const moduleInfo = modules.get(moduleName)
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []

  const metadata: NodeMetadata = {
    moduleName,
    moduleSource: moduleInfo?.source,
    taskRef: step.task as string | undefined,
    with: step.with as Record<string, unknown> | undefined,
    yamlSnippet: generateSnippet(step),
  }

  nodes.push({
    id: nodeId,
    type: 'module-call',
    label: stepName,
    parentId: `task:${taskName}`,
    metadata,
  })

  // Module-call edge to a virtual module target
  const moduleTargetId = `module:${moduleName}`
  edges.push({
    id: `edge:${nodeId}->${moduleTargetId}`,
    source: nodeId,
    target: moduleTargetId,
    type: 'module-call',
  })

  return { nodes, edges, mainNodeId: nodeId }
}

function parseTaskRefStep(
  taskName: string,
  step: Record<string, unknown>
): SingleStepResult {
  const stepName = step.name as string
  const nodeId = `step:${taskName}.${stepName}`
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []

  const metadata: NodeMetadata = {
    taskRef: step.task as string,
    yamlSnippet: generateSnippet(step),
  }

  nodes.push({
    id: nodeId,
    type: 'step',
    label: stepName,
    parentId: `task:${taskName}`,
    metadata,
  })

  // Task-call edge
  const targetTaskId = `task:${step.task}`
  edges.push({
    id: `edge:${nodeId}->${targetTaskId}`,
    source: nodeId,
    target: targetTaskId,
    type: 'task-call',
  })

  return { nodes, edges, mainNodeId: nodeId }
}

function parseStepErrorHandling(
  taskName: string,
  stepName: string,
  stepNodeId: string,
  step: Record<string, unknown>
): { nodes: GraphNode[]; edges: GraphEdge[]; lastNodeId?: string } {
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []
  let lastNodeId: string | undefined

  if (Array.isArray(step.catch)) {
    const catchId = `error-handler:${taskName}.${stepName}_catch`
    nodes.push({
      id: catchId,
      type: 'error-handler',
      label: `${stepName} catch`,
      parentId: `task:${taskName}`,
      metadata: { catch: true, stepCount: (step.catch as unknown[]).length },
    })
    edges.push({
      id: `edge:${stepNodeId}->${catchId}`,
      source: stepNodeId,
      target: catchId,
      type: 'error-path',
    })
  }

  if (Array.isArray(step.finally)) {
    const finallyId = `error-handler:${taskName}.${stepName}_finally`
    nodes.push({
      id: finallyId,
      type: 'error-handler',
      label: `${stepName} finally`,
      parentId: `task:${taskName}`,
      metadata: {
        finally: true,
        stepCount: (step.finally as unknown[]).length,
      },
    })
    edges.push({
      id: `edge:${stepNodeId}->${finallyId}`,
      source: stepNodeId,
      target: finallyId,
      type: 'cleanup-path',
    })
    lastNodeId = finallyId
  }

  return { nodes, edges, lastNodeId }
}

function extractMetadata(step: Record<string, unknown>): NodeMetadata {
  const metadata: NodeMetadata = {}

  if (step.func) metadata.func = step.func as string
  if (step.do) metadata.command = step.do as string
  if (step.desc) metadata.description = step.desc as string
  if (step.timeout) metadata.timeout = step.timeout as string
  if (step.outputs)
    metadata.outputs = step.outputs as Record<string, string>
  if (step.vars || step.variables)
    metadata.variables = (step.vars ?? step.variables) as Record<
      string,
      unknown
    >
  if (step.env) metadata.env = step.env as Record<string, unknown>
  if (step.with) metadata.with = step.with as Record<string, unknown>
  if (step.on_error) metadata.onError = step.on_error as string
  if (step.total_timeout)
    metadata.totalTimeout = step.total_timeout as string | undefined

  if (step.retry) {
    metadata.retry = extractRetryInfo(step.retry as Record<string, unknown>)
  }

  metadata.yamlSnippet = generateSnippet(step)

  return metadata
}

function extractRetryInfo(retry: Record<string, unknown>): RetryInfo {
  return {
    maxAttempts: (retry.max_attempts as number) ?? 1,
    interval: retry.interval as string | undefined,
    backoffRate: retry.backoff_rate as number | undefined,
    maxDelay: retry.max_delay as string | undefined,
    jitter: retry.jitter as number | undefined,
    when: retry.when as string | undefined,
  }
}

function extractLoopConfig(loop: unknown): LoopInfo {
  if (typeof loop === 'string') {
    return { items: loop }
  }
  if (typeof loop === 'number') {
    return { count: loop }
  }
  if (typeof loop === 'object' && loop !== null) {
    const l = loop as Record<string, unknown>
    return {
      items: l.items as string | undefined,
      count: l.count as number | undefined,
      range: l.range as [number, number] | undefined,
      as: l.as as string | undefined,
      onError: l.on_error as string | undefined,
      until: l.until as string | undefined,
      delay: l.delay as string | undefined,
    }
  }
  return {}
}

function generateSnippet(step: Record<string, unknown>): string {
  try {
    return stringify(step).trim()
  } catch {
    return ''
  }
}
