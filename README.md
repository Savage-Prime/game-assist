# Game Assist

## Setup Instructions

Follow these steps to set up the project:

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   - Create a `.env` file in the root directory (already included in `.gitignore`).
   - Add the following variables:
     ```env
     DISCORD_TOKEN=your-discord-token
     DISCORD_CLIENT_ID=your-client-id
     DISCORD_GUILD_ID=your-guild-id
     ```

3. **Run the Project**
   - Use `ts-node` to run the TypeScript files:
     ```bash
     npx ts-node src/index.ts
     ```

4. **Build the Project** (Optional)
   - Compile TypeScript to JavaScript:
     ```bash
     npx tsc
     ```

5. **Start the Bot**
   - Run the compiled JavaScript:
     ```bash
     node dist/index.js
     ```

## Additional Notes
- Ensure you have Node.js installed (v22.15.0 or higher).
- The project uses `discord.js` for interacting with the Discord API and `better-sqlite3` for database management.
