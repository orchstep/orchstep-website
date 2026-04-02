import React, { useMemo, useCallback, useEffect, useImperativeHandle, forwardRef } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  MiniMap,
  useReactFlow,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react'
import type { Node, NodeChange } from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { StepNode } from './nodes/StepNode'
import { TaskGroupNode } from './nodes/TaskGroupNode'
import { ConditionNode } from './nodes/ConditionNode'
import { LoopNode } from './nodes/LoopNode'
import { ModuleCallNode } from './nodes/ModuleCallNode'
import { ErrorHandlerNode } from './nodes/ErrorHandlerNode'
import { MergeDotNode } from './nodes/MergeDotNode'
import { CustomEdge } from './edges/CustomEdge'
import { computeLayout } from './layout/auto-layout'
import { getBestHandles, getAbsolutePosition } from './edge-routing'
import { resolveTaskCollision } from './collision'
import { recalcTaskBounds } from './task-bounds'
import { EDGE_COLORS, DARK_EDGE_COLORS } from '../theme'
import type { GraphNode, GraphEdge, Direction, Theme } from '../types'

const nodeTypes: Record<string, any> = {
  step: StepNode,
  task: TaskGroupNode,
  condition: ConditionNode,
  loop: LoopNode,
  'module-call': ModuleCallNode,
  'error-handler': ErrorHandlerNode,
  mergeDot: MergeDotNode,
}

const edgeTypes: Record<string, any> = {
  custom: CustomEdge,
}

interface WorkflowGraphProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  direction: Direction
  theme: Theme
  searchQuery: string
  minimapVisible: boolean
  collapsedTasks?: Set<string>
  onNodeSelect: (node: GraphNode | null, clickPos?: { x: number; y: number }) => void
  onToggleTask?: (taskId: string) => void
}

export interface WorkflowGraphHandle {
  fitView: () => void
  zoomIn: () => void
  zoomOut: () => void
}

const FlowControls = forwardRef<WorkflowGraphHandle, { direction: Direction }>(
  function FlowControls({ direction }, ref) {
    const { fitView, zoomIn, zoomOut } = useReactFlow()

    useImperativeHandle(ref, () => ({
      fitView: () => fitView({ padding: 0.1 }),
      zoomIn: () => zoomIn(),
      zoomOut: () => zoomOut(),
    }), [fitView, zoomIn, zoomOut])

    useEffect(() => {
      const t = setTimeout(() => fitView({ padding: 0.1 }), 50)
      return () => clearTimeout(t)
    }, [direction, fitView])

    return null
  }
)

/**
 * Compute edges with smart handle selection based on current node positions.
 */
function computeSmartEdges(
  graphEdges: GraphEdge[],
  flowNodes: Array<{ id: string; position: { x: number; y: number }; parentId?: string; style?: any }>,
  theme: Theme = 'light',
) {
  const colors = theme === 'dark' ? DARK_EDGE_COLORS : EDGE_COLORS
  return graphEdges.map((e) => {
    const sourceRect = getAbsolutePosition(e.source, flowNodes)
    const targetRect = getAbsolutePosition(e.target, flowNodes)
    const { sourceHandle, targetHandle } = getBestHandles(sourceRect, targetRect)

    return {
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle,
      targetHandle,
      type: 'custom' as const,
      data: { edgeType: e.type, label: e.label, color: colors[e.type] ?? '#999' },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 16,
        height: 16,
        color: colors[e.type] ?? '#999',
      },
    }
  })
}

