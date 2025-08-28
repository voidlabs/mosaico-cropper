# Mosaico Cropper - Development Documentation

This document provides detailed technical documentation for the Mosaico Cropper project.

## Project Overview

Mosaico Cropper is a modern JavaScript library that provides an easy-to-use inline tool for resizing, cropping, and panning images directly in the browser. A key feature is its ability to detect existing image transformations (like crops or resizes) applied by various image proxy services (e.g., Cloudinary, Cloudimage, ImageKit) and allow further editing on the *original* image, generating a new URL for the modified version.

**Recent Major Changes:**
- **jQuery Independence**: Completely removed jQuery and jQuery UI dependencies, now uses native JavaScript
- **Modern Architecture**: Refactored to use ES6+ modules with a component-based architecture
- **Build System**: Migrated from Grunt to Vite for modern build tooling
- **Code Modernization**: Updated from `var` to `let/const`, arrow functions, and modern JavaScript patterns

## Core Technologies

*   **Language:** JavaScript (ES6+), built into a UMD package for broad compatibility
*   **Dependencies:** None - completely dependency-free vanilla JavaScript library
*   **Build Tools:** Vite, Node.js, npm
*   **Testing:** Vitest with JSDOM environment
*   **Styling:** LESS (compiled to CSS with PostCSS)
*   **Browser Support:** `last 2 versions`, `not dead`, `> 1%`, `IE 10`, `IE 11` (as defined in `browserslist`)

## Architecture

The library follows a modern modular architecture with separation of concerns:

### Core Components

**Main Entry Points:**
- `src/js/MosaicoCropper.js` - Core cropper functionality (replaces old jQuery UI Widget)
- `src/js/MosaicoCropperPlugin.js` - Plugin wrapper for easier integration
- `src/index.js` - Main library export

**Component Architecture:**
- `src/js/components/CropperComponent.js` - Base class for all cropper components
- `src/js/components/CropperSlider.js` - Zoom slider component
- `src/js/components/CropperDraggable.js` - Drag and pan functionality
- `src/js/components/CropperResizer.js` - Vertical resize handle

**Model and State Management:**
- `src/js/CropModel.js` - Pure state management for crop data and calculations
- `src/js/utils/MovingClassManager.js` - CSS class management for animations

**Utilities:**
- `src/js/utils/UrlHandler.js` - URL parsing and generation for image services
- `src/js/utils/ImagePreloader.js` - Efficient image loading
- `src/js/utils/MinimalDomUtils.js` - Essential DOM utilities (ElementDataStore)
- `src/js/templates/CropperTemplate.js` - HTML template generation

### Key Architectural Principles

1. **No External Dependencies**: Complete removal of jQuery and jQuery UI
2. **Component-Based**: Modular components with shared base class
3. **Event-Driven**: Custom event system for component communication  
4. **Immutable State**: CropModel manages state changes through events
5. **Native DOM**: Direct DOM manipulation using modern JavaScript APIs

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

**Core Implementation:**
*   `src/js/MosaicoCropper.js`: Main cropper functionality (vanilla JavaScript)
*   `src/js/MosaicoCropperPlugin.js`: Plugin wrapper with jQuery-like API
*   `src/js/CropModel.js`: State management and crop calculations
*   `src/index.js`: Library entry point and exports

**Components:**
*   `src/js/components/CropperComponent.js`: Base component class
*   `src/js/components/CropperSlider.js`: Zoom slider implementation
*   `src/js/components/CropperDraggable.js`: Drag and pan functionality
*   `src/js/components/CropperResizer.js`: Resize handle implementation

**Utilities:**
*   `src/js/utils/UrlHandler.js`: URL adapter processing and image service integration
*   `src/js/utils/ImagePreloader.js`: Image loading utilities
*   `src/js/utils/MovingClassManager.js`: CSS animation class management
*   `src/js/utils/MinimalDomUtils.js`: Essential DOM utilities

**UI and Styling:**
*   `src/js/templates/CropperTemplate.js`: HTML template generation
*   `src/css/jqueryui-mosaico-cropper.less`: UI styles for the cropper

**Configuration and Build:**
*   `vite.config.js`: Vite build configuration with backend image processing
*   `package.json`: Project metadata, dependencies, and scripts
*   `demo.html`: Main demo page showcasing the cropper

## Development Conventions

### Modern JavaScript Patterns
*   **ES6+ Modules**: All code uses `import`/`export` statements
*   **Modern Variable Declarations**: Uses `const` and `let` instead of `var`
*   **Arrow Functions**: Preferred for callbacks and inline functions
*   **Template Literals**: Used for string interpolation and HTML generation
*   **Destructuring**: Used for object and array manipulation
*   **Spread Operator**: Used for object merging and array operations

