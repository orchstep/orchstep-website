---
title: Error Handling
description: Retry policies, catch/finally blocks, on_error modes, and timeout management in OrchStep
---

OrchStep provides try/catch/finally, retry with backoff, conditional retry, on-error modes, and timeout management.

## Retry

Automatically re-execute a failed step with configurable backoff.

### Configuration

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `max_attempts` | int | (required) | Maximum number of execution attempts |
| `interval` | string | `1s` | Base delay between attempts |
| `backoff_rate` | float | `2.0` | Multiplier applied to delay each attempt |
| `max_delay` | string | -- | Cap on computed delay |
| `jitter` | float | `0.0` | Random variation (0.0-1.0). `0.5` means +/-50% |
| `when` | string | -- | JavaScript condition. Only retry when true. |

### Backoff Calculation

```
delay = interval * (backoff_rate ^ (attempt - 1))
capped at max_delay if set

Example: interval=1s, backoff_rate=2.0, max_delay=30s
  Attempt 1->2: 1s
  Attempt 2->3: 2s
  Attempt 3->4: 4s
  Attempt 4->5: 8s
  Attempt 5->6: 16s
  Attempt 6->7: 30s (capped)
```

### Basic Retry

```yaml
steps:
  - name: api_call
    func: http
    args:
      url: "https://api.example.com/data"
      method: GET
    retry:
      max_attempts: 3
      interval: 2s
      backoff_rate: 2.0
```

### Conditional Retry

Only retry when the error is transient:

```yaml
steps:
  - name: fetch_data
    func: http
    args:
      url: "https://api.example.com/data"
      method: GET
    retry:
      max_attempts: 5
      interval: 1s
      backoff_rate: 2.0
      max_delay: 30s
      when: "result.status_code >= 500 || result.status_code == 429"
```

### Retry with Jitter

Prevent thundering herd by adding randomness to retry delays:

```yaml
steps:
  - name: distributed_call
    func: http
    args:
      url: "https://api.example.com/data"
      method: GET
    retry:
      max_attempts: 5
      interval: 1s
      backoff_rate: 2.0
      jitter: 0.5  # Delay varies +/-50% (e.g., 500ms to 1500ms for 1s base)
```

### When Condition Context

Available variables in `when` expressions:

```javascript
// Function result
result.output       // Command output (shell)
result.exit_code    // Exit code (shell)
result.status_code  // HTTP status code (http)
result.body         // Response body (http)
result.error        // Error message

// Retry state
retry.attempt       // Current attempt number (1, 2, 3...)
retry.max_attempts  // Maximum configured

// Workflow context
vars.*              // Workflow variables
steps.*             // Previous step outputs
```

## Catch

Execute recovery steps when a step (and all its retries) fails.

```yaml
steps:
  - name: deploy
    func: shell
    do: kubectl apply -f deployment.yml
    retry:
      max_attempts: 3
      interval: 5s
    catch:
      - name: rollback
        func: shell
        do: kubectl rollback deployment/app

      - name: notify
        func: http
        args:
          url: "https://hooks.slack.com/services/..."
          method: POST
          body:
            text: "Deployment failed, rolled back"
```

### Error Context in Catch

Access error details from the failed step:

```yaml
catch:
  - name: handle_error
    func: shell
    do: |
      echo "Failed step: {{ vars.error.step_name }}"
      echo "Exit code: {{ vars.error.exit_code }}"
      echo "Output: {{ vars.error.output }}"
      echo "Message: {{ vars.error.message }}"
      echo "Attempts: {{ vars.error.attempt }}"
```

## Finally

Steps that always execute, regardless of success or failure. Use for cleanup operations.

```yaml
steps:
  - name: process_data
    func: shell
    do: |
      echo "$$" > /tmp/process.pid
      ./process-data.sh
    timeout: 60s
    finally:
      - name: cleanup
        func: shell
        do: |
          kill $(cat /tmp/process.pid) 2>/dev/null || true
          rm -f /tmp/process.pid
```

## Execution Order

```
Success: Execute -> (Maybe Retry) -> Finally
Failure: Execute -> Retry (N times) -> Catch -> Finally
Catch Failure: Execute -> Retry -> Catch (fails) -> Finally (still runs)
```

