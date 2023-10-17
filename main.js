import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import {createHUD, removeHUD, updateHUDCoin, updateHUDHP, updateHUDSpeed} from './hud';
import {checkMovement} from "./collisionCheck";
import {Vector3} from "three";
import {createBoost, createCoin, createHealth} from './iconsCreation.js';
import {Pathfinding, PathfindingHelper} from 'three-pathfinding';
import {FirstPersonControls} from "three/addons/controls/FirstPersonControls";

if (window.selectedLevel) {

    console.log("Selected level is: " + window.selectedLevel);
} else {
    // Handle case where no level is selected if necessary
}

let isGamePaused = false;

window.pauseGame = function() {
    isGamePaused = true;  // Set the game state to paused
    // Here, handle anything else you need when the game is paused (e.g., stop sounds, etc.)
}

window.resumeGame = function() {
    if (isGamePaused) {
        isGamePaused = false; // Set the game state to running
        animate(); // Restart the game loop
        // Here, handle anything else you need when the game resumes
    }
}
function gamelost(){
   const overlay = document.getElementById('lose-screen');
   overlay.style.display = 'flex';
   isGamePaused = true;
}

function gamewon(){
    const overlay = document.getElementById('win-screen');
   overlay.style.display = 'flex';
   isGamePaused = true;
}

const retryButton = document.getElementById("retry-button");
const menuButton = document.getElementById("menu-button");
const continueButton = document.getElementById("continue-button");
const blindnessOverlay = document.getElementById("blindness-overlay");

retryButton.addEventListener('click', () => {
    // Handle retry button click
    // You can replace this with your logic
    //soldier.position.set(0,0,8);
    monster.position.set(0.9, 0, 8);
    const overlay = document.getElementById('lose-screen');
    overlay.style.display = 'none';
    isGamePaused = false;
    removeHUD(camera);
    cleanIcons();
    initLevel(window.selectedLevel);
    updateHUDHP(soldierHealth);
    updateHUDCoin(numCoins);
    updateHUDSpeed(boostFactor);
    animate();
    //initLevel(level);
});

/*menuButton.addEventListener('click', () => {
    // Handle main menu button click
    // Show the level select screen
    document.getElementById('level-select').style.display = 'flex';
    document.getElementById('lose-screen').style.display = 'none';
});*/

/*continueButton.addEventListener('click', () => {
    // Handle main menu button click
    document.getElementById('level-select').style.display = 'flex';
    document.getElementById('won-screen').style.display = 'none';
});*/

function coinsCollected(){
    const overlay = document.getElementById('portalSpawn-screen');
    overlay.style.display = 'flex';


    var op = 1;  // initial opacity
    var timer = setInterval(function () {
        if (op <= 0.1){
            clearInterval(timer);
            overlay.style.display = 'none';
        }
        overlay.style.opacity = op;
        overlay.style.filter = 'alpha(opacity=' + op * 100 + ")";
        op -= op * 0.1;
    }, 50);

}

function cleanIcons(){
    console.log(coins);
    for (var i = 0; i < coins.length; i++) {
        var object = coins[i];
        scene.remove(object.mesh);
        object.collected=true;
    }
    for (var i = 0; i < boosts.length; i++) {
        var object = boosts[i];
        scene.remove(object.mesh);
        object.collected=true;
    }

    for (var i = 0; i < healths.length; i++) {
        var object = healths[i];
        scene.remove(object.mesh);
        object.collected=true;
    }
}

const skyBoxLoader = new THREE.CubeTextureLoader();
/*const skyBoxTexture = skyBoxLoader.load([
    'textures/Spacebox4/SkyBlue_right1.png',
    'textures/Spacebox4/SkyBlue_left2.png',
    'textures/Spacebox4/SkyBlue_top3.png',
    'textures/Spacebox4/SkyBlue_bottom4.png',
    'textures/Spacebox4/SkyBlue_front5.png',
    'textures/Spacebox4/SkyBlue_back6.png'
]);*/

const skyBoxTexture = skyBoxLoader.load([
    'textures/Spacebox2/Spacebox_left.png',
    'textures/Spacebox2/Spacebox_right.png',
    'textures/Spacebox2/Spacebox_top.png',
    'textures/Spacebox2/Spacebox_bottom.png',
    'textures/Spacebox2/Spacebox_front.png',
    'textures/Spacebox2/Spacebox_back.png'
]);

// Scene
const scene = new THREE.Scene();
scene.background = skyBoxTexture;

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.y = 0.6; // adjust as necessary
camera.position.z = 1;
scene.add(camera);
let firstPersonView = false;

function toggleFirstPersonView() {
    firstPersonView = !firstPersonView;
    orbitControls.enabled = !firstPersonView;
    firstPersonControls.enabled = firstPersonView;

    if (firstPersonView) {
        // Adjust camera's position if needed (e.g., to set it at the soldier's eye level)
        camera.position.set(soldier.position.x, soldier.position.y + 0.6, soldier.position.z);
    }
}

// SOUND

// Create an AudioListener and add it to the camera
var listener = new THREE.AudioListener();
camera.add(listener);

// Create the sound player (position is irrelevant because we're not using positional audio)
var soldierMarchingSound = new THREE.Audio(listener);

