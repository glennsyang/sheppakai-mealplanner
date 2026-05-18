#!/bin/sh
set -e

echo "🚀 Starting Meal Planner..."

# Run database migrations
echo "📦 Running database migrations..."
npx drizzle-kit migrate

# Start the SvelteKit app
echo "🚀 Starting SvelteKit server..."
exec node ./build/index.js