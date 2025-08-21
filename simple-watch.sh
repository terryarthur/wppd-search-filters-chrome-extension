#!/bin/bash

# Simple polling-based auto-sync for WordPress Plugin Filter Extension
# Checks for file changes every 2 seconds and syncs when needed

echo "👀 Starting simple file watcher (polling every 2 seconds)..."
echo "📁 Watching: manifest.json, content.js, background.js, inject-ui.css, icons/"
echo "🛑 Press Ctrl+C to stop"

# Files to watch
FILES_TO_WATCH="manifest.json content.js background.js inject-ui.css icons/icon48.png icons/icon128.png"

# Get initial timestamps
get_timestamps() {
    for file in $FILES_TO_WATCH; do
        if [ -f "$file" ]; then
            stat -c "%Y" "$file" 2>/dev/null || stat -f "%m" "$file" 2>/dev/null
        fi
    done | tr '\n' ' '
}

# Run initial sync
echo "🔄 Running initial sync..."
./sync-build.sh
echo "⏰ Started watching at $(date)"
echo "---"

LAST_TIMESTAMPS=$(get_timestamps)

while true; do
    sleep 2
    
    CURRENT_TIMESTAMPS=$(get_timestamps)
    
    if [ "$CURRENT_TIMESTAMPS" != "$LAST_TIMESTAMPS" ]; then
        echo "📝 File changes detected"
        echo "🔄 Auto-syncing..."
        ./sync-build.sh
        echo "⏰ $(date): Sync completed"
        echo "---"
        LAST_TIMESTAMPS="$CURRENT_TIMESTAMPS"
    fi
done