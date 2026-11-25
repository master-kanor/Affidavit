# Kilo Code Platform Adapter

## Platform
Kilo Code — IDE-based agentic development

## Configuration

Copy `instructions/universal-master.md` to Kilo Code's custom instructions.

## Agent Role
Primary coding agent for:
- Code generation and editing
- Refactoring
- Debugging
- Testing
- Package management
- File operations

## Model Configuration
- Primary: Kilo Code built-in model
- Fallback: OpenRouter → NVIDIA (via Open Connect AI Gateway)

## Capabilities Used
- File read/write/edit
- Code search (grep, glob)
- Command execution (local)
- Subagent delegation

## Constraints
- Cannot access external APIs without credentials
- Cannot deploy to production without approval
- Must pass type checking before completion
- Must run tests after code changes