import {
  BufferAttribute,
  BufferGeometry,
  MeshBasicMaterial,
  TriangleFanDrawMode,
} from "three";
import { toTrianglesDrawMode } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Particle, ParticleRenderer } from "./particle-renderer";

// Creates pill geometry.
function pillGeometry() {
  const geometry = new BufferGeometry();
  const verticesGenerated: [number, number][] = [];
  const pillLength = 10;

  verticesGenerated.push([-1, -1]);
  for (let a = 0; a < Math.PI; a += 0.1) {
    verticesGenerated.push([
      Math.cos(-a - Math.PI / 2) * 1 - 1,
      Math.sin(-a - Math.PI / 2) * 1,
    ]);
  }
  verticesGenerated.push([-1, 1]);
  verticesGenerated.push([1, 1]);
  verticesGenerated.push(
    ...verticesGenerated.map<[number, number]>(([x, y]) => [-x, -y])
  );
  verticesGenerated.push([0, 0]);
  const vertices = new Float32Array(
    verticesGenerated
      .reverse()
      .flatMap((v) => [...v.map((c) => (c * pillLength) / 4), 0])
  );

  geometry.setAttribute("position", new BufferAttribute(vertices, 3));
  return geometry;
}

let geometry = pillGeometry();
geometry = toTrianglesDrawMode(geometry, TriangleFanDrawMode);

const material = new MeshBasicMaterial({
  // wireframe: true,
  color: "white",
});

let renderer = new ParticleRenderer(
  {
    left: -100,
    right: 100,
    top: 100,
    bottom: -100,
  },
  geometry,
  material,
  10000
);
document.body.children[0].appendChild(renderer.renderer.domElement);

let frame = 0;
let time = 0;
let timer = 0;

let particles: Particle[] = [
  new Particle(0, 0),
  new Particle(50, 0),
  new Particle(0, 20),
  new Particle(30, 60),
  new Particle(-10, -70),
];

const tick = (dt: number) => {
  // Grab next frame's particles and send to renderer.
  let speed = 10;
  for (const particle of particles) {
    particle.x += dt * speed;
    particle.y += dt * speed;
  }
  renderer.setPositions(particles);

  //particle = particle.filter((particle) => isParticleInside(particle, width, height));
  time += dt;
  frame++;

  // Show FPS
  // if (1 / dt > 144)
  // console.log(1 / dt);
};

renderer.animate(tick);
