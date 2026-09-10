# Repository Guidelines

## Technology Direction

- Frontend: Next.js / React / TypeScript
- Backend: FastAPI / Python / SQLAlchemy
- Database: SQLite
- AI: OpenAI API

## Security and Configuration

- Never commit API keys, tokens, passwords, or other secrets.
- Do not place `.env` files under Git management. Use an `.env.example` file when configuration documentation is needed.

## Git Workflow

- Commit frequently in small, feature-oriented units.
- Run relevant tests before every substantial commit.
- Do not use `git push --force`, `git reset --hard`, or history-rewriting operations.

## Scope of Changes

- Change files only within this repository.
- Do not change operating-system settings.
