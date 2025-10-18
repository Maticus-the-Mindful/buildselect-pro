# BuildSelect Pro Assets

This folder contains all media assets for the BuildSelect Pro application.

## 📁 Folder Structure

### `/logos`
Place your company and product logos here:
- `buildselect-logo.svg` or `.png` - Main app logo
- `buildselect-logo-light.svg` - Logo for dark mode (if different)
- `buildselect-icon.svg` - Icon-only version for small displays
- Partner/supplier logos

**Recommended formats:** SVG (preferred), PNG with transparent background  
**Recommended sizes:** Logo: 300x80px, Icon: 256x256px

### `/images`
General application images:
- Hero images
- Marketing materials
- Product category images
- Background images
- Screenshots

**Recommended formats:** WebP (preferred), PNG, JPG  
**Optimization:** Compress images before uploading for better performance

### `/icons`
App icons and favicons:
- `favicon.ico` - Browser favicon
- `apple-touch-icon.png` - iOS home screen icon (180x180)
- `icon-192.png` - Android icon (192x192)
- `icon-512.png` - Android icon (512x512)
- Category icons or custom UI icons

**Recommended format:** PNG with transparency  
**Required sizes:** See individual icon specifications above

## 🎨 Usage in Code

To use these assets in your React components:

```tsx
// Import from public folder
<img src="/assets/logos/buildselect-logo.svg" alt="BuildSelect Pro" />

// Or for better performance with Vite
import logo from '/assets/logos/buildselect-logo.svg'
<img src={logo} alt="BuildSelect Pro" />
```

## 📝 Guidelines

1. **File Naming:** Use lowercase with hyphens (e.g., `company-logo.png`)
2. **Optimization:** Always optimize images before adding them
3. **Formats:** 
   - SVG for logos and icons (scalable)
   - WebP for photos (best compression)
   - PNG for images requiring transparency
4. **Size Limits:** Keep individual files under 500KB when possible

## 🔧 Recommended Tools

- **Image Optimization:** TinyPNG, Squoosh, ImageOptim
- **SVG Editing:** Figma, Adobe Illustrator, Inkscape
- **Format Conversion:** CloudConvert, Online-Convert