## on_error Modes

Control workflow continuation when a step fails.

| Mode | Behavior | Use Case |
|------|----------|----------|
| `fail` (default) | Stop workflow execution | Critical operations |
| `ignore` | Continue, suppress error | Best-effort notifications |
| `warn` | Continue, track as warning | Optional quality checks |

### Usage

```yaml
steps:
  # Critical: must succeed
  - name: build
    func: shell
    do: npm run build
    # on_error: fail (default)

  # Optional: tracked but not blocking
  - name: lint
    func: shell
    do: eslint .
    on_error: warn

  # Best-effort: failure is acceptable
  - name: notify_slack
    func: http
    args:
      url: "https://hooks.slack.com/services/..."
      method: POST
    on_error: ignore

  # Check warning status
  - name: report
    func: shell
    do: |
      if [ "{{ steps.lint.status }}" = "warning" ]; then
        echo "Linting had issues: {{ steps.lint.error }}"
      fi
```

### on_error with Retry

The `on_error` mode applies after all retry attempts are exhausted:

```yaml
steps:
  - name: optional_api
    func: http
    args:
      url: "https://api.example.com/optional"
      method: GET
    retry:
      max_attempts: 3
      interval: 1s
    on_error: ignore  # If all 3 attempts fail, continue anyway
```

## Timeout Management

### Per-Step Timeout

```yaml
steps:
  - name: api_call
    func: shell
    do: curl https://api.example.com/data
    timeout: 30s
```

### Total Timeout (Including Retries)

```yaml
steps:
  - name: bounded_operation
    func: shell
    do: ./long-running-script.sh
    timeout: 5s           # Each attempt: 5s max
    total_timeout: 15s    # Entire step including retries: 15s max
    retry:
      max_attempts: 10    # May not complete all attempts within total_timeout
      interval: 1s
```

### Timeout with Catch

```yaml
steps:
  - name: primary_service
    func: shell
    do: ./primary-service.sh
    timeout: 10s
    catch:
      - name: fallback
        func: shell
        do: |
          echo "Primary timed out, using fallback"
          ./fallback-service.sh
```

## Combined Example

```yaml
steps:
  - name: deploy_app
    func: shell
    do: kubectl apply -f deployment.yml
    timeout: 60s
    retry:
      max_attempts: 3
      interval: 5s
      backoff_rate: 2.0
      when: "result.exit_code != 0 && !result.output.includes('invalid')"
    catch:
      - name: rollback
        func: shell
        do: kubectl rollback deployment/app
      - name: alert
        func: http
        args:
          url: "https://alerts.example.com/webhook"
          method: POST
          body:
            severity: critical
            message: "Deployment failed after 3 attempts"
    finally:
      - name: cleanup_temp
        func: shell
        do: rm -rf /tmp/deploy-artifacts
    on_error: fail
```

## Patterns by Scenario

### Quick Operations (< 5s)

```yaml
retry:
  max_attempts: 3
  interval: 100ms
  backoff_rate: 2.0
```

### Standard Operations (5-30s)

```yaml
retry:
  max_attempts: 5
  interval: 1s
  backoff_rate: 2.0
  max_delay: 10s
```

### Long Operations (> 30s)

```yaml
retry:
  max_attempts: 5
  interval: 5s
  backoff_rate: 1.5
  max_delay: 60s
```

### Distributed Systems (prevent thundering herd)

```yaml
retry:
  max_attempts: 5
  interval: 1s
  backoff_rate: 2.0
  max_delay: 30s
  jitter: 0.5
```

## Loop Error Handling

Loops have their own `on_error` modes:

| Mode | Behavior |
|------|----------|
| `fail` (default) | Stop loop on first error |
| `continue` | Skip failed iteration, continue loop |
| `break` | Stop loop gracefully (no error thrown) |

```yaml
steps:
  - name: deploy_servers
    loop:
      items: "{{ vars.servers }}"
      on_error: continue
      collect_errors: true
    func: shell
    do: deploy.sh {{ loop.item }}
```
