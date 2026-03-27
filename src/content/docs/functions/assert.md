---
title: assert
description: Validate conditions using Go template expressions or JavaScript
---

Validate conditions using Go template expressions or JavaScript. Fails the step when the condition evaluates to false.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `func` | string | yes | Must be `assert` |
| `args.condition` | string | yes | Expression to evaluate. Supports Go templates (`{{ }}`) and JavaScript syntax. |
| `args.desc` | string | no | Error message displayed when assertion fails |

### Dual Syntax

OrchStep detects the syntax automatically:

| Pattern | Syntax | Example |
|---------|--------|---------|
| `{{ ... }}` | Go Template | `'{{ eq vars.env "prod" }}'` |
| No `{{ }}` | JavaScript | `'vars.env === "prod"'` |

## Return Values

| Field | Type | Description |
|-------|------|-------------|
| `result.passed` | bool | Whether the assertion passed |
| `result.value` | any | The evaluated condition value |

## Examples

### Basic Assertion

```yaml
steps:
  - name: verify_build
    func: assert
    args:
      condition: '{{ eq steps.build.exit_code 0 }}'
      desc: "Build must succeed before deployment"
```

### Go Template Comparisons

```yaml
steps:
  - name: check_version
    func: assert
    args:
      condition: '{{ ne vars.version "" }}'
      desc: "Version must not be empty"

  - name: check_count
    func: assert
    args:
      condition: '{{ gt vars.replicas 0 }}'
      desc: "Must have at least 1 replica"

  - name: check_combined
    func: assert
    args:
      condition: '{{ and (eq vars.env "prod") (gt vars.replicas 2) }}'
      desc: "Production requires 3+ replicas"
```

### String Matching (Go Templates)

```yaml
steps:
  - name: check_output
    func: assert
    args:
      condition: '{{ contains steps.build.output "SUCCESS" }}'
      desc: "Build output must contain SUCCESS"

  - name: check_prefix
    func: assert
    args:
      condition: '{{ hasPrefix vars.version "v" }}'
      desc: "Version must start with v"

  - name: check_regex
    func: assert
    args:
      condition: '{{ regexMatch "v[0-9]+\\.[0-9]+" vars.version }}'
      desc: "Version must match semver pattern"
```

### JavaScript Syntax

```yaml
steps:
  - name: check_status
    func: assert
    args:
      condition: 'steps.api_call.status_code >= 200 && steps.api_call.status_code < 300'
      desc: "API call must return 2xx status"

  - name: check_string
    func: assert
    args:
      condition: 'steps.build.output.includes("SUCCESS")'
      desc: "Build must succeed"
```

### Aggregation Helpers (JavaScript)

For loop outputs that produce arrays, use built-in aggregation helpers:

```yaml
steps:
  - name: all_succeeded
    func: assert
    args:
      condition: 'all(steps.batch_requests.outputs, "status_code", 200)'
      desc: "All batch requests must return 200"

  - name: check_count
    func: assert
    args:
      condition: 'count(steps.results.outputs) === 5'
      desc: "Should have exactly 5 results"

  - name: check_average
    func: assert
    args:
      condition: 'avg(steps.perf_tests.outputs, "response_time") < 500'
      desc: "Average response time must be under 500ms"
```

**Available helpers:**

| Helper | Purpose | Example |
|--------|---------|---------|
| `first(array)` | First element | `first(steps.items.outputs).id` |
| `last(array)` | Last element | `last(steps.batch.outputs).status` |
| `at(array, index)` | Safe index access | `at(steps.results.outputs, 2).score` |
| `all(array, field, value)` | All items match | `all(steps.tests.outputs, "passed", true)` |
| `any(array, field, value)` | Any item matches | `any(steps.checks.outputs, "failed", true)` |
| `count(array [, field, value])` | Count items | `count(steps.items.outputs, "valid", true)` |
| `pluck(array, field)` | Extract field values | `pluck(steps.users.outputs, "email")` |
| `sum(array, field)` | Sum numeric field | `sum(steps.sales.outputs, "amount")` |
| `avg(array, field)` | Average numeric field | `avg(steps.times.outputs, "duration")` |

### Post-Deployment Verification

```yaml
tasks:
  verify_deploy:
    steps:
      - name: health_check
        func: http
        args:
          url: "https://{{ vars.env }}.example.com/health"
          method: GET

      - name: assert_healthy
        func: assert
        args:
          condition: '{{ eq steps.health_check.status_code 200 }}'
          desc: "Service must be healthy after deployment"

      - name: assert_version
        func: assert
        args:
          condition: 'steps.health_check.data.version === vars.expected_version'
          desc: "Deployed version must match expected version"
```
