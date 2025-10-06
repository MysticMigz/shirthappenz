
// Add this to your ThreeDViewer.tsx if you need custom GLTF loading
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const loader = new GLTFLoader();
loader.load('/blender/hoodie-model.glb', (gltf) => {
  // Handle loaded model
  scene.add(gltf.scene);
}, undefined, (error) => {
  console.error('Error loading GLTF:', error);
});
