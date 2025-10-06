# 🎬 Animation Setup Guide

## Your Alembic Animation File
You have: `public/blender/hoodiefinal.abc`

## To Use Your Animation:

### Step 1: Convert Alembic to GLB with Animation
1. **Open Blender**
2. **Import your Alembic file:**
   - File → Import → Alembic (.abc)
   - Select `hoodiefinal.abc`
3. **Export as GLB with Animation:**
   - File → Export → glTF 2.0 (.glb/.gltf)
   - **IMPORTANT:** Check "Include → Animations"
   - Save as `hoodie-animated.glb` in `public/blender/`

### Step 2: Replace Current Model
1. **Backup current model:**
   ```bash
   mv public/blender/hoodie-model.glb public/blender/hoodie-model-backup.glb
   ```
2. **Rename animated model:**
   ```bash
   mv public/blender/hoodie-animated.glb public/blender/hoodie-model.glb
   ```

### Step 3: Test Animation
1. **Refresh your browser**
2. **Go to design page**
3. **Enable "Show 3D Preview"**
4. **Click "🎬 Animation ON" button**
5. **Your animation should now play!**

## Features Added:
- ✅ **Animation Support** - GLB animations automatically detected and played
- ✅ **Animation Toggle** - Turn animations on/off with button
- ✅ **Fallback Animation** - Simple rotation if no GLB animations
- ✅ **Real-time Control** - Toggle without refreshing

## Console Messages:
- `🎬 Found animations: X` - Shows number of animations found
- `🎬 Playing animation: [name]` - Shows which animations are playing

Your hoodie will now animate with your custom animation! 🚀
