# Contributing to Zorost Local UI for Weaviate

Thank you for your interest in contributing to Zorost Local UI for Weaviate! This document provides guidelines and information for contributors.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Create a new branch for your feature or bugfix
4. Make your changes
5. Test your changes thoroughly
6. Submit a pull request

## Development Setup

See [SETUP.md](SETUP.md) for detailed setup instructions.

Quick start:

```bash
git clone https://github.com/YOUR_USERNAME/weaviate-local-app.git
cd weaviate-local-app
npm install
docker-compose up -d
npm run dev
```

## Code Style

This project uses:
- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** (configured via ESLint)
- **Tailwind CSS** for styling

Before committing, run:

```bash
npm run lint
npm run type-check
```

## Commit Messages

Follow conventional commits format:

```
type(scope): subject

body (optional)

footer (optional)
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(chat): add streaming responses
fix(api): handle empty query parameter
docs: update setup instructions
```

## Pull Request Process

1. **Update Documentation**: If you add features, update relevant documentation
2. **Add Tests**: Include tests for new functionality
3. **Update CHANGELOG**: Add entry describing your changes
4. **Link Issues**: Reference related issues in your PR description
5. **Request Review**: Assign reviewers if you know who should review

## Code Review

All submissions require review. We use GitHub pull requests for this purpose.

Reviewers will check for:
- Code quality and style
- Test coverage
- Documentation completeness
- Breaking changes
- Performance implications

## Testing

Currently, the project uses manual testing. Automated tests are planned.

When testing:
1. Test the feature you're adding/fixing
2. Test related features to ensure no regressions
3. Test in different browsers (Chrome, Firefox, Safari)
4. Test responsive design (mobile, tablet, desktop)
5. Test both light and dark themes

## Feature Requests

We welcome feature requests! Please:

1. Check existing issues first
2. Create a new issue with the `enhancement` label
3. Describe the feature clearly
4. Explain the use case and benefits
5. Include mockups or examples if applicable

## Bug Reports

When reporting bugs, please include:

1. **Description**: Clear description of the bug
2. **Steps to Reproduce**: Detailed steps to reproduce the issue
3. **Expected Behavior**: What you expected to happen
4. **Actual Behavior**: What actually happened
5. **Environment**:
   - OS (macOS, Windows, Linux)
   - Browser and version
   - Node.js version
   - Docker version
6. **Screenshots**: If applicable
7. **Error Messages**: Full error messages or logs

## Areas for Contribution

We especially welcome contributions in:

### High Priority
- **Automated Testing**: Unit tests, integration tests, E2E tests
- **Performance Optimization**: Query optimization, caching, lazy loading
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Mobile Experience**: Touch optimizations, responsive improvements

### Features
- **Advanced Search**: Filters, sorting, advanced query builder
- **Bulk Operations**: Batch import/export, bulk editing
- **Data Visualization**: Charts, graphs, relationship diagrams
- **Collaboration**: User management, sharing, permissions
- **Integrations**: Connect to external services, webhooks

### Documentation
- **Video Tutorials**: Screen recordings of common tasks
- **Use Case Examples**: Real-world applications
- **API Documentation**: Detailed API endpoint documentation
- **Troubleshooting Guide**: Common issues and solutions

## Community Guidelines

- Be respectful and inclusive
- Help others in discussions and issues
- Provide constructive feedback
- Follow the code of conduct
- Give credit where credit is due

## Recognition

Contributors will be:
- Listed in [CONTRIBUTORS.md](CONTRIBUTORS.md)
- Mentioned in release notes
- Recognized in the README

## Questions?

Feel free to:
- Open an issue with the `question` label
- Start a discussion in GitHub Discussions
- Contact us at [zorost.com/contact](https://zorost.com/contact)
- Visit our website at [zorost.com](https://zorost.com)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for making Zorost Local UI for Weaviate better! **

**— The Zorost Intelligence Team**

Visit us at [zorost.com](https://zorost.com)

