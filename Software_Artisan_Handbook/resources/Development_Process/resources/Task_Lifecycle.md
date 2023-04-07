# Task Lifecycle

## I. New Task

- Make sure that every task with a lifecycle duration of 30 minutes or more is tracked on Jira. If not, request the task creator to create it.
- Make sure that every task has all the necessary components so that any Dev who reads it can understand what needs to be done:
  - **Name**: (required)
    The task name must be easy to understand (immediately know what the task is, and which module it belongs to...). If the name is unclear, request the task creator to rename it. Or rename the task yourself, after understanding the task.
  - **Description**: (required)
    1. The description should cover at least two questions: What? Why? Especially the WHY part is very important but often overlooked.
    2. The task creator may provide When and How. Dev needs to be aware to clarify What and Why to validate When and How.
    3. If the description is difficult to understand or lacks information, request the task creator to add more information.
    4. Common information in Description:
       1. Which module
       2. Which customer
       3. Which user role
       4. Domain knowledge if any
       5. Use cases
       6. Other related information
  - **Priority** (required)
  - **Due date** (required) - Due date is the date the task is deployed or released (depending on requirements), each Dev must ensure that their task meets the Due Date on time.
  - **Env** (required) (For more information, see [System Environment](System_Environment.md))
  - **UI** - Link to accompanying interface if any
  - **Related tasks**
  - **References resources**
- When you see a task with problems, you can give feedback to the task creator or raise it to the team for discussion.

## II. Research / Investigate

- For all tasks, it is necessary to have a step of understanding the task, and conducting research for additional information and knowledge if necessary. This step can be quick or slow depending on the task. This is the most important step and should not be skipped and jumping into code immediately. For small tasks, this step can be done quickly.
- During the research process, if there are any difficult issues, immediately proactively seek help from others.
- After researching and investigating, update the just-learned content to the Jira task. This step is very important to help anyone who reads the Jira task understand it.
- After researching and investigating, if it is found that this task requires the support of others (e.g., need to create fields, create database columns, create permissions, create test data, confirm information with customers...), proactively create subtasks & checklists, and notify that person.
- Provide an end-to-end solution: The solution must be clear, solve the task, and solve the use cases of the task. The solution must clearly demonstrate what needs to be done from start to finish. Avoid solutions that are too general or half-baked.

## III. Solution Review

This step is taken after completing research and coming up with a solution, immediately seeking peer/leader review and confirmation. This step helps everyone understand how this task will be performed, any potential side effects, whether the solution is appropriate, and whether there is any conflict with other parts of the system or other tasks.

- For familiar, repeated tasks with an available solution and document, skip this step.
- For small, simple tasks with few side effects, the total time is about 2 hours: this step can be skipped if urgent or if the reviewer is busy, but it is still encouraged.
- For complex tasks, it is necessary to write/illustrate the necessary information/diagrams and prepare related article/document links and organize a meeting to discuss together.

## IV. Coding

- Create a feature branch (prefix `feature/`) (or bugfix branch `bugfix/`) from the branch of the Environment. If this is a hotfix, create a `hotfix/` branch from the `main`.
- Must push code to GitHub every day, to avoid losing code.
- Log work every day.
- On the first push of code, immediately create a PR with the `Draft` status. Naming convention: `Draft: [Jira-issue-id] Name of PR` and set the PR as `Draft` in GitHub. Putting the Jira Id in the PR description (GitHub automatically put a reference Jira link into the Id).
- All commits must ensure the correct convention: `[Jira-issue-id] commit message`. All commits must follow the convention, including commits that fix code review feedback.
- Ensure that VSCode has all necessary extensions installed, such as ESLint and Prettier, to format code and catch code convention errors for standardization. The list of recommended extensions can be found in the [VSCode Recommended Extensions](../VS_Code_Recommended_Extensions.md).
- When encountering difficulties during coding (e.g., taking more than 30 minutes to solve), immediately proactively seek help.
- When writing code, ensure the following priorities:
  - code runs correctly.
  - code is clean, easy to read, and has correct conventions.
  - code runs optimally.
- When writing code, pay attention to reviewing related old code to understand whether the code you are writing has any impact. When reusing someone else's code, read and understand it carefully, avoiding misuse.
- When modifying someone else's code, always ask them first to understand it clearly.
- When resolving conflicts during a merge/rebase, if there are related parts of others, seek support from the relevant person to avoid resolving conflict wrongly.

## V. Testing

- Must self-test all use cases and all main flows of the task.
- Must re-test other features if the code is related.
- Update How to test in Jira task if there are special notes when testing the task.
- If some necessary test data need to be created but you don't know how to create it, ask QA/QC or the task creator for help.
- If there is a merge conflict, after resolving the conflict, we must re-test the related feature to ensure it works correctly.

## VI. Code Review

- Update the name of the PR, and remove the Draft status.
- Self-review the PR and your code changes. Remove any obvious mistakes such as `console.log`, file name typos, forgot code push, etc.
- Remind the reviewer daily for the PR to be reviewed.
- If this is an urgent task, clearly state the importance/priority, deadline of the task, and consequences if the task is late completed so that the reviewer prioritizes reviewing. Raise to the team if the task shows signs of delay.

## VII. Deploying

- Proactively monitor the status of a task whether it has been deployed or not. If not deployed, push the person in charge of deployment.
- Push and remind deployment similar to Code Review above.

## VIII. Releasing

- Must know whether the task needs to be released urgently or not.
- Push and remind release similar to Code Review and Deploy.
- After the task has been successfully released, update the status of the Jira Task to Done.

_**Dev must always be the one who understands their task the most and is also the highest responsible person for their task.**_
