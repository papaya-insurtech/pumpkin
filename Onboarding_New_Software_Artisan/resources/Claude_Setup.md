# Claude Setup

Setup guide for AI tools used by the Papaya engineering team.

## 1. Claude Code CLI

Claude Code is the primary coding tool. It runs in your terminal alongside VS Code / Cursor.

### Installation

**macOS / Linux:**

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

**Windows:**

```bash
winget install Anthropic.ClaudeCode
```

### Usage

Run `claude` in any project directory to start a session:

```bash
cd ~/projects/carrot
claude
```

### Reference

- [Official Setup Docs](https://code.claude.com/docs/en/setup)
- [Best Practices](../../Software_Artisan_Handbook/resources/AI_Agent_Workflow/Claude_Code_Best_Practices.md)

## 2. Claude Desktop (for Chat)

Claude Chat is used for research, learning, brainstorming, and rubber-ducking.

### Installation

Download from [claude.ai/download](https://claude.ai/download). Available for macOS and Windows.

### Reference

- [Claude Desktop Help](https://support.anthropic.com/en/articles/10065433-installing-claude-for-desktop)

## 3. Claude Cowork (via Desktop)

Claude Cowork is used for documentation, requirements analysis, test plans, and non-code file generation.

### Access

Open Claude Desktop > Cowork tab. Requires a paid plan.

### Reference

- [Cowork Getting Started](https://support.claude.com/en/articles/13345190-getting-started-with-cowork)

## 4. Authentication

Ask Mr. Loc for the team credentials and API access.

## 5. Team Convention Skills Marketplace

Install Papaya's coding convention skills so Claude Code follows team standards:

```bash
# In any Claude Code session:
/plugin marketplace add papaya-insurtech/pumpkin

# Install specific convention skills:
/plugin install typescript-convention@papaya-pumpkin
/plugin install react-convention@papaya-pumpkin
/plugin install hasura-graphql-convention@papaya-pumpkin
/plugin install apollo-client-convention@papaya-pumpkin
/plugin install ant-design-convention@papaya-pumpkin
```

Install the skills relevant to your project. See the full list in the [marketplace catalog](../../.claude-plugin/marketplace.json).

## 6. Git Configuration (One-Time Setup)

Configure git for rebase-on-pull (team standard):

```bash
git config --global pull.rebase true
```

Configure your identity:

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@papaya.co.th"
```
