---
title: Use Cases
description: Real-world automation scenarios powered by OrchStep
---

See how OrchStep solves real operational challenges. Each demo is a complete workflow you can run.

---

## 1. Post-Deploy Smoke Test

**Problem:** After every deployment, teams need to confirm the service is alive and its dependencies are reachable. This is often a manual `curl` check or a brittle shell script with no structured reporting.

**OrchStep solution:** A declarative smoke test pipeline that hits endpoints, asserts expected status codes, and produces a consolidated pass/fail report.

```yaml
steps:
  - name: check_health
    desc: "Check the health endpoint (expects 200)"
    func: shell
    do: |
      echo "Checking {{ vars.app_name }} {{ vars.health_endpoint }}..."
    outputs:
      status_code: "200"

  - name: verify_health
    desc: "Assert health endpoint returned 200"
    func: assert
    args:
      condition: '{{ eq steps.check_health.status_code "200" }}'
      desc: "Health endpoint must return 200"

  - name: print_summary
    func: shell
    do: |
      echo "{{ vars.health_endpoint }}  -> {{ steps.check_health.status_code }} OK"
      echo "{{ vars.api_endpoint }}     -> {{ steps.check_api.status_code }} OK"
```

**Features demonstrated:** Step outputs, assertions with `func: assert`, variable templating with `defaults:`, task delegation

