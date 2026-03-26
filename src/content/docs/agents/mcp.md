---
title: MCP Server
description: OrchStep as a Model Context Protocol server for native LLM agent integration
---

The OrchStep MCP (Model Context Protocol) server provides native LLM agent integration, exposing OrchStep functionality as tools that agents can call directly.

## Starting the MCP Server

```bash
orchstep mcp serve
```

The server exposes OrchStep functionality as MCP tools that LLM agents can call directly.

## Available Tools

### orchstep.run

Execute a workflow task.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task` | string | yes | Task name to execute |
| `vars` | object | no | Variables to pass (key-value pairs) |
| `vars_file` | string | no | Path to variables file |
| `format` | string | no | Output format: `json` (default), `text` |
| `log_level` | string | no | Logging level: `debug`, `info`, `warn`, `error` |

**Example call:**
```json
{
  "tool": "orchstep.run",
  "arguments": {
    "task": "deploy",
    "vars": {
      "environment": "production",
      "version": "2.0.0"
    },
    "format": "json"
  }
}
```

**Response:**
```json
{
  "task": "deploy",
  "status": "success",
  "duration": "12.5s",
  "steps": [
    {
      "name": "build",
      "status": "success",
      "outputs": { "image_tag": "app:2.0.0" }
    }
  ]
}
```

### orchstep.list_tasks

List available tasks in the current workflow.

**Parameters:** None

**Response:**
```json
{
  "tasks": [
    { "name": "deploy", "description": "Deploy the application" },
    { "name": "rollback", "description": "Rollback to previous version" },
    { "name": "health", "description": "Run health checks" }
  ]
}
```

### orchstep.lint

Validate a workflow file.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | no | Path to workflow file (defaults to `orchstep.yml`) |

**Response:**
```json
{
  "valid": true,
  "warnings": [
    {
      "type": "duplicate_variable",
      "message": "Variable 'region' duplicated at step level",
      "location": "tasks.deploy.steps[2].vars.region"
    }
  ],
  "errors": []
}
```

### orchstep.module_search

Search the module registry.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | yes | Search term |

**Response:**
```json
{
  "modules": [
    {
      "name": "ci-cd",
      "version": "1.2.0",
      "description": "CI/CD pipeline module",
      "source": "github.com/orchstep-modules/ci-cd"
    }
  ]
}
```

### orchstep.module_install

Install a module from the registry.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `source` | string | yes | Module source (e.g., `github.com/org/module`) |
| `version` | string | no | Version constraint (e.g., `^1.2.0`) |

**Response:**
```json
{
  "installed": true,
  "name": "ci-cd",
  "version": "1.2.0",
  "path": "~/.orchstep/modules/ci-cd"
}
```

### orchstep.workflow_generate

Scaffold a workflow from a natural language description.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `description` | string | yes | What the workflow should do |
| `output` | string | no | Output file path (defaults to stdout) |

**Example call:**
```json
{
  "tool": "orchstep.workflow_generate",
  "arguments": {
    "description": "Build a Docker image, run tests, deploy to staging, run health checks, then promote to production"
  }
}
```

**Response:** Generated `orchstep.yml` content.

### orchstep.version

Get version and edition information.

**Parameters:** None

**Response:**
```json
{
  "version": "1.0.0",
  "edition": "community",
  "go_version": "1.25.5"
}
```

## Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| `TASK_NOT_FOUND` | Task name does not exist | Call `list_tasks` to see available tasks |
| `VALIDATION_ERROR` | Workflow YAML is invalid | Call `lint` to get detailed errors |
| `EXECUTION_ERROR` | Step failed during execution | Check step outputs and error messages |
| `TIMEOUT` | Operation exceeded time limit | Increase timeout or optimize the step |
| `MODULE_NOT_FOUND` | Module not found in registry | Check module name and source URL |
| `VARIABLE_ERROR` | Required variable not provided | Pass the variable via `vars` parameter |

## Usage Patterns

### Pattern 1: Discover and Run

First discover available tasks, then run the appropriate one:

```
1. Call orchstep.list_tasks -> get available tasks
2. Call orchstep.run with task="deploy", vars={env: "staging"}
3. Check response status
4. If failed, inspect step outputs for error details
```

### Pattern 2: Validate Before Running

```
1. Call orchstep.lint -> check for errors
2. If warnings exist, review them
3. Call orchstep.run -> execute workflow
```

### Pattern 3: Module-Based Workflow

```
1. Call orchstep.module_search with query="ci-cd"
2. Call orchstep.module_install with source and version
3. Call orchstep.run to execute module tasks
```

### Pattern 4: Generate and Execute

```
1. Call orchstep.workflow_generate with description
2. Review generated workflow
3. Call orchstep.lint to validate
4. Call orchstep.run to execute
```

### Pattern 5: Iterative Debugging

```
1. Call orchstep.run with log_level="debug"
2. If failed, examine step outputs and error messages
3. Fix the issue (edit workflow, add variables, etc.)
4. Re-run with orchstep.run
```

## MCP Client Configuration

### Claude Desktop

```json
{
  "mcpServers": {
    "orchstep": {
      "command": "orchstep",
      "args": ["mcp", "serve"],
      "cwd": "/path/to/project"
    }
  }
}
```

### Generic MCP Client

```json
{
  "servers": [
    {
      "name": "orchstep",
      "transport": "stdio",
      "command": "orchstep mcp serve"
    }
  ]
}
```

## Tips for LLM Agents

- Always call `list_tasks` first to understand what's available
- Use `lint` before `run` to catch issues early
- Pass `format: "json"` to `run` for structured, parseable output
- When a run fails, check the `steps` array in the response for which step failed and why
- Use `module_search` to find reusable modules before writing workflows from scratch
- Use `workflow_generate` to scaffold new workflows from descriptions, then refine
- Set `log_level: "debug"` when troubleshooting failures
