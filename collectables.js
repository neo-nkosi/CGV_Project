import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from "three";
import {updateHUDCoin, updateHUDHP, updateHUDSpeed} from "./hud";

//Coin
export function createCoin(x, y, z, scene, coins) {
    const iconLoader = new GLTFLoader();

    iconLoader.load('models/coin.glb', function (gltf) {
        let coin = gltf.scene;
        coin.position.set(x, y, z);
        coin.scale.set(0.02, 0.02, 0.02);
        scene.add(coin);

        // Create a dummy mesh for the coin's BoxHelper
        let iconBoxSize = new THREE.Vector3(0.2, 0.2, 0.2);
        let coinDummyMesh = new THREE.Mesh(new THREE.BoxGeometry(iconBoxSize.x, iconBoxSize.y, iconBoxSize.z));

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

export function checkCollisionsWithCoins(scene, dummyMesh, coins, numCoins, coinsNeeded) {
    var allCoinsCollected = false;
    const soldierBoundingBox = new THREE.Box3().setFromObject(dummyMesh);

    // Check collision with coins
    for (let i = coins.length - 1; i >= 0; i--) {
        let coin = coins[i];
        const coinBoundingBox = new THREE.Box3().setFromObject(coin.dummyMesh);
        if (soldierBoundingBox.intersectsBox(coinBoundingBox) && !coin.collected) {
            console.log("Collision between character and coin");
            numCoins+=1;
            coin.mesh.visible = false;
            coin.collected = true;
            updateHUDCoin(numCoins);

            disposeCollectible(coin, scene);

            // Remove the coin from the array since it's collected
            coins.splice(i, 1); // remove the coin from the array

            // Load the portal if all level coins have been collected
            if (numCoins === coinsNeeded) {
                allCoinsCollected = true;
            }
        }
    }
    return {
        coins,
        numCoins: numCoins,
        allCoinsCollected
    };
}

export function checkCollisionsWithBoosts(scene, dummyMesh, boosts, boostFactor) {
    const soldierBoundingBox = new THREE.Box3().setFromObject(dummyMesh);
    let newBoostFactor = boostFactor;
    let initiateBoost = false;

    // Check collision with boosts
    for (let i = boosts.length - 1; i >= 0; i--) {
        let boost = boosts[i];
        const boostBoundingBox = new THREE.Box3().setFromObject(boost.dummyMesh);
        if (soldierBoundingBox.intersectsBox(boostBoundingBox) && !boost.collected) {
            console.log("Collision between character and boost");
            initiateBoost = true;

            boost.mesh.visible = false;
            boost.collected = true;

            // Clean up and memory management
            disposeCollectible(boost, scene);

            // Remove the boost from the array
            boosts.splice(i, 1);
        }
    }

    return {
        boosts,
        boostFactor: newBoostFactor,
        initiateBoost
    };
}

export function checkCollisionsWithHealths(scene, dummyMesh, healths, soldierHealth, blindnessOverlay) {
    const soldierBoundingBox = new THREE.Box3().setFromObject(dummyMesh);

    // Check collision with healths
    for (let i = healths.length - 1; i >= 0; i--) {
        let health = healths[i];
        const healthBoundingBox = new THREE.Box3().setFromObject(health.dummyMesh);
        if (soldierBoundingBox.intersectsBox(healthBoundingBox) && !health.collected) {
            console.log("Collision between character and health");
            soldierHealth += 1; // Adjust effect as needed
            health.mesh.visible = false;
            health.collected = true;
            blindnessOverlay.style.opacity=-0.0889*(soldierHealth)+0.8889; // Update blindness overlay
            updateHUDHP(soldierHealth);

            // Clean up and memory management
            disposeCollectible(health, scene);

            // Remove the health from the array
            healths.splice(i, 1);
        }
    }

    return {
        healths,
        soldierHealth
    };
}

// Helper function to dispose of geometry, material, and remove from scene
function disposeCollectible(collectible, scene) {
    scene.remove(collectible.mesh);
    if (collectible.mixer) {
        collectible.mixer.stopAllAction();
        collectible.mixer.uncacheRoot(collectible.mixer.getRoot());
    }
    if (collectible.dummyMesh) {
        collectible.dummyMesh.geometry.dispose();
        collectible.dummyMesh.material.dispose();
        scene.remove(collectible.dummyMesh);
    }
    if (collectible.mesh.geometry) {
        collectible.mesh.geometry.dispose();
    }
    if (collectible.mesh.material) {
        collectible.mesh.material.dispose();
    }
}

export function animateCollectibles(coins, boosts, healths, updateSpeed) {
    for (const coin of coins) {
        if (coin.mixer) {
            coin.mixer.update(updateSpeed);
        }
    }

    for (const boost of boosts) {
        if (boost.mixer) {
            boost.mixer.update(updateSpeed);
        }
    }

    for (const health of healths) {
        if (health.mixer) {
            health.mixer.update(updateSpeed);
        }
    }
}



