---
description: How to write and execute implementation plans — plan before coding, bite-sized tasks, checkpoints for review
---

# Implementation Planning Workflow
**Source: Adapted from Superpowers `writing-plans` + `executing-plans` skills for Antigravity IDE**

## Part A: Writing Plans

### Core Principle
Write comprehensive implementation plans assuming the engineer has zero context.
Document everything: which files to touch, exact code, testing steps, expected output.

### Plan Document Structure

```markdown
# [Feature Name] Implementation Plan

**Goal:** [One sentence]
**Architecture:** [2-3 sentences about approach]
**Tech Stack:** [Key technologies]

---

### Task N: [Component Name]

**Files:**
- Create: `exact/path/to/file.ts`
- Modify: `exact/path/to/existing.ts:123-145`
- Test: `tests/exact/path/to/test.ts`

**Step 1: Write the failing test**
[Complete test code]

**Step 2: Run test to verify it fails**
Run: `npm test path/test.ts`
Expected: FAIL with "function not defined"

**Step 3: Write minimal implementation**
[Complete implementation code]

**Step 4: Run test to verify it passes**
Run: `npm test path/test.ts`
Expected: PASS

**Step 5: Commit**
```

### Bite-Sized Granularity
Each step is ONE action (2-5 minutes):
- "Write the failing test" — step
- "Run it to make sure it fails" — step
- "Implement the minimal code" — step
- "Run tests and verify" — step
- "Commit" — step

### Save Location
Save plans to: `docs/plans/YYYY-MM-DD-<feature-name>.md`

---

## Part B: Executing Plans

### Process
1. **Load & Review** — Read plan critically. Raise concerns BEFORE starting.
2. **Execute Batch** — First 3 tasks. Follow each step exactly.
3. **Report** — Show what was implemented + verification output. Say: "Ready for feedback."
4. **Continue** — Apply feedback, execute next batch. Repeat until complete.

### When to STOP and Ask
- Hit a blocker mid-batch (missing dependency, unclear instruction)
- Verification fails repeatedly
- You don't understand an instruction

**Ask for clarification rather than guessing.**
