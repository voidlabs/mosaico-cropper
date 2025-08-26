# Mosaico Cropper - Project Documentation

This document provides detailed documentation for the Mosaico Cropper project.

## Project Overview

Mosaico Cropper is a JavaScript library built on top of jQuery and jQuery UI Widget Factory. It provides an easy-to-use inline tool for resizing, cropping, and panning images directly in the browser. A key feature is its ability to detect existing image transformations (like crops or resizes) applied by various image proxy services (e.g., Cloudinary, Cloudimage, ImageKit) and allow further editing on the *original* image, generating a new URL for the modified version.

The project was recently migrated from Grunt to Vite for a more modern build process.

## Core Technologies

*   **Language:** JavaScript (ES6+), built into a UMD package for broad compatibility.
*   **Dependencies:** jQuery 3.x, jQuery UI (Widget Factory, Draggable, Resizable), jQuery UI Touch Punch
*   **Build Tools:** Vite, Node.js, npm
*   **Styling:** LESS (compiled to CSS with PostCSS)
*   **Browser Support:** `last 2 versions`, `not dead`, `> 1%`, `IE 10`, `IE 11` (as defined in `browserslist`).

## Architecture

The main logic resides in `src/js/jqueryui-mosaico-cropper.js`, which implements a jQuery UI Widget. It creates an overlay UI for manipulating the image, calculates crop/resize parameters, and uses adapters defined in `urladapters.js` to generate new image URLs based on the chosen service's syntax. The UI styles are defined in `src/css/jqueryui-mosaico-cropper.less`.

## Building and Running

**Prerequisites:**
*   Node.js and npm installed.


**Setup:**
1.  Install dependencies: `npm install`

**Available Scripts:**

### Development
*   `npm run dev`: Starts the Vite development server (defaults to port 9009).
*   `npm start`: Alias for `npm run dev`.
*   `npm run preview`: Builds the project and serves it locally for previewing the production build.

### Building
*   `npm run build`: Lints the code and builds the project for production. Output files are placed in the `dist/` directory (`jqueryui-mosaico-cropper.min.js`, `jqueryui-mosaico-cropper.min.css`).

### Code Quality
*   `npm run lint`: Checks for linting errors in the `src/` directory.
*   `npm run lint:fix`: Automatically fixes linting errors.

### Testing
*   `npm test`: Runs the test suite in watch mode.
*   `npm run test:run`: Runs the test suite once.
*   `npm run test:ui`: Runs the test suite with the Vitest UI for interactive testing.
*   `npm run test:coverage`: Runs the test suite and generates a coverage report.

## Key Files

*   `src/js/jqueryui-mosaico-cropper.js`: Core widget implementation.
*   `src/js/crop-model.js`: Crop model logic extracted from the main widget.
*   `src/js/url-adapters.js`: Utility functions for URL adapter processing (`urlAdapterFromSrc`, `urlAdapterToSrc`).
*   `src/css/jqueryui-mosaico-cropper.less`: UI styles for the cropper.
*   `urladapters.js`: Definitions for parsing and generating URLs for various image proxy services.
*   `demo.html`: Main demo page showcasing the cropper with various services.
*   `vite.config.js`: Vite build configuration.
*   `package.json`: Project metadata, dependencies, and scripts.

## Development Conventions

*   The project uses jQuery UI Widget Factory patterns (`_init`, `_destroy`, `options`).
*   UI is built dynamically in JavaScript and styled with LESS/CSS.
*   Image manipulation logic involves calculating scale, pan, and crop dimensions based on user interaction.
*   Crop model logic has been extracted to `src/js/crop-model.js` for better modularity.
*   URL generation is handled by service-specific adapters in `urladapters.js`, using pattern matching and string templates, with utility functions in `src/js/url-adapters.js`.
*   Code style is enforced using ESLint with configuration in `eslint.config.js`.

## Testing Setup

Tests use **Vitest** with a JSDOM environment. The test suite is located in the `tests/` directory and includes:
*   `tests/crop-model.test.js`: Unit tests for crop model functionality.
*   `tests/url-adapters.test.js`: Tests for URL adapter utility functions.
*   `tests/url-adapters-demo-urls.test.js`: Tests for URL adapter demo URLs.

