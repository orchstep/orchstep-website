---
title: Website TODO
description: Tracking page for website content gaps, corrections, and planned improvements
---

# Website Content TODO

Tracking page for content that needs fixing, adding, or improving. Check items off as completed.

## Syntax Corrections Needed

- [ ] All examples using `vars:` at workflow top-level → change to `defaults:`
- [ ] All examples using `message:` in assert → change to `desc:`
- [ ] All examples using `do:` on assert → change to `args: condition:`
- [ ] All examples with `else:` containing direct inline steps → add `then:` wrapper
- [ ] All examples using `vars:` for task call parameters → change to `with:`
- [ ] Verify all `outputs:` templates use correct result fields (`result.data_object` not `result.json`)

## Missing Feature Documentation

- [x] Shell execution spec page (shell types: `shell`, `gosh`, `bash`, `zsh`, `pwsh`)
- [x] Shell function reference updated with shell type configuration
- [x] Quick-start updated with shell type note (POSIX sh default, gosh for Windows)
- [ ] `parallel:` block syntax and usage (implemented, not documented)
- [ ] `@private/` module scope (Pro feature, not documented)
- [ ] `orchstep license` commands (activate, status, deactivate)
- [ ] `orchstep inspect` command (Pro)
- [ ] `orchstep report` command (Pro, supports text/json/csv/html/markdown)
- [ ] `orchstep team` commands (Pro: list, add, remove, sync)
- [ ] `orchstep audit` commands (Pro: query, export)
- [ ] `orchstep governance` commands (Pro: check)
- [ ] `orchstep module publish` (Pro: private registry)
- [ ] `orchstep module list-private` (Pro)
- [ ] `orchstep module remove-private` (Pro)
- [ ] `orchstep module export-private` (Pro)
- [ ] `orchstep module search/install/validate/submit/flag` (community)
- [ ] MCP `module_install` tool
- [ ] Pro feature overview page

## Example Improvements

- [ ] Add execution output tab to all examples
- [ ] Add verification status tab to all examples
- [ ] Verify all 68 examples with `orchstep lint`
- [ ] Run all runnable examples with `orchstep run` and capture output
- [ ] Review transform examples — should show lightweight object manipulation, not scripts
- [ ] Review all function examples against design doc intent
- [ ] Add parallel execution examples to website

## Website Infrastructure

- [ ] Implement Starlight tab components for code/output/verified views
- [ ] Add CI job to re-verify examples on every push
- [ ] Set up auto-deploy from orchstep-website repo pushes

## Quality Gates

Before publishing any example:
1. Must pass `orchstep lint`
2. Must pass `orchstep run` (where possible)
3. Must use correct field names per syntax reference
4. Must demonstrate intended design pattern (not anti-patterns)
5. Must have captured execution output

## Reference

- Syntax reference: `docs/superpowers/specs/orchstep-syntax-reference.md` (to be created)
- Design spec: `docs/superpowers/specs/2026-03-26-orchstep-commercialization-design.md`
- Source of truth for field names: `orchstep-core/pkg/workflow/loader.go` struct YAML tags
