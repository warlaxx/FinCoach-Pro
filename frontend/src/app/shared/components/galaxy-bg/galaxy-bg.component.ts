import {
  Component, OnInit, OnDestroy, ElementRef, ViewChild,
  NgZone, PLATFORM_ID, Inject, ChangeDetectionStrategy
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-galaxy-bg',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <canvas #cvs
      style="position:fixed;top:0;left:0;width:100vw;height:100vh;
             z-index:0;pointer-events:none;display:block">
    </canvas>
  `
})
export class GalaxyBgComponent implements OnInit, OnDestroy {
  @ViewChild('cvs', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private renderer: any;
  private scene: any;
  private camera: any;
  private animId = 0;
  private galaxyPoints: any;
  private nebulaPoints: any;
  private resizeHandler = () => this.onResize();

  constructor(
    private zone: NgZone,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  async ngOnInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    const THREE = await import('three');
    const canvas = this.canvasRef.nativeElement;

    // ── Renderer ──────────────────────────────────────────────
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 0);

    // ── Scene & camera ────────────────────────────────────────
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.z = 3.2;

    // ── Build galaxy ──────────────────────────────────────────
    this.buildGalaxy(THREE);
    this.buildNebulaDust(THREE);

    window.addEventListener('resize', this.resizeHandler);

    // ── Animate outside Angular ───────────────────────────────
    this.zone.runOutsideAngular(() => this.tick());
  }

  // ── Galaxy spiral particles ────────────────────────────────
  private buildGalaxy(THREE: any): void {
    const COUNT   = 7000;
    const ARMS    = 3;
    const SPIN    = 3.5;
    const SPREAD  = 0.28;

    const positions = new Float32Array(COUNT * 3);
    const colors    = new Float32Array(COUNT * 3);

    const palette = [
      new THREE.Color('#8B5CF6'),  // violet
      new THREE.Color('#06B6D4'),  // cyan
      new THREE.Color('#C9A84C'),  // gold
      new THREE.Color('#F0F4FF'),  // white
      new THREE.Color('#4F46E5'),  // indigo
      new THREE.Color('#EC4899'),  // pink (trace)
    ];

    for (let i = 0; i < COUNT; i++) {
      const i3     = i * 3;
      const radius = Math.random() * 7 + 0.2;
      const arm    = (i % ARMS) / ARMS;
      const spin   = radius * SPIN;
      const angle  = arm * Math.PI * 2 + spin;

      const rx = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * SPREAD;
      const ry = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * SPREAD * 0.4;
      const rz = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * SPREAD;

      positions[i3]     = Math.cos(angle) * radius + rx;
      positions[i3 + 1] = ry;
      positions[i3 + 2] = Math.sin(angle) * radius + rz;

      // Center particles → gold/white; edge → purple/cyan
      const t = radius / 7;
      const c = palette[t < 0.3 ? Math.floor(Math.random() * 2 + 2) : Math.floor(Math.random() * 2)].clone();
      colors[i3]     = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.032,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.80,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      map: this.createCircleTexture(THREE),
      alphaTest: 0.001,
    });

    this.galaxyPoints = new THREE.Points(geo, mat);
    this.scene.add(this.galaxyPoints);
  }

  // ── Circular sprite texture (smooth dots) ─────────────────
  private createCircleTexture(THREE: any): any {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    grad.addColorStop(0,   'rgba(255,255,255,1)');
    grad.addColorStop(0.3, 'rgba(255,255,255,0.8)');
    grad.addColorStop(0.7, 'rgba(255,255,255,0.2)');
    grad.addColorStop(1,   'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  // ── Nebula dust (larger, dimmer cloud) ─────────────────────
  private buildNebulaDust(THREE: any): void {
    const COUNT = 1200;
    const positions = new Float32Array(COUNT * 3);
    const colors    = new Float32Array(COUNT * 3);

    const nebPalette = [
      new THREE.Color('#6D28D9'),
      new THREE.Color('#0EA5E9'),
      new THREE.Color('#1E40AF'),
    ];

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      positions[i3]     = (Math.random() - 0.5) * 14;
      positions[i3 + 1] = (Math.random() - 0.5) * 6;
      positions[i3 + 2] = (Math.random() - 0.5) * 14;

      const c = nebPalette[Math.floor(Math.random() * nebPalette.length)].clone();
      colors[i3]     = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.22,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.09,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      map: this.createCircleTexture(THREE),
      alphaTest: 0.001,
    });

    this.nebulaPoints = new THREE.Points(geo, mat);
    this.scene.add(this.nebulaPoints);
  }

  private tick(): void {
    this.animId = requestAnimationFrame(() => this.tick());

    if (this.galaxyPoints) {
      this.galaxyPoints.rotation.y += 0.00025;
      this.galaxyPoints.rotation.x += 0.000055;
    }
    if (this.nebulaPoints) {
      this.nebulaPoints.rotation.y -= 0.00012;
    }

    this.renderer?.render(this.scene, this.camera);
  }

  private onResize(): void {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animId);
    window.removeEventListener('resize', this.resizeHandler);
    this.renderer?.dispose();
    this.galaxyPoints?.geometry?.dispose();
    this.nebulaPoints?.geometry?.dispose();
  }
}
