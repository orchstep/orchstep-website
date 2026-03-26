---
title: Module Registry
description: Search, install, and manage OrchStep modules from the registry
---

The OrchStep module registry lets you discover, install, and manage reusable workflow modules. Modules are distributed via Git repositories and versioned with semver.

## CLI Commands

### Search for Modules

```bash
orchstep module search ci-cd
```

Returns matching modules from the registry:

```
NAME            VERSION   DESCRIPTION
ci-cd           1.2.0     CI/CD pipeline module with build, test, deploy
aws-ecs-deploy  2.0.1     AWS ECS deployment module
slack-notify    1.0.3     Slack notification module
test-suite      1.1.0     Test runner with coverage reporting
```

### Install a Module

```bash
# Install specific version
orchstep module install github.com/your-org/ci-cd-module@v1.2.0

# Install latest compatible version
orchstep module install github.com/your-org/ci-cd-module@^1.0.0
```

Modules are installed to `~/.orchstep/modules/`.

### List Installed Modules

```bash
orchstep module list
```

```
NAME            VERSION   SOURCE
ci-cd           1.2.0     github.com/your-org/ci-cd-module
slack-notify    1.0.3     github.com/orchstep-modules/slack-notify
```

### Validate a Module

```bash
orchstep module validate ./my-module/
```

Checks that the module has valid `orchstep-module.yml` metadata, a valid `orchstep.yml` workflow, and consistent config schema.

## Using Modules in Workflows

Reference installed modules in your `orchstep.yml`:

```yaml
name: my-app-pipeline

modules:
  - name: ci-cd
    version: "^1.2.0"
    source: "github.com/your-org/ci-cd-module"
    config:
      registry_url: "registry.example.com"
      app_name: "my-app"
      replicas: 3
```

The module's exported tasks become available in your workflow. You can call them directly:

```bash
orchstep run ci-cd.deploy --var version=2.0.0
```

Or reference them from other tasks:

```yaml
tasks:
  release:
    steps:
      - name: build
        task: ci-cd.build
        with:
          version: "{{ vars.version }}"

      - name: test
        task: ci-cd.test

      - name: deploy
        task: ci-cd.deploy
        with:
          version: "{{ vars.version }}"
```

## Version Constraints

When specifying module versions, you can use semver constraints:

| Constraint | Meaning | Example Match |
|-----------|---------|---------------|
| `1.2.3` | Exact version | 1.2.3 only |
| `^1.2.0` | Compatible with 1.x.x | 1.2.0, 1.3.0, 1.9.9 |
| `~1.2.0` | Compatible with 1.2.x | 1.2.0, 1.2.5, 1.2.99 |
| `>=1.2.0` | Minimum version | 1.2.0, 2.0.0, 3.5.1 |

## MCP Integration

LLM agents can search and install modules via the MCP server:

```json
{
  "tool": "orchstep.module_search",
  "arguments": {
    "query": "ci-cd"
  }
}
```

```json
{
  "tool": "orchstep.module_install",
  "arguments": {
    "source": "github.com/your-org/ci-cd-module",
    "version": "^1.2.0"
  }
}
```

See the [MCP Server](/agents/mcp/) documentation for the complete API.

## Module Sources

Modules can be sourced from any Git repository:

```yaml
modules:
  # GitHub
  - source: "github.com/orchstep-modules/ci-cd"

  # GitLab
  - source: "gitlab.com/your-org/deploy-module"

  # Self-hosted
  - source: "git.internal.com/team/custom-module"
```

Private repositories are supported via token authentication:

```bash
# Set token for private module access
export ORCHSTEP_GIT_TOKEN=your-token
orchstep module install github.com/private-org/module@v1.0.0
```
