import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from "three";

//Coin
export function createCoin(x, y, z, scene, coins) {
    const iconLoader = new GLTFLoader();

    iconLoader.load('models/coin.glb', function (gltf) {
        let coin = gltf.scene;
        coin.position.set(x, y, z);
        coin.scale.set(0.02, 0.02, 0.02);
        // Enable shadows for the object
        coin.castShadow = true;

        // Receive shadows on the object (if applicable)
        coin.receiveShadow = true;
        scene.add(coin);

        // Create a dummy mesh for the coin's BoxHelper
        let iconBoxSize = new THREE.Vector3(0.2, 0.2, 0.2);
        let coinDummyMesh = new THREE.Mesh(new THREE.BoxGeometry(iconBoxSize.x, iconBoxSize.y, iconBoxSize.z));
        coinDummyMesh.castShadow = true;
        coinDummyMesh.receiveShadow = true;

        // Position this mesh at the position of the coin
        coinDummyMesh.position.copy(coin.position);
        let coinYOffset = 0;

        coinDummyMesh.position.y += coinYOffset;

        // Create a BoxHelper using this dummy mesh
        let coinBoxHelper = new THREE.BoxHelper(coinDummyMesh, 0x00ff00);

        // Add the BoxHelper to the scene
        //scene.add(coinBoxHelper);

        if (gltf.animations && gltf.animations.length) {
            const mixer = new THREE.AnimationMixer(coin);
            const action = mixer.clipAction(gltf.animations[0]); // Assuming you want the first animation
            action.play();

            coins.push({
                mesh: coin,
                dummyMesh: coinDummyMesh,
                boxHelper: coinBoxHelper,
                collected: false,
                mixer:mixer,
            });
        }
    }, undefined, function (error) {
        console.error(error);
    });
}

// Boost
export function createBoost(x, y, z, scene, boosts) {
    const iconLoader = new GLTFLoader();

    iconLoader.load('models/speed.glb', function (gltf) {
        let boost = gltf.scene;
        boost.position.set(x, y, z);
        boost.scale.set(0.02, 0.02, 0.02);  // Adjust scale if needed
        boost.castShadow = true;

        // Receive shadows on the object (if applicable)
        boost.receiveShadow = true;
        scene.add(boost);

        let iconBoxSize = new THREE.Vector3(0.2, 0.2, 0.2);
        let boostDummyMesh = new THREE.Mesh(new THREE.BoxGeometry(iconBoxSize.x, iconBoxSize.y, iconBoxSize.z));
        boostDummyMesh.position.copy(boost.position);
        let boostYOffset = 0;

        boostDummyMesh.position.y += boostYOffset;

        let boostBoxHelper = new THREE.BoxHelper(boostDummyMesh, 0x00ff00);
        //scene.add(boostBoxHelper);
        if (gltf.animations && gltf.animations.length) {
            const mixer = new THREE.AnimationMixer(boost);
            const action = mixer.clipAction(gltf.animations[1]); // Assuming you want the first animation
            action.play();

            boosts.push({
                mesh: boost,
                dummyMesh: boostDummyMesh,
                boxHelper: boostBoxHelper,
                collected: false,
                mixer: mixer
            });
        }
    }, undefined, function (error) {
        console.error(error);
    });
}

// Health
export function createHealth(x, y, z, scene, healths) {
    const iconLoader = new GLTFLoader();

    iconLoader.load('models/health.glb', function (gltf) {
        let health = gltf.scene;
        health.position.set(x, y, z);
        health.scale.set(0.02, 0.02, 0.02);  // Adjust scale if needed
        health.castShadow = true;

        // Receive shadows on the object (if applicable)
        health.receiveShadow = true;
        scene.add(health);

        let iconBoxSize = new THREE.Vector3(0.2, 0.2, 0.2);
        let healthDummyMesh = new THREE.Mesh(new THREE.BoxGeometry(iconBoxSize.x, iconBoxSize.y, iconBoxSize.z));
        healthDummyMesh.position.copy(health.position);
        let healthYOffset = 0;

        healthDummyMesh.position.y += healthYOffset;

        let healthBoxHelper = new THREE.BoxHelper(healthDummyMesh, 0x00ff00);
        //scene.add(healthBoxHelper);

        if (gltf.animations && gltf.animations.length) {
            const mixer = new THREE.AnimationMixer(health);
            const action = mixer.clipAction(gltf.animations[0]); // Assuming you want the first animation
            action.play();

            healths.push({
                mesh: health,
                dummyMesh: healthDummyMesh,
                boxHelper: healthBoxHelper,
                collected: false,
                mixer: mixer
            });
        }
    }, undefined, function (error) {
        console.error(error);
    });
}

