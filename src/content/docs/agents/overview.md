---
title: LLM Agent Integration
description: Using OrchStep with AI agents for workflow authoring, execution, and automation
---

OrchStep is designed for native integration with LLM agents. Agents can author workflows, execute tasks, manage modules, and iterate on automation -- all through structured interfaces.

## How Agents Use OrchStep

### 1. Workflow Authoring

Agents write OrchStep YAML workflows for task orchestration. A workflow is defined in `orchstep.yml`:

```yaml
name: my-workflow
desc: "What this workflow does"

defaults:
  env: staging
  version: "1.0.0"

tasks:
  deploy:
    desc: "Deploy the application"
    steps:
      - name: build
        func: shell
        do: |
          echo "Building version {{ vars.version }}"
          echo "BUILD_ID=build-123"
        outputs:
          build_id: '{{ result.output | regexFind "BUILD_ID=(.+)" }}'

      - name: deploy
        func: shell
        do: |
          echo "Deploying {{ steps.build.build_id }} to {{ vars.env }}"

      - name: verify
        func: assert
        args:
          condition: '{{ ne steps.build.build_id "" }}'
          desc: "Build ID must not be empty"
```

### 2. Running Workflows

```bash
orchstep run deploy                          # Run the deploy task
orchstep run deploy --var env=production     # Override variable
orchstep run deploy --format json            # Structured output for agents
```

### 3. MCP Server Integration

OrchStep exposes an MCP server for direct tool calling from LLM agents. See the [MCP Server](/agents/mcp/) page for details.

## Available Functions

| Function | Purpose | Example |
|----------|---------|---------|
| `shell` | Run shell commands | `do: echo "hello"` |
| `http` | Make HTTP requests | `args: { url: "...", method: GET }` |
| `git` | Git operations | Shell-based: `do: git clone ...` |
| `assert` | Validate conditions | `args: { condition: "{{ ... }}" }` |
| `transform` | JavaScript data transform | `do: "return { key: value };"` |
| `render` | Template rendering | `args: { template: "..." }` |
| `wait` | Delay execution | `args: { duration: 5s }` |
| `task` | Call another task | `task: other-task` |

## Common Patterns

### Deploy Pipeline

```yaml
tasks:
  deploy:
    steps:
      - name: build
        func: shell
        do: docker build -t app:{{ vars.version }} .
      - name: push
        func: shell
        do: docker push app:{{ vars.version }}
      - name: deploy
        func: shell
        do: kubectl set image deployment/app app=app:{{ vars.version }}
      - name: health-check
        func: http
        args:
          url: "https://{{ vars.env }}.example.com/health"
          method: GET
        retry:
          max_attempts: 5
          interval: 10s
      - name: verify
        func: assert
        args:
          condition: '{{ eq steps.health-check.status_code 200 }}'
          desc: "Health check must return 200"
```

### Multi-Environment Promotion

```yaml
tasks:
  promote:
    steps:
      - name: deploy-envs
        loop: ["staging", "production"]
        task: deploy_single
        with:
          environment: "{{ loop.item }}"
          version: "{{ vars.version }}"

  deploy_single:
    steps:
      - func: shell
        do: echo "Deploying {{ vars.version }} to {{ vars.environment }}"
```

### CI/CD with Quality Gates

```yaml
tasks:
  ci:
    steps:
      - name: build
        func: shell
        do: npm run build

      - name: lint
        func: shell
        do: eslint .
        on_error: warn

      - name: test
        func: shell
        do: npm test

      - name: security_scan
        func: shell
        do: npm audit
        on_error: warn

      - name: deploy
        if: '{{ eq vars.deploy "true" }}'
        func: shell
        do: kubectl apply -f deployment.yml
```

### Retry with Rollback

```yaml
tasks:
  safe_deploy:
    steps:
      - name: deploy
        func: shell
        do: kubectl apply -f deployment.yml
        timeout: 60s
        retry:
          max_attempts: 3
          interval: 5s
        catch:
          - name: rollback
            func: shell
            do: kubectl rollback deployment/app
          - name: alert
            func: http
            args:
              url: "https://hooks.slack.com/services/..."
              method: POST
              body:
                text: "Deploy failed, rolled back"
        finally:
          - name: cleanup
            func: shell
            do: rm -rf /tmp/deploy-artifacts
```

## Anti-Patterns

- Don't put secrets directly in YAML -- use environment variables or vault
- Don't use deeply nested tasks (max 2 levels) -- flatten instead
- Don't ignore assertion failures -- they indicate real problems
- Don't hardcode paths -- use variables for environment-specific values
- Don't skip `on_error` for non-critical steps -- use `warn` or `ignore` explicitly
