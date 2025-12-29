# Extension Icon

The extension requires a PNG icon file named `icon.png` (128x128 pixels).

## Creating the Icon

An SVG source file `icon.svg` has been provided. To convert it to PNG:

### Option 1: Using Inkscape
```bash
inkscape icon.svg --export-type=png --export-filename=icon.png --export-width=128 --export-height=128
```

### Option 2: Using ImageMagick
```bash
magick convert -background none icon.svg -resize 128x128 icon.png
```

### Option 3: Using Online Tools
1. Open https://cloudconvert.com/svg-to-png
2. Upload `icon.svg`
3. Set dimensions to 128x128
4. Download as `icon.png`

### Option 4: Remove Icon Reference
If you don't want to use an icon, remove the `"icon": "icon.png"` line from `package.json`.

## Icon Design

The icon shows three horizontal action buttons with circular indicators, representing the project actions displayed in the status bar. The design uses VS Code's blue color scheme to match the editor's visual style.
