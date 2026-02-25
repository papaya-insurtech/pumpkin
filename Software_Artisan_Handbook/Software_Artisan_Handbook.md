# Software Artisan Handbook

## Overview

This handbook is designed to be a comprehensive guide that covers everything from AI-agent-first workflows to the more complex aspects of our team's development process. Whether you're a seasoned software engineer or just starting out, this handbook will be an invaluable resource as you work on projects and collaborate with other team members.

Our team operates with an AI-agent-first model. Convention skills are distributed via the [Claude Code Skills Marketplace](../../plugins/) -- install them with `/plugin marketplace add papaya-insurtech/pumpkin`.

## Section 1: AI Agent Workflow

### [AI Agent Philosophy](./resources/AI_Agent_Workflow/AI_Agent_Philosophy.md)

Why we use AI agents for all tasks, the three-tool model (Claude Chat, Claude Cowork, Claude Code), and the human's role as director/reviewer.

### [Claude Code Best Practices](./resources/AI_Agent_Workflow/Claude_Code_Best_Practices.md)

How to work effectively with Claude Code: prompting, Plan Mode, session management, and avoiding common failure patterns.

### [Agent Troubleshooting](./resources/AI_Agent_Workflow/Agent_Troubleshooting.md)

Common issues with AI agents and how to resolve them: loops, hallucinated APIs, context limits, scope creep.

## Section 2: Development Process

### [Development Process](./resources/Development_Process/Development_Process.md)

Team mindset, structure, and process references.

### [Task Lifecycle](./resources/Development_Process/resources/Task_Lifecycle.md)

The lifecycle of a task from creation to release, with AI agent collaboration at each phase.

### [Git Workflow](./resources/Development_Process/resources/Git_Workflow.md)

Branch strategy, merge/rebase conventions, and Pull Request process. Claude Code handles git operations; humans direct and resolve conflicts.

### [Code Review](./resources/Development_Process/resources/Code_Review/Code_Review.md)

Code review process, checklist, reviewee conventions, and AI-generated code review guidelines.

### [System Environment](./resources/Development_Process/resources/System_Environment.md)

Environment structure and configuration.

### [Release Process](./resources/Development_Process/resources/Release_Process.md)

Release process and checklist.

## Section 3: Tools & Environment

### [Tech Stack](./resources/Tech_Stack.md)

Our technology stack including AI tools.

### [OS Softwares And Tools](./resources/OS_Softwares_And_Tools.md)

Required software and tools for development.

### [VSCode Recommended Extensions](./resources/VS_Code_Recommended_Extensions.md)

Recommended VS Code / Cursor extensions.

## Section 4: Communication

### [Communication Convention](./resources/Communication_Convention.md)

Team communication standards and practices.

## Section 5: Domain Knowledge

### [Medical Insurance 101](./resources/Medical_Insurance_101.md)

Domain knowledge for the insurance business. Essential context for AI agents working on insurance-related code.

## Section 6: Architecture

### [Monorepo Decision Tree](./resources/Monorepo/DecisionTree.md)

Architecture reference for monorepo decisions.