// Load a sound and set it as the Audio object's buffer
var audioLoader = new THREE.AudioLoader();
audioLoader.load('/audio/marching.mp3', function(buffer) {
    soldierMarchingSound.setBuffer(buffer);
    soldierMarchingSound.setLoop(true); // for continuous play
    soldierMarchingSound.setVolume(0.5);
});

const monsterSound = new THREE.PositionalAudio(listener);
// Load a sound file (you need to have the horror sound in your game files)
audioLoader.load('/audio/horrorMusic.mp3', function(buffer) {
    monsterSound.setBuffer(buffer);
    monsterSound.setRefDistance(20); // Set reference distance for volume control
    monsterSound.setDirectionalCone(180, 230, 0.1); // Optional: Set a directional sound cone (for a more realistic experience)
    monsterSound.play();
});



// Renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Resize event
window.addEventListener('resize', () => {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;

    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(newWidth, newHeight);
});

//CONTROLS
//event listener for keyboard presses
const keyState = {};

document.addEventListener('keydown', onDocumentKeyDown, false);
document.addEventListener('keyup', onDocumentKeyUp, false);


function onDocumentKeyDown(event) {
    keyState[event.which] = true;
    if (event.which === 86) { // 'v' key
        toggleFirstPersonView();
    }
}

function onDocumentKeyUp(event) {
    keyState[event.which] = false;
}
//First person controls
const firstPersonControls = new FirstPersonControls(camera, renderer.domElement);
firstPersonControls.movementSpeed = 10;
firstPersonControls.lookSpeed = 0.3;
firstPersonControls.lookVertical = true;
//ORBIT CONTROLS
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.05;

orbitControls.minPolarAngle = Math.PI /3
orbitControls.maxPolarAngle = Math.PI / 2 - 0.05; // Prevents the camera from going below the ground or too high above the soldier
orbitControls.minAzimuthAngle = -Infinity;
orbitControls.maxAzimuthAngle = Infinity;


// Soldier geometry
let soldier;
let mixer;
let animations = {};
let currentAnimation = 'Idle';
let currentAnimationAction;

let soldierLoader = new GLTFLoader();
let soldierBoxHelper;
let dummyMesh;
let yOffset;
async function loadSoldier() {
    return new Promise((resolve, reject) => {
    soldierLoader.load('models/Soldier.glb', function (gltf) {
        soldier = gltf.scene;


        soldier.scale.set(0.25, 0.25, 0.25);

        scene.add(soldier);

        // 1. Create a dummy mesh with a BoxGeometry of your desired size.
        let boxSize = new THREE.Vector3(0.2, 0.5, 0.2); // Size of the box (width, height, depth)
        dummyMesh = new THREE.Mesh(new THREE.BoxGeometry(boxSize.x, boxSize.y, boxSize.z));

// 2. Position this mesh at the position of the soldier.
        dummyMesh.position.copy(new Vector3(soldier.position.x, soldier.position.y, soldier.position.z));
        yOffset = 0.2;  // or any value you deem appropriate
        dummyMesh.position.y += yOffset;


// 3. Create a BoxHelper using this dummy mesh.
        soldierBoxHelper = new THREE.BoxHelper(dummyMesh, 0x00ff00);

        //scene.add(soldierBoxHelper);

        // Create a mixer for the soldier
        mixer = new THREE.AnimationMixer(soldier);

        // Store the animations in the animations object for quick lookup
        animations = {}; // Reset the animations object
        gltf.animations.forEach((clip) => {
            animations[clip.name] = mixer.clipAction(clip);
        });

        currentAnimationAction = animations[currentAnimation];
        currentAnimationAction.play();
        if (animations['Idle']) animations['Idle'].play();

        // Set the target of OrbitControls after the soldier is loaded
        orbitControls.target.copy(soldier.position);

        resolve(soldier); // Resolve the promise with the loaded soldier.
    }, undefined, function (error) {
        console.error(error);
        reject(error); // Reject the promise if there's an error.
    });
    });
}

// Light
const light = new THREE.AmbientLight(0xffffff, 0.3);
light.translateY(10);
scene.add(light);
// Directional Lights for skybox
// purple light
const directionalLight1 = new THREE.DirectionalLight("purple",0.2); // Adjust light color and intensity as needed
directionalLight1.position.set(100, 15, 40);
// directionalLight.position.copy(soldier.position);
directionalLight1.castShadow = true;
directionalLight1.shadow.bias = -0.005; // Adjust shadow bias
directionalLight1.shadow.radius = 1;
directionalLight1.shadow.mapSize.width = 1024; // Shadow map size
directionalLight1.shadow.mapSize.height = 1024;
directionalLight1.shadow.camera.near = 0.00001; // Near and far planes for the shadow camera
directionalLight1.shadow.camera.far = 100;
directionalLight1.position.normalize();
scene.add(directionalLight1);
// blue light
// purple light
const directionalLight2 = new THREE.DirectionalLight("blue",0.2); // Adjust light color and intensity as needed
directionalLight2.position.set(-100, 10, 40);
// directionalLight.position.copy(soldier.position);
directionalLight2.castShadow = true;
directionalLight2.shadow.bias = -0.005; // Adjust shadow bias
directionalLight2.shadow.radius = 1;
directionalLight2.shadow.mapSize.width = 1024; // Shadow map size
directionalLight2.shadow.mapSize.height = 1024;
directionalLight2.shadow.camera.near = 0.00001; // Near and far planes for the shadow camera
directionalLight2.shadow.camera.far = 100;
directionalLight2.position.normalize();
scene.add(directionalLight2);
// light on staircase
const pointLightstairs = new THREE.PointLight("red", 1); // Adjust light color and intensity as needed
pointLightstairs.position.set(0.1, 2.2, 0.06); // Position as per the original directional light
scene.add(pointLightstairs);


