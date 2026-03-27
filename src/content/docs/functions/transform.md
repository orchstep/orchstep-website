---
title: transform
description: Execute JavaScript-based data transformation in a sandboxed VM
---

Execute JavaScript-based data transformation in a sandboxed Goja VM. Use for pure computation, data manipulation, and complex decision logic without shell overhead.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `func` | string | yes | Must be `transform` |
| `do` | string | yes | JavaScript code to execute. Must `return` a value. |
| `args.timeout` | int | no | Execution timeout in seconds (default: 10, max: 300) |

## Return Values

The return value of the JavaScript code becomes the step output:

| Return Type | Behavior | Access Pattern |
|-------------|----------|----------------|
| Object `{ key: val }` | Stored as-is | `steps.step_name.key` |
| Primitive (number, string) | Wrapped in `{ result: value }` | `steps.step_name.result` |
| Array | Wrapped in `{ result: [...] }` | `steps.step_name.result` |
| null/undefined | Empty object `{}` | -- |

## Available Context

Inside `do`, you can access:

| Variable | Description |
|----------|-------------|
| `vars.*` | Workflow variables (read/write within task scope) |
| `env.*` | Environment variables (read-only) |
| `steps.*` | Previous step outputs (read-only) |
| `utils.*` | Built-in utility functions (see below) |

### Built-in Utilities (`utils`)

| Function | Description |
|----------|-------------|
| `utils.parseJSON(string)` | Parse JSON string to object |
| `utils.stringifyJSON(obj, pretty?)` | Serialize object to JSON |
| `utils.unique(array)` | Deduplicate array values |
| `utils.sum(array)` | Sum numeric array |
| `utils.avg(array)` | Average of numeric array |
| `utils.flatten(array)` | Flatten nested arrays |
| `utils.trim(string)` | Trim whitespace |
| `utils.upper(string)` | Uppercase string |
| `utils.lower(string)` | Lowercase string |

## Sandboxing

The transform function is sandboxed for security:

- Allowed: pure computation, data manipulation, variable access
- Not allowed: file I/O, network requests, system calls
- Use `shell` for file operations, network requests, or external commands

## Examples

### Basic Computation

```yaml
steps:
  - name: calculate
    func: transform
    do: |
      const subtotal = 100;
      const tax = subtotal * 0.08;
      return { subtotal: subtotal, tax: tax, total: subtotal + tax };

  - name: show_total
    func: shell
    do: echo "Total is {{ steps.calculate.total }}"
```

### Parse and Filter API Response

```yaml
steps:
  - name: fetch_users
    func: shell
    do: curl -s https://api.example.com/users

  - name: extract_active
    func: transform
    do: |
      const response = utils.parseJSON(steps.fetch_users.output);
      const active = response.users
        .filter(function(u) { return u.active; })
        .map(function(u) { return { id: u.id, name: u.name, email: u.email }; });
      return {
        total: response.users.length,
        active_count: active.length,
        users: active
      };
```

### Variable Modification

Transform can modify `vars` within the current task scope:

```yaml
defaults:
  counter: 0

tasks:
  counting:
    steps:
      - name: increment
        func: transform
        do: |
          vars.counter = vars.counter + 1;
          return { new_value: vars.counter };

      - name: increment_again
        func: transform
        do: |
          vars.counter = vars.counter + 1;
          return { new_value: vars.counter };
```

### Data Validation

```yaml
steps:
  - name: load_config
    func: shell
    do: cat config.json

  - name: validate
    func: transform
    do: |
      const config = utils.parseJSON(steps.load_config.output);
      const errors = [];
      if (!config.database || !config.database.host) {
        errors.push("Missing database.host");
      }
      if (config.mode === "cluster" && config.replicas < 3) {
        errors.push("Cluster mode requires at least 3 replicas");
      }
      return {
        valid: errors.length === 0,
        errors: errors,
        config: config
      };

  - name: assert_valid
    func: assert
    args:
      condition: "steps.validate.valid"
      desc: "Configuration validation failed"
```

### Adaptive Deployment Strategy

```yaml
steps:
  - name: check_load
    func: shell
    do: uptime | awk '{print $(NF-2)}' | sed 's/,//'

  - name: decide_strategy
    func: transform
    do: |
      var load = parseFloat(steps.check_load.output);
      if (load > 80) {
        return { strategy: "canary", batch_size: 1, reason: "High load" };
      } else if (load > 50) {
        return { strategy: "rolling", batch_size: 3, reason: "Moderate load" };
      } else {
        return { strategy: "blue-green", batch_size: 10, reason: "Low load" };
      }

  - name: deploy
    func: shell
    do: |
      echo "Strategy: {{ steps.decide_strategy.strategy }}"
      deploy.sh --strategy {{ steps.decide_strategy.strategy }}
```

### Test Results Aggregation

```yaml
steps:
  - name: unit_tests
    func: shell
    do: npm run test:unit

  - name: integration_tests
    func: shell
    do: npm run test:integration

  - name: aggregate
    func: transform
    do: |
      var results = [
        { name: "unit", exit_code: steps.unit_tests.exit_code },
        { name: "integration", exit_code: steps.integration_tests.exit_code }
      ];
      var passed = 0;
      var failed = 0;
      for (var i = 0; i < results.length; i++) {
        if (results[i].exit_code === 0) { passed++; } else { failed++; }
      }
      return {
        total: results.length,
        passed: passed,
        failed: failed,
        success_rate: ((passed / results.length) * 100).toFixed(1) + "%"
      };
```

## Performance Notes

- The JavaScript VM is reused within a task (subsequent transforms are faster)
- Prefer `transform` over `shell` for pure data operations (no process spawn overhead)
- Set `args.timeout` for long-running computations (default 10s)
