import {
  Terminal, Globe, CheckCircle, GitBranch, Shuffle, FileText,
  Clock, HelpCircle, GitFork, RefreshCw, Package, AlertTriangle,
  Shield, FolderOpen,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const NODE_COLORS: Record<string, string> = {
  shell: '#2d6a4f',
  http: '#4a90d9',
  assert: '#e76f51',
  git: '#6c757d',
  transform: '#555555',
  render: '#555555',
  wait: '#555555',
  default: '#555555',
  task: '#333333',
  condition: '#e9c46a',
  loop: '#9b59b6',
  'module-call': '#4a90d9',
  catch: '#e76f51',
  finally: '#6c757d',
}

export const NODE_ICONS: Record<string, LucideIcon> = {
  shell: Terminal,
  http: Globe,
  assert: CheckCircle,
  git: GitBranch,
  transform: Shuffle,
  render: FileText,
  wait: Clock,
  default: HelpCircle,
  task: FolderOpen,
  condition: GitFork,
  loop: RefreshCw,
  'module-call': Package,
  catch: AlertTriangle,
  finally: Shield,
}

export function getNodeColor(nodeType: string, func?: string): string {
  if (nodeType === 'step' && func) {
    return NODE_COLORS[func] || NODE_COLORS.default
  }
  return NODE_COLORS[nodeType] || NODE_COLORS.default
}

export function getNodeIcon(nodeType: string, func?: string): LucideIcon {
  if (nodeType === 'step' && func) {
    return NODE_ICONS[func] || NODE_ICONS.default
  }
  return NODE_ICONS[nodeType] || NODE_ICONS.default
}

export const EDGE_COLORS: Record<string, string> = {
  sequential: '#999999',
  'conditional-true': '#2d6a4f',
  'conditional-false': '#e76f51',
  'conditional-elif': '#e9c46a',
  'error-path': '#e76f51',
  'cleanup-path': '#6c757d',
  'task-call': '#333333',
  'module-call': '#4a90d9',
  'loop-body': '#9b59b6',
}

export const EDGE_STYLES: Record<string, string> = {
  sequential: 'solid',
  'conditional-true': 'solid',
  'conditional-false': 'solid',
  'conditional-elif': 'solid',
  'error-path': 'dashed',
  'cleanup-path': 'dashed',
  'task-call': 'dotted',
  'module-call': 'dotted',
  'loop-body': 'solid',
}

export const LIGHT_THEME = {
  '--canvas-bg': '#fafafa',
  '--node-bg': 'white',
  '--text-primary': '#111111',
  '--text-secondary': '#888888',
  '--edge-color': '#999999',
  '--panel-bg': 'white',
  '--panel-border': '#e0e0e0',
  '--shadow': '0 1px 3px rgba(0,0,0,0.06)',
  '--task-header-bg': '#f0f0f0',
  '--task-border': '#333333',
}

export const DARK_THEME = {
  '--canvas-bg': '#1a1a2e',
  '--node-bg': '#242438',
  '--text-primary': '#e0e0e0',
  '--text-secondary': '#888888',
  '--edge-color': '#aaaaaa',
  '--panel-bg': '#1e1e30',
  '--panel-border': '#333355',
  '--shadow': '0 1px 3px rgba(0,0,0,0.3)',
  '--task-header-bg': '#2a2a40',
  '--task-border': '#888888',
}

export const DARK_EDGE_COLORS: Record<string, string> = {
  sequential: '#e0e0e0',
  'conditional-true': '#5dd88a',
  'conditional-false': '#f09070',
  'conditional-elif': '#f0d060',
  'error-path': '#f09070',
  'cleanup-path': '#cccccc',
  'task-call': '#7ec8e3',
  'module-call': '#7ec8e3',
  'loop-body': '#cc90f0',
}
