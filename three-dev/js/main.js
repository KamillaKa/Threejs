import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { VRButton } from "three/examples/jsm/Addons.js";
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

let container, camera, scene, renderer, cube, snowmanGroup, controls;

let controller1, controller2;
let controllerGrip1, controllerGrip2;
let raycaster;
const intersected = [];
const tempMatrix = new THREE.Matrix4();
let group = new THREE.Group();
group.name = 'Interaction-Group';

// initialize marker for teleport and referencespace of headset
 // initialize the INTERSECTION array for teleport
let marker, baseReferenceSpace;
let INTERSECTION;

// create a new empty group to include imported models you want
// to teleport with
let teleportgroup = new THREE.Group();
teleportgroup.name = 'Teleport-Group';


init();

function init() {
  scene = new THREE.Scene();
  scene.add(group);
  scene.add(teleportgroup);
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );

  renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setSize(window.innerWidth, window.innerHeight);
  // renderer.setAnimationLoop(animate);
  document.body.appendChild(renderer.domElement);
  renderer.toneMapping = THREE.LinearToneMapping;
  renderer.outputEncoding = THREE.sRGBEncoding;

  marker = new THREE.Mesh(
    new THREE.CircleGeometry(0.25, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x808080 })
    );
    scene.add(marker);

  const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
  const material = new THREE.MeshPhongMaterial({
    color: 0x00ff00,
  });
  cube = new THREE.Mesh(geometry, material);
  group.add(cube);

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
  const bottomGeometry = new THREE.SphereGeometry(0.3, 12, 8);
  const bottomSphere = new THREE.Mesh(bottomGeometry, snowMaterial);
  bottomSphere.position.set(0, -0.1, 0);
  snowmanGroup.add(bottomSphere);

  // Body
  const middleGeometry = new THREE.SphereGeometry(0.2, 12, 8);
  const middleSphere = new THREE.Mesh(middleGeometry, snowMaterial);
  middleSphere.position.set(0, 0.3, 0);
  snowmanGroup.add(middleSphere);

  // Head
  const headGeometry = new THREE.SphereGeometry(0.15, 12, 8);
  const headSphere = new THREE.Mesh(headGeometry, snowMaterial);
  headSphere.position.set(0, 0.6, 0);
  snowmanGroup.add(headSphere);

  // Hat
  const hatGeometry = new THREE.ConeGeometry(0.1, 0.3, 10);
  const hat = new THREE.Mesh(hatGeometry, hatMaterial);
  hat.position.set(0, 0.9, 0);
  snowmanGroup.add(hat);

  const wireframeMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true,
  });

  const bottomWireframe = new THREE.Mesh(bottomGeometry, wireframeMaterial);
  bottomWireframe.position.set(0, -0.1, 0);
  snowmanGroup.add(bottomWireframe);

  const middleWireframe = new THREE.Mesh(middleGeometry, wireframeMaterial);
  middleWireframe.position.set(0, 0.3, 0);
  snowmanGroup.add(middleWireframe);

  const headWireframe = new THREE.Mesh(headGeometry, wireframeMaterial);
  headWireframe.position.set(0, 0.6, 0);
  snowmanGroup.add(headWireframe);

  const hatWireframe = new THREE.Mesh(hatGeometry, wireframeMaterial);
  hatWireframe.position.set(0, 0.9, 0);
  snowmanGroup.add(hatWireframe);

  snowmanGroup.position.set(1, 0.3, 0);
  group.add(snowmanGroup);

  cube.position.set(0.1, 0.4, -0.08);

  // Camera
  camera.position.set(4, 4, 4);
  const axesHelper = new THREE.AxesHelper(5);
  scene.add(axesHelper);
  camera.lookAt(axesHelper.position);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.screenSpacePanning = false;
  controls.minDistance = 1;
  controls.maxDistance = 100;

  // Lights

  const light = new THREE.AmbientLight(0x404040); // soft white light
  scene.add(light);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 2); 
  directionalLight.position.set(5, 10, 5); 
  directionalLight.castShadow = true; 
  scene.add(directionalLight);

  const pointLight = new THREE.PointLight(0xffccaa, 1.5, 10); 
  pointLight.position.set(-2, 1, 3);
  pointLight.castShadow = true; 
  scene.add(pointLight);

  const ambientLight = new THREE.AmbientLight(0x202020); 
  scene.add(ambientLight);

  const hemLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
  scene.add(hemLight);

  loadmodels();
  initVR();

}

