import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { COLS, ROWS, PIECE_COLORS } from './constants';
import { Game } from './game';
import { getShape } from './tetromino';
import type { PieceType } from './tetromino';

const CELL_SIZE = 1;
const GAP = 0.04;
const BLOCK = CELL_SIZE - GAP;

export class Renderer {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer;

  // Mesh pools
  private boardMeshes: (THREE.Mesh | null)[][] = [];
  private pieceMeshes: THREE.Mesh[] = [];
  private ghostMeshes: THREE.Mesh[] = [];
  private gridLines: THREE.LineSegments;

  // Materials cache (one per piece type)
  private materials: THREE.MeshStandardMaterial[] = [];
  private ghostMaterials: THREE.MeshStandardMaterial[] = [];

  private blockGeo: THREE.BoxGeometry;

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a1a);

    // Orthographic camera sized to fit the board with some padding
    const boardW = COLS * CELL_SIZE;
    const boardH = ROWS * CELL_SIZE;
    const pad = 6;
    const aspect = window.innerWidth / window.innerHeight;
    const viewH = boardH + pad;
    const viewW = viewH * aspect;
    this.camera = new THREE.OrthographicCamera(
      -viewW / 2, viewW / 2,
      viewH / 2, -viewH / 2,
      0.1, 100,
    );
    this.camera.position.set(boardW / 2 - 0.5, boardH / 2 - 0.5, 20);
    this.camera.lookAt(boardW / 2 - 0.5, boardH / 2 - 0.5, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    container.prepend(this.renderer.domElement);

    // Lighting
    const ambient = new THREE.AmbientLight(0x222244, 0.5);
    this.scene.add(ambient);
    const point = new THREE.PointLight(0xffffff, 0.8, 50);
    point.position.set(boardW / 2, boardH / 2, 10);
    this.scene.add(point);

    // Post-processing bloom
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.8,   // strength
      0.4,   // radius
      0.85,  // threshold
    );
    this.composer.addPass(bloom);

    // Shared geometry
    this.blockGeo = new THREE.BoxGeometry(BLOCK, BLOCK, BLOCK * 0.6);

    // Create materials for each piece type
    for (let i = 0; i < PIECE_COLORS.length; i++) {
      const color = PIECE_COLORS[i];
      this.materials.push(new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.6,
        roughness: 0.3,
        metalness: 0.2,
      }));
      this.ghostMaterials.push(new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.25,
        roughness: 0.5,
        metalness: 0.1,
      }));
    }

    // Board mesh pool
    for (let row = 0; row < ROWS; row++) {
      this.boardMeshes.push([]);
      for (let col = 0; col < COLS; col++) {
        this.boardMeshes[row].push(null);
      }
    }

    // Active piece meshes (max 4 blocks)
    for (let i = 0; i < 4; i++) {
      const mesh = new THREE.Mesh(this.blockGeo, this.materials[1]);
      mesh.visible = false;
      this.scene.add(mesh);
      this.pieceMeshes.push(mesh);
      const ghost = new THREE.Mesh(this.blockGeo, this.ghostMaterials[1]);
      ghost.visible = false;
      this.scene.add(ghost);
      this.ghostMeshes.push(ghost);
    }

    // Board background panel
    const bgGeo = new THREE.PlaneGeometry(COLS * CELL_SIZE, ROWS * CELL_SIZE);
    const bgMat = new THREE.MeshBasicMaterial({ color: 0x0d0d2b });
    const bgMesh = new THREE.Mesh(bgGeo, bgMat);
    bgMesh.position.set(boardW / 2 - 0.5, boardH / 2 - 0.5, -0.3);
    this.scene.add(bgMesh);

    // Board border (neon frame)
    const borderGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(
      COLS * CELL_SIZE + 0.1,
      ROWS * CELL_SIZE + 0.1,
    ));
    const borderMat = new THREE.LineBasicMaterial({ color: 0x4444aa });
    const borderLine = new THREE.LineSegments(borderGeo, borderMat);
    borderLine.position.set(boardW / 2 - 0.5, boardH / 2 - 0.5, -0.2);
    this.scene.add(borderLine);

    // Grid lines
    this.gridLines = this.createGridLines();
    this.scene.add(this.gridLines);

    // Handle resize
    window.addEventListener('resize', this.onResize);
  }

  private createGridLines(): THREE.LineSegments {
    const points: number[] = [];
    const w = COLS * CELL_SIZE;
    const h = ROWS * CELL_SIZE;
    const offset = CELL_SIZE / 2;

    // Horizontal lines
    for (let row = 0; row <= ROWS; row++) {
      points.push(-offset, row * CELL_SIZE - offset, -0.1);
      points.push(w - offset, row * CELL_SIZE - offset, -0.1);
    }
    // Vertical lines
    for (let col = 0; col <= COLS; col++) {
      points.push(col * CELL_SIZE - offset, -offset, -0.1);
      points.push(col * CELL_SIZE - offset, h - offset, -0.1);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    const mat = new THREE.LineBasicMaterial({ color: 0x2a2a5a, transparent: true, opacity: 0.5 });
    return new THREE.LineSegments(geo, mat);
  }

  render(game: Game): void {
    // Update board meshes
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const cell = game.grid[row][col];
        const existing = this.boardMeshes[row][col];

        if (cell === 0) {
          if (existing) {
            this.scene.remove(existing);
            this.boardMeshes[row][col] = null;
          }
        } else {
          if (!existing) {
            const mesh = new THREE.Mesh(this.blockGeo, this.materials[cell]);
            mesh.position.set(col * CELL_SIZE, (ROWS - 1 - row) * CELL_SIZE, 0);
            this.scene.add(mesh);
            this.boardMeshes[row][col] = mesh;
          } else {
            existing.material = this.materials[cell];
          }
        }
      }
    }

    // Update active piece and ghost
    let blockIdx = 0;
    if (game.piece && game.state === 'playing') {
      const shape = getShape(game.piece.type, game.piece.rotation);
      const ghostY = game.getGhostY();

      for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
          if (!shape[row][col]) continue;
          if (blockIdx < 4) {
            // Active piece
            const mesh = this.pieceMeshes[blockIdx];
            mesh.material = this.materials[game.piece.type];
            mesh.position.set(
              (game.piece.x + col) * CELL_SIZE,
              (ROWS - 1 - (game.piece.y + row)) * CELL_SIZE,
              0,
            );
            mesh.visible = true;

            // Ghost piece
            const ghost = this.ghostMeshes[blockIdx];
            ghost.material = this.ghostMaterials[game.piece.type];
            ghost.position.set(
              (game.piece.x + col) * CELL_SIZE,
              (ROWS - 1 - (ghostY + row)) * CELL_SIZE,
              0,
            );
            ghost.visible = ghostY !== game.piece.y;

            blockIdx++;
          }
        }
      }
    }

    // Hide unused piece/ghost meshes
    for (let i = blockIdx; i < 4; i++) {
      this.pieceMeshes[i].visible = false;
      this.ghostMeshes[i].visible = false;
    }

    this.composer.render();
  }

  private onResize = (): void => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const boardH = ROWS * CELL_SIZE;
    const pad = 6;
    const aspect = w / h;
    const viewH = boardH + pad;
    const viewW = viewH * aspect;
    this.camera.left = -viewW / 2;
    this.camera.right = viewW / 2;
    this.camera.top = viewH / 2;
    this.camera.bottom = -viewH / 2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
  };

  renderNextPreview(pieceType: PieceType, canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const shape = getShape(pieceType, 0);
    const cellSize = 20;
    canvas.width = shape[0].length * cellSize;
    canvas.height = shape.length * cellSize;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const color = '#' + PIECE_COLORS[pieceType].toString(16).padStart(6, '0');

    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (!shape[row][col]) continue;
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.fillRect(col * cellSize + 2, row * cellSize + 2, cellSize - 4, cellSize - 4);
      }
    }
  }

  dispose(): void {
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
  }
}