### Component Architecture
*   **Base Class Pattern**: All components extend `CropperComponent`
*   **Event-Driven Communication**: Components communicate via custom events
*   **Lifecycle Management**: Proper initialization and cleanup in `initialize()` and `destroy()`
*   **Native DOM**: Direct DOM manipulation using `querySelector`, `addEventListener`, etc.

### State Management
*   **Centralized State**: `CropModel` handles all crop-related state
*   **Immutable Updates**: State changes trigger events rather than direct mutations
*   **Event Emission**: State changes are broadcast to interested components

### URL Adapter System
*   **Object-Based Configuration**: URL adapters are defined as objects, not strings
*   **Pattern Matching**: Uses regex patterns for URL parsing and generation
*   **Service Agnostic**: Supports multiple image proxy services through configuration

### Code Quality
*   **ESLint**: Code style enforced using ESLint with configuration in `eslint.config.js`
*   **Type Safety**: JSDoc comments for better IDE support and documentation
*   **Error Handling**: Defensive programming with proper error messages
*   **Testing**: Comprehensive test coverage with Vitest

## Testing Setup

Tests use **Vitest** with a JSDOM environment. The test suite is located in the `tests/` directory and includes:

### Core Functionality Tests
*   `tests/CropModel.test.js`: Unit tests for crop model state management and calculations
*   `tests/MosaicoCropper.test.js`: Integration tests for main cropper functionality
*   `tests/ImagePreloader.test.js`: Tests for image loading utilities

### Component Tests  
*   `tests/RefactoredComponents.test.js`: Tests for component architecture and base classes
*   `tests/CropperComponents.test.js`: Tests for individual cropper components
*   `tests/MovingClassManager.test.js`: Tests for CSS animation management

### Core Integration Tests
*   `tests/RefactoredCore.test.js`: Comprehensive integration tests for refactored architecture
*   `tests/RefactoredCore-Simple.test.js`: Basic functionality tests

### URL and Adapter Tests
*   `tests/UrlHandler.test.js`: Tests for URL parsing and generation
*   `tests/UrlHandler-demo-urls.test.js`: Tests for URL adapter with demo URLs
*   `tests/DomUtils.test.js`: Tests for DOM utility functions

### Test Environment
*   **Framework**: Vitest with JSDOM environment for DOM testing
*   **Mocking**: Vi.js for function mocking and spies
*   **Coverage**: Built-in coverage reporting with V8 provider
*   **Watch Mode**: Automatic test re-running during development

## API Usage

### Basic Usage (Vanilla JavaScript)

```javascript
import { mosaicoCropper } from 'mosaico-cropper';

// Define URL adapter for your image service
const urlAdapter = {
    defaultPrefix: '/img',
    fromSrc: {
        urlPrefix: "(?:https?://[^/]*)?/img",
    },
    toSrc: {
        resize: "{urlPrefix}?method=resize&params={width}&url={encodedUrlOriginal}",
        cover: "{urlPrefix}?method=cover&params={width},{height}&url={encodedUrlOriginal}",
        cropresize: "{urlPrefix}?method=cropresize&params={cropWidth},{cropHeight},{cropX},{cropY},{width},{height}&url={encodedUrlOriginal}",
    }
};

// Initialize cropper
const imgElement = document.querySelector('img');
const cropperInstance = mosaicoCropper(imgElement, {
    width: 400,
    height: 300,
    urlAdapter: urlAdapter
});
```

### Plugin Wrapper (jQuery-like API)

```javascript
import { MosaicoCropperPlugin, createMosaicoCropper } from 'mosaico-cropper';

// Create cropper instance
const cropper = createMosaicoCropper('#my-image', {
    width: 400,
    height: 300,
    urlAdapter: urlAdapter
});

// Use methods
cropper.scale(1.5);
cropper.cropHeight(250);
cropper.destroy();
```

### URL Adapter Configuration

URL adapters define how to parse existing image URLs and generate new ones:

```javascript
const customAdapter = {
    // Default prefix when no URL pattern matches
    defaultPrefix: '/transform',
    
    // Pattern for parsing existing URLs (optional)
    fromSrc: {
        urlPrefix: "(?:https?://[^/]*)?/transform",
    },
    
    // Templates for generating new URLs
    toSrc: {
        resize: "{urlPrefix}?w={width}&url={encodedUrlOriginal}",
        cover: "{urlPrefix}?w={width}&h={height}&fit=cover&url={encodedUrlOriginal}",
        cropresize: "{urlPrefix}?w={width}&h={height}&crop={cropX},{cropY},{cropWidth},{cropHeight}&url={encodedUrlOriginal}",
    }
};
```

