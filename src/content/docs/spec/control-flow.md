---
title: Control Flow
description: Conditionals, loops, switch/case, and task calling in OrchStep workflows
---

OrchStep provides conditionals, loops, switch/case, and task calling for workflow branching and iteration.

## Conditionals (if/elif/else)

### Simple If (Skip When False)

```yaml
steps:
  - name: cleanup
    if: '{{ vars.clear_cache }}'
    func: shell
    do: rm -rf /tmp/cache/*
```

Step is skipped when the condition evaluates to false.

### If/Else with Inline Steps

```yaml
steps:
  - name: deploy
    if: '{{ eq vars.environment "production" }}'
    then:
      - name: deploy_prod
        func: shell
        do: echo "Production deployment with approval"
    else:
      then:
        - name: deploy_staging
          func: shell
          do: echo "Staging deployment"
```

### If/Elif/Else Chains

```yaml
steps:
  - name: set_log_level
    if: '{{ eq vars.environment "production" }}'
    then:
      - func: shell
        do: echo "LOG_LEVEL=error"
    elif:
      - if: '{{ eq vars.environment "staging" }}'
        then:
          - func: shell
            do: echo "LOG_LEVEL=warn"
      - if: '{{ eq vars.environment "development" }}'
        then:
          - func: shell
            do: echo "LOG_LEVEL=debug"
    else:
      then:
        - func: shell
          do: echo "LOG_LEVEL=info"
```

### If/Else with Task References

```yaml
steps:
  - name: deploy
    if: '{{ eq vars.environment "production" }}'
    then: deploy_production
    else: deploy_staging
```

### Condition Syntax

**Go Template expressions** (wrapped in `{{ }}`):

| Operator | Example |
|----------|---------|
| `eq` | `'{{ eq vars.env "prod" }}'` |
| `ne` | `'{{ ne vars.status "failed" }}'` |
| `gt`, `ge` | `'{{ gt vars.count 10 }}'` |
| `lt`, `le` | `'{{ lt vars.timeout 30 }}'` |
| `and` | `'{{ and (eq vars.env "prod") (gt vars.replicas 2) }}'` |
| `or` | `'{{ or (eq vars.mode "test") (eq vars.mode "dev") }}'` |
| `not` | `'{{ not (empty vars.name) }}'` |

**JavaScript expressions** (no `{{ }}` wrapper):

```yaml
if: 'vars.count > 10 && vars.env === "production"'
```

## Switch/Case

For multi-way branching based on a single value:

```yaml
steps:
  - name: route_deploy
    switch:
      value: '{{ vars.environment }}'
      cases:
        - when: 'production'
          then:
            - func: shell
              do: echo "Blue-green deploy"
        - when: 'staging'
          then:
            - func: shell
              do: echo "Rolling deploy"
        - when: ['development', 'testing']
          then:
            - func: shell
              do: echo "Direct deploy"
      default:
        - func: shell
          do: echo "Unknown environment"
```

### Multi-Value Matching

Use arrays to match multiple values in a single case:

```yaml
switch:
  value: '{{ vars.status_code }}'
  cases:
    - when: [200, 201, 204]
      then:
        - func: shell
          do: echo "Success"
    - when: [400, 401, 403, 404]
      then:
        - func: shell
          do: echo "Client error"
    - when: [500, 502, 503]
      then:
        - func: shell
          do: echo "Server error, retry"
```

### Switch with Task References

```yaml
switch:
  value: '{{ vars.deploy_strategy }}'
  cases:
    - when: 'blue_green'
      task: deploy_blue_green
    - when: 'canary'
      task: deploy_canary
    - when: 'rolling'
      task: deploy_rolling
  default:
    - task: deploy_standard
```

## Loops

### Simple List Iteration

```yaml
steps:
  - name: deploy_regions
    loop: ["us-east-1", "eu-west-1", "ap-southeast-1"]
    func: shell
    do: echo "Deploying to {{ loop.item }}"
```

### Variable-Based List

