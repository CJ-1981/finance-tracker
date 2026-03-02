#!/bin/bash

# Deployment Verification Script
# This script checks that the production build is correctly configured for GitHub Pages

set -e

echo "🔍 Verifying deployment configuration..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Check 1: Verify vite.config.ts has correct base path for production
echo "📋 Checking vite.config.ts base path configuration..."

if grep -q "base: command === 'serve' ? '/' : '/finance-tracker/'" vite.config.ts; then
    echo "✅ ${GREEN}Base path correctly configured for GitHub Pages${NC}"
else
    echo "❌ ${RED}ERROR: Base path is not correctly configured!${NC}"
    echo "   Expected: base: command === 'serve' ? '/' : '/finance-tracker/'"
    echo "   This will cause 404 errors for assets in production!"
    ERRORS=$((ERRORS + 1))
fi

# Check 2: Verify package.json homepage matches
echo "📋 Checking package.json homepage..."
EXPECTED_HOMEPAGE="https://cj-1981.github.io/finance-tracker/"
ACTUAL_HOMEPAGE=$(grep '"homepage"' package.json | sed 's/.*: "\(.*\)".*/\1/')

if [ "$ACTUAL_HOMEPAGE" = "$EXPECTED_HOMEPAGE" ]; then
    echo "✅ ${GREEN}Package.json homepage correctly set${NC}"
else
    echo "⚠️  ${YELLOW}WARNING: Package.json homepage mismatch${NC}"
    echo "   Expected: $EXPECTED_HOMEPAGE"
    echo "   Actual:   $ACTUAL_HOMEPAGE"
fi

# Check 3: Verify production build output
echo "📋 Checking production build output..."
if [ -f "dist/index.html" ]; then
    # Check that assets have the correct base path
    if grep -q "/finance-tracker/assets/" dist/index.html; then
        echo "✅ ${GREEN}Production build has correct asset paths${NC}"
    else
        echo "❌ ${RED}ERROR: Production build missing /finance-tracker/ base path!${NC}"
        echo "   Assets will fail to load in production"
        ERRORS=$((ERRORS + 1))
    fi

    # Check that 404.html exists (required for SPA routing)
    if [ -f "dist/404.html" ]; then
        echo "✅ ${GREEN}404.html exists for SPA routing${NC}"
    else
        echo "❌ ${RED}ERROR: 404.html missing!${NC}"
        echo "   SPA routing will not work on GitHub Pages"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "⚠️  ${YELLOW}WARNING: No production build found in dist/${NC}"
    echo "   Run 'npm run build' first"
fi

# Check 4: Verify base path not set to '/'
echo "📋 Checking that base path is not set to root..."
if grep -q "base: '.*/'" vite.config.ts | grep -v "command === 'serve'" | grep -v "//"; then
    echo "❌ ${RED}ERROR: Base path set to '/' for all environments!${NC}"
    echo "   This breaks GitHub Pages deployment"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ ${GREEN}Base path correctly configured per environment${NC}"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ]; then
    echo "✅ ${GREEN}All checks passed! Deployment is correctly configured.${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Commit and push your changes"
    echo "  2. GitHub Actions will deploy automatically"
    echo "  3. Verify at https://cj-1981.github.io/finance-tracker/"
    exit 0
else
    echo "❌ ${RED}Found $ERRORS error(s) that must be fixed before deployment!${NC}"
    echo ""
    echo "Please fix the errors above and run this script again."
    exit 1
fi
