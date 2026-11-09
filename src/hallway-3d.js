// WEDDO Sovereign Architectural 3D Interactive Hallway Experience
// WebGL first-person grand foyer where users walk freely with WASD or use GSAP cinematic travel

import { loadThree } from './venue-3d.js';
import { sound } from './sound.js';

let gsapPromise = null;
function loadGSAP() {
  if (window.gsap) return Promise.resolve(window.gsap);
  if (!gsapPromise) {
    gsapPromise = new Promise(resolve => {
      const script = document.createElement('script');
      script.src = '/public/vendor/gsap.min.js';
      script.onload = () => resolve(window.gsap);
      script.onerror = () => resolve(null);
      document.head.appendChild(script);
    });
  }
  return gsapPromise;
}

let gltfLoaderPromise = null;
function loadGLTFLoader() {
  if (!gltfLoaderPromise) {
    gltfLoaderPromise = import('/public/vendor/three165/GLTFLoader.js')
      .then(mod => mod.GLTFLoader)
      .catch(err => {
        console.warn('GLTFLoader unavailable:', err);
        return null;
      });
  }
  return gltfLoaderPromise;
}

export function mountHallway3D(host, { lang = 'en', onSelectHallway = () => {} } = {}) {
  const isAr = lang === 'ar';
  const viewport = host.querySelector('.hallway-3d-canvas');
  const status = host.querySelector('.hallway-3d-status');
  if (!viewport) return () => {};

  let cancelled = false;
  let animId = null;
  const disposers = [];

  Promise.all([loadThree(), loadGSAP(), loadGLTFLoader()]).then(([THREE, gsap, GLTFLoader]) => {
    if (cancelled) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
    } catch {
      if (status) status.textContent = isAr ? 'عرض 3D غير متاح على هذا المتصفح.' : '3D interactive walkthrough is unavailable on this device.';
      return;
    }

    const isDark = () => document.documentElement.classList.contains('dark') || document.documentElement.getAttribute('data-theme') === 'dark';
    const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(viewport.clientWidth, viewport.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.82;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
    viewport.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const aspect = viewport.clientWidth / viewport.clientHeight;
    const camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);

    // Initial first-person vantage in grand foyer
    const START_POS = { x: 0, y: 1.7, z: 7.2 };
    const playerPos = new THREE.Vector3(START_POS.x, START_POS.y, START_POS.z);
    const velocity = new THREE.Vector3(0, 0, 0);

    let cameraYaw = 0;   // radians around Y (0 = facing -Z)
    let cameraPitch = 0; // radians vertical (-0.45 to 0.45)

    camera.position.copy(playerPos);

    // Theme color management - Dim, moody, museum-grade atmospheric depth
    const getBgColor = () => isDark() ? 0x0c0b0a : 0x161513;
    scene.background = new THREE.Color(getBgColor());
    scene.fog = new THREE.FogExp2(getBgColor(), 0.009);

    // Track resources for clean disposal
    const resources = new Set();
    const track = item => { if (item) resources.add(item); return item; };

    // --- Dim, Realistic Architectural Lighting Rig ---
    // 1. Soft ambient fill for rich shadow contrast and depth
    const ambientLight = new THREE.HemisphereLight(
      0xffeedd,
      0x141210,
      isDark() ? 0.35 : 0.45
    );
    scene.add(ambientLight);

    // 2. Interior Key Directional Light (positioned under the ceiling with soft PCF contact shadows)
    const interiorKeyLight = new THREE.DirectionalLight(0xffecd0, isDark() ? 0.65 : 0.75);
    interiorKeyLight.position.set(0, 4.3, 3.8);
    interiorKeyLight.target.position.set(0, 0.5, -4.5);
    interiorKeyLight.castShadow = true;
    interiorKeyLight.shadow.mapSize.width = 2048;
    interiorKeyLight.shadow.mapSize.height = 2048;
    interiorKeyLight.shadow.camera.near = 0.5;
    interiorKeyLight.shadow.camera.far = 30;
    interiorKeyLight.shadow.camera.left = -12;
    interiorKeyLight.shadow.camera.right = 12;
    interiorKeyLight.shadow.camera.top = 10;
    interiorKeyLight.shadow.camera.bottom = -6;
    interiorKeyLight.shadow.bias = -0.0003;
    interiorKeyLight.shadow.radius = 2.8;
    scene.add(interiorKeyLight);
    scene.add(interiorKeyLight.target);

    // 3. Central Foyer Chandelier warm focal pool
    const foyerChandelierLight = new THREE.PointLight(0xffdca8, 1.25, 14, 2.0);
    foyerChandelierLight.position.set(0, 3.4, -2.5);
    scene.add(foyerChandelierLight);

    // 4. Left Amber Corridor Accent Light
    const leftAmberLight = new THREE.PointLight(0xf59e0b, 1.3, 14, 2.0);
    leftAmberLight.position.set(-5.5, 3.0, -7.5);
    scene.add(leftAmberLight);

    // 5. Right Azure Corridor Accent Light
    const rightAzureLight = new THREE.PointLight(0x38bdf8, 1.2, 14, 2.0);
    rightAzureLight.position.set(5.5, 3.0, -7.5);
    scene.add(rightAzureLight);

    // 6. Left Door Portal Luminous Gate
    const leftDoorLight = new THREE.PointLight(0xfbbf24, 1.4, 10, 2.0);
    leftDoorLight.position.set(-5.5, 2.6, -16.0);
    scene.add(leftDoorLight);

    // 7. Right Door Portal Luminous Gate
    const rightDoorLight = new THREE.PointLight(0x38bdf8, 1.4, 10, 2.0);
    rightDoorLight.position.set(5.5, 2.6, -16.0);
    scene.add(rightDoorLight);

    // --- Procedural High-Fidelity Textures ---

    // 1. Carrara / Nero Marquina Marble Floor (1024x1024)
    function makeMarbleTexture(dark) {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');

      const baseCol = dark ? '#151412' : '#f2efe8';
      const tileA = dark ? '#1b1a17' : '#faf8f4';
      const tileB = dark ? '#171614' : '#ebe7df';
      const lineCol = dark ? '#0f0e0c' : '#c8c3b7';
      const veinCol1 = dark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(40, 35, 30, 0.04)';
      const veinCol2 = dark ? 'rgba(212, 175, 55, 0.07)' : 'rgba(168, 138, 70, 0.06)';

      ctx.fillStyle = baseCol;
      ctx.fillRect(0, 0, 1024, 1024);

      const tileSize = 256;
      for (let x = 0; x < 1024; x += tileSize) {
        for (let y = 0; y < 1024; y += tileSize) {
          const isEven = ((x / tileSize) + (y / tileSize)) % 2 === 0;
          ctx.fillStyle = isEven ? tileA : tileB;
          ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);

          // Subtle organic veins
          ctx.strokeStyle = veinCol1;
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          ctx.moveTo(x + 16, y + 40);
          ctx.bezierCurveTo(x + 80, y + 110, x + 160, y + 80, x + 240, y + 200);
          ctx.stroke();

          ctx.strokeStyle = veinCol2;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(x + 50, y + 230);
          ctx.bezierCurveTo(x + 130, y + 180, x + 190, y + 210, x + 236, y + 70);
          ctx.stroke();
        }
      }

      ctx.strokeStyle = lineCol;
      ctx.lineWidth = 3;
      for (let x = 0; x <= 1024; x += tileSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 1024);
        ctx.stroke();
      }
      for (let y = 0; y <= 1024; y += tileSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1024, y);
        ctx.stroke();
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(6, 9);
      if (renderer.capabilities?.getMaxAnisotropy) {
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      }
      return track(tex);
    }

    // 2. French Ashlar Travertine Wall Texture (512x512)
    function makeTravertineTexture(dark) {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      const bg = dark ? '#23211e' : '#e8e5dc';
      const blockAlt = dark ? '#272521' : '#eeece5';
      const jointCol = dark ? '#181614' : '#cdc8bd';

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 512, 512);

      const rowH = 128;
      const blockW = 256;
      for (let y = 0; y < 512; y += rowH) {
        const offset = (y / rowH) % 2 === 0 ? 0 : 128;
        for (let x = -offset; x < 512; x += blockW) {
          ctx.fillStyle = blockAlt;
          ctx.fillRect(x + 2, y + 2, blockW - 4, rowH - 4);

          // Subtle travertine pore flecks
          ctx.fillStyle = dark ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.03)';
          for (let i = 0; i < 28; i++) {
            const px = x + Math.random() * blockW;
            const py = y + Math.random() * rowH;
            ctx.fillRect(px, py, 2 + Math.random() * 6, 1.5);
          }
        }
      }

      ctx.strokeStyle = jointCol;
      ctx.lineWidth = 2.5;
      for (let y = 0; y <= 512; y += rowH) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(512, y);
        ctx.stroke();
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(3, 3);
      return track(tex);
    }

    // 3. Woven Damask Carpet Runner with Embroidered Border (512x1024)
    function makeCarpetTexture(kind) {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');

      const isWedding = kind === 'wedding';
      const fieldCol = isWedding ? '#831843' : '#0c2548';
      const borderCol = isWedding ? '#b89047' : '#94a3b8';
      const innerCol = isWedding ? '#6b1136' : '#081b36';

      ctx.fillStyle = fieldCol;
      ctx.fillRect(0, 0, 512, 1024);

      // Gold / Platinum embroidered margins (left & right)
      ctx.fillStyle = borderCol;
      ctx.fillRect(20, 0, 16, 1024);
      ctx.fillRect(512 - 36, 0, 16, 1024);

      ctx.fillStyle = innerCol;
      ctx.fillRect(44, 0, 424, 1024);

      // Greek-key geometric accents along borders
      ctx.strokeStyle = borderCol;
      ctx.lineWidth = 3;
      for (let y = 16; y < 1024; y += 48) {
        ctx.strokeRect(52, y, 18, 28);
        ctx.strokeRect(512 - 70, y, 18, 28);
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(1, 8);
      return track(tex);
    }

    // 4. Polished Architectural Wood Grain Door Texture (512x1024)
    function makeDoorTexture(kind) {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');

      const isWedding = kind === 'wedding';
      const baseWood = isWedding ? '#3f1f14' : '#1c1917';
      const railCol = isWedding ? '#4d2719' : '#272320';
      const panelCol = isWedding ? '#33180f' : '#141210';
      const goldTrim = isWedding ? '#b89047' : '#64748b';

      ctx.fillStyle = baseWood;
      ctx.fillRect(0, 0, 512, 1024);

      // Door Stiles and Rails
      ctx.fillStyle = railCol;
      ctx.fillRect(16, 16, 480, 992);

      // 6 Recessed Panels (3 rows of 2 panels)
      const pW = 210;
      const pH = 280;
      const xPositions = [36, 266];
      const yPositions = [36, 356, 676];

      for (const y of yPositions) {
        for (const x of xPositions) {
          ctx.fillStyle = panelCol;
          ctx.fillRect(x, y, pW, pH);

          // Beveled Raised Panel shading
          ctx.strokeStyle = goldTrim;
          ctx.lineWidth = 3;
          ctx.strokeRect(x + 12, y + 12, pW - 24, pH - 24);

          ctx.fillStyle = isWedding ? '#4a2416' : '#221f1c';
          ctx.fillRect(x + 20, y + 20, pW - 40, pH - 40);
        }
      }

      // Polished Brass Kickplate along bottom
      ctx.fillStyle = goldTrim;
      ctx.fillRect(16, 960, 480, 48);

      const tex = new THREE.CanvasTexture(canvas);
      return track(tex);
    }

    // 5. Fluted Column Bump Map (256x256)
    function makeFlutedBumpTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      for (let x = 0; x < 256; x++) {
        const val = Math.floor((Math.sin((x / 256) * Math.PI * 32) * 0.5 + 0.5) * 255);
        ctx.fillStyle = `rgb(${val},${val},${val})`;
        ctx.fillRect(x, 0, 1, 256);
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(1, 4);
      return track(tex);
    }

    // 6. Architectural Signboard Texture
    function makeSignTexture(titleEn, titleAr, subEn, subAr, accentColor, numBadge) {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      const dark = isDark();

      ctx.fillStyle = dark ? '#181715' : '#f5f4f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 8;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

      ctx.lineWidth = 2;
      ctx.strokeStyle = dark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)';
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

      ctx.fillStyle = accentColor;
      const notch = 12;
      ctx.fillRect(16, 16, notch, notch);
      ctx.fillRect(canvas.width - 16 - notch, 16, notch, notch);
      ctx.fillRect(16, canvas.height - 16 - notch, notch, notch);
      ctx.fillRect(canvas.width - 16 - notch, canvas.height - 16 - notch, notch, notch);

      ctx.fillStyle = accentColor;
      ctx.font = 'bold 22px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(numBadge, canvas.width / 2, 54);

      ctx.font = 'bold 36px serif';
      ctx.fillStyle = dark ? '#f5f5f3' : '#121210';
      ctx.fillText(isAr ? titleAr : titleEn, canvas.width / 2, 114);

      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 - 140, 142);
      ctx.lineTo(canvas.width / 2 + 140, 142);
      ctx.stroke();

      ctx.fillStyle = dark ? '#a8a69e' : '#595855';
      ctx.font = '23px sans-serif';
      ctx.fillText(isAr ? subAr : subEn, canvas.width / 2, 194);

      const tex = new THREE.CanvasTexture(canvas);
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      return track(tex);
    }

    // --- Real-Life PBR Textures (PolyHaven 1K Architectural Collection) ---
    const texLoader = new THREE.TextureLoader();
    const loadPBRTexture = (path, repeatX, repeatY, isColor = false) => {
      const tex = texLoader.load(path);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(repeatX, repeatY);
      if (isColor && THREE.SRGBColorSpace) {
        tex.colorSpace = THREE.SRGBColorSpace;
      }
      if (renderer.capabilities?.getMaxAnisotropy) {
        tex.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
      }
      return track(tex);
    };

    // Load High-Resolution Real-Life PBR Textures
    const marbleDiff = loadPBRTexture('/public/images/marble_diff_1k.jpg', 6, 8, true);
    const marbleRough = loadPBRTexture('/public/images/marble_rough_1k.jpg', 6, 8, false);
    const marbleNor = loadPBRTexture('/public/images/marble_nor_1k.jpg', 6, 8, false);

    const wallDiff = loadPBRTexture('/public/images/wall_diff_1k.jpg', 4, 3, true);
    const wallRough = loadPBRTexture('/public/images/wall_rough_1k.jpg', 4, 3, false);

    const woodDiff = loadPBRTexture('/public/images/wood_diff_1k.jpg', 1, 2, true);
    const woodRough = loadPBRTexture('/public/images/wood_rough_1k.jpg', 1, 2, false);

    const fabricDiff = loadPBRTexture('/public/images/fabric_diff_1k.jpg', 2, 8, true);
    const fabricRough = loadPBRTexture('/public/images/fabric_rough_1k.jpg', 2, 8, false);

    // Procedural fluted column bump fallback
    let flutedBump = makeFlutedBumpTexture();

    const getMaterials = () => {
      const dark = isDark();
      return {
        floor: track(new THREE.MeshStandardMaterial({
          map: marbleDiff,
          roughnessMap: marbleRough,
          normalMap: marbleNor,
          normalScale: new THREE.Vector2(0.35, 0.35),
          roughness: 0.25,
          metalness: 0.12
        })),
        wall: track(new THREE.MeshStandardMaterial({
          map: wallDiff,
          roughnessMap: wallRough,
          roughness: 0.76,
          metalness: 0.04
        })),
        pillar: track(new THREE.MeshStandardMaterial({
          map: wallDiff,
          roughnessMap: wallRough,
          roughness: 0.45,
          metalness: 0.08
        })),
        flutedPillar: track(new THREE.MeshStandardMaterial({
          map: wallDiff,
          roughnessMap: wallRough,
          bumpMap: flutedBump,
          bumpScale: 0.04,
          roughness: 0.42,
          metalness: 0.08
        })),
        goldMolding: track(new THREE.MeshStandardMaterial({
          color: 0xc89d4d,
          roughness: 0.22,
          metalness: 0.88
        })),
        bronzeMolding: track(new THREE.MeshStandardMaterial({
          color: 0x7a5832,
          roughness: 0.28,
          metalness: 0.82
        })),
        doorMahogany: track(new THREE.MeshStandardMaterial({
          map: woodDiff,
          roughnessMap: woodRough,
          color: 0x823b2c,
          roughness: 0.38,
          metalness: 0.12
        })),
        doorWalnut: track(new THREE.MeshStandardMaterial({
          map: woodDiff,
          roughnessMap: woodRough,
          color: 0x362d26,
          roughness: 0.38,
          metalness: 0.12
        })),
        carpetCelebration: track(new THREE.MeshStandardMaterial({
          map: fabricDiff,
          roughnessMap: fabricRough,
          color: 0x881337,
          roughness: 0.92
        })),
        carpetConference: track(new THREE.MeshStandardMaterial({
          map: fabricDiff,
          roughnessMap: fabricRough,
          color: 0x0f2b48,
          roughness: 0.92
        })),
        ceiling: track(new THREE.MeshStandardMaterial({
          color: dark ? 0x181715 : 0xd6d3cb,
          roughness: 0.85
        })),
        ceilingRecess: track(new THREE.MeshStandardMaterial({
          color: dark ? 0x141311 : 0xedeae3,
          roughness: 0.9
        })),
        crystal: track(new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.05,
          metalness: 0.1,
          emissive: 0xffedd5,
          emissiveIntensity: 0.35,
          transparent: true,
          opacity: 0.88
        })),
        candleWax: track(new THREE.MeshStandardMaterial({
          color: 0xfffcf0,
          roughness: 0.5
        })),
        candleFlame: track(new THREE.MeshBasicMaterial({
          color: 0xffb84d
        })),
        palmLeaf: track(new THREE.MeshStandardMaterial({
          color: 0x22482e,
          roughness: 0.55,
          side: THREE.DoubleSide
        }))
      };
    };

    let mats = getMaterials();

    // --- Shared Geometries (Instantiated once for peak performance) ---
    const geos = {
      floor: track(new THREE.PlaneGeometry(38, 52)),
      colPlinth: track(new THREE.BoxGeometry(0.88, 0.16, 0.88)),
      colTorusL: track(new THREE.CylinderGeometry(0.44, 0.48, 0.09, 32)),
      colScotia: track(new THREE.CylinderGeometry(0.38, 0.43, 0.08, 32)),
      colTorusU: track(new THREE.CylinderGeometry(0.41, 0.38, 0.08, 32)),
      colShaft: track(new THREE.CylinderGeometry(0.32, 0.36, 3.4, 32)),
      colNeck: track(new THREE.CylinderGeometry(0.36, 0.36, 0.06, 32)),
      colEchinus: track(new THREE.CylinderGeometry(0.44, 0.36, 0.12, 32)),
      colVolute: track(new THREE.TorusGeometry(0.14, 0.045, 12, 24)),
      colAbacus: track(new THREE.BoxGeometry(0.84, 0.12, 0.84)),
      chandRod: track(new THREE.CylinderGeometry(0.015, 0.015, 0.9, 12)),
      chandCanopy: track(new THREE.CylinderGeometry(0.2, 0.08, 0.08, 16)),
      chandRing1: track(new THREE.TorusGeometry(0.34, 0.035, 12, 24)),
      chandRing2: track(new THREE.TorusGeometry(0.72, 0.045, 12, 32)),
      chandDrop: track(new THREE.OctahedronGeometry(0.07, 0)),
      chandCandle: track(new THREE.CylinderGeometry(0.02, 0.02, 0.14, 12)),
      chandFlame: track(new THREE.SphereGeometry(0.03, 8, 8)),
      architraveBeam: track(new THREE.BoxGeometry(4.6, 0.36, 0.7)),
      wallSconcePlate: track(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 16)),
      dias1: track(new THREE.CylinderGeometry(1.85, 1.95, 0.14, 40)),
      dias2: track(new THREE.CylinderGeometry(1.35, 1.45, 0.14, 36)),
      monumentCol: track(new THREE.CylinderGeometry(0.52, 0.56, 1.15, 28)),
      monumentCap: track(new THREE.CylinderGeometry(0.74, 0.64, 0.22, 28)),
      doorSurroundJamb: track(new THREE.BoxGeometry(0.4, 3.8, 0.4)),
      doorSurroundLintel: track(new THREE.BoxGeometry(3.2, 0.45, 0.5)),
      doorPediment: track(new THREE.CylinderGeometry(0, 1.6, 0.5, 3)),
      doorLeaf: track(new THREE.PlaneGeometry(1.2, 3.3)),
      doorHandle: track(new THREE.CylinderGeometry(0.022, 0.022, 0.55, 12)),
      portalEndWallL: track(new THREE.BoxGeometry(0.65, 4.4, 0.35)),
      portalEndWallR: track(new THREE.BoxGeometry(0.65, 4.4, 0.35)),
      portalEndWallTop: track(new THREE.BoxGeometry(4.0, 0.45, 0.35)),
      portalBackPanel: track(new THREE.BoxGeometry(4.0, 4.4, 0.2)),
      benchSeat: track(new THREE.BoxGeometry(0.85, 0.45, 1.8)),
      benchLeg: track(new THREE.CylinderGeometry(0.04, 0.03, 0.45, 12)),
      stanchionPost: track(new THREE.CylinderGeometry(0.025, 0.03, 0.95, 16)),
      stanchionBase: track(new THREE.CylinderGeometry(0.18, 0.22, 0.06, 24)),
      stanchionCap: track(new THREE.SphereGeometry(0.055, 16, 16)),
      pedestalPlinth: track(new THREE.BoxGeometry(0.6, 0.8, 0.6)),
      pedestalCap: track(new THREE.BoxGeometry(0.68, 0.1, 0.68)),
      carpetGeo: track(new THREE.PlaneGeometry(2.4, 18)),
      wallGeo: track(new THREE.BoxGeometry(0.3, 4.4, 18)),
      ceilingSlab: track(new THREE.PlaneGeometry(38, 52)),
      beamX: track(new THREE.BoxGeometry(38, 0.25, 0.4)),
      beamZ: track(new THREE.BoxGeometry(0.4, 0.25, 52)),
      cofferRosette: track(new THREE.TorusGeometry(0.25, 0.04, 12, 24))
    };

    // 1. Grand Foyer Floor
    const floor = new THREE.Mesh(geos.floor, mats.floor);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -5);
    floor.receiveShadow = true;
    scene.add(floor);

    // 2. Vaulted Coffered Ceiling with Molded Cross-Beams
    const ceilingGroup = new THREE.Group();
    ceilingGroup.position.set(0, 4.5, -5);

    const ceilingSlabMesh = new THREE.Mesh(geos.ceilingSlab, mats.ceilingRecess);
    ceilingSlabMesh.rotation.x = Math.PI / 2;
    ceilingSlabMesh.position.y = 0.2;
    ceilingGroup.add(ceilingSlabMesh);

    // Longitudinal Beams (Z-axis)
    [-9, -4.5, 0, 4.5, 9].forEach(x => {
      const bZ = new THREE.Mesh(geos.beamZ, mats.pillar);
      bZ.position.set(x, 0, 0);
      ceilingGroup.add(bZ);
    });

    // Transverse Beams (X-axis)
    [-20, -14, -8, -2, 4, 10, 16].forEach(z => {
      const bX = new THREE.Mesh(geos.beamX, mats.pillar);
      bX.position.set(0, 0, z);
      ceilingGroup.add(bX);
    });

    // Central Rosettes inside Coffer Bays
    [-6.75, -2.25, 2.25, 6.75].forEach(x => {
      [-17, -11, -5, 1, 7].forEach(z => {
        const ros = new THREE.Mesh(geos.cofferRosette, mats.goldMolding);
        ros.rotation.x = Math.PI / 2;
        ros.position.set(x, 0.16, z);
        ceilingGroup.add(ros);
      });
    });

    scene.add(ceilingGroup);

    // 3. Classical Column Builder
    const createClassicalColumn = (x, z) => {
      const g = new THREE.Group();
      g.position.set(x, 0, z);

      const plinth = new THREE.Mesh(geos.colPlinth, mats.pillar);
      plinth.position.y = 0.08;
      plinth.castShadow = true;
      plinth.receiveShadow = true;
      g.add(plinth);

      const torusL = new THREE.Mesh(geos.colTorusL, mats.pillar);
      torusL.position.y = 0.2;
      torusL.castShadow = true;
      g.add(torusL);

      const scotia = new THREE.Mesh(geos.colScotia, mats.pillar);
      scotia.position.y = 0.28;
      g.add(scotia);

      const torusU = new THREE.Mesh(geos.colTorusU, mats.goldMolding);
      torusU.position.y = 0.35;
      g.add(torusU);

      const shaft = new THREE.Mesh(geos.colShaft, mats.flutedPillar);
      shaft.position.y = 2.12;
      shaft.castShadow = true;
      shaft.receiveShadow = true;
      g.add(shaft);

      const neck = new THREE.Mesh(geos.colNeck, mats.goldMolding);
      neck.position.y = 3.86;
      g.add(neck);

      const echinus = new THREE.Mesh(geos.colEchinus, mats.pillar);
      echinus.position.y = 3.96;
      echinus.castShadow = true;
      g.add(echinus);

      const voluteL = new THREE.Mesh(geos.colVolute, mats.goldMolding);
      voluteL.position.set(-0.34, 4.0, 0);
      voluteL.rotation.y = Math.PI / 2;
      g.add(voluteL);

      const voluteR = new THREE.Mesh(geos.colVolute, mats.goldMolding);
      voluteR.position.set(0.34, 4.0, 0);
      voluteR.rotation.y = Math.PI / 2;
      g.add(voluteR);

      const abacus = new THREE.Mesh(geos.colAbacus, mats.pillar);
      abacus.position.y = 4.12;
      abacus.castShadow = true;
      g.add(abacus);

      return g;
    };

    // Colonnade Columns in Grand Foyer
    scene.add(createClassicalColumn(-3.4, 2.0));
    scene.add(createClassicalColumn(3.4, 2.0));
    scene.add(createClassicalColumn(-3.4, -2.8));
    scene.add(createClassicalColumn(3.4, -2.8));

    // 4. Grand Chandelier Builder
    const createChandelier = (x, y, z, pointColor = 0xffe8c2) => {
      const g = new THREE.Group();
      g.position.set(x, y, z);

      const rod = new THREE.Mesh(geos.chandRod, mats.goldMolding);
      rod.position.y = 0.45;
      g.add(rod);

      const canopy = new THREE.Mesh(geos.chandCanopy, mats.goldMolding);
      canopy.position.y = 0.9;
      g.add(canopy);

      const ring1 = new THREE.Mesh(geos.chandRing1, mats.goldMolding);
      ring1.position.y = 0.15;
      ring1.rotation.x = Math.PI / 2;
      g.add(ring1);

      const ring2 = new THREE.Mesh(geos.chandRing2, mats.goldMolding);
      ring2.position.y = -0.15;
      ring2.rotation.x = Math.PI / 2;
      g.add(ring2);

      // 8 Candle arms with flame tips
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        const cx = Math.cos(ang) * 0.72;
        const cz = Math.sin(ang) * 0.72;

        const candle = new THREE.Mesh(geos.chandCandle, mats.candleWax);
        candle.position.set(cx, -0.06, cz);
        g.add(candle);

        const flame = new THREE.Mesh(geos.chandFlame, mats.candleFlame);
        flame.position.set(cx, 0.08, cz);
        g.add(flame);
      }

      // 12 Crystal prisms
      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * Math.PI * 2;
        const dx = Math.cos(ang) * 0.7;
        const dz = Math.sin(ang) * 0.7;
        const drop = new THREE.Mesh(geos.chandDrop, mats.crystal);
        drop.position.set(dx, -0.28, dz);
        g.add(drop);
      }

      return { group: g };
    };

    const foyerChandelier = createChandelier(0, 3.65, -2.5, 0xfff0d6);
    scene.add(foyerChandelier.group);

    // 5. Classical Wall Sconce Builder (With Radiant Emissive Flame, Zero Uniform Overhead)
    const createWallSconce = (x, y, z, rotY) => {
      const g = new THREE.Group();
      g.position.set(x, y, z);
      g.rotation.y = rotY;

      const plate = new THREE.Mesh(geos.wallSconcePlate, mats.goldMolding);
      plate.rotation.x = Math.PI / 2;
      g.add(plate);

      const candle = new THREE.Mesh(geos.chandCandle, mats.candleWax);
      candle.position.set(0, 0.1, 0.14);
      g.add(candle);

      const flame = new THREE.Mesh(geos.chandFlame, mats.candleFlame);
      flame.position.set(0, 0.22, 0.14);
      g.add(flame);

      return g;
    };

    // Helper: Classical Palace Tufted Velvet Bench
    const createPalaceBench = (x, y, z, rotY, isWedding) => {
      const g = new THREE.Group();
      g.position.set(x, y, z);
      g.rotation.y = rotY;

      const seatMat = isWedding ? mats.carpetCelebration : mats.carpetConference;
      const seat = new THREE.Mesh(geos.benchSeat, seatMat);
      seat.position.y = 0.35;
      seat.castShadow = true;
      seat.receiveShadow = true;
      g.add(seat);

      [[-0.32, -0.72], [0.32, -0.72], [-0.32, 0.72], [0.32, 0.72]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(geos.benchLeg, mats.goldMolding);
        leg.position.set(lx, 0.22, lz);
        leg.castShadow = true;
        g.add(leg);
      });

      return g;
    };

    // Helper: Ceremonial Stanchion Post with Velvet Rope
    const createStanchionPair = (x1, z1, x2, z2, isWedding) => {
      const g = new THREE.Group();
      const ropeMat = isWedding ? mats.carpetCelebration : mats.carpetConference;

      [ [x1, z1], [x2, z2] ].forEach(([px, pz]) => {
        const postG = new THREE.Group();
        postG.position.set(px, 0, pz);

        const base = new THREE.Mesh(geos.stanchionBase, mats.goldMolding);
        base.position.y = 0.03;
        postG.add(base);

        const stem = new THREE.Mesh(geos.stanchionPost, mats.goldMolding);
        stem.position.y = 0.5;
        stem.castShadow = true;
        postG.add(stem);

        const cap = new THREE.Mesh(geos.stanchionCap, mats.goldMolding);
        cap.position.y = 1.0;
        postG.add(cap);

        g.add(postG);
      });

      const midX = (x1 + x2) / 2;
      const midZ = (z1 + z2) / 2;
      const dist = Math.hypot(x2 - x1, z2 - z1);
      const angle = Math.atan2(x2 - x1, z2 - z1);

      const ropeGeo = new THREE.CylinderGeometry(0.022, 0.022, dist, 12);
      const rope = new THREE.Mesh(track(ropeGeo), ropeMat);
      rope.position.set(midX, 0.88, midZ);
      rope.rotation.z = Math.PI / 2;
      rope.rotation.y = angle - Math.PI / 2;
      g.add(rope);

      return g;
    };

    // --- PolyHaven Palace Botanical & Fine Decor Systems ---
    const pendingPlants = [];
    let plantMaster = null;

    const spawnPlant = (parent, x, y, z, scale = 1.35, rotY = 0) => {
      if (plantMaster) {
        const inst = plantMaster.clone(true);
        inst.scale.set(scale, scale, scale);
        // Base of the ceramic pot rests exactly flush on the floor / parent surface at y = 0
        inst.position.set(x, y, z);
        inst.rotation.y = rotY;
        parent.add(inst);
        track(inst);
        return inst;
      } else {
        pendingPlants.push({ parent, x, y, z, scale, rotY });
        return null;
      }
    };

    // Classical Stone Display Pedestal with Mounted PolyHaven Polished Brass Vase
    const decorPedestals = [];
    let vaseMaster = null;

    const createPalacePedestal = (parent, x, z, rotY = 0, vaseScale = 1.15) => {
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      g.rotation.y = rotY;

      const plinth = new THREE.Mesh(geos.pedestalPlinth, mats.pillar);
      plinth.position.y = 0.4;
      plinth.castShadow = true;
      plinth.receiveShadow = true;
      g.add(plinth);

      const cap = new THREE.Mesh(geos.pedestalCap, mats.goldMolding);
      cap.position.y = 0.85;
      cap.castShadow = true;
      cap.receiveShadow = true;
      g.add(cap);

      parent.add(g);
      track(g);

      if (vaseMaster) {
        const v = vaseMaster.clone(true);
        v.scale.set(vaseScale, vaseScale, vaseScale);
        v.position.set(0, 0.90, 0);
        g.add(v);
      } else {
        decorPedestals.push({ group: g, scale: vaseScale });
      }

      return g;
    };

    // --- Grand Foyer Classical Pedestals & Polished Brass Vases ---
    // Symmetrically aligned with the 4 grand colonnade columns, nestled just outside the main aisle
    createPalacePedestal(scene, -4.3, -2.8, 0, 1.25);
    createPalacePedestal(scene, 4.3, -2.8, 0, 1.25);
    createPalacePedestal(scene, -4.3, 2.0, 0, 1.25);
    createPalacePedestal(scene, 4.3, 2.0, 0, 1.25);

    // --- Grand Foyer PolyHaven Botanical Potted Plants ---
    // Corner wall niches (clear of all walkways and benches)
    spawnPlant(scene, -7.8, 0, -1.8, 1.35, 0.6);
    spawnPlant(scene, 7.8, 0, -1.8, 1.35, -0.6);
    spawnPlant(scene, -7.8, 0, 7.4, 1.35, 1.2);
    spawnPlant(scene, 7.8, 0, 7.4, 1.35, -1.2);

    // Flanking the rear grand palace entrance behind the player
    spawnPlant(scene, -3.2, 0, 8.0, 1.4, 0.8);
    spawnPlant(scene, 3.4, 0, 8.0, 1.4, -0.9);

    // Place Foyer Velvet Benches Behind User
    scene.add(createPalaceBench(-5.2, 0, 7.8, Math.PI / 2, true));
    scene.add(createPalaceBench(5.2, 0, 7.8, -Math.PI / 2, false));

    // --- PolyHaven Real-Life Botanical & Palace Decor Assets ---
    if (GLTFLoader) {
      const gltfLoader = new GLTFLoader();

      // (A) PolyHaven Potted Indoor Palace Plants (potted_plant_01)
      gltfLoader.load(
        '/public/models/potted_plant_01/potted_plant_01.gltf',
        gltf => {
          if (cancelled) return;
          plantMaster = gltf.scene;
          plantMaster.traverse(child => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              if (child.material) {
                child.material.envMapIntensity = 0.9;
                child.material.roughness = Math.max(child.material.roughness || 0, 0.45);
              }
            }
          });

          // Flush any pending plants registered before GLTF resolution
          pendingPlants.forEach(p => {
            spawnPlant(p.parent, p.x, p.y, p.z, p.scale, p.rotY);
          });
          pendingPlants.length = 0;
        },
        undefined,
        err => console.warn('Could not load potted plant:', err)
      );

      // (B) PolyHaven Classical Polished Brass Vases (brass_vase_01)
      gltfLoader.load(
        '/public/models/brass_vase_01/brass_vase_01.gltf',
        gltf => {
          if (cancelled) return;
          vaseMaster = gltf.scene;
          vaseMaster.traverse(child => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              if (child.material) {
                child.material.metalness = 0.88;
                child.material.roughness = 0.22;
                child.material.envMapIntensity = 1.35;
              }
            }
          });

          // Mount polished brass vases atop all registered pedestals
          decorPedestals.forEach(p => {
            const v = vaseMaster.clone(true);
            v.scale.set(p.scale, p.scale, p.scale);
            v.position.set(0, 0.90, 0);
            p.group.add(v);
          });
          decorPedestals.length = 0;
        },
        undefined,
        err => console.warn('Could not load brass vase:', err)
      );

      // (C) PolyHaven Antique Grandfather Clock (vintage_grandfather_clock_01) - Behind the player!
      gltfLoader.load(
        '/public/models/vintage_grandfather_clock_01/vintage_grandfather_clock_01.gltf',
        gltf => {
          if (cancelled) return;
          const clock = gltf.scene;
          clock.name = 'PolyHaven_Grandfather_Clock';
          clock.scale.set(1.05, 1.05, 1.05);
          clock.position.set(2.2, 0, 8.2);
          clock.rotation.y = -Math.PI * 0.78; // angled into the grand foyer
          clock.traverse(child => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              if (child.material) {
                child.material.envMapIntensity = 1.15;
                child.material.roughness = 0.38;
              }
            }
          });
          scene.add(clock);
          track(clock);
        },
        undefined,
        err => console.warn('Could not load grandfather clock:', err)
      );
    }

    // 7. Central Heritage Monument with PolyHaven Classical Bronze Equestrian Statue
    const monumentGroup = new THREE.Group();
    monumentGroup.position.set(0, 0, -2.5);

    const diasMesh1 = new THREE.Mesh(geos.dias1, mats.pillar);
    diasMesh1.position.y = 0.07;
    diasMesh1.receiveShadow = true;
    monumentGroup.add(diasMesh1);

    const diasMesh2 = new THREE.Mesh(geos.dias2, mats.pillar);
    diasMesh2.position.y = 0.21;
    diasMesh2.receiveShadow = true;
    monumentGroup.add(diasMesh2);

    const colMesh = new THREE.Mesh(geos.monumentCol, mats.pillar);
    colMesh.position.y = 0.88;
    colMesh.castShadow = true;
    monumentGroup.add(colMesh);

    const goldCap = new THREE.Mesh(geos.monumentCap, mats.goldMolding);
    goldCap.position.y = 1.5;
    goldCap.castShadow = true;
    monumentGroup.add(goldCap);

    // Load PolyHaven 3D Classical Bronze Equestrian Statue
    if (GLTFLoader) {
      const gltfLoader = new GLTFLoader();
      gltfLoader.load(
        '/public/models/horse_statue_01/horse_statue_01.gltf',
        gltf => {
          if (cancelled) return;
          const statue = gltf.scene;
          statue.name = 'PolyHaven_Horse_Statue';
          statue.scale.set(7.5, 7.5, 7.5);
          statue.position.set(0, 1.61, 0);
          statue.rotation.y = Math.PI * 0.16;
          statue.traverse(child => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              if (child.material) {
                child.material.envMapIntensity = 1.35;
                if (child.material.metalness !== undefined) {
                  child.material.metalness = 0.82;
                  child.material.roughness = 0.32;
                }
              }
            }
          });
          monumentGroup.add(statue);
          track(statue);
        },
        undefined,
        err => console.warn('Could not load horse statue:', err)
      );
    }

    scene.add(monumentGroup);

    // --- Atmospheric Floating Dust Motes (Sunbeam Particles) ---
    const MOTES_COUNT = 160;
    const motesGeo = track(new THREE.BufferGeometry());
    const motesPos = new Float32Array(MOTES_COUNT * 3);
    const motesSpeed = new Float32Array(MOTES_COUNT);

    for (let i = 0; i < MOTES_COUNT; i++) {
      motesPos[i * 3] = (Math.random() - 0.5) * 16;
      motesPos[i * 3 + 1] = 0.4 + Math.random() * 3.8;
      motesPos[i * 3 + 2] = -14 + Math.random() * 22;
      motesSpeed[i] = 0.6 + Math.random() * 1.4;
    }
    motesGeo.setAttribute('position', new THREE.BufferAttribute(motesPos, 3));

    const motesMat = track(new THREE.PointsMaterial({
      color: isDark() ? 0xd4af37 : 0x8a7a58,
      size: 0.075,
      transparent: true,
      opacity: isDark() ? 0.72 : 0.55,
      blending: THREE.AdditiveBlending
    }));
    const motes = new THREE.Points(motesGeo, motesMat);
    scene.add(motes);

    // --- Interactive Wing Groups ---
    const clickableWings = [];

    // Grand Portal Door Assembly Builder
    const createGrandPortalDoor = wing => {
      const g = new THREE.Group();
      const isWedding = wing === 'wedding';
      const doorMat = isWedding ? mats.doorMahogany : mats.doorWalnut;
      const accentMat = isWedding ? mats.goldMolding : mats.bronzeMolding;

      // Stone Door Frame Jambs
      const jambL = new THREE.Mesh(geos.doorSurroundJamb, mats.pillar);
      jambL.position.set(-1.4, 1.9, 0);
      g.add(jambL);

      const jambR = new THREE.Mesh(geos.doorSurroundJamb, mats.pillar);
      jambR.position.set(1.4, 1.9, 0);
      g.add(jambR);

      const lintel = new THREE.Mesh(geos.doorSurroundLintel, mats.pillar);
      lintel.position.set(0, 3.8, 0);
      g.add(lintel);

      // Classical Triangular Crown Pediment
      const pediment = new THREE.Mesh(geos.doorPediment, accentMat);
      pediment.rotation.z = Math.PI;
      pediment.position.set(0, 4.3, 0);
      g.add(pediment);

      // Left & Right Door Leaves
      const leafL = new THREE.Mesh(geos.doorLeaf, doorMat);
      leafL.position.set(-0.6, 1.65, 0.05);
      g.add(leafL);

      const leafR = new THREE.Mesh(geos.doorLeaf, doorMat);
      leafR.position.set(0.6, 1.65, 0.05);
      g.add(leafR);

      // Gilded Vertical Pull Handles
      const handleL = new THREE.Mesh(geos.doorHandle, mats.goldMolding);
      handleL.position.set(-0.14, 1.5, 0.12);
      g.add(handleL);

      const handleR = new THREE.Mesh(geos.doorHandle, mats.goldMolding);
      handleR.position.set(0.14, 1.5, 0.12);
      g.add(handleR);

      // Bulkhead Return Walls on Left and Right of Doorway
      const endWallL = new THREE.Mesh(geos.portalEndWallL, mats.wall);
      endWallL.position.set(-1.7, 2.2, 0);
      g.add(endWallL);

      const endWallR = new THREE.Mesh(geos.portalEndWallR, mats.wall);
      endWallR.position.set(1.7, 2.2, 0);
      g.add(endWallR);

      // Overhead Bulkhead Wall above Lintel to ceiling
      const endWallTop = new THREE.Mesh(geos.portalEndWallTop, mats.wall);
      endWallTop.position.set(0, 4.25, 0);
      g.add(endWallTop);

      // Solid Backing Panel behind doors
      const backWall = new THREE.Mesh(geos.portalBackPanel, mats.wall);
      backWall.position.set(0, 2.2, -0.15);
      g.add(backWall);

      return g;
    };

    // Helper: Framed Gallery Art on Corridor Walls
    const frameGeo = track(new THREE.PlaneGeometry(1.6, 1.1));
    const frameBorderGeo = track(new THREE.BoxGeometry(1.7, 1.2, 0.08));

    const loadWallPicture = (url, posX, posY, posZ, rotY, parent) => {
      texLoader.load(url, texture => {
        if (cancelled) return;
        track(texture);
        const picMat = track(new THREE.MeshBasicMaterial({ map: texture }));
        const picMesh = new THREE.Mesh(frameGeo, picMat);
        const borderMesh = new THREE.Mesh(frameBorderGeo, mats.goldMolding);

        const frameGroup = new THREE.Group();
        frameGroup.position.set(posX, posY, posZ);
        frameGroup.rotation.y = rotY;
        frameGroup.add(borderMesh);
        frameGroup.add(picMesh);
        picMesh.position.z = 0.045;
        parent.add(frameGroup);
      });
    };

    // ==========================================
    // 8. LEFT WING: Royal Celebrations & Weddings
    // ==========================================
    const leftWingGroup = new THREE.Group();
    leftWingGroup.position.set(-5.5, 0, -3.0);
    leftWingGroup.rotation.y = Math.PI / 12;
    leftWingGroup.userData = { wing: 'wedding' };

    // Wing Portal Columns
    leftWingGroup.add(createClassicalColumn(-1.8, 0));
    leftWingGroup.add(createClassicalColumn(1.8, 0));

    // Architrave Header
    const leftLintel = new THREE.Mesh(geos.architraveBeam, mats.goldMolding);
    leftLintel.position.set(0, 4.3, 0);
    leftWingGroup.add(leftLintel);

    // Architectural Signboard
    const signGeo = track(new THREE.PlaneGeometry(3.6, 0.9));
    const leftSignTex = makeSignTexture(
      'ROYAL CELEBRATIONS',
      'قصور وأفراح الملوك',
      'Historic Palaces, Estates & Nile Salons',
      'القصور التراثية وحدائق الزيتون وصالونات النيل',
      '#997541',
      'WING 01'
    );
    const leftSignMat = track(new THREE.MeshBasicMaterial({ map: leftSignTex }));
    const leftSign = new THREE.Mesh(signGeo, leftSignMat);
    leftSign.position.set(0, 3.42, 0.42);
    leftWingGroup.add(leftSign);

    // Woven Damask Carpet Runner
    const leftCarpet = new THREE.Mesh(geos.carpetGeo, mats.carpetCelebration);
    leftCarpet.rotation.x = -Math.PI / 2;
    leftCarpet.position.set(0, 0.015, -7.5);
    leftWingGroup.add(leftCarpet);

    // Corridor Walls
    const leftWallL = new THREE.Mesh(geos.wallGeo, mats.wall);
    leftWallL.position.set(-2.0, 2.2, -8.5);
    leftWingGroup.add(leftWallL);

    const leftWallR = new THREE.Mesh(geos.wallGeo, mats.wall);
    leftWallR.position.set(2.0, 2.2, -8.5);
    leftWingGroup.add(leftWallR);

    // Chandelier hanging in corridor
    const leftChandelier = createChandelier(0, 3.65, -9.0, 0xf59e0b);
    leftWingGroup.add(leftChandelier.group);

    // Wall Sconces along corridor
    leftWingGroup.add(createWallSconce(-1.84, 2.2, -6.5, Math.PI / 2));
    leftWingGroup.add(createWallSconce(1.84, 2.2, -6.5, -Math.PI / 2));
    leftWingGroup.add(createWallSconce(-1.84, 2.2, -12.5, Math.PI / 2));
    leftWingGroup.add(createWallSconce(1.84, 2.2, -12.5, -Math.PI / 2));

    // Luxury Tufted Palace Velvet Bench
    leftWingGroup.add(createPalaceBench(1.45, 0, -13.5, -Math.PI / 2, true));

    // Ceremonial Stanchion Pairs with Velvet Ropes guiding towards the portal
    leftWingGroup.add(createStanchionPair(-1.15, -15.2, -1.15, -12.8, true));
    leftWingGroup.add(createStanchionPair(1.15, -15.2, 1.15, -12.8, true));

    // Outer Portal Arch Flanker Plant
    spawnPlant(leftWingGroup, -2.3, 0, 0.5, 1.3, 0.4);

    // Corridor Entrance Botanical Accent (Opposite first painting)
    spawnPlant(leftWingGroup, 1.55, 0, -4.5, 1.25, -0.5);

    // Mid-Corridor Classical Pedestal with Brass Vase
    createPalacePedestal(leftWingGroup, -1.55, -9.5, Math.PI / 2, 1.15);

    // Flanking the Grand Portal Door Assembly
    createPalacePedestal(leftWingGroup, -1.45, -15.8, Math.PI / 2, 1.15);
    spawnPlant(leftWingGroup, 1.45, 0, -15.8, 1.25, -0.8);

    // Grand Doorway at the end of the Left Corridor
    const leftDoorAssembly = createGrandPortalDoor('wedding');
    leftDoorAssembly.position.set(0, 0, -16.8);
    leftWingGroup.add(leftDoorAssembly);

    // Framed Gallery Pictures along left hallway
    loadWallPicture('/public/images/nile-salon.jpg', -1.82, 2.1, -4.5, Math.PI / 2, leftWingGroup);
    loadWallPicture('/public/images/olive-garden.jpg', -1.82, 2.1, -9.0, Math.PI / 2, leftWingGroup);
    loadWallPicture('/public/images/celebration-portal.jpg', 1.82, 2.1, -6.5, -Math.PI / 2, leftWingGroup);

    scene.add(leftWingGroup);
    clickableWings.push(leftWingGroup);

    // ==========================================
    // 9. RIGHT WING: Executive Summits & Plenaries
    // ==========================================
    const rightWingGroup = new THREE.Group();
    rightWingGroup.position.set(5.5, 0, -3.0);
    rightWingGroup.rotation.y = -Math.PI / 12;
    rightWingGroup.userData = { wing: 'conference' };

    // Wing Portal Columns
    rightWingGroup.add(createClassicalColumn(-1.8, 0));
    rightWingGroup.add(createClassicalColumn(1.8, 0));

    const rightLintel = new THREE.Mesh(geos.architraveBeam, mats.goldMolding);
    rightLintel.position.set(0, 4.3, 0);
    rightWingGroup.add(rightLintel);

    const rightSignTex = makeSignTexture(
      'CONFERENCES & SUMMITS',
      'المؤتمرات والقمم الدبلوماسية',
      'Plenary Centers, Diplomatic Suites & 8K AV',
      'قاعات المؤتمرات الكبرى وأجنحة القمم وشاشات العرض',
      '#0284c7',
      'WING 02'
    );
    const rightSignMat = track(new THREE.MeshBasicMaterial({ map: rightSignTex }));
    const rightSign = new THREE.Mesh(signGeo, rightSignMat);
    rightSign.position.set(0, 3.42, 0.42);
    rightWingGroup.add(rightSign);

    const rightCarpet = new THREE.Mesh(geos.carpetGeo, mats.carpetConference);
    rightCarpet.rotation.x = -Math.PI / 2;
    rightCarpet.position.set(0, 0.015, -7.5);
    rightWingGroup.add(rightCarpet);

    const rightWallL = new THREE.Mesh(geos.wallGeo, mats.wall);
    rightWallL.position.set(-2.0, 2.2, -8.5);
    rightWingGroup.add(rightWallL);

    const rightWallR = new THREE.Mesh(geos.wallGeo, mats.wall);
    rightWallR.position.set(2.0, 2.2, -8.5);
    rightWingGroup.add(rightWallR);

    // Chandelier hanging in corridor
    const rightChandelier = createChandelier(0, 3.65, -9.0, 0x0284c7);
    rightWingGroup.add(rightChandelier.group);

    // Wall Sconces along corridor
    rightWingGroup.add(createWallSconce(-1.84, 2.2, -6.5, Math.PI / 2));
    rightWingGroup.add(createWallSconce(1.84, 2.2, -6.5, -Math.PI / 2));
    rightWingGroup.add(createWallSconce(-1.84, 2.2, -12.5, Math.PI / 2));
    rightWingGroup.add(createWallSconce(1.84, 2.2, -12.5, -Math.PI / 2));

    // Luxury Tufted Palace Velvet Bench
    rightWingGroup.add(createPalaceBench(-1.45, 0, -13.5, Math.PI / 2, false));

    // Ceremonial Stanchion Pairs with Velvet Ropes guiding towards the portal
    rightWingGroup.add(createStanchionPair(-1.15, -15.2, -1.15, -12.8, false));
    rightWingGroup.add(createStanchionPair(1.15, -15.2, 1.15, -12.8, false));

    // Outer Portal Arch Flanker Plant
    spawnPlant(rightWingGroup, 2.3, 0, 0.5, 1.3, -0.4);

    // Corridor Entrance Botanical Accent (Opposite first painting)
    spawnPlant(rightWingGroup, -1.55, 0, -4.5, 1.25, 0.5);

    // Mid-Corridor Classical Pedestal with Brass Vase
    createPalacePedestal(rightWingGroup, 1.55, -9.5, -Math.PI / 2, 1.15);

    // Flanking the Grand Portal Door Assembly
    spawnPlant(rightWingGroup, -1.45, 0, -15.8, 1.25, 0.8);
    createPalacePedestal(rightWingGroup, 1.45, -15.8, -Math.PI / 2, 1.15);

    // Grand Doorway at the end of the Right Corridor
    const rightDoorAssembly = createGrandPortalDoor('conference');
    rightDoorAssembly.position.set(0, 0, -16.8);
    rightWingGroup.add(rightDoorAssembly);

    // Pictures on right hallway
    loadWallPicture('/public/images/summit-ballroom.jpg', 1.82, 2.1, -4.5, -Math.PI / 2, rightWingGroup);
    loadWallPicture('/public/images/cairo-meeting-house.jpg', 1.82, 2.1, -9.0, -Math.PI / 2, rightWingGroup);
    loadWallPicture('/public/images/conference-portal.jpg', -1.82, 2.1, -6.5, Math.PI / 2, rightWingGroup);

    scene.add(rightWingGroup);
    clickableWings.push(rightWingGroup);

    // ==========================================
    // 10. GRAND FOYER ENCLOSURE & REAR PALACE ENTRANCE (Behind User)
    // ==========================================
    const foyerSideWallGeo = track(new THREE.BoxGeometry(0.35, 4.4, 12.0));
    const foyerSideWallL = new THREE.Mesh(foyerSideWallGeo, mats.wall);
    foyerSideWallL.position.set(-9.2, 2.2, 3.0);
    scene.add(foyerSideWallL);

    const foyerSideWallR = new THREE.Mesh(foyerSideWallGeo, mats.wall);
    foyerSideWallR.position.set(9.2, 2.2, 3.0);
    scene.add(foyerSideWallR);

    // Grand Foyer Side Wall Sconces
    scene.add(createWallSconce(-9.0, 2.2, 1.5, Math.PI / 2));
    scene.add(createWallSconce(-9.0, 2.2, 5.5, Math.PI / 2));
    scene.add(createWallSconce(9.0, 2.2, 1.5, -Math.PI / 2));
    scene.add(createWallSconce(9.0, 2.2, 5.5, -Math.PI / 2));

    // Grand Foyer Side Wall Art
    loadWallPicture('/public/images/nile-salon.jpg', -9.0, 2.1, 3.5, Math.PI / 2, scene);
    loadWallPicture('/public/images/cairo-meeting-house.jpg', 9.0, 2.1, 3.5, -Math.PI / 2, scene);

    // Grand Foyer Side Benches
    scene.add(createPalaceBench(-8.7, 0, 3.5, 0, true));
    scene.add(createPalaceBench(8.7, 0, 3.5, 0, false));

    // Rear Palace Entrance Travertine Wall (at z = 8.7, enclosing the grand foyer)
    const rearWallGeo = track(new THREE.BoxGeometry(18.8, 4.4, 0.35));
    const rearWall = new THREE.Mesh(rearWallGeo, mats.wall);
    rearWall.position.set(0, 2.2, 8.7);
    scene.add(rearWall);

    // Rear Palace Entrance Grand Double Portal (faces into the foyer towards -Z)
    const rearDoorAssembly = createGrandPortalDoor('wedding');
    rearDoorAssembly.position.set(0, 0, 8.65);
    rearDoorAssembly.rotation.y = Math.PI;
    scene.add(rearDoorAssembly);

    // Classical Columns flanking the Rear Palace Portal
    scene.add(createClassicalColumn(-2.4, 8.4));
    scene.add(createClassicalColumn(2.4, 8.4));

    // Sconces on Rear Wall
    scene.add(createWallSconce(-5.0, 2.2, 8.52, Math.PI));
    scene.add(createWallSconce(5.0, 2.2, 8.52, Math.PI));

    // Framed Art on Rear Wall
    loadWallPicture('/public/images/celebration-portal.jpg', -6.5, 2.1, 8.52, Math.PI, scene);
    loadWallPicture('/public/images/summit-ballroom.jpg', 6.5, 2.1, 8.52, Math.PI, scene);

    // Tufted Velvet Benches along Rear Wall
    scene.add(createPalaceBench(-6.5, 0, 8.1, Math.PI / 2, true));
    scene.add(createPalaceBench(6.5, 0, 8.1, Math.PI / 2, false));

    // Ceremonial Stanchion Pairs at Rear Entrance
    scene.add(createStanchionPair(-1.8, 8.0, -1.8, 6.2, true));
    scene.add(createStanchionPair(1.8, 8.0, 1.8, 6.2, false));

    // --- First-Person Continuous WASD Engine State ---
    const keysDown = {
      w: false,
      a: false,
      s: false,
      d: false,
      shift: false
    };

    let isAutoNavigating = false;
    let hoveredWing = null;
    let stepCycle = 0;
    let activeThreshold = null; // 'wedding' | 'conference' | null

    // Raycasting & Pointer Look
    const pointer = new THREE.Vector2();
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    const raycaster = new THREE.Raycaster();

    // Elements
    const portalPrompt = host.querySelector('.hallway-portal-prompt');
    const portalEnterBtn = host.querySelector('[data-action="hallway-enter-portal"]');
    const portalPromptText = host.querySelector('.portal-prompt-text');
    const portalVeil = host.querySelector('.hallway-portal-veil');
    let isTransitioning = false;

    function updateKeycapUI(key, pressed) {
      const btn = host.querySelector(`.wasd-key[data-action="key-${key}"]`);
      if (btn) {
        if (pressed) btn.classList.add('is-active');
        else btn.classList.remove('is-active');
      }
    }

    // --- Smooth Cinematic WebGL & Three.js Portal Transition Animation ---
    function triggerPortalTransition(wing) {
      if (isTransitioning) return;
      isTransitioning = true;
      isAutoNavigating = true;
      sound.pop();

      const isWedding = wing === 'wedding';
      const targetX = isWedding ? -5.5 : 5.5;
      const targetZ = -19.5;
      const targetYaw = isWedding ? Math.PI / 12 : -Math.PI / 12;

      if (portalVeil) {
        portalVeil.className = `hallway-portal-veil is-active ${isWedding ? 'veil-wedding' : 'veil-conference'}`;
      }

      if (status) {
        status.textContent = isAr 
          ? (isWedding ? 'العبور إلى قصور وأفراح الملوك…' : 'العبور إلى المؤتمرات والقمم الدبلوماسية…') 
          : (isWedding ? 'Stepping through into Royal Celebrations…' : 'Stepping through into Executive Summits…');
      }

      if (gsap) {
        const tl = gsap.timeline({
          onComplete: () => {
            onSelectHallway(wing);
          }
        });

        // Step 1: Align camera towards portal doorway
        tl.to({ yaw: cameraYaw, pitch: cameraPitch }, {
          yaw: targetYaw,
          pitch: 0.04,
          duration: 0.35,
          ease: 'power2.out',
          onUpdate: function() {
            cameraYaw = this.targets()[0].yaw;
            cameraPitch = this.targets()[0].pitch;
          }
        });

        // Step 2: Warp acceleration through portal doorway
        tl.to(playerPos, {
          x: targetX,
          z: targetZ,
          duration: 1.05,
          ease: 'power3.in'
        }, '-=0.15');

        // Step 3: Dynamic FOV expansion (WebGL warp effect: 50 -> 76 degrees)
        tl.to(camera, {
          fov: 76,
          duration: 1.05,
          ease: 'power2.in',
          onUpdate: () => camera.updateProjectionMatrix()
        }, '<');

        // Step 4: Increase fog density to immerse in portal light
        tl.to(scene.fog, {
          density: 0.055,
          duration: 1.0,
          ease: 'power2.in'
        }, '<');
      } else {
        setTimeout(() => onSelectHallway(wing), 700);
      }
    }

    function enterPortal(wing) {
      triggerPortalTransition(wing);
    }

    if (portalEnterBtn) {
      portalEnterBtn.onclick = () => {
        if (activeThreshold) triggerPortalTransition(activeThreshold);
      };
    }

    // Smooth Cinematic GSAP Walk to Wing
    function cinematicWalkToWing(wing) {
      if (isTransitioning) return;
      isAutoNavigating = true;
      sound.tap();

      const isWedding = wing === 'wedding';
      const targetX = isWedding ? -5.5 : 5.5;
      const targetZ = -15.5;
      const targetYaw = isWedding ? Math.PI / 12 : -Math.PI / 12;

      host.querySelectorAll('.hallway-btn').forEach(b => b.classList.remove('is-active'));
      const activeBtn = host.querySelector(`.hallway-btn.${isWedding ? 'celebration' : 'conference'}`);
      if (activeBtn) activeBtn.classList.add('is-active');

      if (status) {
        status.textContent = isAr
          ? (isWedding ? 'سير سينمائي إلى ممر قصور وأفراح الملوك…' : 'سير سينمائي إلى ممر المؤتمرات والقمم الدبلوماسية…')
          : (isWedding ? 'Cinematic auto-walk into Royal Celebrations Corridor…' : 'Cinematic auto-walk into Executive Summits Corridor…');
      }

      if (gsap) {
        const tl = gsap.timeline({
          onComplete: () => {
            triggerPortalTransition(wing);
          }
        });

        tl.to({ yaw: cameraYaw }, {
          yaw: targetYaw,
          duration: 0.45,
          ease: 'power2.out',
          onUpdate: function() { cameraYaw = this.targets()[0].yaw; }
        });

        tl.to(playerPos, {
          x: targetX,
          z: targetZ,
          duration: 1.7,
          ease: 'power2.inOut'
        }, '-=0.15');
      } else {
        playerPos.set(targetX, START_POS.y, targetZ);
        triggerPortalTransition(wing);
      }
    }

    // Reset Vantage to Foyer Entrance
    function resetVantage() {
      sound.tap();
      isAutoNavigating = true;
      host.querySelectorAll('.hallway-btn').forEach(b => b.classList.remove('is-active'));

      if (status) {
        status.textContent = isAr ? 'تراجعت إلى مدخل البهو الرئيسي.' : 'Returned to the grand foyer entrance.';
      }

      if (gsap) {
        gsap.to(playerPos, {
          x: START_POS.x,
          y: START_POS.y,
          z: START_POS.z,
          duration: 1.2,
          ease: 'power2.out',
          onComplete: () => { isAutoNavigating = false; }
        });
        gsap.to({ yaw: cameraYaw, pitch: cameraPitch }, {
          yaw: 0,
          pitch: 0,
          duration: 1.2,
          ease: 'power2.out',
          onUpdate: function() {
            cameraYaw = this.targets()[0].yaw;
            cameraPitch = this.targets()[0].pitch;
          }
        });
      } else {
        playerPos.set(START_POS.x, START_POS.y, START_POS.z);
        cameraYaw = 0;
        cameraPitch = 0;
        isAutoNavigating = false;
      }
    }

    // Keyboard controls (WASD + Arrows + Enter)
    const onKeyDown = event => {
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;

      const key = event.key.toLowerCase();
      if (key === 'w' || event.key === 'ArrowUp') {
        keysDown.w = true;
        updateKeycapUI('w', true);
      } else if (key === 's' || event.key === 'ArrowDown') {
        keysDown.s = true;
        updateKeycapUI('s', true);
      } else if (key === 'a' || event.key === 'ArrowLeft') {
        keysDown.a = true;
        updateKeycapUI('a', true);
      } else if (key === 'd' || event.key === 'ArrowRight') {
        keysDown.d = true;
        updateKeycapUI('d', true);
      } else if (event.key === 'Shift') {
        keysDown.shift = true;
      } else if (event.key === 'Enter') {
        if (activeThreshold) enterPortal(activeThreshold);
      }
    };

    const onKeyUp = event => {
      const key = event.key.toLowerCase();
      if (key === 'w' || event.key === 'ArrowUp') {
        keysDown.w = false;
        updateKeycapUI('w', false);
      } else if (key === 's' || event.key === 'ArrowDown') {
        keysDown.s = false;
        updateKeycapUI('s', false);
      } else if (key === 'a' || event.key === 'ArrowLeft') {
        keysDown.a = false;
        updateKeycapUI('a', false);
      } else if (key === 'd' || event.key === 'ArrowRight') {
        keysDown.d = false;
        updateKeycapUI('d', false);
      } else if (event.key === 'Shift') {
        keysDown.shift = false;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    disposers.push(() => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    });

    // Wire Interactive On-Screen WASD Controller Buttons
    ['w', 'a', 's', 'd'].forEach(k => {
      const btn = host.querySelector(`[data-action="key-${k}"]`);
      if (btn) {
        const start = e => {
          e.preventDefault();
          keysDown[k] = true;
          updateKeycapUI(k, true);
        };
        const end = () => {
          keysDown[k] = false;
          updateKeycapUI(k, false);
        };
        btn.addEventListener('mousedown', start);
        btn.addEventListener('touchstart', start, { passive: false });
        btn.addEventListener('mouseup', end);
        btn.addEventListener('touchend', end);
        btn.addEventListener('mouseleave', end);
      }
    });

    // Pointer Drag to Look Around (Yaw & Pitch)
    const onPointerMove = event => {
      const rect = viewport.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging) {
        const deltaX = event.clientX - prevMouseX;
        const deltaY = event.clientY - prevMouseY;
        prevMouseX = event.clientX;
        prevMouseY = event.clientY;

        // Yaw and Pitch
        cameraYaw += deltaX * 0.0035;
        cameraPitch = Math.max(-0.45, Math.min(0.45, cameraPitch + deltaY * 0.0025));
      } else {
        raycaster.setFromCamera(pointer, camera);
        const intersects = raycaster.intersectObjects(clickableWings, true);
        if (intersects.length > 0) {
          viewport.style.cursor = 'pointer';
          let rootGroup = intersects[0].object;
          while (rootGroup.parent && !rootGroup.userData.wing) rootGroup = rootGroup.parent;
          hoveredWing = rootGroup.userData?.wing || null;
        } else {
          viewport.style.cursor = 'grab';
          hoveredWing = null;
        }
      }
    };

    const onPointerDown = event => {
      isDragging = true;
      prevMouseX = event.clientX;
      prevMouseY = event.clientY;
      viewport.style.cursor = 'grabbing';
    };

    const onPointerUp = event => {
      isDragging = false;
      viewport.style.cursor = 'grab';

      // Check click on 3D archway
      const rect = viewport.getBoundingClientRect();
      const clickX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const clickY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(new THREE.Vector2(clickX, clickY), camera);
      const intersects = raycaster.intersectObjects(clickableWings, true);
      if (intersects.length > 0) {
        let rootGroup = intersects[0].object;
        while (rootGroup.parent && !rootGroup.userData.wing) rootGroup = rootGroup.parent;
        const wing = rootGroup.userData?.wing;
        if (wing) cinematicWalkToWing(wing);
      }
    };

    viewport.addEventListener('pointermove', onPointerMove);
    viewport.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);

    disposers.push(() => {
      viewport.removeEventListener('pointermove', onPointerMove);
      viewport.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
    });

    // Wire Quick Buttons
    const leftBtn = host.querySelector('[data-action="hallway-walk-left"]');
    const rightBtn = host.querySelector('[data-action="hallway-walk-right"]');
    const resetBtn = host.querySelector('[data-action="hallway-step-back"]');

    if (leftBtn) leftBtn.onclick = () => cinematicWalkToWing('wedding');
    if (rightBtn) rightBtn.onclick = () => cinematicWalkToWing('conference');
    if (resetBtn) resetBtn.onclick = () => resetVantage();

    // Theme Update Handler
    const updateTheme = () => {
      const dark = isDark();
      const col = getBgColor();
      scene.background.setHex(col);
      scene.fog.color.setHex(col);
      renderer.setClearColor(col);
      ambientLight.color.setHex(dark ? 0xffeedd : 0xffeedd);
      ambientLight.groundColor.setHex(dark ? 0x141210 : 0x1c1916);
      ambientLight.intensity = dark ? 0.35 : 0.45;
      interiorKeyLight.intensity = dark ? 0.65 : 0.75;

      mats.ceiling.color.setHex(dark ? 0x181715 : 0xd6d3cb);
      mats.ceilingRecess.color.setHex(dark ? 0x141311 : 0xedeae3);

      motesMat.color.setHex(dark ? 0xd4af37 : 0x8a7a58);
      motesMat.opacity = dark ? 0.72 : 0.55;
    };

    const themeObserver = new MutationObserver(updateTheme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    disposers.push(() => themeObserver.disconnect());

    // Window Resize Handler
    const onResize = () => {
      if (!viewport) return;
      const w = viewport.clientWidth;
      const h = viewport.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);
    disposers.push(() => window.removeEventListener('resize', onResize));

    // --- Collision & Position Clamping Rules ---
    function clampArchitecturalBounds(pos) {
      // 1. In main center foyer (z >= -2.5)
      if (pos.z >= -2.5) {
        pos.x = Math.max(-6.8, Math.min(6.8, pos.x));
        pos.z = Math.max(-2.5, Math.min(8.2, pos.z));
      }
      // 2. In left corridor (Royal Celebrations)
      else if (pos.x < -3.0) {
        pos.x = Math.max(-7.0, Math.min(-3.6, pos.x));
        pos.z = Math.max(-16.4, Math.min(8.2, pos.z));
      }
      // 3. In right corridor (Executive Summits)
      else if (pos.x > 3.0) {
        pos.x = Math.max(3.6, Math.min(7.0, pos.x));
        pos.z = Math.max(-16.4, Math.min(8.2, pos.z));
      }
      // 4. Center wall divider barrier: prevents entering z < -2.5 in center column
      else {
        pos.z = Math.max(-2.5, pos.z);
      }

      // Avoid center monument pedestal cylinder (x: 0, z: -2.5, radius: 1.1)
      const distMon = Math.hypot(pos.x - 0, pos.z - (-2.5));
      if (distMon < 1.15) {
        const pushAngle = Math.atan2(pos.z - (-2.5), pos.x - 0);
        pos.x = 0 + Math.cos(pushAngle) * 1.16;
        pos.z = -2.5 + Math.sin(pushAngle) * 1.16;
      }
    }

    // --- Main Render Loop with First-Person WASD Physics & Kinematic Stride Dynamics ---
    let lastTime = performance.now();
    let strideDistance = 0;
    let currentBobY = 0;
    let currentSwayX = 0;
    let canPlayFootstep = true;

    const animate = time => {
      if (cancelled) return;
      animId = requestAnimationFrame(animate);

      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Monument slow majestic rotation
      monumentGroup.rotation.y += 0.0018;

      // Atmospheric Dust Motes motion
      const motesPosArr = motesGeo.attributes.position.array;
      for (let i = 0; i < MOTES_COUNT; i++) {
        const idx = i * 3;
        motesPosArr[idx + 1] += Math.sin(time * 0.001 * motesSpeed[i] + i) * 0.0025;
        motesPosArr[idx] += Math.cos(time * 0.0008 * motesSpeed[i] + i) * 0.0018;
      }
      motesGeo.attributes.position.needsUpdate = true;

      // Smooth hover lighting transitions (dim, cinematic range)
      const targetAmber = hoveredWing === 'wedding' ? 1.8 : hoveredWing === 'conference' ? 0.9 : 1.3;
      const targetAzure = hoveredWing === 'conference' ? 1.8 : hoveredWing === 'wedding' ? 0.9 : 1.2;
      leftAmberLight.intensity += (targetAmber - leftAmberLight.intensity) * 0.1;
      rightAzureLight.intensity += (targetAzure - rightAzureLight.intensity) * 0.1;

      // Continuous First-Person WASD Kinematics
      if (!isAutoNavigating && !isTransitioning) {
        // Forward and lateral movement vectors from cameraYaw
        const forwardX = -Math.sin(cameraYaw);
        const forwardZ = -Math.cos(cameraYaw);
        const rightX = Math.cos(cameraYaw);
        const rightZ = -Math.sin(cameraYaw);

        const moveDir = new THREE.Vector2(0, 0);

        if (keysDown.w) { moveDir.x += forwardX; moveDir.y += forwardZ; }
        if (keysDown.s) { moveDir.x -= forwardX; moveDir.y -= forwardZ; }
        if (keysDown.d) { moveDir.x += rightX;   moveDir.y += rightZ;   }
        if (keysDown.a) { moveDir.x -= rightX;   moveDir.y -= rightZ;   }

        const isMoving = moveDir.lengthSq() > 0.0001;
        // Grounded realistic indoor human walking speed (2.6 m/s walk, 3.8 m/s brisk)
        const targetSpeed = isMoving ? (keysDown.shift ? 3.8 : 2.6) : 0;

        if (isMoving) {
          moveDir.normalize();
          velocity.x += (moveDir.x * targetSpeed - velocity.x) * (dt * 9);
          velocity.z += (moveDir.y * targetSpeed - velocity.z) * (dt * 9);
        } else {
          velocity.x += (0 - velocity.x) * (dt * 12);
          velocity.z += (0 - velocity.z) * (dt * 12);
        }

        // Apply velocity to position
        playerPos.x += velocity.x * dt;
        playerPos.z += velocity.z * dt;

        clampArchitecturalBounds(playerPos);

        // Realistic Human Stride Dynamics: subtle grounded vertical bob & lateral sway
        const speed = Math.hypot(velocity.x, velocity.z);
        if (speed > 0.15 && !prefersReducedMotion()) {
          strideDistance += speed * dt;
          const strideFreq = 2.4; // steps per meter
          const phase = strideDistance * strideFreq;

          // Subtle ~8mm vertical bob, ~3.5mm lateral sway
          const targetBob = Math.sin(phase * 2) * 0.008 * Math.min(speed / 2.2, 1.0);
          const targetSway = Math.cos(phase) * 0.0035 * Math.min(speed / 2.2, 1.0);

          currentBobY += (targetBob - currentBobY) * Math.min(dt * 12, 1);
          currentSwayX += (targetSway - currentSwayX) * Math.min(dt * 12, 1);

          // Natural synchronized footstep sound
          if (Math.sin(phase * 2) > 0.94 && canPlayFootstep) {
            sound.tap();
            canPlayFootstep = false;
          } else if (Math.sin(phase * 2) < 0) {
            canPlayFootstep = true;
          }
        } else {
          currentBobY += (0 - currentBobY) * Math.min(dt * 10, 1);
          currentSwayX += (0 - currentSwayX) * Math.min(dt * 10, 1);
        }

        camera.position.x = playerPos.x + currentSwayX;
        camera.position.y = START_POS.y + currentBobY;
        camera.position.z = playerPos.z;

        // Calculate look target from yaw and pitch
        const lookDist = 5.0;
        const lookTarget = new THREE.Vector3(
          camera.position.x - Math.sin(cameraYaw) * Math.cos(cameraPitch) * lookDist,
          camera.position.y + Math.sin(cameraPitch) * lookDist,
          camera.position.z - Math.cos(cameraYaw) * Math.cos(cameraPitch) * lookDist
        );
        camera.lookAt(lookTarget);

        // --- Door Threshold & Venue Detection ---
        const distLeftDoor = Math.hypot(playerPos.x - (-5.5), playerPos.z - (-16.0));
        const distRightDoor = Math.hypot(playerPos.x - 5.5, playerPos.z - (-16.0));

        // Threshold detection: walking close to doorway triggers smooth portal transition
        if (distLeftDoor < 1.6 && playerPos.z < -15.8) {
          triggerPortalTransition('wedding');
        } else if (distRightDoor < 1.6 && playerPos.z < -15.8) {
          triggerPortalTransition('conference');
        } else if (distLeftDoor < 5.8) {
          activeThreshold = 'wedding';
          if (portalPrompt) portalPrompt.hidden = false;
          if (portalEnterBtn) portalEnterBtn.className = 'hallway-portal-enter-btn celebration-door';
          if (portalPromptText) portalPromptText.textContent = isAr ? 'احجز في ممر أفراح وقصور الملوك' : 'Book Royal Celebrations Hallway';
          if (status) {
            status.textContent = isAr
              ? 'أمام بوابة قصور الملوك — واصل المشي لدخول القاعة أو اضغط ENTER للعبور'
              : 'At Royal Celebrations Portal — Step forward to enter, or press ENTER';
          }
        } else if (distRightDoor < 5.8) {
          activeThreshold = 'conference';
          if (portalPrompt) portalPrompt.hidden = false;
          if (portalEnterBtn) portalEnterBtn.className = 'hallway-portal-enter-btn conference-door';
          if (portalPromptText) portalPromptText.textContent = isAr ? 'ادخل بوابة المؤتمرات والقمم' : 'Enter Executive Summits Portal';
          if (status) {
            status.textContent = isAr
              ? 'أمام بوابة المؤتمرات والقمم — واصل المشي لدخول القاعة أو اضغط ENTER للعبور'
              : 'At Executive Summits Portal — Step forward to enter, or press ENTER';
          }
        } else {
          activeThreshold = null;
          if (portalPrompt) portalPrompt.hidden = true;
          if (status) {
            status.textContent = isAr
              ? 'تحرك بحرية في البهو بمفاتيح W/A/S/D واسحب بالماوس للالتفات'
              : 'Walk freely through foyer with W/A/S/D keys — Drag mouse to look around';
          }
        }
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);
  });

  return () => {
    cancelled = true;
    if (animId) cancelAnimationFrame(animId);
    disposers.forEach(fn => fn());
    if (viewport) viewport.innerHTML = '';
  };
}

