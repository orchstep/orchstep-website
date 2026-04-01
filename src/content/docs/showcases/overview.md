---
title: Enterprise Showcases
description: Production-grade compositions demonstrating OrchStep as an architectural platform
---

OrchStep showcases go beyond single-task demos. Each showcase composes multiple modules into a real infrastructure pattern, proving OrchStep handles enterprise-grade workflows with clean module boundaries and scoped variables.

## Why Showcases Exist

OrchStep's **examples** teach individual features. **Demos** solve individual operational tasks. But enterprise buyers need to see something different: can this platform handle real infrastructure composition with multiple teams, environments, and cloud services?

Showcases answer that question. They demonstrate:
- **Interface/implementation separation** -- main workflow defines WHAT, modules define HOW
- **Multi-layer module chaining** -- modules that import other modules (up to 3 layers deep)
- **Scoped variable flow** -- config values pass cleanly across module boundaries without leaking
- **Swappable implementations** -- same workflow, different cloud provider

| | Examples | Demos | Showcases |
|---|---------|-------|-----------|
| **Purpose** | Learn one feature | Solve one task | Build systems |
| **Complexity** | Single concept | Multi-step workflow | Multi-module composition |
| **Modules** | None or local | None | Registry modules |
| **Module depth** | 0-1 layer | 0 layers | 2-3 layers |
| **Audience** | New users | Practitioners | Architects & enterprise |

---

## 1. Classic 3-Tier Web App

**What it proves:** 3-layer module chaining, scoped variable flow across layers, interface/implementation separation.

**Architecture:** Main workflow -> `demo-aws-infra` (composite) -> `demo-aws-networking` (leaf). Provisions VPC, subnets, security groups, EC2 instances, RDS database, auto-scaling, and Route 53 DNS.

```
orchstep.yml
+-- demo-aws-infra ----------- COMPOSITE (Layer 2)
|   +-- demo-aws-networking -- Leaf: VPC, subnets, SGs (Layer 3)
|   +-- demo-aws-ec2 --------- Leaf: EC2 instances
|   +-- demo-aws-rds --------- Leaf: Database
+-- demo-aws-asg ------------- Leaf: Auto-scaling + ALB
+-- demo-aws-r53 ------------- Leaf: DNS records
+-- demo-health-check -------- Leaf: Post-deploy verification
```

**Key pattern:** Variables flow through 3 layers via config:

```yaml
modules:
  - name: infra
    source: "@orchstep/demo-aws-infra"
    config:
      region: "{{ vars.region }}"        # Flows to demo-aws-infra
      vpc_cidr: "{{ vars.vpc_cidr }}"    # ...which passes to demo-aws-networking
```

