# Environment Setup Guide

Simple setup for development vs production Discord bots.

## Setup

### Development (Default)
1. Copy `.env.example` to `.env`
2. Fill in your **development** bot credentials in `.env`:
   ```
   DEV-DISCORD_TOKEN=your_dev_bot_token_here
   DEV-APPLICATION_ID=your_dev_app_id_here
   GUILD_ID=your_test_guild_id_here
   ```

### Production
Set these environment variables in your production environment (not in files):
```
DISCORD_TOKEN=your_prod_bot_token_here
APPLICATION_ID=your_prod_app_id_here
NODE_ENV=production
```

## Commands

- **`npm run deploy:dev`** - Deploy to development bot + test guild (fast)
- **`npm run deploy:prod`** - Deploy to production bot globally (slow, up to 1 hour)
- **`npm run dry-run`** - Preview what would be deployed
- **`npm run clear-guild`** - Clear test guild commands

## How It Works

- **Development**: Uses `DEV-*` credentials, deploys to specific guild (fast updates)
- **Production**: Uses regular credentials, deploys globally (slow but reaches all servers)

The system automatically chooses the right credentials based on `NODE_ENV`.
