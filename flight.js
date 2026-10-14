import * as THREE from './assets/vendor/three/three.module.js';

// Original product PNGs remain untouched; only transparent margins are cropped for GPU upload.
const textures = ['moon', 'saturn', 'venus', 'mars', 'earth', 'neptune'];
// Reference composition and light direction; lighting on the planets is baked into the cutouts.
const worlds = [
  {radius:17, light:[.9,.35,.4], color:0xe1edff, landing:[.72,.27]},
  {radius:14.5, light:[-.95,.3,.2], color:0xffedce, landing:[.94,.51]},
  {radius:14.2, light:[-.85,.45,.3], color:0xffe7df, landing:[.78,.30]},
  {radius:18, light:[.9,.45,.15], color:0xffddaa, landing:[.78,.25]},
  {radius:18, light:[.9,.35,.35], color:0xdbedff, landing:[.78,.28]},
  {radius:16, light:[.95,.35,.18], color:0xd7eaff, landing:[.77,.27]}
];
const SECTOR = 100;
const FOV = 50;
const startCameraZ = 15;
const finalCameraZ = -2;
const finalProductZ = -6;
const clamp = n => Math.max(0, Math.min(1, n));
const ease = n => { n = clamp(n); return n * n * (3 - 2 * n); };
const lerp = (a, b, t) => a + (b - a) * t;

