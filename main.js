import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import {createHUD, removeHUD, updateHUDCoin, updateHUDHP, updateHUDSpeed} from './hud';
import {checkMovement} from "./collisionCheck";
import {Vector3} from "three";
import {animateCollectibles, checkCollisionsWithBoosts, checkCollisionsWithCoins, checkCollisionsWithHealths, createBoost, createCoin, createHealth} from './collectables.js';
import {Pathfinding, PathfindingHelper} from 'three-pathfinding';
import {FirstPersonControls} from "three/addons/controls/FirstPersonControls";
import {createHealthEffect, createBoostEffect, updateHealthEffect, updateBoostSystem} from "./particles";

import { createLights } from './lights.js';
import { createPainting } from './branden';


let currentLevel =1;
if (window.selectedLevel) {
    currentLevel = window.selectedLevel;
}

let isGamePaused = false;

window.pauseGame = function() {
    isGamePaused = true;  // sets the game state to paused
}

window.resumeGame = function() {
    if (isGamePaused) {

        isGamePaused = false; // Sets the game state to running
        animate(); // Need to restart the animation too
    }
}
function gamelost(){
   const overlay = document.getElementById('lose-screen');
   overlay.style.display = 'flex';
   isGamePaused = true;
}

function gamewon(){
    console.log("Game won for level:", currentLevel);
    if(currentLevel != 3) {
        updateWinScreenWithNextLevel(currentLevel);
    }else{
        // If it's level 3, change the win message and hide the next level button, and show credits button
        const existingObjectiveElement = document.querySelector('#win-screen .next-level-objective');
        const existingModifiersElement = document.querySelector('#win-screen .next-level-modifiers');

        // Used to clear out the previous level's objectives and modifiers
        if(existingObjectiveElement) existingObjectiveElement.remove();
        if(existingModifiersElement) existingModifiersElement.remove();
        document.getElementById('win-message').textContent = "Congratulations! You have beat the game!";
        document.getElementById('next-level-button').style.display = 'none';
        document.getElementById('credits-end-button').style.display = 'block';
    }
    const overlay = document.getElementById('win-screen');
    overlay.style.display = 'flex';
    isGamePaused = true;
}


window.goToNextLevel = function(){
    currentLevel++;
    if (currentLevel <= 3) { // If there are still levels left
        // Clean up the previous level's objects
        clearPreviousLevel();
        //start the next level
        initLevel(currentLevel);
    }
}

// Helper function to clear out any assets from the last level (other than the character and monster models as those are repositioned instead)
function clearPreviousLevel() {
    portal.visible = false;
    removeHUD(camera);
    cleanIcons();
    updateHUDHP(soldierHealth);
    updateHUDCoin(numCoins);
    updateHUDSpeed(boostFactor);
    animate();

    // Remove the particle systems
    soldier.remove(healthParticleSystemForSoldier);
    camera.remove(healthParticleSystemForCamera);
    soldier.remove(boostParticleSystemForSoldier);
    camera.remove(boostParticleSystemForCamera);

    scene.remove(fireModel);
}



const retryButton = document.getElementById("retry-button");

retryButton.addEventListener('click', async () => {

    const overlay = document.getElementById('lose-screen');
    overlay.style.display = 'none';
    isGamePaused = true;  // Pause the game while setting up the level

    // Hide loading screen after level is ready
    document.getElementById('loading-screen').style.display = 'flex';
    try {
        await clearPreviousLevel();
        await initLevel(currentLevel);  // Initialise the level after cleanup
    } catch (error) {
        console.error('An error occurred during level retry setup:', error);
    }

    isGamePaused = false;  // Unpause the game when setup is complete
    animate();
});

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
camera.position.y = 0.6;
camera.position.z = 1;
//MinimapCamemra
let minimapWidth = window.innerHeight/4
let minimapHeight = window.innerHeight/4
const minimapCamera = new THREE.PerspectiveCamera(300, 1, 0.1, 1000);
let redDot;
scene.add(minimapCamera);
scene.add(camera);
//creating a redDot to track palyer position
const material = new THREE.MeshPhongMaterial({
  color: 0xff0000,
  emissive: 0x000000,
  flatShading: true,
});
const radius = 0.2;
const segments = 32;
const rings = 32;
const geometry = new THREE.SphereGeometry(radius, segments, rings);
redDot = new THREE.Mesh(geometry, material);
scene.add(redDot);
let firstPersonView = false;

const spotlight = new THREE.SpotLight(0xFFFFFF, 6, 1.5, Math.PI / 7);

