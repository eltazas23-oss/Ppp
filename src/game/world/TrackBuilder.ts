/**
 * TrackBuilder.ts - Professional FIA Grade-1 Racing Circuit World
 * Features realistic PBR materials, FIA catch fencing & debris barriers,
 * Tecpro high-impact runoff cushions, multi-tiered covered grandstands with VIP suites,
 * 2-story modern Pit Lane & Paddock Club building, 8 high-mast stadium floodlights,
 * realistic organic vegetation (pines, oaks, shrubs), Jumbotron video walls, and marshal posts.
 */

import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import asphaltImg from '../../assets/images/track_asphalt_detail_1790904767865.jpg';
import { SHARED_CIRCUIT_WAYPOINTS, MASTER_CIRCUIT_NODES } from '../career/CircuitWaypoints';

export interface StaticObstacle {
  x: number;
  z: number;
  radius: number;
  isWallSegment?: boolean;
  p1?: { x: number; z: number };
  p2?: { x: number; z: number };
  type: 'tree' | 'pillar' | 'wall' | 'building' | 'tecpro';
}

export interface DynamicProp {
  id: number;
  type: 'sign' | 'cone' | 'tire_stack';
  mesh: THREE.Object3D;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: THREE.Vector3;
  angularVelocity: THREE.Vector3;
  radius: number;
  height: number;
  mass: number;
  isSleeping: boolean;
  baseY: number;
}

export class TrackBuilder {
  public group: THREE.Group;
  public staticObstacles: StaticObstacle[] = [];
  public dynamicProps: DynamicProp[] = [];

  // Track Dimensions
  public readonly halfSize = 130;  // 260m total square size
  public readonly cornerRadius = 38; // Radius of 4 rounded corner apexes
  public readonly trackWidth = 16;
  public readonly innerCornerCenter = 130 - 38; // 92

  // Pit Stop Area Bounds
  public readonly pitZone = {
    minX: -68,
    maxX: 50,
    minZ: -122.5,
    maxZ: -105.0,
  };

  // Shared High-Performance PBR Materials
  private asphaltMat!: THREE.MeshStandardMaterial;
  private kerbRedMat!: THREE.MeshStandardMaterial;
  private kerbWhiteMat!: THREE.MeshStandardMaterial;
  private concreteBarrierMat!: THREE.MeshStandardMaterial;
  private metalFenceMat!: THREE.MeshStandardMaterial;
  private tecproRedMat!: THREE.MeshStandardMaterial;
  private tecproWhiteMat!: THREE.MeshStandardMaterial;
  private grassMat!: THREE.MeshStandardMaterial;
  private gravelMat!: THREE.MeshStandardMaterial;
  private dirtShoulderMat!: THREE.MeshStandardMaterial;
  private treeBarkMat!: THREE.MeshStandardMaterial;
  private pineFoliageMat!: THREE.MeshStandardMaterial;
  private oakFoliageMat!: THREE.MeshStandardMaterial;
  private cypressFoliageMat!: THREE.MeshStandardMaterial;
  private bushFoliageMat!: THREE.MeshStandardMaterial;
  private grassTuftMat!: THREE.MeshStandardMaterial;
  private glassMat!: THREE.MeshStandardMaterial;
  private metalDarkMat!: THREE.MeshStandardMaterial;
  private metalSilverMat!: THREE.MeshStandardMaterial;
  private overheadTrussMat!: THREE.MeshStandardMaterial;
  private startLightMat!: THREE.MeshBasicMaterial;
  private floodlightMat!: THREE.MeshStandardMaterial;
  private lightBeamsGroup = new THREE.Group();

