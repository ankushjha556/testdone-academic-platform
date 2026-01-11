# Contributing to TestDone Academic Platform

First off, thank you for considering contributing to TestDone! It's people like you that make TestDone such a great tool for exam aspirants.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)
- [Commit Messages](#commit-messages)

## 📜 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
   ```bash
   git clone https://github.com/YOUR-USERNAME/testdone-academic-platform.git
   cd testdone-academic-platform
   ```
3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/ankushjha556/testdone-academic-platform.git
   ```
4. **Install dependencies** for both frontend and backend
5. **Create a branch** for your changes
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 💻 Development Process

### Branch Naming Convention

- `feature/` - New features (e.g., `feature/user-analytics`)
- `fix/` - Bug fixes (e.g., `fix/login-error`)
- `docs/` - Documentation changes (e.g., `docs/api-update`)
- `refactor/` - Code refactoring (e.g., `refactor/auth-module`)
- `test/` - Adding tests (e.g., `test/question-api`)

### Development Workflow

1. Sync your fork with upstream
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Commit with meaningful messages
6. Push and create a Pull Request

## 📝 Pull Request Process

1. **Update documentation** if you're changing functionality
2. **Add tests** for new features
3. **Ensure all tests pass** before submitting
4. **Update the CHANGELOG.md** with details of changes
5. **Request review** from maintainers

### PR Title Format
```
[TYPE] Brief description

Types: feat, fix, docs, style, refactor, test, chore
Example: [feat] Add question bookmarking feature
```

## 🎨 Style Guidelines

### TypeScript/JavaScript
- Use TypeScript for all new code
- Follow ESLint configuration
- Use meaningful variable names
- Add JSDoc comments for functions

### React/Next.js
- Use functional components with hooks
- Follow the existing component structure
- Use Tailwind CSS for styling
- Keep components small and focused

### Backend (Express)
- Use async/await for asynchronous code
- Validate all inputs with Zod
- Handle errors consistently
- Use meaningful route names

## 📝 Commit Messages

Follow conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `test`: Adding missing tests
- `chore`: Maintenance tasks

### Examples
```
feat(auth): add password reset functionality
fix(tests): resolve timer reset issue on page refresh
docs(readme): update installation instructions
```

## 🐛 Reporting Bugs

1. Check if the bug is already reported
2. Use the bug report template
3. Include steps to reproduce
4. Include expected vs actual behavior
5. Add screenshots if applicable

## 💡 Suggesting Features

1. Check if the feature is already suggested
2. Use the feature request template
3. Explain the use case
4. Describe the expected behavior

---

Thank you for contributing! 🙏
