---
title: Shell Execution
description: Cross-platform shell support with POSIX sh default and Go-native gosh
---

OrchStep supports multiple shell types for executing commands in `do:` blocks. The default is POSIX `sh` for maximum portability across Linux, macOS, Docker containers, and CI/CD environments.

## Shell Types

| Type | Engine | Requires | Best For |
|------|--------|----------|----------|
| `shell` (default) | `/bin/sh` | Present on all Unix systems | Maximum portability — Alpine, distroless, all Linux/macOS |
| `gosh` | Go-native (mvdan/sh) | Nothing — built into binary | True cross-platform — Windows without bash, single binary deployments |
| `bash` | `/bin/bash` | bash installed | When you need bash-specific features (arrays, `[[ ]]`, process substitution) |
| `zsh` | `/bin/zsh` | zsh installed | macOS default shell features |
| `pwsh` | PowerShell | pwsh installed | PowerShell scripting |

## Why `shell` (sh) is the Default

- **Alpine Linux** (the #1 Docker base image) has no bash — only `/bin/sh`
- **Distroless containers** have `/bin/sh` but not bash
- **All CI/CD runners** (GitHub Actions, GitLab CI, Jenkins) have `/bin/sh`
- **90%+ of OrchStep `do:` blocks** use POSIX-compatible commands (echo, pipes, variables)
- Zero friction — works everywhere without installing additional packages

## Using `gosh` (Go-Native Shell)

`gosh` is OrchStep's built-in Go shell interpreter powered by [mvdan/sh](https://github.com/mvdan/sh). It executes shell commands in pure Go — no external shell binary needed.

### When to Use gosh

- **Windows** — run the same POSIX shell scripts without installing bash/WSL
- **Minimal containers** — no shell binary needed at all
- **Single binary deployment** — orchstep binary is completely self-contained
- **Sandboxed environments** — no exec to external processes

### gosh Compatibility

gosh supports ~95% of bash syntax:
- Variable expansion: `$VAR`, `${VAR:-default}`, `${#VAR}`
- Command substitution: `$(command)`
- Pipes and redirects: `|`, `>`, `>>`, `2>&1`
- Conditionals: `if/then/else/fi`, `[ ]`, `[[ ]]`
- Loops: `for`, `while`, `until`
- Arithmetic: `$(( ))`
- Functions, arrays, 74+ builtins

### Known Limitations

- No real `fork()` — subshells use goroutines
- Some bash edge cases with associative arrays
- External commands must be on PATH

## Configuration

Set the shell type at any level — more specific overrides less specific.

### Global (applies to all workflows)

`.orchstep/orchstep_config.yml`:
```yaml
func:
  shell:
    type: "gosh"    # Use Go-native shell everywhere
```

### Workflow Level (inline config)

```yaml
name: my-workflow
config:
  func:
    shell:
      type: "gosh"

tasks:
  deploy:
    steps:
      - name: build
        func: shell
        do: echo "This runs in gosh"
```

### Function Level (per-step override)

```yaml
steps:
  - name: portable-step
    func: shell
    args:
      type: "gosh"
      cmd: echo "This specific step uses gosh"

  - name: bash-step
    func: shell
    args:
      type: "bash"
      cmd: echo "This step needs real bash"
```

## Examples

### Cross-Platform Workflow (Windows + Linux + macOS)

```yaml
name: cross-platform-build
desc: "Works on any OS without bash"
config:
  func:
    shell:
      type: "gosh"

defaults:
  version: "1.0.0"

tasks:
  build:
    steps:
      - name: compile
        func: shell
        do: |
          echo "Building v$version..."
          echo "Platform: $(uname -s 2>/dev/null || echo Windows)"
          echo "BUILD_STATUS=success"
        outputs:
          status: '{{ result.output | regexFind "BUILD_STATUS=(.+)" }}'
```

### Mixed Shell Types

```yaml
name: mixed-shells
desc: "Different shells for different steps"

tasks:
  deploy:
    steps:
      - name: check-env
        func: shell
        do: echo "Using default shell (sh)"

      - name: bash-specific
        func: shell
        args:
          type: "bash"
          cmd: |
            declare -A config
            config[env]="production"
            echo "Bash arrays: ${config[env]}"

      - name: portable
        func: shell
        args:
          type: "gosh"
          cmd: echo "Go-native shell — no external deps"
```
