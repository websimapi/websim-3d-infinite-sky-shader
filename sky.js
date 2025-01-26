import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';

// Initialize scene, camera and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#canvas'),
  antialias: true,
  powerPreference: "high-performance"
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Create sky shader material
const skyShader = {
  uniforms: {
    time: { value: 0 },
    resolution: { value: new THREE.Vector2() }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float time;
    uniform vec2 resolution;
    varying vec2 vUv;

    #define PI 3.14159265359
    
    float hash(float n) {
      return fract(sin(n) * 43758.5453123);
    }

    float noise(vec3 p) {
      vec3 i = floor(p);
      vec3 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      
      float n = i.x + i.y * 157.0 + 113.0 * i.z;
      return mix(
        mix(
          mix(hash(n + 0.0), hash(n + 1.0), f.x),
          mix(hash(n + 157.0), hash(n + 158.0), f.x),
          f.y),
        mix(
          mix(hash(n + 113.0), hash(n + 114.0), f.x),
          mix(hash(n + 270.0), hash(n + 271.0), f.x),
          f.y),
        f.z);
    }

    void main() {
      vec2 uv = vUv * 2.0 - 1.0;
      uv.x *= resolution.x / resolution.y;
      
      vec3 dir = normalize(vec3(uv, 1.0));
      float t = time * 0.2;
      
      vec3 sky = vec3(0.1, 0.3, 0.6);
      vec3 cloud = vec3(1.0);
      
      float density = 0.0;
      float scale = 1.0;
      
      for(int i = 0; i < 5; i++) {
        float level = noise(dir * scale + vec3(t * (0.5 + float(i) * 0.1), t, 0.0));
        density += level / scale;
        scale *= 2.0;
      }
      
      vec3 color = mix(sky, cloud, smoothstep(0.5, 0.8, density));
      
      vec3 sunDir = normalize(vec3(sin(t), 0.2, cos(t)));
      float sunIntensity = max(0.0, dot(dir, sunDir));
      color += vec3(1.0, 0.7, 0.3) * pow(sunIntensity, 32.0);
      
      gl_FragColor = vec4(color, 1.0);
    }
  `
};

// Create a full-screen quad
const geometry = new THREE.PlaneGeometry(2, 2);
const material = new THREE.ShaderMaterial(skyShader);
const quad = new THREE.Mesh(geometry, material);
scene.add(quad);

// Create pose visualization mesh
const poseGeometry = new THREE.BufferGeometry();
const poseVertices = new Float32Array(33 * 3); // 17 keypoints * 3 coordinates
const poseMaterial = new THREE.PointsMaterial({
  color: 0x00ffff,
  size: 0.05
});
const posePoints = new THREE.Points(poseGeometry, poseMaterial);
scene.add(posePoints);

// Create lines for skeleton
const skeletonGeometry = new THREE.BufferGeometry();
const skeletonMaterial = new THREE.LineBasicMaterial({
  color: 0x00ffff,
  linewidth: 2
});
const skeletonLines = new THREE.LineSegments(skeletonGeometry, skeletonMaterial);
scene.add(skeletonLines);

// Position camera
camera.position.z = 1;

// Handle window resize
const onResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  material.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
};

window.addEventListener('resize', onResize);

// Update pose visualization in the scene
window.addEventListener('poseUpdated', (event) => {
  const pose = event.detail;
  
  // Update keypoints
  const vertices = [];
  pose.keypoints.forEach(keypoint => {
    if (keypoint.score > 0.3) {
      // Convert from screen coordinates to scene coordinates
      const x = (keypoint.x / window.innerWidth) * 2 - 1;
      const y = -(keypoint.y / window.innerHeight) * 2 + 1;
      vertices.push(x, y, 0);
    }
  });
  
  poseGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  
  // Update skeleton
  const connections = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet);
  const skeletonVertices = [];
  
  connections.forEach(([i, j]) => {
    const kp1 = pose.keypoints[i];
    const kp2 = pose.keypoints[j];
    
    if (kp1.score > 0.3 && kp2.score > 0.3) {
      const x1 = (kp1.x / window.innerWidth) * 2 - 1;
      const y1 = -(kp1.y / window.innerHeight) * 2 + 1;
      const x2 = (kp2.x / window.innerWidth) * 2 - 1;
      const y2 = -(kp2.y / window.innerHeight) * 2 + 1;
      
      skeletonVertices.push(x1, y1, 0);
      skeletonVertices.push(x2, y2, 0);
    }
  });
  
  skeletonGeometry.setAttribute('position', new THREE.Float32BufferAttribute(skeletonVertices, 3));
});

// Animation loop
let lastTime = 0;
function animate(currentTime) {
  material.uniforms.time.value = currentTime * 0.001;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// Initialize resolution uniform and start animation
material.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
animate(0);