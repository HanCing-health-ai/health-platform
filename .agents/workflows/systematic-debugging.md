---
description: How to systematically debug any bug, test failure, or unexpected behavior — root cause first, never guess
---

# Systematic Debugging Workflow
**Source: Adapted from Superpowers `systematic-debugging` skill for Antigravity IDE**

## Iron Law
```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

## Phase 1: Root Cause Investigation (BEFORE any fix attempt)

1. **Read Error Messages Carefully**
   - Read stack traces completely. Note line numbers, file paths, error codes.
   - Don't skip warnings — they often contain the exact solution.

2. **Reproduce Consistently**
   - Can you trigger it reliably? What are the exact steps?
   - If not reproducible → gather more data, don't guess.

3. **Check Recent Changes**
   - `git diff`, recent commits, new dependencies, config changes.

4. **Gather Evidence in Multi-Component Systems**
   - For EACH component boundary, log what data enters and exits.
   - Run once to see WHERE it breaks, THEN investigate that component.

5. **Trace Data Flow**
   - Where does the bad value originate?
   - Trace upward until you find the source. Fix at source, not symptom.

## Phase 2: Pattern Analysis

1. Find similar working code in the same codebase.
2. Compare: what's different between working and broken?
3. List every difference, however small.

## Phase 3: Hypothesis and Testing

1. State clearly: "I think X is the root cause because Y."
2. Make the SMALLEST possible change to test hypothesis.
3. One variable at a time. Don't fix multiple things at once.

## Phase 4: Implementation

1. Create a failing test case that reproduces the bug.
2. Implement a single fix addressing the root cause.
3. Verify the fix: Test passes? No other tests broken?

## The 3-Strike Rule (Critical for ConditionAI)

- If **< 3 fix attempts** failed: Return to Phase 1, re-analyze.
- If **≥ 3 fix attempts** failed: **STOP. Question the architecture.**
  - Is this pattern fundamentally sound?
  - Discuss with CEO (human partner) before attempting more fixes.
  - This is NOT a failed hypothesis — this is a wrong architecture.

## Red Flags — STOP and Return to Phase 1
- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "I don't fully understand but this might work"
- Proposing solutions before tracing data flow
- "One more fix attempt" (when already tried 2+)
