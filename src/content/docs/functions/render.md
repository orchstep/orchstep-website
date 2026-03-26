---
title: render
description: Render Go templates to produce configuration files, reports, and text output
---

Render Go templates to produce text output. Use for generating configuration files, reports, or any text content from templates and variables.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `func` | string | yes | Must be `render` |
| `args.template` | string | yes | Path to a template file, or inline template string |
| `args.output` | string | no | File path to write rendered output |
| `args.data` | map | no | Additional data passed to the template context |

## Return Values

| Field | Type | Description |
|-------|------|-------------|
| `result.output` | string | The rendered text content |

## Template Syntax

Render uses Go templates with Sprig functions. All workflow variables, step outputs, and environment variables are available in the template context.

| Expression | Description |
|------------|-------------|
| `{{ vars.key }}` | Access workflow variable |
| `{{ steps.name.field }}` | Access step output |
| `{{ env.VAR }}` | Access environment variable |
| `{{ .data.key }}` | Access data passed via `args.data` |

## Examples

### Inline Template

```yaml
steps:
  - name: render_config
    func: render
    args:
      template: |
        server:
          host: {{ vars.host }}
          port: {{ vars.port }}
          environment: {{ vars.env }}
          version: {{ vars.version }}
    outputs:
      config: "{{ result.output }}"
```

### Template File

```yaml
steps:
  - name: render_deploy_manifest
    func: render
    args:
      template: "templates/deployment.yml.tmpl"
      output: "generated/deployment.yml"
      data:
        version: "{{ vars.version }}"
        replicas: "{{ vars.replicas }}"
        timestamp: "{{ now | date \"2006-01-02T15:04:05Z07:00\" }}"
```

### Generate Deployment State

```yaml
steps:
  - name: deploy_app
    func: shell
    do: kubectl apply -f {{ vars.manifest }}
    outputs:
      deploy_result: "{{ result.output }}"

  - name: render_state
    func: render
    args:
      template: "state.yml.tmpl"
      output: "{{ vars.state_repo }}/deployed/{{ vars.env }}.yml"
      data:
        version: "{{ vars.version }}"
        timestamp: "{{ now | date \"2006-01-02T15:04:05Z07:00\" }}"
        status: "{{ steps.deploy_app.deploy_result }}"
```

### Generate Report

```yaml
steps:
  - name: build_report
    func: render
    args:
      template: |
        # Deployment Report
        Date: {{ now | date "2006-01-02" }}
        Environment: {{ vars.env }}
        Version: {{ vars.version }}
        Build ID: {{ steps.build.build_id }}
        Status: {{ steps.deploy.exit_code | eq 0 | ternary "SUCCESS" "FAILED" }}
    outputs:
      report: "{{ result.output }}"
```

### With Sprig Functions

```yaml
steps:
  - name: render_names
    func: render
    args:
      template: |
        Service: {{ vars.service_name | upper }}
        Config Map: {{ vars.service_name }}-config
        Class Name: {{ vars.service_name | camelcase | title }}
        Env Var: {{ vars.service_name | snakecase | upper }}_PORT
```