let villaHouse;
let meshfloor;

// Load the maze model
const loader = new GLTFLoader();

let villaBoundingBox;
let villaSize;

let pursuing = false; // Flag to check if monster is in pursuit mode

let grid; // We've already initialized this in the villa loader
const cellSize = 0.3  // Declare this variable here, at the top level
const navMeshName = "SampleScene_Exported_NavMesh";  // Replace with your navmesh name

// Land texture
const textureLoader = new THREE.TextureLoader();
const floorTexture = textureLoader.load('textures/wall.png');
floorTexture.minFilter = THREE.LinearMipmapLinearFilter;
floorTexture.wrapS = THREE.RepeatWrapping;
floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(300, 300);

loader.load('models/villaHouse.glb', function (gltf) {
    villaHouse = gltf.scene;

    gltf.scene.position.set(0, 0, 0);
    gltf.scene.scale.set(1, 1, 1);
    // Set the villaHouse to be invisible
    //villaHouse.visible = false;

    scene.add(gltf.scene);
    //

    console.log(soldier.position);

    // Find the child named "floor" and set its material to use the floorTexture
    const floor = villaHouse.getObjectByName("floor");
    if (floor) {
        // // Create a new material with the floorTexture
         const floorMaterial = new THREE.MeshBasicMaterial({ map: floorTexture });
         floorMaterial.color = new THREE.Color(0x333333);
         // Assign the new material to the floor
         floor.material = floorMaterial;

        // // Ensure that the floor doesn't cast shadows on itself
        floor.receiveShadow = true; // Enable shadow receiving for the floor
        floor.castShadow = false;
    } else {
        console.warn('Floor not found in the villaHouse model.');
    }


}, undefined, function (error) {
    console.error(error);
});



let portalMixer;
let portalDummyMesh;

function loadPortal() {
    let portal;
    const portalLoader = new GLTFLoader();
    if (!portal) { // check if portal hasn't been loaded
        portalLoader.load('models/portal.glb', function (gltf) {
            portal = gltf.scene;

            if (window.selectedLevel == 1){
                gltf.scene.position.set(2.508606756460684, -0.3057145773003322, 19.9);
            }else if (window.selectedLevel == 2){
                gltf.scene.position.set(14.710548068720117,-0.3,7.8);
            }
            gltf.scene.scale.set(0.3, 0.3, 0.3);
            scene.add(gltf.scene);

            // After adding the portal to the scene:
            portalDummyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.8, 0.1));  // Adjust the size as necessary
            portalDummyMesh.position.copy(portal.position);
            portalDummyMesh.position.z -= 1.3;
            //scene.add(portalDummyMesh);

            const portalBoxHelper = new THREE.BoxHelper(portalDummyMesh, 0xff0000);  // Making it red for visibility
            //scene.add(portalBoxHelper);


            if (gltf.animations && gltf.animations.length) {
                portalMixer = new THREE.AnimationMixer(portal);
                const action = portalMixer.clipAction(gltf.animations[0]);
                action.play();
            }
        }, undefined, function (error) {
            console.error(error);
        });
    }
}

let coinsNeeded;
let coins = []; // Array to store multiple coins
let boosts = [];
let healths = [];

