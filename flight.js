import * as THREE from './assets/vendor/three/three.module.js';

// Original PNGs remain untouched. Cropping is performed with texture UVs.
const textures = ['moon.jpg', 'saturn.png', 'venus.png', 'mars.png', 'earth.jpg', 'neptune.png'];
const SECTOR = 100;
const FOV = 50;
const startCameraZ = 15;
const finalCameraZ = -2;
const finalProductZ = -6;
const clamp = n => Math.max(0, Math.min(1, n));
const ease = n => { n = clamp(n); return n * n * (3 - 2 * n); };
const lerp = (a, b, t) => a + (b - a) * t;
const point = new THREE.Vector3();

function randomGenerator(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let n = Math.imul(seed ^ seed >>> 15, 1 | seed);
    n ^= n + Math.imul(n ^ n >>> 7, 61 | n);
    return ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
}

function makeRockGeometry() {
  const geometry = new THREE.SphereGeometry(1, 16, 10);
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    point.fromBufferAttribute(positions, i);
    const roughness = 1 + 0.12 * Math.sin(point.x * 18 + point.y * 7) * Math.cos(point.z * 11);
    point.multiplyScalar(roughness);
    positions.setXYZ(i, point.x, point.y, point.z);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function makeTerrainGeometry() {
  const geometry = new THREE.PlaneGeometry(14, 9, 84, 54);
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i);
    const rough = Math.sin(x * 3.7 + y * 2.1) * Math.cos(y * 4.3) * .11 + Math.sin(x * 11.4 - y * 8.2) * .035;
    const flatCenter = Math.min(1, Math.hypot(x, y) * .7);
    positions.setZ(i, rough * flatCenter);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function ringMaterial(innerRadius, outerRadius) {
  return new THREE.ShaderMaterial({
    transparent: true, side: THREE.DoubleSide, depthWrite: false,
    uniforms: { inner: {value: innerRadius}, outer: {value: outerRadius} },
    vertexShader: `varying vec3 ringPosition; void main(){ ringPosition=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `varying vec3 ringPosition; uniform float inner; uniform float outer;
      void main(){ float r=length(ringPosition.xy); float t=(r-inner)/(outer-inner);
      float fine=1.-smoothstep(.006,.03,fwidth(t));
      float bands=.55+.2*sin(t*42.)+.1*sin(t*115.)+.06*sin(t*225.)*fine; float gap=1.-smoothstep(.39,.41,t)* (1.-smoothstep(.43,.45,t));
      float alpha=(.3+.5*bands)*gap*smoothstep(0.,.025,t)*(1.-smoothstep(.94,1.,t));
      vec3 color=mix(vec3(.35,.25,.14),vec3(.88,.74,.5),bands);
      gl_FragColor=vec4(color,alpha); }`
  });
}

function atmosphere(radius, color) {
  return new THREE.Mesh(new THREE.SphereGeometry(radius * 1.025, 48, 32), new THREE.ShaderMaterial({
    uniforms: {glow: {value: new THREE.Color(color)}}, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `varying vec3 n; varying vec3 v; void main(){ vec4 p=modelViewMatrix*vec4(position,1.); n=normalize(normalMatrix*normal); v=normalize(-p.xyz); gl_Position=projectionMatrix*p; }`,
    fragmentShader: `uniform vec3 glow; varying vec3 n; varying vec3 v; void main(){ float rim=pow(1.-max(0.,dot(normalize(n),normalize(v))),3.5); gl_FragColor=vec4(glow,rim*.28); }`
  }));
}

export async function createFlight(stage, products) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({alpha: true, antialias: true, powerPreference: 'high-performance'});
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth <= 700 ? 1.35 : 1.6));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.domElement.className = 'flight-canvas';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.04, 460);
  const loader = new THREE.TextureLoader();
  const resources = [];
  const planets = [];
  const packshots = [];
  const shelves = [];
  const key = new THREE.DirectionalLight(0xffe8c9, 3.2);
  key.position.set(-30, 15, 14);
  scene.add(key, key.target, new THREE.AmbientLight(0xbfcbea, .34));
  const fill = new THREE.DirectionalLight(0x729ce0, .45);
  fill.position.set(25, -5, -20);
  scene.add(fill, fill.target);
  const random = randomGenerator(771);
  const starPositions = new Float32Array(5400);
  for (let i = 0; i < 1800; i++) {
    starPositions[i * 3] = (random() - .5) * 550;
    starPositions[i * 3 + 1] = (random() - .5) * 260;
    starPositions[i * 3 + 2] = 45 - random() * 970;
  }
  const starsGeometry = new THREE.BufferGeometry();
  starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(starsGeometry, new THREE.PointsMaterial({color: 0xd9e8ff, size: .18, transparent: true, opacity: .8, sizeAttenuation: true}));
  scene.add(stars);

  const rockGeometry = makeRockGeometry();
  const rockMap = await loader.loadAsync('assets/flight/moon.jpg');
  rockMap.colorSpace = THREE.SRGBColorSpace;
  const rockMaterial = new THREE.MeshStandardMaterial({map:rockMap, color:0x726a60, roughness:1});
  const groundMap = rockMap.clone();
  groundMap.wrapS = groundMap.wrapT = THREE.RepeatWrapping;
  groundMap.repeat.set(7, 5);
  groundMap.needsUpdate = true;
  const terrainGeometry = makeTerrainGeometry();
  const terrainMaterial = new THREE.MeshStandardMaterial({map:groundMap, bumpMap:groundMap, bumpScale:.16, color:0x62594b, roughness:1, transparent:true});
  resources.push(groundMap);
  resources.push(rockMap);
  const asteroidCount = 220;
  const asteroids = new THREE.InstancedMesh(rockGeometry, rockMaterial, asteroidCount);
  const transform = new THREE.Object3D();
  for (let i = 0; i < asteroidCount; i++) {
    const angle = random() * Math.PI * 2;
    const radius = 4.8 + random() * 27;
    transform.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 25 - random() * 680);
    const size = .12 + random() ** 3 * 1.25;
    transform.scale.set(size * (1 + random()), size, size * (.7 + random()));
    transform.rotation.set(random() * Math.PI, random() * Math.PI, random() * Math.PI);
    transform.updateMatrix();
    asteroids.setMatrixAt(i, transform.matrix);
  }
  scene.add(asteroids);

  try {
    await Promise.all(products.map(async (product, index) => {
      const [surface, photo] = await Promise.all([
        loader.loadAsync(`assets/flight/${textures[index]}`),
        loader.loadAsync(product.photo)
      ]);
      surface.colorSpace = photo.colorSpace = THREE.SRGBColorSpace;
      surface.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      resources.push(surface, photo);
      const radius = index === 1 ? 11.8 : 11.5;
      const planet = new THREE.Group();
      planet.position.set(3.5, .3, -index * SECTOR - 27);
      const body = new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 48), new THREE.MeshStandardMaterial({map:surface, roughness:1, metalness:0}));
      body.rotation.y = index === 4 ? -1.1 : .15;
      planet.add(body, atmosphere(radius, product.accent));
      if (index === 1) {
        const innerRadius = radius * 1.185, outerRadius = radius * 1.845;
        const rings = new THREE.Mesh(new THREE.RingGeometry(innerRadius, outerRadius, 160), ringMaterial(innerRadius, outerRadius));
        rings.rotation.set(-1.25, -.14, -.32);
        planet.add(rings);
      }
      scene.add(planet);
      planets[index] = planet;

      const photoImage = photo.image;
      const style = product.photoStyle;
      const number = key => Number(style.match(new RegExp(`${key}:([-\\d.]+)`))[1]);
      const widthFactor = number('--photo-width') / 100;
      const cropWidth = photoImage.width / widthFactor;
      const cropHeight = cropWidth / (Number(style.match(/--photo-ratio:([\d.]+)\/([\d.]+)/)[1]) / Number(style.match(/--photo-ratio:([\d.]+)\/([\d.]+)/)[2]));
      const cropX = -number('--photo-left') / 100 * cropWidth;
      const cropY = -number('--photo-top') / 100 * cropHeight;
      // Crop only transparent margins during GPU upload, retaining label pixels.
      // The original image files remain unchanged and available in the catalog.
      const upload = document.createElement('canvas');
      upload.width = Math.round(cropWidth);
      upload.height = Math.round(cropHeight);
      upload.getContext('2d').drawImage(photoImage, Math.round(cropX), Math.round(cropY), upload.width, upload.height, 0, 0, upload.width, upload.height);
      photo.image = upload;
      photo.needsUpdate = true;
      const pack = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({map:photo, transparent:true, alphaTest:.02, depthWrite:false, toneMapped:false}));
      pack.position.z = -index * SECTOR + finalProductZ;
      pack.visible = false;
      scene.add(pack);
      packshots[index] = pack;
      const shelf = new THREE.Mesh(terrainGeometry, terrainMaterial);
      shelf.position.set(1, -1.5, -index * SECTOR - 6.1);
      shelf.rotation.x = -Math.PI / 2;
      scene.add(shelf);
      shelves[index] = shelf;
    }));
  } catch (error) {
    renderer.dispose();
    resources.forEach(texture => texture.dispose());
    return null;
  }

  let width, height;
  const poses = [];
  function resize() {
    width = stage.clientWidth;
    height = stage.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    const span = 2 * (finalCameraZ - finalProductZ) * Math.tan(FOV * Math.PI / 360);
    const horizontalSpan = span * camera.aspect;
    document.querySelectorAll('.chapter-product').forEach((element, index) => {
      const w = element.offsetWidth / width * horizontalSpan;
      const h = element.offsetHeight / height * span;
      const x = (element.offsetLeft / width + element.offsetWidth / width / 2 - .5) * horizontalSpan;
      const y = (.5 - element.offsetTop / height - element.offsetHeight / height / 2) * span;
      poses[index] = {x, y, w, h};
    });
  }
  resize();
  stage.prepend(renderer.domElement);
  stage.classList.add('flight-ready');
  let lastCursor = 0;
  let disposed = false;
  function render(cursor) {
    if (disposed) return;
    lastCursor = cursor;
    const index = Math.min(5, Math.floor(cursor));
    const phase = cursor - index;
    const approach = ease(phase / .55);
    const departure = index < 5 ? ease((phase - .8) / .2) : 0;
    const base = -index * SECTOR;
    const cameraZ = departure > 0 ? lerp(base + finalCameraZ, base - SECTOR + startCameraZ, departure) : lerp(base + startCameraZ, base + finalCameraZ, approach);
    camera.position.set(departure > 0 ? lerp(0,-1.2,departure)+Math.sin(departure*Math.PI)*4.2 : lerp(-1.2,0,approach), departure > 0 ? .1*departure+Math.sin(departure*Math.PI)*.9 : .1*(1-approach), cameraZ);
    camera.lookAt(camera.position.x * .5, camera.position.y * .5, cameraZ - 40);
    key.position.z = cameraZ + 30;
    fill.position.z = cameraZ - 15;
    key.target.position.set(3.5, .3, base - 27);
    fill.target.position.set(3.5, .3, base - 27);
    stars.position.x = Math.sin(cursor * .65) * 2;
    packshots.forEach((pack, i) => {
      const active = i === index;
      pack.visible = active && phase > .22 && departure < .1;
      shelves[i].visible = active && phase > .49 && departure < .12;
      if (!active) return;
      const arrival = ease((phase - .22) / .33);
      const pose = poses[i];
      pack.position.set(pose.x, pose.y - .45 * (1 - arrival), base + lerp(-24, finalProductZ, arrival));
      pack.scale.set(pose.w, pose.h, 1);
      pack.material.opacity = ease((phase - .22) / .12) * (1 - ease((phase - .76) / .07));
      terrainMaterial.opacity = ease((phase - .49) / .07) * (1 - ease((phase - .77) / .06));
      shelves[i].position.set(pack.position.x, pack.position.y - pose.h / 2 - .025, pack.position.z - .12);
      const planet = planets[i];
      planet.rotation.y = phase * .045;
    });
    planets.forEach((planet, i) => { planet.visible = i === index || i === index + 1; });
    renderer.render(scene, camera);
    stage.dataset.flightPhase = phase < .22 ? 'approach' : phase < .55 ? 'arrival' : phase < .8 ? 'hold' : 'departure';
    stage.dataset.cameraZ = cameraZ.toFixed(3);
  }
  const onResize = () => { resize(); render(lastCursor); };
  addEventListener('resize', onResize);
  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault(); stage.classList.remove('flight-ready'); disposed = true;
  });
  return {
    render,
    disable() { stage.classList.remove('flight-ready'); disposed = true; },
    dispose() {
      disposed = true; removeEventListener('resize', onResize);
      stage.classList.remove('flight-ready'); renderer.domElement.remove();
      scene.traverse(object => { object.geometry?.dispose(); const material = object.material; if (Array.isArray(material)) material.forEach(m => m.dispose()); else material?.dispose(); });
      resources.forEach(texture => texture.dispose()); renderer.dispose();
    }
  };
}
