# API Documentation

This document provides detailed information about the Game Assist modular architecture and API.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Module Reference](#module-reference)
- [Type Definitions](#type-definitions)
- [Function Reference](#function-reference)
- [Command System](#command-system)
- [Testing Framework](#testing-framework)
- [Extension Guide](#extension-guide)

## Architecture Overview

The Game Assist bot follows a clean, modular architecture that separates parsing from execution:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Commands                  │    │   Parse Module             │    │   Dice Module               │
│  (roll, trait)                     │───▶  (pure logic)               │───▶ (RNG execution)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │ 
         ▼  
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Command Handler      │    │  Types Module              │    │ Response Format        │
│ (generic logic)              │    │ (interfaces)                    │    │   (display)                      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐
│ Messages Module       │
│  (help & text)                │
└─────────────────┘
```

### Design Principles

1. **Separation of Concerns**: Parsing and execution are completely separate
2. **Pure Functions**: Parsing functions have no side effects
3. **Dependency Injection**: RNG can be mocked for deterministic testing
4. **Generic Patterns**: Command logic is reusable across different commands
5. **Type Safety**: Full TypeScript coverage with strict compilation

## Module Reference

### Parse Module (`src/utils/parse.ts`)

**Purpose**: Pure parsing functions that convert string expressions into structured data.

**Key Functions**:
- `parseRollExpression(expression: string): RollSpecification`
- `parseTraitExpression(expression: string): TraitSpecification`

**Characteristics**:
- No RNG dependency
- No side effects
- Deterministic output
- Comprehensive validation
- Error collection

### Dice Module (`src/utils/dice.ts`)

**Purpose**: Execution functions that take parsed data and generate random results.

**Key Functions**:
- `rollParsedExpression(parsed: RollSpecification, rawExpression?: string): Promise<FullRollResult>`
- `rollParsedTraitExpression(parsed: TraitSpecification, rawExpression?: string): FullTraitResult`
- `rollDiceGroup(group: DiceGroup): DiceGroupResult`

**Characteristics**:
- RNG dependency
- Async execution (for rate limiting)
- State-based logic
- Critical failure detection

### Types Module (`src/utils/types.ts`)

**Purpose**: Consolidated TypeScript interfaces and type definitions.

**Core Types**:
- `DiceGroup`: Basic dice configuration
- `RollSpecification`: Parsed roll expression
- `TraitSpecification`: Parsed trait expression
- `RollOutcome`: Final result structure

### Messages Module (`src/utils/messages.ts`)

**Purpose**: Centralized message formatting and command configuration.

**Key Functions**:
- `formatErrorMessage(commandName: string, input: string, errors: string[]): string`
- `formatWarningMessage(errors: string[]): string`
- `formatHelpText(commandName: string): string`
- `getCommandConfig(commandName: string): CommandConfig | null`

### Command Handler (`src/utils/command-handler.ts`)

**Purpose**: Generic command execution pattern that eliminates code duplication.

**Key Function**:
```typescript
handleDiceCommand<TParseData, TExecResult>(
  interaction: ChatInputCommandInteraction,
  config: CommandHandlerConfig<TParseData, TExecResult>
): Promise<void>
```

**Workflow**:
1. Parse input using provided parser
2. Validate result and show help if invalid
3. Display warnings if present
4. Execute the operation
5. Format and reply with result

## Type Definitions

### Core Building Blocks

```typescript
interface DiceGroup {
  quantity: number;
  sides: number;
  exploding?: boolean;
  explodingNumber?: number;
  infinite?: boolean;
  keepHighest?: number;
  keepLowest?: number;
  dropHighest?: number;
  dropLowest?: number;
}

interface DiceGroupResult {
  originalGroup: DiceGroup;
  rolls: [number, boolean, boolean][]; // [value, exploded, dropped]
  total: number;
}
```

### Expression Specifications

```typescript
interface RollSpecification {
  expressions: Array<{ diceGroups: Array<{ group: DiceGroup; operator: "+" | "-" }> }>;
  targetNumber?: number;
  globalModifier?: number;
  rawExpression?: string;
  validationMessages: string[];
}

interface TraitSpecification {
  traitDie: DiceGroup;
  wildDie: DiceGroup;
  targetNumber?: number;
  globalModifier?: number;
  rawExpression?: string;
  validationMessages: string[];
  targetHighest?: number;
}
```

### Results

```typescript
interface RollOutcome {
  type: "standard" | "trait";
  grandTotal: number;
  targetNumber?: number;
  globalModifier?: number;
  rawExpression?: string;
  details: StandardRollDetails | TraitRollDetails;
}
```

## Function Reference

### Parsing Functions

#### `parseRollExpression(expression: string): RollSpecification`

Parses a dice expression string into a structured specification.

**Parameters**:
- `expression`: String like "2d6+3", "1d8!!;1d6", "4d6kh3 tn4"

**Returns**: `RollSpecification` with validation messages

**Examples**:
```typescript
const result = parseRollExpression("2d6+3");
// result.expressions[0].diceGroups: [
//   { group: { quantity: 2, sides: 6 }, operator: "+" },
//   { group: { quantity: 1, sides: 1 }, operator: "+" } // modifier as d1
// ]

const complex = parseRollExpression("1d8!!;1d6 tn4");
// result.expressions: [expression1, expression2]
// result.targetNumber: 4
```

#### `parseTraitExpression(expression: string): TraitSpecification`

Parses a Savage Worlds trait expression.

**Parameters**:
- `expression`: String like "d8", "d10+1 tn6", "d4 wd6 (+2) tn4"

**Returns**: `TraitSpecification` with validation messages

**Examples**:
```typescript
const result = parseTraitExpression("d8+1 tn6");
// result.traitDie: { quantity: 1, sides: 8, infinite: true }
// result.wildDie: { quantity: 1, sides: 6, infinite: true }
// result.globalModifier: 1
// result.targetNumber: 6
```

### Execution Functions

#### `rollParsedExpression(parsed: RollSpecification, rawExpression?: string): Promise<FullRollResult>`

Executes a parsed roll specification.

**Parameters**:
- `parsed`: Result from `parseRollExpression`
- `rawExpression`: Original string for display

**Returns**: Promise of `FullRollResult` with dice results and totals

#### `rollParsedTraitExpression(parsed: TraitSpecification, rawExpression?: string): FullTraitResult`

Executes a parsed trait specification.

**Parameters**:
- `parsed`: Result from `parseTraitExpression`
- `rawExpression`: Original string for display

**Returns**: `FullTraitResult` with trait and wild die results

### Utility Functions

#### `rollDiceGroup(group: DiceGroup): DiceGroupResult`

Rolls a single dice group with all modifiers.

**Features**:
- Exploding dice (single and infinite)
- Keep/drop mechanics
- Proper sorting and marking

#### `isCriticalFailure(result: TraitDieResult): boolean`

Determines if a trait roll is a critical failure.

**Rule**: Both trait and wild dice show natural 1, regardless of modifiers.

## Command System

### Generic Command Pattern

All dice commands follow this pattern via `handleDiceCommand`:

1. **Parse**: Convert string input to structured data
2. **Validate**: Check for errors and show help if needed
3. **Warn**: Display warnings for valid but unusual input
4. **Execute**: Roll dice and generate results
5. **Format**: Convert results to user-friendly text
6. **Reply**: Send formatted response to Discord

### Command Configuration

Commands are configured in `src/utils/messages.json`:

```json
{
  "commands": {
    "roll": {
      "description": "Roll dice using an expression...",
      "parameterDescription": "Dice expression (e.g., 1d12+2d6+3...)",
      "helpTitle": "Help for /roll command:",
      "helpExamples": [
        { "syntax": "1d20", "description": "Roll a 20-sided die" }
      ]
    }
  }
}
```

### Adding New Commands

1. **Add configuration** to `messages.json`
2. **Implement parsing function** (if needed)
3. **Implement execution function** (if needed)
4. **Create command file** using `handleDiceCommand`
5. **Add tests** for new functionality

Example minimal command:
```typescript
export default {
  data: new SlashCommandBuilder()
    .setName(commandConfig.name)
    .setDescription(commandConfig.description)
    .addStringOption(/* ... */),
  async execute(interaction: ChatInputCommandInteraction) {
    await handleDiceCommand(interaction, {
      commandName: "newcommand",
      parseFunction: parseNewExpression,
      executeFunction: executeNewExpression,
      formatFunction: formatNewResult,
      validateParseResult: (result) => result.isValid
    });
  }
};
```

## Testing Framework

### Test Organization

- **parse.spec.ts**: Pure parsing logic (54 tests)
- **dice.spec.ts**: Dice execution with mocked RNG (28 tests)
- **messages.spec.ts**: Message formatting system (10 tests)
- **trait.spec.ts**: Trait-specific functionality (28 tests)
- **responses.test.ts**: Result formatting (15 tests)

### Testing Patterns

#### Deterministic Testing
```typescript
// Mock RNG for predictable results
mockRNG([6, 1, 4]); // Next rolls will be 6, 1, 4
const result = rollDiceGroup({ quantity: 3, sides: 6 });
expect(result.rolls).toEqual([[6, false, false], [1, false, false], [4, false, false]]);
```

#### Parsing Tests
```typescript
// Test parsing without RNG
const result = parseRollExpression("2d6+3");
expect(result.expressions).toHaveLength(1);
expect(result.validationMessages).toHaveLength(0);
```

#### Integration Tests
```typescript
// Test complete flow
const parsed = parseRollExpression("1d6!!");
const result = await rollParsedExpression(parsed);
expect(result.grandTotal).toBeGreaterThan(0);
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- dice.spec.ts

# Run with coverage
npm test -- --coverage

# Build and test
npm run build-and-test
```

## Extension Guide

### Adding New Dice Mechanics

1. **Extend DiceGroup interface** in `types.ts`
2. **Update parsing logic** in `parse.ts`
3. **Implement execution logic** in `dice.ts`
4. **Add formatting** in `responses.ts`
5. **Create comprehensive tests**

### Adding New Command Types

1. **Define new specification interface**
2. **Implement parser function**
3. **Implement execution function**
4. **Add to messages.json**
5. **Create command file**
6. **Add test coverage**

### Modifying Output Formats

1. **Update formatting functions** in `responses.ts`
2. **Maintain backward compatibility**
3. **Add tests for new formats**
4. **Update documentation**

### Best Practices

- **Keep parsing pure**: No side effects in parse functions
- **Mock RNG for tests**: Use deterministic testing
- **Validate early**: Check inputs in parsing phase
- **Centralize messages**: Use messages.json for user text
- **Type everything**: Maintain strict TypeScript coverage
- **Test edge cases**: Include boundary conditions and error cases
