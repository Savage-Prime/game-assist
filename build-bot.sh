# prep for running in bash:
# chmod +x build-bot.sh

# run the script:
# bash build-bot.sh

# in case the build pushes to the wrong folder, like "src":
# find src -type f \( -name "*.js" -o -name "*.js.map" -o -name "*.d.ts" -o -name "*.d.ts.map" \) -delete

npx tsc

# Run tests to verify everything works
npm run test
