---
title: git
description: Perform Git operations within workflows for cloning, checkout, and GitOps
---

Perform Git operations within workflows for cloning repositories, checking out versions, fetching updates, listing branches/tags, and pushing state changes. Git operations are executed via the `shell` function wrapping git commands, with OrchStep providing template variables and output extraction.

## Common Operations

### Clone

| Parameter | Description |
|-----------|-------------|
| `--depth 1` | Shallow clone (recommended for automation, 80-95% faster) |
| `--single-branch` | Fetch only one branch (40-60% data reduction) |
| `-b <branch/tag>` | Clone a specific branch or tag |

### Checkout

Switch between branches, tags, or commits within a cloned repo.

### Fetch

Update repository from remote. Use `--prune` to remove stale references.

### List Tags/Branches

Discover available versions with `git tag --list` and `git branch --all`.

### Push

Commit and push changes for GitOps state tracking.

## Return Values

When using `func: shell` for git operations:

| Field | Type | Description |
|-------|------|-------------|
| `result.output` | string | Command stdout/stderr |
| `result.exit_code` | int | 0 = success, non-zero = error |

## Examples

### Clone a Repository

```yaml
steps:
  - name: clone
    func: shell
    do: |
      git clone --depth 1 --single-branch \
        -b {{ vars.version }} \
        {{ vars.repo_url }} \
        /tmp/modules/{{ vars.module_name }}
```

### Clone with Token Authentication

```yaml
steps:
  - name: clone_private
    func: shell
    do: |
      git clone --depth 1 \
        https://x-access-token:{{ env.GITHUB_TOKEN }}@github.com/org/repo.git \
        /tmp/repo
```

### Clone with SSH

```yaml
steps:
  - name: clone_ssh
    func: shell
    do: |
      GIT_SSH_COMMAND="ssh -i {{ vars.ssh_key_path }} -o StrictHostKeyChecking=accept-new" \
        git clone git@github.com:org/repo.git /tmp/repo
```

### Checkout Specific Version

```yaml
steps:
  - name: checkout
    func: shell
    do: |
      cd /tmp/repo
      git checkout v1.2.3
```

### List Tags and Find Latest

```yaml
steps:
  - name: list_tags
    func: shell
    do: |
      cd /tmp/repo
      git tag --list "v*" | sort -V
    outputs:
      versions: "{{ result.output }}"

  - name: latest
    func: shell
    do: |
      echo "{{ steps.list_tags.versions }}" | tail -1
    outputs:
      latest_version: "{{ result.output }}"
```

### Get Commit Info

```yaml
steps:
  - name: commit_info
    func: shell
    do: |
      cd /tmp/repo
      echo "SHA: $(git rev-parse HEAD)"
      echo "Author: $(git log -1 --pretty=format:'%an')"
      echo "Date: $(git log -1 --pretty=format:'%cI')"
      echo "Message: $(git log -1 --pretty=format:'%s')"
    outputs:
      sha: '{{ result.output | regexFind "SHA: (.+)" }}'
```

### Push State Changes (GitOps)

```yaml
steps:
  - name: track_deployment
    func: shell
    do: |
      cd {{ vars.state_repo }}
      git config user.name "OrchStep Bot"
      git config user.email "bot@orchstep.io"
      git add deployed/{{ vars.env }}.yml
      git commit -m "Deploy {{ vars.version }} to {{ vars.env }}"
      git push origin state/{{ vars.env }}
```

### Clone with Retry on Network Failure

```yaml
steps:
  - name: clone_with_retry
    func: shell
    do: |
      git clone --depth 1 \
        https://github.com/org/repo.git \
        /tmp/repo
    retry:
      max_attempts: 3
      interval: 2s
      backoff_rate: 1.5
      when: |
        result.exit_code != 0 && (
          result.output.includes('timeout') ||
          result.output.includes('Connection reset')
        )
```

### Module Installation Workflow

```yaml
tasks:
  install_module:
    steps:
      - name: clone
        func: shell
        do: |
          git clone --depth 1 -b {{ vars.version }} \
            {{ vars.module_url }} \
            ~/.orchstep/modules/{{ vars.module_name }}

      - name: verify
        func: shell
        do: |
          test -f ~/.orchstep/modules/{{ vars.module_name }}/orchstep-module.yml

      - name: info
        func: shell
        do: |
          cd ~/.orchstep/modules/{{ vars.module_name }}
          echo "Module: {{ vars.module_name }}"
          echo "Version: $(git describe --tags)"
          echo "Commit: $(git rev-parse HEAD)"
```

## Best Practices

- Use `--depth 1` for automation (shallow clones are significantly faster)
- Never embed credentials in workflow files -- use `{{ env.TOKEN }}` variables
- Target specific versions (`git checkout v1.2.3`) for reproducibility
- Clean up cloned repos after use to avoid disk accumulation
- Set `GIT_PROTOCOL=v2` for 30-50% faster fetches
