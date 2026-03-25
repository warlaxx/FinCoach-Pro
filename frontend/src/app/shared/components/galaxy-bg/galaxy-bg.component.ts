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
  private starPoints: any;
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

    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 0);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.z = 3.2;

    this.buildStars(THREE);

    window.addEventListener('resize', this.resizeHandler);
    this.zone.runOutsideAngular(() => this.tick());
  }

  // ── Étoiles blanches, petites, sobres ──────────────────────
  private buildStars(THREE: any): void {
    const COUNT = 4500;
    const positions = new Float32Array(COUNT * 3);
    const colors    = new Float32Array(COUNT * 3);

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;

      // Distribution sphérique uniforme
      const theta  = Math.random() * Math.PI * 2;
      const phi    = Math.acos(2 * Math.random() - 1);
      const radius = 1.5 + Math.random() * 8.5;

      positions[i3]     = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = (Math.random() - 0.5) * 5;
      positions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      // Blanc pur — légère variation de luminosité (0.55 → 1.0)
      const b = 0.55 + Math.random() * 0.45;
      colors[i3]     = b;
      colors[i3 + 1] = b;
      colors[i3 + 2] = b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.018,           // très petites
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.55,         // sobres
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      map: this.createCircleTexture(THREE),
      alphaTest: 0.001,
    });

    this.starPoints = new THREE.Points(geo, mat);
    this.scene.add(this.starPoints);
  }

  private createCircleTexture(THREE: any): any {
    const size = 32;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    grad.addColorStop(0,   'rgba(255,255,255,1)');
    grad.addColorStop(0.4, 'rgba(255,255,255,0.6)');
    grad.addColorStop(1,   'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(canvas);
  }

  private tick(): void {
    this.animId = requestAnimationFrame(() => this.tick());
    if (this.starPoints) {
      this.starPoints.rotation.y += 0.00015; // rotation très lente
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
    if (!isPlatformBrowser(this.platformId)) return;
    cancelAnimationFrame(this.animId);
    window.removeEventListener('resize', this.resizeHandler);
    [this.galaxyPoints, this.nebulaPoints].forEach((points: any) => {
      points?.geometry?.dispose?.();
      const material = points?.material;
      const materials = Array.isArray(material) ? material : [material];
      materials.forEach((mat: any) => { mat?.map?.dispose?.(); mat?.dispose?.(); });
    });
    this.renderer?.dispose();
  }
}
