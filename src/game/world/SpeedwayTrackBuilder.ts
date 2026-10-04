/**
 * SpeedwayTrackBuilder.ts - Professional FIA Grade-1 Apex Super Speedway GP
 * Features an enormous 600m main straight (>360 km/h), heavy braking hairpin,
 * technical left-right chicane, high-speed 130R sweeper, PBR materials,
 * 2-story Pit Lane & Paddock Club, tecpro cushions, and lush organic vegetation.
 */

import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import asphaltImg from '../../assets/images/track_asphalt_detail_1790904767865.jpg';
import { StaticObstacle, DynamicProp } from './TrackBuilder';
import { buildApexSpeedwayWaypoints, SplinePoint } from '../career/CircuitConfig';

export class SpeedwayTrackBuilder {
  public group: THREE.Group;
  public staticObstacles: StaticObstacle[] = [];
  public dynamicProps: DynamicProp[] = [];

  // Track Dimensions & Bounding
  public readonly trackWidth = 16;
  public readonly halfSize = 250;

  // Pit Stop Area Bounds (Parallel to the massive straight at Z = -180)
  public readonly pitZone = {
    minX: -170,
    maxX: -20,
    minZ: -172.5,
    maxZ: -155.0,
  };

  // High-Performance PBR Materials
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
  private glassMat!: THREE.MeshStandardMaterial;
  private metalDarkMat!: THREE.MeshStandardMaterial;
  private metalSilverMat!: THREE.MeshStandardMaterial;
  private overheadTrussMat!: THREE.MeshStandardMaterial;
  private startLightMat!: THREE.MeshBasicMaterial;
  private floodlightMat!: THREE.MeshStandardMaterial;

  constructor() {
    this.group = new THREE.Group();
    this.initMaterials();
    this.buildTerrainAndInfield();
    this.buildSpeedwayCircuitTrack();
    this.buildKerbsAndStartingGrid();
    this.buildConcreteBarriersWithCatchFences();
    this.buildTecproRunoffZones();
    this.buildMarshalSafetyPosts();
    this.buildGrandstands();
    this.buildPaddockBuildingAndPitLane();
    this.buildPaddockTransportersAndTrailers();
    this.buildSpeedTrapRadarAndSectorGantries();
    this.buildJumbotronAndTimingTowers();
    this.buildOverheadGantriesAndBridges();
    this.buildHighMastFloodlights();
    this.buildOrganicVegetation();
    this.buildDynamicProps();

    // Scene Graph Optimization & Static Matrix Freezing
    const dynamicMeshes = new Set(this.dynamicProps.map(p => p.mesh));
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.castShadow = false;
        const isGroundReceiver =
          obj.material === this.asphaltMat ||
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

    // High-Grip Racing Asphalt Texture
    const asphaltTex = textureLoader.load(asphaltImg);
    asphaltTex.wrapS = THREE.RepeatWrapping;
    asphaltTex.wrapT = THREE.RepeatWrapping;
    asphaltTex.anisotropy = 16;
    asphaltTex.generateMipmaps = true;
    asphaltTex.repeat.set(32, 16);

    this.asphaltMat = new THREE.MeshStandardMaterial({
      map: asphaltTex,
      color: 0x24282f,
      roughness: 0.68,
      metalness: 0.08,
    });

    // PBR Grass Turf
    const grassCanvas = document.createElement('canvas');
    grassCanvas.width = 512;
    grassCanvas.height = 512;
    const gCtx = grassCanvas.getContext('2d')!;
    gCtx.fillStyle = '#225528';
    gCtx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 3000; i++) {
      gCtx.fillStyle = Math.random() > 0.5 ? '#1b4420' : '#2b6832';
      gCtx.fillRect(Math.random() * 512, Math.random() * 512, 3, 3);
    }
    const grassTex = new THREE.CanvasTexture(grassCanvas);
    grassTex.wrapS = THREE.RepeatWrapping;
    grassTex.wrapT = THREE.RepeatWrapping;
    grassTex.repeat.set(48, 48);

    this.grassMat = new THREE.MeshStandardMaterial({
      map: grassTex,
      roughness: 0.84,
      metalness: 0.02,
    });

    this.gravelMat = new THREE.MeshStandardMaterial({
      color: 0xb59868,
      roughness: 0.95,
      metalness: 0.02,
    });

