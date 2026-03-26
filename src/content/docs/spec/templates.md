---
title: Templates
description: Go template syntax, Sprig functions, regex extraction, and JavaScript expressions in OrchStep
---

OrchStep uses Go templates with Sprig functions for variable interpolation, and supports JavaScript expressions via the Goja VM for complex logic.

## Go Template Syntax

Expressions are enclosed in `{{ }}`:

```yaml
steps:
  - func: shell
    do: echo "Deploying {{ vars.version }} to {{ vars.environment }}"
```

### Variable Access

| Pattern | Description |
|---------|-------------|
| `{{ vars.name }}` | Workflow variable |
| `{{ steps.step_name.field }}` | Step output |
| `{{ env.VAR_NAME }}` | Environment variable |
| `{{ result.output }}` | Current step result (in `outputs:`) |
| `{{ loop.item }}` | Current loop item |
| `{{ loop.index }}` | Current loop index (zero-based) |

### Conditionals in Templates

```yaml
do: |
  echo "Deploying to {{ vars.env }}"
  {{- if eq vars.env "production" }}
  echo "Extra production checks enabled"
  {{- end }}
```

### Iteration in Templates

```yaml
do: |
  {{ range vars.servers }}
  echo "Server: {{ . }}"
  {{ end }}
```

## Sprig Functions

