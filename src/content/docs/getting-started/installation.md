---
title: Installation
description: Install OrchStep on macOS, Linux, or Windows
---

## Quick Install

```bash
curl -fsSL https://orchstep.dev/install.sh | sh
```

## Package Managers

| Platform | Command |
|----------|---------|
| Homebrew | `brew tap orchstep/tap && brew install orchstep` |
| npm | `npm install -g orchstep` |
| pip | `pip install orchstep` |
| Docker | `docker pull orchstep/orchstep:latest` |

## GitHub Action

```yaml
steps:
  - uses: orchstep/orchstep/action@main
    with:
      version: latest
  - run: orchstep run deploy
```

## Verify

```bash
orchstep version
```
