# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome extension that filters WordPress.org plugin directory results by rating, active installations, and last updated date. It injects filtering controls directly into the WordPress plugin directory pages and allows users to find high-quality, well-maintained plugins.

Key features:
- Filters plugins by minimum rating (0-5 stars)
- Filters by minimum active installations (Any, 1K+, 10K+, 100K+, 1M+)
- Filters by maximum time since last update (Any time, 1 month, 3 months, 6 months, 1 year)
- Uses WordPress.org Plugins API to fetch plugin data
- Replaces default WordPress plugin cards with enhanced cards containing more information

## Code Structure

- `manifest.json` - Chrome extension manifest file
- `content.js` - Main extension logic that injects UI and handles filtering
- `inject-ui.css` - Styling for the filter controls
- `icons/` - Extension icon files

## Architecture

The extension works by:

1. Injecting filter controls into the WordPress plugin directory page
2. Fetching plugin data from the WordPress.org API instead of using the existing page data
3. Rendering custom plugin cards with enhanced information
4. Applying client-side filtering based on user-selected criteria

The content script runs on WordPress plugin directory pages and search results pages.

## Development Notes

There are no build tools or package managers used in this project. The extension consists of plain JavaScript, CSS, and JSON files that can be loaded directly as an unpacked extension in Chrome.

To test changes:
1. Load the extension as an unpacked extension in Chrome
2. Visit the WordPress plugin directory
3. Make changes to files and reload the extension in Chrome

Common development tasks:
- Modifying filter criteria in content.js
- Adjusting UI layout in inject-ui.css
- Updating manifest.json for permissions or matching URLs

## Build System

The project includes automatic build synchronization:

- `build-for-submission/` - Clean build directory with only submission files
- `sync-build.sh` - Manual sync script to update build directory
- `simple-watch.sh` - Auto-sync watcher using polling (no dependencies)
- `watch-and-sync.sh` - Advanced auto-sync using inotifywait (requires inotify-tools)

**Usage:**
- Manual sync: `./sync-build.sh`
- Auto-sync (simple): `./simple-watch.sh` (runs in background)
- Auto-sync (advanced): `./watch-and-sync.sh` (requires inotify-tools)

The build directory automatically stays in sync with root file changes when using the watch scripts.

## Commit Guidelines

**IMPORTANT**: When making git commits, DO NOT include:
- "Co-Authored-By: Claude" lines
- "Generated with Claude Code" messages  
- Any AI/OpenAI attribution or links

Keep commit messages clean and focused on the actual changes made.