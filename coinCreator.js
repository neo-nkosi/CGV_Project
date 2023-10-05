import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from "three";

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

        coins.push({
            mesh: coin,
            dummyMesh: coinDummyMesh,
            boxHelper: coinBoxHelper,
            collected: false
        });
    }, undefined, function (error) {
        console.error(error);
    });
}
