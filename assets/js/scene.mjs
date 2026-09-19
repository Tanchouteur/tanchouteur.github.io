import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { cameraDepth } from "../../lib/journey.mjs";

// Architectural space behind the HTML planes. Camera and DOM use the same journey position.
export function mountScene(container, stations = 5) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
  } catch {
    return { update() {}, dispose() {} };
  }
  renderer.setPixelRatio(
    Math.min(
      devicePixelRatio,
      1.25,
      Math.sqrt(1800000 / (innerWidth * innerHeight)),
    ),
  );
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x090807, 0.032);
  renderer.toneMappingExposure = 1.25;
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 180);
  camera.position.z = 54;
  const ivory = new THREE.MeshStandardMaterial({
    color: 0x34302b,
    metalness: 0.65,
    roughness: 0.48,
  });
  const copper = new THREE.MeshStandardMaterial({
    color: 0xb77853,
    metalness: 0.55,
    roughness: 0.3,
  });
  const graphite = new THREE.MeshStandardMaterial({
    color: 0x191715,
    metalness: 0.5,
    roughness: 0.72,
  });
  scene.add(new THREE.AmbientLight(0xe4d8c4, 0.22));
  const key = new THREE.DirectionalLight(0xffdcc0, 0.6);
  key.position.set(5, 8, 10);
  scene.add(key);
  const light = new THREE.PointLight(0xffb766, 85, 32);
  scene.add(light);
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const batches = new Map();
  const transform = new THREE.Object3D();
  function beam(x, y, z, w, h, d, material, angle = 0) {
    transform.position.set(x, y, z);
    transform.scale.set(w, h, d);
    transform.rotation.set(0, 0, angle);
    transform.updateMatrix();
    const part = geometry.clone().applyMatrix4(transform.matrix);
    if (!batches.has(material)) batches.set(material, []);
    batches.get(material).push(part);
  }
  // Layered dark walls, with light confined to recesses and interrupted seams.
  const glowCanvas = document.createElement("canvas");
  glowCanvas.width = glowCanvas.height = 128;
  const ctx = glowCanvas.getContext("2d");
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255,210,132,.85)");
  gradient.addColorStop(0.12, "rgba(238,137,56,.35)");
  gradient.addColorStop(0.45, "rgba(172,65,15,.07)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const glowTexture = new THREE.CanvasTexture(glowCanvas);
  const glowMaterial = new THREE.SpriteMaterial({
    map: glowTexture,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.65,
  });
  const filament = new THREE.MeshStandardMaterial({
    color: 0xe7ab66,
    emissive: 0xff9c3d,
    emissiveIntensity: 3.5,
    metalness: 0.2,
    roughness: 0.4,
  });
  const lightPools = [];
  for (let i = 0; i < stations * 3 + 3; i++) {
    const z = 2 - i * 7;
    for (const [x, y, w, h] of [
      [0, 5.4, 18, 0.7],
      [0, -5.4, 18, 0.8],
      [-8.7, 0, 0.65, 10],
      [8.7, 0, 0.65, 10],
    ])
      beam(x, y, z, w, h, 1.2, ivory);
    beam(-9.3, 0, z, 1, 12, 6.5, graphite);
    beam(9.3, 0, z, 1, 12, 6.5, graphite);
    beam(0, -6, z, 20, 0.5, 6.5, graphite);
    if (i % 3 === 1) {
      const side = i % 2 ? -1 : 1;
      beam(side * 8.3, 0.4, z, 0.04, 3, 0.07, filament);
      beam(side * 6.7, -5.05, z, 2.9, 0.035, 0.06, filament);
      lightPools.push(new THREE.Vector3(side * 7.8, -2, z + 0.6));
      const glow = new THREE.Sprite(glowMaterial);
      glow.position.set(side * 8.1, -0.7, z + 0.8);
      glow.scale.set(7, 10, 1);
      scene.add(glow);
    }
    // Copper joints catch the moving light without outlining the entire room.
    beam(-8.25, 3.8, z, 0.12, 1, 0.14, copper);
    beam(8.25, -3.8, z, 0.12, 1, 0.14, copper);
  }
  // Open forecourt: a low horizon and a lit portal, visible before entering.
  beam(0, -6.4, 34, 180, 0.5, 95, graphite);
  beam(0, 5.5, 3, 19.5, 1.2, 2.6, copper);
  beam(-9.2, 0, 3, 1.2, 12, 2.6, copper);
  beam(9.2, 0, 3, 1.2, 12, 2.6, copper);
  for (const x of [-8.48, 8.48]) {
    beam(x, 0, 4.35, 0.06, 10.2, 0.06, filament);
    beam(x * 0.48, -6.1, 28, 0.035, 0.025, 48, filament);
  }
  beam(0, 4.95, 4.35, 17, 0.06, 0.06, filament);
  const entranceLight = new THREE.PointLight(0xffbb79, 280, 55);
  entranceLight.position.set(0, 2, 9);
  scene.add(entranceLight);
  const entranceGlow = new THREE.Sprite(glowMaterial);
  entranceGlow.position.set(0, 0, 3.8);
  entranceGlow.scale.set(36, 24, 1);
  scene.add(entranceGlow);

  // Soft translucent layers drift across the approach without hiding the portrait.
  const mistCanvas = document.createElement("canvas");
  mistCanvas.width = mistCanvas.height = 128;
  const mistContext = mistCanvas.getContext("2d");
  const mistGradient = mistContext.createRadialGradient(64, 64, 0, 64, 64, 64);
  mistGradient.addColorStop(0, "rgba(168,156,142,.22)");
  mistGradient.addColorStop(0.45, "rgba(121,117,110,.09)");
  mistGradient.addColorStop(1, "rgba(100,96,90,0)");
  mistContext.fillStyle = mistGradient;
  mistContext.fillRect(0, 0, 128, 128);
  const mistTexture = new THREE.CanvasTexture(mistCanvas);
  const mistMaterial = new THREE.SpriteMaterial({
    map: mistTexture,
    depthWrite: false,
    opacity: 0.65,
  });
  const mist = Array.from({ length: 9 }, (_, i) => {
    const sprite = new THREE.Sprite(mistMaterial);
    sprite.position.set(((i % 3) - 1) * 17, -3 + (i % 2) * 2, 10 + i * 4);
    sprite.scale.set(42, 7 + (i % 3), 1);
    scene.add(sprite);
    return sprite;
  });
  const merged = [];
  for (const [material, parts] of batches) {
    const combined = mergeGeometries(parts);
    parts.forEach((part) => part.dispose());
    merged.push(combined);
    const mesh = new THREE.Mesh(combined, material);
    mesh.matrixAutoUpdate = false;
    scene.add(mesh);
  }
  batches.clear();
  // Keep the shader's light count constant throughout the journey.
  const localLights = Array.from({ length: 2 }, () => {
    const pool = new THREE.PointLight(0xff9e42, 125, 23, 2);
    scene.add(pool);
    return pool;
  });
  const diagnostics = new URLSearchParams(location.search).has("perf");
  let measuredFrames = 0,
    renderMilliseconds = 0,
    lastReport = performance.now();
  let dirty = true,
    lastDraw = 0;
  let disposed = false;
  let animation = 0,
    inView = true,
    lastState = { camera: 0, darkness: 0 };

  const resize = () => {
    const r = container.getBoundingClientRect();
    if (!r.width || !r.height) return;
    renderer.setPixelRatio(
      Math.min(
        devicePixelRatio,
        1.25,
        Math.sqrt(1800000 / (r.width * r.height)),
      ),
    );
    renderer.setSize(r.width, r.height);
    dirty = true;
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  container.append(renderer.domElement);
  resize();
  const update = (state, px = 0, py = 0) => {
    if (disposed) return;
    scene.fog.density = 0.017 + 0.015 * Math.min(1, state.camera);
    lastState = state;
    camera.position.set(
      px * 0.025,
      1 - state.camera * 0.15 + py * 0.025,
      cameraDepth(state.camera),
    );
    camera.rotation.set(
      -0.045 - state.darkness * 0.015,
      px * 0.0015,
      Math.sin(state.camera * 0.6) * 0.015,
    );
    light.position.copy(camera.position);
    light.position.z -= 5;
    light.position.x += 3;
    light.position.y += 2;
    const nearest = lightPools
      .map((position) => ({
        position,
        distance: Math.abs(position.z - camera.position.z),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 2);
    nearest.forEach(({ position, distance }, i) => {
      localLights[i].position.copy(position);
      localLights[i].intensity = 125 * Math.max(0, 1 - distance / 35);
    });
    dirty = true;
    resume();
  };
  const draw = (now) => {
    const time = performance.now() * 0.00015;
    mist.forEach((sprite, i) => {
      sprite.position.x = ((i % 3) - 1) * 17 + Math.sin(time + i) * 5;
      sprite.visible = lastState.camera < 1;
    });
    const began = performance.now();
    renderer.render(scene, camera);
    dirty = false;
    lastDraw = now;
    if (diagnostics) {
      measuredFrames++;
      renderMilliseconds += performance.now() - began;
      if (now - lastReport > 1000) {
        container.dataset.renderStats = JSON.stringify({
          calls: renderer.info.render.calls,
          triangles: renderer.info.render.triangles,
          cpuMs: +(renderMilliseconds / measuredFrames).toFixed(2),
          rendersPerSecond: Math.round(
            (measuredFrames * 1000) / (now - lastReport),
          ),
          width: renderer.domElement.width,
          height: renderer.domElement.height,
        });
        measuredFrames = 0;
        renderMilliseconds = 0;
        lastReport = now;
      }
    }
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    observer.disconnect();
    visibilityObserver.disconnect();
    document.removeEventListener("visibilitychange", resume);
    cancelAnimationFrame(animation);
    mistTexture.dispose();
    mistMaterial.dispose();
    merged.forEach((part) => part.dispose());
    geometry.dispose();
    ivory.dispose();
    copper.dispose();
    graphite.dispose();
    filament.dispose();
    glowTexture.dispose();
    glowMaterial.dispose();
    renderer.domElement.remove();
    renderer.dispose();
  };
  renderer.domElement.addEventListener(
    "webglcontextlost",
    (event) => {
      event.preventDefault();
      dispose();
    },
    { once: true },
  );
  const animate = (now) => {
    animation = 0;
    if (disposed || !inView || document.hidden) return;
    // One render per animation frame. Idle mist needs only 30 fps.
    if (dirty || (lastState.camera < 1 && now - lastDraw >= 32)) draw(now);
    if (lastState.camera < 1) resume();
  };
  function resume() {
    if (!animation && !disposed && inView && !document.hidden)
      animation = requestAnimationFrame(animate);
  }
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    resume();
  });
  visibilityObserver.observe(container);
  document.addEventListener("visibilitychange", resume);
  update({ camera: 0, darkness: 0 });
  resume();
  return { update, dispose };
}
