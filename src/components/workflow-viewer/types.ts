export type NodeType = 'task' | 'step' | 'condition' | 'loop' | 'module-call' | 'error-handler' | 'merge-dot'

export type Direction = 'TB' | 'LR' | 'AUTO'

export type Theme = 'light' | 'dark'

export interface LoopInfo {
  items?: string
  count?: number
  range?: [number, number]
  as?: string
  onError?: string
  until?: string
  delay?: string
}

export interface RetryInfo {
  maxAttempts: number
  interval?: string
  backoffRate?: number
  maxDelay?: string
  jitter?: number
  when?: string
}

export interface NodeMetadata {
  func?: string
  command?: string
  description?: string
  condition?: string
  loopConfig?: LoopInfo
  retry?: RetryInfo
  timeout?: string
  totalTimeout?: string
  outputs?: Record<string, string>
  variables?: Record<string, unknown>
  env?: Record<string, unknown>
  with?: Record<string, unknown>
  catch?: boolean
  finally?: boolean
  moduleSource?: string
  moduleName?: string
  taskRef?: string
  yamlSnippet?: string
  stepCount?: number
  onError?: string
  elifBranches?: Array<{ condition: string; taskOrSteps: string }>
}

export type EdgeType =
  | 'sequential'
  | 'conditional-true'
  | 'conditional-false'
  | 'conditional-elif'
  | 'error-path'
  | 'cleanup-path'
  | 'loop-body'
  | 'task-call'
  | 'module-call'

export interface GraphNode {
  id: string
  type: NodeType
  label: string
  parentId?: string
  metadata: NodeMetadata
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  type: EdgeType
  label?: string
}

export interface ParseResult {
  nodes: GraphNode[]
  edges: GraphEdge[]
  errors: ParseError[]
}

export interface ParseError {
  message: string
  line?: number
  severity: 'error' | 'warning'
}

export interface WorkflowViewerProps {
  yaml: string
  direction?: Direction
  theme?: Theme
  onNodeClick?: (node: GraphNode) => void
  collapsed?: boolean
  interactive?: boolean
  className?: string
}