async function initLevel(level) {
    if(!soldier) {
        try {
            await loadSoldier(); // Wait for the soldier to be loaded.
        } catch (error) {
            console.error('An error occurred while loading the soldier:', error);
            return; // Exit if the soldier couldn't be loaded.
        }
    }
    if(!monster) {
        try {
            await loadMonster();
            // Monster loaded successfully
            // Proceed with the rest of your setup or game loop
        } catch (error) {
            // Handle error during monster loading
            console.error('An error occurred while loading the monster:', error);
        }
    }
    //soldier.position.set(0,0,8);

    if (level == 1) {
        //Start of game parameters
        invunerable = 0;
        boostFactor = 1;
        soldierHealth = 2;
        numCoins = 0;

        // Create multiple coins
        coinsNeeded = 3;
        createCoin(-11, 0.1, 8, scene, coins);
        createCoin(-0.16933011722566568, 1.5428444454159687, -3.5196514665312306, scene, coins);
        createCoin(8.309663681895037, -0.1712324325972956, -2.9527764209625995, scene, coins);

        //Create multiple boosts
        createBoost(-4.527128711251262, 1.46, -3.1303095350034713, scene, boosts);
        //createBoost(-3,0,0,scene,boosts);
        //createBoost(-4,0,-1,scene,boosts);

        //Create multiple hearts
        createHealth(3.3371503914805296, 0.08, -5.156236357144887, scene, healths);
        createHealth(9.123201360574695, 0.08, 0.41047471505580513, scene, healths);
        createHealth(14.03279715663051, 0.08, 8.672422194858061, scene, healths);

        //Set character position
        soldier.rotation.y = Math.PI;
        soldier.position.set(5.42934919320037, -0.19268887765808546, -7.5301149896237245);

        //Set monster position
        monster.position.set(12.344735516930285, 0.0, 23.321273620601847);

    } else if (level == 2) {
        //Start of game parameters
        invunerable = 0;
        boostFactor = 1;
        soldierHealth = 1;
        numCoins = 0;

        // Create multiple coins
        //createCoin(-11, 0.1, 8, scene, coins);
        coinsNeeded = 5;

        // Create multiple coins
        createCoin(-4.668858254609299, 0.19268887765808546, -3.666108506629987, scene, coins);
        createCoin(5.498843474553945, 0.08, -7.5, scene, coins);
        createCoin(-7.524356448677272, 1.53, -0.23800024980310194, scene, coins);
        createCoin(15.313297791701023, -0.1057143266885793, 21.623686900287876, scene, coins);
        createCoin(2.4870020913648316, -0.10571453306073826, 19.26306456486548, scene, coins);

        //Create multiple boosts
        createBoost(-4.527128711251262, 1.46, -3.1303095350034713, scene, boosts);

        //Create multiple hearts
        createHealth(3.3371503914805296, 0.08, -5.156236357144887, scene, healths);
        createHealth(9.123201360574695, 0.08, 0.41047471505580513, scene, healths);
        createHealth(14.03279715663051, 0.08, 8.672422194858061, scene, healths);

        //Set character position
        soldier.position.set(12.344735516930285, 0.0, 23.321273620601847);

        //Set Monster position
        monster.position.set(-10.953637295548958, -0.16373699632400585, 8.058759585396883);

    } else if (level == 3) {
        //Start of game parameters
        invunerable = 0;
        boostFactor = 1;
        soldierHealth = 1;
        numCoins = 0;
        // Create multiple coins
        coinsNeeded = 3;
        createCoin(-11, 0.1, 8, scene, coins);
        createCoin(5.498843474553945, 0.08, -7.5, scene, coins);
        createCoin(-7.524356448677272, 1.53, -0.23800024980310194, scene, coins);

        //Create multiple boosts
        createBoost(-4.527128711251262, 1.46, -3.1303095350034713, scene, boosts);

        //Create multiple hearts
        createHealth(3.3371503914805296, 0.08, -5.156236357144887, scene, healths);
        createHealth(9.123201360574695, 0.08, 0.41047471505580513, scene, healths);
        createHealth(14.03279715663051, 0.08, 8.672422194858061, scene, healths);
    }

    createHUD(camera,numCoins,boostFactor,soldierHealth);

    blindnessOverlay.style.display = 'flex';
    blindnessOverlay.style.opacity = -0.0889 * (soldierHealth) + 0.8889;
}



// Animation function
var cameraPosition;

let isJumping = false; // This will tell us if the character has initiated a jump
//Monster Code

function getCameraPositionBehindSoldier(soldier, distanceBehind) {
    const forwardDirection = new THREE.Vector3();
    soldier.getWorldDirection(forwardDirection);

    // The computed offset
    const offset = forwardDirection.multiplyScalar(-distanceBehind);

    return new THREE.Vector3().addVectors(soldier.position, offset);
}

let invunerable;
let boostFactor;
let soldierHealth;
let numCoins;
let verticalVelocity = 0;
let collectedAllCoinsMessage = false;
let portal;
let coinCounter = 0;
let jumpStartY = null;  // This will keep track of the Y position when the jump starts

initLevel(window.selectedLevel);


let isRunning = false;

function checkSoldierStatus() {
    // Check your soldier's status here (whether walking or running)
    // and adjust playback rate accordingly. For example:
    if (isRunning) {
        source.playbackRate.value = 1.5; // Increase tempo for running. You can calibrate this value as needed.
    } else if (!isRunning) {
        source.playbackRate.value = 1.0; // Normal tempo for walking
    }
}

let isSlowedDown = false;  // to check if the soldier is currently slowed down
let timerStarted = false;

let maxStepHeight = 0.15;

