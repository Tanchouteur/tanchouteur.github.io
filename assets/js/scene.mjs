import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { layerLift, pixelRatio, LAYER_COUNT } from "../../lib/hero.mjs";

const BACKGROUND = 0x0b0908;
const AMBER = new THREE.Color(0xffa45c);

// Seeded random so the procedural circuitry is identical on every visit.
function random(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas(size = 1024) {
  const element = document.createElement("canvas");
  element.width = element.height = size;
  return [element, element.getContext("2d")];
}

function texture(element, renderer) {
  const map = new THREE.CanvasTexture(element);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return map;
}

// Substrate: Manhattan-routed copper traces converging toward the socket.
function drawTraces(ctx, size) {
  const rand = random(7);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, size, size);
  ctx.lineCap = ctx.lineJoin = "round";
  const step = size / 48;
  for (let i = 0; i < 150; i++) {
    const side = Math.floor(rand() * 4);
    const along = (0.06 + rand() * 0.88) * size;
    let x = side === 0 ? 0 : side === 1 ? size : along;
    let y = side === 2 ? 0 : side === 3 ? size : along;
    const glow = rand() > 0.82;
    ctx.strokeStyle = glow
      ? "#ffb070"
      : `rgba(196,112,62,${0.35 + rand() * 0.35})`;
    ctx.lineWidth = glow ? 2.4 : 1.2 + rand() * 1.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    const segments = 3 + Math.floor(rand() * 4);
    for (let s = 0; s < segments; s++) {
      const towardX = size / 2 - x,
        towardY = size / 2 - y;
      const length = step * (2 + Math.floor(rand() * 6));
      if (rand() > 0.5) x += Math.sign(towardX) * length;
      else y += Math.sign(towardY) * length;
      if (rand() > 0.6) {
        x += Math.sign(towardX) * step;
        y += Math.sign(towardY) * step;
      }
      ctx.lineTo(x, y);
      if (
        Math.abs(x - size / 2) < size * 0.22 &&
        Math.abs(y - size / 2) < size * 0.22
      )
        break;
    }
    ctx.stroke();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.beginPath();
    ctx.arc(x, y, ctx.lineWidth * 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = "rgba(255,170,100,.55)";
  ctx.lineWidth = 3;
  ctx.strokeRect(size * 0.04, size * 0.04, size * 0.92, size * 0.92);
}

// Interposer: a grid of solder bumps, a few of them lit.
function drawBumps(ctx, size) {
  const rand = random(19);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, size, size);
  const count = 34;
  const pitch = size / count;
  for (let i = 1; i < count; i++)
    for (let j = 1; j < count; j++) {
      const lit = rand() > 0.93;
      ctx.fillStyle = lit ? "#ffc58a" : "rgba(170,110,70,.45)";
      ctx.beginPath();
      ctx.arc(
        i * pitch,
        j * pitch,
        lit ? pitch * 0.2 : pitch * 0.14,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
}

// Die: functional blocks (cores, cache, I/O ring) separated by bright channels.
function drawDie(ctx, size) {
  const rand = random(3);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, size, size);
  const margin = size * 0.08;
  ctx.strokeStyle = "rgba(255,180,110,.9)";
  ctx.lineWidth = 4;
  ctx.strokeRect(margin, margin, size - margin * 2, size - margin * 2);
  const inner = size - margin * 4;
  const cells = 4;
  const cell = inner / cells;
  for (let i = 0; i < cells; i++)
    for (let j = 0; j < cells; j++) {
      const x = margin * 2 + i * cell + 6,
        y = margin * 2 + j * cell + 6;
      const w = cell - 12;
      const core = (i === 1 || i === 2) && (j === 1 || j === 2);
      ctx.fillStyle = core ? "rgba(255,150,80,.32)" : "rgba(120,70,40,.28)";
      ctx.fillRect(x, y, w, w);
      ctx.strokeStyle = core ? "rgba(255,200,140,.95)" : "rgba(220,130,70,.55)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, w);
      const lines = core ? 7 : 4;
      for (let k = 1; k < lines; k++) {
        ctx.globalAlpha = 0.3 + rand() * 0.4;
        ctx.beginPath();
        ctx.moveTo(x + (w / lines) * k, y + 8);
        ctx.lineTo(x + (w / lines) * k, y + w - 8);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  for (let i = 0; i < 64; i++) {
    const t = (i / 64) * (size - margin * 2) + margin;
    ctx.fillStyle = "rgba(255,170,100,.7)";
    ctx.fillRect(t, margin * 0.35, 5, margin * 0.35);
    ctx.fillRect(t, size - margin * 0.7, 5, margin * 0.35);
  }
}

// Lid: brushed metal with a discreet engraving.
function drawLid(ctx, size) {
  const rand = random(11);
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, "#d9a27a");
  gradient.addColorStop(0.5, "#b87a52");
  gradient.addColorStop(1, "#8e5537");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 900; i++) {
    ctx.strokeStyle = `rgba(${rand() > 0.5 ? "255,230,200" : "60,30,15"},${rand() * 0.06})`;
    ctx.lineWidth = 1;
    const y = rand() * size;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y + (rand() - 0.5) * 6);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(60,28,12,.55)";
  ctx.textAlign = "center";
  ctx.font = `600 ${size * 0.16}px Geist Variable, system-ui, sans-serif`;
  ctx.fillText("lt·", size / 2, size * 0.56);
  ctx.font = `500 ${size * 0.03}px Geist Mono Variable, ui-monospace, monospace`;
  ctx.fillText("LOUIS TANCHOU  ·  SOFTWARE / SYSTEMS", size / 2, size * 0.72);
  ctx.fillText("ENSIIE — EDF R&D", size / 2, size * 0.77);
  ctx.strokeStyle = "rgba(60,28,12,.35)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(size * 0.12, size * 0.88, size * 0.025, 0, Math.PI * 2);
  ctx.stroke();
}

function roundedSquare(size, radius) {
  const h = size / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-h + radius, -h);
  shape.lineTo(h - radius, -h);
  shape.quadraticCurveTo(h, -h, h, -h + radius);
  shape.lineTo(h, h - radius);
  shape.quadraticCurveTo(h, h, h - radius, h);
  shape.lineTo(-h + radius, h);
  shape.quadraticCurveTo(-h, h, -h, h - radius);
  shape.lineTo(-h, -h + radius);
  shape.quadraticCurveTo(-h, -h, -h + radius, -h);
  return shape;
}

// A plate lying in the XZ plane, top face at y = thickness, with a planar UV.
function plate(size, thickness, radius) {
  const geometry = new THREE.ExtrudeGeometry(roundedSquare(size, radius), {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: thickness * 0.18,
    bevelSize: Math.min(radius * 0.5, thickness * 0.3),
    bevelSegments: 3,
    curveSegments: 6,
  });
  geometry.rotateX(-Math.PI / 2);
  const position = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  for (let i = 0; i < position.count; i++)
    uv.setXY(i, position.getX(i) / size + 0.5, 0.5 - position.getZ(i) / size);
  return geometry;
}

function outline(size, radius, y) {
  const points = roundedSquare(size, radius)
    .getPoints(10)
    .map((p) => new THREE.Vector3(p.x, y, -p.y));
  return new THREE.BufferGeometry().setFromPoints(points);
}

const terrainVertex = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uRise;
  attribute float aSeed;
  varying float vGlow;
  varying float vFade;
  void main() {
    vec3 p = position;
    float wave = sin(p.x * 0.22 + uTime * 0.35) * 0.45
      + sin(p.z * 0.31 - uTime * 0.5) * 0.35
      + sin((p.x + p.z) * 0.12 + uTime * 0.2) * 0.6;
    float ripple = sin(length(p.xz - vec2(0.0, -6.0)) * 0.55 - uTime * 1.2) * 0.18;
    p.y += wave + ripple + uRise * aSeed * 0.6;
    vGlow = smoothstep(-0.6, 1.4, wave + ripple) * (0.55 + aSeed * 0.45);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vFade = smoothstep(70.0, 8.0, -mv.z) * smoothstep(1.0, 6.0, -mv.z);
    gl_PointSize = uSize * (0.6 + aSeed * 0.8) * (14.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const terrainFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vGlow;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float alpha = smoothstep(0.5, 0.05, d);
    vec3 color = mix(uColor * 0.35, uColor * 1.6, vGlow);
    gl_FragColor = vec4(color, alpha * vFade * (0.25 + vGlow * 0.75) * uOpacity);
  }
`;
const streamVertex = /* glsl */ `
  uniform float uTime;
  uniform float uHeight;
  attribute float aSeed;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    float t = fract(aSeed * 13.1 + uTime * (0.08 + aSeed * 0.1));
    p.y += t * uHeight;
    vAlpha = sin(t * 3.14159);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = (2.0 + aSeed * 3.0) * (10.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const streamFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    gl_FragColor = vec4(uColor * 2.0, smoothstep(0.5, 0.0, d) * vAlpha * uOpacity);
  }
`;

// Exploded processor above a living field of light. The controller passes a
// scroll state; the scene returns where each layer sits on screen so HTML
// labels can be attached to it.
export function mountScene(container, { compact = false } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
    });
  } catch {
    return {
      frame() {
        return [];
      },
      resize() {},
      dispose() {},
    };
  }
  renderer.setClearColor(BACKGROUND, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.className = "scene-canvas";
  container.append(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BACKGROUND);
  scene.fog = new THREE.Fog(BACKGROUND, 14, 46);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04).texture;
  scene.environment = environment;
  scene.environmentIntensity = 0.55;
  room.dispose?.();

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 120);
  const disposables = [environment, pmrem];
  const keep = (item) => (disposables.push(item), item);

  scene.add(new THREE.HemisphereLight(0xffd7b0, 0x120a06, 0.35));
  const key = new THREE.DirectionalLight(0xffd2a8, 2.2);
  key.position.set(-4, 8, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x8fb4ff, 1.1);
  rim.position.set(6, 2, -6);
  scene.add(rim);
  const under = new THREE.PointLight(0xff8a3d, 18, 14, 1.6);
  under.position.set(0, -1.2, 0);
  scene.add(under);

  // Processor ----------------------------------------------------------------
  const chip = new THREE.Group();
  scene.add(chip);
  const specs = [
    {
      size: 3.4,
      thick: 0.14,
      radius: 0.16,
      draw: drawTraces,
      color: 0x1a1512,
      metal: 0.35,
      rough: 0.55,
      glow: 1.25,
    },
    {
      size: 2.6,
      thick: 0.08,
      radius: 0.12,
      draw: drawBumps,
      color: 0x221b16,
      metal: 0.55,
      rough: 0.4,
      glow: 1.0,
    },
    {
      size: 1.65,
      thick: 0.1,
      radius: 0.06,
      draw: drawDie,
      color: 0x0d0b0a,
      metal: 0.8,
      rough: 0.22,
      glow: 1.6,
    },
    {
      size: 2.85,
      thick: 0.2,
      radius: 0.22,
      draw: drawLid,
      color: 0xffffff,
      metal: 1,
      rough: 0.3,
      glow: 0,
    },
  ];
  const layers = specs.map((spec, index) => {
    const [element, ctx] = canvas(index === 3 ? 1024 : 1024);
    spec.draw(ctx, element.width);
    const map = keep(texture(element, renderer));
    const material = keep(
      new THREE.MeshStandardMaterial({
        color: spec.color,
        map,
        metalness: spec.metal,
        roughness: spec.rough,
        emissive: spec.glow ? 0xffffff : 0x000000,
        emissiveMap: spec.glow ? map : null,
        emissiveIntensity: spec.glow,
      }),
    );
    const sideMaterial = keep(
      new THREE.MeshStandardMaterial({
        color: index === 3 ? 0xb87a52 : 0x2a211b,
        metalness: index === 3 ? 1 : 0.6,
        roughness: 0.35,
      }),
    );
    const geometry = keep(plate(spec.size, spec.thick, spec.radius));
    const mesh = new THREE.Mesh(geometry, [material, sideMaterial]);
    // Extrude groups: 0 = caps, 1 = sides. The bottom cap reuses the top map,
    // invisible from the usual viewpoints.
    const group = new THREE.Group();
    group.add(mesh);
    const lineMaterial = keep(
      new THREE.LineBasicMaterial({
        color: AMBER,
        transparent: true,
        opacity: 0,
        toneMapped: false,
        depthWrite: false,
      }),
    );
    const edge = new THREE.LineLoop(
      keep(outline(spec.size + 0.06, spec.radius + 0.03, spec.thick + 0.02)),
      lineMaterial,
    );
    group.add(edge);
    chip.add(group);
    const half = spec.size / 2;
    return {
      group,
      lineMaterial,
      corners: [
        new THREE.Vector3(half, spec.thick, half),
        new THREE.Vector3(half, spec.thick, -half),
        new THREE.Vector3(-half, spec.thick, half),
        new THREE.Vector3(-half, spec.thick, -half),
      ],
    };
  });

  // Pins under the substrate.
  const pinGeometry = keep(new THREE.CylinderGeometry(0.035, 0.035, 0.16, 8));
  pinGeometry.translate(0, -0.08, 0);
  const pinMaterial = keep(
    new THREE.MeshStandardMaterial({
      color: 0xe0b07a,
      metalness: 1,
      roughness: 0.28,
    }),
  );
  const grid = 13;
  const pins = new THREE.InstancedMesh(pinGeometry, pinMaterial, grid * grid);
  const matrix = new THREE.Matrix4();
  for (let i = 0; i < grid; i++)
    for (let j = 0; j < grid; j++)
      pins.setMatrixAt(
        i * grid + j,
        matrix.makeTranslation(
          (i - (grid - 1) / 2) * 0.24,
          0,
          (j - (grid - 1) / 2) * 0.24,
        ),
      );
  layers[0].group.add(pins);

  // Light rising through the open stack.
  const streamCount = compact ? 120 : 260;
  const streamGeometry = keep(new THREE.BufferGeometry());
  const streamPositions = new Float32Array(streamCount * 3);
  const streamSeeds = new Float32Array(streamCount);
  const rand = random(42);
  for (let i = 0; i < streamCount; i++) {
    const angle = rand() * Math.PI * 2;
    const radius = Math.sqrt(rand()) * 0.75;
    streamPositions.set(
      [Math.cos(angle) * radius, 0.1, Math.sin(angle) * radius],
      i * 3,
    );
    streamSeeds[i] = rand();
  }
  streamGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(streamPositions, 3),
  );
  streamGeometry.setAttribute(
    "aSeed",
    new THREE.BufferAttribute(streamSeeds, 1),
  );
  const streamMaterial = keep(
    new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uHeight: { value: 3.6 },
        uColor: { value: new THREE.Color(0xffb27a) },
        uOpacity: { value: 0 },
      },
      vertexShader: streamVertex,
      fragmentShader: streamFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  const stream = new THREE.Points(streamGeometry, streamMaterial);
  chip.add(stream);

  // Halo behind the processor.
  const [haloCanvas, haloCtx] = canvas(256);
  const haloGradient = haloCtx.createRadialGradient(128, 128, 0, 128, 128, 128);
  haloGradient.addColorStop(0, "rgba(255,150,80,.5)");
  haloGradient.addColorStop(0.35, "rgba(200,90,40,.16)");
  haloGradient.addColorStop(1, "rgba(0,0,0,0)");
  haloCtx.fillStyle = haloGradient;
  haloCtx.fillRect(0, 0, 256, 256);
  const halo = new THREE.Sprite(
    keep(
      new THREE.SpriteMaterial({
        map: keep(new THREE.CanvasTexture(haloCanvas)),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0.6,
      }),
    ),
  );
  halo.scale.set(13, 13, 1);
  halo.position.set(0, 0.6, -3);
  chip.add(halo);

  // Field of light ------------------------------------------------------------
  const columns = compact ? 110 : 200;
  const rows = compact ? 70 : 120;
  const fieldGeometry = keep(new THREE.BufferGeometry());
  const fieldPositions = new Float32Array(columns * rows * 3);
  const fieldSeeds = new Float32Array(columns * rows);
  for (let i = 0; i < columns; i++)
    for (let j = 0; j < rows; j++) {
      const index = i * rows + j;
      fieldPositions.set(
        [
          (i / (columns - 1) - 0.5) * 90 + (rand() - 0.5) * 0.2,
          0,
          12 - (j / (rows - 1)) * 70,
        ],
        index * 3,
      );
      fieldSeeds[index] = rand();
    }
  fieldGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(fieldPositions, 3),
  );
  fieldGeometry.setAttribute("aSeed", new THREE.BufferAttribute(fieldSeeds, 1));
  const fieldMaterial = keep(
    new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: compact ? 3 : 3.6 },
        uRise: { value: 0 },
        uOpacity: { value: 1 },
        uColor: { value: new THREE.Color(0xe0844a) },
      },
      vertexShader: terrainVertex,
      fragmentShader: terrainFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  const field = new THREE.Points(fieldGeometry, fieldMaterial);
  field.position.y = -3.4;
  field.frustumCulled = false;
  scene.add(field);

  // Post-processing -----------------------------------------------------------
  const target = new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType,
    samples: compact ? 0 : 4,
  });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.55, 0.65, 0.72);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  let width = 1,
    height = 1;
  const resize = () => {
    width = container.clientWidth || innerWidth;
    height = container.clientHeight || innerHeight;
    const ratio = pixelRatio(width, height, devicePixelRatio);
    renderer.setPixelRatio(ratio);
    renderer.setSize(width, height, false);
    composer.setPixelRatio(ratio);
    composer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  resize();

  const projected = new THREE.Vector3();
  const anchors = Array.from({ length: LAYER_COUNT }, () => ({ x: 0, y: 0 }));
  const look = new THREE.Vector3();

  // state: { explode, intro, labels, exit, progress }, pointer in [-1, 1].
  function frame(state, pointer, time) {
    const narrow = width < 900;
    const portrait = width / height < 0.9;
    const explode = state.explode;
    const idle = 1 - explode;
    // Assembled on the right of the identity block, centred once exploded.
    const restX = narrow ? 0 : 2.35;
    const openX = narrow ? 0 : 0.15;
    const restY = portrait ? 1.75 : 0.45;
    const openY = portrait ? 0.55 : 0.2;
    chip.position.set(
      restX + (openX - restX) * explode,
      restY +
        (openY - restY) * explode +
        Math.sin(time * 0.7) * 0.06 * idle -
        state.exit * 1.4,
      0,
    );
    const scale =
      (portrait ? 0.68 : narrow ? 0.85 : 1) *
      (1 - explode * (portrait ? 0.32 : 0.24));
    chip.scale.setScalar(scale);
    chip.rotation.set(
      0.5 + explode * 0.06 - pointer.y * 0.12,
      -0.65 + time * 0.12 * idle + explode * 0.18 + pointer.x * 0.22,
      0.04 * idle,
    );
    // Keep the stack centred on the chip origin while it opens.
    const centre = (layerLift(LAYER_COUNT - 1, explode) + 0.2) / 2;
    layers.forEach((layer, index) => {
      layer.group.position.y =
        layerLift(index, explode, Math.sin(time * 0.9) * idle) - centre;
      layer.lineMaterial.opacity = 0.12 + explode * 0.75;
    });
    stream.position.y = -centre;
    halo.position.y = 0.4 - centre;
    streamMaterial.uniforms.uOpacity.value = explode * 0.9;
    streamMaterial.uniforms.uHeight.value = 0.4 + explode * 3.4;
    streamMaterial.uniforms.uTime.value = time;
    fieldMaterial.uniforms.uTime.value = time;
    fieldMaterial.uniforms.uRise.value = explode;
    fieldMaterial.uniforms.uOpacity.value = 1 - state.exit * 0.6;
    under.intensity = 10 + explode * 22;
    bloom.strength = 0.45 + explode * 0.35;

    // Camera drifts closer and lower as the stack opens, then glides over the field.
    camera.position.set(
      pointer.x * 0.35,
      1.6 + explode * 0.9 - state.exit * 2.2 - pointer.y * 0.2,
      (portrait ? 17.5 : 13) - explode * 0.8,
    );
    look.set(0, 0.25 + explode * 0.4 - state.exit * 2.6, 0);
    camera.lookAt(look);

    composer.render();

    chip.updateMatrixWorld(true);
    layers.forEach((layer, index) => {
      let best = -Infinity;
      let screenY = 0;
      for (const corner of layer.corners) {
        projected
          .copy(corner)
          .applyMatrix4(layer.group.matrixWorld)
          .project(camera);
        const x = (projected.x * 0.5 + 0.5) * width;
        if (x > best) {
          best = x;
          screenY = (-projected.y * 0.5 + 0.5) * height;
        }
      }
      anchors[index].x = best;
      anchors[index].y = screenY;
    });
    return anchors;
  }

  let disposed = false;
  return {
    frame,
    resize,
    dispose() {
      if (disposed) return;
      disposed = true;
      composer.dispose?.();
      target.dispose();
      bloom.dispose?.();
      disposables.forEach((item) => item.dispose?.());
      renderer.dispose();
      renderer.forceContextLoss?.();
      renderer.domElement.remove();
    },
  };
}