function toggleFirstPersonView() {
    firstPersonView = !firstPersonView;
    orbitControls.enabled = !firstPersonView;
    firstPersonControls.enabled = firstPersonView;

    if (firstPersonView) {
        // Adjust camera's position
        camera.position.set(soldier.position.x, soldier.position.y + 0.6, soldier.position.z+0.3);
        soldier.visible = false;
        // Turn on the light
        spotlight.intensity = 6;

        // Set the spotlight's position to the camera's position
        spotlight.position.set(0,0.6,0);

        // Calculate the direction the camera is facing
        const cameraDirection = new THREE.Vector3();
        camera.getWorldDirection(cameraDirection);

        // Calculate the target position by adding the camera's position to the camera's direction vector
        const targetPosition = new THREE.Vector3();
        targetPosition.copy(camera.position).add(cameraDirection);

        // Set the spotlight's target position
        spotlight.target.position.set(0,0,-1);

        // Add the light to the camera so it moves with the camera
        camera.add(spotlight);
        camera.add(spotlight.target)
    } else {
        soldier.visible = true;

        // Turn off the light
        spotlight.intensity = 0;
        // If not in first-person view,
        spotlight.position.set(0, 0, 0);
        spotlight.target.position.set(0, 0, -1);
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
// Loading sound file
audioLoader.load('/audio/horrorMusic.mp3', function(buffer) {
    monsterSound.setBuffer(buffer);
    monsterSound.setRefDistance(20); // Set reference distance for volume control
    monsterSound.setDirectionalCone(180, 230, 0.1);
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
    minimapWidth = newHeight / 4;
    minimapHeight = newHeight / 4;
    minimapCamera.aspect = 1;
    minimapCamera.updateProjectionMatrix();
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

        let boxSize = new THREE.Vector3(0.2, 0.5, 0.2);
        dummyMesh = new THREE.Mesh(new THREE.BoxGeometry(boxSize.x, boxSize.y, boxSize.z));

        dummyMesh.position.copy(new Vector3(soldier.position.x, soldier.position.y, soldier.position.z));
        yOffset = 0.2;
        dummyMesh.position.y += yOffset;


        soldierBoxHelper = new THREE.BoxHelper(dummyMesh, 0x00ff00);


        // Allows for soldier animation
        mixer = new THREE.AnimationMixer(soldier);

        // Store the animations in the animations object
        animations = {}; // Reset the animations object
        gltf.animations.forEach((clip) => {
            animations[clip.name] = mixer.clipAction(clip);
        });

        currentAnimationAction = animations[currentAnimation];
        currentAnimationAction.play();
        if (animations['Idle']) animations['Idle'].play();

        // Set the target of OrbitControls after the soldier is loaded
        orbitControls.target.copy(soldier.position);

        resolve(soldier);
        }, undefined, function (error) {
            console.error(error);
            reject(error);
        });
    });
}
// add lights to scene
createLights(scene);

let villaHouse;
let meshfloor;

// Load the maze model
const loader = new GLTFLoader();

let pursuing = false; // Flag to check if monster is in pursuit mode

// Land texture

const textureLoader = new THREE.TextureLoader();
const floorTexture = textureLoader.load('textures/wall.png');
floorTexture.minFilter = THREE.LinearMipmapLinearFilter;
floorTexture.wrapS = THREE.RepeatWrapping;
floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(300, 300);

// wall texture
const walltextureLoader = new THREE.TextureLoader();
const wallTexture = walltextureLoader.load('textures/floor.jpg');


// Load the villaHouse model
loader.load('models/villaHouse.glb', function (gltf) {
    villaHouse = gltf.scene;

    gltf.scene.position.set(0, 0, 0);
    gltf.scene.scale.set(1, 1, 1);
    scene.add(gltf.scene);

    // Find the child named "floor"
    const floor = villaHouse.getObjectByName("floor");

    if (floor) {
        // Create a new material with the floorTexture
        const floorMaterial = new THREE.MeshStandardMaterial({
            map: floorTexture,
            roughness: 0.7,
            metalness: 0.2,
        });

        floor.material = floorMaterial;

        floor.receiveShadow = true;

        floor.castShadow = false;
    } else {
        console.warn('Floor not found in the villaHouse model.');
    }

    villaHouse.traverse((child) => {
        if (child.isMesh && child.name.startsWith("Cube")) {
            const wallMaterial = new THREE.MeshStandardMaterial({
                map: wallTexture,
                roughness: 4,
                metalness: 0.2,
            });

            child.material = wallMaterial;
            child.receiveShadow = true;
            child.castShadow = false;
        }
    });
}, undefined, function (error) {
    console.error(error);
});





let portalMixer;
let portalDummyMesh;
let portal;
function loadPortal() {
    return new Promise((resolve, reject) => {
    const portalLoader = new GLTFLoader();
    if (!portal) { // check if portal hasn't been loaded
        portalLoader.load('models/portal.glb', function (gltf) {
            portal = gltf.scene;
            gltf.scene.scale.set(0.3, 0.3, 0.3);
            scene.add(gltf.scene);

            portalDummyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.8, 0.1));

            if (gltf.animations && gltf.animations.length) {
                portalMixer = new THREE.AnimationMixer(portal);
                const action = portalMixer.clipAction(gltf.animations[0]);
                action.play();
            }

            portal.visible = false;
            resolve(portal);
        }, undefined, function (error) {
            console.error(error);
            reject(error);
        });
    } else {
        resolve(portal); // Resolves if portal was loaded before
    }
    });
}

let coinsNeeded;
let coins = [];
let boosts = [];
let healths = [];