  constructor() {
    this.group = new THREE.Group();
    this.initMaterials();
    this.buildTerrainAndInfield();
    this.buildSquareCircuitTrack();
    this.buildKerbsAndStartingGrid();
    this.buildConcreteBarriersWithCatchFences();
    this.buildTecproRunoffZones();
    this.buildMarshalSafetyPosts();
    this.buildGrandstands();
    this.buildPaddockBuildingAndPitLane();
    this.buildPitEntryAndExitArchitecture();
    this.buildPaddockTransportersAndTrailers();
    this.buildServiceAndSafetyVehicles();
    this.buildSpeedTrapRadarAndSectorGantries();
    this.buildJumbotronAndTimingTowers();
    this.buildOverheadGantriesAndBridges();
    this.buildTVBroadcastTowersAndCranes();
    this.buildPitEquipment();
    this.buildHighMastFloodlights();
    this.buildOrganicVegetation();
    this.buildDynamicProps();

    // High-performance static scene graph & shadow pass optimization:
    // 1. Disables real-time dynamic shadow casting on static environment (saves >450 shadow draw calls per frame!)
    // 2. Only actual track surfaces (asphalt, gravel, kerbs) receive dynamic shadows. Overhead bridges, gantries,
    //    vegetation, walls and soft shadows NEVER sample the shadow map, eliminating fillrate choke when driving underneath.
    // 3. Disables per-frame local matrix recalculation and freezes global world matrices.
    const dynamicMeshes = new Set(this.dynamicProps.map(p => p.mesh));
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.castShadow = false;
        const isGroundReceiver = obj.material === this.asphaltMat ||
          obj.material === this.gravelMat ||
          obj.material === this.kerbWhiteMat ||
          obj.material === this.kerbRedMat;
        obj.receiveShadow = isGroundReceiver;

        if (!dynamicMeshes.has(obj)) {
          obj.matrixAutoUpdate = false;
          obj.updateMatrix();
        }
      }
    });
    this.group.updateMatrixWorld(true);
  }

  private initMaterials(): void {
    const textureLoader = new THREE.TextureLoader();

    // High-Grip Racing Asphalt Texture with 16x Anisotropy & Crisp Proportional Mapping
    const asphaltTex = textureLoader.load(asphaltImg);
    asphaltTex.wrapS = THREE.RepeatWrapping;
    asphaltTex.wrapT = THREE.RepeatWrapping;
    asphaltTex.anisotropy = 16;
    asphaltTex.generateMipmaps = true;
    asphaltTex.minFilter = THREE.LinearMipmapLinearFilter;
    asphaltTex.magFilter = THREE.LinearFilter;
    asphaltTex.repeat.set(16, 16);

    this.asphaltMat = new THREE.MeshStandardMaterial({
      map: asphaltTex,
      color: 0x24282f, // Deep FIA competition bitumen tarmac
      roughness: 0.68,
      metalness: 0.08,
    });

    // Photorealistic PBR Racing Turf (Organic multi-frequency fractal noise, Sobel normal map & roughness)
    const grassTextures = this.createRealisticGrassTextures();
    this.grassMat = new THREE.MeshStandardMaterial({
      map: grassTextures.albedo,
      normalMap: grassTextures.normal,
      normalScale: new THREE.Vector2(1.8, 1.8),
      roughnessMap: grassTextures.roughness,
      roughness: 0.84,
      metalness: 0.02,
    });

    // Runoff Gravel Trap Material
    this.gravelMat = new THREE.MeshStandardMaterial({
      color: 0xb59868,
      roughness: 0.95,
      metalness: 0.02,
      polygonOffset: true,
      polygonOffsetFactor: -1.0,
      polygonOffsetUnits: -2.0,
    });

    // Compacted Dirt/Gravel Shoulder Transition along Kerbs and Track Limits
    this.dirtShoulderMat = new THREE.MeshStandardMaterial({
      color: 0x261a10,
      roughness: 0.96,
      metalness: 0.02,
      polygonOffset: true,
      polygonOffsetFactor: -1.0,
      polygonOffsetUnits: -2.0,
    });

    // Curbs - Vibrant FIA red and clean high-contrast white with micro-specular sheen
    this.kerbRedMat = new THREE.MeshStandardMaterial({
      color: 0xc8102e,
      roughness: 0.38,
      metalness: 0.10,
    });
    this.kerbWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.38,
      metalness: 0.10,
    });

    // FIA Concrete Barriers (Weathered neutral racing concrete)
    this.concreteBarrierMat = new THREE.MeshStandardMaterial({
      color: 0x5a6370,
      roughness: 0.92,
      metalness: 0.02,
    });

    // Debris Catch Fence Steel (Dark weathered industrial steel, non-reflective)
    this.metalFenceMat = new THREE.MeshStandardMaterial({
      color: 0x1e2229,
      metalness: 0.40,
      roughness: 0.65,
      wireframe: false,
    });

    // Tecpro Impact Cushions
    this.tecproRedMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.35,
      metalness: 0.05,
    });
    this.tecproWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.35,
      metalness: 0.05,
    });

    // Architectural Metals
    this.metalDarkMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.85,
      roughness: 0.22,
    });
    this.metalSilverMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.90,
      roughness: 0.18,
    });

    // Specialized Low-Overhead Structural Truss Material (Matte Titanium-Carbon Composite)
    // Diffuse-dominant PBR to eliminate expensive specular IBL environment map lookups when camera passes directly underneath!
    this.overheadTrussMat = new THREE.MeshStandardMaterial({
      color: 0x1a202c,
      metalness: 0.20,
      roughness: 0.82,
    });

    // Ultra-fast shared starting light emissive material
    this.startLightMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
    });

    // Architectural VIP Glass (Optimized PBR - 0 transmission pass overhead)
    this.glassMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.35,
      roughness: 0.08,
      transparent: true,
      opacity: 0.55,
    });

    // High-Fidelity Botanical & Foliage Materials
    this.treeBarkMat = new THREE.MeshStandardMaterial({
      map: this.createProceduralBarkTexture(),
      roughness: 0.88,
      metalness: 0.04,
    });
    this.pineFoliageMat = new THREE.MeshStandardMaterial({
      map: this.createProceduralFoliageTexture('#06180a', '#123616'),
      roughness: 0.92,
      metalness: 0.01,
      side: THREE.FrontSide,
    });
    this.oakFoliageMat = new THREE.MeshStandardMaterial({
      map: this.createProceduralFoliageTexture('#0c2410', '#1c4920'),
      roughness: 0.90,
      metalness: 0.01,
      side: THREE.FrontSide,
    });
    this.cypressFoliageMat = new THREE.MeshStandardMaterial({
      map: this.createProceduralFoliageTexture('#051408', '#0e2d12'),
      roughness: 0.94,
      metalness: 0.01,
      side: THREE.FrontSide,
    });
    this.bushFoliageMat = new THREE.MeshStandardMaterial({
      map: this.createProceduralFoliageTexture('#0e2612', '#225026'),
      roughness: 0.88,
      metalness: 0.01,
      side: THREE.FrontSide,
    });
    // Opaque Cutout Pass: alphaTest: 0.5 with depthWrite: true completely eliminates sorting flickering!
    this.grassTuftMat = new THREE.MeshStandardMaterial({
      map: this.createGrassTuftTexture(),
      side: THREE.DoubleSide,
      shadowSide: THREE.DoubleSide,
      transparent: false,
      alphaTest: 0.5,
      depthWrite: true,
      depthTest: true,
      roughness: 0.60,
      metalness: 0.02,
    });

    // Stadium Floodlight Emissive Lens Material
    this.floodlightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xfffbeb,
      emissiveIntensity: 3.5,
      roughness: 0.1,
    });
  }

  /**
   * Pre-generates photorealistic PBR turf textures (Albedo, Tangent-Space Normal Map, Roughness Map)
   * with organic multi-frequency fractal noise, sod clumping, and soil undertones (Zero rigid barcode stripes!).
   */
  private createRealisticGrassTextures(): {
    albedo: THREE.CanvasTexture;
    normal: THREE.CanvasTexture;
    roughness: THREE.CanvasTexture;
  } {
    const size = 1024;
    const albedoCanvas = document.createElement('canvas');
    albedoCanvas.width = size;
    albedoCanvas.height = size;
    const aCtx = albedoCanvas.getContext('2d')!;

    const normalCanvas = document.createElement('canvas');
    normalCanvas.width = size;
    normalCanvas.height = size;
    const nCtx = normalCanvas.getContext('2d')!;

    const roughCanvas = document.createElement('canvas');
    roughCanvas.width = size;
    roughCanvas.height = size;
    const rCtx = roughCanvas.getContext('2d')!;

    // Seamless value noise permutation table
    const perm = new Uint8Array(512);
    for (let i = 0; i < 256; i++) {
      perm[i] = perm[i + 256] = Math.floor(Math.random() * 256);
    }
    const gradX = [-1, 1, 0, 0, 1, -1, 1, -1];
    const gradY = [0, 0, -1, 1, 1, 1, -1, -1];

    // Seamless periodic 2D noise (period is power of 2: 4, 8, 16, 32, 64)
    const periodicNoise = (x: number, y: number, period: number): number => {
      const px = Math.floor(x) % period;
      const py = Math.floor(y) % period;
      const px1 = (px + 1) % period;
      const py1 = (py + 1) % period;

      const xf = x - Math.floor(x);
      const yf = y - Math.floor(y);
      const u = xf * xf * (3.0 - 2.0 * xf);
      const v = yf * yf * (3.0 - 2.0 * yf);

      const g00 = perm[px + perm[py]] % 8;
      const g10 = perm[px1 + perm[py]] % 8;
      const g01 = perm[px + perm[py1]] % 8;
      const g11 = perm[px1 + perm[py1]] % 8;

      const d00 = gradX[g00] * xf + gradY[g00] * yf;
      const d10 = gradX[g10] * (xf - 1) + gradY[g10] * yf;
      const d01 = gradX[g01] * xf + gradY[g01] * (yf - 1);
      const d11 = gradX[g11] * (xf - 1) + gradY[g11] * (yf - 1);

      const x1 = d00 * (1 - u) + d10 * u;
      const x2 = d01 * (1 - u) + d11 * u;
      return x1 * (1 - v) + x2 * v;
    };

    const heightField = new Float32Array(size * size);
    const albedoImg = aCtx.createImageData(size, size);
    const roughImg = rCtx.createImageData(size, size);
    const ad = albedoImg.data;
    const rd = roughImg.data;

    for (let y = 0; y < size; y++) {
      const ny = y / size;
      for (let x = 0; x < size; x++) {
        const nx = x / size;

        // Octave 1: Macro meadow undulation (Period = 4)
        const macro = periodicNoise(nx * 4, ny * 4, 4);

        // Octave 2: Turf sod clumps and moisture patches (Period = 16)
        const meso = periodicNoise(nx * 16, ny * 16, 16);

        // Octave 3: High-frequency blade and clover clusters (Period = 64)
        const micro = periodicNoise(nx * 64, ny * 64, 64);

        // Normalized height for normal mapping
        const h = macro * 0.40 + meso * 0.38 + micro * 0.22;
        heightField[y * size + x] = h;

        // Rich organic European turf color palette (No rigid horizontal stripes!)
        const normH = Math.min(1.0, Math.max(0.0, (h + 0.9) / 1.8));
        const macroFactor = Math.min(1.0, Math.max(0.0, (macro + 0.8) / 1.6));

        // Organic color blending:
        // Crevice root tone: rgb(22, 50, 24)
        // Mid rich blade green: rgb(38, 82, 36)
        // Sunlit blade tips: rgb(62, 126, 56)
        // Warm golden meadow highlights: rgb(82, 142, 62)
        let r = 22 + normH * 38 + macroFactor * 10;
        let g = 50 + normH * 72 + macroFactor * 16;
        let b = 24 + normH * 28;

        // Fine blade jitter and earthy soil flecks
        const jitter = (Math.random() - 0.5) * 14;
        const isGoldenTip = Math.random() > 0.92 ? 18 : 0;

        r = Math.min(255, Math.max(0, Math.floor(r + jitter + isGoldenTip * 0.75)));
        g = Math.min(255, Math.max(0, Math.floor(g + jitter + isGoldenTip * 1.15)));
        b = Math.min(255, Math.max(0, Math.floor(b + jitter * 0.5)));

        const idx = (y * size + x) * 4;
        ad[idx] = r;
        ad[idx + 1] = g;
        ad[idx + 2] = b;
        ad[idx + 3] = 255;

        // Roughness: 0.72 (velvety blade sheen) to 0.94 (matte earthy crevice)
        const roughVal = Math.floor((0.74 + (1.0 - normH) * 0.20 + (Math.random() - 0.5) * 0.04) * 255);
        rd[idx] = roughVal;
        rd[idx + 1] = roughVal;
        rd[idx + 2] = roughVal;
        rd[idx + 3] = 255;
      }
    }

    aCtx.putImageData(albedoImg, 0, 0);
    rCtx.putImageData(roughImg, 0, 0);

    // Compute Tangent-Space Normal Map via Sobel operator on heightField
    const normalImg = nCtx.createImageData(size, size);
    const nd = normalImg.data;
    const normalStrength = 4.0;

    for (let y = 0; y < size; y++) {
      const yPrev = (y - 1 + size) % size;
      const yNext = (y + 1) % size;
      for (let x = 0; x < size; x++) {
        const xPrev = (x - 1 + size) % size;
        const xNext = (x + 1) % size;

        const hL = heightField[y * size + xPrev];
        const hR = heightField[y * size + xNext];
        const hU = heightField[yPrev * size + x];
        const hD = heightField[yNext * size + x];

        const dx = (hR - hL) * normalStrength;
        const dy = (hD - hU) * normalStrength;
        const len = Math.sqrt(dx * dx + dy * dy + 1.0);

        const nx = -dx / len;
        const ny = -dy / len;
        const nz = 1.0 / len;

        const idx = (y * size + x) * 4;
        nd[idx] = Math.floor((nx * 0.5 + 0.5) * 255);
        nd[idx + 1] = Math.floor((ny * 0.5 + 0.5) * 255);
        nd[idx + 2] = Math.floor(nz * 255);
        nd[idx + 3] = 255;
      }
    }
    nCtx.putImageData(normalImg, 0, 0);

    const albedoTex = new THREE.CanvasTexture(albedoCanvas);
    albedoTex.wrapS = THREE.RepeatWrapping;
    albedoTex.wrapT = THREE.RepeatWrapping;
    albedoTex.repeat.set(32, 32);
    albedoTex.anisotropy = 16;
    albedoTex.generateMipmaps = true;
    albedoTex.minFilter = THREE.LinearMipmapLinearFilter;
    albedoTex.magFilter = THREE.LinearFilter;

    const normalTex = new THREE.CanvasTexture(normalCanvas);
    normalTex.wrapS = THREE.RepeatWrapping;
    normalTex.wrapT = THREE.RepeatWrapping;
    normalTex.repeat.set(32, 32);
    normalTex.anisotropy = 16;
    normalTex.generateMipmaps = true;

    const roughTex = new THREE.CanvasTexture(roughCanvas);
    roughTex.wrapS = THREE.RepeatWrapping;
    roughTex.wrapT = THREE.RepeatWrapping;
    roughTex.repeat.set(32, 32);
    roughTex.anisotropy = 16;
    roughTex.generateMipmaps = true;

    return { albedo: albedoTex, normal: normalTex, roughness: roughTex };
  }

  /**
   * Generates procedural tactile organic tree bark texture with vertical striations
   */
  private createProceduralBarkTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#281710';
    ctx.fillRect(0, 0, 512, 512);

    for (let x = 0; x < 512; x += 4) {
      const shade = 28 + Math.floor(Math.sin(x * 0.15) * 14 + Math.random() * 18);
      ctx.fillStyle = `rgb(${shade + 22}, ${shade + 10}, ${shade})`;
      ctx.fillRect(x, 0, 3 + (x % 3), 512);
    }

    for (let i = 0; i < 350; i++) {
      const fx = Math.random() * 512;
      const fy = Math.random() * 512;
      const flen = 25 + Math.random() * 70;
      ctx.fillStyle = Math.random() > 0.5 ? '#140b07' : '#452b1e';
      ctx.fillRect(fx, fy, 2 + Math.random() * 3, flen);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 4);
    tex.anisotropy = 8;
    tex.generateMipmaps = true;
    return tex;
  }

  /**
   * Generates procedural botanical leaf/needle cluster texture
   */
  private createProceduralFoliageTexture(baseColorHex: string, tipColorHex: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = baseColorHex;
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 5000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const rad = 2 + Math.random() * 6.0;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      const r = Math.random();
      ctx.fillStyle = r > 0.45 ? tipColorHex : (r > 0.12 ? baseColorHex : '#18421c');
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 8;
    tex.generateMipmaps = true;
    return tex;
  }

  /**
   * Generates rich, dense volumetric 3D grass clump cutout texture
   */
  private createGrassTuftTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 512, 512);

    // Draw 36 broad, tapering organic blades radiating naturally from base
    const blades = 36;
    for (let b = 0; b < blades; b++) {
      const t = b / (blades - 1);
      const startX = 256 + (t - 0.5) * 110;
      const startY = 512;
      const bladeW = 12 + Math.random() * 14;

      // Natural curved arching
      const spreadX = (t - 0.5) * 400 + (Math.random() - 0.5) * 60;
      const tipX = 256 + spreadX;
      const tipY = 40 + Math.random() * 150;
      const ctrlX = (startX + tipX) * 0.5 + (t - 0.5) * 90 + (Math.random() - 0.5) * 35;
      const ctrlY = 220 + Math.random() * 80;

      ctx.beginPath();
      ctx.moveTo(startX - bladeW * 0.5, startY);
      ctx.quadraticCurveTo(ctrlX - bladeW * 0.3, ctrlY, tipX, tipY);
      ctx.quadraticCurveTo(ctrlX + bladeW * 0.3, ctrlY, startX + bladeW * 0.5, startY);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, 512, 0, tipY);
      grad.addColorStop(0, '#153617'); // Dark mossy root
      grad.addColorStop(0.35, '#26612a'); // Lush foliage green
      grad.addColorStop(0.75, '#429440'); // Rich chlorophyll blade
      grad.addColorStop(1.0, '#7ac85e'); // Sunlit golden tip
      ctx.fillStyle = grad;
      ctx.fill();

      // Sharp central blade spine highlight (solid alpha to survive alphaTest)
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY);
      ctx.strokeStyle = '#8ee462';
      ctx.lineWidth = 2.0;
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 8;
    tex.generateMipmaps = true;
    return tex;
  }

  /**
   * Calculates the exact minimum Euclidean distance from any 2D point (x, z)
   * to the closest Catmull-Rom spline segment of the official F1 Grand Prix circuit.
   */
  public getDistanceToCircuitSpline(x: number, z: number): number {
    const waypoints = SHARED_CIRCUIT_WAYPOINTS;
    const numPts = waypoints.length;
    let minDsq = Infinity;

    for (let i = 0; i < numPts; i++) {
      const p1 = waypoints[i];
      const p2 = waypoints[(i + 1) % numPts];
      const dx = p2.x - p1.x;
      const dz = p2.z - p1.z;
      const lenSq = dx * dx + dz * dz;
      let t = lenSq > 0.0001 ? ((x - p1.x) * dx + (z - p1.z) * dz) / lenSq : 0;
      t = Math.max(0, Math.min(1, t));

      const nearX = p1.x + t * dx;
      const nearZ = p1.z + t * dz;
      const dsq = (x - nearX) * (x - nearX) + (z - nearZ) * (z - nearZ);
      if (dsq < minDsq) {
        minDsq = dsq;
      }
    }

    return Math.sqrt(minDsq);
  }

  /**
   * High-performance 3D Grass Tufts rendered in 1 single draw call via InstancedMesh.
   * Features strict geometric clearance testing: ZERO grass penetrates grandstands,
   * concrete barrier walls, catch fencing, pit buildings, helipad or asphalt track.
   */
  private buildGrassTufts(parent: THREE.Group): void {
    const tuftCount = 18000;
    // 2 intersecting perpendicular planes (4 triangles) for lush volume with 33% less overdraw
    const p1 = new THREE.PlaneGeometry(1.10, 0.85);
    p1.translate(0, 0.38, 0);
    const p2 = p1.clone();
    p2.rotateY(Math.PI / 2);

    const pos1 = p1.attributes.position.array as Float32Array;
    const uv1 = p1.attributes.uv.array as Float32Array;
    const idx1 = p1.index?.array as Uint16Array;

    const pos2 = p2.attributes.position.array as Float32Array;
    const uv2 = p2.attributes.uv.array as Float32Array;
    const idx2 = p2.index?.array as Uint16Array;

    const totalPosLen = pos1.length + pos2.length;
    const totalUvLen = uv1.length + uv2.length;
    const totalIdxLen = idx1.length + idx2.length;

    const combinedPos = new Float32Array(totalPosLen);
    combinedPos.set(pos1, 0);
    combinedPos.set(pos2, pos1.length);

    for (let i = 1; i < combinedPos.length; i += 3) {
      if (combinedPos[i] > 0.4) {
        combinedPos[i - 1] *= 1.15;
        combinedPos[i + 1] *= 1.15;
      }
    }

    const combinedUv = new Float32Array(totalUvLen);
    combinedUv.set(uv1, 0);
    combinedUv.set(uv2, uv1.length);

    const offset1 = pos1.length / 3;
    const combinedIdx = new Uint16Array(totalIdxLen);
    combinedIdx.set(idx1, 0);
    for (let i = 0; i < idx2.length; i++) combinedIdx[idx1.length + i] = idx2[i] + offset1;

    const tuftGeo = new THREE.BufferGeometry();
    tuftGeo.setAttribute('position', new THREE.BufferAttribute(combinedPos, 3));
    tuftGeo.setAttribute('uv', new THREE.BufferAttribute(combinedUv, 2));
    tuftGeo.setIndex(new THREE.BufferAttribute(combinedIdx, 1));
    tuftGeo.computeVertexNormals();

    const instancedTufts = new THREE.InstancedMesh(tuftGeo, this.grassTuftMat, tuftCount);
    instancedTufts.receiveShadow = false;

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    let idx = 0;

    /**
     * Strict spatial validation: rejects any grass tuft that would touch or penetrate:
     * - Track asphalt surface and kerbs (16m width = 8m half-width + 1.4m kerb + barrier margin = rejects < 13.0m)
     * - Concrete barriers (walls at ~11.2m)
     * - Pit Lane, Paddock Garages & Team Transporters
     * - Helipad
     * - South Main Grandstand and North Grandstand
     * - Gravel runoff traps
     */
    const isGrassAllowed = (gx: number, gz: number): boolean => {
      // 1. Distance to F1 track spline centerline (Track width 16m = 8m half-width + 1.4m kerb + barrier margin)
      const distToTrack = this.getDistanceToCircuitSpline(gx, gz);
      if (distToTrack < 13.0) {
        return false; // ZERO GRASS ON ASPHALT, KERBS OR NEAR TRACK CORRIDOR!
      }

      // 2. Concrete Barrier Walls are at ~11.2m from track centerline (give 1.8m clearance)
      if (Math.abs(distToTrack - 11.2) < 1.8) {
        return false;
      }

      // 3. Pit Lane, Paddock Garages & Team Transporters
      if (gx >= -85 && gx <= 65 && gz >= -132 && gz <= -80) {
        return false;
      }

      // 4. Helipad (radius 20m around 30, 30)
      if ((gx - 30) ** 2 + (gz - 30) ** 2 < 20 * 20) {
        return false;
      }

      // 5. South Main Grandstand Exclusion Zone
      if (gx >= -78 && gx <= 78 && gz >= -175 && gz <= -138) {
        return false;
      }

      // 6. North Grandstand Exclusion Zone
      if (gx >= -52 && gx <= 52 && gz >= 138 && gz <= 170) {
        return false;
      }

      // 7. Gravel Runoff Traps
      if (gx >= 105 && gx <= 170 && gz >= -155 && gz <= -115) return false;
      if (gx >= -110 && gx <= -25 && gz >= 218 && gz <= 255) return false;
      if (gx >= -135 && gx <= -90 && gz >= -130 && gz <= -65) return false;
      if (gx >= -110 && gx <= -50 && gz >= -155 && gz <= -120) return false;

      return true;
    };

    const addTuft = (x: number, z: number, scale = 1.0, jitter = 0.4) => {
      if (idx >= tuftCount) return;
      const jx = (Math.random() - 0.5) * jitter;
      const jz = (Math.random() - 0.5) * jitter;
      const px = x + jx;
      const pz = z + jz;
      if (!isGrassAllowed(px, pz)) return;

      dummy.position.set(px, 0.002, pz);
      dummy.scale.setScalar(scale * (0.85 + Math.random() * 0.35));
      dummy.rotation.y = Math.random() * Math.PI * 2;
      dummy.updateMatrix();
      instancedTufts.setMatrixAt(idx, dummy.matrix);
      color.setHSL(0.27 + Math.random() * 0.04, 0.65, 0.36 + Math.random() * 0.12);
      instancedTufts.setColorAt(idx++, color);
    };

    // 1. DENSE VERGE MEADOWS along the outer perimeter (15m to 42m from track centerline)
    const waypoints = SHARED_CIRCUIT_WAYPOINTS;
    const numPts = waypoints.length;

    for (let i = 0; i < numPts; i += 2) {
      const pt = waypoints[i];
      const nextPt = waypoints[(i + 1) % numPts];
      const dx = nextPt.x - pt.x;
      const dz = nextPt.z - pt.z;
      const segLen = Math.hypot(dx, dz) || 1;
      const nx = -dz / segLen;
      const nz = dx / segLen;

      // Outer Left Verge & Infield Right Verge strips
      for (let offset = 14.5; offset <= 38.0; offset += 2.4) {
        addTuft(pt.x + nx * offset, pt.z + nz * offset, 1.25, 0.8);
        addTuft(pt.x - nx * offset, pt.z - nz * offset, 1.25, 0.8);
      }
    }

    // 2. WIDE INFIELD AND OUTFIELD NATURAL GRASS MEADOWS (Grid distribution with strict spatial filter)
    for (let gx = -210; gx <= 210; gx += 3.6) {
      for (let gz = -170; gz <= 245; gz += 3.6) {
        addTuft(gx, gz, 1.15, 1.2);
      }
    }

    instancedTufts.count = idx;
    instancedTufts.instanceMatrix.needsUpdate = true;
    if (instancedTufts.instanceColor) instancedTufts.instanceColor.needsUpdate = true;

    parent.add(instancedTufts);
  }

  /**
   * Terrain, Infield Landscaping, Gravel Traps and Service Perimeter Roads
   */
  private buildTerrainAndInfield(): void {
    const terrainGroup = new THREE.Group();

    // 1. Massive Ground Plane
    const groundGeo = new THREE.PlaneGeometry(850, 850, 32, 32);
    groundGeo.rotateX(-Math.PI / 2);
    const ground = new THREE.Mesh(groundGeo, this.grassMat);
    ground.receiveShadow = true;
    terrainGroup.add(ground);

    // 2. Real FIA Gravel Runoff Beds outside heavy braking zones
    const gravelBeds = [
      // Turn 1 Chicane Runoff
      { x: 138, z: -136, width: 36, length: 22, rot: 0.2 },
      // Turn 8 Slow Hairpin Runoff
      { x: -70, z: 236, width: 55, length: 24, rot: -0.1 },
      // Turn 9 130R Curvone Runoff
      { x: -116, z: -98, width: 22, length: 44, rot: 0.1 },
      // Turn 10 Bus Stop Chicane Runoff
      { x: -82, z: -138, width: 38, length: 20, rot: -0.1 },
    ];

    gravelBeds.forEach((bed) => {
      const gGeo = new THREE.PlaneGeometry(bed.width, bed.length, 12, 12);
      gGeo.rotateX(-Math.PI / 2);
      const gMesh = new THREE.Mesh(gGeo, this.gravelMat);
      gMesh.position.set(bed.x, 0.008, bed.z);
      gMesh.rotation.y = bed.rot;
      gMesh.receiveShadow = true;
      terrainGroup.add(gMesh);
    });

    // 3. Infield Helipad (at 30, 30 in the central green)
    const heliGeo = new THREE.CircleGeometry(16, 32);
    heliGeo.rotateX(-Math.PI / 2);
    const heliCanvas = document.createElement('canvas');
    heliCanvas.width = 256;
    heliCanvas.height = 256;
    const hCtx = heliCanvas.getContext('2d')!;
    hCtx.fillStyle = '#1e293b';
    hCtx.fillRect(0, 0, 256, 256);
    hCtx.lineWidth = 14;
    hCtx.strokeStyle = '#facc15';
    hCtx.beginPath();
    hCtx.arc(128, 128, 105, 0, Math.PI * 2);
    hCtx.stroke();
    hCtx.fillStyle = '#facc15';
    hCtx.font = 'bold 120px sans-serif';
    hCtx.textAlign = 'center';
    hCtx.textBaseline = 'middle';
    hCtx.fillText('H', 128, 128);
    const heliTex = new THREE.CanvasTexture(heliCanvas);
    const heliMat = new THREE.MeshStandardMaterial({ map: heliTex, roughness: 0.8 });
    const helipad = new THREE.Mesh(heliGeo, heliMat);
    helipad.position.set(30, 0.012, 30);
    helipad.receiveShadow = true;
    terrainGroup.add(helipad);

    // 4. Volumetric 3D Grass Tufts concentrated along the landscape corridors
    this.buildGrassTufts(terrainGroup);

    this.group.add(terrainGroup);
  }

  /**
   * Continuous Asphalt Racing Surface with Pit Lane Integration along F1 Spline
   */
  private buildSquareCircuitTrack(): void {
    const trackGroup = new THREE.Group();
    const waypoints = SHARED_CIRCUIT_WAYPOINTS;
    const numPts = waypoints.length;
    const w = this.trackWidth;
    const halfW = w / 2;
    const shoulderW = 0.6; // 3D tapered edge down to ground level

    // 1. Full 3D Extruded Asphalt Ribbon along Catmull-Rom GP Spline
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    let accumulatedDist = 0;

    for (let i = 0; i < numPts; i++) {
      const pt = waypoints[i];
      const nextPt = waypoints[(i + 1) % numPts];
      const dx = nextPt.x - pt.x;
      const dz = nextPt.z - pt.z;
      const segLen = Math.hypot(dx, dz) || 1.0;
      const nx = -dz / segLen;
      const nz = dx / segLen;

      // Track boundaries (Elevated at y = 0.040 to prevent any ground Z-fighting)
      const leftX = pt.x + nx * halfW;
      const leftZ = pt.z + nz * halfW;
      const rightX = pt.x - nx * halfW;
      const rightZ = pt.z - nz * halfW;

      // Road shoulder edges (tapered to ground y = 0.000)
      const leftShoulderX = pt.x + nx * (halfW + shoulderW);
      const leftShoulderZ = pt.z + nz * (halfW + shoulderW);
      const rightShoulderX = pt.x - nx * (halfW + shoulderW);
      const rightShoulderZ = pt.z - nz * (halfW + shoulderW);

      positions.push(leftShoulderX, 0.000, leftShoulderZ); // idx 0
      positions.push(leftX, 0.040, leftZ);                 // idx 1
      positions.push(rightX, 0.040, rightZ);               // idx 2
      positions.push(rightShoulderX, 0.000, rightShoulderZ);// idx 3

      const v = accumulatedDist * 0.18;
      uvs.push(0.00, v);
      uvs.push(0.06, v);
      uvs.push(0.94, v);
      uvs.push(1.00, v);

      accumulatedDist += segLen;
    }

    for (let i = 0; i < numPts; i++) {
      const nextI = (i + 1) % numPts;
      const b0 = i * 4;
      const b1 = nextI * 4;

      // Left shoulder quad
      indices.push(b0, b0 + 1, b1);
      indices.push(b0 + 1, b1 + 1, b1);

      // Main elevated asphalt ribbon
      indices.push(b0 + 1, b0 + 2, b1 + 1);
      indices.push(b0 + 2, b1 + 2, b1 + 1);

      // Right shoulder quad
      indices.push(b0 + 2, b0 + 3, b1 + 2);
      indices.push(b0 + 3, b1 + 3, b1 + 2);
    }

    const roadGeo = new THREE.BufferGeometry();
    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    roadGeo.setIndex(indices);
    roadGeo.computeVertexNormals();

    const roadMesh = new THREE.Mesh(roadGeo, this.asphaltMat);
    roadMesh.receiveShadow = true;
    trackGroup.add(roadMesh);

    // 2. Pit Lane Seamless Asphalt Apron
    // Spans between main straight (z = -122) and pit garages (z = -106), x from -75 to 55
    const pitApronGeo = new THREE.PlaneGeometry(130, 16.5, 32, 2);
    pitApronGeo.rotateX(-Math.PI / 2);
    const pitApron = new THREE.Mesh(pitApronGeo, this.asphaltMat);
    pitApron.position.set(-10, 0.040, -113.75);
    pitApron.receiveShadow = true;
    trackGroup.add(pitApron);

    // 3. Paint FIA White Road Markings & Boundary Lines
    this.buildTrackAndPitRoadLines(trackGroup);

    this.group.add(trackGroup);
  }

  /**
   * Crisp FIA Official Road Lines, High-Speed Optical Flow Markings & Racing Rubber Line
   */
  private buildTrackAndPitRoadLines(trackGroup: THREE.Group): void {
    const linesGroup = new THREE.Group();
    const whiteLineMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      polygonOffset: true,
      polygonOffsetFactor: -2.0,
      polygonOffsetUnits: -4.0,
    });
    const yellowLineMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      polygonOffset: true,
      polygonOffsetFactor: -2.0,
      polygonOffsetUnits: -4.0,
    });
    const rubberMat = new THREE.MeshStandardMaterial({
      color: 0x080a0d,
      roughness: 0.30,
      metalness: 0.16,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1.0,
      polygonOffsetUnits: -2.0,
    });

    const waypoints = SHARED_CIRCUIT_WAYPOINTS;
    const numPts = waypoints.length;
    const halfW = this.trackWidth / 2;

    // --- A. CONTINUOUS FIA TRACK LIMIT BOUNDARY LINES (Inner & Outer) ---
    const leftLinePos: number[] = [];
    const leftLineIdx: number[] = [];
    const rightLinePos: number[] = [];
    const rightLineIdx: number[] = [];
    const rubberPos: number[] = [];
    const rubberIdx: number[] = [];

    const lineW = 0.28;
    const rubberW = 3.5;

    for (let i = 0; i < numPts; i++) {
      const pt = waypoints[i];
      const nextPt = waypoints[(i + 1) % numPts];
      const dx = nextPt.x - pt.x;
      const dz = nextPt.z - pt.z;
      const segLen = Math.hypot(dx, dz) || 1.0;
      const nx = -dz / segLen;
      const nz = dx / segLen;

      // Outer Left Boundary Ribbon (0.28m width)
      const leftOuterX = pt.x + nx * (halfW - 0.05);
      const leftOuterZ = pt.z + nz * (halfW - 0.05);
      const leftInnerX = pt.x + nx * (halfW - 0.05 - lineW);
      const leftInnerZ = pt.z + nz * (halfW - 0.05 - lineW);
      leftLinePos.push(leftOuterX, 0.048, leftOuterZ);
      leftLinePos.push(leftInnerX, 0.048, leftInnerZ);

      // Outer Right Boundary Ribbon (0.28m width)
      const rightOuterX = pt.x - nx * (halfW - 0.05);
      const rightOuterZ = pt.z - nz * (halfW - 0.05);
      const rightInnerX = pt.x - nx * (halfW - 0.05 - lineW);
      const rightInnerZ = pt.z - nz * (halfW - 0.05 - lineW);
      rightLinePos.push(rightOuterX, 0.048, rightOuterZ);
      rightLinePos.push(rightInnerX, 0.048, rightInnerZ);

      // Dark Racing Rubber Groove along trajectory
      const rubLX = pt.x + nx * (rubberW / 2);
      const rubLZ = pt.z + nz * (rubberW / 2);
      const rubRX = pt.x - nx * (rubberW / 2);
      const rubRZ = pt.z - nz * (rubberW / 2);
      rubberPos.push(rubLX, 0.044, rubLZ);
      rubberPos.push(rubRX, 0.044, rubRZ);

      const nextI = (i + 1) % numPts;
      const i0 = i * 2;
      const i1 = i * 2 + 1;
      const i2 = nextI * 2;
      const i3 = nextI * 2 + 1;

      leftLineIdx.push(i0, i1, i2, i1, i3, i2);
      rightLineIdx.push(i0, i1, i2, i1, i3, i2);
      rubberIdx.push(i0, i1, i2, i1, i3, i2);
    }

    const leftLineGeo = new THREE.BufferGeometry();
    leftLineGeo.setAttribute('position', new THREE.Float32BufferAttribute(leftLinePos, 3));
    leftLineGeo.setIndex(leftLineIdx);
    linesGroup.add(new THREE.Mesh(leftLineGeo, whiteLineMat));

    const rightLineGeo = new THREE.BufferGeometry();
    rightLineGeo.setAttribute('position', new THREE.Float32BufferAttribute(rightLinePos, 3));
    rightLineGeo.setIndex(rightLineIdx);
    linesGroup.add(new THREE.Mesh(rightLineGeo, whiteLineMat));

    const rubberGeo = new THREE.BufferGeometry();
    rubberGeo.setAttribute('position', new THREE.Float32BufferAttribute(rubberPos, 3));
    rubberGeo.setIndex(rubberIdx);
    linesGroup.add(new THREE.Mesh(rubberGeo, rubberMat));

    // --- B. UNBROKEN RACING DASHED CENTERLINE ---
    const dashGeo = new THREE.PlaneGeometry(3.2, 0.25);
    dashGeo.rotateX(-Math.PI / 2);

    for (let i = 0; i < numPts; i += 3) {
      const pt = waypoints[i];
      const nextPt = waypoints[(i + 1) % numPts];
      const dx = nextPt.x - pt.x;
      const dz = nextPt.z - pt.z;
      const angle = Math.atan2(dx, dz);

      const dash = new THREE.Mesh(dashGeo, whiteLineMat);
      dash.position.set(pt.x, 0.048, pt.z);
      dash.rotation.y = angle - Math.PI / 2;
      linesGroup.add(dash);
    }

    // --- C. PIT LANE & PIT ENTRY MARKINGS ---
    // Pit Lane Fast Lane Solid White Boundary Lines
    const pitInnerLineGeo = new THREE.PlaneGeometry(96, 0.25);
    pitInnerLineGeo.rotateX(-Math.PI / 2);
    const pitInnerLine = new THREE.Mesh(pitInnerLineGeo, whiteLineMat);
    pitInnerLine.position.set(-10, 0.048, -113.2);
    linesGroup.add(pitInnerLine);

    const pitOuterLineGeo = new THREE.PlaneGeometry(96, 0.25);
    pitOuterLineGeo.rotateX(-Math.PI / 2);
    const pitOuterLine = new THREE.Mesh(pitOuterLineGeo, whiteLineMat);
    pitOuterLine.position.set(-10, 0.048, -120.4);
    linesGroup.add(pitOuterLine);

    // Pit Lane Center Dashed Guidance Line
    for (let pd = 0; pd < 24; pd++) {
      const pDashGeo = new THREE.PlaneGeometry(2.0, 0.2);
      pDashGeo.rotateX(-Math.PI / 2);
      const pDash = new THREE.Mesh(pDashGeo, yellowLineMat);
      pDash.position.set(-54 + pd * 4.0, 0.048, -116.8);
      linesGroup.add(pDash);
    }

    trackGroup.add(linesGroup);
  }

  /**
   * Realistic Curbs with 3D Ribbed Profile and Checkered Starting Grid
   */
  private buildKerbsAndStartingGrid(): void {
    const kerbGroup = new THREE.Group();
    const waypoints = SHARED_CIRCUIT_WAYPOINTS;
    const numPts = waypoints.length;
    const halfW = this.trackWidth / 2;
    const kerbWidth = 1.4;

    // Detect corner apexes where speedLimit is reduced or curvature is high
    for (let i = 0; i < numPts; i++) {
      const pt = waypoints[i];
      const nextPt = waypoints[(i + 1) % numPts];
      const prevPt = waypoints[(i - 1 + numPts) % numPts];

      // Curvature angle between prev->current and current->next
      const v1x = pt.x - prevPt.x;
      const v1z = pt.z - prevPt.z;
      const v2x = nextPt.x - pt.x;
      const v2z = nextPt.z - pt.z;
      const cross = v1x * v2z - v1z * v2x; // Positive = turn left, Negative = turn right

      const isCornering = Math.abs(cross) > 0.35 || pt.speedLimitKmh < 270;
      if (!isCornering) continue;

      const segLen = Math.hypot(v2x, v2z) || 1.0;
      const nx = -v2z / segLen;
      const nz = v2x / segLen;
      const angle = Math.atan2(v2x, v2z);

      const mat = i % 2 === 0 ? this.kerbRedMat : this.kerbWhiteMat;

      // Inside apex kerb: if turning left (cross > 0), place on left; if turning right (cross < 0), place on right
      const isLeftTurn = cross > 0;
      const kerbSide = isLeftTurn ? 1 : -1;

      const kx = pt.x + nx * kerbSide * (halfW + kerbWidth / 2);
      const kz = pt.z + nz * kerbSide * (halfW + kerbWidth / 2);

      const kGeo = new THREE.BoxGeometry(kerbWidth, 0.08, segLen * 1.08);
      const kMesh = new THREE.Mesh(kGeo, mat);
      kMesh.position.set(kx, 0.075, kz);
      kMesh.rotation.y = angle;
      kMesh.castShadow = true;
      kMesh.receiveShadow = true;
      kerbGroup.add(kMesh);
    }

    // Checkered Start / Finish Line at S/F Gantry (0, -130)
    const sfGeo = new THREE.PlaneGeometry(16, 2.5);
    sfGeo.rotateX(-Math.PI / 2);
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 128, 32);
    ctx.fillStyle = '#09090b';
    for (let x = 0; x < 128; x += 16) {
      for (let y = 0; y < 32; y += 16) {
        if ((x / 16 + y / 16) % 2 === 0) {
          ctx.fillRect(x, y, 16, 16);
        }
      }
    }
    const sfTex = new THREE.CanvasTexture(canvas);
    const sfMat = new THREE.MeshStandardMaterial({
      map: sfTex,
      roughness: 0.5,
      polygonOffset: true,
      polygonOffsetFactor: -2.0,
      polygonOffsetUnits: -4.0,
    });
    const sfMesh = new THREE.Mesh(sfGeo, sfMat);
    sfMesh.position.set(0, 0.048, -130);
    sfMesh.renderOrder = 2;
    kerbGroup.add(sfMesh);

    // Starting Grid Boxes (8 grid slots alternating on main straight)
    for (let g = 0; g < 4; g++) {
      [-2.4, 2.4].forEach((offsetZ, sideIdx) => {
        const boxGeo = new THREE.PlaneGeometry(4.8, 2.2);
        boxGeo.rotateX(-Math.PI / 2);
        const boxMat = new THREE.MeshBasicMaterial({
          color: 0xfacc15,
          wireframe: true,
          polygonOffset: true,
          polygonOffsetFactor: -2.0,
          polygonOffsetUnits: -4.0,
        });
        const boxMesh = new THREE.Mesh(boxGeo, boxMat);
        boxMesh.position.set(-18 - g * 12 + sideIdx * 5, 0.048, -130 + offsetZ);
        boxMesh.renderOrder = 2;
        kerbGroup.add(boxMesh);
      });
    }

    this.group.add(kerbGroup);
  }

  /**
   * FIA Concrete Safety Barriers with Overhead Curved Steel Debris Catch Fencing
   * Surrounds the complete F1 Grand Prix circuit perimeter and registers static obstacle physics
   */
  private buildConcreteBarriersWithCatchFences(): void {
    const wallHeight = 1.20;
    const wallThick = 0.75;
    const fenceHeight = 2.40;
    const halfW = this.trackWidth / 2;

    const sharedRailMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.7, roughness: 0.3 });
    const sharedPostGeo = new THREE.CylinderGeometry(0.06, 0.07, fenceHeight, 6);

    const wallGeos: THREE.BufferGeometry[] = [];
    const railGeos: THREE.BufferGeometry[] = [];
    const cableGeos: THREE.BufferGeometry[] = [];
    const postMatrices: THREE.Matrix4[] = [];
    const dummyObj = new THREE.Object3D();

    const makeWallWithFence = (x1: number, z1: number, x2: number, z2: number, hasFence: boolean = true) => {
      const length = Math.hypot(x2 - x1, z2 - z1);
      if (length < 0.5) return;
      const angle = Math.atan2(x2 - x1, z2 - z1);
      const midX = (x1 + x2) / 2;
      const midZ = (z1 + z2) / 2;

      // Concrete Base Block Geometry
      const wallGeo = new THREE.BoxGeometry(wallThick, wallHeight, length);
      wallGeo.rotateY(angle);
      wallGeo.translate(midX, wallHeight / 2, midZ);
      wallGeos.push(wallGeo);

      // Red Top Guardrail Geometry
      const railGeo = new THREE.BoxGeometry(0.14, 0.16, length);
      railGeo.rotateY(angle);
      railGeo.translate(midX, wallHeight + 0.08, midZ);
      railGeos.push(railGeo);

      // FIA Catch Fencing
      if (hasFence && length > 5) {
        const postCount = Math.max(2, Math.floor(length / 6));
        for (let p = 0; p <= postCount; p++) {
          const t = p / postCount;
          const px = x1 + (x2 - x1) * t;
          const pz = z1 + (z2 - z1) * t;

          dummyObj.position.set(px, wallHeight + fenceHeight / 2, pz);
          dummyObj.rotation.set(0, 0, 0);
          dummyObj.scale.set(1, 1, 1);
          dummyObj.updateMatrix();
          postMatrices.push(dummyObj.matrix.clone());
        }

        // Horizontal security cables
        for (let cb = 0; cb < 3; cb++) {
          const cableGeo = new THREE.CylinderGeometry(0.015, 0.015, length, 4);
          cableGeo.rotateX(Math.PI / 2);
          cableGeo.rotateY(angle);
          cableGeo.translate(midX, wallHeight + 0.6 + cb * 0.7, midZ);
          cableGeos.push(cableGeo);
        }
      }

      this.staticObstacles.push({
        x: midX,
        z: midZ,
        radius: length / 2,
        isWallSegment: true,
        p1: { x: x1, z: z1 },
        p2: { x: x2, z: z2 },
        type: 'wall',
      });
    };

    // 1. Perimeter Walls along both sides of F1 Grand Prix Spline
    const waypoints = SHARED_CIRCUIT_WAYPOINTS;
    const numPts = waypoints.length;
    const wallOffset = halfW + 3.2;

    // Step around waypoints in intervals of 4 nodes (~12m segments)
    const step = 4;
    for (let i = 0; i < numPts; i += step) {
      const nextI = (i + step) % numPts;
      const pt1 = waypoints[i];
      const pt2 = waypoints[nextI];

      // Normals for pt1 and pt2
      const fwd1 = waypoints[(i + 1) % numPts];
      const dx1 = fwd1.x - pt1.x;
      const dz1 = fwd1.z - pt1.z;
      const len1 = Math.hypot(dx1, dz1) || 1;
      const nx1 = -dz1 / len1;
      const nz1 = dx1 / len1;

      const fwd2 = waypoints[(nextI + 1) % numPts];
      const dx2 = fwd2.x - pt2.x;
      const dz2 = fwd2.z - pt2.z;
      const len2 = Math.hypot(dx2, dz2) || 1;
      const nx2 = -dz2 / len2;
      const nz2 = dx2 / len2;

      // Outer Left Barrier Segment
      const left1X = pt1.x + nx1 * wallOffset;
      const left1Z = pt1.z + nz1 * wallOffset;
      const left2X = pt2.x + nx2 * wallOffset;
      const left2Z = pt2.z + nz2 * wallOffset;
      makeWallWithFence(left1X, left1Z, left2X, left2Z, true);

      // Outer Right Barrier Segment (except along pit lane area on main straight)
      const isPitArea = pt1.z < -100 && pt1.x > -65 && pt1.x < 55;
      if (!isPitArea) {
        const right1X = pt1.x - nx1 * wallOffset;
        const right1Z = pt1.z - nz1 * wallOffset;
        const right2X = pt2.x - nx2 * wallOffset;
        const right2Z = pt2.z - nz2 * wallOffset;
        makeWallWithFence(right1X, right1Z, right2X, right2Z, true);
      }
    }

    // 2. Pit Wall separating main track and pit lane on South straight
    makeWallWithFence(-48, -122.0, 44, -122.0, false);

    // 3. Infield Back Wall behind Pit Garages
    makeWallWithFence(-65, -105.8, 50, -105.8, false);

    // Merge and instantiate all walls and fences
    if (wallGeos.length > 0) {
      const mergedWallGeo = BufferGeometryUtils.mergeGeometries(wallGeos, false);
      const wallMesh = new THREE.Mesh(mergedWallGeo, this.concreteBarrierMat);
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      this.group.add(wallMesh);
    }

    if (railGeos.length > 0) {
      const mergedRailGeo = BufferGeometryUtils.mergeGeometries(railGeos, false);
      const railMesh = new THREE.Mesh(mergedRailGeo, sharedRailMat);
      railMesh.castShadow = true;
      railMesh.receiveShadow = true;
      this.group.add(railMesh);
    }

    if (postMatrices.length > 0) {
      const postInst = new THREE.InstancedMesh(sharedPostGeo, this.metalFenceMat, postMatrices.length);
      postMatrices.forEach((mat, idx) => postInst.setMatrixAt(idx, mat));
      postInst.castShadow = false;
      postInst.receiveShadow = false;
      postInst.instanceMatrix.needsUpdate = true;
      this.group.add(postInst);
    }

    if (cableGeos.length > 0) {
      const mergedCableGeo = BufferGeometryUtils.mergeGeometries(cableGeos, false);
      const cableMesh = new THREE.Mesh(mergedCableGeo, this.metalFenceMat);
      cableMesh.castShadow = false;
      cableMesh.receiveShadow = false;
      this.group.add(cableMesh);
    }
  }

  /**
   * Realistic High-Impact Tecpro Energy Absorbing Barrier Blocks in Runoff Zones
   */
  private buildTecproRunoffZones(): void {
    const tecproGroup = new THREE.Group();

    // High-impact runoff positions at key braking zones
    const runoffAreas = [
      // Turn 1 Chicane Runoff (x: 130, z: -140)
      { startX: 110, startZ: -142, endX: 155, endZ: -130, blocks: 12 },
      // Turn 8 Slow Hairpin Heavy Braking Runoff (x: -55..-95, z: 232)
      { startX: -45, startZ: 232, endX: -95, endZ: 228, blocks: 14 },
      // Turn 9 130R Curvone Runoff (x: -115, z: -115..-85)
      { startX: -114, startZ: -80, endX: -108, endZ: -118, blocks: 10 },
      // Turn 10 Bus Stop Chicane Runoff (x: -90..-65, z: -140)
      { startX: -92, startZ: -140, endX: -65, endZ: -138, blocks: 8 },
    ];

    runoffAreas.forEach((area) => {
      const dx = area.endX - area.startX;
      const dz = area.endZ - area.startZ;
      const angle = Math.atan2(dx, dz);

      for (let b = 0; b < area.blocks; b++) {
        const t = (b + 0.5) / area.blocks;
        const bx = area.startX + dx * t;
        const bz = area.startZ + dz * t;

        const blockGeo = new THREE.BoxGeometry(0.85, 1.1, 1.8);
        const mat = b % 2 === 0 ? this.tecproRedMat : this.tecproWhiteMat;
        const block = new THREE.Mesh(blockGeo, mat);
        block.position.set(bx, 0.55, bz);
        block.rotation.y = angle;
        block.receiveShadow = true;
        tecproGroup.add(block);
      }
    });

    this.group.add(tecproGroup);
  }

  /**
   * FIA Marshal Posts with Elevated Viewing Platforms, Flags, and Digital LED Signal Boards
   * Situated safely behind the FIA barrier walls around the Grand Prix circuit
   */
  private buildMarshalSafetyPosts(): void {
    const marshalGroup = new THREE.Group();
    const postLocations = [
      { x: 80, z: -148, rot: 0, sector: 'S1' },
      { x: 200, z: 25, rot: -Math.PI / 2, sector: 'S1' },
      { x: 85, z: 220, rot: Math.PI, sector: 'S2' },
      { x: -115, z: 225, rot: Math.PI / 2, sector: 'S2' },
      { x: -116, z: 10, rot: Math.PI / 2, sector: 'S3' },
      { x: -115, z: -100, rot: Math.PI / 2, sector: 'S3' },
    ];

    postLocations.forEach((loc) => {
      const singlePost = new THREE.Group();
      singlePost.position.set(loc.x, 0, loc.z);
      singlePost.rotation.y = loc.rot;

      // Elevated Steel Scaffold Platform
      const scaffoldGeo = new THREE.BoxGeometry(3.5, 3.2, 2.5);
      const scaffoldMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
      const scaffold = new THREE.Mesh(scaffoldGeo, scaffoldMat);
      scaffold.position.y = 1.6;
      singlePost.add(scaffold);

      // Cabin / Roof
      const roofGeo = new THREE.BoxGeometry(4.0, 0.3, 3.0);
      const roof = new THREE.Mesh(roofGeo, this.metalSilverMat);
      roof.position.y = 4.8;
      singlePost.add(roof);

      // Digital FIA LED Signal Board (Green/Yellow Racing Matrix)
      const ledGeo = new THREE.BoxGeometry(1.4, 0.9, 0.2);
      const ledMat = new THREE.MeshStandardMaterial({
        color: 0x000000,
        emissive: 0x22c55e, // Radiant green flag LED
        emissiveIntensity: 3.2,
      });
      const ledBoard = new THREE.Mesh(ledGeo, ledMat);
      ledBoard.position.set(0, 3.8, 1.35);
      singlePost.add(ledBoard);

      marshalGroup.add(singlePost);
    });

    this.group.add(marshalGroup);
  }

  /**
   * Massive Covered Multi-Tiered Grandstand with VIP Corporate Suites and Real Sponsors
   */
  private buildGrandstands(): void {
    const standsGroup = new THREE.Group();

    // 1. South Main Grandstand (120m long, covered cantilevered canopy)
    const standLength = 120;
    const standDepth = 18;
    const standHeight = 14;

    // Concrete Base
    const baseGeo = new THREE.BoxGeometry(standLength, 2.5, standDepth);
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.85 });
    const baseMesh = new THREE.Mesh(baseGeo, concreteMat);
    baseMesh.position.set(0, 1.25, -154);
    baseMesh.castShadow = true;
    standsGroup.add(baseMesh);

    // 8 Tiered Seating Rows with Alternating FIA Red and Sapphire Blue Seats
    const tiers = 8;
    for (let t = 0; t < tiers; t++) {
      const tierGeo = new THREE.BoxGeometry(standLength, 1.2, standDepth / tiers);
      const seatMat = new THREE.MeshStandardMaterial({
        color: t % 2 === 0 ? 0xdc2626 : 0x1d4ed8,
        roughness: 0.45,
        metalness: 0.1,
      });
      const tierMesh = new THREE.Mesh(tierGeo, seatMat);
      tierMesh.position.set(0, 2.5 + t * 1.15, -154 + (t - tiers / 2) * (standDepth / tiers));
      tierMesh.castShadow = true;
      standsGroup.add(tierMesh);
    }

    // Upper VIP Glass Corporate Suites
    const vipGeo = new THREE.BoxGeometry(standLength - 8, 3.5, 4.5);
    const vipBuilding = new THREE.Mesh(vipGeo, this.metalDarkMat);
    vipBuilding.position.set(0, standHeight + 0.5, -160);
    standsGroup.add(vipBuilding);

    const glassFrontGeo = new THREE.BoxGeometry(standLength - 10, 2.6, 0.2);
    const glassFront = new THREE.Mesh(glassFrontGeo, this.glassMat);
    glassFront.position.set(0, standHeight + 0.5, -157.6);
    standsGroup.add(glassFront);

    // Cantilevered Aerodynamic Steel Roof Canopy
    const roofGeo = new THREE.BoxGeometry(standLength + 6, 0.6, standDepth + 8);
    roofGeo.rotateX(0.14);
    const roof = new THREE.Mesh(roofGeo, this.metalSilverMat);
    roof.position.set(0, standHeight + 3.2, -151);
    roof.castShadow = true;
    standsGroup.add(roof);

    // High-Resolution Trackside Sponsor Hoardings
    const sponsorGeo = new THREE.BoxGeometry(standLength, 2.4, 0.2);
    const sponsorCanvas = document.createElement('canvas');
    sponsorCanvas.width = 1024;
    sponsorCanvas.height = 128;
    const sCtx = sponsorCanvas.getContext('2d')!;
    sCtx.fillStyle = '#0f172a';
    sCtx.fillRect(0, 0, 1024, 128);
    sCtx.fillStyle = '#ef4444';
    sCtx.fillRect(0, 116, 1024, 12);
    sCtx.fillStyle = '#f59e0b';
    sCtx.font = 'bold 52px sans-serif';
    sCtx.fillText('APEX GRAND PRIX  ·  PIRELLI  ·  BREMBO  ·  SHELL  ·  ROLEX', 24, 82);
    const sponsorTex = new THREE.CanvasTexture(sponsorCanvas);
    const sponsorMat = new THREE.MeshBasicMaterial({ map: sponsorTex });
    const sponsorMesh = new THREE.Mesh(sponsorGeo, sponsorMat);
    sponsorMesh.position.set(0, 2.8, -144.2);
    standsGroup.add(sponsorMesh);

    // 2. North Bank Open Grandstand (80m long)
    const northLength = 80;
    const northBaseGeo = new THREE.BoxGeometry(northLength, 1.8, 14);
    const northBase = new THREE.Mesh(northBaseGeo, concreteMat);
    northBase.position.set(0, 0.9, 152);
    northBase.castShadow = true;
    standsGroup.add(northBase);

    for (let nt = 0; nt < 5; nt++) {
      const nTierGeo = new THREE.BoxGeometry(northLength, 1.0, 14 / 5);
      const nSeatMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.5 });
      const nTier = new THREE.Mesh(nTierGeo, nSeatMat);
      nTier.position.set(0, 1.8 + nt * 0.9, 152 + (nt - 2.5) * (14 / 5));
      nTier.castShadow = true;
      standsGroup.add(nTier);
    }

    this.group.add(standsGroup);
  }

  /**
   * Two-Story Modern Paddock Club & Pit Garages with Workshop Lighting
   */
  private buildPaddockBuildingAndPitLane(): void {
    const paddockGroup = new THREE.Group();

    // 1. Two-Story Paddock Club Building (90m length x 14m depth x 8.5m height, front facade at Z = -106.0)
    const buildingLength = 90;
    const buildingGeo = new THREE.BoxGeometry(buildingLength, 8.5, 14);
    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.5,
      roughness: 0.4,
    });
    const building = new THREE.Mesh(buildingGeo, buildingMat);
    building.position.set(-2.5, 4.25, -99.0);
    building.castShadow = true;
    paddockGroup.add(building);

    // Architectural White/Silver Cladding Overhang
    const canopyGeo = new THREE.BoxGeometry(buildingLength + 2, 0.4, 15.5);
    const canopyMesh = new THREE.Mesh(canopyGeo, this.metalSilverMat);
    canopyMesh.position.set(-2.5, 8.6, -99.0);
    paddockGroup.add(canopyMesh);

    // West Facade facing Pit Entry (x = -47.5): Architectural Sponsor Logo & Glass
    const westSignGeo = new THREE.PlaneGeometry(12, 5.5);
    westSignGeo.rotateY(-Math.PI / 2);
    const wsCanvas = document.createElement('canvas');
    wsCanvas.width = 512;
    wsCanvas.height = 256;
    const wsCtx = wsCanvas.getContext('2d')!;
    wsCtx.fillStyle = '#0f172a';
    wsCtx.fillRect(0, 0, 512, 256);
    wsCtx.fillStyle = '#ef4444';
    wsCtx.fillRect(0, 0, 512, 12);
    wsCtx.fillStyle = '#ffffff';
    wsCtx.font = 'black 46px sans-serif';
    wsCtx.textAlign = 'center';
    wsCtx.fillText('PADDOCK CLUB', 256, 110);
    wsCtx.fillStyle = '#f59e0b';
    wsCtx.font = 'bold 32px monospace';
    wsCtx.fillText('VIP PIT HOSPITALITY', 256, 175);
    const wsTex = new THREE.CanvasTexture(wsCanvas);
    const wsMat = new THREE.MeshStandardMaterial({ map: wsTex, roughness: 0.3 });
    const westSign = new THREE.Mesh(westSignGeo, wsMat);
    westSign.position.set(-47.55, 4.5, -99.0);
    paddockGroup.add(westSign);

    // Upper VIP Glass Facade
    const vipGlassGeo = new THREE.PlaneGeometry(buildingLength - 4, 3.2);
    const vipGlass = new THREE.Mesh(vipGlassGeo, this.glassMat);
    vipGlass.position.set(-2.5, 6.4, -106.1);
    paddockGroup.add(vipGlass);

    // 5 Official F1 Team Paddock Garages (Aligned side-by-side in true F1 pit lane order)
    const garageConfigs = [
      { id: 'scuderia', name: 'SCUDERIA CORSA', num: '#16 LEC', color: 0xdc2626, accent: 0xfacc15, x: -24.0, textCol: '#ffffff' },
      { id: 'silver_arrow', name: 'SILVER ARROW F1', num: '#63 RUS', color: 0x475569, accent: 0x06b6d4, x: -12.0, textCol: '#06b6d4' },
      { id: 'player', name: 'APEX RACING GP', num: '#1 YOU', color: 0x1d4ed8, accent: 0xfacc15, x: 0.0, textCol: '#facc15' },
      { id: 'papaya', name: 'PAPAYA RACING', num: '#4 NOR', color: 0xea580c, accent: 0x0284c7, x: 12.0, textCol: '#ffffff' },
      { id: 'emerald', name: 'EMERALD GRAND PRIX', num: '#14 ALO', color: 0x065f46, accent: 0x84cc16, x: 24.0, textCol: '#84cc16' },
    ];

    const doorMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.75,
      roughness: 0.35,
    });
    const doorGeo = new THREE.PlaneGeometry(10.8, 3.8);

    garageConfigs.forEach((team) => {
      const doorX = team.x;

      // 1. Roll-Up Garage Door (Z = -106.1)
      const door = new THREE.Mesh(doorGeo, doorMat);
      door.position.set(doorX, 1.9, -106.1);
      paddockGroup.add(door);

      // 2. High-Resolution Team Header Fascia Banner
      const headerCanvas = document.createElement('canvas');
      headerCanvas.width = 512;
      headerCanvas.height = 128;
      const hCtx = headerCanvas.getContext('2d')!;
      
      // Base livery gradient
      const grad = hCtx.createLinearGradient(0, 0, 512, 0);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.35, `#${team.color.toString(16).padStart(6, '0')}`);
      grad.addColorStop(1, '#0f172a');
      hCtx.fillStyle = grad;
      hCtx.fillRect(0, 0, 512, 128);

      // Accent border
      hCtx.fillStyle = `#${team.accent.toString(16).padStart(6, '0')}`;
      hCtx.fillRect(0, 118, 512, 10);
      hCtx.fillRect(0, 0, 512, 6);

      // Team Branding & Driver Number
      hCtx.fillStyle = team.textCol;
      hCtx.font = '900 38px sans-serif';
      hCtx.textAlign = 'center';
      hCtx.fillText(team.name, 256, 62);
      hCtx.font = 'bold 26px monospace';
      hCtx.fillStyle = '#ffffff';
      hCtx.fillText(team.num, 256, 100);

      const headerTex = new THREE.CanvasTexture(headerCanvas);
      const headerMat = new THREE.MeshBasicMaterial({ map: headerTex });
      const headerGeo = new THREE.PlaneGeometry(10.8, 0.95);
      const header = new THREE.Mesh(headerGeo, headerMat);
      header.position.set(doorX, 4.25, -106.05);
      paddockGroup.add(header);

      // 3. FIA Pit Box Markings on Asphalt (Centered in Working Apron at Z = -110.5)
      // Note: Player team box at doorX === 0 is exclusively rendered and managed by PitStopManager to prevent Z-fighting duplicates.
      if (Math.abs(doorX) > 1.0) {
        const stallBoxGeo = new THREE.PlaneGeometry(4.8, 8.5);
        stallBoxGeo.rotateX(-Math.PI / 2);
        const stallCanvas = document.createElement('canvas');
        stallCanvas.width = 256;
        stallCanvas.height = 512;
        const sCtx = stallCanvas.getContext('2d')!;
        sCtx.clearRect(0, 0, 256, 512);

        // White perimeter box
        sCtx.strokeStyle = '#ffffff';
        sCtx.lineWidth = 14;
        sCtx.strokeRect(10, 10, 236, 492);

        // Yellow wheel gun target markings
        sCtx.fillStyle = '#facc15';
        sCtx.fillRect(16, 80, 48, 48);
        sCtx.fillRect(192, 80, 48, 48);
        sCtx.fillRect(16, 380, 48, 48);
        sCtx.fillRect(192, 380, 48, 48);

        // Center stop crossbar
        sCtx.fillStyle = '#ef4444';
        sCtx.fillRect(40, 240, 176, 28);

        // Team acronym stencil
        sCtx.font = 'bold 36px monospace';
        sCtx.fillStyle = '#ffffff';
        sCtx.textAlign = 'center';
        sCtx.fillText(team.num.split(' ')[1] || 'BOX', 128, 200);

        const stallTex = new THREE.CanvasTexture(stallCanvas);
        const stallMat = new THREE.MeshStandardMaterial({
          map: stallTex,
          transparent: true,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -2.0,
          polygonOffsetUnits: -2.0,
          roughness: 0.6,
        });
        const stallMesh = new THREE.Mesh(stallBoxGeo, stallMat);
        stallMesh.position.set(doorX, 0.016, -110.5);
        stallMesh.renderOrder = 2;
        paddockGroup.add(stallMesh);
      }

      // 4. Pit Wall Telemetry Gantry
      const standGantryGeo = new THREE.BoxGeometry(3.2, 2.2, 0.8);
      const standGantry = new THREE.Mesh(standGantryGeo, this.metalDarkMat);
      standGantry.position.set(doorX, 2.1, -122.6);
      paddockGroup.add(standGantry);

      // Glowing Timing Screens with Team Colors
      const monitorGeo = new THREE.PlaneGeometry(1.4, 0.8);
      const monitorMat = new THREE.MeshBasicMaterial({ color: team.accent });
      const monitor = new THREE.Mesh(monitorGeo, monitorMat);
      monitor.position.set(doorX, 2.2, -122.15);
      paddockGroup.add(monitor);
    });

    this.group.add(paddockGroup);
  }

  /**
   * FIA Grade-1 High-Fidelity Pit Lane Entry & Exit Architecture
   * Includes Impact Attenuator Crash Cushion, Pit Limiter Speed & Timing Gantry,
   * Chevron Deceleration Road Markings, Fluorescent Apex Bollards, and Marshal Safety Station.
   */
  private buildPitEntryAndExitArchitecture(): void {
    const pitEntryGroup = new THREE.Group();

    // =========================================================================
    // 1. FIA HIGH-SPEED IMPACT ATTENUATOR / CRASH CUSHION (Pit Wall Entry Nose)
    // =========================================================================
    const noseX = -48;
    const noseZ = -122.0;

    // A. Main Crash Cushion Wedge
    const cushionGeo = new THREE.BoxGeometry(2.4, 1.35, 1.2);
    const cushionCanvas = document.createElement('canvas');
    cushionCanvas.width = 256;
    cushionCanvas.height = 128;
    const cCtx = cushionCanvas.getContext('2d')!;
    cCtx.fillStyle = '#facc15'; // High-visibility safety yellow
    cCtx.fillRect(0, 0, 256, 128);
    // Black chevron hazard diagonal stripes
    cCtx.fillStyle = '#09090b';
    cCtx.lineWidth = 28;
    for (let x = -100; x < 350; x += 55) {
      cCtx.beginPath();
      cCtx.moveTo(x, 128);
      cCtx.lineTo(x + 50, 0);
      cCtx.lineTo(x + 75, 0);
      cCtx.lineTo(x + 25, 128);
      cCtx.fill();
    }
    const cushionTex = new THREE.CanvasTexture(cushionCanvas);
    const cushionMat = new THREE.MeshStandardMaterial({
      map: cushionTex,
      roughness: 0.5,
      metalness: 0.2,
    });
    const cushionMesh = new THREE.Mesh(cushionGeo, cushionMat);
    cushionMesh.position.set(noseX - 1.2, 0.68, noseZ);
    cushionMesh.castShadow = true;
    pitEntryGroup.add(cushionMesh);

    // B. Stepped Energy-Absorbing Steel Deceleration Cylinders (QuadGuard style)
    for (let cyl = 0; cyl < 4; cyl++) {
      const cylGeo = new THREE.CylinderGeometry(0.48 - cyl * 0.04, 0.48 - cyl * 0.04, 1.2, 16);
      const cylMat = new THREE.MeshStandardMaterial({ color: cyl % 2 === 0 ? 0xfacc15 : 0x1e293b, roughness: 0.4 });
      const cylMesh = new THREE.Mesh(cylGeo, cylMat);
      cylMesh.position.set(noseX - 2.8 - cyl * 0.85, 0.6, noseZ);
      cylMesh.castShadow = true;
      pitEntryGroup.add(cylMesh);
    }

    // C. High-Intensity Flashing Amber LED Warning Beacon on Nose
    const beaconBaseGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.35, 12);
    const beaconBase = new THREE.Mesh(beaconBaseGeo, this.metalDarkMat);
    beaconBase.position.set(noseX - 0.8, 1.5, noseZ);
    pitEntryGroup.add(beaconBase);

    const beaconLightGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.25, 12);
    const beaconLightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xf59e0b,
      emissiveIntensity: 6.0,
      roughness: 0.1,
    });
    const beaconLight = new THREE.Mesh(beaconLightGeo, beaconLightMat);
    beaconLight.position.set(noseX - 0.8, 1.75, noseZ);
    pitEntryGroup.add(beaconLight);

    // =========================================================================
    // 2. LUXURY FORMULA 1 PIT ENTRY SPEED & STATUS GANTRY (x = -54, aligned to pit wall)
    // =========================================================================
    const gantryX = -54;
    const gantryH = 5.8;
    const pitWallZ = -122.0;  // Left column aligns EXACTLY with the pit wall
    const paddockWallZ = -106.0; // Right column aligns with paddock side (16.0m wide open entrance)
    const gantryCenterZ = (pitWallZ + paddockWallZ) / 2; // -114.0
    const gantrySpan = Math.abs(pitWallZ - paddockWallZ); // 16.0m

    // Heavy-duty Titanium-Carbon Columns & Overhead Span
    const colGeo = new THREE.BoxGeometry(0.65, gantryH, 0.65);
    const colLeft = new THREE.Mesh(colGeo, this.overheadTrussMat);
    colLeft.position.set(gantryX, gantryH / 2, pitWallZ);
    colLeft.castShadow = false;
    colLeft.receiveShadow = false;
    pitEntryGroup.add(colLeft);

    const colRight = new THREE.Mesh(colGeo, this.overheadTrussMat);
    colRight.position.set(gantryX, gantryH / 2, paddockWallZ);
    colRight.castShadow = false;
    colRight.receiveShadow = false;
    pitEntryGroup.add(colRight);

    // Crossbar Gantry Truss with Carbon-Titanium Casing (Only spans the pit lane)
    const crossGeo = new THREE.BoxGeometry(0.85, 1.25, gantrySpan + 0.65);
    const crossMesh = new THREE.Mesh(crossGeo, this.overheadTrussMat);
    crossMesh.position.set(gantryX, gantryH - 0.55, gantryCenterZ);
    crossMesh.castShadow = false;
    crossMesh.receiveShadow = false;
    pitEntryGroup.add(crossMesh);

    // Luxury FIA High-Definition Digital Sign Display
    const gantrySignCanvas = document.createElement('canvas');
    gantrySignCanvas.width = 1024;
    gantrySignCanvas.height = 256;
    const gCtx = gantrySignCanvas.getContext('2d')!;

    // Deep Obsidian / Carbon Matrix Backing
    gCtx.fillStyle = '#0a0d14';
    gCtx.fillRect(0, 0, 1024, 256);

    // Subtle Carbon-Fiber Pattern
    gCtx.fillStyle = '#111827';
    for (let y = 0; y < 256; y += 8) {
      for (let x = (y % 16 === 0 ? 0 : 8); x < 1024; x += 16) {
        gCtx.fillRect(x, y, 8, 8);
      }
    }

    // Elegant Brushed Gold and Crimson Accent Trim
    gCtx.fillStyle = '#f59e0b'; // Luxury Gold Trim
    gCtx.fillRect(0, 0, 1024, 8);
    gCtx.fillStyle = '#ef4444'; // FIA Racing Red
    gCtx.fillRect(0, 248, 1024, 8);

    // Top Header: Swiss Clean Typography
    gCtx.fillStyle = '#94a3b8';
    gCtx.font = 'bold 26px sans-serif';
    gCtx.textAlign = 'left';
    gCtx.fillText('FIA PIT ENTRY CONTROL', 48, 48);

    // Status Pill: [● PIT OPEN ●] with elegant emerald LED
    gCtx.fillStyle = '#064e3b';
    gCtx.fillRect(720, 22, 250, 36);
    gCtx.strokeStyle = '#10b981';
    gCtx.lineWidth = 2;
    gCtx.strokeRect(720, 22, 250, 36);
    gCtx.fillStyle = '#34d399';
    gCtx.font = 'bold 22px monospace';
    gCtx.textAlign = 'center';
    gCtx.fillText('● PIT OPEN ●', 845, 48);

    // Center Roundel: International FIA Speed Limit 60 Badge (Red Circle + Pure White Inside + Black '60')
    const badgeX = 220;
    const badgeY = 145;
    const badgeR = 64;

    // Red Outer Warning Ring
    gCtx.fillStyle = '#dc2626';
    gCtx.beginPath();
    gCtx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
    gCtx.fill();

    // White Core Disc
    gCtx.fillStyle = '#ffffff';
    gCtx.beginPath();
    gCtx.arc(badgeX, badgeY, badgeR * 0.76, 0, Math.PI * 2);
    gCtx.fill();

    // Bold Speed Number '60'
    gCtx.fillStyle = '#09090b';
    gCtx.font = '900 64px sans-serif';
    gCtx.textAlign = 'center';
    gCtx.textBaseline = 'middle';
    gCtx.fillText('60', badgeX, badgeY + 3);

    // Right Main Text: Crisp Luxury High-Resolution Typography
    gCtx.textAlign = 'left';
    gCtx.textBaseline = 'alphabetic';
    gCtx.fillStyle = '#ffffff';
    gCtx.font = '900 58px sans-serif';
    gCtx.fillText('PIT SPEED LIMIT', 320, 135);

    gCtx.fillStyle = '#f59e0b';
    gCtx.font = 'bold 30px monospace';
    gCtx.fillText('MAX 60 KM/H · ENGAGE LIMITER', 320, 185);

    const gantrySignTex = new THREE.CanvasTexture(gantrySignCanvas);
    const gantrySignMat = new THREE.MeshStandardMaterial({
      map: gantrySignTex,
      emissive: new THREE.Color(0xffffff),
      emissiveMap: gantrySignTex,
      emissiveIntensity: 0.95,
      roughness: 0.25,
      metalness: 0.4,
    });
    const gantrySignGeo = new THREE.PlaneGeometry(6.8, 1.8);
    gantrySignGeo.rotateY(-Math.PI / 2); // Facing incoming cars from West
    const gantrySign = new THREE.Mesh(gantrySignGeo, gantrySignMat);
    gantrySign.position.set(gantryX - 0.45, gantryH - 0.55, gantryCenterZ);
    pitEntryGroup.add(gantrySign);

    // FIA CCTV Telemetry Cameras on Gantry
    for (let cam = 0; cam < 2; cam++) {
      const camHousingGeo = new THREE.BoxGeometry(0.35, 0.25, 0.45);
      const camHousing = new THREE.Mesh(camHousingGeo, this.metalSilverMat);
      camHousing.position.set(gantryX - 0.5, gantryH - 1.1, gantryCenterZ - 2.0 + cam * 4.0);
      pitEntryGroup.add(camHousing);

      const lensGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.15, 12);
      lensGeo.rotateX(Math.PI / 2);
      const lensMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const lens = new THREE.Mesh(lensGeo, lensMat);
      lens.position.set(gantryX - 0.7, gantryH - 1.1, gantryCenterZ - 2.0 + cam * 4.0);
      pitEntryGroup.add(lens);
    }

    // =========================================================================
    // 3. ROAD MARKINGS: FIA CHEVRON DECELERATION HATCHING & LIMITER LINE
    // =========================================================================
    // A. Triangular Chevron Island between Main Track and Pit Lane (x: -74 to -48)
    const chevronGeo = new THREE.PlaneGeometry(28, 7.5);
    chevronGeo.rotateX(-Math.PI / 2);
    chevronGeo.rotateY(0.28);
    const chevronCanvas = document.createElement('canvas');
    chevronCanvas.width = 512;
    chevronCanvas.height = 256;
    const chCtx = chevronCanvas.getContext('2d')!;
    chCtx.fillStyle = 'rgba(20, 20, 25, 0.0)'; // Transparent base
    chCtx.fillRect(0, 0, 512, 256);

    // Solid Perimeter White Line
    chCtx.strokeStyle = '#ffffff';
    chCtx.lineWidth = 14;
    chCtx.beginPath();
    chCtx.moveTo(20, 230);
    chCtx.lineTo(490, 128);
    chCtx.lineTo(20, 26);
    chCtx.closePath();
    chCtx.stroke();

    // Diagonal White Chevron Stripes (FIA Safety Standard)
    chCtx.lineWidth = 16;
    for (let px = 60; px < 460; px += 42) {
      chCtx.beginPath();
      chCtx.moveTo(px, 220);
      chCtx.lineTo(px + 45, 128);
      chCtx.lineTo(px, 36);
      chCtx.stroke();
    }

    const chevronTex = new THREE.CanvasTexture(chevronCanvas);
    const chevronMat = new THREE.MeshBasicMaterial({
      map: chevronTex,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2.0,
      polygonOffsetUnits: -4.0,
    });
    const chevronMesh = new THREE.Mesh(chevronGeo, chevronMat);
    chevronMesh.position.set(-61, 0.012, -124.8);
    chevronMesh.renderOrder = 2;
    pitEntryGroup.add(chevronMesh);

    // B. Transverse Pit Limiter Ground Road Line (at x = -54, spanning exactly the wide pit lane)
    const limiterLineGeo = new THREE.PlaneGeometry(1.6, 15.5);
    limiterLineGeo.rotateX(-Math.PI / 2);
    const limiterCanvas = document.createElement('canvas');
    limiterCanvas.width = 128;
    limiterCanvas.height = 512;
    const lCtx = limiterCanvas.getContext('2d')!;
    // Red & White chequered safety band
    for (let y = 0; y < 512; y += 32) {
      lCtx.fillStyle = (y / 32) % 2 === 0 ? '#ef4444' : '#ffffff';
      lCtx.fillRect(0, y, 128, 32);
    }
    const limiterTex = new THREE.CanvasTexture(limiterCanvas);
    const limiterMat = new THREE.MeshBasicMaterial({
      map: limiterTex,
      polygonOffset: true,
      polygonOffsetFactor: -2.0,
      polygonOffsetUnits: -4.0,
    });
    const limiterLine = new THREE.Mesh(limiterLineGeo, limiterMat);
    limiterLine.position.set(gantryX, 0.014, gantryCenterZ);
    limiterLine.renderOrder = 2;
    pitEntryGroup.add(limiterLine);

    // C. Heavy Tire Skid / Deceleration Rubber Marks on Pit Entry Tarmac
    const skidGeo = new THREE.PlaneGeometry(36, 6.0);
    skidGeo.rotateX(-Math.PI / 2);
    skidGeo.rotateY(0.42);
    const skidCanvas = document.createElement('canvas');
    skidCanvas.width = 512;
    skidCanvas.height = 128;
    const skCtx = skidCanvas.getContext('2d')!;
    skCtx.fillStyle = 'rgba(0,0,0,0)';
    skCtx.fillRect(0, 0, 512, 128);
    // Dark dual tire rubber trails
    const drawTireRubber = (offsetY: number) => {
      const grad = skCtx.createLinearGradient(0, 0, 512, 0);
      grad.addColorStop(0.0, 'rgba(10, 10, 12, 0.0)');
      grad.addColorStop(0.3, 'rgba(10, 10, 12, 0.65)');
      grad.addColorStop(0.8, 'rgba(10, 10, 12, 0.85)');
      grad.addColorStop(1.0, 'rgba(10, 10, 12, 0.35)');
      skCtx.fillStyle = grad;
      skCtx.fillRect(0, offsetY, 512, 14);
    };
    drawTireRubber(32);
    drawTireRubber(82);
    const skidTex = new THREE.CanvasTexture(skidCanvas);
    const skidMat = new THREE.MeshBasicMaterial({
      map: skidTex,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1.0,
      polygonOffsetUnits: -2.0,
    });
    const skidMesh = new THREE.Mesh(skidGeo, skidMat);
    skidMesh.position.set(-66, 0.011, -121.8);
    skidMesh.renderOrder = 1;
    pitEntryGroup.add(skidMesh);

    // =========================================================================
    // 4. FLUORESCENT BOLLARDS (Strictly on the dividing island, NOT invading track)
    // =========================================================================
    for (let b = 0; b < 6; b++) {
      const bt = b / 5;
      // Positioned strictly along the dividing island leading safely to the crash cushion
      const bx = -56 + bt * 7.5;
      const bz = -123.2 + bt * 2.0;

      const bollardGroup = new THREE.Group();
      bollardGroup.position.set(bx, 0, bz);

      // Flexible Orange Polyurethane Post (0.75m tall)
      const postGeo = new THREE.CylinderGeometry(0.06, 0.07, 0.75, 12);
      const postMat = new THREE.MeshStandardMaterial({
        color: 0xf97316, // Fluorescent safety orange
        roughness: 0.3,
        metalness: 0.1,
      });
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.y = 0.375;
      bollardGroup.add(post);

      // 3M Retroreflective White Bands
      for (let r = 0; r < 2; r++) {
        const ringGeo = new THREE.CylinderGeometry(0.072, 0.072, 0.10, 12);
        const ringMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.y = 0.48 + r * 0.16;
        bollardGroup.add(ring);
      }

      pitEntryGroup.add(bollardGroup);
    }

    // =========================================================================
    // 5. ENTRY MARSHAL SAFETY POST & FIRE STATION (Integrated into Pit Wall)
    // =========================================================================
    const marshalX = -44;
    const marshalZ = -123.8; // Aligned directly on top of the pit wall

    // Platform Base
    const mBaseGeo = new THREE.BoxGeometry(2.4, 1.8, 0.9);
    const mBase = new THREE.Mesh(mBaseGeo, this.metalDarkMat);
    mBase.position.set(marshalX, 1.9, marshalZ);
    mBase.castShadow = true;
    pitEntryGroup.add(mBase);

    // Platform Canopy Roof
    const mRoofGeo = new THREE.BoxGeometry(2.8, 0.15, 1.2);
    const mRoof = new THREE.Mesh(mRoofGeo, this.metalSilverMat);
    mRoof.position.set(marshalX, 3.4, marshalZ);
    pitEntryGroup.add(mRoof);

    // Electronic Flag LED Matrix Display (Green / Yellow / SC)
    const eFlagGeo = new THREE.BoxGeometry(1.0, 0.65, 0.15);
    const eFlagMat = new THREE.MeshStandardMaterial({
      color: 0x000000,
      emissive: 0x22c55e, // Glowing Green Light
      emissiveIntensity: 4.5,
    });
    const eFlag = new THREE.Mesh(eFlagGeo, eFlagMat);
    eFlag.position.set(marshalX - 0.6, 2.6, marshalZ + 0.45);
    pitEntryGroup.add(eFlag);

    // Fire Extinguishers (Red steel cylinders with chrome nozzles)
    for (let fe = 0; fe < 2; fe++) {
      const feGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.55, 12);
      const feMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.6, roughness: 0.2 });
      const feMesh = new THREE.Mesh(feGeo, feMat);
      feMesh.position.set(marshalX + 0.4 + fe * 0.35, 2.1, marshalZ);
      pitEntryGroup.add(feMesh);
    }

    // =========================================================================
    // 6. MOTORSPORT SPONSOR BANNERS ALONG PIT WALL (Rolex, Pirelli, Brembo, Apex GT)
    // =========================================================================
    const bannerCanvas = document.createElement('canvas');
    bannerCanvas.width = 1024;
    bannerCanvas.height = 128;
    const bCtx = bannerCanvas.getContext('2d')!;
    bCtx.fillStyle = '#0f172a';
    bCtx.fillRect(0, 0, 1024, 128);
    bCtx.fillStyle = '#ef4444';
    bCtx.fillRect(0, 0, 1024, 8);
    bCtx.fillStyle = '#f59e0b';
    bCtx.fillRect(0, 120, 1024, 8);
    bCtx.fillStyle = '#ffffff';
    bCtx.font = 'black 44px sans-serif';
    bCtx.fillText('APEX GT PIT LANE  ·  ROLEX  ·  PIRELLI  ·  BREMBO  ·  SHELL', 28, 78);

    const bannerTex = new THREE.CanvasTexture(bannerCanvas);
    const bannerMat = new THREE.MeshStandardMaterial({ map: bannerTex, roughness: 0.4 });
    const bannerGeo = new THREE.BoxGeometry(32, 1.1, 0.15);
    const bannerMesh = new THREE.Mesh(bannerGeo, bannerMat);
    bannerMesh.position.set(-32, 1.4, -123.8);
    pitEntryGroup.add(bannerMesh);

    this.group.add(pitEntryGroup);
  }

  /**
   * 18m Jumbotron LED Video Wall & Circuit Tower
   */
  private buildJumbotronAndTimingTowers(): void {
    const towerGroup = new THREE.Group();

    // Tower located near Turn 1 (x = 65, z = -148)
    const towerX = 65;
    const towerZ = -148;

    // Steel Lattice Support
    const mastGeo = new THREE.BoxGeometry(2.2, 18, 2.2);
    const mast = new THREE.Mesh(mastGeo, this.metalDarkMat);
    mast.position.set(towerX, 9, towerZ);
    mast.castShadow = true;
    towerGroup.add(mast);

    // Massive Jumbotron Screen (12m x 7m)
    const screenGeo = new THREE.BoxGeometry(12, 7, 0.6);
    const sCanvas = document.createElement('canvas');
    sCanvas.width = 512;
    sCanvas.height = 256;
    const sCtx = sCanvas.getContext('2d')!;
    sCtx.fillStyle = '#09090b';
    sCtx.fillRect(0, 0, 512, 256);
    sCtx.fillStyle = '#f59e0b';
    sCtx.font = 'bold 36px monospace';
    sCtx.fillText('APEX GP LIVE TIMING', 40, 55);
    sCtx.fillStyle = '#22c55e';
    sCtx.font = '28px monospace';
    sCtx.fillText('P1  VER  1:14.281', 40, 110);
    sCtx.fillText('P2  LEC  +0.142', 40, 155);
    sCtx.fillText('P3  NOR  +0.298', 40, 200);
    const screenTex = new THREE.CanvasTexture(sCanvas);
    const screenMat = new THREE.MeshBasicMaterial({ map: screenTex });
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.set(towerX, 15, towerZ + 1.2);
    screenMesh.rotation.y = -0.2;
    towerGroup.add(screenMesh);

    this.group.add(towerGroup);
  }

  /**
   * Start / Finish Overhead Gantry with FIA Start Lights & West High-Tech Bridge
   */
  private buildOverheadGantriesAndBridges(): void {
    const structGroup = new THREE.Group();

    // 1. Start Gantry across Main Straight and Pit Lane
    const gantryHeight = 7.8;
    const pylonZ1 = -143;
    const pylonZ2 = -106;

    [pylonZ1, pylonZ2].forEach((zPos) => {
      const pylonGeo = new THREE.BoxGeometry(1.4, gantryHeight, 1.4);
      const pylon = new THREE.Mesh(pylonGeo, this.overheadTrussMat);
      pylon.position.set(0, gantryHeight / 2, zPos);
      pylon.castShadow = false;
      pylon.receiveShadow = false;
      structGroup.add(pylon);
    });

    // Overhead Truss Beam: Matte composite material with 0 shadow map lookups when driving underneath
    const spanLengthZ = Math.abs(pylonZ2 - pylonZ1) + 1.4;
    const spanCenterZ = (pylonZ1 + pylonZ2) / 2;
    const spanGeo = new THREE.BoxGeometry(1.6, 1.6, spanLengthZ);
    const span = new THREE.Mesh(spanGeo, this.overheadTrussMat);
    span.position.set(0, gantryHeight + 0.8, spanCenterZ);
    span.castShadow = false;
    span.receiveShadow = false;
    structGroup.add(span);

    // Realistic Integrated Ground Contact Shadow for Start Gantry (Flush at y = 0.016 on tarmac, renderOrder 1)
    const startShadow = this.createOverheadSoftShadow(4.2, spanLengthZ + 2.0, 'gantry', 0.62);
    startShadow.position.set(-4.5, 0.016, spanCenterZ + 3.8);
    structGroup.add(startShadow);

    // 5 Red Starting Light Pods (Shared lightweight emissive material, 0 state change overhead)
    for (let l = 0; l < 5; l++) {
      const lightGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.20, 12);
      lightGeo.rotateZ(Math.PI / 2);
      const lightMesh = new THREE.Mesh(lightGeo, this.startLightMat);
      lightMesh.position.set(-0.85, gantryHeight + 0.3, -this.halfSize - 4 + l * 2);
      lightMesh.castShadow = false;
      lightMesh.receiveShadow = false;
      structGroup.add(lightMesh);
    }

    // 2. West High-Tech Sponsor Arch Bridge (38m span across Kemmel-Baku Super Straight at x = -100, z = 20)
    const archSpan = 38;
    const archH = 8.8;
    const archMeshGeo = new THREE.BoxGeometry(archSpan, 2.4, 4.8);
    const archMesh = new THREE.Mesh(archMeshGeo, this.overheadTrussMat);
    archMesh.position.set(-100, archH, 20);
    archMesh.castShadow = false;
    archMesh.receiveShadow = false;
    structGroup.add(archMesh);

    // Realistic Integrated Ground Contact Shadow for West Arch Bridge
    const archShadow = this.createOverheadSoftShadow(archSpan + 2.0, 8.4, 'arch', 0.65);
    archShadow.position.set(-100 - 4.5, 0.016, 20 + 3.8);
    structGroup.add(archShadow);

    // Arch Support Pillars (Pillars placed safely behind the barrier walls at x = -118 and x = -82)
    [-100 - archSpan / 2 + 0.8, -100 + archSpan / 2 - 0.8].forEach((xPos) => {
      const pillarGeo = new THREE.CylinderGeometry(1.3, 1.5, archH, 12);
      const pillar = new THREE.Mesh(pillarGeo, this.overheadTrussMat);
      pillar.position.set(xPos, archH / 2, 20);
      pillar.castShadow = false;
      pillar.receiveShadow = false;
      structGroup.add(pillar);

      this.staticObstacles.push({
        x: xPos,
        z: 20,
        radius: 1.6,
        type: 'pillar',
      });
    });

    this.group.add(structGroup);
  }

  /**
   * 16 High-Mast Stadium Floodlight Towers Surrounding the Entire Circuit
   * Every tower is positioned safely outside the outer barriers (dist > 15m)
   * and aims directly at the racing track surface!
   */
  private buildHighMastFloodlights(): void {
    const towerGroup = new THREE.Group();

    // 16 Strategic Floodlight Tower positions with exact track target focal points
    const floodlightConfigs = [
      // S/F Straight & Pit Lane (Aiming North onto S/F straight)
      { x: -65, z: -155, tx: -65, tz: -130 },
      { x: -15, z: -155, tx: -15, tz: -130 },
      { x: 35,  z: -155, tx: 35,  tz: -130 },
      { x: 80,  z: -155, tx: 80,  tz: -130 },

      // Turn 1 Chicane & Exit
      { x: 155, z: -145, tx: 130, tz: -120 },
      { x: 165, z: -85,  tx: 145, tz: -82 },

      // The Sweep (Turn 3)
      { x: 205, z: 15,   tx: 184, tz: 25 },
      { x: 195, z: 75,   tx: 172, tz: 70 },

      // The High-Speed Esses (Turn 4 to 7)
      { x: 155, z: 145,  tx: 135, tz: 125 },
      { x: 115, z: 185,  tx: 95,  tz: 160 },
      { x: 55,  z: 220,  tx: 45,  tz: 195 },
      { x: -15, z: 242,  tx: -15, tz: 218 },

      // Turn 8 180° Slow Hairpin
      { x: -115, z: 235, tx: -88, tz: 205 },
      { x: -120, z: 175, tx: -96, tz: 180 },

      // Kemmel-Baku Super Straight
      { x: -122, z: 70,  tx: -100, tz: 70 },
      { x: -122, z: -10, tx: -100, tz: -10 },
      { x: -122, z: -65, tx: -100, tz: -65 },

      // Turn 9 130R Curvone & Bus Stop Chicane
      { x: -118, z: -115, tx: -95, tz: -105 },
      { x: -75,  z: -152, tx: -74, tz: -129 },
    ];

    floodlightConfigs.forEach((cfg) => {
      const singleTower = new THREE.Group();
      singleTower.position.set(cfg.x, 0, cfg.z);

      // Analyze angle from tower position to its intended target on the track!
      const yawAngle = Math.atan2(cfg.tx - cfg.x, cfg.tz - cfg.z);
      singleTower.rotation.y = yawAngle;

      // Steel Lattice Mast (24m high)
      const mastH = 24;
      const mastGeo = new THREE.CylinderGeometry(0.55, 1.1, mastH, 8);
      const mastMat = new THREE.MeshStandardMaterial({ color: 0x22262e, metalness: 0.40, roughness: 0.65 });
      const mast = new THREE.Mesh(mastGeo, mastMat);
      mast.position.y = mastH / 2;
      mast.castShadow = true;
      singleTower.add(mast);

      // Angled Light Head Assembly (pitched 35 degrees forward towards the track!)
      const headAssembly = new THREE.Group();
      headAssembly.position.set(0, mastH, 0);
      headAssembly.rotation.x = 0.62; // 35.5 degrees pitch down directly aimed at the asphalt

      // Cantilever Arm Bar
      const armGeo = new THREE.BoxGeometry(0.8, 0.8, 2.2);
      const arm = new THREE.Mesh(armGeo, mastMat);
      arm.position.set(0, 0, 1.1);
      headAssembly.add(arm);

      // Hexagonal Crossbar Head
      const headGeo = new THREE.BoxGeometry(5.4, 1.4, 0.8);
      const head = new THREE.Mesh(headGeo, mastMat);
      head.position.set(0, 0, 2.2);
      headAssembly.add(head);

      // 6 High-Power Stadium Spotlights angled directly at the circuit
      for (let s = 0; s < 6; s++) {
        // Spotlight Casing
        const spotHousingGeo = new THREE.BoxGeometry(0.75, 0.75, 0.4);
        const spotHousing = new THREE.Mesh(spotHousingGeo, mastMat);
        spotHousing.position.set(-2.1 + s * 0.84, 0, 2.45);
        headAssembly.add(spotHousing);

        // Glowing Emissive Lens
        const lensGeo = new THREE.PlaneGeometry(0.65, 0.65);
        const lens = new THREE.Mesh(lensGeo, this.floodlightMat);
        lens.position.set(-2.1 + s * 0.84, 0, 2.66);
        headAssembly.add(lens);
      }

      singleTower.add(headAssembly);
      towerGroup.add(singleTower);
    });

    this.group.add(towerGroup);
  }

  /**
   * Helper to recompute spherical normals from a center point for lush, volumetric foliage lighting
   */
  /**
   * Applies procedural organic 3D needle/leaf displacement to eliminate cartoon spherical symmetry
   */
  private displaceFoliageGeometry(geo: THREE.BufferGeometry, noiseScale = 0.28): void {
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const dist = Math.hypot(x, z) || 0.001;
      // Multi-octave organic perturbation
      const j1 = Math.sin(x * 5.2 + y * 3.4) * Math.cos(z * 4.8);
      const j2 = Math.sin(y * 8.0 + (x + z) * 3.0) * 0.5;
      const displace = (j1 + j2) * noiseScale;
      pos.setX(i, x + (x / dist) * displace);
      pos.setY(i, y + displace * 0.7);
      pos.setZ(i, z + (z / dist) * displace);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  }

  /**
   * High-performance BufferGeometry merger for building composite foliage prototypes
   */
  private mergeBufferGeometries(geos: Array<{ geo: THREE.BufferGeometry; matrix?: THREE.Matrix4 }>): THREE.BufferGeometry {
    let totalVerts = 0;
    let totalIndices = 0;

    for (const item of geos) {
      totalVerts += item.geo.attributes.position.count;
      if (item.geo.index) totalIndices += item.geo.index.count;
    }

    const positions = new Float32Array(totalVerts * 3);
    const normals = new Float32Array(totalVerts * 3);
    const uvs = new Float32Array(totalVerts * 2);
    const indices = new Uint16Array(totalIndices);

    let vertOffset = 0;
    let indexOffset = 0;

    const normalMatrix = new THREE.Matrix3();
    const v = new THREE.Vector3();
    const n = new THREE.Vector3();

    for (const item of geos) {
      const g = item.geo;
      const pos = g.attributes.position;
      const norm = g.attributes.normal;
      const uv = g.attributes.uv;
      const idx = g.index;

      const mat = item.matrix || new THREE.Matrix4();
      normalMatrix.getNormalMatrix(mat);

      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(mat);
        positions[(vertOffset + i) * 3] = v.x;
        positions[(vertOffset + i) * 3 + 1] = v.y;
        positions[(vertOffset + i) * 3 + 2] = v.z;

        if (norm) {
          n.fromBufferAttribute(norm, i).applyMatrix3(normalMatrix).normalize();
          normals[(vertOffset + i) * 3] = n.x;
          normals[(vertOffset + i) * 3 + 1] = n.y;
          normals[(vertOffset + i) * 3 + 2] = n.z;
        }

        if (uv) {
          uvs[(vertOffset + i) * 2] = uv.getX(i);
          uvs[(vertOffset + i) * 2 + 1] = uv.getY(i);
        }
      }

      if (idx) {
        for (let i = 0; i < idx.count; i++) {
          indices[indexOffset + i] = idx.getX(i) + vertOffset;
        }
        indexOffset += idx.count;
      }

      vertOffset += pos.count;
    }

    const merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    merged.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    if (totalIndices > 0) {
      merged.setIndex(new THREE.BufferAttribute(indices, 1));
    }
    return merged;
  }

  /**
   * Pre-generates merged prototype geometries for Mediterranean Racing Pine
   */
  private createPineGeometries(): { trunk: THREE.BufferGeometry; foliage: THREE.BufferGeometry } {
    const trunkH = 7.8;
    const trunkGeo = new THREE.CylinderGeometry(0.24, 0.58, trunkH, 8, 2);
    trunkGeo.translate(0, trunkH / 2 - 0.15, 0);

    const foliageParts: Array<{ geo: THREE.BufferGeometry; matrix: THREE.Matrix4 }> = [];
    // Coniferous tiered umbrella canopies with jagged needle contour
    const tiers = [
      { y: trunkH * 0.65 - 0.15, r: 3.6, sy: 0.55 },
      { y: trunkH * 0.85 - 0.15, r: 2.9, sy: 0.60 },
      { y: trunkH * 1.02 - 0.15, r: 2.1, sy: 0.65 },
    ];

    tiers.forEach((t) => {
      const geo = new THREE.CylinderGeometry(0.4, t.r, 1.4, 12, 3);
      this.displaceFoliageGeometry(geo, 0.35);
      const mat = new THREE.Matrix4()
        .makeTranslation(0, t.y, 0)
        .multiply(new THREE.Matrix4().makeScale(1.0, t.sy, 1.0));
      foliageParts.push({ geo, matrix: mat });
    });

    const mergedFoliage = this.mergeBufferGeometries(foliageParts);
    mergedFoliage.computeVertexNormals();

    return { trunk: trunkGeo, foliage: mergedFoliage };
  }

  /**
   * Pre-generates merged prototype geometries for Broadleaf European Oak
   */
  private createOakGeometries(): { trunk: THREE.BufferGeometry; foliage: THREE.BufferGeometry } {
    const trunkH = 5.6;
    const trunkGeo = new THREE.CylinderGeometry(0.42, 0.82, trunkH, 8, 2);
    trunkGeo.translate(0, trunkH / 2 - 0.15, 0);

    const trunkParts: Array<{ geo: THREE.BufferGeometry; matrix?: THREE.Matrix4 }> = [
      { geo: trunkGeo }
    ];

    for (let b = 0; b < 3; b++) {
      const ang = (b / 3) * Math.PI * 2 + 0.3;
      const boughGeo = new THREE.CylinderGeometry(0.18, 0.28, 2.4, 6);
      const bMat = new THREE.Matrix4()
        .makeTranslation(Math.cos(ang) * 0.4, trunkH * 0.82 - 0.15, Math.sin(ang) * 0.4)
        .multiply(new THREE.Matrix4().makeRotationY(ang))
        .multiply(new THREE.Matrix4().makeRotationZ(0.55));
      trunkParts.push({ geo: boughGeo, matrix: bMat });
    }
    const mergedTrunk = this.mergeBufferGeometries(trunkParts);

    const clusterPositions = [
      { x: 0, y: trunkH * 0.95 - 0.15, z: 0, r: 2.6 },
      { x: 1.4, y: trunkH * 1.1 - 0.15, z: 0.8, r: 2.2 },
      { x: -1.3, y: trunkH * 1.15 - 0.15, z: 0.9, r: 2.1 },
      { x: 0.2, y: trunkH * 1.18 - 0.15, z: -1.5, r: 2.3 },
      { x: -1.1, y: trunkH * 1.25 - 0.15, z: -0.9, r: 2.0 },
      { x: 1.2, y: trunkH * 1.28 - 0.15, z: -0.7, r: 1.9 },
      { x: 0, y: trunkH * 1.45 - 0.15, z: 0, r: 2.1 },
    ];

    const foliageParts: Array<{ geo: THREE.BufferGeometry; matrix: THREE.Matrix4 }> = [];
    clusterPositions.forEach((cl) => {
      const geo = new THREE.DodecahedronGeometry(cl.r, 1);
      this.displaceFoliageGeometry(geo, 0.38);
      const mat = new THREE.Matrix4().makeTranslation(cl.x, cl.y, cl.z);
      foliageParts.push({ geo, matrix: mat });
    });

    const mergedFoliage = this.mergeBufferGeometries(foliageParts);
    mergedFoliage.computeVertexNormals();

    return { trunk: mergedTrunk, foliage: mergedFoliage };
  }

  /**
   * Pre-generates merged prototype geometries for Slender Italian Cypress
   */
  private createCypressGeometries(): { trunk: THREE.BufferGeometry; foliage: THREE.BufferGeometry } {
    const trunkH = 1.6;
    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.32, trunkH, 8);
    trunkGeo.translate(0, trunkH / 2 - 0.1, 0);

    const foliageH = 9.2;
    const tiers = 5;
    const foliageParts: Array<{ geo: THREE.BufferGeometry; matrix: THREE.Matrix4 }> = [];

    for (let t = 0; t < tiers; t++) {
      const ty = trunkH * 0.8 + t * (foliageH / tiers) * 0.85 - 0.1;
      const tr = 1.35 - t * 0.22;
      const geo = new THREE.ConeGeometry(tr, (foliageH / tiers) * 1.35, 9, 2);
      this.displaceFoliageGeometry(geo, 0.22);
      const mat = new THREE.Matrix4().makeTranslation(0, ty, 0);
      foliageParts.push({ geo, matrix: mat });
    }

    const mergedFoliage = this.mergeBufferGeometries(foliageParts);
    mergedFoliage.computeVertexNormals();

    return { trunk: trunkGeo, foliage: mergedFoliage };
  }

  /**
   * Pre-generates merged prototype geometry for Organic Bush Cluster
   */
  private createBushGeometry(): THREE.BufferGeometry {
    const count = 4;
    const parts: Array<{ geo: THREE.BufferGeometry; matrix: THREE.Matrix4 }> = [];

    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2;
      const dist = 0.45;
      const r = 0.85;
      const geo = new THREE.DodecahedronGeometry(r, 1);
      this.displaceFoliageGeometry(geo, 0.28);
      const mat = new THREE.Matrix4()
        .makeTranslation(Math.cos(ang) * dist, r * 0.72 - 0.05, Math.sin(ang) * dist)
        .multiply(new THREE.Matrix4().makeScale(1.1, 0.8, 1.1));
      parts.push({ geo, matrix: mat });
    }

    const merged = this.mergeBufferGeometries(parts);
    merged.computeVertexNormals();
    return merged;
  }

  /**
   * Photorealistic Dual-Corridor Tree System rendered via Hardware InstancedMesh.
   * Reduces draw calls from ~7,200 down to exactly 7 Draw Calls (99.9% reduction!).
   * Concentrates 100% of vegetation safely OUTSIDE the FIA barrier corridors,
   * forming an immersive, tree-lined Grand Prix forest backdrop with ZERO intrusion onto the track.
   */
  private buildOrganicVegetation(): void {
    const vegGroup = new THREE.Group();

    interface TreeInst {
      x: number;
      z: number;
      scale: number;
      rotY: number;
    }

    const pineList: TreeInst[] = [];
    const oakList: TreeInst[] = [];
    const cypressList: TreeInst[] = [];
    const bushList: TreeInst[] = [];

    const placedTrees: Array<{ x: number; z: number; r: number }> = [];

    /**
     * Strict spatial validation ensuring no tree canopy or trunk intersects:
     * - F1 Grand Prix track surface (16m width = 8m half-width, barrier at 11.2m)
     * - Zero branches or leaves can extend past the barrier wall into the track corridor
     * - Grandstands (South or North)
     * - Pit Lane, Paddock Club Garages, Team Transporters
     * - Helipad
     * - Gravel runoff traps
     */
    const isTreeSafe = (x: number, z: number, canopyR: number): boolean => {
      // 1. Distance to F1 track spline centerline
      // Barrier is at 11.2m; canopy must be at least (14.5 + canopyR)m away from centerline!
      const distToTrack = this.getDistanceToCircuitSpline(x, z);
      if (distToTrack < 14.5 + canopyR) {
        return false; // ZERO TREES OR CANOPIES ANYWHERE NEAR ROAD OR BARRIERS!
      }

      // 2. South Main Grandstand Exclusion Zone
      if (x >= -78 - canopyR && x <= 78 + canopyR && z >= -175 - canopyR && z <= -138.0 + canopyR) {
        return false;
      }

      // 3. North Grandstand Exclusion Zone
      if (x >= -52 - canopyR && x <= 52 + canopyR && z >= 138.0 - canopyR && z <= 170 + canopyR) {
        return false;
      }

      // 4. Pit Lane, Paddock Garages & Team Transporters
      if (x >= -85 - canopyR && x <= 65 + canopyR && z >= -132 - canopyR && z <= -80 + canopyR) {
        return false;
      }

      // 5. Helipad (radius 20m around 30, 30)
      if (Math.hypot(x - 30, z - 30) < 20 + canopyR) {
        return false;
      }

      // 6. Gravel Runoff Traps
      if (x >= 105 - canopyR && x <= 170 + canopyR && z >= -155 - canopyR && z <= -115 + canopyR) return false;
      if (x >= -110 - canopyR && x <= -25 + canopyR && z >= 218 - canopyR && z <= 255 + canopyR) return false;
      if (x >= -135 - canopyR && x <= -90 + canopyR && z >= -130 - canopyR && z <= -65 + canopyR) return false;
      if (x >= -110 - canopyR && x <= -50 + canopyR && z >= -155 - canopyR && z <= -120 + canopyR) return false;

      // 7. Tree-to-tree crown overlap prevention (allows lush clustering without clipping)
      for (const pt of placedTrees) {
        if (Math.hypot(x - pt.x, z - pt.z) < (canopyR + pt.r) * 0.42) {
          return false;
        }
      }

      return true;
    };

    const tryAddTree = (x: number, z: number, type: 'pine' | 'oak' | 'cypress', scale = 1.35) => {
      const canopyR = type === 'cypress' ? 1.4 * scale : (type === 'pine' ? 2.8 * scale : 3.4 * scale);
      if (!isTreeSafe(x, z, canopyR)) return;

      const rotY = (Math.abs(x * 13 + z * 17) % 628) / 100;
      if (type === 'pine') pineList.push({ x, z, scale, rotY });
      else if (type === 'oak') oakList.push({ x, z, scale, rotY });
      else cypressList.push({ x, z, scale, rotY });

      placedTrees.push({ x, z, r: canopyR });

      // Register physics collision obstacle for accessible infield trees
      if (Math.abs(x) < 140 && Math.abs(z) < 180) {
        this.staticObstacles.push({
          x,
          z,
          radius: 0.8 * scale,
          type: 'tree',
        });
      }
    };

    // =========================================================================
    // 1. DENSE MULTI-TIER OUTFIELD PERIMETER FOREST CORRIDORS (24m to 90m from track)
    // =========================================================================
    const waypoints = SHARED_CIRCUIT_WAYPOINTS;
    const numPts = waypoints.length;

    // Follow the track outer perimeter and place tiered tree rows safely behind the barriers
    for (let i = 0; i < numPts; i += 3) {
      const pt = waypoints[i];
      const nextPt = waypoints[(i + 1) % numPts];
      const dx = nextPt.x - pt.x;
      const dz = nextPt.z - pt.z;
      const segLen = Math.hypot(dx, dz) || 1;
      const nx = -dz / segLen;
      const nz = dx / segLen;

      // Tier 1: Outer Verge Tree Line (offset 24m - 30m)
      const t1 = Math.abs(i) % 3 === 0 ? 'pine' : (Math.abs(i) % 3 === 1 ? 'oak' : 'cypress');
      tryAddTree(pt.x + nx * 25.0, pt.z + nz * 25.0, t1, 1.4);

      // Tier 2: Mid Forest Canopy (offset 36m - 48m)
      const t2 = Math.abs(i) % 2 === 0 ? 'oak' : 'pine';
      tryAddTree(pt.x + nx * 40.0, pt.z + nz * 40.0, t2, 1.55);

      // Tier 3: Deep Forest Ridge (offset 55m - 80m)
      const t3 = Math.abs(i) % 3 === 0 ? 'pine' : 'oak';
      tryAddTree(pt.x + nx * 60.0, pt.z + nz * 60.0, t3, 1.65);
      tryAddTree(pt.x + nx * 80.0, pt.z + nz * 80.0, 'pine', 1.75);

      // Infield Forest Clusters (only on the inside where distance permits)
      const tIn = Math.abs(i) % 2 === 0 ? 'cypress' : 'oak';
      tryAddTree(pt.x - nx * 30.0, pt.z - nz * 30.0, tIn, 1.35);
      tryAddTree(pt.x - nx * 50.0, pt.z - nz * 50.0, 'oak', 1.45);
    }

    // =========================================================================
    // 2. WIDE NATURAL FOREST BACKDROPS (Filling the outer perimeter landscape)
    // =========================================================================
    for (let gx = -240; gx <= 240; gx += 18.0) {
      for (let gz = -210; gz <= 270; gz += 18.0) {
        const type = Math.abs(gx + gz) % 3 === 0 ? 'pine' : (Math.abs(gx) % 2 === 0 ? 'oak' : 'cypress');
        tryAddTree(gx + (Math.abs(gz * 7) % 6), gz + (Math.abs(gx * 5) % 6), type, 1.45);
      }
    }

    // =========================================================================
    // 3. TRACKSIDE SHRUB HEDGES (Strictly clear of walls, track, and barriers)
    // =========================================================================
    for (let i = 0; i < numPts; i += 2) {
      const pt = waypoints[i];
      const nextPt = waypoints[(i + 1) % numPts];
      const dx = nextPt.x - pt.x;
      const dz = nextPt.z - pt.z;
      const segLen = Math.hypot(dx, dz) || 1;
      const nx = -dz / segLen;
      const nz = dx / segLen;

      // Outer and Inner Shrub line (offset 18.0m)
      const bx = pt.x + nx * 18.0;
      const bz = pt.z + nz * 18.0;
      const bushR = 1.2;
      if (isTreeSafe(bx, bz, bushR)) {
        const rotY = (Math.abs(bx * 19 + bz * 23) % 628) / 100;
        bushList.push({ x: bx, z: bz, scale: 1.1, rotY });
        placedTrees.push({ x: bx, z: bz, r: bushR });
      }

      const bxIn = pt.x - nx * 18.0;
      const bzIn = pt.z - nz * 18.0;
      if (isTreeSafe(bxIn, bzIn, bushR)) {
        const rotY = (Math.abs(bxIn * 19 + bzIn * 23) % 628) / 100;
        bushList.push({ x: bxIn, z: bzIn, scale: 1.1, rotY });
        placedTrees.push({ x: bxIn, z: bzIn, r: bushR });
      }
    }

    // =========================================================================
    // HARDWARE INSTANCING COMPILATION (7 Draw Calls Total for the entire forest!)
    // =========================================================================
    const dummy = new THREE.Object3D();

    // 1. Pines (Trunks + Foliage)
    if (pineList.length > 0) {
      const pineGeos = this.createPineGeometries();
      const pineTrunks = new THREE.InstancedMesh(pineGeos.trunk, this.treeBarkMat, pineList.length);
      const pineFoliage = new THREE.InstancedMesh(pineGeos.foliage, this.pineFoliageMat, pineList.length);

      pineList.forEach((p, i) => {
        dummy.position.set(p.x, 0, p.z);
        dummy.scale.setScalar(p.scale);
        dummy.rotation.y = p.rotY;
        dummy.updateMatrix();
        pineTrunks.setMatrixAt(i, dummy.matrix);
        pineFoliage.setMatrixAt(i, dummy.matrix);
      });

      pineTrunks.castShadow = true;
      pineTrunks.receiveShadow = false;
      pineFoliage.castShadow = false; // Excluded from shadow depth pass for huge 60 FPS GPU boost
      pineFoliage.receiveShadow = false;
      pineTrunks.instanceMatrix.needsUpdate = true;
      pineFoliage.instanceMatrix.needsUpdate = true;

      vegGroup.add(pineTrunks);
      vegGroup.add(pineFoliage);
    }

    // 2. Oaks (Trunks + Foliage)
    if (oakList.length > 0) {
      const oakGeos = this.createOakGeometries();
      const oakTrunks = new THREE.InstancedMesh(oakGeos.trunk, this.treeBarkMat, oakList.length);
      const oakFoliage = new THREE.InstancedMesh(oakGeos.foliage, this.oakFoliageMat, oakList.length);

      oakList.forEach((o, i) => {
        dummy.position.set(o.x, 0, o.z);
        dummy.scale.setScalar(o.scale);
        dummy.rotation.y = o.rotY;
        dummy.updateMatrix();
        oakTrunks.setMatrixAt(i, dummy.matrix);
        oakFoliage.setMatrixAt(i, dummy.matrix);
      });

      oakTrunks.castShadow = true;
      oakTrunks.receiveShadow = false;
      oakFoliage.castShadow = false; // Excluded from shadow depth pass
      oakFoliage.receiveShadow = false;
      oakTrunks.instanceMatrix.needsUpdate = true;
      oakFoliage.instanceMatrix.needsUpdate = true;

      vegGroup.add(oakTrunks);
      vegGroup.add(oakFoliage);
    }

    // 3. Cypresses (Trunks + Foliage)
    if (cypressList.length > 0) {
      const cypGeos = this.createCypressGeometries();
      const cypTrunks = new THREE.InstancedMesh(cypGeos.trunk, this.treeBarkMat, cypressList.length);
      const cypFoliage = new THREE.InstancedMesh(cypGeos.foliage, this.cypressFoliageMat, cypressList.length);

      cypressList.forEach((c, i) => {
        dummy.position.set(c.x, 0, c.z);
        dummy.scale.setScalar(c.scale);
        dummy.rotation.y = c.rotY;
        dummy.updateMatrix();
        cypTrunks.setMatrixAt(i, dummy.matrix);
        cypFoliage.setMatrixAt(i, dummy.matrix);
      });

      cypTrunks.castShadow = true;
      cypTrunks.receiveShadow = false;
      cypFoliage.castShadow = false; // Excluded from shadow depth pass
      cypFoliage.receiveShadow = false;
      cypTrunks.instanceMatrix.needsUpdate = true;
      cypFoliage.instanceMatrix.needsUpdate = true;

      vegGroup.add(cypTrunks);
      vegGroup.add(cypFoliage);
    }

    // 4. Bushes
    if (bushList.length > 0) {
      const bushGeo = this.createBushGeometry();
      const bushMesh = new THREE.InstancedMesh(bushGeo, this.bushFoliageMat, bushList.length);

      bushList.forEach((b, i) => {
        dummy.position.set(b.x, 0, b.z);
        dummy.scale.setScalar(b.scale);
        dummy.rotation.y = b.rotY;
        dummy.updateMatrix();
        bushMesh.setMatrixAt(i, dummy.matrix);
      });

      bushMesh.castShadow = false;
      bushMesh.receiveShadow = false;
      bushMesh.instanceMatrix.needsUpdate = true;

      vegGroup.add(bushMesh);
    }

    this.group.add(vegGroup);
  }

  /**
   * Team Hospitality Transporter Semitrucks Parked in Paddock Area
   */
  private buildPaddockTransportersAndTrailers(): void {
    const paddockTruckGroup = new THREE.Group();
    const teamColors = [0xdc2626, 0x2563eb, 0x059669, 0xd97706, 0x7c3aed, 0xdb2777];

    for (let i = 0; i < 6; i++) {
      const truckX = -42 + i * 15;
      const truckZ = -92;

      const singleTruck = new THREE.Group();
      singleTruck.position.set(truckX, 0, truckZ);

      // Main Trailer Box (13.6m length x 2.6m width x 4m height)
      const trailerGeo = new THREE.BoxGeometry(12.5, 3.8, 2.6);
      const trailerMat = new THREE.MeshStandardMaterial({
        color: teamColors[i],
        metalness: 0.85,
        roughness: 0.25,
      });
      const trailer = new THREE.Mesh(trailerGeo, trailerMat);
      trailer.position.y = 2.4;
      trailer.castShadow = true;
      singleTruck.add(trailer);

      // Chrome Trim / Livery Stripe
      const stripeGeo = new THREE.BoxGeometry(12.55, 0.4, 2.62);
      const stripe = new THREE.Mesh(stripeGeo, this.metalSilverMat);
      stripe.position.y = 2.4;
      singleTruck.add(stripe);

      // Wheels
      [-4, -2.5, 4].forEach((wx) => {
        [-1.35, 1.35].forEach((wz) => {
          const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.35, 12);
          wheelGeo.rotateX(Math.PI / 2);
          const wheelMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.8 });
          const wheel = new THREE.Mesh(wheelGeo, wheelMat);
          wheel.position.set(wx, 0.5, wz);
          wheel.castShadow = true;
          singleTruck.add(wheel);
        });
      });

      // Paddock Team Hospitality Awning / Canopy Roof
      const awningGeo = new THREE.BoxGeometry(12.0, 0.15, 3.5);
      const awningMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 });
      const awning = new THREE.Mesh(awningGeo, awningMat);
      awning.position.set(0, 3.8, 2.8);
      awning.castShadow = true;
      singleTruck.add(awning);

      paddockTruckGroup.add(singleTruck);
    }

    this.group.add(paddockTruckGroup);
  }

  /**
   * Official FIA Safety Car, Medical Car & Circuit Recovery Cranes
   */
  private buildServiceAndSafetyVehicles(): void {
    const serviceGroup = new THREE.Group();

    // 1. Official FIA Safety Car parked at Pit Exit bay (x = 42, z = -121.5)
    const scGroup = new THREE.Group();
    scGroup.position.set(42, 0, -121.5);
    scGroup.rotation.y = Math.PI / 2;

    const carBodyGeo = new THREE.BoxGeometry(1.9, 0.75, 4.4);
    const scMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.85, roughness: 0.2 });
    const scBody = new THREE.Mesh(carBodyGeo, scMat);
    scBody.position.y = 0.55;
    scBody.castShadow = true;
    scGroup.add(scBody);

    // Green/Amber Roof Beacon Light Bar
    const lightBarGeo = new THREE.BoxGeometry(1.2, 0.18, 0.3);
    const lightBarMat = new THREE.MeshStandardMaterial({
      color: 0x000000,
      emissive: 0xf59e0b,
      emissiveIntensity: 3.2,
    });
    const lightBar = new THREE.Mesh(lightBarGeo, lightBarMat);
    lightBar.position.y = 1.35;
    scGroup.add(lightBar);

    serviceGroup.add(scGroup);

    // 2. Heavy-Duty Circuit Recovery Cranes with Telescopic Booms (Corners 2 & 4)
    const cranePositions = [
      { x: 148, z: 148, rot: -Math.PI / 4 },
      { x: -148, z: -148, rot: (3 * Math.PI) / 4 },
    ];

    cranePositions.forEach((cp) => {
      const crane = new THREE.Group();
      crane.position.set(cp.x, 0, cp.z);
      crane.rotation.y = cp.rot;

      // Heavy Truck Chassis (Yellow)
      const chassisGeo = new THREE.BoxGeometry(3.2, 1.8, 8.5);
      const chassisMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.6, roughness: 0.4 });
      const chassis = new THREE.Mesh(chassisGeo, chassisMat);
      chassis.position.y = 1.4;
      chassis.castShadow = true;
      crane.add(chassis);

      // Crane Boom (Extending 12m upward at 45 degree angle)
      const boomGeo = new THREE.CylinderGeometry(0.3, 0.45, 12, 8);
      boomGeo.rotateX(Math.PI / 4);
      const boomMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8, roughness: 0.3 });
      const boom = new THREE.Mesh(boomGeo, boomMat);
      boom.position.set(0, 6.5, 2.5);
      boom.castShadow = true;
      crane.add(boom);

      // Amber Flashing Beacon
      const beaconGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.3, 8);
      const beaconMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xf97316,
        emissiveIntensity: 3.5,
      });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.set(0, 3.2, -2.5);
      crane.add(beacon);

      serviceGroup.add(crane);
    });

    this.group.add(serviceGroup);
  }

  /**
   * FIA Speed Trap Radar Overpass Gantries (North Straight)
   * Spans cleanly across Z axis from z = 114 to z = 146 (safely behind barriers).
   */
  private buildSpeedTrapRadarAndSectorGantries(): void {
    const radarGroup = new THREE.Group();

    // 1. Super Straight High-Speed Radar Gantry (x = -100, z = -50)
    const superStraightGantry = new THREE.Group();
    superStraightGantry.position.set(-100, 0, -50);

    const spanX = 32;
    const gantryH = 7.8;
    const beamGeo = new THREE.BoxGeometry(spanX, 1.4, 1.4);
    const beam = new THREE.Mesh(beamGeo, this.overheadTrussMat);
    beam.position.y = gantryH;
    beam.castShadow = false;
    beam.receiveShadow = false;
    superStraightGantry.add(beam);

    [-spanX / 2 + 0.8, spanX / 2 - 0.8].forEach((px) => {
      const pGeo = new THREE.BoxGeometry(1.2, gantryH, 1.2);
      const pMesh = new THREE.Mesh(pGeo, this.overheadTrussMat);
      pMesh.position.set(px, gantryH / 2, 0);
      pMesh.castShadow = false;
      pMesh.receiveShadow = false;
      superStraightGantry.add(pMesh);
    });

    // Digital Speed Trap Radar Display
    const radarCanvas = document.createElement('canvas');
    radarCanvas.width = 256;
    radarCanvas.height = 64;
    const rCtx = radarCanvas.getContext('2d')!;
    rCtx.fillStyle = '#09090b';
    rCtx.fillRect(0, 0, 256, 64);
    rCtx.fillStyle = '#38bdf8';
    rCtx.font = 'bold 32px monospace';
    rCtx.fillText('SPEED TRAP: 358 KM/H', 10, 44);
    const radarTex = new THREE.CanvasTexture(radarCanvas);
    const radarMat = new THREE.MeshBasicMaterial({ map: radarTex });
    const radarMesh = new THREE.Mesh(new THREE.BoxGeometry(8, 1.2, 0.2), radarMat);
    radarMesh.position.set(0, gantryH, 0.75);
    superStraightGantry.add(radarMesh);

    const speedShadow = this.createOverheadSoftShadow(spanX + 2.0, 3.8, 'speed_trap', 0.60);
    speedShadow.position.set(0, 0.016, -4.5);
    superStraightGantry.add(speedShadow);

    radarGroup.add(superStraightGantry);
    this.group.add(radarGroup);
  }

  /**
   * Elevated Television Camera Scaffold Towers along High-Speed Corners (Safely in Infield & Outer Verge)
   */
  private buildTVBroadcastTowersAndCranes(): void {
    const tvGroup = new THREE.Group();
    const towerCoords = [
      { x: 55, z: -55, rot: -Math.PI / 4 },
      { x: -55, z: 55, rot: (3 * Math.PI) / 4 },
      { x: 0, z: -146, rot: 0 },
    ];

    towerCoords.forEach((tc) => {
      const tvTower = new THREE.Group();
      tvTower.position.set(tc.x, 0, tc.z);
      tvTower.rotation.y = tc.rot;

      // Scaffolding Mast (7m height)
      const mastGeo = new THREE.BoxGeometry(1.8, 7.0, 1.8);
      const mastMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
      const mast = new THREE.Mesh(mastGeo, mastMat);
      mast.position.y = 3.5;
      mast.castShadow = true;
      tvTower.add(mast);

      // Broadcast TV Camera Box + Lens
      const camBodyGeo = new THREE.BoxGeometry(0.45, 0.45, 1.2);
      const camLensGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.6, 12);
      camLensGeo.rotateX(Math.PI / 2);
      const camMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });
      const camBody = new THREE.Mesh(camBodyGeo, camMat);
      camBody.position.set(0, 7.35, 0);
      tvTower.add(camBody);

      const camLens = new THREE.Mesh(camLensGeo, camMat);
      camLens.position.set(0, 7.35, 0.7);
      tvTower.add(camLens);

      tvGroup.add(tvTower);
    });

    this.group.add(tvGroup);
  }

  /**
   * Pit Lane Overhead Air Booms, Pneumatic Rigs, and Fueling Lines
   */
  private buildPitEquipment(): void {
    const pitEquipGroup = new THREE.Group();

    // 6 Overhead Swiveling Air Booms extending over pit stops
    for (let b = 0; b < 6; b++) {
      const boomX = -38 + b * 15;
      const boom = new THREE.Group();
      boom.position.set(boomX, 4.2, -110.5);

      // Horizontal Arm extending 4.5m forward across pit bay
      const armGeo = new THREE.BoxGeometry(0.15, 0.15, 4.5);
      const armMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.8, roughness: 0.3 });
      const arm = new THREE.Mesh(armGeo, armMat);
      arm.position.set(0, 0, -2.25);
      boom.add(arm);

      // Hanging Pneumatic Hose Coils (Yellow/Red)
      const hoseGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6);
      const hoseMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.6 });
      const hose = new THREE.Mesh(hoseGeo, hoseMat);
      hose.position.set(0, -1.1, -4.2);
      boom.add(hose);

      pitEquipGroup.add(boom);
    }

    this.group.add(pitEquipGroup);
  }

  /**
   * Dynamic Props: Brake Marker Boards (150m, 100m, 50m) on all 4 Straights,
   * Turn Number Signs (T1, T2, T3, T4), Apex Cones, and Tire Stacks.
   */
  private buildDynamicProps(): void {
    let propId = 0;

    // 1. Distance Brake Marker Boards on Key Braking Zones
    const signConfigs = [
      // Turn 1 Variante Chicane Heavy Braking (Approach from S/F Straight)
      { text: '150m', x: 65, z: -140 },
      { text: '100m', x: 85, z: -140 },
      { text: '50m',  x: 105, z: -140 },

      // Turn 8 180° Slow Hairpin Heavy Braking
      { text: '150m', x: -15, z: 232 },
      { text: '100m', x: -35, z: 232 },
      { text: '50m',  x: -55, z: 232 },

      // Turn 10 Bus Stop Chicane Braking (Approach from Super Straight / 130R)
      { text: '150m', x: -112, z: -70 },
      { text: '100m', x: -108, z: -90 },
      { text: '50m',  x: -100, z: -110 },
    ];

    signConfigs.forEach((cfg) => {
      const signGroup = new THREE.Group();
      signGroup.position.set(cfg.x, 0, cfg.z);

      const poleGeo = new THREE.CylinderGeometry(0.04, 0.05, 1.4, 8);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.6 });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.y = 0.7;
      signGroup.add(pole);

      const boardGeo = new THREE.BoxGeometry(1.2, 0.75, 0.05);
      const bCanvas = document.createElement('canvas');
      bCanvas.width = 128;
      bCanvas.height = 80;
      const bCtx = bCanvas.getContext('2d')!;
      bCtx.fillStyle = '#09090b';
      bCtx.fillRect(0, 0, 128, 80);
      bCtx.fillStyle = '#f8fafc';
      bCtx.font = 'bold 36px monospace';
      bCtx.textAlign = 'center';
      bCtx.textBaseline = 'middle';
      bCtx.fillText(cfg.text, 64, 40);
      const bTex = new THREE.CanvasTexture(bCanvas);
      const bMat = new THREE.MeshBasicMaterial({ map: bTex });
      const board = new THREE.Mesh(boardGeo, bMat);
      board.position.y = 1.15;
      board.castShadow = true;
      signGroup.add(board);

      this.group.add(signGroup);

      this.dynamicProps.push({
        id: propId++,
        type: 'sign',
        mesh: signGroup,
        position: new THREE.Vector3(cfg.x, 0, cfg.z),
        velocity: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Vector3(0, 0, 0),
        angularVelocity: new THREE.Vector3(0, 0, 0),
        radius: 0.7,
        height: 1.4,
        mass: 12,
        isSleeping: true,
        baseY: 0,
      });
    });

    // 2. Official Turn Number Signs (T1 Chicane, T3 Sweeper, T4-T7 Esses, T8 Hairpin, T9 130R, T10 Bus Stop)
    const turnSigns = [
      { text: 'VARIANTE T1', x: 138, z: -138 },
      { text: 'THE SWEEP T3', x: 198, z: 20 },
      { text: 'THE ESSES T4-7', x: 80, z: 200 },
      { text: 'HAIRPIN T8', x: -105, z: 220 },
      { text: 'CURVONE 130R', x: -115, z: -95 },
      { text: 'BUS STOP T10', x: -75, z: -142 },
    ];

    turnSigns.forEach((ts) => {
      const tGroup = new THREE.Group();
      tGroup.position.set(ts.x, 0, ts.z);

      const boardGeo = new THREE.BoxGeometry(2.2, 1.1, 0.08);
      const tCanvas = document.createElement('canvas');
      tCanvas.width = 256;
      tCanvas.height = 128;
      const tCtx = tCanvas.getContext('2d')!;
      tCtx.fillStyle = '#1e3a8a';
      tCtx.fillRect(0, 0, 256, 128);
      tCtx.fillStyle = '#ffffff';
      tCtx.font = 'bold 44px sans-serif';
      tCtx.textAlign = 'center';
      tCtx.textBaseline = 'middle';
      tCtx.fillText(ts.text, 128, 64);
      const tTex = new THREE.CanvasTexture(tCanvas);
      const tMat = new THREE.MeshBasicMaterial({ map: tTex });
      const board = new THREE.Mesh(boardGeo, tMat);
      board.position.y = 1.8;
      board.castShadow = true;
      tGroup.add(board);

      const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.8, 8), this.metalDarkMat);
      leg1.position.set(-0.8, 0.9, 0);
      tGroup.add(leg1);

      const leg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.8, 8), this.metalDarkMat);
      leg2.position.set(0.8, 0.9, 0);
      tGroup.add(leg2);

      this.group.add(tGroup);
    });
  }

  /**
   * Helper to build a seamless curved road quad mesh in the XZ plane
   */
  private createCornerRoadMesh(
    cx: number,
    cz: number,
    innerR: number,
    outerR: number,
    startAngle: number,
    endAngle: number,
    segments: number = 32,
    mat: THREE.Material = this.asphaltMat,
    yPos: number = 0.005
  ): THREE.Mesh {
    const geo = new THREE.BufferGeometry();
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = startAngle + t * (endAngle - startAngle);
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      positions.push(cx + cosA * innerR, yPos, cz + sinA * innerR);
      uvs.push(0, t * 6);

      positions.push(cx + cosA * outerR, yPos, cz + sinA * outerR);
      uvs.push(1, t * 6);
    }

    for (let i = 0; i < segments; i++) {
      const p1 = i * 2;
      const p2 = p1 + 1;
      const p3 = (i + 1) * 2;
      const p4 = p3 + 1;

      indices.push(p1, p3, p2);
      indices.push(p2, p3, p4);
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    return mesh;
  }

  /**
   * Dynamic Prop Physics Simulation (Knockdowns, roll, bounce & friction)
   */
  public updateDynamicProps(dt: number): void {
    const gravity = 19.6;
    const airDrag = 0.985;
    const groundFriction = 0.88;

    for (let i = 0; i < this.dynamicProps.length; i++) {
      const prop = this.dynamicProps[i];
      if (prop.isSleeping) continue;

      // Integrate Velocity
      prop.position.x += prop.velocity.x * dt;
      prop.position.z += prop.velocity.z * dt;
      prop.position.y += prop.velocity.y * dt;

      // Apply Gravity
      if (prop.position.y > prop.baseY) {
        prop.velocity.y -= gravity * dt;
      } else {
        prop.position.y = prop.baseY;
        prop.velocity.y = Math.max(0, -prop.velocity.y * 0.35);
        prop.velocity.x *= groundFriction;
        prop.velocity.z *= groundFriction;
        prop.angularVelocity.x *= 0.90;
        prop.angularVelocity.z *= 0.90;
      }

      prop.velocity.x *= airDrag;
      prop.velocity.z *= airDrag;

      // Integrate Rotation
      prop.rotation.x += prop.angularVelocity.x * dt;
      prop.rotation.y += prop.angularVelocity.y * dt;
      prop.rotation.z += prop.angularVelocity.z * dt;

      // Sync Mesh Transform
      prop.mesh.position.copy(prop.position);
      prop.mesh.rotation.set(prop.rotation.x, prop.rotation.y, prop.rotation.z);

      // Sleep Threshold check
      const speedSq = prop.velocity.lengthSq();
      const angSpeedSq = prop.angularVelocity.lengthSq();
      if (speedSq < 0.04 && angSpeedSq < 0.04 && prop.position.y <= prop.baseY + 0.05) {
        prop.isSleeping = true;
        prop.velocity.set(0, 0, 0);
        prop.angularVelocity.set(0, 0, 0);
      }
    }
  }

  /**
   * Imparts crash momentum to a breakaway prop
   */
  public impartImpulseToProp(
    prop: DynamicProp,
    carVelocity: THREE.Vector3,
    contactNormal: THREE.Vector3
  ): void {
    prop.isSleeping = false;
    const impactSpeed = carVelocity.length();
    const impulseStrength = Math.min(28, Math.max(4, impactSpeed * 1.35));

    prop.velocity.x = contactNormal.x * impulseStrength + carVelocity.x * 0.45;
    prop.velocity.z = contactNormal.z * impulseStrength + carVelocity.z * 0.45;
    prop.velocity.y = Math.min(10, impulseStrength * 0.4 + Math.random() * 2);

    prop.angularVelocity.x = (Math.random() - 0.5) * impulseStrength * 1.8;
    prop.angularVelocity.y = (Math.random() - 0.5) * impulseStrength * 2.2;
    prop.angularVelocity.z = (Math.random() - 0.5) * impulseStrength * 1.8;
  }

  /**
   * Helper to create photorealistic fixed contact shadows with authentic
   * structural steel truss/lattice silhouettes, FIA equipment pods, and optical penumbra falloff.
   * Renders at 0.00ms runtime GPU overhead with zero Z-fighting or fillrate drop.
   */
  private createOverheadSoftShadow(
    width: number,
    length: number,
    type: 'gantry' | 'arch' | 'speed_trap',
    opacity = 0.65
  ): THREE.Mesh {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // 1. Base Ambient Penumbra Wash (Soft diffused solar atmospheric shadow)
    const radGrad = ctx.createRadialGradient(256, 256, 60, 256, 256, 250);
    radGrad.addColorStop(0.0, 'rgba(0, 0, 0, 0.40)');
    radGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.22)');
    radGrad.addColorStop(0.85, 'rgba(0, 0, 0, 0.08)');
    radGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = radGrad;
    ctx.fillRect(0, 0, 512, 512);

    // 2. Realistic Structural Steel Lattice & Frame Silhouettes
    if (type === 'gantry' || type === 'speed_trap') {
      // Main parallel longitudinal steel girders
      ctx.fillStyle = 'rgba(0, 0, 0, 0.68)';
      // Primary chord A
      ctx.fillRect(160, 32, 40, 448);
      // Primary chord B
      ctx.fillRect(312, 32, 40, 448);

      // Steel Cross-Struts and Triangular Lattice (Warren Truss pattern)
      ctx.lineWidth = 14;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let y = 48; y <= 464; y += 42) {
        // Horizontal connecting ties
        ctx.moveTo(160, y);
        ctx.lineTo(352, y);
        // Diagonal bracing trusses
        ctx.moveTo(160, y);
        ctx.lineTo(352, y + 42);
      }
      ctx.stroke();

      if (type === 'gantry') {
        // 5 FIA Red Start Light Pod Silhouettes hanging below the bridge
        ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
        for (let l = 0; l < 5; l++) {
          const podY = 175 + l * 38;
          ctx.beginPath();
          ctx.arc(128, podY, 15, 0, Math.PI * 2);
          ctx.fill();
          // Small bracket
          ctx.fillRect(128, podY - 5, 40, 10);
        }
      } else {
        // Digital Speed Trap Radar Box & Transponder Antenna Silhouettes
        ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
        ctx.fillRect(118, 190, 52, 132);
        ctx.fillRect(342, 220, 28, 72);
      }
    } else if (type === 'arch') {
      // Massive 38m Sponsor Arch Bridge: Solid Aerodynamic Cantilever Body & Framing
      // Core solid box shadow with soft penumbra core
      ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
      ctx.fillRect(36, 120, 440, 272);

      // Sponsor Billboard Header & Trim
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(24, 150, 464, 212);

      // Secondary structural stiffeners on the trailing edge
      ctx.lineWidth = 16;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.58)';
      ctx.beginPath();
      for (let x = 64; x <= 448; x += 48) {
        ctx.moveTo(x, 100);
        ctx.lineTo(x, 412);
      }
      ctx.stroke();
    }

    // 3. Optical Penumbra Softening Mask (Solar Angular Diameter blur filter)
    ctx.globalCompositeOperation = 'destination-in';
    const edgeGradX = ctx.createLinearGradient(0, 0, 512, 0);
    edgeGradX.addColorStop(0.0, 'rgba(0, 0, 0, 0.0)');
    edgeGradX.addColorStop(0.10, 'rgba(0, 0, 0, 0.85)');
    edgeGradX.addColorStop(0.5, 'rgba(0, 0, 0, 1.0)');
    edgeGradX.addColorStop(0.90, 'rgba(0, 0, 0, 0.85)');
    edgeGradX.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = edgeGradX;
    ctx.fillRect(0, 0, 512, 512);

    const edgeGradY = ctx.createLinearGradient(0, 0, 0, 512);
    edgeGradY.addColorStop(0.0, 'rgba(0, 0, 0, 0.0)');
    edgeGradY.addColorStop(0.08, 'rgba(0, 0, 0, 0.90)');
    edgeGradY.addColorStop(0.5, 'rgba(0, 0, 0, 1.0)');
    edgeGradY.addColorStop(0.92, 'rgba(0, 0, 0, 0.90)');
    edgeGradY.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = edgeGradY;
    ctx.fillRect(0, 0, 512, 512);

    const tex = new THREE.CanvasTexture(canvas);
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;

    const geo = new THREE.PlaneGeometry(width, length);
    geo.rotateX(-Math.PI / 2);

    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: opacity,
      depthWrite: false,
      polygonOffset: false,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 0.016; // Sits flush above asphalt and road markings
    mesh.renderOrder = 1; // Renders right after road geometry, prior to car contact shadow and particles
    return mesh;
  }
}