const GraphInner = forwardRef<WorkflowGraphHandle, WorkflowGraphProps>(function GraphInner({
  nodes,
  edges,
  direction,
  theme,
  searchQuery,
  minimapVisible,
  collapsedTasks,
  onNodeSelect,
  onToggleTask,
}, ref) {
  const positioned = useMemo(
    () => computeLayout(nodes, edges, direction),
    [nodes, edges, direction],
  )

  const initialFlowNodes = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    const collapsed = collapsedTasks ?? new Set<string>()

    return positioned
      .filter((n) => {
        // If this node's parent task is collapsed, hide it (unless it's the task itself)
        if (n.parentId && collapsed.has(n.parentId)) return false
        return true
      })
      .map((n) => {
        const matches =
          !query ||
          n.data.label.toLowerCase().includes(query) ||
          (n.data.metadata.func ?? '').toLowerCase().includes(query)

        // For task nodes: inject collapse state and toggle callback
        const isTask = n.data.type === 'task'
        const isCollapsed = isTask && collapsed.has(n.id)

        return {
          ...n,
          data: isTask ? {
            ...n.data,
            collapsed: isCollapsed,
            onToggleCollapse: onToggleTask ? () => onToggleTask(n.id) : undefined,
          } : n.data,
          style: {
            ...n.style,
            // Collapsed tasks become compact
            ...(isCollapsed ? { height: 44, width: n.style?.width } : {}),
            opacity: query && !matches ? 0.2 : 1,
            transition: 'opacity 0.2s',
          },
        }
      })
  }, [positioned, searchQuery, collapsedTasks, onToggleTask])

  // Remap edges for collapsed tasks — extract as a function so drag handler can reuse
  const remapEdges = useCallback((flowNodesList: typeof initialFlowNodes) => {
    const visibleIds = new Set(flowNodesList.map(n => n.id))
    const collapsed = collapsedTasks ?? new Set<string>()

    const remappedEdges = edges.map(e => {
      let source = e.source
      let target = e.target

      if (!visibleIds.has(source)) {
        const sourceNode = nodes.find(n => n.id === source)
        if (sourceNode?.parentId && collapsed.has(sourceNode.parentId)) {
          source = sourceNode.parentId
        }
      }

      if (!visibleIds.has(target)) {
        const targetNode = nodes.find(n => n.id === target)
        if (targetNode?.parentId && collapsed.has(targetNode.parentId)) {
          target = targetNode.parentId
        }
      }

      if (!visibleIds.has(source) || !visibleIds.has(target)) return null
      if (source === target) return null

      return { ...e, id: `${e.id}:remapped`, source, target }
    }).filter((e): e is NonNullable<typeof e> => e !== null)

    const seen = new Set<string>()
    return remappedEdges.filter(e => {
      const key = `${e.source}->${e.target}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [edges, nodes, collapsedTasks])

  const initialFlowEdges = useMemo(() => {
    const remapped = remapEdges(initialFlowNodes)
    return computeSmartEdges(remapped, initialFlowNodes, theme)
  }, [initialFlowNodes, theme, remapEdges])

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(initialFlowNodes as any)
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(initialFlowEdges as any)

  // Sync when layout changes (new YAML, direction change, search)
  useEffect(() => {
    setFlowNodes(initialFlowNodes as any)
  }, [initialFlowNodes, setFlowNodes])

  useEffect(() => {
    setFlowEdges(initialFlowEdges as any)
  }, [initialFlowEdges, setFlowEdges])

  // Handle node changes: auto-resize tasks, recompute edges, resolve collisions
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes)

    const isDragging = changes.some(c => c.type === 'position' && c.dragging === true)
    const dragEnded = changes.some(c => c.type === 'position' && c.dragging === false)

    // Recompute edges during and after drag
    if (isDragging || dragEnded) {
      setTimeout(() => {
        setFlowNodes(currentNodes => {
          const remapped = remapEdges(currentNodes as any)
          const smartEdges = computeSmartEdges(remapped, currentNodes as any, theme)
          setFlowEdges(smartEdges as any)
          return currentNodes
        })
      }, 0)
    }

    // After any drag ends: auto-resize task containers + resolve collisions
    if (dragEnded) {
      setTimeout(() => {
        setFlowNodes(currentNodes => {
          let updated = [...currentNodes]
          let changed = false

          // 1. Auto-resize all task containers to fit their children
          const boundsResult = recalcTaskBounds(updated as any)
          if (boundsResult) {
            updated = boundsResult as any
            changed = true
          }

          // 2. Resolve task-to-task collisions
          for (const change of changes) {
            if (change.type === 'position' && !change.dragging && change.id) {
              const adjusted = resolveTaskCollision(change.id, updated as any)
              if (adjusted) {
                updated = updated.map(n =>
                  n.id === change.id ? { ...n, position: adjusted } : n
                )
                changed = true
              }
            }
          }

          // 3. Recalc bounds again after collision pushes
          if (changed) {
            const boundsResult2 = recalcTaskBounds(updated as any)
            if (boundsResult2) updated = boundsResult2 as any

            const remapped = remapEdges(updated as any)
            const smartEdges = computeSmartEdges(remapped, updated as any, theme)
            setFlowEdges(smartEdges as any)
          }
          return changed ? updated : currentNodes
        })
      }, 50)
    }
  }, [onNodesChange, edges, theme, remapEdges, setFlowNodes, setFlowEdges])

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: any) => {
      const graphNode = node.data as GraphNode
      onNodeSelect(graphNode, { x: event.clientX, y: event.clientY })
    },
    [onNodeSelect],
  )

  const onPaneClick = useCallback(() => {
    onNodeSelect(null)
  }, [onNodeSelect])

  return (
    <ReactFlow
      nodes={flowNodes}
      edges={flowEdges}
      onNodesChange={handleNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      fitView
      minZoom={0.1}
      maxZoom={2}
      nodesDraggable={true}
      proOptions={{ hideAttribution: true }}
    >
      <FlowControls ref={ref} direction={direction} />
      <Background gap={16} size={1} />
      {minimapVisible && (
        <MiniMap
          nodeStrokeWidth={3}
          style={{ background: 'var(--canvas-bg, #fafafa)' }}
        />
      )}
    </ReactFlow>
  )
})

export const WorkflowGraph = forwardRef<WorkflowGraphHandle, WorkflowGraphProps>(
  function WorkflowGraph(props, ref) {
    return (
      <ReactFlowProvider>
        <GraphInner ref={ref} {...props} />
      </ReactFlowProvider>
    )
  }
)
