#!/usr/bin/env node

/**
 * Generate version.json with version and build time
 * This file is imported by the app to display version info
 */

import { readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const packageJsonPath = join(rootDir, 'package.json')
const versionJsonPath = join(rootDir, 'src', 'version.json')

// Read package.json to get version
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
const version = packageJson.version

// Get build time
const buildTime = new Date().toISOString()

// Create version.json
const versionInfo = {
  version,
  buildTime,
}

// Write to src/version.json
writeFileSync(versionJsonPath, JSON.stringify(versionInfo, null, 2), 'utf-8')

console.log(`✓ Generated version.json: v${version} (${buildTime})`)