function checkStairs(character, sceneObject) {

    const rayStartHeight = 0;  // Start at the foot of the character
    const upwardRayLength = 0.3;  // The length of the ray pointing upwards

    // Setup the raycaster
    // Compute the character's forward direction
    const forwardOffset = new THREE.Vector3(0, 0, -0.2).applyQuaternion(character.quaternion);
    const footPosition = character.position.clone().add(forwardOffset).add(new THREE.Vector3(0, rayStartHeight, 0)); // starts at the foot, but forward

    // The direction of the ray remains pointing upwards
    const rayDirection = new THREE.Vector3(0, 1, 0);
    const upRay = new THREE.Raycaster(footPosition, rayDirection, 0, upwardRayLength);

    // Check if the ray intersects any object in the scene
    const intersects = upRay.intersectObject(sceneObject, true);

    if (intersects.length > 0) {
        const distanceToGround = intersects[0].distance;
        if (distanceToGround < maxStepHeight) {
            // Position the sphere at the collision point and make it visible
            //collisionPoint.position.copy(intersects[0].point);
            //collisionPoint.visible = true;

            // Adjust the character's Y position to the collision point.
            character.position.y = intersects[0].point.y + 0.07;
        }
    }

    /*
     // Create a red line material
const lineMaterial = new THREE.LineBasicMaterial({
    color: 0xff0000
});

     // Create a geometry that will be used for the line
  const lineGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, -maxStepHeight, 0)]);

// Create the line using the geometry and material
  const rayLine = new THREE.Line(lineGeometry, lineMaterial);

// Add the line to the scene
  scene.add(rayLine);

// Create a small sphere geometry to represent the collision point
  const collisionGeometry = new THREE.SphereGeometry(0.05); // The radius of the sphere is 0.05 units
  const collisionMaterial = new THREE.MeshBasicMaterial({color: 0xff0000}); // Red color for high visibility
  const collisionPoint = new THREE.Mesh(collisionGeometry, collisionMaterial);

// Initially, we don't want this sphere to be visible
  collisionPoint.visible = false;

// Add the sphere to the scene
  scene.add(collisionPoint);

  // Update the ray line's position to match the character's foot position plus the forward offset
    rayLine.position.copy(footPosition);

    // The line's end point is based on the upward direction
    const endPoint = new THREE.Vector3(0, upwardRayLength, 0);  // end point straight up
    lineGeometry.setFromPoints([new THREE.Vector3(), endPoint]);
    lineGeometry.attributes.position.needsUpdate = true; // Required when updating line geometry after creation

  for Stairs collision debugging purposes*/
}

function getDistance(x,y){
    return Math.sqrt(Math.pow((x.position.x-y.position.x),2)+Math.pow((x.position.y-y.position.y),2)+Math.pow((x.position.z-y.position.z),2));
}


function updateMovement() {
    // Calculate the direction in which the camera is looking.
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);

    // Get the camera's forward and right vectors
    const cameraForward = cameraDirection.clone().normalize();
    const cameraRight = new THREE.Vector3().crossVectors(camera.up, cameraDirection).normalize();

    // Move the collision checks to the checkMovement function
    const movementChecks = checkMovement(soldier, villaHouse, keyState, isJumping, verticalVelocity);
    let canMove = movementChecks.canMove;
    let isOnGround = movementChecks.isOnGround;
    verticalVelocity = movementChecks.verticalVelocity;
    // Update the bounding boxes
    dummyBox.setFromObject(dummyMesh);
    MonBox.setFromObject(MondummyMesh);

    var moveDistance = 0.015 * boostFactor;

    if (isSlowedDown) {
        moveDistance= 0.005;  // slow the original speed

    }

    if (!dummyBox.intersectsBox(MonBox) && !timerStarted) {
        timerStarted = true;  // Set the flag to true so that timer doesn't restart in the next frame
        setTimeout(function() {
            pursuing = true;
            playAnimation('Running');
            timerStarted = false;  // Reset the flag after the timer completes
        }, 5000);  // Set the timer for 5 seconds (5000 milliseconds)

        isSlowedDown = false;
    }


    if (keyState[16]) {  // shift key is pressed
        moveDistance *= 2;  // speed is doubled
    }

    let moveX = 0;
    let moveZ = 0;

    if (keyState[87] || keyState[38]) { // forward
        moveX += cameraForward.x * moveDistance;
        moveZ += cameraForward.z * moveDistance;
    }
    if (keyState[83] || keyState[40]) { // backward
        moveX -= cameraForward.x * moveDistance;
        moveZ -= cameraForward.z * moveDistance;
    }
    if (keyState[65] || keyState[37]) { // left
        moveX += cameraRight.x * moveDistance;
        moveZ += cameraRight.z * moveDistance;
    }
    if (keyState[68] || keyState[39]) { // right
        moveX -= cameraRight.x * moveDistance;
        moveZ -= cameraRight.z * moveDistance;
    }

    if (moveX !== 0 || moveZ !== 0) {
        const rotationAngle = Math.PI + Math.atan2(moveX, moveZ);
        soldier.rotation.y = rotationAngle;

        if (keyState[16]) {
            if (currentAnimation !== 'Run') {
                currentAnimationAction.fadeOut(0.6);
                currentAnimation = 'Run';
                currentAnimationAction = animations[currentAnimation];
                currentAnimationAction.reset().fadeIn(0.5).play();
                soldierMarchingSound.setPlaybackRate(1.2);
                soldierMarchingSound.play();
            }
        } else {
            if (currentAnimation !== 'Walk') {
                currentAnimationAction.fadeOut(0.6);
                currentAnimation = 'Walk';
                currentAnimationAction = animations[currentAnimation];
                currentAnimationAction.reset().fadeIn(0.5).play();
                soldierMarchingSound.setPlaybackRate(0.8);
                soldierMarchingSound.play();


            }
        }

        const newPositionX = soldier.position.x + moveX;
        const newPositionZ = soldier.position.z + moveZ;
        const newPositionY = soldier.position.y + verticalVelocity;

        if (canMove) {
            soldier.position.x = newPositionX;
            soldier.position.y = newPositionY;
            soldier.position.z = newPositionZ;
        }
    } else {
        if (currentAnimation !== 'Idle') {
            currentAnimationAction.fadeOut(0.6);
            currentAnimation = 'Idle';
            currentAnimationAction = animations[currentAnimation];
            currentAnimationAction.reset().fadeIn(0.5).play();
            soldierMarchingSound.stop();

        }
    }

    if (isOnGround){
        // Call the checkStairs function
        checkStairs(soldier, villaHouse);
    }