function initVR() {
  document.body.appendChild(VRButton.createButton(renderer));
  renderer.xr.enabled = true;

  
  renderer.xr.addEventListener(
    'sessionstart',
    () => (baseReferenceSpace = renderer.xr.getReferenceSpace())
  );
  
  // controllers

  controller1 = renderer.xr.getController( 0 );
  controller1.addEventListener( 'selectstart', onSelectStart );
  controller1.addEventListener( 'selectend', onSelectEnd );
  controller1.addEventListener('squeezestart', onSqueezeStart);
  controller1.addEventListener('squeezeend', onSqueezeEnd);
  scene.add( controller1 );

  controller2 = renderer.xr.getController( 1 );
  controller2.addEventListener( 'selectstart', onSelectStart );
  controller2.addEventListener( 'selectend', onSelectEnd );
  controller2.addEventListener('squeezestart', onSqueezeStart);
 controller2.addEventListener('squeezeend', onSqueezeEnd);
  scene.add( controller2 );

  const controllerModelFactory = new XRControllerModelFactory();

  controllerGrip1 = renderer.xr.getControllerGrip( 0 );
  controllerGrip1.add( controllerModelFactory.createControllerModel( controllerGrip1 ) );
  scene.add( controllerGrip1 );

  controllerGrip2 = renderer.xr.getControllerGrip( 1 );
  // controllerGrip2.add( controllerModelFactory.createControllerModel( controllerGrip2 ) );
  const loader = new GLTFLoader().setPath("gundy/");
  loader.load('scene.gltf', async function (gltf) {
    gltf.scene.scale.set(0.0003, 0.0003, 0.0003);
    let mymodel = gltf.scene;
    mymodel.rotation.y = THREE.MathUtils.degToRad(180);
    mymodel.rotation.x = THREE.MathUtils.degToRad(-36.5);
    mymodel.position.set(0, 0.01, 0);
    controllerGrip2.add(mymodel);
  });
  scene.add( controllerGrip2 );

  //

  const geometry = new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, - 1 ) ] );

  const line = new THREE.Line( geometry );
  line.name = 'line';
  line.scale.z = 5;

  controller1.add( line.clone() );
  controller2.add( line.clone() );

  raycaster = new THREE.Raycaster();
}

function onSelectStart( event ) {

  const controller = event.target;

  const intersections = getIntersections( controller );

  if ( intersections.length > 0 ) {

    const intersection = intersections[ 0 ];

    const object = intersection.object;
    // object.material.emissive.b = 1;
  
    controller.attach( object );

    controller.userData.selected = object;

  }

  controller.userData.targetRayMode = event.data.targetRayMode;

}

function onSelectEnd( event ) {

  const controller = event.target;

  if ( controller.userData.selected !== undefined ) {

    const object = controller.userData.selected;
    // object.material.emissive.b = 0;
    group.attach( object );

    controller.userData.selected = undefined;

  }
}

function getIntersections( controller ) {

  controller.updateMatrixWorld();

  raycaster.setFromXRController( controller );

  return raycaster.intersectObjects(group.children, true);

}

function intersectObjects( controller ) {

  // Do not highlight in mobile-ar

  if ( controller.userData.targetRayMode === 'screen' ) return;

  // Do not highlight when already selected

  if ( controller.userData.selected !== undefined ) return;

  const line = controller.getObjectByName( 'line' );
  const intersections = getIntersections( controller );

  if ( intersections.length > 0 ) {

    const intersection = intersections[ 0 ];

    const object = intersection.object;
    // object.material.emissive.r = 1;
    object.traverse(function (node) {
      if (node.material) {
        node.material.transparent = true;
        node.material.opacity = 0.5;
      }});

    intersected.push( object );

    line.scale.z = intersection.distance;

  } else {

    line.scale.z = 5;

  }

}

function cleanIntersected() {

  while ( intersected.length ) {

    const object = intersected.pop();
    object.traverse(function (node) {
      if (node.material) {
        node.material.transparent = false;
        node.material.opacity = 1;
      }});
    // object.material.emissive.r = 0;

  }
}

function onSqueezeStart() {
  this.userData.isSqueezing = true;
  console.log('Controller squeeze started');
}

function onSqueezeEnd() {
  this.userData.isSqueezing = false;
  console.log('squeezeend');
  if (INTERSECTION) {
  const offsetPosition = {
  x: -INTERSECTION.x,
  y: -INTERSECTION.y,
  z: -INTERSECTION.z,
  w: 1,
  };
  const offsetRotation = new THREE.Quaternion();
  const transform = new XRRigidTransform(offsetPosition, offsetRotation);
  const teleportSpaceOffset =
 baseReferenceSpace.getOffsetReferenceSpace(transform);
  renderer.xr.setReferenceSpace(teleportSpaceOffset);
  }
  }

