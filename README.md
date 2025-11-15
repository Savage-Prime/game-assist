# Game Assist

A powerful Discord bot designed to assist tabletop RPG players with dice rolling and game mechanics. Built with TypeScript and Discord.js, this bot provides advanced dice rolling capabilities with support for complex expressions, exploding dice, target numbers, and more.

## Features

- **Advanced Dice Rolling**: Support for complex dice expressions with multiple dice types, modifiers, and operators
- **Savage Worlds Trait Rolls**: Specialized trait die + wild die mechanics with critical failure detection
- **Exploding Dice**: Both single (!) and infinite (!!) exploding dice with customizable thresholds
- **Target Numbers**: Success counting with target number system (tn)
- **Keep/Drop Mechanics**: Keep highest/lowest or drop highest/lowest dice
- **Multiple Expressions**: Roll multiple different dice expressions in a single command
- **Expression Repetition**: Repeat any dice expression multiple times using the `x` modifier
- **Global Modifiers**: Apply modifiers to the entire roll result
- **Detailed Output**: Clear formatting showing individual dice results and totals
- **Modular Architecture**: Clean separation between parsing and execution logic
- **Comprehensive Testing**: 224+ tests covering all functionality
- **Centralized Configuration**: Standardized help text and error messages

## Architecture

The bot follows a modular architecture that separates concerns for maintainability and testability:

### Core Modules

- **Parse Module** (`src/utils/parse.ts`): Pure parsing functions for dice expressions
- **Dice Module** (`src/utils/dice.ts`): Execution functions with RNG dependency
- **Types Module** (`src/utils/types.ts`): Consolidated TypeScript interfaces
- **Enums Module** (`src/utils/enums.ts`): Shared enumerations
- **Messages Module** (`src/utils/messages.ts`): Centralized command configuration and help text
- **Command Handler** (`src/utils/command-handler.ts`): Generic command execution pattern

### Design Principles

- **Pure Functions**: Parsing logic is deterministic and side-effect free
- **Dependency Injection**: RNG can be mocked for testing
- **Single Responsibility**: Each module has a clear, focused purpose
- **DRY Principle**: Command patterns are reusable across different dice commands
- **Type Safety**: Full TypeScript coverage with strict compilation

## Getting Started

### Prerequisites

- Node.js 22.x or higher
- Discord Bot Token
- Discord Application ID

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Savage-Prime/game-assist.git
cd game-assist
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file with your Discord bot credentials:
```
DISCORD_TOKEN=your_bot_token_here
DISCORD_APP_ID=your_app_id_here
```

4. Build the project:
```bash
npm run build
```

5. Deploy slash commands:
```bash
npm run global-run
```

6. Start the bot:
```bash
npm start
```

## Commands

### `/ping`
Simple health check command that responds with "pong".

### `/roll <dice>`
Roll dice using advanced dice expressions. The dice expression is required.

### `/trait <dice>`
Roll a Savage Worlds trait check with trait die + wild die mechanics. The dice expression is required.

## Dice Expression Syntax

The `/roll` command supports a powerful and flexible dice notation system:

### Basic Dice
- `1d6` - Roll one six-sided die
- `2d8` - Roll two eight-sided dice
- `3d10+2` - Roll three ten-sided dice and add 2

### Exploding Dice
- `1d6!` - Single exploding: if you roll max value, roll one more die and add it
- `1d6!!` - Infinite exploding: keep rolling and adding as long as you roll max value
- `1d6!>4` - Explode on 4, 5, or 6 (any roll ≥ 4)
- `1d6!!>5` - Infinite exploding on 5 or 6

### Keep/Drop Mechanics
- `4d6kh3` - Roll 4d6, keep the highest 3 dice
- `4d6kl2` - Roll 4d6, keep the lowest 2 dice
- `5d6dh2` - Roll 5d6, drop the highest 2 dice
- `5d6dl1` - Roll 5d6, drop the lowest 1 die

### Target Numbers (Success Counting)
- `5d6 tn4` or `5d6 t4` - Roll 5d6, count successes (dice that rolled 4 or higher)
- `3d8!! tn6` - Roll 3d8 with infinite exploding, count successes against target 6
- `2d6;1d8;1d4 tn4 th2` - Roll three expressions, count only the top 2 that meet or exceed TN 4
- **Target Highest**: Use `th<N>` with target numbers to count only the top N successful expressions
- **Raises**: Automatically calculated as target + 4 (e.g., target 6 requires 10+ for a raise)
- **Note**: Both `t` and `tn` mean the same thing (target number); `th` only works when `t`/`tn` is specified

