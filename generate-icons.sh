#!/bin/bash

# Icon generation script for Tetrix game
# This script converts the SVG icon to various PNG sizes needed for web app manifest

# Check if we have the required tools
if ! command -v magick &> /dev/null && ! command -v convert &> /dev/null; then
    echo "ImageMagick not found. Please install it:"
    echo "  macOS: brew install imagemagick"
    echo "  Ubuntu: sudo apt-get install imagemagick"
    echo "  Or use online SVG to PNG converter"
    exit 1
fi

# Use magick if available (ImageMagick 7), otherwise use convert (ImageMagick 6)
if command -v magick &> /dev/null; then
    CONVERT_CMD="magick"
else
    CONVERT_CMD="convert"
fi

echo "Generating PNG icons from SVG..."

# Create icons directory if it doesn't exist
mkdir -p public/icons

# Generate various sizes
sizes=(72 96 128 144 152 192 384 512)

for size in "${sizes[@]}"; do
    echo "Generating ${size}x${size} icon..."
    $CONVERT_CMD public/icon.svg -resize ${size}x${size} public/icons/icon-${size}x${size}.png
done

echo "Generating social preview image..."
$CONVERT_CMD public/social-preview.svg public/social-preview.png

echo "Icon generation complete!"
echo "Generated files:"
ls -la public/icons/