function moveMarker() {
  INTERSECTION = undefined;
  if (controller1.userData.isSqueezing === true) {
    tempMatrix.identity().extractRotation(controller1.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller1.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
  //const intersects = raycaster.intersectObjects([floor]);
  const intersects = raycaster.intersectObjects(teleportgroup.children, true);
  if (intersects.length > 0) {
    INTERSECTION = intersects[0].point;
    console.log(intersects[0]);
    console.log(INTERSECTION);
  }
  } else if (controller2.userData.isSqueezing === true) {
  tempMatrix.identity().extractRotation(controller2.matrixWorld);
  raycaster.ray.origin.setFromMatrixPosition(controller2.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

  // const intersects = raycaster.intersectObjects([floor]);
  const intersects = raycaster.intersectObjects(teleportgroup.children, true);
  if (intersects.length > 0) {
    INTERSECTION = intersects[0].point;
  }
  }
  if (INTERSECTION) marker.position.copy(INTERSECTION);
    marker.visible = INTERSECTION !== undefined;
 }

 // Render loop

renderer.setAnimationLoop(function () {
  
  controls.update();
  
  cleanIntersected();
  intersectObjects(controller1);
  intersectObjects(controller2);

  moveMarker();
  

  // Rotate the cube
  cube.rotation.x += 0.001;
  cube.rotation.y += 0.001;

  // Rotate the snowman 
  snowmanGroup.rotation.y += 0.001;
  snowmanGroup.rotation.x += 0.001;

  controls.update();
  renderer.render(scene, camera);
});

window.addEventListener("resize", resize, false);

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Load models

function loadmodels() {
  const loader = new GLTFLoader().setPath("/");

  new RGBELoader()
    .setPath("hdri/")
    .load("lonely_road_afternoon_puresky_1k.hdr", function (texture) {
      scene.background = texture;
      scene.environment = texture;

      // Earth
      const earthLoader = new GLTFLoader().setPath("Earth/");
      earthLoader.load("ground.gltf", async function (gltf) {
        const earthModel = gltf.scene;
        await renderer.compileAsync(earthModel, scene, camera);
             
        // Earth position 
        teleportgroup.add(earthModel);
      });

      // Objects
      const objectLoader = new GLTFLoader().setPath("Objects/");
      objectLoader.load("Objects.gltf", async function (gltf) {
        const objectModel = gltf.scene;
        await renderer.compileAsync(objectModel, scene, camera);
             
        // Object position 
        objectModel.position.set(3, 0, 0);
        group.add(objectModel);
      });

      // Shoe
      const shoeLoader = new GLTFLoader().setPath("shoe/");
      shoeLoader.load("shoe.gltf", async function (gltf) {
        const shoeModel = gltf.scene;
        await renderer.compileAsync(shoeModel, scene, camera);
        
        // Shoe position
        shoeModel.position.set(0.55, -0.55, 0.05);
        group.add(shoeModel);
      });

      // Barrel
      const barrelLoader = new GLTFLoader().setPath("barrel/");
      barrelLoader.load("barrel.gltf", async function (gltf) {
        const barrelModel = gltf.scene;
        await renderer.compileAsync(barrelModel, scene, camera);
        
        // Barrel position 
        barrelModel.position.set(0, 0.2, 0);
        scene.add(barrelModel);
      });

        // Bottle
      const bottleLoader = new GLTFLoader().setPath("bottle/");
      bottleLoader.load("WaterBottle.gltf", async function (gltf) {
        const bottleModel = gltf.scene;
        await renderer.compileAsync(bottleModel, scene, camera);
        
        // Bottle position
        bottleModel.position.set(-0.1, 0.5, -0.1);
        group.add(bottleModel);
      });

        // Banana
        const bananaLoader = new GLTFLoader().setPath("banana/");
        bananaLoader.load("banana.gltf", async function (gltf) {
          const bananaModel = gltf.scene;
          await renderer.compileAsync(bananaModel, scene, camera);
          
          // Banana position
          bananaModel.position.set(-0.1, 0.39, 0.1);
          group.add(bananaModel);

          // Banana size
          bananaModel.scale.set(0.003, 0.003, 0.003);

          // Banana rotation
          bananaModel.rotation.y = -0.5;


        });
    });
}

