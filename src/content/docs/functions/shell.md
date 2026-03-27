---
title: shell
description: Execute shell commands with streaming output, exit code capture, and output extraction
---

Execute shell commands with streaming output, exit code capture, and output extraction.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `func` | string | yes | Must be `shell` |
| `do` | string | yes | Shell command(s) to execute. Supports multi-line with `\|`. |
| `shell` | string | no | Shell type: `shell` (default, POSIX sh), `gosh`, `bash`, `zsh`, `pwsh` |
| `env` | map | no | Additional environment variables for this step |
| `output_format` | string | no | Output parsing: `auto` (default), `json`, `yaml`, `text` |
| `outputs` | map | no | Named output extraction using Go templates on `result` |
| `timeout` | string | no | Per-execution timeout (e.g., `30s`, `5m`) |

## Return Values

| Field | Type | Description |
|-------|------|-------------|
| `result.output` | string | Combined stdout and stderr text |
| `result.exit_code` | int | Process exit code (0 = success) |
| `result.data` | object | Parsed structured data when output is JSON/YAML (requires `output_format: auto` or explicit format) |

## Examples

### Basic Usage

```yaml
steps:
  - name: greet
    func: shell
    do: echo "Hello, world!"
```

### Multi-line Commands

```yaml
steps:
  - name: build
    func: shell
    do: |
      echo "Building version {{ vars.version }}"
      npm install
      npm run build
      echo "BUILD_ID=build-$(date +%s)"
```

### Output Extraction

Extract structured data from command output using `outputs` and Go template expressions:

```yaml
steps:
  - name: build
    func: shell
    do: |
      echo "Building application..."
      echo "IMAGE_TAG=myapp:v1.2.3"
      echo "BUILD_STATUS=success"
    outputs:
      image_tag: '{{ result.output | regexFind "IMAGE_TAG=(.+)" }}'
      status: '{{ result.output | regexFind "BUILD_STATUS=(.+)" }}'

  - name: verify
    func: assert
    args:
      condition: '{{ eq steps.build.status "success" }}'
      desc: "Build must succeed"
```

### Environment Variables

```yaml
steps:
  - name: deploy
    func: shell
    env:
      AWS_REGION: us-east-1
      DEPLOY_ENV: "{{ vars.environment }}"
    do: |
      echo "Deploying to $AWS_REGION ($DEPLOY_ENV)"
```

### Structured Output Parsing

When commands emit JSON, OrchStep auto-parses the output for direct field access:

```yaml
steps:
  - name: get_instances
    func: shell
    do: aws ec2 describe-instances --output json
    outputs:
      instance_id: "{{ result.data.Reservations.0.Instances.0.InstanceId }}"
      state: "{{ result.data.Reservations.0.Instances.0.State.Name }}"
```

### Using Previous Step Outputs

```yaml
steps:
  - name: build
    func: shell
    do: |
      docker build -t app:{{ vars.version }} .
      echo "DIGEST=$(docker inspect --format='{{.Id}}' app:{{ vars.version }})"
    outputs:
      digest: '{{ result.output | regexFind "DIGEST=(.+)" }}'

  - name: push
    func: shell
    do: |
      docker push app:{{ vars.version }}
      echo "Pushed image with digest {{ steps.build.digest }}"
```

### Shell Types

The default shell is POSIX `sh` (`/bin/sh`), which works on Alpine, distroless containers, and all Linux/macOS systems. Override at the step level using `args.type`:

| Type | Engine | Best For |
|------|--------|----------|
| `shell` (default) | `/bin/sh` | Maximum portability |
| `gosh` | Go-native (mvdan/sh) | Windows, single-binary deployments |
| `bash` | `/bin/bash` | Bash-specific features (arrays, `[[ ]]`) |
| `zsh` | `/bin/zsh` | macOS default shell features |
| `pwsh` | PowerShell | PowerShell scripting |

```yaml
steps:
  - name: posix-portable
    func: shell
    do: echo "Runs in /bin/sh (default)"

  - name: go-native
    func: shell
    args:
      type: "gosh"
      cmd: echo "Runs in Go-native shell — works on Windows"

  - name: needs-bash
    func: shell
    args:
      type: "bash"
      cmd: |
        declare -A map
        map[key]="value"
        echo "${map[key]}"
```

Shell type can also be configured globally or at workflow level. See [Shell Execution](/spec/shell-execution) for full configuration details.

### Cross-Platform with gosh

`gosh` is OrchStep's built-in Go shell interpreter. It requires no external shell binary, making it ideal for Windows and minimal containers:

```yaml
name: cross-platform
config:
  func:
    shell:
      type: "gosh"

tasks:
  build:
    steps:
      - name: compile
        func: shell
        do: |
          echo "Works on Windows, Linux, and macOS"
          echo "No bash required"
```

### Timeout and Error Handling

```yaml
steps:
  - name: long_task
    func: shell
    do: ./long-running-script.sh
    timeout: 60s
    retry:
      max_attempts: 3
      interval: 5s
    on_error: warn
```
