---
title: Quick Start
description: Your first OrchStep workflow in 2 minutes
---

## Create a Workflow

Create `orchstep.yml`:

```yaml
name: hello
tasks:
  greet:
    steps:
      - name: say-hello
        func: shell
        do: echo "Hello from OrchStep!"
```

## Run It

```bash
orchstep run greet
```

> **Shell note:** OrchStep uses POSIX `sh` (`/bin/sh`) by default, so your workflows run on Alpine, distroless containers, and any Linux/macOS system without extra dependencies. On **Windows**, set `type: "gosh"` to use the built-in Go-native shell — no bash or WSL needed. See [Shell Execution](/spec/shell-execution) for details.

## Add Variables

```yaml
name: deploy
defaults:
  env: staging
  version: "1.0.0"

tasks:
  deploy:
    steps:
      - name: build
        func: shell
        do: echo "Building v{{ vars.version }} for {{ vars.env }}"
      - name: verify
        func: assert
        args:
          condition: '{{ ne vars.version "" }}'
          desc: "Version must not be empty"
```

```bash
orchstep run deploy
orchstep run deploy --var env=production --var version=2.0.0
```

## Next Steps

- Browse [examples](https://github.com/orchstep/orchstep/tree/main/examples) for real-world patterns
- Read the [function reference](/functions/shell) to see what's available
- Learn about [modules](/modules/overview) for reusable components
