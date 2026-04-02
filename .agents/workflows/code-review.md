---
description: How to conduct code reviews after completing a major implementation step — plan alignment, quality, security
---

# Code Review Workflow
**Source: Adapted from Superpowers `code-reviewer` skill for Antigravity IDE**

## When to Use
After completing a major project step, before committing to main branch.

## Review Checklist

### 1. Plan Alignment Analysis
- Compare implementation against the original plan document
- Identify deviations: justified improvements or problematic departures?
- Verify ALL planned functionality has been implemented

### 2. Code Quality Assessment
- Proper error handling, type safety, defensive programming
- Code organization, naming conventions, maintainability
- Test coverage and quality of test implementations
- Security vulnerabilities or performance issues

### 3. Architecture and Design Review
- SOLID principles and established patterns followed?
- Proper separation of concerns and loose coupling?
- Integration with existing systems?
- Scalability and extensibility considerations?

### 4. ConditionAI-Specific Compliance Check
- [ ] **No medical terminology violations** (20 prohibited words)
- [ ] **Risk triage levels** properly implemented (A/B/C classification)
- [ ] **Tag array matching** logic correct (`applicable_tags` intersection)
- [ ] **Confidence threshold** enforced (no advice below match threshold)
- [ ] **No `.env` file reads/writes** in any committed code

### 5. Issue Categorization
Report issues as:
- **🔴 Critical (must fix):** Blocks deployment or violates compliance
- **🟡 Important (should fix):** Affects quality or maintainability
- **🟢 Suggestion (nice to have):** Improvements for future

### 6. Communication
- Acknowledge what was done well BEFORE highlighting issues
- For each issue: specific examples + actionable fix recommendations
- If plan itself has problems: recommend plan updates