[View full demo ->](https://github.com/orchstep/orchstep/tree/main/demos/01-post-deploy-smoke-test)

---

## 2. Release Notes Generator

**Problem:** Writing release notes is tedious and error-prone. Engineers either skip them entirely or produce inconsistent, incomplete changelogs. Commits need to be categorized, counted, and formatted every release.

**OrchStep solution:** A pipeline that collects commits between two version tags, categorizes them by conventional-commit prefix, and generates a structured markdown changelog.

```yaml
defaults:
  version: "2.5.0"
  previous_version: "2.4.0"

steps:
  - name: fetch_commits
    func: shell
    do: |
      echo "Fetching commits between v{{ vars.previous_version }}..v{{ vars.version }}"
    outputs:
      commit_count: "10"

  - name: categorize
    func: shell
    do: |
      echo "=== FEATURES ==="
      echo "=== BUG FIXES ==="
    outputs:
      feature_count: "3"
      fix_count: "4"

  - name: verify_content
    func: assert
    args:
      condition: '{{ ne steps.fetch_commits.commit_count "0" }}'
      desc: "Release must contain at least one commit"
```

**Features demonstrated:** Multi-step pipelines with chained outputs, assertions as quality gates, template expressions in shell scripts

[View full demo ->](https://github.com/orchstep/orchstep/tree/main/demos/02-release-notes-generator)

---

## 3. Secret Rotation (TLS Certificates)

**Problem:** Certificate rotation is high-risk and time-sensitive. A manual process involves multiple `openssl`, `kubectl`, and verification commands that must execute in the right order. Missing a step can cause outages.

**OrchStep solution:** A codified rotation procedure that checks expiry, generates a new cert, deploys it to Kubernetes, verifies it is being served (with retry), and cleans up -- the same way every time.

```yaml
steps:
  - name: check_expiry
    func: shell
    do: |
      echo "Checking certificate at {{ vars.cert_path }}/tls.crt ..."
    outputs:
      days_remaining: "4"
      status: "EXPIRING_SOON"

  - name: verify_rotation_needed
    func: assert
    args:
      condition: '{{ eq steps.check_expiry.status "EXPIRING_SOON" }}'

  - name: verify_serving
    func: shell
    retry:
      max_attempts: 3
      interval: 2s
      backoff_rate: 2.0
    do: |
      echo "Verifying certificate served by {{ vars.service_name }}..."
    outputs:
      served_serial: "{{ steps.generate_cert.new_serial }}"
```

**Features demonstrated:** Retry with exponential backoff, assertions at critical checkpoints, cross-step output references, strict ordering of operations

[View full demo ->](https://github.com/orchstep/orchstep/tree/main/demos/03-secret-rotation)

---

## 4. Multi-Repo Version Bump

**Problem:** Updating a shared library across multiple downstream repositories requires coordinated changes -- cloning, updating, testing, committing, and opening PRs in each repo. Doing this manually is tedious and error-prone.

**OrchStep solution:** A workflow that iterates over a list of repos, bumps the dependency version in each, and opens pull requests -- all driven by simple `defaults:` variables.

```yaml
defaults:
  library_name: "shared-utils"
  new_version: "2.4.0"
  repos: "frontend-app backend-api data-pipeline admin-dashboard"

steps:
  - name: bump_versions
    func: shell
    do: |
      for repo in {{ vars.repos }}; do
        echo "  [update] Updating {{ vars.library_name }} to {{ vars.new_version }}"
        echo "  [pr]     Created PR for ${repo}"
      done
      echo "PR_SUMMARY=${PR_LIST}"
    outputs:
      pr_summary: '{{ result.output | regexFind "PR_SUMMARY=(.+)" }}'
```

**Features demonstrated:** Shell loops over space-separated lists, `regexFind` for output extraction, step output references across the pipeline

[View full demo ->](https://github.com/orchstep/orchstep/tree/main/demos/04-multi-repo-version-bump)

---

## 5. Incident Response Runbook

**Problem:** When a production service goes down, engineers scramble through ad-hoc commands. Triage is inconsistent -- different engineers check different things in different orders. Evidence gets lost, and root cause analysis is delayed.

**OrchStep solution:** A structured triage pipeline that gathers system metrics, checks service health, collects logs, correlates with recent deployments, determines probable cause, notifies the team, and generates an incident report.

```yaml
steps:
  - name: gather_system_info
    func: shell
    do: |
      echo "MEMORY_PERCENT=92"
      echo "CPU_LOAD=12.4"
    outputs:
      memory_percent: '{{ result.output | regexFind "MEMORY_PERCENT=([0-9]+)" }}'
      cpu_load: '{{ result.output | regexFind "CPU_LOAD=([0-9.]+)" }}'

  - name: determine_cause
    func: shell
    do: |
      echo "Failed dependency:  {{ steps.check_service_health.failed_dependency }}"
      echo "Dominant error:     {{ steps.collect_recent_logs.dominant_error }}"
      echo "Recent deployment:  {{ steps.check_recent_deployments.recent_deploy }}"
      echo "LIKELY_CAUSE=rabbitmq_upgrade_incompatibility"
    outputs:
      likely_cause: '{{ result.output | regexFind "LIKELY_CAUSE=([a-z_]+)" }}'
```

**Features demonstrated:** Multi-step evidence chain, `regexFind` output extraction, cross-step data correlation, template expressions in shell commands

[View full demo ->](https://github.com/orchstep/orchstep/tree/main/demos/05-incident-response-runbook)

---

## 6. Infrastructure Drift Detection

**Problem:** Infrastructure drift occurs when the actual state of cloud resources diverges from what is defined in Terraform. Manual `terraform plan` reviews are infrequent, and drift can go unnoticed for weeks until it causes an outage.

**OrchStep solution:** An automated pipeline that runs a Terraform plan, parses the results, assesses severity (ok/warning/critical), and sends alerts only when drift is found.

```yaml
steps:
  - name: terraform_plan
    func: shell
    do: |
      echo "Running: terraform plan -detailed-exitcode"
      echo "Plan: 1 to add, 2 to change, 1 to destroy."
      echo "PLAN_ADD=1"
      echo "PLAN_CHANGE=2"
      echo "PLAN_DESTROY=1"
    outputs:
      additions: '{{ result.output | regexFind "PLAN_ADD=([0-9]+)" }}'
      changes: '{{ result.output | regexFind "PLAN_CHANGE=([0-9]+)" }}'
      deletions: '{{ result.output | regexFind "PLAN_DESTROY=([0-9]+)" }}'

  - name: assess_severity
    func: shell
    do: |
      TOTAL={{ steps.parse_drift.total_drift }}
      if [ "${TOTAL}" -eq 0 ]; then SEVERITY="ok"
      elif [ "${DELETIONS}" -gt 0 ]; then SEVERITY="critical"
      else SEVERITY="warning"
      fi
      echo "DRIFT_SEVERITY=${SEVERITY}"
    outputs:
      drift_severity: '{{ result.output | regexFind "DRIFT_SEVERITY=([a-z]+)" }}'
```

**Features demonstrated:** Assert steps for validation gates, conditional logic in shell, `regexFind` output chaining, severity classification patterns

[View full demo ->](https://github.com/orchstep/orchstep/tree/main/demos/06-infra-drift-detection)

---

## 7. Developer Onboarding

**Problem:** Onboarding a new developer involves dozens of manual steps: installing tools, cloning repos, setting up databases, verifying services. Different teams need different tools. The process is inconsistent and can take days when it should take hours.

**OrchStep solution:** A team-aware onboarding pipeline that checks prerequisites, clones the right repos, seeds databases, verifies services, and delivers a personalized welcome message -- all parameterized by team role.

```yaml
defaults:
  team: "backend"
  developer_name: "Jane Doe"

steps:
  - name: check_prerequisites
    func: shell
    do: |
      if [ "{{ vars.team }}" = "backend" ]; then
        echo "Checking go... [OK]"
        echo "Checking postgresql-client... [OK]"
      elif [ "{{ vars.team }}" = "frontend" ]; then
        echo "Checking node... [OK]"
      fi

  - name: clone_repos
    func: shell
    do: |
      if [ "{{ vars.team }}" = "backend" ]; then
        echo "Cloning api-service, shared-libs, data-models"
        echo "repos_cloned=3"
      fi
    outputs:
      repos_cloned: '{{ result.output | regexFind "repos_cloned=([0-9]+)" }}'
```

**Features demonstrated:** Conditional logic per variable value, `regexFind` for output extraction, sequential step dependencies, personalized output aggregation

[View full demo ->](https://github.com/orchstep/orchstep/tree/main/demos/07-developer-onboarding)

---

## 8. Flaky Test Triage

**Problem:** CI pipelines fail constantly due to flaky tests. Engineers waste 15-30 minutes per occurrence investigating failures that turn out to be known issues. Genuine regressions get lost in the noise, and merge velocity drops.

**OrchStep solution:** An automated triage pipeline that fetches CI results, matches failures against a known-flaky pattern database, categorizes each failure, and decides whether to re-run, alert, or both.

```yaml
steps:
  - name: identify_known_flaky
    func: shell
    do: |
      echo "  [FLAKY] TestUserAuth_TokenRefresh - matches pattern (JIRA-1234)"
      echo "  [FLAKY] TestPaymentProcess_Stripe - matches pattern (JIRA-1456)"
      echo "  [GENUINE] TestUserProfile_AvatarUpload - no matching pattern"
      echo "flaky_count=5 genuine_count=2"
    outputs:
      flaky_count: '{{ result.output | regexFind "flaky_count=([0-9]+)" }}'
      genuine_count: '{{ result.output | regexFind "genuine_count=([0-9]+)" }}'

  - name: decide_action
    func: shell
    do: |
      echo "Decision: ALERT + SELECTIVE_RERUN"
      echo "  - Re-running {{ steps.identify_known_flaky.flaky_count }} known flaky tests"
      echo "  - Alerting about {{ steps.identify_known_flaky.genuine_count }} genuine failures"
      echo "action=alert_and_rerun"
    outputs:
      action: '{{ result.output | regexFind "action=([a-z_]+)" }}'
```

**Features demonstrated:** Pattern matching and categorization, data flow between steps driving decisions, structured reporting with aggregated metrics

[View full demo ->](https://github.com/orchstep/orchstep/tree/main/demos/08-flaky-test-triage)

---

## 9. AI Agent Task Pipeline

**Problem:** AI agents are powerful but non-deterministic. There is no audit trail of what the AI produced, quality is unpredictable, retry logic is ad-hoc, and token costs are invisible. If the pipeline fails at step 4, you lose the work from steps 1-3.

**OrchStep solution:** Deterministic scaffolding around AI tasks -- structured logging, quality gates that score output against criteria, retry logic with feedback, and result persistence with full provenance metadata.

```yaml
steps:
  - name: execute_ai_agent
    func: shell
    do: |
      echo "Sending prompt to model..."
      echo "Token usage: input=1247 output=834 total=2081"
      echo "attempt=1 tokens=2081"
    outputs:
      attempt: '{{ result.output | regexFind "attempt=([0-9]+)" }}'
      tokens_used: '{{ result.output | regexFind "tokens=([0-9]+)" }}'

  - name: validate_quality
    func: shell
    do: |
      echo "  [PASS] Contains revenue figure"
      echo "  [WARN] Missing gross margin breakdown"
      echo "Quality Score: 8/10"
      echo "quality_score=8 verdict=PASS"
    outputs:
      quality_score: '{{ result.output | regexFind "quality_score=([0-9]+)" }}'
      verdict: '{{ result.output | regexFind "verdict=([A-Z]+)" }}'
```

**Features demonstrated:** Deterministic checkpoints for audit trails, quality gates with scoring, retry logic based on output validation, token and cost tracking through step outputs

[View full demo ->](https://github.com/orchstep/orchstep/tree/main/demos/09-ai-agent-task-pipeline)

---

## 10. Compliance Evidence Collection

**Problem:** Preparing for SOC2, HIPAA, or ISO 27001 audits requires collecting evidence across dozens of control domains. Manual collection is inconsistent, spans multiple days creating temporal gaps, and disrupts engineering work for a week each audit cycle.

**OrchStep solution:** An automated evidence collection pipeline that covers five control domains (access control, encryption, backups, network security, change management), produces consistently formatted artifacts, and aggregates pass/fail results into an auditor-ready package.

```yaml
defaults:
  audit_type: "soc2"
  collection_date: "2026-03-11"

steps:
  - name: collect_access_control
    func: shell
    do: |
      echo "IAM Users: 47 active, MFA: 100%"
      echo "Evidence exported: access-control-{{ vars.collection_date }}.json"
      echo "controls_checked=6 controls_passed=6"
    outputs:
      controls_passed: '{{ result.output | regexFind "controls_passed=([0-9]+)" }}'
      total_controls: '{{ result.output | regexFind "controls_checked=([0-9]+)" }}'

  - name: generate_evidence_package
    func: shell
    do: |
      echo "Access Control:     {{ steps.collect_access_control.controls_passed }}/{{ steps.collect_access_control.total_controls }} passed"
      echo "Encryption:         {{ steps.collect_encryption.controls_passed }}/{{ steps.collect_encryption.total_controls }} passed"
      echo "Overall: 24/24 controls passed"
```

**Features demonstrated:** Multi-domain evidence collection, parameterized audit type, consistent output format across steps, aggregated summary from step outputs

[View full demo ->](https://github.com/orchstep/orchstep/tree/main/demos/10-compliance-evidence-collection)
