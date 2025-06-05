# Contributing to ABDM Node.js SDK

Thank you for your interest in contributing to the ABDM Node.js SDK! We welcome contributions from the community to help improve this project.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
  - [Using npm](#using-npm)
  - [Using Yarn](#using-yarn)
  - [Using pnpm](#using-pnpm)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Code Style](#code-style)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Release Process](#release-process)

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

1. **Fork the repository** on GitHub.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/abdm-sdk-node.git
   cd abdm-sdk-node
   ```
3. **Install dependencies** using your preferred package manager (see below).
4. **Create a new branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bugfix-name
   ```

## Development Setup

### Prerequisites

- Node.js 14.0.0 or higher
- npm 6.0.0 or higher, or Yarn 1.22.0 or higher, or pnpm 6.0.0 or higher
- Git

### Using npm

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

### Using Yarn

```bash
# Install dependencies
yarn install

# Build the project
yarn build

# Run tests
yarn test
```

### Using pnpm

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build

# Run tests
pnpm test
```

## Development Workflow

1. **Make your changes** following the coding standards.
2. **Lint your code** to catch any style issues:
   ```bash
   npm run lint
   # or
   yarn lint
   # or
   pnpm lint
   ```
3. **Run tests** to ensure your changes don't break existing functionality:
   ```bash
   npm test
   # or
   yarn test
   # or
   pnpm test
   ```
4. **Build the project** to ensure everything compiles correctly:
   ```bash
   npm run build
   # or
   yarn build
   # or
   pnpm build
   ```
5. **Commit your changes** with a descriptive commit message following the [Conventional Commits](https://www.conventionalcommits.org/) specification:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   # or
   git commit -m "fix: fix a bug"
   # or
   git commit -m "docs: update documentation"
   ```
6. **Push your changes** to your fork:
   ```bash
   git push origin your-branch-name
   ```
7. **Create a Pull Request** from your fork to the main repository.

## Testing

We use Jest for testing. You can run the following test commands:

- Run all tests:
  ```bash
  npm test
  # or
  yarn test
  # or
  pnpm test
  ```

- Run unit tests:
  ```bash
  npm run test:unit
  ```

- Run integration tests:
  ```bash
  npm run test:integration
  ```

- Run tests for specific services:
  ```bash
  npm run test:m1  # M1 service tests
  npm run test:m2  # M2 service tests
  npm run test:m3  # M3 service tests
  ```

- Run tests in watch mode:
  ```bash
  npm run test:watch
  ```

- Generate test coverage report:
  ```bash
  npm run test:coverage
  ```

## Code Style

We use ESLint and Prettier to maintain consistent code style. Before committing, please ensure your code passes the linter:

```bash
npm run lint
# or
yarn lint
# or
pnpm lint
```

You can automatically fix many common issues with:

```bash
npm run lint:fix
# or
yarn lint:fix
# or
pnpm lint:fix
```

## Submitting a Pull Request

1. Fork the repository and create your branch from `main`.
2. Make your changes.
3. Ensure the test suite passes.
4. Make sure your code is properly linted.
5. Update the documentation if necessary.
6. Submit a pull request with a clear title and description.

## Release Process

1. Update the version in `package.json` following [Semantic Versioning](https://semver.org/).
2. Update the CHANGELOG.md with the changes in the new version.
3. Commit the changes with a message like `chore(release): vX.Y.Z`.
4. Tag the commit with the version number:
   ```bash
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```
5. Publish the package to npm:
   ```bash
   npm publish
   ```
6. Create a new release on GitHub with the release notes.

## License

By contributing to this project, you agree that your contributions will be licensed under the [MIT License](LICENSE).
- Document new features and update documentation as needed
- Include tests for new functionality
- Keep the codebase clean and well-organized

## Testing

We use Jest for testing. Please ensure that:

- New features include appropriate unit tests
- Existing tests pass with your changes
- Test coverage remains high (run `npm run test:coverage` to check)

## Documentation

- Update the README.md with any new features or changes
- Add JSDoc comments to all public APIs
- Keep the TypeScript type definitions up to date

## Reporting Issues

When reporting issues, please include:

- A clear description of the issue
- Steps to reproduce the issue
- Expected vs. actual behavior
- Any relevant error messages or logs
- Version of the SDK and Node.js you're using

## Feature Requests

We welcome feature requests! Please open an issue to discuss your idea before submitting a pull request.

## Pull Request Process

1. Ensure any install or build dependencies are removed before the end of the layer when doing a build.
2. Update the README.md with details of changes to the interface, this includes new environment variables, exposed ports, useful file locations, and container parameters.
3. Increase the version numbers in any examples files and the README.md to the new version that this Pull Request would represent. The versioning scheme we use is [SemVer](http://semver.org/).
4. The PR must pass all CI checks before it can be merged.
5. A maintainer will review your PR and may request changes.

## Code Review Process

- A maintainer will review your PR and provide feedback
- Address any feedback and update your PR as needed
- Once approved, a maintainer will merge your PR

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
