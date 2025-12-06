# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2025-12-06

### Added

- Conditional body capture functions for Express and Hono middleware
- Support for simple status code signature: `captureResponseBody: (statusCode) => statusCode >= 400`
- Support for full context signature for complex conditional logic
- Backward compatible with boolean values for `captureRequestBody` and `captureResponseBody`

### Changed

- `captureResponseBody` now accepts `boolean | ((statusCode: number) => boolean) | ((req: Request, res: Response) => boolean)` for Express
- `captureResponseBody` now accepts `boolean | ((statusCode: number) => boolean) | ((c: Context) => boolean)` for Hono

## [1.0.1] - 2025-12-06

### Fixed

- Updated package metadata for republishing
- Fixed repository URLs and package scope

## [1.0.0] - 2025-12-06

### Added

- Initial release
- Express middleware for automatic API logging
- Hono middleware for automatic API logging
- Automatic request/response body capture
- Header capture support
- User information tracking
- Batch export with automatic retry logic
- Graceful shutdown support