    this.dirtShoulderMat = new THREE.MeshStandardMaterial({
      color: 0x261a10,
      roughness: 0.96,
      metalness: 0.02,
    });

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

    this.concreteBarrierMat = new THREE.MeshStandardMaterial({
      color: 0x5a6370,
      roughness: 0.92,
      metalness: 0.02,
    });

    this.metalFenceMat = new THREE.MeshStandardMaterial({
      color: 0x1e2229,
      metalness: 0.40,
      roughness: 0.65,
    });

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

    this.overheadTrussMat = new THREE.MeshStandardMaterial({
      color: 0x1a202c,
      metalness: 0.20,
      roughness: 0.82,
    });

    this.startLightMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
    });

    this.glassMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.35,
      roughness: 0.08,
      transparent: true,
      opacity: 0.55,
    });

    this.treeBarkMat = new THREE.MeshStandardMaterial({
      color: 0x2e1a0f,
      roughness: 0.90,
      metalness: 0.02,
    });
    this.pineFoliageMat = new THREE.MeshStandardMaterial({
      color: 0x0a2410,
      roughness: 0.92,
      metalness: 0.01,
    });
    this.oakFoliageMat = new THREE.MeshStandardMaterial({
      color: 0x18421c,
      roughness: 0.90,
      metalness: 0.01,
    });
    this.cypressFoliageMat = new THREE.MeshStandardMaterial({
      color: 0x0e2d14,
      roughness: 0.94,
      metalness: 0.01,
    });
    this.bushFoliageMat = new THREE.MeshStandardMaterial({
      color: 0x1f5424,
      roughness: 0.88,
      metalness: 0.01,
    });

    this.floodlightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xfffbeb,
      emissiveIntensity: 3.5,
      roughness: 0.1,
    });
  }

  private buildTerrainAndInfield(): void {
    const terrainGroup = new THREE.Group();

    // 1. Massive Ground Plane covering 900m x 700m
    const groundGeo = new THREE.PlaneGeometry(950, 750, 32, 32);
    groundGeo.rotateX(-Math.PI / 2);
    const ground = new THREE.Mesh(groundGeo, this.grassMat);
    ground.receiveShadow = true;
    terrainGroup.add(ground);

    // 2. T1 Hairpin Runoff Gravel Trap (at the end of the huge straight)
    const t1GravelGeo = new THREE.PlaneGeometry(90, 80);
    t1GravelGeo.rotateX(-Math.PI / 2);
    const t1Gravel = new THREE.Mesh(t1GravelGeo, this.gravelMat);
    t1Gravel.position.set(315, 0.008, -150);
    t1Gravel.receiveShadow = true;
    terrainGroup.add(t1Gravel);

    // 3. Chicane Runoff Gravel Trap
    const chicaneGravelGeo = new THREE.PlaneGeometry(60, 90);
    chicaneGravelGeo.rotateX(-Math.PI / 2);
    const chicaneGravel = new THREE.Mesh(chicaneGravelGeo, this.gravelMat);
    chicaneGravel.position.set(155, 0.008, -80);
    chicaneGravel.receiveShadow = true;
    terrainGroup.add(chicaneGravel);

    // 4. T7 High-Speed Sweeper Gravel Trap
    const t7GravelGeo = new THREE.RingGeometry(120, 145, 24, 1, Math.PI / 2, Math.PI / 2);
    t7GravelGeo.rotateX(-Math.PI / 2);
    const t7Gravel = new THREE.Mesh(t7GravelGeo, this.gravelMat);
    t7Gravel.position.set(-140, 0.008, 10);
    t7Gravel.receiveShadow = true;
    terrainGroup.add(t7Gravel);

    // 5. Infield Helipad
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
    helipad.position.set(-40, 0.012, -40);
    helipad.receiveShadow = true;
    terrainGroup.add(helipad);

    this.group.add(terrainGroup);
  }

  /**
   * Generates ribbon asphalt track geometry connecting the entire 2.420m Grand Prix layout
   */
  private buildSpeedwayCircuitTrack(): void {
    const waypoints = buildApexSpeedwayWaypoints();
    const trackGroup = new THREE.Group();

    // Create ribbon triangles connecting consecutive spline slices
    const halfW = this.trackWidth / 2;
    const pts = waypoints;
    const count = pts.length;

    const vertices: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    let accumDist = 0;

    for (let i = 0; i <= count; i++) {
      const idx = i % count;
      const pt = pts[idx];
      const prevIdx = (i - 1 + count) % count;
      const prevPt = pts[prevIdx];

      if (i > 0) {
        const dx = pt.x - prevPt.x;
        const dz = pt.z - prevPt.z;
        accumDist += Math.sqrt(dx * dx + dz * dz);
      }

      // Perpendicular normal to the heading yaw
      const perpX = Math.cos(pt.yaw);
      const perpZ = -Math.sin(pt.yaw);

      // Left edge
      const lx = pt.x + perpX * halfW;
      const lz = pt.z + perpZ * halfW;
      // Right edge
      const rx = pt.x - perpX * halfW;
      const rz = pt.z - perpZ * halfW;

      // Sits precisely at Y = 0.015 above terrain
      vertices.push(lx, 0.015, lz);
      vertices.push(rx, 0.015, rz);

      const vUv = accumDist * 0.15;
      uvs.push(0, vUv);
      uvs.push(1, vUv);

      if (i < count) {
        const base = i * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }
    }

    const trackGeo = new THREE.BufferGeometry();
    trackGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    trackGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    trackGeo.setIndex(indices);
    trackGeo.computeVertexNormals();

    const trackMesh = new THREE.Mesh(trackGeo, this.asphaltMat);
    trackMesh.receiveShadow = true;
    trackGroup.add(trackMesh);

    // Pit Lane Asphalt Strip (Parallel to main straight: Z = -163, X from -170 to -20)
    const pitLaneGeo = new THREE.PlaneGeometry(150, 11);
    pitLaneGeo.rotateX(-Math.PI / 2);
    const pitLaneMesh = new THREE.Mesh(pitLaneGeo, this.asphaltMat);
    pitLaneMesh.position.set(-95, 0.018, -164);
    pitLaneMesh.receiveShadow = true;
    trackGroup.add(pitLaneMesh);

    // Pit Speed Limit Line (X = -160 & X = -25)
    const pLineGeo = new THREE.PlaneGeometry(0.6, 11);
    pLineGeo.rotateX(-Math.PI / 2);
    const pLineMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
    const pLine1 = new THREE.Mesh(pLineGeo, pLineMat);
    pLine1.position.set(-160, 0.022, -164);
    trackGroup.add(pLine1);

    const pLine2 = new THREE.Mesh(pLineGeo, pLineMat);
    pLine2.position.set(-25, 0.022, -164);
    trackGroup.add(pLine2);

    this.group.add(trackGroup);
  }

  /**
   * Builds FIA red and white kerbs along critical corner apexes and starting grid boxes
   */
  private buildKerbsAndStartingGrid(): void {
    const kerbGroup = new THREE.Group();
    const waypoints = buildApexSpeedwayWaypoints();
    const halfW = this.trackWidth / 2;

    const kerbSegments = [
      // 1. T1-T2 Hairpin Kerb (outside and inside)
      { startIdx: 45, endIdx: 68, side: 'both' },
      // 2. Chicane Kerbs (aggressive attack kerbs)
      { startIdx: 82, endIdx: 98, side: 'both' },
      // 3. T5 Medium Sweeper Kerb
      { startIdx: 102, endIdx: 118, side: 'inside' },
      // 4. T7 Super Sweeper Kerb
      { startIdx: 138, endIdx: 162, side: 'inside' },
    ];

    const blockLen = 1.6;
    const blockW = 1.3;
    const blockH = 0.12;
    const redGeo = new THREE.BoxGeometry(blockW, blockH, blockLen);
    const whiteGeo = new THREE.BoxGeometry(blockW, blockH, blockLen);

    kerbSegments.forEach((seg) => {
      for (let i = seg.startIdx; i <= seg.endIdx; i++) {
        const pt = waypoints[i % waypoints.length];
        const isRed = i % 2 === 0;
        const mat = isRed ? this.kerbRedMat : this.kerbWhiteMat;
        const perpX = Math.cos(pt.yaw);
        const perpZ = -Math.sin(pt.yaw);

        // Outside kerb
        if (seg.side === 'both' || seg.side === 'outside') {
          const meshOut = new THREE.Mesh(redGeo, mat);
          meshOut.position.set(pt.x + perpX * (halfW + blockW / 2), blockH / 2, pt.z + perpZ * (halfW + blockW / 2));
          meshOut.rotation.y = pt.yaw;
          kerbGroup.add(meshOut);
        }

        // Inside kerb
        if (seg.side === 'both' || seg.side === 'inside') {
          const meshIn = new THREE.Mesh(whiteGeo, mat);
          meshIn.position.set(pt.x - perpX * (halfW + blockW / 2), blockH / 2, pt.z - perpZ * (halfW + blockW / 2));
          meshIn.rotation.y = pt.yaw;
          kerbGroup.add(meshIn);
        }
      }
    });

    // Starting Grid Markings (Z = -180, X from -110 to -50)
    const gridCanvas = document.createElement('canvas');
    gridCanvas.width = 128;
    gridCanvas.height = 256;
    const gridCtx = gridCanvas.getContext('2d')!;
    gridCtx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    gridCtx.fillRect(10, 10, 108, 16);
    gridCtx.fillRect(10, 10, 16, 120);
    gridCtx.fillRect(102, 10, 16, 120);

    const gridTex = new THREE.CanvasTexture(gridCanvas);
    const gridMat = new THREE.MeshStandardMaterial({
      map: gridTex,
      transparent: true,
      roughness: 0.4,
    });

    const gridGeo = new THREE.PlaneGeometry(3.6, 6.0);
    gridGeo.rotateX(-Math.PI / 2);

    for (let slot = 1; slot <= 10; slot++) {
      const isLeft = slot % 2 === 1;
      const gx = -110.0 + (slot - 1) * 9.0;
      const gz = isLeft ? -178.0 : -182.0;

      const gMesh = new THREE.Mesh(gridGeo, gridMat);
      gMesh.position.set(gx, 0.022, gz);
      gMesh.rotation.y = Math.PI / 2;
      kerbGroup.add(gMesh);
    }

    // Start / Finish Line
    const sLineGeo = new THREE.PlaneGeometry(16, 1.2);
    sLineGeo.rotateX(-Math.PI / 2);
    const sLineMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const sLineMesh = new THREE.Mesh(sLineGeo, sLineMat);
    sLineMesh.position.set(-112, 0.021, -180);
    sLineMesh.rotation.y = 0;
    kerbGroup.add(sLineMesh);

    this.group.add(kerbGroup);
  }

  /**
   * Perimeter FIA Concrete Barriers, Steel Catch Fences and Static Physical Obstacles
   */
  private buildConcreteBarriersWithCatchFences(): void {
    const barrierGroup = new THREE.Group();
    const waypoints = buildApexSpeedwayWaypoints();
    const halfW = this.trackWidth / 2;
    const wallOffset = 8.5; // Distance from track edge

    const count = waypoints.length;
    const step = 4; // Subsampled barrier posts

    for (let i = 0; i < count; i += step) {
      const pt1 = waypoints[i];
      const nextIdx = (i + step) % count;
      const pt2 = waypoints[nextIdx];

      // Outside Wall Segment
      const perp1X = Math.cos(pt1.yaw);
      const perp1Z = -Math.sin(pt1.yaw);
      const perp2X = Math.cos(pt2.yaw);
      const perp2Z = -Math.sin(pt2.yaw);

      const w1x = pt1.x + perp1X * (halfW + wallOffset);
      const w1z = pt1.z + perp1Z * (halfW + wallOffset);
      const w2x = pt2.x + perp2X * (halfW + wallOffset);
      const w2z = pt2.z + perp2Z * (halfW + wallOffset);

      const dx = w2x - w1x;
      const dz = w2z - w1z;
      const len = Math.sqrt(dx * dx + dz * dz);
      const yaw = Math.atan2(dx, dz);

      // Concrete Base Wall
      const wallGeo = new THREE.BoxGeometry(0.7, 1.2, len);
      const wallMesh = new THREE.Mesh(wallGeo, this.concreteBarrierMat);
      wallMesh.position.set((w1x + w2x) / 2, 0.6, (w1z + w2z) / 2);
      wallMesh.rotation.y = yaw;
      barrierGroup.add(wallMesh);

      // Catch Fence
      const fenceGeo = new THREE.PlaneGeometry(len, 2.5);
      const fenceMesh = new THREE.Mesh(fenceGeo, this.metalFenceMat);
      fenceMesh.position.set((w1x + w2x) / 2, 2.45, (w1z + w2z) / 2);
      fenceMesh.rotation.y = yaw + Math.PI / 2;
      barrierGroup.add(fenceMesh);

      // Register Static Physical Collision Obstacle
      this.staticObstacles.push({
        x: (w1x + w2x) / 2,
        z: (w1z + w2z) / 2,
        radius: 0.8,
        isWallSegment: true,
        p1: { x: w1x, z: w1z },
        p2: { x: w2x, z: w2z },
        type: 'wall',
      });
    }

    this.group.add(barrierGroup);
  }

  /**
   * Tecpro High-Impact Runoff Zones (especially at the end of the 360 km/h straight)
   */
  private buildTecproRunoffZones(): void {
    const tecproGroup = new THREE.Group();

    // T1 Hairpin Outer Runoff Tecpro Barrier (Z: -185 to -120, X: 312 to 318)
    for (let z = -180; z <= -120; z += 1.8) {
      for (let row = 0; row < 2; row++) {
        const x = 312 + row * 1.5;
        const isRed = Math.floor(z / 1.8) % 2 === 0;
        const mat = isRed ? this.tecproRedMat : this.tecproWhiteMat;
        const geo = new THREE.BoxGeometry(1.2, 1.0, 1.6);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, 0.5, z);
        tecproGroup.add(mesh);

        this.staticObstacles.push({
          x,
          z,
          radius: 0.9,
          type: 'tecpro',
        });
      }
    }

    // Chicane Tecpro Cushions (X: 140, Z: -130 to -100)
    for (let z = -125; z <= -95; z += 2.0) {
      const x = 148;
      const isRed = Math.floor(z / 2.0) % 2 === 0;
      const mat = isRed ? this.tecproRedMat : this.tecproWhiteMat;
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 1.8), mat);
      mesh.position.set(x, 0.5, z);
      tecproGroup.add(mesh);

      this.staticObstacles.push({
        x,
        z,
        radius: 0.9,
        type: 'tecpro',
      });
    }

    this.group.add(tecproGroup);
  }

  private buildMarshalSafetyPosts(): void {
    const marshalGroup = new THREE.Group();
    const postPositions = [
      { x: -160, z: -192 },
      { x: 50, z: -192 },
      { x: 260, z: -192 },
      { x: 305, z: -115 },
      { x: 170, z: -136 },
      { x: 100, z: -15 },
      { x: -50, z: 80 },
      { x: -240, z: 25 },
      { x: -268, z: -100 },
    ];

    postPositions.forEach((pos) => {
      const hut = new THREE.Group();
      hut.position.set(pos.x, 0, pos.z);

      const base = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 2.4), this.metalDarkMat);
      base.position.y = 1.1;
      hut.add(base);

      const roof = new THREE.Mesh(new THREE.ConeGeometry(2.0, 0.8, 4), this.metalSilverMat);
      roof.position.y = 2.6;
      roof.rotation.y = Math.PI / 4;
      hut.add(roof);

      // Green & Yellow Flag Silhouettes
      const flagGeo = new THREE.PlaneGeometry(0.8, 0.5);
      const flagMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide });
      const flagMesh = new THREE.Mesh(flagGeo, flagMat);
      flagMesh.position.set(0.6, 2.0, 1.25);
      hut.add(flagMesh);

      marshalGroup.add(hut);
      this.staticObstacles.push({ x: pos.x, z: pos.z, radius: 1.6, type: 'building' });
    });

    this.group.add(marshalGroup);
  }

  private buildGrandstands(): void {
    const standGroup = new THREE.Group();

    // 1. South Main Straight Grandstand (Parallel to straight at Z = -204, X from -150 to +50)
    for (let x = -140; x <= 40; x += 32) {
      const g = this.createGrandstandBlock(30, 12, 14);
      g.position.set(x, 0, -204);
      standGroup.add(g);
      this.staticObstacles.push({ x, z: -204, radius: 10.0, type: 'building' });
    }

    // 2. Hairpin Stadium Grandstand (Around T1 Hairpin at X = 320, Z = -160)
    const hpStand = this.createGrandstandBlock(45, 14, 16);
    hpStand.position.set(325, 0, -155);
    hpStand.rotation.y = -Math.PI / 2;
    standGroup.add(hpStand);
    this.staticObstacles.push({ x: 325, z: -155, radius: 15.0, type: 'building' });

    // 3. Chicane Grandstand (X = 90, Z = -120)
    const chStand = this.createGrandstandBlock(36, 12, 14);
    chStand.position.set(90, 0, -125);
    chStand.rotation.y = Math.PI;
    standGroup.add(chStand);
    this.staticObstacles.push({ x: 90, z: -125, radius: 12.0, type: 'building' });

    this.group.add(standGroup);
  }

  private createGrandstandBlock(width: number, height: number, depth: number): THREE.Group {
    const group = new THREE.Group();
    // Stepped tiers
    const tiers = 6;
    for (let t = 0; t < tiers; t++) {
      const tH = (height / tiers) * (t + 1);
      const tD = depth / tiers;
      const tierMesh = new THREE.Mesh(
        new THREE.BoxGeometry(width, tH, tD),
        this.concreteBarrierMat
      );
      tierMesh.position.set(0, tH / 2, -depth / 2 + t * tD + tD / 2);
      group.add(tierMesh);
    }

    // Canopy Roof
    const roof = new THREE.Mesh(new THREE.PlaneGeometry(width + 2, depth + 4), this.metalSilverMat);
    roof.rotateX(Math.PI / 2 - 0.15);
    roof.position.set(0, height + 1.5, 0);
    group.add(roof);

    return group;
  }

  private buildPaddockBuildingAndPitLane(): void {
    const paddockGroup = new THREE.Group();

    // 2-Story Pit Garages along Z = -154, X from -160 to -30 (130m long)
    const pBuilding = new THREE.Mesh(
      new THREE.BoxGeometry(130, 8.5, 16),
      this.concreteBarrierMat
    );
    pBuilding.position.set(-95, 4.25, -150);
    paddockGroup.add(pBuilding);

    // VIP Glass Lounge on 2nd Floor
    const glassLounge = new THREE.Mesh(
      new THREE.BoxGeometry(128, 3.2, 16.2),
      this.glassMat
    );
    glassLounge.position.set(-95, 6.2, -150);
    paddockGroup.add(glassLounge);

    // Pit Garages Overhead Cantilever Canopy
    const canopy = new THREE.Mesh(
      new THREE.BoxGeometry(130, 0.4, 7.0),
      this.overheadTrussMat
    );
    canopy.position.set(-95, 4.5, -161);
    paddockGroup.add(canopy);

    this.staticObstacles.push({
      x: -95,
      z: -150,
      radius: 25.0,
      type: 'building',
    });

    this.group.add(paddockGroup);
  }

  private buildPaddockTransportersAndTrailers(): void {
    const trailerGroup = new THREE.Group();
    const colors = [0xdc2626, 0x0284c7, 0xf59e0b, 0x10b981, 0x6366f1, 0x111827];

    for (let i = 0; i < 6; i++) {
      const x = -150 + i * 22;
      const z = -136;
      const tMat = new THREE.MeshStandardMaterial({
        color: colors[i % colors.length],
        metalness: 0.7,
        roughness: 0.25,
      });
      const trailer = new THREE.Mesh(new THREE.BoxGeometry(16, 4.2, 4.0), tMat);
      trailer.position.set(x, 2.1, z);
      trailerGroup.add(trailer);
    }

    this.group.add(trailerGroup);
  }

  private buildSpeedTrapRadarAndSectorGantries(): void {
    const gantryGroup = new THREE.Group();

    // 1. Start/Finish Overhead Gantry (X = -112, Z = -180)
    const g1 = this.createOverheadGantry(22, 7.5, 'gantry');
    g1.position.set(-112, 0, -180);
    gantryGroup.add(g1);

    // 2. Speed Trap Radar Gantry at end of 550m straight (X = 240, Z = -180)
    const g2 = this.createOverheadGantry(22, 7.5, 'radar');
    g2.position.set(240, 0, -180);
    gantryGroup.add(g2);

    this.group.add(gantryGroup);
  }

  private createOverheadGantry(spanWidth: number, height: number, type: 'gantry' | 'radar'): THREE.Group {
    const group = new THREE.Group();

    // Left and Right Pillars
    const pLeft = new THREE.Mesh(new THREE.BoxGeometry(0.8, height, 0.8), this.overheadTrussMat);
    pLeft.position.set(0, height / 2, -spanWidth / 2);
    group.add(pLeft);

    const pRight = new THREE.Mesh(new THREE.BoxGeometry(0.8, height, 0.8), this.overheadTrussMat);
    pRight.position.set(0, height / 2, spanWidth / 2);
    group.add(pRight);

    // Top Crossbeam
    const beam = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, spanWidth + 1.6), this.overheadTrussMat);
    beam.position.set(0, height, 0);
    group.add(beam);

    if (type === 'gantry') {
      // 5 FIA Start Lights
      for (let i = 0; i < 5; i++) {
        const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16), this.startLightMat);
        pod.rotateZ(Math.PI / 2);
        pod.position.set(0.65, height - 0.6, -3 + i * 1.5);
        group.add(pod);
      }
    }

    return group;
  }

  private buildJumbotronAndTimingTowers(): void {
    const jumbotronGroup = new THREE.Group();

    // Giant Live Screen facing Main Straight
    const screenMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 9),
      new THREE.MeshBasicMaterial({ color: 0x0284c7 })
    );
    screenMesh.position.set(-60, 11, -198);
    jumbotronGroup.add(screenMesh);

    // Timing Leaderboard Tower
    const tower = new THREE.Mesh(new THREE.BoxGeometry(3.5, 22, 3.5), this.metalDarkMat);
    tower.position.set(-168, 11, -188);
    jumbotronGroup.add(tower);

    this.group.add(jumbotronGroup);
  }

  private buildOverheadGantriesAndBridges(): void {
    const bridgeGroup = new THREE.Group();

    // Sponsor Arch Bridge over Chicane (X = 115, Z = -85)
    const arch = new THREE.Mesh(new THREE.BoxGeometry(22, 2.5, 4.5), this.overheadTrussMat);
    arch.position.set(115, 8.5, -85);
    arch.rotation.y = 0.5;
    bridgeGroup.add(arch);

    this.group.add(bridgeGroup);
  }

  private buildHighMastFloodlights(): void {
    const floodlightGroup = new THREE.Group();
    const lightPositions = [
      { x: -160, z: -210 },
      { x: 0, z: -210 },
      { x: 180, z: -210 },
      { x: 310, z: -190 },
      { x: 310, z: -110 },
      { x: 120, z: -140 },
      { x: 40, z: 60 },
      { x: -140, z: 120 },
      { x: -260, z: -40 },
    ];

    lightPositions.forEach((pos) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.75, 28, 12), this.metalSilverMat);
      pole.position.set(pos.x, 14, pos.z);
      floodlightGroup.add(pole);

      const lampHead = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.0, 1.2), this.floodlightMat);
      lampHead.position.set(pos.x, 28, pos.z);
      floodlightGroup.add(lampHead);

      this.staticObstacles.push({ x: pos.x, z: pos.z, radius: 1.0, type: 'pillar' });
    });

    this.group.add(floodlightGroup);
  }

  private buildOrganicVegetation(): void {
    const vegGroup = new THREE.Group();

    // Perimeter Pine & Oak Corridors
    const treePositions: { x: number; z: number; type: 'pine' | 'oak' | 'cypress'; scale: number }[] = [];

    // Outer North Forest
    for (let x = -260; x <= 320; x += 16) {
      treePositions.push({ x, z: -230 - Math.random() * 40, type: 'pine', scale: 1.0 + Math.random() * 0.5 });
      treePositions.push({ x, z: -245 - Math.random() * 40, type: 'oak', scale: 1.0 + Math.random() * 0.4 });
    }

    // Infield Meadow Grove
    for (let x = -80; x <= 40; x += 20) {
      for (let z = -90; z <= 20; z += 20) {
        if (Math.hypot(x - (-40), z - (-40)) > 25) {
          treePositions.push({ x, z, type: Math.random() > 0.5 ? 'pine' : 'cypress', scale: 0.9 + Math.random() * 0.4 });
        }
      }
    }

    // South/West Outer Forest
    for (let x = -260; x <= 0; x += 18) {
      treePositions.push({ x, z: 120 + Math.random() * 35, type: 'oak', scale: 1.1 + Math.random() * 0.4 });
    }

    treePositions.forEach((tp) => {
      const tree = new THREE.Group();
      tree.position.set(tp.x, 0, tp.z);
      tree.scale.setScalar(tp.scale);

      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 3.5, 8), this.treeBarkMat);
      trunk.position.y = 1.75;
      tree.add(trunk);

      let foliageMat = this.pineFoliageMat;
      let fGeo: THREE.BufferGeometry = new THREE.ConeGeometry(2.4, 6.0, 8);
      if (tp.type === 'oak') {
        foliageMat = this.oakFoliageMat;
        fGeo = new THREE.SphereGeometry(2.8, 8, 8);
      } else if (tp.type === 'cypress') {
        foliageMat = this.cypressFoliageMat;
        fGeo = new THREE.ConeGeometry(1.5, 7.5, 8);
      }

      const foliage = new THREE.Mesh(fGeo, foliageMat);
      foliage.position.y = tp.type === 'oak' ? 4.5 : 5.0;
      tree.add(foliage);

      vegGroup.add(tree);
      this.staticObstacles.push({ x: tp.x, z: tp.z, radius: 1.2, type: 'tree' });
    });

    this.group.add(vegGroup);
  }

  private buildDynamicProps(): void {
    let propId = 1;

    // Distance Brake Marker Boards on approach to T1 Hairpin (200m, 150m, 100m, 50m)
    const markers = ['200', '150', '100', '50'];
    markers.forEach((dist, idx) => {
      const x = 160 + idx * 24;
      const z = -190;

      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 160;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, 256, 160);
      ctx.lineWidth = 12;
      ctx.strokeStyle = '#facc15';
      ctx.strokeRect(6, 6, 244, 148);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 82px "Arial Black", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(dist, 128, 80);

      const tex = new THREE.CanvasTexture(canvas);
      const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.35 });
      const board = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 0.08), mat);
      board.position.set(x, 1.35, z);
      this.group.add(board);
    });

    // Apex Cones along the Chicane
    const chicaneCones = [
      { x: 135, z: -110 },
      { x: 120, z: -94 },
      { x: 108, z: -72 },
    ];

    chicaneCones.forEach((pos) => {
      const coneMesh = new THREE.Mesh(
        new THREE.ConeGeometry(0.24, 0.65, 10),
        new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.35 })
      );
      coneMesh.position.set(pos.x, 0.325, pos.z);
      this.group.add(coneMesh);

      this.dynamicProps.push({
        id: propId++,
        type: 'cone',
        mesh: coneMesh,
        position: new THREE.Vector3(pos.x, 0, pos.z),
        velocity: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Vector3(0, 0, 0),
        angularVelocity: new THREE.Vector3(0, 0, 0),
        radius: 0.35,
        height: 0.65,
        mass: 3.5,
        isSleeping: true,
        baseY: 0.325,
      });
    });
  }

  public impartImpulseToProp(prop: DynamicProp, carVelocity: THREE.Vector3, impactNormal: THREE.Vector3): void {
    prop.isSleeping = false;
    prop.velocity.copy(carVelocity).multiplyScalar(0.75).addScaledVector(impactNormal, 4.0);
    prop.velocity.y = 2.5 + Math.random() * 2.0;
    prop.angularVelocity.set(
      (Math.random() - 0.5) * 12,
      (Math.random() - 0.5) * 15,
      (Math.random() - 0.5) * 12
    );
  }

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

      // Apply Gravity & Drag
      prop.velocity.y -= gravity * dt;
      prop.velocity.x *= airDrag;
      prop.velocity.z *= airDrag;

      // Integrate Rotation
      prop.rotation.x += prop.angularVelocity.x * dt;
      prop.rotation.y += prop.angularVelocity.y * dt;
      prop.rotation.z += prop.angularVelocity.z * dt;
      prop.angularVelocity.multiplyScalar(0.96);

      // Ground Collision Response
      if (prop.position.y <= prop.baseY) {
        prop.position.y = prop.baseY;
        if (Math.abs(prop.velocity.y) > 0.8) {
          prop.velocity.y = -prop.velocity.y * 0.35;
        } else {
          prop.velocity.y = 0;
        }
        prop.velocity.x *= groundFriction;
        prop.velocity.z *= groundFriction;

        // Sleep threshold
        if (
          prop.velocity.lengthSq() < 0.05 &&
          prop.angularVelocity.lengthSq() < 0.05
        ) {
          prop.isSleeping = true;
          prop.velocity.set(0, 0, 0);
          prop.angularVelocity.set(0, 0, 0);
        }
      }

      // Sync Mesh Transform
      prop.mesh.position.copy(prop.position);
      prop.mesh.rotation.set(prop.rotation.x, prop.rotation.y, prop.rotation.z);
    }
  }
}
