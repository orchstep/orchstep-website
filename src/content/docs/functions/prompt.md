---
title: prompt
description: Interactive user input with text, password, select, confirm, and multiselect types
---

Collect interactive input from users during workflow execution. Supports text, password, select, confirm, and multiselect input types. Automatically skips prompts in non-interactive environments (CI/CD, LLM agents) using default values.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| message | string | Yes | The prompt message displayed to the user |
| type | string | No | Input type: `text` (default), `password`, `select`, `confirm`, `multiselect` |
| default | varies | No | Default value if user presses Enter or running non-interactively |
| options | array | For select/multiselect | List of choices |

## Return Values

| Field | Type | Description |
|-------|------|-------------|
| result.value | string | The user's input (or default in non-interactive mode) |
| result.type | string | The prompt type used |
| result.interactive | string | "true" if user was prompted, "false" if default was used |
| result.output | string | Same as value (for consistency with shell function) |

## Non-Interactive Mode

Prompts are automatically skipped when:
1. `ORCHSTEP_NON_INTERACTIVE=true` environment variable is set
2. stdin is not a terminal (piped input, CI/CD runners)
3. A `--var` matching the step name provides the value

This means the **same workflow** works both interactively (human at terminal) and non-interactively (CI/CD pipeline, LLM agent).

```bash
# Interactive — prompts appear
orchstep run deploy

# Non-interactive — prompts skipped, defaults used
ORCHSTEP_NON_INTERACTIVE=true orchstep run deploy

# Override specific prompt — skip that prompt, use provided value
orchstep run deploy --var environment=prod
```

## Examples

### Text Input
```yaml
- name: get_name
  func: prompt
  args:
    message: "Enter your name"
    type: text
    default: "World"
  outputs:
    name: "{{ result.value }}"
```

### Password (Masked)
```yaml
- name: get_password
  func: prompt
  args:
    message: "Database password"
    type: password
```

### Select (Single Choice)
```yaml
- name: choose_env
  func: prompt
  args:
    message: "Target environment"
    type: select
    options: [dev, staging, production]
    default: staging
```

### Confirm (Yes/No)
```yaml
- name: confirm_deploy
  func: prompt
  args:
    message: "Deploy to production?"
    type: confirm
    default: false
```

### Multiselect (Multiple Choices)
```yaml
- name: select_features
  func: prompt
  args:
    message: "Features to enable"
    type: multiselect
    options: [logging, monitoring, caching, cdn]
    default: [logging, monitoring]
```

### Full Workflow: Interactive Deployment

```yaml
name: interactive-deploy
desc: "Deployment with user confirmation"

defaults:
  app: "myapp"

tasks:
  deploy:
    steps:
      - name: environment
        func: prompt
        args:
          message: "Target environment"
          type: select
          options: [dev, staging, production]
          default: dev

      - name: version
        func: prompt
        args:
          message: "Version to deploy"
          type: text
          default: "latest"

      - name: confirm
        func: prompt
        args:
          message: "Deploy {{ defaults.app }} v{{ steps.version.value }} to {{ steps.environment.value }}?"
          type: confirm
          default: false

      - name: execute_deploy
        if: '{{ eq steps.confirm.value "true" }}'
        func: shell
        do: |
          echo "Deploying {{ defaults.app }} v{{ steps.version.value }} to {{ steps.environment.value }}..."
          echo "DEPLOY_STATUS=success"
```

## Design Philosophy

The prompt function bridges the gap between **interactive runbooks** (human at terminal) and **automated pipelines** (CI/CD, LLM agents):

- **For humans:** Rich prompts with defaults, validation, and confirmation before destructive actions
- **For automation:** Same workflow, same YAML — prompts silently use defaults or `--var` overrides
- **For LLM agents:** `ORCHSTEP_NON_INTERACTIVE=true` or provide all values via `--var`

This means you write ONE workflow that serves all three audiences.
