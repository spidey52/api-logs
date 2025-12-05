# Quick Start: Publishing Your SDKs

## TypeScript SDK to NPM

### 1. Prepare Package

Edit `sdk/typescript/package.json`:

```json
{
 "name": "@your-org/api-logs-sdk", // Change this!
 "version": "1.0.0",
 "author": "Your Name <your@email.com>"
}
```

### 2. Build

```bash
cd sdk/typescript
npm install
npm run build
```

Verify `dist/` folder is created with compiled JS files.

### 3. Test Locally (Optional)

```bash
npm link
cd /path/to/test-project
npm link @your-org/api-logs-sdk
```

### 4. Login to NPM

```bash
npm login
```

### 5. Publish

First time:

```bash
npm publish --access public
```

Updates:

```bash
npm version patch  # 1.0.0 -> 1.0.1
npm publish
```

### 6. Verify

Visit: `https://www.npmjs.com/package/@your-org/api-logs-sdk`

Install test:

```bash
npm install @your-org/api-logs-sdk
```

## Golang SDK to Go Modules

Golang uses Git tags for versioning. No separate publish step needed!

### 1. Update go.mod

Edit `sdk/golang/go.mod`:

```go
module github.com/your-org/api-logs/sdk/golang

go 1.21
```

### 2. Commit Changes

```bash
git add sdk/golang/
git commit -m "Add Golang SDK v1.0.0"
git push
```

### 3. Create Git Tag

```bash
git tag sdk/golang/v1.0.0
git push origin sdk/golang/v1.0.0
```

### 4. Verify

Users can now install:

```bash
go get github.com/your-org/api-logs/sdk/golang@v1.0.0
```

## Automated Publishing (Recommended)

### GitHub Actions - NPM

Create `.github/workflows/publish-npm.yml`:

```yaml
name: Publish TypeScript SDK to NPM

on:
 push:
  tags:
   - "typescript/v*"

jobs:
 publish:
  runs-on: ubuntu-latest
  steps:
   - uses: actions/checkout@v3

   - uses: actions/setup-node@v3
     with:
      node-version: "18"
      registry-url: "https://registry.npmjs.org"

   - name: Install & Build
     working-directory: ./sdk/typescript
     run: |
      npm ci
      npm run build

   - name: Publish
     working-directory: ./sdk/typescript
     run: npm publish --access public
     env:
      NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Then:

1. Get NPM token: `npm token create`
2. Add to GitHub Secrets as `NPM_TOKEN`
3. Push tag: `git tag typescript/v1.0.0 && git push --tags`

### GitHub Actions - Golang

Go packages don't need CI for publishing (they use Git tags), but you can add tests:

Create `.github/workflows/test-golang.yml`:

```yaml
name: Test Golang SDK

on:
 push:
  paths:
   - "sdk/golang/**"
 pull_request:
  paths:
   - "sdk/golang/**"

jobs:
 test:
  runs-on: ubuntu-latest
  steps:
   - uses: actions/checkout@v3

   - uses: actions/setup-go@v4
     with:
      go-version: "1.21"

   - name: Test
     working-directory: ./sdk/golang
     run: |
      go mod download
      go test ./...
      go build ./...
```

## Version Management

### Semantic Versioning

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): New features (backward compatible)
- **PATCH** (1.0.0 → 1.0.1): Bug fixes

### TypeScript

```bash
npm version major  # Breaking changes
npm version minor  # New features
npm version patch  # Bug fixes
```

### Golang

```bash
git tag sdk/golang/v2.0.0  # Breaking changes
git tag sdk/golang/v1.1.0  # New features
git tag sdk/golang/v1.0.1  # Bug fixes
```

## Checklist

### Before Publishing TypeScript

- [ ] Updated version in `package.json`
- [ ] Updated README with new features
- [ ] Ran `npm run build` successfully
- [ ] Tested locally with `npm link`
- [ ] Updated CHANGELOG.md
- [ ] Committed all changes
- [ ] Logged in to NPM

### Before Publishing Golang

- [ ] Updated version comment in code
- [ ] Updated README with new features
- [ ] Tests pass: `go test ./...`
- [ ] Code builds: `go build ./...`
- [ ] Updated CHANGELOG.md
- [ ] Committed all changes
- [ ] Created and pushed Git tag

## Post-Publishing

1. **Update Documentation**: Add installation instructions
2. **Create Release Notes**: Explain changes in GitHub Releases
3. **Announce**: Share on Twitter, Discord, etc.
4. **Monitor Issues**: Watch for bug reports
5. **Update Examples**: Ensure examples use new version

## Troubleshooting

### NPM: "You must be logged in"

```bash
npm logout
npm login
```

### NPM: "Package name taken"

- Change package name in `package.json`
- Use scoped package: `@your-org/package-name`

### Golang: "Package not found"

- Ensure code is pushed to GitHub
- Check tag format: `sdk/golang/v1.0.0`
- Make repository public
- Wait a few minutes for Go proxy cache

### NPM: "Version already published"

```bash
npm version patch  # Increment version
npm publish
```

## Support

Need help? Check:

- [NPM Documentation](https://docs.npmjs.com/)
- [Go Modules Documentation](https://go.dev/doc/modules/publishing)
- [Semantic Versioning](https://semver.org/)

Happy publishing! 🚀
