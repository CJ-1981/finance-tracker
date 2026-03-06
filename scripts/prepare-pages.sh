#!/bin/bash

# Prepare GitHub Pages deployment with SPA routing

set -e

echo "📦 Preparing for GitHub Pages deployment..."

# Ensure dist directory exists
if [ ! -d "dist" ]; then
  echo "❌ Error: dist directory not found. Run build first."
  exit 1
fi

# Copy index.html to 404.html for SPA routing
echo "✅ Copying index.html to 404.html..."
cp dist/index.html dist/404.html

# Create .nojekyll file to disable Jekyll processing
echo "✅ Creating .nojekyll file..."
touch dist/.nojekyll

# List files in dist for verification
echo "📁 Files in dist:"
ls -la dist/

echo "✅ GitHub Pages preparation complete!"
