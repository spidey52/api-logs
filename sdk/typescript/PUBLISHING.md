# Publishing to NPM

This guide walks you through publishing the API Logs SDK to NPM.

## Prerequisites

1. **NPM Account**: Create an account at [npmjs.com](https://www.npmjs.com/signup)
2. **NPM CLI**: Ensure you have npm installed (comes with Node.js)
3. **Organization**: Optionally create an organization for scoped packages

## Step 1: Login to NPM

```bash
npm login
```

Enter your username, password, and email when prompted.

## Step 2: Update Package.json

Before publishing, update these fields in `package.json`:

```json
{
 "name": "@your-org/api-logs-sdk", // Change to your org/package name
 "version": "1.0.0", // Semantic versioning
 "author": "Your Name <your.email@example.com>",
 "repository": {
  "type": "git",
  "url": "https://github.com/your-org/api-logs.git"
 },
 "bugs": {
  "url": "https://github.com/your-org/api-logs/issues"
 },
 "homepage": "https://github.com/your-org/api-logs#readme"
}
```

### Package Naming

**Option 1: Scoped Package (Recommended)**

```json
"name": "@your-org/api-logs-sdk"
```

- Better for organizations
- Avoids naming conflicts
- Can be private or public

**Option 2: Unscoped Package**

```json
"name": "api-logs-sdk"
```

- Must be globally unique
- Always public
- Simpler to import

## Step 3: Build the Package

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` folder.

## Step 4: Test Locally (Optional)

Test the package locally before publishing:

```bash
# In the sdk/typescript directory
npm link

# In another project
npm link @your-org/api-logs-sdk

# Use it
import { APILogsExporter } from '@your-org/api-logs-sdk';
```

## Step 5: Publish

### First Time Publishing

```bash
npm publish --access public
```

Use `--access public` for scoped packages to make them public (they're private by default).

### Subsequent Updates

1. Update the version in `package.json`:

   ```bash
   npm version patch  # 1.0.0 -> 1.0.1 (bug fixes)
   npm version minor  # 1.0.0 -> 1.1.0 (new features)
   npm version major  # 1.0.0 -> 2.0.0 (breaking changes)
   ```

2. Publish:
   ```bash
   npm publish
   ```

## Step 6: Verify Publication

1. Check on NPM: `https://www.npmjs.com/package/@your-org/api-logs-sdk`
2. Install in a test project:
   ```bash
   npm install @your-org/api-logs-sdk
   ```

## Versioning

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): New features, backward compatible
- **PATCH** (1.0.0 → 1.0.1): Bug fixes, backward compatible

## NPM Scripts

```bash
npm run build          # Build TypeScript
npm run dev            # Watch mode for development
npm run prepublishOnly # Runs automatically before publish
npm run example        # Run basic example
npm run example:express # Run Express example
npm run example:hono   # Run Hono example
```

## Publishing Checklist

- [ ] Update `package.json` with correct name, version, author
- [ ] Update README.md with installation instructions
- [ ] Add LICENSE file (MIT, Apache, etc.)
- [ ] Test locally with `npm link`
- [ ] Run `npm run build` successfully
- [ ] Login to NPM (`npm login`)
- [ ] Publish (`npm publish --access public`)
- [ ] Verify on npmjs.com
- [ ] Test installation in a fresh project
- [ ] Create Git tag for version (`git tag v1.0.0`)
- [ ] Push tag to GitHub (`git push --tags`)

## Automating Releases

### GitHub Actions (Recommended)

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to NPM

on:
 release:
  types: [created]

jobs:
 publish:
  runs-on: ubuntu-latest
  steps:
   - uses: actions/checkout@v3

   - name: Setup Node.js
     uses: actions/setup-node@v3
     with:
      node-version: "18"
      registry-url: "https://registry.npmjs.org"

   - name: Install dependencies
     working-directory: ./sdk/typescript
     run: npm ci

   - name: Build
     working-directory: ./sdk/typescript
     run: npm run build

   - name: Publish to NPM
     working-directory: ./sdk/typescript
     run: npm publish --access public
     env:
      NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Then:

1. Create NPM access token: `npm token create`
2. Add token to GitHub secrets as `NPM_TOKEN`
3. Create GitHub release to trigger publish

## Private Packages

To publish a private package (requires paid NPM account):

```bash
# Scoped packages are private by default
npm publish

# Or explicitly set access
npm publish --access restricted
```

## Unpublishing (Emergency Only)

```bash
npm unpublish @your-org/api-logs-sdk@1.0.0
```

**Warning**: Only use within 72 hours of publish. After that, deprecate instead:

```bash
npm deprecate @your-org/api-logs-sdk@1.0.0 "This version has a critical bug, please upgrade to 1.0.1"
```

## Troubleshooting

### Error: 403 Forbidden

- Not logged in: Run `npm login`
- No permission: Check package name isn't taken
- Scoped package: Use `--access public`

### Error: Package name taken

- Choose a different name
- Use a scoped package: `@your-org/package-name`

### Files not included in package

- Check `.npmignore` or `files` field in `package.json`
- Run `npm pack` to see what will be published

## Resources

- [NPM Documentation](https://docs.npmjs.com/)
- [Semantic Versioning](https://semver.org/)
- [Package.json Fields](https://docs.npmjs.com/cli/v9/configuring-npm/package-json)
- [NPM Registry](https://www.npmjs.com/)