async function initLevel(level) {
    console.log("initlevel initiated");
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
        } catch (error) {
            console.error('An error occurred while loading the monster:', error);
        }
    }
    if(!portal) {
        try {
            await loadPortal(); // Wait for the portal to be loaded.
        } catch (error) {
            console.error('An error occurred while loading the portal:', error);
            return;
        }
    }

    if (level == 1) {
        //Start of game parameters
        invunerable = 0;
        boostFactor = 1;
        soldierHealth = 5;
        numCoins = 0;

        // Create multiple coins
        coinsNeeded = 3;
        createCoin(-11, 0.1, 8, scene, coins);
        createCoin(-0.16933011722566568, 1.5428444454159687, -3.5196514665312306, scene, coins);
        createCoin(8.309663681895037, 0.08, -2.9527764209625995, scene, coins);

        //Create multiple boosts
        createBoost(-4.527128711251262, 1.46, -3.1303095350034713, scene, boosts);

        //Create multiple hearts
        createHealth(3.3371503914805296, 0.08, -5.156236357144887, scene, healths);
        createHealth(9.123201360574695, 0.08, 0.41047471505580513, scene, healths);
        createHealth(14.03279715663051, 0.08, 8.672422194858061, scene, healths);

        //Set character position
        soldier.rotation.y = Math.PI;
        soldier.position.set(5.42934919320037, -0.19268887765808546, -7.5301149896237245);

        //Set monster position
        monster.position.set(12.344735516930285, 0.0, 23.321273620601847);

        //Set portal position
        portal.position.set(2.508606756460684, -0.3057145773003322, 19.9);
        portalDummyMesh.position.copy(portal.position);
        portalDummyMesh.position.z -= 1.3;

    } else if (level == 2) {
        //Start of game parameters
        invunerable = 0;
        boostFactor = 1;
        soldierHealth = 3;
        numCoins = 0;

        coinsNeeded = 5;

        // Create multiple coins
        createCoin(-4.668858254609299, 0.19268887765808546, -3.666108506629987, scene, coins);
        createCoin(5.498843474553945, 0.08, -7.5, scene, coins);
        createCoin(-7.524356448677272, 1.53, -0.23800024980310194, scene, coins);
        createCoin(15.313297791701023, -0.1057143266885793, 21.623686900287876, scene, coins);
        createCoin(-6.478627718796445,0.0257167563954529,-6.168920117051623, scene, coins);

        //Create multiple boosts
        createBoost(-4.527128711251262, 1.46, -3.1303095350034713, scene, boosts);
        createBoost(-7.166800572786356,0.13303180199350304, -2.969070444496146, scene, boosts);
        //Create multiple hearts
        createHealth(3.3371503914805296, 0.08, -5.156236357144887, scene, healths);
        createHealth(9.123201360574695, 0.08, 0.41047471505580513, scene, healths);
        createHealth(14.03279715663051, 0.08, 8.672422194858061, scene, healths);

        //Set character position
        soldier.position.set(12.344735516930285, 0.0, 23.321273620601847);

        //Set Monster position
        monster.position.set(-10.953637295548958, -0.16373699632400585, 8.058759585396883);

        //Set Portal Position
        portal.position.set(14.710548068720117, -0.3, 7.8);
        portalDummyMesh.position.copy(portal.position);
        portalDummyMesh.position.z -= 1.3;

    } else if (level == 3) {
        if(!flymonster) {
            try {
                await loadFlyingMonster();
                //Set Flying Monster
                flymonster.position.set(11.602514540807476,-0.5, 7.350874621916164);
                monster2.position.set(11.602514540807476, 0, 7.350874621916164);
                // Monster loaded successfully
            } catch (error) {
                // Handle error during monster loading
                console.error('An error occurred while loading the flyingmonster:', error);
            }
        }
        //Start of game parameters
        invunerable = 0;
        boostFactor = 1;
        soldierHealth = 4;
        numCoins = 0;
        // Create multiple coins
        coinsNeeded =4;
        createCoin(14.536421965589483,0.03057155538155174,7.58699090130494, scene, coins);
        createCoin(2.7320551078342272, 0.03057145082506017, 19.546859446851897, scene, coins);
        createCoin(11.11768482268818, 0.03187933911074385, 3.0645921687486406, scene, coins);
        createCoin(-2.4891079135108454,0.03,-5.813755465209445, scene, coins);

        //Create multiple boosts
        createBoost( -7.316586596047871, 1.5447727849730473, -0.35417485409345584, scene, boosts);
        createBoost( 2.851041869511314,0.10571556000491645,7.516192429267554, scene, boosts);
        //Create multiple hearts
        createHealth(12.2, 0.08, 24.1, scene, healths);
        createHealth(14.03279715663051, 0.08, 8.672422194858061, scene, healths);

        //Set character position
        soldier.position.set(-6.907895289153094, 0.13303180199350304, -2.9565324021461117);

        //Set Monster position
        monster.position.set(9.180331758242579,-0.12111884839921798,-0.19535202985285158);

        //Set Portal Position
        portal.position.set(-10.547375410445332,-0.16373699632400585, 8.20728346728963);
        portalDummyMesh.position.copy(portal.position);
        portalDummyMesh.position.z += 1.3;
        portal.rotation.y = Math.PI;
    }

    createHUD(camera,numCoins,boostFactor,soldierHealth);
    createPainting(scene);

    isGamePaused = false;
    animate();

    // Once everything is loaded, hide the loading screen
    document.getElementById('loading-screen').style.display = 'none';

    return Promise.resolve();
}


let isJumping = false; // Tells us if the character has initiated a jump

let invunerable;
let boostFactor;
let soldierHealth;
let numCoins;
let verticalVelocity = 0;
let jumpStartY = null;  // This will keep track of the Y position when the jump starts

initLevel(window.selectedLevel);

let isRunning = false;
let isSlowedDown = false;  // to check if the soldier is currently slowed down
let timerStarted = false;

let maxStepHeight = 0.15;

