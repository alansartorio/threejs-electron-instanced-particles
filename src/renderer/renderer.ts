import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Clock,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneBufferGeometry,
  Scene,
  ShaderMaterial,
  TriangleFanDrawMode,
  WebGLRenderer,
} from "three";
import "./index.css";
import { toTrianglesDrawMode } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { ipcRenderer } from "electron";
import backgroundShader from "./background.glsl";

function getSides() {
  return {
    left: 0,
    right: window.innerWidth,
    top: window.innerHeight,
    bottom: 0,
  };
}

function getSidesArray() {
  let sides = getSides();

  return [sides.left, sides.right, sides.top, sides.bottom];
}

const renderer = new WebGLRenderer({
  // antialias: true, alpha: true,
});
renderer.setClearColor("#7d2de3");
// renderer.setClearAlpha(0);
const scene = new Scene();
const camera = new OrthographicCamera(...getSidesArray(), 0.01, 1000);
camera.position.set(0, 0, 200);
camera.lookAt(0, 0, 0);
camera.updateMatrixWorld();
camera.position.z = 5;

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

{
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
  scene.add(quad);
}

let time = 0;
let timer = 0;
const defaultBlobLength = 200;

type BlobData = {
  x: number;
  y: number;
  scale: number;
  speed: number;
};

function createBlob(width: number, height: number): BlobData {
  const scale = 2 ** (Math.random() * 2 - 1);
  const length = defaultBlobLength * scale;
  return {
    y: -Math.sqrt((length / 2) ** 2 / 2) - 100,
    x: Math.random() * (width + height) - height,
    scale: scale,
    speed: Math.random() * 25 + 10,
  };
}

function isBlobInside(blob: BlobData, width: number, height: number) {
  return blob.y <= height + defaultBlobLength * 2;
}
let blobs: BlobData[] = [];

function pillGeometry() {
  const geometry = new BufferGeometry();
  const verticesGenerated: [number, number][] = [];

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
      .flatMap((v) => [...v.map((c) => (c * defaultBlobLength) / 4), 0])
  );

  geometry.setAttribute("position", new BufferAttribute(vertices, 3));
  return geometry;
}

const geometry = pillGeometry();

const material = new MeshBasicMaterial({
  // wireframe: true,
  transparent: true,
  opacity: 0.1,
  color: "black",
});
const cube = new InstancedMesh(geometry, material, 1000);

function setPositions(positions: BlobData[]) {
  cube.count = positions.length;
  for (const [index, position] of positions.entries()) {
    cube.setMatrixAt(
      index,
      new Matrix4()
        .multiply(new Matrix4().makeTranslation(position.x, position.y, 0))
        .multiply(new Matrix4().makeRotationZ(Math.PI / 4))
        .multiply(new Matrix4().makeScale(position.scale, position.scale, 0))
    );
  }
  cube.instanceMatrix.needsUpdate = true;
}
cube.geometry = toTrianglesDrawMode(cube.geometry, TriangleFanDrawMode);
cube.position.set(0, 0, 0);

scene.add(cube);
let frame = 0;

let idle = false;
ipcRenderer.on("getSystemIdleTimeResponse", function (event, arg) {
  console.log("IDLE", arg);
  idle = arg;
  if (idle) clock.stop();
  else clock.start();
});

const clock = new Clock();
const tick = (dt: number) => {
  const { innerWidth: width, innerHeight: height } = window;

  if (time >= timer) {
    time -= timer;
    blobs.push(createBlob(width, height));
    timer = Math.random() * 1;
  }

  for (const blob of blobs) {
    blob.x += dt * blob.speed;
    blob.y += dt * blob.speed;
  }

  blobs = blobs.filter((blob) => isBlobInside(blob, width, height));
  time += dt;
  frame++;
  setPositions(blobs);
  if (frame % 60 == 0) {
    // console.log(blobs.length);
    // console.log(1 / dt);
  }
  // if (frame % 1000 == 0) {

  //     ipcRenderer.send('getSystemIdleTime');
  // }

  // if (1 / dt > 144)
  // console.log(1 / dt);
};

function animate() {
  // setTimeout(() => requestAnimationFrame(animate), 13);
  requestAnimationFrame(animate);
  if (idle) {
    return;
  }

  tick(clock.getDelta());

  renderer.render(scene, camera);
}

function onMouseClick(event: MouseEvent) {}
function onMouseMove(event: MouseEvent) {}
function onWindowResize() {
  [camera.left, camera.right, camera.top, camera.bottom] = getSidesArray();
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("click", onMouseClick, false);
window.addEventListener("mousemove", onMouseMove, false);
window.addEventListener("resize", onWindowResize, false);

animate();