[View full showcase ->](https://github.com/orchstep/orchstep/tree/main/showcases/01-three-tier-web-app)

---

## 2. K8s + Helm Deployment

**What it proves:** 2-layer module chain, Helm chart management, conditional rollback on health check failure.

**Architecture:** Main workflow -> `demo-k8s-deploy` (composite) -> `demo-k8s-namespace` (leaf). Ensures namespace with quotas and RBAC, deploys via Helm, checks health, and rolls back if unhealthy.

**Key pattern:** Conditional rollback -- if the health check fails, Helm automatically reverts:

```yaml
- name: rollback
  module: helm
  task: rollback
  if: '{{ eq steps.check_health.healthy "false" }}'
```

[View full showcase ->](https://github.com/orchstep/orchstep/tree/main/showcases/02-k8s-helm-deployment)

---

## 3. Multi-Cloud Deployment

**What it proves:** Vendor independence through module abstraction. Same workflow, different cloud -- swap by changing one variable.

**Architecture:** `switch/case` on `vars.cloud_provider` selects AWS or GCP infrastructure modules. Both expose identical output interfaces (`vpc_id`, `subnet_ids`, `instance_ids`).

**Key pattern:** One workflow, swap cloud implementation:

```yaml
- name: provision
  switch: "{{ vars.cloud_provider }}"
  cases:
    aws:
      - module: aws
        task: provision
    gcp:
      - module: gcp
        task: provision
```

```bash
orchstep run                             # Defaults to AWS
orchstep run --var cloud_provider=gcp    # Switch to GCP
```

[View full showcase ->](https://github.com/orchstep/orchstep/tree/main/showcases/03-multi-cloud-deployment)

---

## 4. Platform Golden Path

**What it proves:** Multi-module service standardization. How platform teams compose independent modules into a "create new microservice" workflow.

**Architecture:** 5 leaf modules composed in sequence -- repo scaffold, CI pipeline, observability, health check, Slack notification. Service metadata flows via scoped vars to all modules.

**Key pattern:** Each module is independently configurable but composed into a standard path:

```yaml
modules:
  - name: scaffold
    source: "@orchstep/demo-repo-scaffold"
    config:
      repo_name: "{{ vars.service_name }}"
      language: "{{ vars.language }}"

  - name: ci
    source: "@orchstep/demo-ci-pipeline"
    config:
      provider: "github"
      stages: "lint test build deploy"
```

[View full showcase ->](https://github.com/orchstep/orchstep/tree/main/showcases/04-platform-golden-path)

---

## 5. Compliance-Gated Release

**What it proves:** Governance as code. Environment-scoped approval gates, security scanning, audit trail generation.

**Architecture:** Security scan -> compliance report -> conditional approval gate (production only) -> git release -> Slack notification.

**Key pattern:** Production requires explicit approval; staging deploys freely:

```yaml
- name: approval_gate
  module: approval
  task: request_approval
  if: '{{ eq vars.target_env "production" }}'
```

```bash
orchstep run --var target_env=staging     # Skips approval gate
orchstep run --var target_env=production  # Requires approval
```

[View full showcase ->](https://github.com/orchstep/orchstep/tree/main/showcases/05-compliance-gated-release)

---

## 6. Machine Provisioning

**What it proves:** Desired state convergence, OS-aware package management, role-based configuration.

**Architecture:** Main workflow -> `demo-machine-setup` (composite) -> `demo-package-manager` (leaf). Defines desired state (tools, shell config, SSH keys), converges via install-verify loops, and validates the final machine state.

**Key pattern:** Role-based package selection with OS abstraction:

```yaml
- name: select_packages
  switch: "{{ vars.role }}"
  cases:
    frontend:
      - func: shell
        do: echo "packages=node npm yarn git curl"
    backend:
      - func: shell
        do: echo "packages=go docker kubectl helm git curl"
    fullstack:
      - func: shell
        do: echo "packages=git curl node npm go docker kubectl helm"
```

```bash
orchstep run                        # Defaults to fullstack
orchstep run --var role=backend     # Backend tools only
orchstep run --var role=frontend    # Frontend tools only
```

[View full showcase ->](https://github.com/orchstep/orchstep/tree/main/showcases/06-machine-provisioning)

---

## Running Showcases

All showcases use simulated modules (`demo-*` prefix) -- no cloud credentials required.

```bash
cd showcases/01-three-tier-web-app
orchstep run                           # Run with defaults
orchstep run --var region=eu-west-1    # Override variables
orchstep list                          # List available tasks
```

## Demo Modules

The 18 demo modules used by showcases are published in the [module registry](https://github.com/orchstep/orchstep/blob/main/modules/registry.json). Four are **composite modules** that themselves import other modules:

| Composite Module | Imports | Used by |
|-----------------|---------|---------|
| `demo-aws-infra` | networking, ec2, rds | Showcases 01, 03 |
| `demo-k8s-deploy` | k8s-namespace | Showcase 02 |
| `demo-gcp-infra` | gcp-networking | Showcase 03 |
| `demo-machine-setup` | package-manager | Showcase 06 |
