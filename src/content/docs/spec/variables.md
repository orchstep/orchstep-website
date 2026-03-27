---
title: Variables
description: Variable scoping, precedence, and interpolation in OrchStep workflows
---

OrchStep uses a 4-level variable hierarchy. When the same variable name exists at multiple levels, the highest-precedence value wins.

## Precedence (Highest to Lowest)

```
1. Runtime variables   --var key=value        (highest)
2. Step variables      steps: > vars:
3. Task variables      tasks: > vars:
4. Definition variables  vars: at file level   (lowest)
```

## Defining Variables

### Definition Variables (File Level)

Set defaults for the entire workflow file:

```yaml
defaults:
  environment: staging
  version: "1.0.0"
  replicas: 2

tasks:
  deploy:
    steps:
      - func: shell
        do: echo "Deploying {{ vars.version }} to {{ vars.environment }}"
```

### Task Variables

Override definition variables for a specific task:

```yaml
defaults:
  environment: staging

tasks:
  deploy_prod:
    vars:
      environment: production   # Overrides "staging" for this task
      replicas: 5
    steps:
      - func: shell
        do: echo "Deploying to {{ vars.environment }}"  # "production"
```

### Step Variables

Override task variables for a single step:

```yaml
tasks:
  deploy:
    vars:
      timeout: 60
    steps:
      - name: quick_check
        vars:
          timeout: 10  # Only this step uses 10
        func: shell
        do: echo "Timeout is {{ vars.timeout }}"  # "10"

      - name: full_deploy
        func: shell
        do: echo "Timeout is {{ vars.timeout }}"  # "60" (inherits task var)
```

### Runtime Variables (CLI)

Override any variable at execution time:

```bash
# Single variable
orchstep run deploy --var environment=production

# Multiple variables
orchstep run deploy --var environment=production --var version=2.0.0

# From file
orchstep run deploy --vars-file environments/prod.yml

# Combined (--var overrides --vars-file)
orchstep run deploy --vars-file base.yml --var environment=production
```

## Override Behavior Example

```yaml
defaults:
  environment: dev          # Level 4: definition

tasks:
  deploy:
    vars:
      environment: staging  # Level 3: task overrides definition
    steps:
      - name: step1
        vars:
          environment: qa   # Level 2: step overrides task
        func: shell
        do: echo "{{ vars.environment }}"  # Prints "qa"

      - name: step2
        func: shell
        do: echo "{{ vars.environment }}"  # Prints "staging" (inherits task)
```

Running with `--var environment=production` overrides all levels -- every step sees "production".

## Vars File Format

```yaml
# environments/prod.yml
environment: production
region: us-east-1
replicas: 5
features:
  auth: true
  cache: true
```

## Access Patterns

| Pattern | Description |
|---------|-------------|
| `{{ vars.name }}` | Access any variable (recommended) |
| `{{ steps.step_name.field }}` | Access step output |
| `{{ env.VAR }}` | Access environment variable |

## Passing Variables Between Tasks

Use `with:` to pass parameters when calling another task:

```yaml
tasks:
  main:
    steps:
      - name: call_deploy
        task: deploy_service
        with:
          environment: production
          replicas: 5

  deploy_service:
    vars:
      environment: dev       # Default, overridden by with:
      replicas: 1            # Default, overridden by with:
    steps:
      - func: shell
        do: echo "Deploying to {{ vars.environment }} with {{ vars.replicas }} replicas"
```

The `with:` values override the called task's `vars:` defaults.

## Step Output Extraction

Define named outputs from step results:

```yaml
steps:
  - name: build
    func: shell
    do: |
      echo "Built image: myapp:v1.2.3"
      echo "BUILD_ID=build-12345"
    outputs:
      image_tag: '{{ result.output | regexFind "myapp:([^\\s]+)" }}'
      build_id: '{{ result.output | regexFind "BUILD_ID=(.+)" }}'

  - name: deploy
    func: shell
    do: echo "Deploying {{ steps.build.image_tag }} (build {{ steps.build.build_id }})"
```

## Best Practices

- Provide sensible defaults at the definition level
- Use `--var` for environment-specific overrides at runtime
- Use `--vars-file` for shared environment configurations
- Never hardcode secrets -- use `{{ env.SECRET_NAME }}` instead
- Run `orchstep lint` to catch duplicate or unnecessary variable definitions