OrchStep includes [Sprig v3](https://masterminds.github.io/sprig/) with 100+ utility functions.

### String Functions

| Function | Example | Result |
|----------|---------|--------|
| `upper` | `{{ "hello" \| upper }}` | `HELLO` |
| `lower` | `{{ "HELLO" \| lower }}` | `hello` |
| `title` | `{{ "hello world" \| title }}` | `Hello World` |
| `trim` | `{{ " hello " \| trim }}` | `hello` |
| `trimSuffix` | `{{ "hello.txt" \| trimSuffix ".txt" }}` | `hello` |
| `replace` | `{{ "hello" \| replace "l" "r" }}` | `herro` |
| `contains` | `{{ contains "hello" "ell" }}` | `true` |
| `hasPrefix` | `{{ hasPrefix "hello" "hel" }}` | `true` |
| `hasSuffix` | `{{ hasSuffix "hello" "llo" }}` | `true` |
| `repeat` | `{{ "ab" \| repeat 3 }}` | `ababab` |
| `substr` | `{{ substr 0 5 "hello world" }}` | `hello` |
| `trunc` | `{{ trunc 5 "hello world" }}` | `hello` |
| `camelcase` | `{{ "my-service" \| camelcase }}` | `myService` |
| `snakecase` | `{{ "myService" \| snakecase }}` | `my_service` |
| `kebabcase` | `{{ "myService" \| kebabcase }}` | `my-service` |
| `split` | `{{ split "," "a,b,c" }}` | list `[a, b, c]` |
| `join` | `{{ list "a" "b" "c" \| join "," }}` | `a,b,c` |

### Math Functions

| Function | Example | Result |
|----------|---------|--------|
| `add` | `{{ add 1 2 }}` | `3` |
| `sub` | `{{ sub 10 3 }}` | `7` |
| `mul` | `{{ mul 3 4 }}` | `12` |
| `div` | `{{ div 10 3 }}` | `3` |
| `mod` | `{{ mod 10 3 }}` | `1` |
| `max` | `{{ max 5 10 }}` | `10` |
| `min` | `{{ min 5 10 }}` | `5` |
| `ceil` | `{{ ceil 1.5 }}` | `2` |
| `floor` | `{{ floor 1.5 }}` | `1` |

### List Functions

| Function | Description |
|----------|-------------|
| `first` | First element of a list |
| `last` | Last element of a list |
| `rest` | All elements except first |
| `append` | Add element to end of list |
| `concat` | Merge two lists |
| `uniq` | Remove duplicate elements |
| `has` | Check if list contains element |
| `without` | Remove elements from list |
| `slice` | Sub-list extraction |
| `reverse` | Reverse list order |

### Dictionary Functions

| Function | Description |
|----------|-------------|
| `get` | Get value by key |
| `set` | Set value for key |
| `hasKey` | Check if key exists |
| `keys` | Get all keys |
| `values` | Get all values |
| `pick` | Select subset of keys |
| `omit` | Exclude subset of keys |
| `merge` | Merge dictionaries |

### Type Conversion

| Function | Description |
|----------|-------------|
| `atoi` | String to integer |
| `toString` | Convert to string |
| `toJson` | Serialize to JSON string |
| `toPrettyJson` | Serialize to formatted JSON |
| `fromJson` | Parse JSON string to object |
| `toYaml` | Serialize to YAML string |

### Date/Time Functions

| Function | Example |
|----------|---------|
| `now` | Current time |
| `date` | `{{ now \| date "2006-01-02" }}` |
| `dateModify` | `{{ now \| dateModify "+24h" }}` |
| `unixEpoch` | `{{ now \| unixEpoch }}` |

### Encoding Functions

| Function | Description |
|----------|-------------|
| `b64enc` | Base64 encode |
| `b64dec` | Base64 decode |
| `sha256sum` | SHA-256 hash |
| `urlquery` | URL-encode string |
| `uuidv4` | Generate UUID v4 |

### Logic Functions

| Function | Example |
|----------|---------|
| `default` | `{{ vars.port \| default 8080 }}` |
| `empty` | `{{ empty vars.name }}` |
| `coalesce` | `{{ coalesce vars.a vars.b "fallback" }}` |
| `ternary` | `{{ ternary "yes" "no" (eq vars.env "prod") }}` |

### Regex Functions

| Function | Description | Example |
|----------|-------------|---------|
| `regexMatch` | Test if string matches pattern | `{{ regexMatch "v[0-9]+" vars.version }}` |
| `regexFind` | Extract first capture group | `{{ result.output \| regexFind "ID=(.+)" }}` |
| `regexFindAll` | Extract all matches | `{{ regexFindAll "[0-9]+" result.output -1 }}` |
| `regexReplaceAll` | Replace all matches | `{{ regexReplaceAll "[0-9]+" result.output "X" }}` |

### Semantic Versioning

| Function | Example |
|----------|---------|
| `semver` | `{{ semver "1.2.3" }}` -- parse to semver object |
| `semverCompare` | `{{ semverCompare ">=1.2.0" vars.version }}` -- compare versions |

## Output Extraction Patterns

Use regex in `outputs:` to extract structured data from command output:

```yaml
steps:
  - name: build
    func: shell
    do: |
      echo "Building..."
      echo "IMAGE=myapp:v1.2.3"
      echo "DIGEST=sha256:abc123"
      echo "SIZE=42MB"
    outputs:
      image: '{{ result.output | regexFind "IMAGE=(.+)" }}'
      digest: '{{ result.output | regexFind "DIGEST=(.+)" }}'
      size: '{{ result.output | regexFind "SIZE=(.+)" }}'
```

### Common Extraction Patterns

```yaml
# Extract key=value pair
output_field: '{{ result.output | regexFind "KEY=(.+)" }}'

# Extract JSON field from mixed output
json_field: '{{ result.data.field_name }}'

# Trim whitespace from output
clean_output: '{{ result.output | trim }}'

# Default value if empty
safe_value: '{{ result.output | default "unknown" }}'

# Extract version number
version: '{{ result.output | regexFind "([0-9]+\\.[0-9]+\\.[0-9]+)" }}'
```

## JavaScript Expressions

For complex logic that goes beyond Go templates, OrchStep supports JavaScript via the Goja VM. JavaScript is used in:

- `assert` conditions (when no `{{ }}` wrapper)
- `retry.when` conditions
- `loop.until` conditions
- `transform` function `do:` blocks

```yaml
# Assert with JavaScript
- func: assert
  args:
    condition: 'steps.api.status_code >= 200 && steps.api.status_code < 300'

# Retry with JavaScript condition
retry:
  when: |
    result.exit_code != 0 &&
    !result.output.includes('invalid') &&
    retry.attempt < 3

# Loop until with JavaScript
loop:
  count: 30
  until: 'steps.check.output.includes("READY")'
```

## Best Practices

- Use single quotes around Go template conditions to avoid YAML escaping: `'{{ eq vars.x "y" }}'`
- Prefer `regexFind` over complex shell parsing for output extraction
- Use `default` to provide fallback values: `{{ vars.port | default 8080 }}`
- Use `trim` on extracted outputs to remove trailing newlines
- Use JavaScript syntax for complex boolean logic (more readable than nested Go template `and`/`or`)
