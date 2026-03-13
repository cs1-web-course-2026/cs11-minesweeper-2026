---
name: pr-review
description: Reviews one or more pull requests in this repository using two AI reviewers (Claude Sonnet 4.6 and GPT-5.3-Codex) and posts a combined AI-generated GitHub review with inline comments. Use this skill when asked to review a PR, review pull requests, or given a list of PR numbers to review.
---

Review the pull requests listed below using two dedicated reviewer sub-agents — one running Claude Sonnet 4.6 and one running GPT-5.3-Codex — then merge their findings into a single combined GitHub review for each PR.

## Input

You will receive a list of PR numbers. Examples of how a user might provide them:

- `Review PRs 3, 7 and 12`
- `Review PR #5`
- `Review pull requests 1, 2, 3`

Parse all PR numbers from the user's message and store them as a list. Process each PR **sequentially** (finish one before starting the next).

## Process per PR

Repeat the following steps for **each PR number** in the list:

### Step 1 — Checkout and discover remote

Follow Steps 1–2 of `.github/prompts/review-pr.prompt.md`:

```bash
git fetch origin
gh pr checkout {pr_number}
git pull origin
git remote -v
```

Extract `owner` and `repo` from the remote URL.

### Step 2 — Fetch PR metadata and diff

In parallel, fetch:

- PR details (title, author, head SHA, base branch) via `gh api /repos/{owner}/{repo}/pulls/{pr_number}`
- Full unified diff via `gh api /repos/{owner}/{repo}/pulls/{pr_number} --header "Accept: application/vnd.github.v3.diff"`
- Changed files list via `gh api /repos/{owner}/{repo}/pulls/{pr_number}/files`

### Step 3 — Run Claude Sonnet 4.6 reviewer sub-agent

Invoke the `pr-reviewer-claude` sub-agent, passing:

- The PR number
- The unified diff text
- The head SHA

Wait for it to return its JSON findings (list of issues labelled `[Claude Sonnet 4.6]`).

### Step 4 — Run GPT-5.3-Codex reviewer sub-agent

Invoke the `pr-reviewer-codex` sub-agent, passing:

- The PR number
- The unified diff text
- The head SHA

Wait for it to return its JSON findings (list of issues labelled `[GPT-5.3-Codex]`).

### Step 5 — Merge findings

Combine the two issue lists. Deduplicate issues that point to the exact same file and line — keep both labels if two reviewers independently raised the same issue. Determine the combined `event`:

- `REQUEST_CHANGES` if either reviewer returned `REQUEST_CHANGES`
- `COMMENT` if both returned `COMMENT`
- `APPROVE` only if both returned `APPROVE`

### Step 6 — Build and post the combined review

Build the review payload following the format in Step 5 of `.github/prompts/review-pr.prompt.md`.

In the overview body, include a `### Reviewers` section listing both models used:

```markdown
### Reviewers

- 🤖 Claude Sonnet 4.6
- 🤖 GPT-5.3-Codex
```

Mark the entire review body and all inline comments as `[AI Generated]`.

Post via:

```bash
gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  /repos/{owner}/{repo}/pulls/{pr_number}/reviews \
  --input /tmp/review_payload_{pr_number}.json
```

Verify inline comments were attached as described in Step 6 of `.github/prompts/review-pr.prompt.md`.

## Final report

After all PRs have been processed, report back a summary for each PR:

- Review URL (`html_url`).
- Review state (`CHANGES_REQUESTED` / `COMMENT` / `APPROVE`).
- Number of inline comments posted.
- Bullet list of all issues found, grouped by severity, with the model label that raised each one.