function checkStairs(character, sceneObject) {

    const rayStartHeight = 0;  // Start at the foot of the character
    const upwardRayLength = 0.3;  // The length of the ray pointing upwards

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
            // Adjust the character's Y position to the collision point.
            character.position.y = intersects[0].point.y + 0.07;
        }
    }
}

function getDistance(x,y){
    return Math.sqrt(Math.pow((x.position.x-y.position.x),2)+Math.pow((x.position.y-y.position.y),2)+Math.pow((x.position.z-y.position.z),2));
}


let lastTime = 0; // Tracks the time since the last update (for deltaTime calculation)
let bobbingSpeed = 6; // Controls how fast the bobbing effect is
const bobbingIntensity = 0.1; // Controls how much the camera bobs up and down
let bobbingTime = 0; // Accumulates time for consistent bobbing, considering the speed
var bobAmount=0;

let isMoving;

let fireModel; // to store the fire model
let fireMixer;
const fireLoader = new GLTFLoader();
fireLoader.load('models/fire.glb', (gltf) => {
    fireModel = gltf.scene;
    fireModel.scale.set(0.1,0.07,0.1);
    fireModel.visible = false; // initially, set it to invisible

    fireMixer = new THREE.AnimationMixer(fireModel);
    gltf.animations.forEach((clip) => {
        fireMixer.clipAction(clip).play();
    });

    scene.add(fireModel);
});

function updateMovement() {
    // Calculate the direction in which the camera is looking.
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);

    // Get the camera's forward and right vectors
    const cameraForward = cameraDirection.clone().normalize();
    const cameraRight = new THREE.Vector3().crossVectors(camera.up, cameraDirection).normalize();

    // Handles collision
    const movementChecks = checkMovement(soldier, villaHouse, keyState, isJumping, verticalVelocity);
    let canMove = movementChecks.canMove;
    let isOnGround = movementChecks.isOnGround;
    verticalVelocity = movementChecks.verticalVelocity;


    // Update the bounding boxes of the soldier and floor monster

    dummyBox.setFromObject(dummyMesh);
    MonBox.setFromObject(MondummyMesh);
    const moveSpeed = 0.015

    var moveDistance = moveSpeed * boostFactor;

    if (isSlowedDown) {
        moveDistance= moveSpeed * 0.3 * boostFactor;  // slow the original speed
        bobbingSpeed= 3;
    }

    //Begins slow down effect for 5 seconds
    if (!dummyBox.intersectsBox(MonBox) && !timerStarted) {
        timerStarted = true;
        setTimeout(function() {
            pursuing = true;
            playAnimation('Running');

            timerStarted = false;  // Reset the flag after the timer completes
        }, 5000);  // Set the timer for 5 seconds


        isSlowedDown = false;
    }


    if (keyState[16]) {  // shift key is pressed
        moveDistance *= 2;  // speed is doubled
        bobbingSpeed =9;
        isRunning=true;
    }
    else{
        isRunning=false;
        bobbingSpeed =6;
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
        isMoving=true;

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
        isMoving=false;
        if (currentAnimation !== 'Idle') {
            currentAnimationAction.fadeOut(0.6);
            currentAnimation = 'Idle';
            currentAnimationAction = animations[currentAnimation];
            currentAnimationAction.reset().fadeIn(0.5).play();
            soldierMarchingSound.stop();

        }
    }

    if (isOnGround){
        // Auto walk up stairs
        checkStairs(soldier, villaHouse);
    }

// Jumping logic
    const jumpSpeed = 0.05;
    const gravity = 0.005;
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

    // Update soldier and monster mesh positions
    dummyMesh.position.copy(soldier.position);
    dummyMesh.position.y += yOffset;
    MondummyMesh.position.copy(monster.position);
    MondummyMesh.position.y += 0.3;



    // Update dragon positions

    if (flymonster) {
        MondummyMesh2.position.copy(monster2.position);
        MondummyMesh2.position.y += 0.3;
    }

    //Visual aid to help with debugging of models
    if (soldierBoxHelper) {
        soldierBoxHelper.update();
    }
    if (MonBoxHelper) {
        MonBoxHelper.update();
    }

    //Update Dragon box helper
    if (MonBoxHelper2) {
        MonBoxHelper2.update();
    }


    checkCollisionsWithCollectibles();

    //Checks if player collides with portal
    if (dummyMesh && portalDummyMesh) {
        let soldierBox = new THREE.Box3().setFromObject(dummyMesh);
        let portalBox = new THREE.Box3().setFromObject(portalDummyMesh);
        if (soldierBox.intersectsBox(portalBox) && portal.visible) {
            gamewon();
        }
    }



    //Check if monster/dragon is close to soldier, and damage if yes
    if(getDistance(soldier,monster)<0.45 || (monster2 && getDistance(soldier,monster2) < 0.65)){

        if(invunerable>100){
            console.log("Player damaged");
            invunerable=0;
            soldierHealth--;

            if( (monster2 && getDistance(soldier,monster2) < 0.65)) {
                if (fireModel) {
                    fireModel.position.copy(soldier.position); // position the fire at the player's position
                    fireModel.position.x += 0.2;
                    fireModel.position.y -= 0.3;
                    fireModel.visible = true;
                    console.log(fireModel.position);
                    // Hide the fire after 3 seconds
                    setTimeout(() => {
                        fireModel.visible = false;
                    }, 8000);
                }
            }

            if(soldierHealth==0){
                console.log("Player should be dead");
                gamelost();
            }

            updateHUDHP(soldierHealth);
            animate();
        }else{
            console.log("Player hit but involnerable");
        }

    }
}

