# Game Assist - AI Coding Instructions

## Project Overview
TypeScript Discord bot for tabletop RPG dice mechanics using Discord.js v14, Node.js ESM, and cryptographic RNG. Focuses on advanced dice expressions, Savage Worlds traits, and modular architecture.

## Architecture Patterns

### Core Module Separation
- **`src/utils/parse.ts`**: Pure parsing functions - NO side effects, deterministic, easily testable
- **`src/utils/dice.ts`**: Execution functions with RNG dependency injection for testing
- **`src/utils/types.ts`**: Consolidated TypeScript interfaces - single source of truth
- **`src/utils/messages.ts`**: Centralized command configuration from `messages.json`

### Command Pattern
Commands follow the generic handler in `src/utils/command-handler.ts`:
1. Parse input (validation messages collected)
2. Check errors → ephemeral help response if invalid
3. Show warnings if valid but problematic
4. Execute operation
5. Format and reply

Example: `/roll` and `/trait` commands use identical patterns via `handleDiceCommand<T, R>()`.

### Dependency Injection for Testing
RNG functions in `src/utils/rng.ts` use Node's `crypto.randomInt()`. Test files mock this for deterministic results:
```typescript
// In tests: vi.mock("../utils/rng.js", () => ({ randomInt: vi.fn() }))
```

## Key Conventions

### TypeScript Configuration
- **Strict settings**: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
- **ESM modules**: Use `.js` extensions in imports even for `.ts` files
- **Output**: `src/` → `bin/` compilation

### File Extensions
- Import `.ts` files as `.js`: `import { log } from "./utils/diags.js"`
- JSON imports require `with { type: "json" }` assertion

### Error Handling
- Commands: Ephemeral responses for errors, public for results
- Logging: Use `src/utils/diags.ts` structured logging with context objects
- Validation: Accumulate messages in arrays, don't fail fast

## Development Workflows

### Testing Strategy
- **Unit tests**: `src/tests/` using Vitest - run with `npm test`
- **Build verification**: `npm run build-and-test` for CI-like checks
- **RNG evaluation**: Separate intensive tests in `src/evaluation/` - run with `npm run evaluate-rng`

### Command Deployment
- **Guild testing**: `npm run guild-run` deploys to test server
- **Global deploy**: `npm run global-run` for production
- **Clear commands**: `npm run clear-guild` removes test commands

### Development Builds
- **Watch mode**: `npm test` runs Vitest in watch mode
- **TypeScript**: `npm run build` compiles to `bin/`
- **Direct execution**: Use `tsx` for running TypeScript directly during development

## Discord.js Patterns

### Slash Command Structure
All commands in `src/commands/` export objects with `data` (SlashCommandBuilder) and `execute` function. Auto-registered in `src/commands/index.ts`.

### Message Flags
Use `flags: 1 << 6` for ephemeral responses (MessageFlags.Ephemeral constant).

### Environment Variables
Required: `DISCORD_TOKEN`, `DISCORD_APP_ID`. Optional: `DISCORD_GUILD_ID` for testing, `HEALTH_PORT` for container health checks.

## Dice Expression Domain

### Parsing Philosophy
Expression parsing is complex - support nested operations, multiple dice types, modifiers, target numbers, repetition. Validation messages guide users rather than rejecting input.

### Data Flow
`parseRollExpression()` → `RollSpecification` → `executeRoll()` → `RollOutcome` → `formatRollResponse()`

### Testing Random Components
Mock `randomInt()` to return predictable sequences. Use `rollResults.map()` patterns to verify dice combinations and exploding mechanics.

## Quality Standards

### RNG Quality
Cryptographic randomness via Node's `crypto.randomInt()`. Evaluation tests verify statistical distribution, performance under load, and cryptographic quality per NIST standards.

### Code Organization
- Avoid circular dependencies
- Single responsibility per module
- Pure functions where possible
- Centralized configuration in JSON files