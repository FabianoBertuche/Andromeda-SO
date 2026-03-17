Antigravity Workflows 🚀
Stack-agnostic, question-driven workflows for AI coding assistants

npm version License

Quick Start • Philosophy • Workflows • Contributing

🌟 What Is This?
A collection of intelligent workflows that teach AI coding assistants how to perform tasks — without assuming your tech stack.

Unlike typical code snippets or templates, our workflows:

🔍 Detect your project's framework, styling, and patterns
❓ Ask clarifying questions to produce better results
🎯 Adapt to your specific setup, not force a specific stack
Think of it like anthropics/skills, but stack-agnostic.

🎯 Philosophy
Every workflow follows five core principles:

Principle	Description
Stack-Agnostic	Works with React, Vue, Angular, Django, or any stack
Question-Driven	Asks clarifying questions for better results
Progressive Disclosure	Loads minimal context first, expands on demand
Single Responsibility	Each workflow does ONE thing well
Composable	Combine workflows for complex tasks
⚡ Quick Start
No installation required — just use npx!

# Install a workflow into your project
npx antigravity-workflows install git-commit

# List all available workflows
npx antigravity-workflows list

# Search for workflows
npx antigravity-workflows search "test"
Once installed, trigger the workflow in Antigravity:

Type /git-commit in the chat

That's it! The agent will follow the workflow instructions.

📦 Available Workflows
🔧 Development
Workflow	Description
new-project	Scaffold any project (detects or asks for stack)
new-component	Create reusable UI components (any framework)
new-api	Create API endpoints (any backend)
new-feature	Full feature implementation from design to deployment
nextjs-app	Create new Next.js applications
library	Create publishable packages and libraries
refactor	Improve code quality, extract, reduce duplication
migrate	Technology migrations (JS→TS, framework upgrades)
cli-tool	Build command-line applications
🔀 Git & Collaboration
Workflow	Description
git-commit	Generate conventional commits from staged changes
git-pr	Create comprehensive PR descriptions
git-conflict	Help resolve merge conflicts
git-rebase	Interactive rebase assistance
🧪 Testing & Quality
Workflow	Description
unit-test	Generate unit tests (detects testing framework)
e2e-test	End-to-end browser tests
playwright-test	Browser automation tests with Playwright
test-coverage	Improve test coverage for files
code-review	Comprehensive code review
🐛 Debugging
Workflow	Description
debug-error	Analyze errors and suggest fixes
debug-log	Add strategic logging/debugging
performance	Profile and optimize slow code
🔒 Security
Workflow	Description
security-audit	Scan for vulnerabilities and secrets
dependency-check	Check for vulnerable dependencies
auth-implementation	Implement authentication patterns
📚 Documentation
Workflow	Description
readme	Generate comprehensive README
api-docs	Generate API documentation (OpenAPI, JSDoc)
architecture	Create architecture diagrams (Mermaid, C4)
🚀 Deployment
Workflow	Description
deploy	Deploy to any platform (detects or configures)
docker	Containerize application
ci-cd	Set up CI/CD pipelines
railway-deploy	Deploy to Railway
vercel-deploy	Deploy to Vercel
🗄️ Database
Workflow	Description
db-schema	Design database schemas (any ORM/DB)
db-migrate	Create and run migrations
db-seed	Generate seed/test data
🤖 AI & LLM
Workflow	Description
prompt-engineering	Design and optimize LLM prompts
rag-pipeline	Build retrieval-augmented generation
ai-agent	Create AI agents with tools
workflow-creator	Create new antigravity workflows
🎨 Creative & UI
Workflow	Description
landing-page	Build landing pages (any stack)
dashboard-ui	Create admin dashboards (any stack)
design-system	Create and analyze design tokens
email-template	Design responsive emails
🛠️ CLI Commands
# Install workflows
npx antigravity-workflows install <name>           # Single workflow
npx antigravity-workflows install <name1> <name2>  # Multiple workflows
npx antigravity-workflows install --category git   # By category
npx antigravity-workflows install --all            # All workflows

# Explore workflows
npx antigravity-workflows list                     # List all
npx antigravity-workflows list --category testing  # Filter by category
npx antigravity-workflows search "debug"           # Search

# Get details
npx antigravity-workflows info git-commit          # Workflow details
📁 Where Do Workflows Go?
Workflows are installed to .agent/workflows/ in your project:

your-project/
├── .agent/
│   └── workflows/
│       ├── git-commit.md
│       ├── unit-test.md
│       └── ...
└── src/
Antigravity automatically discovers workflows in this directory.

🤝 Contributing
We welcome community contributions! Our workflows follow strict guidelines to ensure quality:

Fork this repository
Read the Core Philosophy
Create your workflow following our template
Ensure it's stack-agnostic and question-driven
Submit a Pull Request
See CONTRIBUTING.md for detailed guidelines.

📄 License
Apache 2.0 — See LICENSE for details.