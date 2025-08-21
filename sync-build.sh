#!/bin/bash

# Sync script for WordPress Plugin Filter Extension
# Automatically updates build-for-submission folder with latest changes

BUILD_DIR="build-for-submission"
ROOT_DIR="."

echo "🔄 Syncing extension files to $BUILD_DIR..."

# Create build directory if it doesn't exist
mkdir -p "$BUILD_DIR"

# Copy essential extension files
echo "📄 Copying core files..."
cp "$ROOT_DIR/manifest.json" "$BUILD_DIR/"
cp "$ROOT_DIR/content.js" "$BUILD_DIR/"
cp "$ROOT_DIR/background.js" "$BUILD_DIR/"
cp "$ROOT_DIR/inject-ui.css" "$BUILD_DIR/"

# Copy icons directory
echo "🎨 Copying icons..."
cp -r "$ROOT_DIR/icons" "$BUILD_DIR/"

# Remove any development files that might have been copied
echo "🧹 Cleaning development files..."
rm -f "$BUILD_DIR"/.gitignore
rm -f "$BUILD_DIR"/.git*
rm -rf "$BUILD_DIR"/docs
rm -rf "$BUILD_DIR"/.vscode

echo "✅ Sync complete!"
echo "📦 Files in $BUILD_DIR:"
ls -la "$BUILD_DIR"

# Optional: Create ZIP file if zip is available
if command -v zip &> /dev/null; then
    echo "📦 Creating ZIP file..."
    cd "$BUILD_DIR" && zip -r ../wordpress-plugin-filter-extension.zip . && cd ..
    echo "✅ ZIP file created: wordpress-plugin-filter-extension.zip"
else
    echo "ℹ️  ZIP command not available. Install zip to auto-create submission file."
fi