---
title: wait
description: Pause workflow execution for rate limiting, progressive deployments, and timed delays
---

Pause workflow execution for a specified duration. Use for rate limiting, progressive deployments, and timed delays between operations.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `func` | string | yes | Must be `wait` |
| `args.duration` | string | yes | How long to wait (e.g., `5s`, `1m`, `500ms`) |

### Duration Format

| Format | Example | Description |
|--------|---------|-------------|
| `Ns` | `30s` | N seconds |
| `Nm` | `5m` | N minutes |
| `Nms` | `500ms` | N milliseconds |
| Combined | `1m30s` | 1 minute and 30 seconds |

## Return Values

| Field | Type | Description |
|-------|------|-------------|
| `result.output` | string | Confirmation message with wait duration |

## Examples

### Basic Delay

```yaml
steps:
  - name: deploy
    func: shell
    do: kubectl apply -f deployment.yml

  - name: wait_for_rollout
    func: wait
    args:
      duration: 30s

  - name: health_check
    func: http
    args:
      url: "https://{{ vars.env }}.example.com/health"
      method: GET
```

### Progressive Deployment

```yaml
steps:
  - name: deploy_canary
    func: shell
    do: |
      kubectl set image deployment/app app=app:{{ vars.version }}
      kubectl scale deployment/app-canary --replicas=1

  - name: observe_canary
    func: wait
    args:
      duration: 5m

  - name: check_canary
    func: http
    args:
      url: "https://{{ vars.env }}.example.com/health"
      method: GET

  - name: verify_canary
    func: assert
    args:
      condition: '{{ eq steps.check_canary.status_code 200 }}'
      desc: "Canary must be healthy before full rollout"

  - name: full_rollout
    func: shell
    do: kubectl scale deployment/app --replicas={{ vars.replicas }}
```

### Rate-Limited API Calls

```yaml
steps:
  - name: call_api
    func: http
    args:
      url: "https://api.example.com/process"
      method: POST
      body:
        batch: "{{ vars.batch_id }}"

  - name: rate_limit_pause
    func: wait
    args:
      duration: 1s

  - name: call_api_2
    func: http
    args:
      url: "https://api.example.com/process"
      method: POST
      body:
        batch: "{{ vars.batch_id_2 }}"
```

### Post-Migration Stabilization

```yaml
steps:
  - name: run_migration
    func: shell
    do: python manage.py migrate

  - name: stabilize
    func: wait
    args:
      duration: 10s

  - name: verify_schema
    func: shell
    do: python manage.py check --database default
```