### Global Modifiers
- `2d6 (+3)` - Roll 2d6 and add 3 to the total result
- `1d20 (-2)` - Roll 1d20 and subtract 2 from the total result

### Repetition
- `2d6 x3` - Repeat the expression 3 times (equivalent to `2d6, 2d6, 2d6`)
- `1d20+5 x2` - Repeat the entire expression 2 times
- `1d6,1d8 x2` - Repeat all expressions in order (creates 4 total rolls)
- `2d6 x` - Just `x` without number defaults to 1 (no repetition)

### Complex Expressions
- `1d8+1d6+2` - Roll 1d8, add 1d6, add 2
- `2d6!!;1d8!` - Roll two separate expressions: 2d6 with infinite exploding, and 1d8 with single exploding
- `4d6kh3+1d4 tn15` - Roll 4d6 keep highest 3, add 1d4, check if total ≥ 15
- `3d8!!+2d6-1 (+5) tn12` - Complex expression with exploding dice, multiple dice types, modifiers, global modifier, and target number

### Examples

```
/roll 1d20+5
→ 1d20 [13] + 5 = **18**

/roll 2d6
→ 2d6 [4, 5] = **9**

/roll 1d6!!
→ 1d6 [6!, 6!] = **12**

/roll 4d6kh3
→ 4d6 [~~2~~, 4, 5, 5] = **14**

/roll 3d6 x3
→ 3d6 [1, 4, 5] = **10**
→ 3d6 [2, 6, 3] = **11**
→ 3d6 [5, 5, 2] = **12**

/roll 1d8 tn4
→ 1d8 [6] = **6** success

/roll 1d8+1d6+3
→ 1d8 + 1d6 [5, 4] + 3 = **12**

/roll 1d8!!;1d6!! tn4
→ 1d8 [3] = **3** failed
→ 1d6 [9!] = **9** raise

/roll 2d6+1d4;1d8 (+1)
→ 2d6 + 1d4 [4, 3, 2] + 1 = **12**
→ 1d8 [5] + 1 = **6**
```

## Trait Expression Syntax

The `/trait` command implements Savage Worlds trait roll mechanics with a trait die + wild die system. Both dice explode infinitely on their maximum value, and the higher result is kept.

### Basic Trait Rolls
- `d8` - Roll d8 trait die + d6 wild die (defaults to TN 4)
- `d10+1` - Roll d10 trait die + d6 wild die with +1 modifier
- `d6 tn6` or `d6 t6` - Roll d6 trait die + d6 wild die against target number 6

### Wild Die Override
- `d8 wd8` - Roll d8 trait die + d8 wild die (override default d6)
- `d10 wd6` - Roll d10 trait die + d6 wild die (explicit wild die)