// Jumping logic
    const jumpSpeed = 0.05; // Adjust the jump speed as needed
    const gravity = 0.005; // Adjust the gravity as needed
    const collisionThreshold = 0.1;

    if (keyState[32] && isOnGround) { // Spacebar is pressed and the character is on the ground
        verticalVelocity = jumpSpeed; // Set the vertical velocity to make the character jump
        isOnGround = false;
        isJumping = true; // Character has initiated a jump
        jumpStartY = soldier.position.y;
    }

    if (isJumping && soldier.position.y >= jumpStartY + collisionThreshold) {
        isJumping = false;
    }

    if (!isOnGround) {
        verticalVelocity -= gravity; // Apply gravity if the character is not on the ground
    }

    soldier.position.y += verticalVelocity; // Update the character's vertical position


    orbitControls.target.copy(soldier.position);

// Update dummyMesh's position
    dummyMesh.position.copy(soldier.position);
    dummyMesh.position.y += yOffset;  // make sure to add yOffset again
    MondummyMesh.position.copy(monster.position);
    MondummyMesh.position.y += 0.3;
// At the end of your movement updates, add:
    if (soldierBoxHelper) {
        soldierBoxHelper.update();
    }
    if (MonBoxHelper) {
        MonBoxHelper.update();
    }

    checkCollisionsWithCollectibles();

    let allCoinsCollected = coins.every(coin => coin.collected);

    if (allCoinsCollected && !collectedAllCoinsMessage) {
        console.log("You have collected all the coins");
        collectedAllCoinsMessage = true;  // This ensures the message is only printed once.
    }

// At the end of your movement updates:
    if (dummyMesh && portalDummyMesh) {
        let soldierBox = new THREE.Box3().setFromObject(dummyMesh);
        let portalBox = new THREE.Box3().setFromObject(portalDummyMesh);
        if (soldierBox.intersectsBox(portalBox)) {
            console.log("Soldier collided with portal!");
            gamewon();
        }
    }
    //console.log(soldier.position.x, soldier.position.y, soldier.position.z);
//Check if monster is close to soldier, and damage if yes
    if(getDistance(soldier,monster)<0.45){

        if(invunerable>100){
            console.log("Player damaged");
            invunerable=0;
            soldierHealth--;

            blindnessOverlay.style.opacity=-0.0889*(soldierHealth)+0.8889;

            if(soldierHealth==0){
                blindnessOverlay.style.display = 'none';
                blindnessOverlay.style.opacity=0;
                console.log("Player should be dead");
                gamelost();
            }

            console.log(blindnessOverlay);

            updateHUDHP(soldierHealth);
            animate();
        }else{
            console.log("Player hit but involnerable");
        }

    }
}

const ELEVATION_OFFSET = 1;  // Adjust this value based on how much you want to elevate the camera

function maintainDistanceFromSoldier(soldier, camera, distance) {
    let offset = new THREE.Vector3().subVectors(camera.position, soldier.position);
    offset.normalize().multiplyScalar(distance);

    camera.position.x = soldier.position.x + offset.x;
    camera.position.z = soldier.position.z + offset.z;
    camera.position.y = soldier.position.y + ELEVATION_OFFSET;  // Elevate the camera based on the soldier's y position

    camera.position.lerp(camera.position, 0.05);
}





let monster;
let monsterMixer;
const monsterAnimations = {};
const monsterloader = new GLTFLoader();
let animationState = 'Idle'; // default animation

//function to play animation
function playAnimation(name) {
    // Stop all other actions
    for (let actionName in monsterAnimations) {
        if (monsterMixer) {
            monsterMixer.stopAllAction();
        }
        monsterMixer.clipAction(monsterAnimations[actionName]).stop();

    }

    // Play the desired action
    if (monsterAnimations[name]) {
        monsterMixer.clipAction(monsterAnimations[name]).play();
    }

    // Update animation state
    animationState = name;
}

// Load and store animations by their names
monsterloader.load('monster models/Monster warrior/MW Running gltf/MW Running.gltf', (gltf) => {
    gltf.animations.forEach((clip) => {
        monsterAnimations[clip.name] = clip;
    });
});

monsterloader.load('monster models/Monster warrior/MW Walking gltf/MW Walking.gltf', (gltf) => {
    gltf.animations.forEach((clip) => {
        monsterAnimations[clip.name] = clip;
    });
});

monsterloader.load('monster models/Monster warrior/MW Smashing gltf/MW Smashing .gltf', (gltf) => {
    gltf.animations.forEach((clip) => {
        monsterAnimations[clip.name] = clip;
    });
});

