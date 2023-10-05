import * as THREE from "three";

// Function to initialize raycasters and related variables
export function initializeRays() {
    // Add these variables at the beginning of your code
    const raycaster = new THREE.Raycaster(undefined, undefined, 0, undefined);
    const raycastDirection = new THREE.Vector3(); // The direction of the ray

    const rayLineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 }); // Red color for the ray line
    const rayLineGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -10)]); // Set the initial points of the ray line
    const rayLine = new THREE.Line(rayLineGeometry, rayLineMaterial);
    //scene.add(rayLine);

    // Define material and geometry for the sphere
    const sphereGeometry = new THREE.SphereGeometry(0.1, 32, 32);
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    //scene.add(sphere);

    // Add these variables at the beginning of your code
    const downRaycaster = new THREE.Raycaster(undefined, undefined, 0, undefined);
    const downRayDirection = new THREE.Vector3(0, -1, 0); // Pointing straight down

    // Visualization for the downward ray
    const downRayLineGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, -10, 0)]);
    const downRayLine = new THREE.Line(downRayLineGeometry, rayLineMaterial); // Reuse the red material
    //scene.add(downRayLine);

    const downSphere = new THREE.Mesh(sphereGeometry, sphereMaterial); // Reuse the red material
    //scene.add(downSphere);

    const middleRaycaster = new THREE.Raycaster(undefined, undefined, 0, undefined);
    const middleRaycastDirection = new THREE.Vector3(); // The direction of the ray

    // ... (Other ray-related variables)

    return {
        raycaster,
        raycastDirection,
        rayLine,
        sphere,
        downRaycaster,
        downRayDirection,
        downRayLine,
        downSphere,
        middleRaycaster,
        middleRaycastDirection,
        // ... (Other ray-related variables)
    };
}