### Full Syntax
- `1d8 wd6 (+1) tn4` - Complete notation: trait die, wild die, modifier, target number
- `d12 wd8 (+2) tn6` - Common usage with wild die override and modifier
- `d8 wd6 th1 tn4` - Explicit `th1` (unnecessary since it's always 1, but valid)

### Components
- **Trait Die**: `d4`, `d6`, `d8`, `d10`, `d12` - Player's skill/attribute die
- **Wild Die**: `wd6` (default), `wd8`, `wd10`, etc. - Usually d6, can be overridden
- **Global Modifier**: `+1`, `(-2)` - Applied to both dice totals
- **Target Number**: `tn4` or `t4` (default TN 4), `tn6`, `t8` - Difficulty threshold (`t` and `tn` are equivalent)
- **Target Highest**: Always `th1` (hardcoded, compares trait die vs wild die to keep the higher result)

### Special Rules
- **Exploding Dice**: Both dice explode infinitely on maximum value (ace)
- **Keep Higher**: The higher result between trait die and wild die is used (inherent `th1` behavior)
- **Critical Failure**: Occurs when both dice roll natural 1s, regardless of modifiers
- **States**: Success (≥TN), Raise (≥TN+4), Failure (<TN)
- **Raises**: Automatically calculated as target number + 4 (same as `/roll`)

### Trait Examples

```
/trait d8
→ Trait Die: 1d8 [5] = **5** success
→ Wild Die: 1d6 [3] = **3** discarded

/trait d8+1 tn6
→ Trait Die: 1d8 [4] +1 = **5** discarded
→ Wild Die: 1d6 [6!] +1 = **7** success

/trait d10 wd6 tn8
→ Trait Die: 1d10 [12!] = **12** raise
→ Wild Die: 1d6 [2] = **2** discarded

/trait d4 wd6 (+2) tn4
→ Trait Die: 1d4 [1] +2 = **3** discarded
→ Wild Die: 1d6 [5] +2 = **7** success

/trait d4 wd6 (+4) tn4
→ Trait Die: 1d4 [1] +4 = **5** success
→ Wild Die: 1d6 [1] +4 = **5** success
❗ **CRITICAL FAILURE**
```

## Development

### Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run test` - Run tests in watch mode
- `npm run test-run` - Run tests once
- `npm run build-and-test` - Build and run tests
- `npm start` - Start the bot
- `npm run dry-run` - Test command deployment without actually deploying
- `npm run guild-run` - Deploy commands to a specific guild for testing
- `npm run global-run` - Deploy commands globally

### Testing

The project includes comprehensive tests for the dice parsing and rolling logic:

```bash
npm test
```

Tests cover:
- Basic dice rolling functionality
- Savage Worlds trait roll mechanics
- Exploding dice mechanics
- Keep/drop logic
- Target number success counting
- Complex expression parsing
- Edge cases and error handling

### Project Structure

```
src/
├── bot.ts              # Main bot entry point
├── commands/           # Slash command implementations
│   ├── index.ts       # Command registry
│   ├── ping.ts        # Ping command
│   ├── roll.ts        # Dice rolling command (uses generic handler)
│   └── trait.ts       # Savage Worlds trait rolling command (uses generic handler)
├── utils/             # Utility modules (modular architecture)
│   ├── index.ts       # Public API exports
│   ├── parse.ts       # Pure parsing functions (no RNG dependency)
│   ├── dice.ts        # Execution functions (with RNG dependency)
│   ├── types.ts       # Consolidated TypeScript interfaces
│   ├── enums.ts       # Shared enumerations and constants
│   ├── messages.json  # Centralized command configuration and help text
│   ├── messages.ts    # Message formatting utilities
│   ├── command-handler.ts # Generic command execution pattern
│   ├── responses.ts   # Result formatting functions
│   ├── env.ts         # Environment configuration
│   └── diags.ts       # Logging and diagnostics
├── scripts/           # Deployment scripts
│   └── deploy-api.ts  # Command deployment
└── tests/             # Test suites (224+ tests)
    ├── parse.spec.ts  # Pure parsing logic tests
    ├── dice.spec.ts   # Dice execution tests
    ├── messages.spec.ts # Message system tests
    ├── trait.spec.ts  # Trait-specific tests
    └── ...            # Additional test files
```

## API Reference

### Core Functions

#### Parsing Functions (Pure)
```typescript
// Parse dice expressions into structured data
function parseRollExpression(expression: string): RollSpecification
function parseTraitExpression(expression: string): TraitSpecification
```

#### Execution Functions (RNG-dependent)
```typescript
// Execute parsed expressions
async function rollParsedExpression(parsed: RollSpecification, rawExpression?: string): Promise<FullRollResult>
function rollParsedTraitExpression(parsed: TraitSpecification, rawExpression?: string): FullTraitResult
```

#### Command Utilities
```typescript
// Generic command handler for dice commands
function handleDiceCommand<TParseData, TExecResult>(
  interaction: ChatInputCommandInteraction,
  config: CommandHandlerConfig<TParseData, TExecResult>
): Promise<void>

// Create standardized command configuration
function createDiceCommand(commandName: string): CommandConfig
```

### Adding New Commands

Adding a new dice command is streamlined with the modular architecture:

1. **Add configuration to `messages.json`**:
```json
{
  "commands": {
    "newcommand": {
      "description": "Your command description",
      "parameterDescription": "Parameter help text",
      "helpTitle": "Help for /newcommand:",
      "helpExamples": [
        { "syntax": "example", "description": "What it does" }
      ]
    }
  }
}
```

2. **Create command file** (`src/commands/newcommand.ts`):
```typescript
import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { handleDiceCommand, createDiceCommand } from "../utils/command-handler.js";
import { parseNewExpression, executeNewExpression, formatNewResult } from "../utils/index.js";

const commandConfig = createDiceCommand("newcommand");

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
      validateParseResult: (result) => /* validation logic */
    });
  }
};
```

This pattern eliminates code duplication and ensures consistency across all dice commands.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

This project is licensed under the ISC License - see the LICENSE file for details.