let MondummyMesh;
let MonBoxHelper;
async function loadMonster() {
    // Define a promise to handle the asynchronous loading
    return new Promise((resolve, reject) => {
        monsterloader.load('monster models/Monster warrior/MW Idle/MW Idle.gltf', (gltf) => {
        monster = gltf.scene;
        monster.position.set(0.9, 0, 8); // Set initial position here
        monster.scale.set(0.35, 0.35, 0.35);

        monsterMixer = new THREE.AnimationMixer(monster);
        scene.add(monster);

        // 1. Create a dummy mesh with a BoxGeometry of your desired size.
        let MonboxSize = new THREE.Vector3(0.6,0.7, 0.4); // Size of the box (width, height, depth)
        MondummyMesh = new THREE.Mesh(new THREE.BoxGeometry(MonboxSize.x, MonboxSize.y, MonboxSize.z));

        // 2. Position this mesh at the position of the soldier.
        MondummyMesh.position.copy(new Vector3(monster.position.x, monster.position.y, monster.position.z));
        yOffset = 0.1;  // or any value you deem appropriate
        MondummyMesh.position.y += yOffset;


        // 3. Create a BoxHelper using this dummy mesh.
        MonBoxHelper = new THREE.BoxHelper(MondummyMesh, 0x00ff00);

        // 4. Add the BoxHelper to the scene.
        //     scene.add(MonBoxHelper);


        monsterAnimations.Idle = gltf.animations[0];
        playAnimation('Idle');
        monster.add(monsterSound);
        // Set the reference distance (the distance at which the sound is at full volume)
        monsterSound.setRefDistance(1);  // Smaller value means sound will diminish at a shorter distance.

        // Set the rolloff factor (how quickly the sound diminishes past the reference distance)
        monsterSound.setRolloffFactor(3);  // Higher value means sound diminishes more rapidly.

        // Optionally, set the maximum distance at which the sound can be heard at all.
        monsterSound.setMaxDistance(10);  // The sound will not be heard beyond this distance.



        // Adjust the monster's y position based on bounding box here
        const box = new THREE.Box3().setFromObject(monster);
        monster.position.y = -0.4 - box.min.y;
        resolve(monster); // Resolve the promise with the loaded monster
        }, undefined, (error) => {
                console.error(error);
                reject(error); // Reject the promise on error
            });
    });
}

monsterloader.load('monster models/Monster warrior/MW Running gltf/MW Running.gltf', (gltf) => {
    // Store the running animation
    monsterAnimations.Running = gltf.animations[6];
});

monsterloader.load('monster models/Monster warrior/MW Walking gltf/MW Walking.gltf', (gltf) => {
    // Store the walking animation
    monsterAnimations.Walking = gltf.animations[1];
});

monsterloader.load('monster models/Monster warrior/MW Smashing gltf/MW Smashing .gltf', (gltf) => {
    // Store the smashing animation
    monsterAnimations.Smashing = gltf.animations[2];
});

 const pathfinding = new Pathfinding();
const pathfindinghelper = new PathfindingHelper();
 scene.add(pathfindinghelper);
const ZONE = "villaHouse";
let navmesh;
let groupId;
let navpath;
scene.add(pathfindinghelper);
loader.load("navmesh/blendernavmesh4.glb", function(gltf){
meshfloor = gltf.scene;
meshfloor.position.set(0, 0, 0);
meshfloor.scale.set(1, 1, 1);
 // scene.add(meshfloor);
gltf.scene.traverse(node =>{
         if(!navmesh && node.isObject3D && node.children && node.children.length > 0){
             navmesh = node.children[0];
             console.log("navmesh object:", navmesh);
             pathfinding.setZoneData(ZONE, Pathfinding.createZone(navmesh.geometry));
             console.log("pathfinding zones", pathfinding.zones);
         }
     })
 })

let dummyBox = new THREE.Box3();
let MonBox = new THREE.Box3();

function findPath() {

    if (pursuing) {

        // playAnimation('Running');

        let target = soldier.position.clone();
        //console.log("soldier pos:", target);

        let monsterPos = monster.position.clone();

        //for (let i = 0; i < pathfinding.zones["villaHouse"].groups.length; i++) {
        groupId = pathfinding.getGroup('villaHouse', monsterPos);
        //console.log("Group Id:", groupId);
        const closest = pathfinding.getClosestNode(monsterPos, 'villaHouse', groupId);
        //console.log("closest node:", closest);
        const closest2 = pathfinding.getClosestNode(target, 'villaHouse', groupId);
        //console.log("closest node 2:", closest2);
        if (closest) {
            navpath = pathfinding.findPath(closest.centroid, target, "villaHouse", groupId);
            //console.log("nav path :", navpath);
            if (navpath && navpath.length > 0) {
                pathfindinghelper.reset();
                // pathfindinghelper.setPlayerPosition(monster.position);
                // pathfindinghelper.setTargetPosition(target);
                // pathfindinghelper.setPath(navpath);

                // Target position
                let targetPos = navpath[0];

                // Compute distance to target
                const distance = targetPos.clone().sub(monster.position);

                // If the monster is close enough to the target position
                if (distance.lengthSq() < 0.6) {

                    navpath.shift(); // Go to the next waypoint
                    if (navpath.length === 0) {
                        navpath = pathfinding.findPath(closest.centroid, target, "villaHouse", groupId);

                    } // If there's no more waypoints, just return
                    targetPos = navpath[0]; // New target position
                    distance.copy(targetPos.clone().sub(monster.position)); // Update distance
                }

                // Normalize distance to get direction
                const direction = distance.normalize();

                // Set monster speed (adjust the 0.05 value to your preference)
                const speed = 0.021;

                // Update the monster's position
                monster.position.add(direction.multiplyScalar(speed));

                // Make the monster face the direction it's heading
                monster.lookAt(monster.position.clone().add(direction));

                // Update the bounding boxes
                dummyBox.setFromObject(dummyMesh);
                MonBox.setFromObject(MondummyMesh);

                // Then, check for intersections.
                if (dummyBox.intersectsBox(MonBox)) {
                    pursuing = false;
                    isSlowedDown = true;
                    playAnimation("Idle");
                    playAnimation('Smashing');
                }

            }
        }

    }
}


