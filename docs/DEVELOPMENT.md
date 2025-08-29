# Development Guide

This guide helps developers understand and contribute to the Game Assist project.

## Table of Contents

- [Getting Started](#getting-started)
- [Architecture](#architecture)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Adding New Features](#adding-new-features)
- [Code Style](#code-style)
- [Debugging](#debugging)

## Getting Started

### Prerequisites

- **Node.js 22.x** or higher
- **TypeScript 5.x** knowledge
- **Discord.js v14** familiarity
- Basic understanding of Discord bot development

### Setup

1. **Clone and install**:
```bash
git clone https://github.com/Savage-Prime/game-assist.git
cd game-assist
npm install
```

2. **Configure environment**:
Create `.env` file:
```
DISCORD_TOKEN=your_bot_token_here
DISCORD_APP_ID=your_app_id_here
DISCORD_GUILD_ID=your_test_guild_id
```

3. **Build and test**:
```bash
npm run build-and-test
```

4. **Deploy commands** (for testing):
```bash
npm run guild-run  # Deploy to test guild
npm run global-run # Deploy globally (use carefully)
```

## Architecture

### Modular Design

The project follows a clean, modular architecture:

```
┌─────────────────┐
│   Discord Bot   │
│    (bot.ts)     │
└─────────┬───────┘
          │
┌─────────▼───────┐    ┌─────────────────┐
│    Commands     │    │   Utilities     │
│  (roll, trait)  │────┤  (parse, dice)  │
└─────────────────┘    └─────────────────┘
```

### Key Principles

1. **Separation of Concerns**: Parsing and execution are separate
2. **Pure Functions**: Parsing has no side effects
3. **Dependency Injection**: RNG can be mocked for testing
4. **Type Safety**: Full TypeScript coverage
5. **DRY Principle**: Reusable patterns across commands

### Module Responsibilities

| Module               | Purpose                            | Dependencies         |
| -------------------- | ---------------------------------- | -------------------- |
| `parse.ts`           | Convert strings to structured data | None (pure)          |
| `dice.ts`            | Execute dice rolls with RNG        | RNG, types           |
| `types.ts`           | TypeScript interfaces              | None                 |
| `messages.ts`        | Command configuration and help     | None                 |
| `command-handler.ts` | Generic command pattern            | Discord.js, messages |
| `responses.ts`       | Format results for display         | Types                |

## Development Workflow

### 1. Feature Development

```bash
# Create feature branch
git checkout -b feature/new-dice-mechanic

# Make changes and test continuously
npm test -- --watch

# Build before committing
npm run build

# Commit with descriptive message
git commit -m "feat: add new dice mechanic for X"
```

### 2. Testing Workflow

```bash
# Run all tests
npm test

# Run specific test file
npm test -- dice.spec.ts

# Run with coverage
npm test -- --coverage

# Test in watch mode during development
npm test -- --watch
```

### 3. Command Testing

```bash
# Deploy to test guild
npm run guild-run

# Test commands in Discord
# Use your test bot in a private server

# Deploy globally when ready
npm run global-run
```

## Testing

### Test Organization

- **Unit Tests**: Test individual functions
- **Integration Tests**: Test complete workflows
- **Mocked Tests**: Use deterministic RNG for predictable results

### Test Structure

```typescript
describe("Feature Name", () => {
  describe("specific function", () => {
    it("should handle normal case", () => {
      // Arrange
      const input = "2d6+3";
      
      // Act
      const result = parseRollExpression(input);
      
      // Assert
      expect(result.expressions).toHaveLength(1);
    });

    it("should handle edge case", () => {
      // Test boundary conditions
    });

    it("should handle error case", () => {
      // Test invalid inputs
    });
  });
});
```

### RNG Mocking

For deterministic testing of dice mechanics:

```typescript
import { mockRNG } from "../utils/rng.js";

it("should roll expected values", () => {
  // Arrange
  mockRNG([6, 1, 4]); // Next three rolls will be 6, 1, 4
  const group = { quantity: 3, sides: 6 };
  
  // Act
  const result = rollDiceGroup(group);
  
  // Assert
  expect(result.rolls).toEqual([
    [6, false, false],
    [1, false, false], 
    [4, false, false]
  ]);
});
```

## Adding New Features

### 1. Adding New Dice Mechanics

Example: Adding a "reroll 1s" mechanic

**Step 1**: Extend the type system
```typescript
// In types.ts
interface DiceGroup {
  // ... existing properties
  rerollOnes?: boolean;
}
```

**Step 2**: Update parsing
```typescript
// In parse.ts
function parseDiceModifiers(input: string): DiceGroup {
  // ... existing logic
  if (input.includes('r1')) {
    group.rerollOnes = true;
  }
  return group;
}
```

**Step 3**: Implement execution
```typescript
// In dice.ts
function rollDiceGroup(group: DiceGroup): DiceGroupResult {
  const rolls: [number, boolean, boolean][] = [];
  
  for (let i = 0; i < group.quantity; i++) {
    let roll = rollDie(group.sides);
    
    // New mechanic implementation
    if (group.rerollOnes && roll === 1) {
      roll = rollDie(group.sides);
    }
    
    rolls.push([roll, false, false]);
  }
  
  return { originalGroup: group, rolls, total: calculateTotal(rolls) };
}
```

**Step 4**: Add tests
```typescript
// In dice.spec.ts
describe("reroll ones mechanic", () => {
  it("should reroll 1s once", () => {
    mockRNG([1, 4]); // First roll 1, reroll gets 4
    const result = rollDiceGroup({ quantity: 1, sides: 6, rerollOnes: true });
    expect(result.rolls[0][0]).toBe(4);
  });
});
```

### 2. Adding New Commands

Example: Adding a `/card` command

**Step 1**: Add configuration
```json
// In messages.json
{
  "commands": {
    "card": {
      "description": "Draw cards from a deck",
      "parameterDescription": "Number of cards or card expression",
      "helpTitle": "Help for /card command:",
      "helpExamples": [
        { "syntax": "1", "description": "Draw one card" },
        { "syntax": "5", "description": "Draw five cards" }
      ]
    }
  }
}
```

**Step 2**: Create parsing function
```typescript
// In parse.ts or new cards.ts
export function parseCardExpression(expression: string): CardSpecification {
  // Implementation
}
```

**Step 3**: Create execution function
```typescript
// In dice.ts or new cards.ts
export function drawCards(spec: CardSpecification): CardResult {
  // Implementation
}
```

**Step 4**: Create command file
```typescript
// In commands/card.ts
import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { handleDiceCommand, createDiceCommand } from "../utils/command-handler.js";

const commandConfig = createDiceCommand("card");

export default {
  data: new SlashCommandBuilder()
    .setName(commandConfig.name)
    .setDescription(commandConfig.description)
    .addStringOption((option) =>
      option
        .setName("cards")
        .setDescription(commandConfig.parameterDescription)
        .setRequired(true)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    await handleDiceCommand(interaction, {
      commandName: "card",
      parseFunction: parseCardExpression,
      executeFunction: drawCards,
      formatFunction: formatCardResult,
      validateParseResult: (result) => result.isValid
    });
  }
};
```

## Code Style

### TypeScript Guidelines

1. **Use strict mode**: Enable all strict TypeScript settings
2. **Explicit types**: Prefer explicit return types for public functions
3. **Interface over type**: Use interfaces for object shapes
4. **Readonly where possible**: Mark arrays and objects readonly when appropriate

### Function Design

```typescript
// Good: Pure function with explicit types
export function parseRollExpression(expression: string): RollSpecification {
  // Implementation
}

// Good: Async when needed
export async function rollParsedExpression(
  parsed: RollSpecification,
  rawExpression?: string
): Promise<FullRollResult> {
  // Implementation
}

// Good: Clear parameter validation
function validateDiceGroup(group: DiceGroup): string[] {
  const errors: string[] = [];
  if (group.sides < 1) errors.push("Die sides must be at least 1");
  return errors;
}
```

### Error Handling

```typescript
// Collect validation errors
function parseWithValidation(input: string): { result: ParsedData; errors: string[] } {
  const errors: string[] = [];
  
  // Validate and collect errors
  if (condition) errors.push("Error message");
  
  return { result, errors };
}

// Handle gracefully in commands
if (errors.length > 0) {
  await interaction.reply(formatErrorMessage(commandName, input, errors));
  return;
}
```

### Testing Style

```typescript
// Use descriptive test names
it("should parse exploding dice with custom threshold", () => {
  // Test implementation
});

// Group related tests
describe("exploding dice", () => {
  describe("single exploding", () => {
    // Tests for single exploding
  });
  
  describe("infinite exploding", () => {
    // Tests for infinite exploding
  });
});
```

## Debugging

### Local Testing

1. **Enable debug logging**:
```typescript
// In utils/diags.ts
export const log = {
  debug: (message: string, data?: any) => console.log(`[DEBUG] ${message}`, data),
  // ... other methods
};
```

2. **Test parsing independently**:
```typescript
// Quick test script
import { parseRollExpression } from "./src/utils/parse.js";

const result = parseRollExpression("2d6!!");
console.log(JSON.stringify(result, null, 2));
```

3. **Mock interactions for testing**:
```typescript
// Create mock interaction for testing
const mockInteraction = {
  options: {
    getString: (name: string) => "2d6+3"
  },
  reply: async (content: string) => console.log("Reply:", content)
} as any;
```

### Common Issues

1. **Build errors**: Run `npm run build` to see TypeScript errors
2. **Test failures**: Use `npm test -- --verbose` for detailed output
3. **Command not updating**: Redeploy with `npm run guild-run`
4. **Import errors**: Check file extensions (.js for compiled output)

### Performance Profiling

```typescript
// Time critical operations
const start = performance.now();
const result = await rollParsedExpression(parsed);
const duration = performance.now() - start;
console.log(`Roll took ${duration.toFixed(2)}ms`);
```

### Memory Usage

```typescript
// Monitor memory in long-running operations
process.memoryUsage(); // Check heap usage
```

## Best Practices

1. **Start with tests**: Write tests before implementation (TDD)
2. **Keep functions small**: Aim for single responsibility
3. **Validate early**: Check inputs in parsing phase
4. **Use TypeScript**: Leverage type safety for catching errors
5. **Mock dependencies**: Use dependency injection for testability
6. **Document interfaces**: Add JSDoc comments for public APIs
7. **Handle errors gracefully**: Provide helpful error messages
8. **Test edge cases**: Include boundary conditions and error scenarios

## Resources

- [Discord.js Guide](https://discordjs.guide/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vitest Documentation](https://vitest.dev/)
- [Node.js Documentation](https://nodejs.org/docs/)

## Getting Help

- **Issues**: Create GitHub issues for bugs or feature requests
- **Discussions**: Use GitHub discussions for questions
- **Code Review**: Submit pull requests for review