function randomGenerator(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let n = Math.imul(seed ^ seed >>> 15, 1 | seed);
    n ^= n + Math.imul(n ^ n >>> 7, 61 | n);
    return ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
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

// View-facing photographic cutouts retain the reference's crater placement,
// soft lighting and luminous limb while the camera moves through 3D space.
function makePlanet(surface, index) {
  const world = worlds[index];
  const height = world.radius * 2.24;
  const width = height * surface.image.width / surface.image.height;
  const material = new THREE.MeshBasicMaterial({
    map:surface, transparent:true, alphaTest:.012, depthWrite:true, toneMapped:false, fog:false
  });
  if (index !== 1) material.onBeforeCompile = shader => {
    // Feather the reconstructed glow so isolated alpha flecks cannot form a hard fringe.
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\ndiffuseColor.a*=1.-smoothstep(.465,.495,length(vMapUv-vec2(.5)));');
  };
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  mesh.userData.referencePlanet = textures[index];
  return mesh;
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
  renderer.toneMappingExposure = 1.05;
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
  scene.add(key, key.target, new THREE.AmbientLight(0xbfcbea, .14));
  const fill = new THREE.DirectionalLight(0x729ce0, .12);
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

  let rockMap;
  try { rockMap = await loader.loadAsync('assets/flight/moon.jpg'); }
  catch { renderer.dispose(); starsGeometry.dispose(); stars.material.dispose(); return null; }
  rockMap.colorSpace = THREE.SRGBColorSpace;
  const groundMap = rockMap.clone();
  groundMap.wrapS = groundMap.wrapT = THREE.RepeatWrapping;
  groundMap.repeat.set(7, 5);
  groundMap.needsUpdate = true;
  const terrainGeometry = makeTerrainGeometry();
  const terrainMaterial = new THREE.MeshStandardMaterial({map:groundMap, bumpMap:groundMap, bumpScale:.16, color:0x62594b, roughness:1, transparent:true});
  resources.push(groundMap);
  resources.push(rockMap);
  // Photo cutouts give the foreground stones the same natural detail as the video.
  let asteroidMap;
  try { asteroidMap = await loader.loadAsync('assets/planets/asteroids.png'); }
  catch { renderer.dispose(); resources.forEach(texture=>texture.dispose()); terrainGeometry.dispose(); terrainMaterial.dispose(); starsGeometry.dispose(); stars.material.dispose(); return null; }
  asteroidMap.colorSpace = THREE.SRGBColorSpace;
  resources.push(asteroidMap);
  const asteroidCount = 960;
  const rockGeometry = new THREE.PlaneGeometry(1,1);
  const tiles = new Float32Array(asteroidCount * 2);
  const asteroidPoses = [];
  const rockMaterial = new THREE.MeshBasicMaterial({map:asteroidMap, color:0xaab2b9, transparent:true, alphaTest:.04, depthWrite:true, toneMapped:false});
  rockMaterial.onBeforeCompile = shader => {
    shader.vertexShader = 'attribute vec2 asteroidTile;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\nvMapUv=(vMapUv+asteroidTile)*.5;');
  };
  const asteroids = new THREE.InstancedMesh(rockGeometry, rockMaterial, asteroidCount);
  const transform = new THREE.Object3D();
  const roll = new THREE.Quaternion();
  const rollAxis = new THREE.Vector3(0,0,1);
  for (let i=0; i<asteroidCount; i++) {
    const angle=random()*Math.PI*2, radius=7+random()*29;
    asteroidPoses.push({x:Math.cos(angle)*radius, y:Math.sin(angle)*radius*.75-3, z:12-Math.floor(i/160)*SECTOR-random()*100, size:.25+random()**2*2.2, roll:(random()-.5)*Math.PI});
    tiles[i*2]=i%2; tiles[i*2+1]=Math.floor(i/2)%2;
  }
  rockGeometry.setAttribute('asteroidTile',new THREE.InstancedBufferAttribute(tiles,2));
  asteroids.frustumCulled=false;
  scene.add(asteroids);

  try {
    const built = await Promise.allSettled(products.map(async (product, index) => {
      const [surface, photo] = await Promise.all([
        loader.loadAsync(`assets/planets/${textures[index]}.png`),
        loader.loadAsync(product.photo)
      ]);
      surface.colorSpace = photo.colorSpace = THREE.SRGBColorSpace;
      surface.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      resources.push(surface, photo);
      const planet = makePlanet(surface,index);
      planet.position.set(1.6,.4,-index*SECTOR-27);
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
    const failure = built.find(result=>result.status==='rejected');
    if (failure) throw failure.reason;
  } catch (error) {
    scene.traverse(object=>{ object.geometry?.dispose(); object.material?.dispose(); });
    terrainGeometry.dispose(); terrainMaterial.dispose();
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
    lastCursor = cursor;
    if (disposed) return;
    const index = Math.min(5, Math.floor(cursor));
    const phase = cursor - index;
    const approach = ease(phase / .55);
    const departure = index < 5 ? ease((phase - .8) / .2) : 0;
    const base = -index * SECTOR;
    const cameraZ = departure > 0 ? lerp(base + finalCameraZ, base - SECTOR + startCameraZ, departure) : lerp(base + startCameraZ, base + finalCameraZ, approach);
    camera.position.set(departure > 0 ? lerp(0,-1.2,departure)+Math.sin(departure*Math.PI)*4.2 : lerp(-1.2,0,approach), departure > 0 ? .1*departure+Math.sin(departure*Math.PI)*.9 : .1*(1-approach), cameraZ);
    camera.lookAt(camera.position.x * .5, camera.position.y * .5, cameraZ - 40);
    const world = worlds[index];
    stage.style.setProperty('--nebula-glow', ['#b4d9ff35','#d6ae6c24','#ddb3c62b','#ce9b7425','#a5ccee30','#8fabf640'][index]);
    const planetDistance = finalCameraZ + 27;
    const planetSpan = 2 * planetDistance * Math.tan(FOV * Math.PI / 360);
    // The planet moves to the upper right during arrival, leaving the product and text in front.
    const composition = ease((phase - .22) / .33);
    const landingX = width <= 700 ? .66 : world.landing[0];
    const landingY = width <= 700 ? .52 : world.landing[1];
    planets[index].position.x = lerp(1.6, (landingX - .5) * planetSpan * camera.aspect, composition);
    planets[index].position.y = lerp(.4, (.5 - landingY) * planetSpan, composition);
    // Preserve the planetary silhouette on portrait screens.
    planets[index].scale.setScalar(Math.min(1, camera.aspect / .95));
    key.color.setHex(world.color);
    key.position.copy(planets[index].position).add(new THREE.Vector3(...world.light).multiplyScalar(60));
    fill.position.copy(planets[index].position).add(new THREE.Vector3(-world.light[0]*50,0,20));
    key.target.position.copy(planets[index].position);
    fill.target.position.copy(planets[index].position);
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
      const exit = index < products.length - 1 ? ease((phase - .76) / .07) : 0;
      pack.material.opacity = ease((phase - .22) / .12) * (1 - exit);
      terrainMaterial.opacity = ease((phase - .49) / .07) * (1 - exit);
      shelves[i].position.set(pack.position.x, pack.position.y - pose.h / 2 - .025, pack.position.z - .12);
    });
    planets.forEach((planet, i) => {
      planet.visible = i === index || (i === index + 1 && departure > .05);
      if (i !== index) { planet.position.x = 1.6; planet.position.y = .4; planet.scale.setScalar(Math.min(1, camera.aspect / .95)); }
    });
    planets.forEach(planet => planet.quaternion.copy(camera.quaternion));
    asteroidPoses.forEach((rock,i) => {
      const distance=cameraZ-rock.z;
      const size=rock.size*ease((distance-3)/4);
      transform.position.set(rock.x,rock.y,rock.z);
      transform.scale.setScalar(size);
      roll.setFromAxisAngle(rollAxis,rock.roll);
      transform.quaternion.copy(camera.quaternion).multiply(roll);
      transform.updateMatrix(); asteroids.setMatrixAt(i,transform.matrix);
    });
    asteroids.instanceMatrix.needsUpdate=true;
    renderer.render(scene, camera);
    stage.dataset.flightPhase = phase < .22 ? 'approach' : phase < .55 ? 'arrival' : phase < .8 || index === products.length - 1 ? 'hold' : 'departure';
    stage.dataset.cameraZ = cameraZ.toFixed(3);
    stage.dataset.planetAsset = `assets/planets/${textures[index]}.png`;
  }
  const onResize = () => { resize(); render(lastCursor); };
  addEventListener('resize', onResize);
  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault(); stage.classList.remove('flight-ready'); disposed = true;
  });
  renderer.domElement.addEventListener('webglcontextrestored', () => {
    disposed = false; stage.classList.add('flight-ready'); render(lastCursor);
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
