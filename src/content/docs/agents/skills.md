---
title: Skills
description: Skill documents for teaching LLM agents how to use OrchStep effectively
---

OrchStep provides skill documents that teach LLM agents domain-specific knowledge about workflow authoring, MCP integration, and module creation. Skills are structured instruction sets that agents load to become proficient with OrchStep.

## Available Skills

### orchstep-workflow-authoring

Teaches agents how to write OrchStep YAML workflows. Covers the complete workflow syntax including:

- Workflow structure (`name`, `desc`, `vars`, `tasks`, `steps`)
- All available functions (`shell`, `http`, `assert`, `transform`, `render`, `wait`)
- Variable scoping and precedence (4 levels)
- Control flow (if/elif/else, switch/case, loops)
- Error handling (retry, catch, finally, on_error)
- Output extraction with Go templates and regex
- Task calling with parameter passing

**Use when:** Building deployment pipelines, automation runbooks, or multi-step operational workflows.

### orchstep-mcp-integration

Teaches agents how to use the OrchStep MCP server. Covers:

- Starting the MCP server (`orchstep mcp serve`)
- Available tools (`run`, `list_tasks`, `lint`, `module_search`, `module_install`, `workflow_generate`, `version`)
- Tool parameters, response formats, and error codes
- Usage patterns (discover-and-run, validate-before-running, module-based, generate-and-execute)
- Client configuration for Claude Desktop and generic MCP clients

**Use when:** Building AI-powered automation that orchestrates workflows, manages modules, or generates workflow definitions.

### orchstep-module-creation

Teaches agents how to create reusable OrchStep modules. Covers:

- Module structure (`orchstep-module.yml` + `orchstep.yml`)
- Module metadata (name, version, description, author, license)
- Config schema (required/optional parameters with types, defaults, validation)
- Exported tasks and dependencies
- Versioning with semver
- Publishing and distribution via Git
- Module patterns (infrastructure, notification, testing)

**Use when:** Packaging deployment patterns, operational runbooks, or infrastructure automation for distribution.

## How Skills Work

Skills are loaded by LLM agents as context when they need to perform OrchStep-related tasks. The skill document provides:

1. **Quick reference** -- concise syntax reminders for common operations
2. **Complete API** -- all parameters, return values, and options
3. **Patterns** -- proven workflows for common scenarios (deploy pipelines, CI/CD, etc.)
4. **Anti-patterns** -- common mistakes to avoid

## Skill Integration

Skills are distributed in the [orchstep-public](https://github.com/orchstep/orchstep-public) repository under the `skills/` directory. Any LLM agent framework that supports skill/instruction loading can use them.

Each skill follows a standard format:

```yaml
---
name: skill-name
description: When to use this skill
---

# Skill Title

Structured instructions and reference material...
```
