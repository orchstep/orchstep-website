---
title: Pro Features
description: OrchStep Pro features for teams and enterprises
---

# OrchStep Pro

Pro features are for teams that need collaboration, governance, and advanced tooling. All Pro features are gated by a license key — the execution engine is always free.

## Commands

| Command | Purpose |
|---------|---------|
| `orchstep license activate --key=ORCH-XXXX` | Activate a Pro license |
| `orchstep license status` | Show current license |
| `orchstep license deactivate` | Remove license |
| `orchstep team list` | List team workflows |
| `orchstep team add` | Add workflow to team registry |
| `orchstep audit query` | Query execution audit logs |
| `orchstep audit export` | Export audit logs |
| `orchstep governance check` | Evaluate execution policies |
| `orchstep inspect` | Interactive TUI context explorer |
| `orchstep report` | Generate execution reports |
| `orchstep module publish` | Publish to private registry |
| `orchstep module list-private` | List private modules |

## Private Module Registry

Host private modules accessible only to your team:

```yaml
modules:
  - name: internal-deploy
    source: "@private/deploy-tool"
    version: "^1.0.0"
```

Publish with: `orchstep module publish ./my-module`

## AI Agent Governance

Control what LLM agents can do with `.orchstep/governance.yml`:

```yaml
policies:
  production_protection:
    match:
      invoker_type: agent
    rules:
      - deny: [deploy_prod, secret_rotate]
      - require_approval: [deploy_prod]
```

## Pricing

| Edition | Price |
|---------|-------|
| Community | Free forever |
| Pro | $49/user/month |
| Enterprise | Custom |

[Get Pro →](https://orchstep.com/pricing)
