---
description: How to verify work is truly complete before claiming success — evidence before assertions, always
---

# Verification Before Completion Workflow
**Source: Adapted from Superpowers `verification-before-completion` skill for Antigravity IDE**

## Iron Law
```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

If you haven't run the verification command in this message, you cannot claim it passes.

## The Gate Function

```
BEFORE claiming any status:

1. IDENTIFY: What command proves this claim?
2. RUN: Execute the FULL command (fresh, complete)
3. READ: Full output, check exit code, count failures
4. VERIFY: Does output confirm the claim?
   - If NO: State actual status with evidence
   - If YES: State claim WITH evidence
5. ONLY THEN: Make the claim

Skip any step = lying, not verifying
```

## Verification Requirements

| Claim | Requires | NOT Sufficient |
|-------|----------|----------------|
| Tests pass | `npm test` output: 0 failures | Previous run, "should pass" |
| Types clean | `npx tsc --noEmit` output: 0 errors | Partial check |
| Build succeeds | `npm run build` exit 0 | Linter passing |
| Bug fixed | Test original symptom: passes | "Code changed, assumed fixed" |
| Schema valid | SQL migration runs without error | "Looks correct" |

## Red Flags — STOP

- Using "should", "probably", "seems to"
- Expressing satisfaction before verification ("Great!", "Done!")
- About to commit without verification
- Relying on partial verification
- ANY wording implying success without having run verification

## Rationalization Prevention

| Excuse | Reality |
|--------|---------|
| "Should work now" | RUN the verification |
| "I'm confident" | Confidence ≠ evidence |
| "Linter passed" | Linter ≠ compiler |
| "Just this once" | No exceptions |

## The Bottom Line

**Run the command. Read the output. THEN claim the result. Non-negotiable.**
