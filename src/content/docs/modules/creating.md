---
title: Creating Modules
description: How to create, configure, and publish reusable OrchStep modules
---

This guide covers how to create reusable modules for OrchStep -- from defining the module structure and config schema to publishing and versioning.

## Module Structure

```
my-module/
  orchstep-module.yml    # Module metadata and configuration
  orchstep.yml           # Module workflow (tasks and steps)
  README.md              # Documentation (optional)
```

## Module Definition (orchstep-module.yml)

```yaml
name: ci-cd
version: "1.2.0"
description: "CI/CD pipeline module with build, test, and deploy tasks"
author: "your-org"
license: "MIT"

# Configuration schema: what the consumer must/can provide
config:
  required:
    - name: registry_url
      type: string
      description: "Docker registry URL"
    - name: app_name
      type: string
      description: "Application name"
  optional:
    - name: replicas
      type: integer
      default: 2
      description: "Number of deployment replicas"
    - name: timeout
      type: string
      default: "60s"
      description: "Deployment timeout"

# What this module makes available
exports:
  tasks:
    - build
    - test
    - deploy
    - rollback

# Module dependencies
dependencies:
  - name: docker-utils
    version: "^1.0.0"
    source: "github.com/orchstep-modules/docker-utils"
    optional: false
```

## Module Workflow (orchstep.yml)

```yaml
name: ci-cd-module
desc: "CI/CD pipeline module"

defaults:
  registry_url: ""
  app_name: ""
  replicas: 2
  timeout: "60s"

tasks:
  build:
    desc: "Build Docker image"
    steps:
      - name: docker_build
        func: shell
        do: |
          docker build -t {{ vars.registry_url }}/{{ vars.app_name }}:{{ vars.version }} .
        outputs:
          image_tag: "{{ vars.registry_url }}/{{ vars.app_name }}:{{ vars.version }}"

  test:
    desc: "Run test suite"
    steps:
      - name: unit_tests
        func: shell
        do: npm test
      - name: verify
        func: assert
        args:
          condition: '{{ eq steps.unit_tests.exit_code 0 }}'
          desc: "Tests must pass"

  deploy:
    desc: "Deploy to target environment"
    steps:
      - name: push_image
        func: shell
        do: docker push {{ vars.registry_url }}/{{ vars.app_name }}:{{ vars.version }}

      - name: apply_manifest
        func: shell
        do: |
          kubectl set image deployment/{{ vars.app_name }} \
            {{ vars.app_name }}={{ vars.registry_url }}/{{ vars.app_name }}:{{ vars.version }}
          kubectl rollout status deployment/{{ vars.app_name }} --timeout={{ vars.timeout }}
        retry:
          max_attempts: 3
          interval: 10s

      - name: health_check
        func: http
        args:
          url: "https://{{ vars.app_name }}.example.com/health"
          method: GET
        retry:
          max_attempts: 5
          interval: 10s

      - name: verify_health
        func: assert
        args:
          condition: '{{ eq steps.health_check.status_code 200 }}'
          desc: "Health check must pass after deployment"

  rollback:
    desc: "Rollback to previous version"
    steps:
      - name: undo
        func: shell
        do: kubectl rollout undo deployment/{{ vars.app_name }}
      - name: wait
        func: wait
        args:
          duration: 10s
      - name: verify
        func: http
        args:
          url: "https://{{ vars.app_name }}.example.com/health"
          method: GET
```

## Config Schema Best Practices

### Provide Sensible Defaults

```yaml
config:
  optional:
    - name: replicas
      type: integer
      default: 2
    - name: log_level
      type: string
      default: "info"
      enum: ["debug", "info", "warn", "error"]
```

### Validate Required Inputs

```yaml
config:
  required:
    - name: registry_url
      type: string
      pattern: "^https?://"
      description: "Docker registry URL (must include protocol)"
```

### Document Everything

```yaml
config:
  required:
    - name: app_name
      type: string
      description: |
        Application name used for:
        - Docker image naming
        - Kubernetes deployment selector
        - Health check URL routing
```

## Module Patterns

### Infrastructure Module

```yaml
# orchstep-module.yml
name: aws-ecs-deploy
config:
  required:
    - name: cluster_name
      type: string
    - name: service_name
      type: string
    - name: task_definition
      type: string
  optional:
    - name: desired_count
      type: integer
      default: 2
exports:
  tasks: [deploy, rollback, scale, status]
```

### Notification Module

```yaml
# orchstep-module.yml
name: slack-notify
config:
  required:
    - name: webhook_url
      type: string
      description: "Slack webhook URL"
  optional:
    - name: channel
      type: string
      default: "#deployments"
    - name: username
      type: string
      default: "OrchStep Bot"
exports:
  tasks: [notify_success, notify_failure, notify_custom]
```

### Testing Module

```yaml
# orchstep-module.yml
name: test-suite
config:
  optional:
    - name: coverage_threshold
      type: integer
      default: 80
    - name: test_command
      type: string
      default: "npm test"
exports:
  tasks: [unit, integration, e2e, coverage_report]
```

## Versioning

Modules use semantic versioning (semver):

| Version Constraint | Meaning |
|-------------------|---------|
| `1.2.3` | Exact version |
| `^1.2.0` | Compatible with 1.x.x (major locked) |
| `~1.2.0` | Compatible with 1.2.x (minor locked) |
| `>=1.2.0` | Minimum version |

**Rules:**
- Bump PATCH for bug fixes (1.2.3 -> 1.2.4)
- Bump MINOR for new features, backward-compatible (1.2.3 -> 1.3.0)
- Bump MAJOR for breaking changes (1.2.3 -> 2.0.0)

## Publishing Checklist

1. Create `orchstep-module.yml` with complete metadata
2. Define clear config schema with descriptions
3. Export only the tasks users need (keep internal tasks private)
4. Tag releases with semver: `git tag v1.0.0 && git push --tags`
5. Write a README with usage examples
6. Validate before publishing: `orchstep module validate .`
7. Test with `orchstep lint` to ensure YAML validity

## Anti-Patterns

- Don't hardcode environment-specific values -- use config parameters
- Don't export internal helper tasks -- only export the public API
- Don't break backward compatibility in minor/patch releases
- Don't require secrets in config -- instruct users to use environment variables
- Don't nest module dependencies more than 2 levels deep