const ELEVATION_OFFSET = 1;  // Elevation for camera

function maintainDistanceFromSoldier(soldier, camera, distance) {
    let offset = new THREE.Vector3().subVectors(camera.position, soldier.position);
    offset.normalize().multiplyScalar(distance);

    camera.position.x = soldier.position.x + offset.x;
    camera.position.z = soldier.position.z + offset.z;
    camera.position.y = soldier.position.y + ELEVATION_OFFSET;  // Elevate the camera based on the soldier's y position

    camera.position.lerp(camera.position, 0.05);
}


//Monster Code:

let monster;
let monsterMixer;
const monsterAnimations = {};
const monsterloader = new GLTFLoader();
let animationState = 'Idle'; // default animation
let flyanimationState = 'flying'; // default animation

//function to play monsters animation
function playAnimation(name) {
    // Stop all other actions
    for (let actionName in monsterAnimations) {
        if (monsterMixer) {
            monsterMixer.stopAllAction();
        }
        monsterMixer.clipAction(monsterAnimations[actionName]).stop();

    }

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


//Load Monster:
let MondummyMesh;
let MonBoxHelper;
let yOffset2;
async function loadMonster() {
    // Promise used to handle async loading
    return new Promise((resolve, reject) => {
        monsterloader.load('monster models/Monster warrior/MW Idle/MW Idle.gltf', (gltf) => {
        monster = gltf.scene;
        monster.position.set(0.9, 0, 8);
        monster.scale.set(0.35, 0.35, 0.35);

        monsterMixer = new THREE.AnimationMixer(monster);
        scene.add(monster);

        //Position this mesh at the position of the monster
        // Create a dummy mesh with a BoxGeometry
        let MonboxSize = new THREE.Vector3(0.6,0.7, 0.4); // Size of the box
        MondummyMesh = new THREE.Mesh(new THREE.BoxGeometry(MonboxSize.x, MonboxSize.y, MonboxSize.z));

        // Position this mesh at the position of the soldier.
        MondummyMesh.position.copy(new Vector3(monster.position.x, monster.position.y, monster.position.z));
        yOffset2 = 0.1;
        MondummyMesh.position.y += yOffset2;


        MonBoxHelper = new THREE.BoxHelper(MondummyMesh, 0x00ff00);

        //Plays default animation
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
                reject(error);
            });
    });
}

// Store the Monster running animation
monsterloader.load('monster models/Monster warrior/MW Running gltf/MW Running.gltf', (gltf) => {
    monsterAnimations.Running = gltf.animations[6];
});

// Store the Monster walking animation
monsterloader.load('monster models/Monster warrior/MW Walking gltf/MW Walking.gltf', (gltf) => {
    monsterAnimations.Walking = gltf.animations[1];
});

// Store the Monster smashing animation
monsterloader.load('monster models/Monster warrior/MW Smashing gltf/MW Smashing .gltf', (gltf) => {
    monsterAnimations.Smashing = gltf.animations[2];
});



//Hidden monster & dragon variables for dragon logic and dragon load:
const monsterloader2 = new GLTFLoader();
let monster2;
let monsterMixer2;

let flymonster;
let flymonsterMixer;
const flymonsterAnimations = {};
const flymonsterloader = new GLTFLoader();

let MondummyMesh2, MonBoxHelper2, yOffset3, flyMondummyMesh, yOffset4;

async function loadFlyingMonster() {
    return Promise.all([ // This Promise.all will allow both loaders to run in parallel.
        new Promise((resolve, reject) => {
            //hidden monster:
            monsterloader2.load('monster models/Monster warrior/MW Idle/MW Idle.gltf', (gltf) => {
                monster2 = gltf.scene;
                monster2.position.set(12.3, 0, 23.3);
                monster2.scale.set(0.35, 0.35, 0.35);
                monsterMixer2 = new THREE.AnimationMixer(monster);
                scene.add(monster2);
                monster2.visible = false;

                let MonboxSize2 = new THREE.Vector3(0.6,0.7, 0.4);
                MondummyMesh2 = new THREE.Mesh(new THREE.BoxGeometry(MonboxSize2.x, MonboxSize2.y, MonboxSize2.z));
                MondummyMesh2.position.copy(new THREE.Vector3(monster2.position.x, monster2.position.y, monster2.position.z));
                yOffset3 = 0.3;
                MondummyMesh2.position.y += yOffset3;
                MonBoxHelper2 = new THREE.BoxHelper(MondummyMesh2, 0x00ff00);

                // Adjust the hidden monster's y position based on bounding box
                const box2 = new THREE.Box3().setFromObject(monster2);
                monster2.position.y = box2.min.y;

                resolve(); // Resolve this promise after loading is complete.
            }, undefined, (error) => {
                console.error(error);
                reject(error);
            });
        }),

        //Dragon load:
        new Promise((resolve, reject) => {
            flymonsterloader.load('flying monster/fire breather 3.glb', (gltf) => {
                flymonster = gltf.scene;
                flymonster.position.set(12.3, -0.3, 23.3);
                flymonster.scale.set(0.18, 0.18, 0.18);

                flymonsterMixer = new THREE.AnimationMixer(flymonster);
                scene.add(flymonster);

                gltf.animations.forEach((clip) => {
                    flymonsterAnimations[clip.name] = clip;
                });

                gltf.animations.forEach((clip) => {
                    console.log("all animation names:", clip.name)
                });

                let flyMonboxSize = new THREE.Vector3(1,1, 0.9);
                flyMondummyMesh = new THREE.Mesh(new THREE.BoxGeometry(flyMonboxSize.x, flyMonboxSize.y, flyMonboxSize.z));
                flyMondummyMesh.position.copy(new THREE.Vector3(flymonster.position.x, flymonster.position.y, flymonster.position.z));
                yOffset4 = 1;
                flyMondummyMesh.position.y += yOffset4;

                //play dragon animations:
                let action1 = flymonsterMixer.clipAction(flymonsterAnimations["Take 001"]);
                action1.loop = THREE.LoopRepeat;
                let action2 = flymonsterMixer.clipAction(flymonsterAnimations["Sketchfab_modelAction.002"]);
                action2.loop = THREE.LoopRepeat;
                let action3 = flymonsterMixer.clipAction(flymonsterAnimations["Default Take"]);
                action3.loop = THREE.LoopRepeat;

                action1.play();
                action2.play();
                action3.play();

                // Adjust the dragon's y position based on bounding box
                const box = new THREE.Box3().setFromObject(flymonster);
                flymonster.position.y = -0.4 - box.min.y;

                resolve(); // Resolve this promise after loading is complete.
            }, undefined, (error) => {
                console.error(error);
                reject(error);
            });
        })
    ]);
}



//monster movement logic using navmesh

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

gltf.scene.traverse(node =>{
         if(!navmesh && node.isObject3D && node.children && node.children.length > 0){
             navmesh = node.children[0];
             pathfinding.setZoneData(ZONE, Pathfinding.createZone(navmesh.geometry));
         }
     })
 })


