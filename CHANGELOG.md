# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v0.2.0]

### Added - Modular Architecture Refactor (Issue #37)

#### New Architecture
- **Modular Design**: Split monolithic `game.ts` into focused modules
  - `parse.ts`: Pure parsing functions (no RNG dependency)
  - `dice.ts`: Execution functions (with RNG dependency)
  - `types.ts`: Consolidated TypeScript interfaces (9 → 4 core types)
  - `enums.ts`: Shared enumerations and constants
  - `index.ts`: Clean public API exports

#### Command System Improvements
- **Generic Command Handler**: `command-handler.ts` eliminates code duplication
- **Centralized Messages**: `messages.json` and `messages.ts` for standardized help text
- **Reduced Command Code**: Commands reduced from 56-80 lines to ~27 lines each
- **Consistent Error Handling**: Standardized error messages and help formatting

#### Enhanced Testing
- **Comprehensive Test Suite**: 224 tests covering all functionality
- **Modular Test Organization**: Separate test files for each module
- **Deterministic Testing**: RNG mocking for reliable test results
- **New Test Categories**:
  - `parse.spec.ts`: Pure parsing logic (54 tests)
  - `dice.spec.ts`: Dice execution with mocked RNG (28 tests)
  - `messages.spec.ts`: Message formatting system (10 tests)
  - `trait.spec.ts`: Trait-specific functionality (28 tests)

#### Developer Experience
- **Type Safety**: Full TypeScript coverage with strict compilation
- **API Documentation**: Comprehensive docs in `docs/API.md`
- **Extension Guide**: Clear patterns for adding new commands
- **Clean Exports**: Simplified import statements

### Fixed
- **X Pattern Parsing**: Made whitespace optional for consistency (`2d6x3` and `2d6 x3` both work)
- **Interface Consolidation**: Reduced duplicate interfaces for cleaner API

### Changed
- **Breaking**: Reorganized internal module structure (public API unchanged)
- **File Organization**: Moved utility functions to focused modules
- **Import Statements**: Updated to use new modular exports

### Technical Details

#### Before Refactor
```
src/utils/game.ts        # 600+ lines monolithic module
src/commands/roll.ts     # 56 lines with hardcoded patterns
src/commands/trait.ts    # 80 lines with duplicated logic
```

#### After Refactor
```
src/utils/
├── parse.ts             # 350+ lines of pure parsing logic
├── dice.ts              # 250+ lines of execution logic
├── types.ts             # 86 lines of consolidated interfaces
├── enums.ts             # Clean enumerations
├── messages.json        # 75 lines of centralized configuration
├── messages.ts          # 86 lines of message utilities
├── command-handler.ts   # 84 lines of generic command pattern
└── index.ts             # Clean public API exports

src/commands/
├── roll.ts              # 27 lines using generic handler
└── trait.ts             # 27 lines using generic handler
```

#### API Compatibility
- **Public API**: Fully backward compatible
- **Function Signatures**: Unchanged for existing functions
- **Return Types**: Consistent with previous versions
- **Command Behavior**: Identical user experience

#### Performance
- **Parsing**: No performance impact (pure functions)
- **Execution**: Equivalent performance with cleaner code
- **Memory**: Slightly reduced due to module tree-shaking
- **Testing**: Faster test execution with focused test suites

#### Code Quality Metrics
- **Lines of Code**: ~85 lines of duplication eliminated
- **Cyclomatic Complexity**: Reduced through modular separation
- **Test Coverage**: Increased from implicit to 224 explicit tests
- **Type Safety**: Enhanced with stricter interfaces
- **Maintainability**: Significantly improved with DRY principles

### Documentation
- **README**: Updated with new architecture overview
- **API Documentation**: Comprehensive module reference
- **Code Examples**: Updated for new patterns
- **Extension Guide**: Clear instructions for adding new commands

## [0.1.1] - Previous Version

### Added
- Initial Discord bot implementation
- Advanced dice rolling with complex expressions
- Savage Worlds trait roll mechanics
- Exploding dice (single and infinite)
- Target number success counting
- Keep/drop mechanics
- Expression repetition with x modifier
- Multiple expressions in single command
- Global modifiers
- Comprehensive dice notation support

### Features
- `/roll` command for general dice rolling
- `/trait` command for Savage Worlds mechanics
- `/ping` command for health checks
- Rich formatted output with individual die results
- Error handling and validation
- Help text for invalid expressions

### Technical
- TypeScript implementation
- Discord.js v14
- Vitest testing framework
- Node.js 22+ support
- Environment-based configuration
