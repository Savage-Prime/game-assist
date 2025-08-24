# prep for running in bash:
# chmod +x build-npm.sh

# run the script:
# bash build-npm.sh

# Update all npm packages listed in package.json
npm install

# Install specific packages (if needed)
npm install discord.js dotenv undici
npm install --save-dev vitest ts-node @types/node

# Update Firebase packages
npm install firebase-functions@latest firebase-admin@latest --save
npm install -g firebase-tools

# Display outdated packages (optional)
npm outdated
