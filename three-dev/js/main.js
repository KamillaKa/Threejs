import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

let container, camera, scene, renderer, cube, snowmanGroup, controls;

init();

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,

    
  );

  renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  document.body.appendChild(renderer.domElement);
  renderer.toneMapping = THREE.LinearToneMapping;
  renderer.outputEncoding = THREE.sRGBEncoding;

  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshPhongMaterial({
    color: 0x00ff00,
  });
  cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  snowmanGroup = new THREE.Group();

  const snowMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.8,
    metalness: 0.1, 
  });

  const hatMaterial = new THREE.MeshStandardMaterial({
    color: 0x000000,
    roughness: 0.9,
    metalness: 0.2, 
  });

  // Legs
  const bottomGeometry = new THREE.SphereGeometry(0.75, 32, 32);
  const bottomSphere = new THREE.Mesh(bottomGeometry, snowMaterial);
  bottomSphere.position.set(0, -0.25, 0);
  snowmanGroup.add(bottomSphere);

  // Body
  const middleGeometry = new THREE.SphereGeometry(0.5, 32, 32);
  const middleSphere = new THREE.Mesh(middleGeometry, snowMaterial);
  middleSphere.position.set(0, 0.75, 0);
  snowmanGroup.add(middleSphere);

  // Head
  const headGeometry = new THREE.SphereGeometry(0.35, 32, 32);
  const headSphere = new THREE.Mesh(headGeometry, snowMaterial);
  headSphere.position.set(0, 1.6, 0);
  snowmanGroup.add(headSphere);

  // Hat
  const hatGeometry = new THREE.ConeGeometry(0.3, 0.7, 32);
  const hat = new THREE.Mesh(hatGeometry, hatMaterial);
  hat.position.set(0, 2.1, 0);
  snowmanGroup.add(hat);

  const wireframeMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true,
  });

  const bottomWireframe = new THREE.Mesh(bottomGeometry, wireframeMaterial);
  bottomWireframe.position.set(0, -0.25, 0);
  snowmanGroup.add(bottomWireframe);

  const middleWireframe = new THREE.Mesh(middleGeometry, wireframeMaterial);
  middleWireframe.position.set(0, 0.75, 0);
  snowmanGroup.add(middleWireframe);

  const headWireframe = new THREE.Mesh(headGeometry, wireframeMaterial);
  headWireframe.position.set(0, 1.6, 0);
  snowmanGroup.add(headWireframe);

  const hatWireframe = new THREE.Mesh(hatGeometry, wireframeMaterial);
  hatWireframe.position.set(0, 2.1, 0);
  snowmanGroup.add(hatWireframe);

  snowmanGroup.position.set(0, 0.75, 0);
  scene.add(snowmanGroup);

  cube.position.set(2, 1, 0);

  // Camera
  camera.position.set(4, 4, 4);
  const axesHelper = new THREE.AxesHelper(5);
  scene.add(axesHelper);
  camera.lookAt(axesHelper.position);

  // Lights
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  scene.add(directionalLight);

  const light = new THREE.AmbientLight(0x404040); // soft white light
  scene.add(light);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.screenSpacePanning = false;
  controls.minDistance = 1;
  controls.maxDistance = 100;

  loadmodels();
}

function animate() {
  // Rotate the cube
  cube.rotation.x += 0.001;
  cube.rotation.y += 0.001;

  // Rotate the snowman 
  snowmanGroup.rotation.y += 0.001;
  snowmanGroup.rotation.x += 0.001;

  controls.update();
  renderer.render(scene, camera);
}

window.addEventListener("resize", resize, false);

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function loadmodels() {
  new RGBELoader()
    .setPath("hdri/")
    .load("lonely_road_afternoon_puresky_1k.hdr", function (texture) {
      scene.background = texture;
      scene.environment = texture;

      const loader = new GLTFLoader().setPath("shoe/");
      loader.load("shoe.gltf", async function (gltf) {
        const model = gltf.scene;
        await renderer.compileAsync(model, scene, camera);

        scene.add(model);
      });
    });
}
