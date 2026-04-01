---
title: Stdin & Pipes
description: Pipe data from external commands into OrchStep workflows
---

Pipe data from any command into an OrchStep workflow. Data is auto-detected as JSON, YAML, or plain text and made available via the `{{ stdin }}` namespace.

## Basic Usage

```bash
# Pipe plain text
echo "hello world" | orchstep run
# {{ stdin }} = "hello world"

# Pipe JSON (auto-parsed)
echo '{"status":"healthy","version":"2.1.0"}' | orchstep run
# {{ stdin.status }} = "healthy"
# {{ stdin.version }} = "2.1.0"

# Pipe from any command
curl -s https://api.example.com/health | orchstep run check
terraform output -json | orchstep run validate
```

---

## Auto-Detection

OrchStep automatically detects the format of piped data:

| Priority | Format | Detection | Access |
|----------|--------|-----------|--------|
| 1 | JSON | Valid JSON object or array | `{{ stdin.field }}` |
| 2 | YAML | Valid YAML map or list | `{{ stdin.field }}` |
| 3 | Text | Fallback | `{{ stdin }}` (string) |

```yaml
# JSON input: {"name": "myapp", "replicas": 3}
steps:
  - name: deploy
    func: shell
    do: |
      echo "Deploying {{ stdin.name }} with {{ stdin.replicas }} replicas"
```

---

## The {{ stdin }} Namespace

Piped data lives in its own `stdin` namespace, separate from `vars`, `env`, and `steps`:

```yaml
steps:
  # Access the full input
  - name: raw
    func: shell
    do: echo "Full input: {{ stdin }}"

  # Access structured fields (JSON or YAML)
  - name: field
    func: shell
    do: echo "Status: {{ stdin.status }}"

  # Use in conditions
  - name: check
    func: assert
    args:
      condition: '{{ eq stdin.status "healthy" }}'

  # Use in loops (if stdin is an array)
  - name: iterate
    loop: '{{ stdin }}'
    func: shell
    do: echo "Item: {{ loop.item.name }}"
```

When no data is piped (running from a terminal), `{{ stdin }}` resolves to an empty string. Workflows work identically whether piped or not.

---

## Named Variables with --stdin-var

Use `--stdin-var` to inject piped data as a named variable in the `vars` namespace:

```bash
curl -s api/health | orchstep run check --stdin-var response
```

```yaml
steps:
  - name: check
    func: shell
    do: |
      # Access via vars namespace
      echo "Status: {{ vars.response.status }}"

      # stdin namespace also works
      echo "Status: {{ stdin.status }}"
```

The named variable participates in normal variable precedence. You can override specific fields:

```bash
echo '{"env":"prod"}' | orchstep run deploy --stdin-var config --var config.env=staging
# {{ vars.config.env }} = "staging" (--var wins)
# {{ stdin.env }} = "prod" (stdin always reflects piped data)
```

---

## Pipeline Chaining

OrchStep works as a composable citizen in Unix pipelines:

```bash
# Infrastructure validation
terraform output -json | orchstep run validate-infra --stdin-var tf

# API health checking
curl -s https://api.example.com/health | orchstep run check-health

# Repository analysis
gh api repos/myorg/myrepo | orchstep run analyze --stdin-var repo

# Configuration processing
cat config.yml | orchstep run apply-config --stdin-var config
```

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| No pipe (terminal) | `{{ stdin }}` = `""`, workflow runs normally |
| Empty pipe | `{{ stdin }}` = `""` |
| Trailing newline | Trimmed (like shell `$()` substitution) |
| JSON array | Stored as array, use `{{ index stdin 0 }}` |
| Multi-doc YAML | First document only |
| Binary data | Stored as string (no special handling) |

---

## Interaction with Prompts

When data is piped in, stdin is consumed by the pipe reader. Interactive prompts automatically fall back to non-interactive mode (using defaults or `--var` overrides). This is the same behavior as setting `ORCHSTEP_NON_INTERACTIVE=true`.
