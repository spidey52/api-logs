# API Logs Service - OpenAPI Documentation

This directory contains the split OpenAPI 3.1.0 specification for the API Logs Service.

## Structure

```
openapi/
├── openapi.yaml              # Main entry point with references
├── components/
│   ├── schemas/
│   │   ├── project.yaml      # Project-related schemas
│   │   ├── user.yaml         # User-related schemas
│   │   ├── apilog.yaml       # API log schemas
│   │   └── common.yaml       # Common schemas (Error, Pagination, etc.)
│   ├── parameters/           # Reusable parameters (empty for now)
│   └── responses/            # Reusable responses (empty for now)
└── paths/
    ├── health.yaml           # Health check endpoint
    ├── projects.yaml         # Project management endpoints
    ├── users.yaml            # User management endpoints
    └── logs.yaml             # API log endpoints
```

## Usage

### Bundle the specification

Combine all split files into a single `openapi.yaml` in the project root:

```bash
make docs-bundle
# or
npm run bundle
```

### Lint the specification

Check for errors and best practices:

```bash
make docs-lint
# or
npm run lint
```

### Preview the documentation

Start a local preview server:

```bash
make docs-preview
# or
npm run preview
```

Then open http://localhost:8080 in your browser.

## Editing

When making changes:

1. Edit the files in the `openapi/` directory
2. Run `make docs-lint` to check for errors
3. Run `make docs-bundle` to generate the bundled spec
4. The bundled `openapi.yaml` is served by the application at `/docs`

## Benefits of Split Files

✅ **Easy to maintain** - Each domain has its own file  
✅ **Better organization** - Clear separation of concerns  
✅ **Reusable components** - Share schemas across endpoints  
✅ **Team collaboration** - Reduce merge conflicts  
✅ **Version control** - See changes more clearly in diffs

## Note

The bundled `openapi.yaml` in the project root is **generated** and should not be edited directly. All changes should be made in the `openapi/` directory.
