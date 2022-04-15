import {
  BufferGeometry,
  Clock,
  InstancedMesh,
  Material,
  Matrix4,
  Mesh,
  OrthographicCamera,
  PlaneBufferGeometry,
  Renderer,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from "three";
import "./index.css";
import backgroundShader from "./background.glsl";
import CCapture from "ccapture.js-npmfixed";

type Sides = { top: number; left: number; bottom: number; right: number };

function screenSize() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

class FixedAspectRatio {
  aspectRatio: number;
  renderer: Renderer;

  constructor(renderer: Renderer, aspectRatio: number) {
    this.renderer = renderer;
    this.aspectRatio = aspectRatio;
  }

  maximumSizeFor({ width, height }: { width: number; height: number }): {
    width: number;
    height: number;
  } {
    if (width / height > this.aspectRatio) {
      width = height * this.aspectRatio;
    } else {
      height = width / this.aspectRatio;
    }
    return { width, height };
  }

  resize(width: number, height: number) {
    let bestSize = this.maximumSizeFor({ width, height });

    this.renderer.setSize(bestSize.width, bestSize.height);
  }
}

export class ParticleRenderer {
  particlesMesh: InstancedMesh;
  borders: Sides;
  renderer: WebGLRenderer;
  camera: OrthographicCamera;
  canvasResizer: FixedAspectRatio;
  scene: Scene;
  clock: Clock;
  maxParticleCount: number;
  capturer: any;
  canvasSize: { width: number; height: number };

  constructor(
    borders: Sides,
    particleGeometry: BufferGeometry,
    particleMaterial: Material,
    maxParticleCount: number,
    record: boolean,
    canvasSize?: { width: number; height: number }
  ) {
    this.maxParticleCount = maxParticleCount;
    this.particlesMesh = new InstancedMesh(
      particleGeometry,
      particleMaterial,
      this.maxParticleCount
    );
    this.borders = borders;
    this.init();
    this.clock = new Clock();
    if (record) this.capturer = new CCapture({ format: "webm", framerate: 60 });

    this.canvasSize = canvasSize;
    if (this.canvasSize !== undefined) {
      this.canvasResizer.resize(this.canvasSize.width, this.canvasSize.height);
    }
    this.onResize();
  }

  init() {
    this.renderer = new WebGLRenderer({
      // antialias: true, alpha: true,
    });
    let canvasResizer = new FixedAspectRatio(this.renderer, 1);
    this.renderer.setClearColor("#222");
    // renderer.setClearAlpha(0);
    const scene = new Scene();
    const camera = new OrthographicCamera(
      this.borders.left,
      this.borders.right,
      this.borders.top,
      this.borders.bottom,
      0.01,
      1000
    );
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();

    this.particlesMesh.position.set(0, 0, 0);

    scene.add(this.particlesMesh);

    this.canvasResizer = canvasResizer;
    this.camera = camera;
    this.scene = scene;
    this.initBackground();

    window.addEventListener("resize", this.onResize.bind(this), false);
  }

  initBackground() {
    // Background shader
    const material = new ShaderMaterial({
      vertexShader: `
	varying vec2 vUv;
	void main() {
	vUv = uv;
	gl_Position = vec4( position, 1.0 );
	}
	`,
      fragmentShader: backgroundShader,
    });
    const quad = new Mesh(new PlaneBufferGeometry(2, 2, 1, 1), material);
    this.scene.add(quad);
  }

  setPositions(positions: Particle[]) {
    console.assert(
      positions.length <= this.maxParticleCount,
      "You exceeded the maximum particle count specified at Renderer's construction."
    );
    this.particlesMesh.count = positions.length;
    for (const [index, particle] of positions.entries()) {
      this.particlesMesh.setMatrixAt(
        index,
        new Matrix4().multiply(
          new Matrix4().makeTranslation(particle.x, particle.y, 0)
        )
        //.multiply(new Matrix4().makeRotationZ(Math.PI / 4))
        //.multiply(new Matrix4().makeScale(particle.scale, particle.scale, 0))
      );
    }
    this.particlesMesh.instanceMatrix.needsUpdate = true;
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  startAnimation(frameCallback: (dt: number) => void, frames: number) {
    this.capturer?.start();
    this.animate(frameCallback, frames);
  }

  animate(frameCallback: (dt: number) => void, framesLeft: number) {
    if (framesLeft == 0) {
      this.capturer?.stop();
      this.capturer?.save();
    } else {
      // setTimeout(() => requestAnimationFrame(animate), 13);
      requestAnimationFrame(
        this.animate.bind(this, frameCallback, framesLeft - 1)
      );
    }
    frameCallback(this.clock.getDelta());
    this.render();
    this.capturer?.capture(this.renderer.domElement);
  }

  onResize() {
    this.camera.updateProjectionMatrix();
    if (this.canvasSize === undefined) {
      let size = screenSize();
      this.canvasResizer.resize(size.width, size.height);
    }
  }
}

export class Particle {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}
