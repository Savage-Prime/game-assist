# Game Assist

A powerful Discord bot designed to assist tabletop RPG players with dice rolling and game mechanics. Built with TypeScript and Discord.js, this bot provides advanced dice rolling capabilities with support for complex expressions, exploding dice, target numbers, and more.

## Features

- **Advanced Dice Rolling**: Support for complex dice expressions with multiple dice types, modifiers, and operators
- **Exploding Dice**: Both single (!) and infinite (!!) exploding dice with customizable thresholds
- **Target Numbers**: Success counting with target number system (tn)
- **Keep/Drop Mechanics**: Keep highest/lowest or drop highest/lowest dice
- **Multiple Expressions**: Roll multiple different dice expressions in a single command
- **Global Modifiers**: Apply modifiers to the entire roll result
- **Detailed Output**: Clear formatting showing individual dice results and totals

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

### `/roll [dice]`
Roll dice using advanced dice expressions. If no dice expression is provided, defaults to rolling 1d6.

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
- `5d6 tn4` - Roll 5d6, count successes (dice that rolled 4 or higher)
- `3d8!! tn6` - Roll 3d8 with infinite exploding, count successes against target 6

### Global Modifiers
- `2d6 (+3)` - Roll 2d6 and add 3 to the total result
- `1d20 (-2)` - Roll 1d20 and subtract 2 from the total result

### Complex Expressions
- `1d8+1d6+2` - Roll 1d8, add 1d6, add 2
- `2d6!!;1d8!` - Roll two separate expressions: 2d6 with infinite exploding, and 1d8 with single exploding
- `4d6kh3+1d4 tn15` - Roll 4d6 keep highest 3, add 1d4, check if total ≥ 15
- `3d8!!+2d6-1 (+5) tn12` - Complex expression with exploding dice, multiple dice types, modifiers, global modifier, and target number

### Examples

```
/roll 1d20+5
→ 1d20: **18** [13] (rolled 13, +5 modifier = 18)

/roll 2d6
→ 2d6: **9** [4, 5]

/roll 1d6!!
→ 1d6: **12** [6!, 6!] (rolled 6, exploded to 6 again, total 12)

/roll 4d6kh3
→ 4d6kh3: **14** [~~2~~, 4, 5, 5] (dropped the 2, kept 4+5+5=14)

/roll 5d8 tn6
→ 5d8: **22** [3, 6, 7, 2, 4] = **2** successes (6 and 7 ≥ 6)

/roll 1d8+1d6+3
→ 1d8+1d6+3: **12** (rolled 5+4+3)
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
│   └── roll.ts        # Dice rolling command
├── utils/             # Utility modules
│   ├── game.ts        # Dice parsing and rolling logic
│   ├── rng.ts         # Random number generation
│   ├── env.ts         # Environment configuration
│   └── diags.ts       # Logging and diagnostics
└── scripts/           # Deployment scripts
    └── deploy-api.ts  # Command deployment
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

This project is licensed under the ISC License - see the LICENSE file for details.
