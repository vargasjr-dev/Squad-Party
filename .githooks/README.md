# Git Hooks

This directory contains shared git hooks for the project.

## Setup

Run this once after cloning to enable the hooks:

```bash
git config core.hooksPath .githooks
```

## Hooks

### pre-push

Prevents direct pushes to `main`. All changes must go through PRs to ensure CI checks and code review.