export function hallwayHeroSection({ lang = 'en' } = {}) {
  const isAr = lang === 'ar';
  return `
    <section class="hallway-stage-container" aria-labelledby="landing-title">
      <h1 id="landing-title" class="sr-only">
        ${isAr ? 'إيه المناسبة اللي بتخطط لها؟ اختر ممرك الملكي' : 'What are you planning? Choose your hallway'}
      </h1>

      <div class="hallway-3d-host" tabindex="0" role="region" aria-label="${isAr ? 'مشهد التجول 3D' : '3D Walkthrough Viewport'}">
        <div class="hallway-3d-canvas"></div>
        <div class="hallway-portal-veil" aria-hidden="true"></div>
        <p class="hallway-3d-status sr-only" role="status" aria-live="polite"></p>

        <!-- Floating Tactile Hallway Walk HUD -->
        <div class="hallway-hud">
          <div class="hallway-hud-controls">
            <!-- Ergonomic WASD Directional Pad -->
            <div class="hallway-wasd-cluster" aria-label="${isAr ? 'أزرار المشي' : 'WASD Walk Keys'}">
              <div class="wasd-top">
                <button type="button" class="wasd-key wasd-w" data-action="key-w" aria-label="Walk Forward (W)" title="Walk Forward (W)">
                  <kbd>W</kbd>
                  <span class="wasd-arrow" aria-hidden="true">▲</span>
                </button>
              </div>
              <div class="wasd-bottom">
                <button type="button" class="wasd-key wasd-a" data-action="key-a" aria-label="Strafe Left (A)" title="Strafe Left (A)">
                  <kbd>A</kbd>
                  <span class="wasd-arrow" aria-hidden="true">◀</span>
                </button>
                <button type="button" class="wasd-key wasd-s" data-action="key-s" aria-label="Walk Backward (S)" title="Walk Backward (S)">
                  <kbd>S</kbd>
                  <span class="wasd-arrow" aria-hidden="true">▼</span>
                </button>
                <button type="button" class="wasd-key wasd-d" data-action="key-d" aria-label="Strafe Right (D)" title="Strafe Right (D)">
                  <kbd>D</kbd>
                  <span class="wasd-arrow" aria-hidden="true">▶</span>
                </button>
              </div>
            </div>

            <!-- Wings Navigation Buttons -->
            <div class="hallway-wings-cluster">
              <button type="button" class="hallway-btn celebration" data-action="hallway-walk-left" title="${isAr ? 'امشِ في ممر الأفراح والقصور' : 'Walk Left: Royal Celebrations'}">
                <span class="hallway-btn-badge">01</span>
                <span class="hallway-btn-icon-wrap" aria-hidden="true">
                  <svg class="hallway-btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 18h18M4 15l2-9 5 4 5-4 2 9H4zM12 5a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM5 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM19 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
                  </svg>
                </span>
                <div class="hallway-btn-copy">
                  <strong>${isAr ? 'ممشى أفراح وقصور الملوك' : 'Royal Celebrations Wing'}</strong>
                </div>
              </button>

              <button type="button" class="hallway-btn conference" data-action="hallway-walk-right" title="${isAr ? 'امشِ في ممر المؤتمرات والقمم' : 'Walk Right: Executive Summits'}">
                <span class="hallway-btn-badge">02</span>
                <span class="hallway-btn-icon-wrap" aria-hidden="true">
                  <svg class="hallway-btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 21h18M4 18h16M4 6h16M12 3 3 6h18L12 3zM6 6v12M10 6v12M14 6v12M18 6v12"/>
                  </svg>
                </span>
                <div class="hallway-btn-copy">
                  <strong>${isAr ? 'ممشى المؤتمرات والقمم' : 'Executive Summits Wing'}</strong>
                </div>
              </button>
            </div>
          </div>

          <!-- Dynamic Portal Door Enter Prompt (Visible near corridor doors) -->
          <div class="hallway-portal-prompt" hidden>
            <button type="button" class="hallway-portal-enter-btn" data-action="hallway-enter-portal">
              <span class="portal-prompt-icon" aria-hidden="true">→</span>
              <span class="portal-prompt-text">${isAr ? 'ادخل بوابة قصور وأفراح الملوك' : 'Enter Royal Celebrations'}</span>
              <span class="portal-prompt-kbd"><kbd>ENTER ↵</kbd></span>
            </button>
          </div>

          <div class="hallway-hud-footer">
            <button type="button" class="hallway-stepback-btn" data-action="hallway-step-back">
              <svg class="hallway-stepback-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M3 12a9 9 0 1 0 2.64-6.36L2 9m0-6v6h6"/>
              </svg>
              <span>${isAr ? 'إعادة التموضع بالبهو' : 'Reset Vantage'}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  `;
}
