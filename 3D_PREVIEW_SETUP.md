# 3D Preview Implementation Guide

This guide explains how to set up the 3D preview functionality for the custom design section using your Blender assets.

## 🎯 Overview

The 3D preview system allows users to:
- View their custom designs on a 3D hoodie model
- Interactively rotate, zoom, and pan around the model
- Apply custom textures and designs in real-time
- Export their final designs

## 📁 Assets Provided

- `Hoodie Mockup Final Template Download.blend` (7.8MB) - Main 3D model
- `Hoodie Final.abc` (185MB) - Alembic cache for animations
- `FCL1-PSK002-00_DIFFUSE_DESATURATION.png` (948KB) - Base texture
- `Your Design.psd` (34MB) - Design template

## 🚀 Setup Instructions

### 1. Convert Blender Model

The `.blend` file needs to be converted to a web-compatible format:

1. **Open Blender** and load `Hoodie Mockup Final Template Download.blend`
2. **Export as GLTF 2.0**:
   - File → Export → glTF 2.0 (.glb/.gltf)
   - Choose `.glb` format for single file
   - Enable "Include → Selected Objects" if needed
   - Enable "Transform → +Y Up" for web compatibility
   - Save as: `public/blender/hoodie-model.glb`

3. **Alternative: Export as OBJ**:
   - File → Export → Wavefront (.obj)
   - Enable "Materials"
   - Save as: `public/blender/hoodie-model.obj`
   - This will also create a `.mtl` file

### 2. Optimize Textures

1. **Resize the diffuse texture**:
   - Resize `FCL1-PSK002-00_DIFFUSE_DESATURATION.png` to 2048×2048 or 1024×1024
   - Keep as PNG for transparency support

2. **Create additional maps** (optional but recommended):
   - Normal map for surface details
   - Roughness map for material properties
   - Metallic map for material variation

### 3. Update Model Path

Update the model path in `src/components/ThreeDViewer.tsx`:

```typescript
// Change this line:
scene = useGLTF('/blender/hoodie-model.glb');
```

### 4. Test the Implementation

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Navigate to the design page**:
   - Go to `/design`
   - Toggle "Show 3D Preview" checkbox
   - The 3D viewer should appear

## 🎨 Features Implemented

### 3D Viewer Component (`ThreeDViewer.tsx`)
- Interactive 3D model display
- Orbit controls (rotate, zoom, pan)
- Real-time texture application
- Fallback geometry if model fails to load
- Loading states and error handling

### Design Texture Manager (`DesignTextureManager.tsx`)
- Upload and manage design elements
- Position, scale, and rotate elements
- Real-time texture generation
- Element property controls

### 3D Design Studio (`ThreeDDesignStudio.tsx`)
- Complete 3D design interface
- Toggle between 3D and 2D views
- Export functionality
- Design tips and guidance

## 🔧 Technical Details

### Dependencies Added
- `three` - Core 3D library
- `@react-three/fiber` - React renderer for Three.js
- `@react-three/drei` - Useful helpers and components
- `@types/three` - TypeScript definitions

### File Structure
```
src/
├── components/
│   ├── ThreeDViewer.tsx          # Main 3D viewer
│   ├── DesignTextureManager.tsx  # Texture management
│   ├── ThreeDDesignStudio.tsx   # Complete studio interface
│   └── hooks/
│       └── useCanvas.ts          # Canvas utilities
└── app/design/
    └── page.tsx                 # Updated with 3D preview toggle
```

## 🎮 Usage

### For Users
1. **Enable 3D Preview**: Check the "Show 3D Preview" checkbox
2. **Upload Designs**: Use the texture manager to add design elements
3. **Customize**: Adjust position, size, rotation, and opacity
4. **Preview**: See real-time updates in the 3D viewer
5. **Export**: Download the final design

### For Developers
1. **Model Updates**: Replace `hoodie-model.glb` with new models
2. **Texture Updates**: Update the base texture path
3. **Customization**: Modify materials, lighting, and controls
4. **Performance**: Optimize model complexity for better performance

## 🐛 Troubleshooting

### Model Not Loading
- Check that the GLB file is in the correct location
- Verify the file path in `ThreeDViewer.tsx`
- Check browser console for errors
- The fallback geometry will display if the model fails to load

### Performance Issues
- Reduce model complexity in Blender
- Use lower resolution textures
- Optimize the number of polygons
- Consider using LOD (Level of Detail) models

### Texture Issues
- Ensure textures are web-compatible formats (PNG, JPG)
- Check CORS settings for external textures
- Verify texture dimensions are power-of-2 (512, 1024, 2048)

## 🚀 Next Steps

1. **Convert your Blender model** using the steps above
2. **Test the 3D preview** in your application
3. **Customize the interface** to match your design
4. **Add more features** like:
   - Multiple model options
   - Animation support
   - AR preview
   - Advanced material editing

## 📚 Resources

- [Three.js Documentation](https://threejs.org/docs/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- [React Three Drei](https://github.com/pmndrs/drei)
- [Blender to Web Pipeline](https://threejs.org/docs/#manual/en/introduction/Loading-3D-models)

---

**Note**: The current implementation includes a fallback geometry that will display if the Blender model can't be loaded, ensuring the 3D preview always works.