function checkCollisionsWithCollectibles() {
    const soldierBoundingBox = new THREE.Box3().setFromObject(dummyMesh);

    // Check collision with coins
    coins.forEach(coin => {
        const coinBoundingBox = new THREE.Box3().setFromObject(coin.dummyMesh);
        if (soldierBoundingBox.intersectsBox(coinBoundingBox) && !coin.collected) {
            console.log("Collision between character and coin");
            numCoins+=1;
            coin.mesh.visible = false;
            coin.collected = true;
            updateHUDCoin(numCoins);
            animate();

            // Remove the coin from the scene
            scene.remove(coin.mesh);

            // Load the portal if all level coins have been collected
            if (numCoins === coinsNeeded) {
                coinsCollected();
                loadPortal();
            }

        }
    });

    // Define a variable to keep track of the active boost timeout
    let boostTimeout = null;

    // Check collision with boosts
    boosts.forEach(b => {
        const boostBoundingBox = new THREE.Box3().setFromObject(b.dummyMesh);
        if (soldierBoundingBox.intersectsBox(boostBoundingBox) && !b.collected) {
            console.log("Collision between character and boost");

            // Clear the existing timeout if it's still active, this will prevent the boostFactor from reverting while a new boost is active
            if (boostTimeout) {
                clearTimeout(boostTimeout);
            }

            boostFactor += 1;  // or any other effect you want to give
            b.mesh.visible = false;
            b.collected = true;
            updateHUDSpeed(boostFactor);
            animate();

            // Set a timeout to revert the boostFactor after 10 seconds (10000 milliseconds)
            boostTimeout = setTimeout(() => {
                boostFactor -= 1; // assuming the normal state is one less. Adjust as necessary.
                updateHUDSpeed(boostFactor);
                boostTimeout = null; // Clear the timeout variable
            }, 8000); // 10000 milliseconds = 10 seconds
        }
    });

    // Check collision with healths
    healths.forEach(h => {
        const healthBoundingBox = new THREE.Box3().setFromObject(h.dummyMesh);
        if (soldierBoundingBox.intersectsBox(healthBoundingBox) && !h.collected) {
            console.log("Collision between character and health");
            soldierHealth += 1;
            h.mesh.visible = false;
            h.collected = true;
            blindnessOverlay.style.opacity=-0.0889*(soldierHealth)+0.8889; // Update blindness overlay
            updateHUDHP(soldierHealth);
            animate();
        }
    });


}

//play different animations
 document.addEventListener('keydown', (event) => {
     switch (event.code) {
         case 'KeyI':
             playAnimation('Idle');
             break;
         case 'KeyR':
             if (!pursuing) {
                 pursuing = true;
                 playAnimation('Running');
             } else {
                 pursuing = false;
                 // path = [];
                 playAnimation('Idle');
             }
             break;
         // generateRandomDestination(monster);
         case 'KeyO':
             playAnimation('Walking');
             break;
         case 'KeyG':
             playAnimation('Smashing');
             break;
     }
 });

//monster pursuit code:

     const clock = new THREE.Clock();
 function animate() {
     if (isGamePaused) {
         // If the game is paused, simply return without doing anything
         return;
     }

     requestAnimationFrame(animate);

     //Add to the invunerable counter for player damage
     if(invunerable<101)invunerable++;

     if (mixer) mixer.update(0.016);
     if (monsterMixer) monsterMixer.update(0.015);
     if (portalMixer) portalMixer.update(0.016);

     // Update mixers for all coins
     for (const coin of coins) {
         if (coin.mixer) {
             coin.mixer.update(0.016);
         }
     }

     // Update mixers for all boost
     for (const boost of boosts) {
         if (boost.mixer) {
             boost.mixer.update(0.016);
         }
     }

     // Update mixers for all boost
     for (const health of healths) {
         if (health.mixer) {
             health.mixer.update(0.016);
         }
     }

     updateMovement();

     listener.position.copy(camera.position);

     // Call the function after the exploration is done
     // visualizeGrid(grid);

     if (firstPersonView) {
         firstPersonControls.update(clock.getDelta());
         let a = soldier.position.x;
         let b = soldier.position.y+0.3;
         let c = soldier.position.z;

         camera.position.set(a,b,c);
     } else {
         orbitControls.update();
         maintainDistanceFromSoldier(soldier, camera, 1); // 10 is the desired distance from the soldier

     }

     // In your animate function
     if (pursuing) {
         // findSoldier(clock.getDelta()); // start fin
         findPath();
     }


     if (firstPersonView) {
         firstPersonControls.update(clock.getDelta());
     } else {
         orbitControls.update();
     }

     renderer.render(scene, camera);

 }
// Start animation
 animate();

