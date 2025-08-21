#!/bin/bash

# Auto-sync watcher for WordPress Plugin Filter Extension
# Watches for changes to extension files and automatically syncs to build-for-submission

echo "👀 Starting file watcher for auto-sync..."
echo "📁 Watching files: manifest.json, content.js, background.js, inject-ui.css, icons/"
echo "🛑 Press Ctrl+C to stop watching"

# Check if inotifywait is available
if ! command -v inotifywait &> /dev/null; then
    echo "⚠️  inotifywait not found. Installing inotify-tools..."
    
    # Try to install inotify-tools
    if command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y inotify-tools
    elif command -v yum &> /dev/null; then
        sudo yum install -y inotify-tools
    elif command -v brew &> /dev/null; then
        brew install inotify-tools
    else
        echo "❌ Could not install inotify-tools. Please install manually."
        echo "💡 Alternative: Run './sync-build.sh' manually after making changes"
        exit 1
    fi
fi

# Run initial sync
echo "🔄 Running initial sync..."
./sync-build.sh

# Watch for changes and auto-sync
inotifywait -m -e close_write,moved_to,create \
    --include '(manifest\.json|content\.js|background\.js|inject-ui\.css)$' \
    . icons/ 2>/dev/null | while read -r directory events filename; do
    
    echo "📝 Detected change: $filename"
    echo "🔄 Auto-syncing..."
    ./sync-build.sh
    echo "⏰ $(date): Sync completed"
    echo "---"
done