```yaml
defaults:
  servers: ["web1", "web2", "web3"]

steps:
  - name: restart
    loop: "{{ vars.servers }}"
    func: shell
    do: ssh {{ loop.item }} "systemctl restart app"
```

### Loop Variables

| Variable | Type | Description |
|----------|------|-------------|
| `loop.item` | any | Current item value |
| `loop.index` | int | Zero-based index (0, 1, 2...) |
| `loop.index1` | int | One-based index (1, 2, 3...) |
| `loop.first` | bool | True for first iteration |
| `loop.last` | bool | True for last iteration |
| `loop.length` | int | Total number of items |
| `loop.iteration` | int | Alias for `loop.index1` |

### Full Loop Configuration

```yaml
steps:
  - name: process
    loop:
      items: "{{ vars.servers }}"
      as: server                   # Custom name (access via loop.server)
      on_error: continue           # fail | continue | break
      until: '{{ eq loop.server.status "active" }}'  # Break condition
      timeout: "30s"               # Per-iteration timeout
      delay: "2s"                  # Delay between iterations
      collect_errors: true         # Save error details
    func: shell
    do: deploy.sh {{ loop.server.host }}
```

### Count-Based Loop

```yaml
steps:
  - name: retry_check
    loop: 5
    func: shell
    do: echo "Attempt {{ loop.iteration }} of {{ loop.length }}"
```

### Range Loop

```yaml
steps:
  - name: scale
    loop:
      range: [1, 10, 2]  # 1, 3, 5, 7, 9
    func: shell
    do: echo "Instance {{ loop.item }}"
```

### Loop with Condition (Filter)

```yaml
defaults:
  servers:
    - name: web1
      enabled: true
    - name: web2
      enabled: false
    - name: db1
      enabled: true

steps:
  - name: deploy_enabled
    loop: "{{ vars.servers }}"
    if: '{{ loop.item.enabled }}'
    func: shell
    do: echo "Deploying {{ loop.item.name }}"
```

### Until Condition

Stop the loop when a condition becomes true:

```yaml
steps:
  - name: wait_for_ready
    loop:
      count: 30
      until: '{{ contains steps.wait_for_ready.output "READY" }}'
      delay: "2s"
    func: shell
    do: curl -s http://service/health
```

### Loop with Task Call

```yaml
tasks:
  deploy_all:
    steps:
      - name: deploy_regions
        loop:
          items: "{{ vars.regions }}"
          as: region
          on_error: continue
        task: deploy_single
        with:
          region_name: "{{ loop.region.name }}"
          replicas: "{{ loop.region.replicas }}"

  deploy_single:
    steps:
      - func: shell
        do: deploy {{ vars.region_name }} --replicas {{ vars.replicas }}
```

## Task Calling

### Basic Task Call

```yaml
tasks:
  main:
    steps:
      - name: run_deploy
        task: deploy_service

  deploy_service:
    steps:
      - func: shell
        do: echo "Deploying..."
```

### Task Call with Parameters

Use `with:` to pass parameters that override the called task's defaults:

```yaml
tasks:
  main:
    steps:
      - name: deploy_staging
        task: deploy
        with:
          environment: staging
          replicas: 2

      - name: deploy_production
        task: deploy
        with:
          environment: production
          replicas: 5

  deploy:
    vars:
      environment: dev
      replicas: 1
    steps:
      - func: shell
        do: echo "Deploying to {{ vars.environment }} ({{ vars.replicas }} replicas)"
```

## Output Encapsulation

Inner steps of conditional/switch blocks are isolated. Expose outputs via the parent `outputs:` field:

```yaml
steps:
  - name: get_config
    if: '{{ eq vars.env "production" }}'
    then:
      - name: load_prod
        func: shell
        do: echo "prod-config-123"
        outputs:
          config_id: "{{ result.output }}"
    else:
      then:
        - name: load_dev
          func: shell
          do: echo "dev-config-456"
          outputs:
            config_id: "{{ result.output }}"
    outputs:
      final_config: '{{ steps.load_prod.config_id || steps.load_dev.config_id }}'

  - name: use_config
    func: shell
    do: echo "Using {{ steps.get_config.final_config }}"
```
