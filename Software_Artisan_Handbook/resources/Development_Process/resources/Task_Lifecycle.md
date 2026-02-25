# Task Lifecycle

Each phase describes the collaboration between the engineer (director/reviewer) and AI agents (executors). The engineer owns the task; agents accelerate execution.

## I. New Task

- Ensure every task with a lifecycle duration of 30 minutes or more is tracked on Jira or other project management tools. If not, request the task creator to create it.
- Ensure every task has all necessary components so that any engineer or agent reading it can understand what needs to be done:
  - **Name**: (required) -- must be easy to understand (immediately know what the task is and which module it belongs to). If unclear, request the task creator to rename it or rename it yourself after understanding.
  - **Description**: (required)
    1. Must cover at least: What? Why? The WHY is critical but often overlooked.
    2. The task creator may provide When and How. The engineer must clarify What and Why to validate When and How.
    3. If the description is unclear or lacks information, request more from the task creator.
    4. Common description elements: module, customer, user role, domain knowledge, use cases, related information.
  - **Priority** (required)
  - **Due date** (required) -- the date the task is deployed or released.
  - **Env** (required) -- see [System Environment](System_Environment.md).
  - **UI** -- link to accompanying interface if any.
  - **Related tasks**
  - **Reference resources**
- When you see a task with problems, give feedback to the task creator or raise it to the team.

**Agent role in this phase:** Use **Claude Chat** to quickly understand unfamiliar domain concepts or technologies referenced in the task. Paste the Jira task description and ask Claude to identify ambiguities or missing information.

## II. Research / Investigate

- For all tasks, understand the task and conduct research before coding. This is the most important step -- do not skip it and jump into code immediately.
- During research, if there are difficult issues, immediately seek help from others.
- After researching, update the learned content to the Jira task so anyone reading it can understand.
- If the task requires support from others (database fields, permissions, test data, customer confirmation), proactively create subtasks and notify the relevant person.
- Provide an end-to-end solution that is clear, solves the task, and covers all use cases.

**Agent role in this phase:**
- Use **Claude Chat** to research technologies, explore solutions, and brainstorm approaches.
- Use **Claude Cowork** to analyze requirements, draft solution proposals, and create diagrams.
- Use **Claude Code** to explore the codebase: `"Find all places where X is used"`, `"How does the Y module handle Z?"`.

## III. Solution Review

After completing research and forming a solution, immediately seek peer/leader review. This step ensures everyone understands the approach, identifies potential side effects, and catches conflicts with other system parts.

- For familiar, repeated tasks with available solutions, skip this step.
- For small, simple tasks (total time ~2 hours), this step can be skipped if urgent, but is still encouraged.
- For complex tasks, write/illustrate diagrams and prepare related links, then organize a discussion.
- Always propose at least 2 solutions with pros and cons.

**Agent role in this phase:** Use **Claude Cowork** to draft solution comparison documents. Use **Claude Chat** to pressure-test your solution by asking it to find flaws.

## IV. Coding

- Create a feature branch (`feat/`), bugfix branch (`fix/`), or hotfix branch (`hotfix/`) from the appropriate environment branch.
- Push code to GitHub daily to avoid losing code.
- Log work daily.
- On the first push, create a PR with `Draft` status. Naming: `Draft: [Jira-issue-id] Name of PR`. Include the Jira ID in the PR description.
- When encountering difficulties (more than 30 minutes stuck), immediately seek help.
- Code priorities:
  - [1] Code runs correctly.
  - [2] Code is clean, readable, follows conventions.
  - [3] Code runs optimally.
- Review related old code to understand potential impact. When reusing others' code, read and understand it. When modifying others' code, ask them first.
- When resolving merge conflicts that involve others' code, seek support from the relevant person.

**Agent role in this phase:**
- Use **Claude Code** as the primary coding tool. Direct it with specific tasks: `"Implement the claim case creation form following the pattern in ExistingScreen.tsx"`.
- Ensure Claude Code has convention skills installed: `/plugin install typescript-convention@papaya-pumpkin`.
- Use **Plan Mode** for complex changes: let Claude Code explore, plan, then execute.
- Review all generated code before committing. Watch for hallucinated APIs and scope creep. See [Reviewing AI Generated Code](Code_Review/resources/Reviewing_AI_Generated_Code.md).

## V. Testing

- Self-test all use cases and main flows.
- Re-test related features if code touches shared areas.
- Update "How to Test" in Jira if there are special testing notes.
- If test data is needed, ask QA/QC or the task creator.
- After resolving merge conflicts, re-test related features.

**Agent role in this phase:** Use **Claude Code** to write and run tests: `"Write unit tests for the calculateTat function"`, `"Run bun test and fix any failures"`.

## VI. Code Review

- Update the PR name and remove the Draft status.
- Self-review the PR. Remove obvious mistakes: `console.log`, typos, missed file pushes.
- Remind the reviewer daily.
- For urgent tasks, clearly state the priority, deadline, and consequences of delay.

**Agent role in this phase:**
- Use **Claude Code** to self-review: `"Review this PR diff for convention violations, potential bugs, and unnecessary changes"`.
- In the PR description, document what agent instructions were given so reviewers understand the intent. See [Reviewee Convention](Code_Review/resources/Reviewee_Convention.md).

## VII. Deploying

- Proactively monitor deployment status. If not deployed, push the person in charge.
- Push and remind similar to Code Review.

## VIII. Releasing

- Know whether the task needs urgent release.
- Push and remind similar to Code Review and Deploy.
- After successful release, update the Jira task status to Done.

_**The engineer is always the person who understands their task the most and bears the highest responsibility for it -- regardless of which agents helped execute it.**_
