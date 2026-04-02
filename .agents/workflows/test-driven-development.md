---
description: How to implement features and bug fixes using strict TDD — write test first, watch it fail, then write minimal code
---

# Test-Driven Development Workflow
**Source: Adapted from Superpowers `test-driven-development` skill for Antigravity IDE**

## Iron Law
```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

Write code before the test? Delete it. Start over. No exceptions.

## Red-Green-Refactor Cycle

### 🔴 RED — Write Failing Test
1. Write ONE minimal test showing what should happen.
2. Clear name, tests real behavior, one thing only.
3. Requirements: One behavior, clear name, real code (no mocks unless unavoidable).

### ⚠️ Verify RED — Watch It Fail (MANDATORY)
// turbo
```bash
npm test path/to/test.test.ts
```
- Confirm: Test FAILS (not errors)
- Failure message is expected
- Fails because feature missing (not typos)

### 🟢 GREEN — Minimal Code
1. Write the SIMPLEST code to pass the test.
2. Don't add features, refactor, or "improve" beyond the test.

### ⚠️ Verify GREEN — Watch It Pass (MANDATORY)
// turbo
```bash
npm test path/to/test.test.ts
```
- Confirm: Test passes
- Other tests still pass
- Output pristine (no errors, warnings)

### 🔵 REFACTOR — Clean Up
- After green only: remove duplication, improve names, extract helpers.
- Keep tests green. Don't add behavior.

### 🔄 REPEAT
Next failing test for next feature.

## When to Use
**Always:** New features, Bug fixes, Refactoring, Behavior changes.

**Exceptions (ask CEO first):** Throwaway prototypes, Generated config files.

## Verification Checklist
Before marking any implementation complete:
- [ ] Every new function has a test
- [ ] Watched each test fail before implementing
- [ ] Each test failed for expected reason
- [ ] Wrote minimal code to pass each test
- [ ] All tests pass
- [ ] Output pristine
- [ ] Edge cases covered

Can't check all boxes? You skipped TDD. Start over.
