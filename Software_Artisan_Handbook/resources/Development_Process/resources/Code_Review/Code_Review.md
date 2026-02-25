# Code Review

Code review is the process of examining code to ensure it meets standards and is free of errors. In an AI-agent-first workflow, code review becomes even more critical because AI-generated code can contain subtle issues that pass automated checks but fail in production.

## Benefits of Code Review

- **Catch AI blind spots:** AI agents can hallucinate APIs, introduce scope creep, or miss business context. Human reviewers catch these.
- **Improved code quality:** Review identifies errors, bugs, and convention violations.
- **Knowledge sharing:** Review is an opportunity to learn from each other and share knowledge about best practices and new technologies.
- **Reduced development time:** Catching errors early reduces the time to fix bugs later.
- **Improved collaboration:** Review encourages collaboration and communication.

## Code Review Process

1. **Preparation:** Understand the requirements. The PR references a Jira task -- read it and understand what was asked. Also read the agent instructions documented in the PR description to understand what the AI was directed to do.

2. **Review:** Follow the [Code Review Checklist](./resources/Code_Review_Checklist.md). For AI-generated code, also follow [Reviewing AI Generated Code](./resources/Reviewing_AI_Generated_Code.md). Activate strict mode and maintain high standards.

3. **Feedback:** Provide constructive, specific feedback. Focus on improving quality. When the code was AI-generated, feedback about the *prompting approach* is also valuable (e.g., "Next time, scope the agent to only this module").

4. **Revision:** The developer revises based on feedback:
   - Address all issues identified.
   - Create a new commit for each round of feedback.
   - Mark feedback as resolved once changes are made.
   - For AI-generated code: the developer may re-prompt the agent with the reviewer's feedback and verify the new output.

5. **Approval:** Review the revised code. If it meets standards, approve and merge.

## Best Practices for Code Review

- **Be specific:** Feedback should be specific and actionable. Vague feedback is less helpful.
- **Be constructive:** Aim to help the developer improve. Deliver feedback respectfully.
- **Be timely:** Review promptly, ideally within a few days.
- **Be consistent:** Apply the same standards to all code, whether human-written or AI-generated.
- **Check agent compliance:** Verify the code follows team convention skills. See [Reviewing AI Generated Code](./resources/Reviewing_AI_Generated_Code.md).

## [Reviewee Convention](./resources/Reviewee_Convention.md)

Developers should follow this convention when creating Pull Requests.

## [Code Review Checklist](./resources/Code_Review_Checklist.md)

Checklist to ensure effective and efficient code review.

## [Reviewing AI Generated Code](./resources/Reviewing_AI_Generated_Code.md)

Specific guidance for reviewing code produced by AI agents.