let dummyBox = new THREE.Box3();
let MonBox = new THREE.Box3();

// Variables to hold the last known position and the time it was recorded.
let lastKnownPosition = null;
let lastPositionUpdateTimestamp = null;
const thresholdDistance = 0.3;  // Small threshold to detect effective static bug (for monster stutter)


function findPath() {

    if (pursuing) {

        // If lastKnownPosition is null, initialize it
        if (!lastKnownPosition) {
            lastKnownPosition = monster.position.clone();
            lastPositionUpdateTimestamp = Date.now();
        }

        // Calculate the elapsed time since the last position check
        let elapsedTime = (Date.now() - lastPositionUpdateTimestamp) / 1000;

        // Calculate the distance moved by the monster
        let distanceMoved = monster.position.clone().sub(lastKnownPosition).length();

        // If the monster has effectively not moved much for more than 2 seconds, adjust its position
        if (elapsedTime > 2 && distanceMoved < thresholdDistance) {
            if (navpath && navpath[1]) {
                monster.position.set(navpath[1].x - 0.65, navpath[1].y, navpath[1].z - 0.65);
            } else if (navpath && navpath[2]) {
                monster.position.set(navpath[2].x -0.65, navpath[2].y, navpath[2].z -0.65);
            }
            // Reset the last known position and timestamp
            lastKnownPosition = monster.position.clone();
            lastPositionUpdateTimestamp = Date.now();
        } else if (distanceMoved >= thresholdDistance) {
            // Update lastKnownPosition and reset the timer if the monster has moved beyond the threshold
            lastKnownPosition = monster.position.clone();
            lastPositionUpdateTimestamp = Date.now();
        }


        //sets target position and agent position:
        let target = soldier.position.clone();
        let monsterPos = monster.position.clone();

        //sets attributes of the navmesh
        groupId = pathfinding.getGroup('villaHouse', monsterPos);
        const closest = pathfinding.getClosestNode(monsterPos, 'villaHouse', groupId);
        const closest2 = pathfinding.getClosestNode(target, 'villaHouse', groupId);
        if (closest) {
            //finds path to target
            navpath = pathfinding.findPath(closest.centroid, target, "villaHouse", groupId);
            if (navpath && navpath.length > 0) {
                pathfindinghelper.reset();

                //makes the pathfinding invisible to player:
                // pathfindinghelper.setPlayerPosition(monster.position);
                // pathfindinghelper.setTargetPosition(target);
                // pathfindinghelper.setPath(navpath);

                // Target position
                let targetPos = navpath[0];

                // Compute distance to target
                const distance = targetPos.clone().sub(monster.position);

                // If the monster is close enough to the target position
                if (distance.lengthSq() < 0.2) {
                    navpath.shift(); // Go to the next waypoint
                    if (navpath.length === 0) {
                        navpath = pathfinding.findPath(closest.centroid, target, "villaHouse", groupId);
                    } // If there's no more waypoints, just return
                    targetPos = navpath[0]; // New target position
                    distance.copy(targetPos.clone().sub(monster.position)); // Update distance
                }
                // Normalize distance to get direction
                const direction = distance.normalize();
                //speed of the monster
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


//loads floating navmesh:

const skymeshLoader = new GLTFLoader();
const skypathfinding = new Pathfinding();
const skypathfindinghelper = new PathfindingHelper();
let skymeshfloor;
const SKYZONE = 'skyZone';
let skymesh;
let skygroupId;
let skynavpath;
scene.add(skypathfindinghelper);

skymeshLoader.load("flying monster/flym navmesh 7.glb", function(gltf){
skymeshfloor = gltf.scene;
skymeshfloor.position.set(0, 0, 0);
skymeshfloor.scale.set(1, 1, 1);

gltf.scene.traverse(node =>{
    if(!skymesh && node.isObject3D && node.children && node.children.length > 0){
        skymesh = node.children[0];
        skypathfinding.setZoneData(SKYZONE, Pathfinding.createZone(skymesh.geometry));
    }
})
})

//dragon movement logic(almost identical to monster movement logic):
let skyDummyBox = new THREE.Box3();
let skyMonBox = new THREE.Box3();

function flyfindPath() {

    if (pursuing) {

        let target = soldier.position.clone();
        let monsterPos = monster2.position.clone();

        skygroupId = skypathfinding.getGroup('skyZone', monsterPos);
        const closest = skypathfinding.getClosestNode(monsterPos, 'skyZone', skygroupId);

        if (closest) {
            skynavpath = skypathfinding.findPath(closest.centroid, target, 'skyZone', skygroupId);

            if (skynavpath && skynavpath.length > 0) {
                skypathfindinghelper.reset();
                // Target position
                let targetPos = skynavpath[0];
                // Compute distance to target
                const distance = targetPos.clone().sub(monster2.position);
                // If the dragon is close enough to the target position
                if (distance.lengthSq() < 0.75) {
                    skynavpath.shift(); // Go to the next waypoint
                    if (skynavpath.length === 0) {
                        skynavpath = skypathfinding.findPath(closest.centroid, target, "skyZone", skygroupId);
                    } // If there's no more waypoints, just return
                    targetPos = skynavpath[0]; // New target position
                    distance.copy(targetPos.clone().sub(monster2.position)); // Update distance
                }

                const direction = distance.normalize();
                // Dragon speed
                const speed = 0.024;

                monster2.position.add(direction.multiplyScalar(speed));
                monster2.lookAt(monster2.position.clone().add(direction));

                flymonster.position.x = monster2.position.x;
                flymonster.position.z = monster2.position.z;
                flymonster.lookAt(flymonster.position.clone().add(direction));

                // Update the bounding boxes
                skyDummyBox.setFromObject(dummyMesh);
                skyMonBox.setFromObject(MondummyMesh2);

                if (skyDummyBox.intersectsBox(skyMonBox)) {
                    pursuing = false;
                    isSlowedDown = true;

                }

            }
        }

    }
}

// Creates particle effects for health and boost
const boostParticleSystemForSoldier = createBoostEffect();
boostParticleSystemForSoldier.name = 'boostParticleSystemForSoldier';
boostParticleSystemForSoldier.position.y += 0.4;

const boostParticleSystemForCamera = boostParticleSystemForSoldier.clone();
boostParticleSystemForCamera.name = 'boostParticleSystemForCamera';
boostParticleSystemForCamera.position.y -= 0.5;

let healthModelMesh;
let healthParticleSystemForSoldier;
let healthParticleSystemForCamera;
loader.load('models/miniHealth.glb', (gltf) => {
    gltf.scene.traverse((child) => {
        if (child.isMesh && child.name === "miniHealth") {
            healthModelMesh = child;
            const scaleFactor = 0.0001;
            healthModelMesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
        }
    });

    if (healthModelMesh) {

        healthParticleSystemForSoldier = createHealthEffect(healthModelMesh);
        healthParticleSystemForSoldier.name = 'healthParticleSystemForSoldier';
        healthParticleSystemForSoldier.position.y += 0.6;

        healthParticleSystemForCamera = healthParticleSystemForSoldier.clone();
        healthParticleSystemForCamera.name = 'healthParticleSystemForCamera';
        healthParticleSystemForCamera.position.y -=1;
        healthParticleSystemForCamera.scale.set(0.8,0.8,0.8);

        console.log("Health particles created");
    } else {
        console.error("miniHealth mesh not found in the GLTF model!");
    }
});

// Variable to keep track of the active boost and health (particle) timeout

let boostTimeout = null;
let healthTimeout = null;

function checkCollisionsWithCollectibles() {

    let result;

    result = checkCollisionsWithCoins(scene, dummyMesh, coins, numCoins, coinsNeeded);
    coins = result.coins;
    numCoins = result.numCoins;

    if (result.allCoinsCollected){
        coinsCollected();
        portal.visible = true;
    }

    result = checkCollisionsWithBoosts(scene, dummyMesh, boosts, boostFactor);
    boosts = result.boosts;
    boostFactor = result.boostFactor;

    if (result.initiateBoost) {
        if (boostTimeout) {
            clearTimeout(boostTimeout);
            soldier.remove(boostParticleSystemForSoldier);
            camera.remove(boostParticleSystemForCamera);
            boostTimeout = null;
        }

        // Add the particle system when the boost is initiated
        soldier.add(boostParticleSystemForSoldier);
        camera.add(boostParticleSystemForCamera);

        boostFactor += 1;
        updateHUDSpeed(boostFactor);

        // Set a timeout to go back to initial speed
        boostTimeout = setTimeout(() => {
            boostFactor -= 1;
            updateHUDSpeed(boostFactor);
            soldier.remove(boostParticleSystemForSoldier);
            camera.remove(boostParticleSystemForCamera);
        }, 12000); // duration of the boost effect
    }

    result = checkCollisionsWithHealths(scene, dummyMesh, healths, soldierHealth);
    healths = result.healths;
    soldierHealth = result.soldierHealth;

    if (result.isHealthCollected) {
        if (healthTimeout) {
            clearTimeout(healthTimeout);
            soldier.remove(healthParticleSystemForSoldier);
            camera.remove(healthParticleSystemForCamera);
            healthTimeout = null;
        }

        // Add the health particle system when health is increased
        soldier.add(healthParticleSystemForSoldier);
        camera.add(healthParticleSystemForCamera);

        // Set a timeout to remove the particle system
        healthTimeout = setTimeout(() => {
            soldier.remove(healthParticleSystemForSoldier);
            camera.remove(healthParticleSystemForCamera);
        }, 5000);
    }
}

const clock = new THREE.Clock();
 function animate() {
     if (isGamePaused) {
         // If the game is paused, return without doing anything
         return;
     }

     requestAnimationFrame(animate);

     //Add to the invunerable counter for player damage
     if(invunerable<101)invunerable++;

     if (mixer) mixer.update(0.016);
     if (monsterMixer) monsterMixer.update(0.015);
     if (portalMixer) portalMixer.update(0.016);
     if (flymonsterMixer) flymonsterMixer.update(0.19);

     animateCollectibles(coins, boosts, healths, 0.016);

     updateMovement();


     listener.position.copy(camera.position);

     if (firstPersonView) {
         firstPersonControls.update(clock.getDelta());

         // Calculate current time and deltaTime
         const currentTime = performance.now();
         const deltaTime = (currentTime - lastTime) * 0.001; // Converts from milliseconds to seconds
         lastTime = currentTime;

         if (firstPersonView){
             if (isMoving){
                 bobbingTime += deltaTime; // Accumulate time for the sine wave function

                 bobAmount = Math.abs(Math.sin(bobbingTime * bobbingSpeed)) * bobbingIntensity; // Calculate bob offset

                 if (isRunning){
                     bobAmount /= 1.5;
                     if (isSlowedDown){
                         bobAmount *=0.3;
                     }
                 }


                 console.log(bobAmount)
             }
             else{
                 bobAmount=0;
             }
         }

         let a = soldier.position.x;
         let b = soldier.position.y+0.3+ bobAmount;
         let c = soldier.position.z;

         camera.position.set(a,b,c);
     } else {
         orbitControls.update();
         maintainDistanceFromSoldier(soldier, camera, 1); // 1 is the desired distance from the soldier

     }

     if (pursuing) {
         findPath();
         if (flymonster) {
             flyfindPath();
         }
     }

     if (firstPersonView) {
         firstPersonControls.update(clock.getDelta());

         let soldierParticleSystem = soldier.getObjectByName('healthParticleSystemForSoldier');
         let cameraParticleSystem = camera.getObjectByName('healthParticleSystemForCamera');
         if (soldierParticleSystem) soldierParticleSystem.visible = false;
         if (cameraParticleSystem) cameraParticleSystem.visible = true;

         let soldierBoostSystem = soldier.getObjectByName('boostParticleSystemForSoldier');
         let cameraBoostSystem = camera.getObjectByName('boostParticleSystemForCamera');
         if (soldierBoostSystem) soldierBoostSystem.visible = false;
         if (cameraBoostSystem) cameraBoostSystem.visible = true;
     } else {
         orbitControls.update();

         let soldierParticleSystem = soldier.getObjectByName('healthParticleSystemForSoldier');
         let cameraParticleSystem = camera.getObjectByName('healthParticleSystemForCamera');
         if (soldierParticleSystem) soldierParticleSystem.visible = true;
         if (cameraParticleSystem) cameraParticleSystem.visible = false;

         let soldierBoostSystem = soldier.getObjectByName('boostParticleSystemForSoldier');
         let cameraBoostSystem = camera.getObjectByName('boostParticleSystemForCamera');
         if (soldierBoostSystem) soldierBoostSystem.visible = true;
         if (cameraBoostSystem) cameraBoostSystem.visible = false;
     }

     if (fireModel && !firstPersonView) {
         if (fireMixer) fireMixer.update(0.01);
         fireModel.position.copy(soldier.position);
         fireModel.position.x +=0.2;
         fireModel.position.y -=0.3;

         // Rotate around y-axis
         fireModel.rotation.y = 0.5;
     } else if(fireModel){
         if (fireMixer) fireMixer.update(0.01);
         fireModel.position.copy(soldier.position);
         fireModel.position.x +=0.4;
         fireModel.position.y -=2.5;
         fireModel.scale.set(0.2,0.3,0.2);
         // Rotate around y-axis
         fireModel.rotation.y = 0.5;
     }


     // Update the particle systems:
     updateBoostSystem(boostParticleSystemForSoldier);
     updateBoostSystem(boostParticleSystemForCamera);

     updateHealthEffect(healthParticleSystemForSoldier);
     updateHealthEffect(healthParticleSystemForCamera);

     redDot.position.set(soldier.position.x+1.9, 4, soldier.position.z+1.6);
     minimapCamera.position.set(soldier.position.x+15, 30, soldier.position.z+12);
     minimapCamera.lookAt(soldier.position.x+15, 1, soldier.position.z+12);
    renderer.setViewport(0,0,window.innerWidth,window.innerHeight);
    renderer.render(scene, camera);
    renderer.clearDepth();
    renderer.setScissorTest(true);
    renderer.setScissor(window.innerWidth - minimapWidth, 0, minimapWidth, minimapHeight);
    renderer.render(scene,minimapCamera);
    renderer.setScissorTest(false);

 }
// Start animation
 animate();

