---
title: Parallel Execution
description: Run multiple steps concurrently using parallel blocks
---

# Parallel Execution

Run multiple steps concurrently using `parallel:` blocks. Steps inside a parallel block execute simultaneously, and their outputs merge back for subsequent sequential steps.

## Syntax

```yaml
steps:
  - name: build_all
    parallel:
      - name: build_frontend
        func: shell
        do: |
          echo "Building frontend..."
          echo "FRONTEND_RESULT=success"
        outputs:
          result: '{{ result.output | regexFind "FRONTEND_RESULT=(.+)" }}'

      - name: build_backend
        func: shell
        do: |
          echo "Building backend..."
          echo "BACKEND_RESULT=success"
        outputs:
          result: '{{ result.output | regexFind "BACKEND_RESULT=(.+)" }}'

  - name: deploy
    func: shell
    do: |
      echo "Frontend: {{ steps.build_frontend.result }}"
      echo "Backend: {{ steps.build_backend.result }}"
```

## How It Works

1. Steps inside `parallel:` launch concurrently (one goroutine per step)
2. Each parallel step gets an **isolated copy** of the variable context
3. The parallel block waits for **all** children to complete
4. Outputs from all children **merge** into the main context
5. Sequential steps after the block can reference any parallel step's outputs

## Error Handling

If any parallel step fails, the entire block fails. All steps run to completion — failures are collected and reported after all finish.

## Constraints

- Parallel steps should be **independent** — they cannot reference each other's outputs
- Each step gets a snapshot of variables from before the block — mutations don't cross between parallel steps
- Nested parallel blocks are supported but use with caution
- Step names must be unique across the entire task (including inside parallel blocks)

## Use Cases

- Build multiple artifacts simultaneously
- Run health checks on multiple services at once
- Execute independent validation steps in parallel
- Fan-out operations across multiple targets
