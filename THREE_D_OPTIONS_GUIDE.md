# 3D Hero Section - 3 Complete Options

## Current Setup
You have a **Sketchfab iframe** embedded (book model from external site).

---

## **OPTION 1: Switch to Different Sketchfab Model** ✅ EASIEST

### Step 1: Find a Model
1. Go to [Sketchfab.com](https://sketchfab.com)
2. Search for something fitting your brand (e.g., "graduation cap", "education", "books", "student")
3. Make sure it has **transparent background**
4. Click on the model
5. Copy the **model ID** from the URL:
   ```
   https://sketchfab.com/models/[THIS_IS_YOUR_ID]/
   Example: 43bab72da51b47b28379c7e094695708
   ```

### Step 2: Update Home.jsx
In `src/components/common/Home.jsx`, find the iframe and change the model ID:

```jsx
<iframe
    src="https://sketchfab.com/models/YOUR_NEW_ID_HERE/embed?autostart=1&preload=1&transparent=1&dnt=1&ui_controls=0&ui_infos=0&ui_inspector=0&ui_stop=0&ui_watermark=0&ui_watermark_link=0"
    // ... rest of props
/>
```

### Advantages
- ✅ No setup needed
- ✅ Works immediately
- ✅ Free models available
- ✅ High quality

### Disadvantages
- ❌ Loads from external website (depends on Sketchfab)
- ❌ "Feels like borrowed" (not yours)

---

## **OPTION 2: Self-Hosted 3D Model with Three.js** 🔥 RECOMMENDED

### Step 1: Get a 3D Model File

**Download from:**
- [Poly Haven](https://polyhaven.com/models) - Download `.glb` format
- [Sketchfab](https://sketchfab.com) - Right-click model → Download → `.glb`
- [Free3D.com](https://free3d.com) - Download `.glb` or convert `.obj` to `.glb`
- [CGTrader](https://www.cgtrader.com) - Search "education book" or "student cap"

**Good models for education theme:**
- Graduation cap
- Open books
- Student desk
- Globe
- Lightbulb
- Diploma

### Step 2: Add Model to Your Project

1. Create folder: `public/models/`
2. Place your `.glb` file there:
   ```
   public/models/mymodel.glb
   ```

### Step 3: Install Three.js Dependencies (if not already installed)

```bash
npm install three @react-three/fiber @react-three/drei
```

Check your `package.json` - you probably already have these.

### Step 4: Use in Home.jsx

Replace the Sketchfab iframe section with:

```jsx
import InteractiveModel from '../landing/InteractiveModel';

// In the right column of HeroSection, replace the iframe with:
<InteractiveModel modelPath="/models/mymodel.glb" />
```

### Step 5: Customize Camera/Lighting (Optional)

In `src/components/landing/InteractiveModel.jsx`, adjust:
```jsx
<Canvas camera={{ position: [0, 0, 2.5], fov: 50 }} />  // Position & zoom
<ambientLight intensity={0.7} />  // Overall brightness
<directionalLight position={[5, 5, 5]} intensity={1} />  // Directional light
```

### Advantages
- ✅ Completely yours (hosted on your server)
- ✅ Interactive (drag to rotate)
- ✅ No external dependencies
- ✅ Loads faster on repeat visits
- ✅ Professional

### Disadvantages
- ⚠️ Need to find/download a `.glb` file
- ⚠️ File size matters (keep under 5MB)

---

## **OPTION 3: Interactive Constellation (Dots & Lines with Drag)** 🎨 CUSTOM

### Step 1: Add to Home.jsx

Replace the Sketchfab iframe section with:

```jsx
import InteractiveConstellation from '../landing/InteractiveConstellation';

// In the right column of HeroSection, replace the iframe with:
<InteractiveConstellation />
```

**That's it!** No additional setup needed.

### Features
- Animated dots connected by lines (like your original)
- **Drag to rotate** the entire constellation
- Mouse position also affects the positions subtly
- Fully interactive and responsive

### Customize Appearance

In `src/components/landing/InteractiveConstellation.jsx`, change:

```jsx
const N = 52;              // Number of dots
const CONNECT_D = 10;      // Distance to connect lines

// Colors:
color="#06B6D4"           // Dots color (cyan)
color="#8B5CF6"           // Lines color (purple)

// Opacity:
opacity={0.85}            // Dots opacity
opacity={0.13}            // Lines opacity
```

### Advantages
- ✅ Fully custom-built
- ✅ Drag to rotate
- ✅ No external files needed
- ✅ Lightweight
- ✅ Matches your brand identity

### Disadvantages
- ❌ Abstract (not a real object)
- ❌ Less impressive than 3D model

---

## **COMPARISON TABLE**

| Feature | Option 1 (Sketchfab) | Option 2 (Self-Hosted) | Option 3 (Constellation) |
|---------|---|---|---|
| **Setup Time** | 2 min | 15 min | 1 min |
| **File Size** | N/A (external) | Depends (1-5MB) | Tiny |
| **Interactive** | Limited | Full (drag rotate) | Full (drag rotate) |
| **Looks Professional** | Yes | Yes | Yes |
| **Yours to Keep** | No | Yes | Yes |
| **External Dependency** | Yes | No | No |
| **Customizable** | No | Yes | Yes |

---

## **QUICK DECISION TREE**

```
Want the easiest quick setup?
→ OPTION 1 (Sketchfab)

Want a professional 3D model that's yours?
→ OPTION 2 (Self-Hosted)

Want something custom & minimal file size?
→ OPTION 3 (Constellation)

Want TWO versions? (toggle between)
→ Create a state & render conditional
```

---

## **HOW TO TOGGLE BETWEEN OPTIONS**

Add this to `Home.jsx`:

```jsx
import { useState } from 'react';
import InteractiveModel from '../landing/InteractiveModel';
import InteractiveConstellation from '../landing/InteractiveConstellation';

function HeroSection() {
    const [modelType, setModelType] = useState('constellation'); // or 'model' or 'sketchfab'

    return (
        // ... existing code ...
        {modelType === 'constellation' && <InteractiveConstellation />}
        {modelType === 'model' && <InteractiveModel modelPath="/models/mymodel.glb" />}
        {modelType === 'sketchfab' && (
            <iframe src="https://sketchfab.com/..." />
        )}
    );
}
```

---

## **FILES PROVIDED**

✅ `InteractiveModel.jsx` - Self-hosted 3D model loader (Option 2)
✅ `InteractiveConstellation.jsx` - Upgraded dots with drag rotation (Option 3)
✅ Current `Home.jsx` - Uses Sketchfab (Option 1)

---

## **NEXT STEPS**

1. **Try Option 3 first** → Minimal setup, instant results
2. **If you want a real model** → Try Option 2 (find a `.glb` file)
3. **If you like Sketchfab** → Option 1 is already working

Which one appeals to you most?
