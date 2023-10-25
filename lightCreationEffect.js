import * as THREE from 'three';
function createDirectionalLight(color, intensity) {
    const directionalLight = new THREE.DirectionalLight(color, intensity);
    directionalLight.castShadow = true; 
    directionalLight.castShadow = true;

    // Set the shadow camera parameters to control the light's radius
    directionalLight.shadow.camera.left = -shadowCameraSize;
    directionalLight.shadow.camera.right = shadowCameraSize;
    directionalLight.shadow.camera.top = shadowCameraSize;
    directionalLight.shadow.camera.bottom = -shadowCameraSize;
    directionalLight.shadow.camera.near = 0.5; // Adjust this 
    directionalLight.shadow.camera.far = 2; // Adjust this 

    
    

    return directionalLight;
}


// ability lighting 
// Define the lights as global variables
export let healthLight = createDirectionalLight('green', 1);
export let boostLight = createDirectionalLight('yellow', 1);

// Function to enable/disable the lights
export function enableHealthLight() {
    healthLight.visible = true;
    // Set the position of the light above the model
    healthLight.position.set(0, 2, 0); // Adjust the Y coordinate as needed
}
export function disableHealthLight() {
    healthLight.visible = false;
}
export function enableBoostLight() {
    boostLight.visible = true;
    // Set the position of the light above the model
    boostLight.position.set(0, 2, 0); // Adjust the Y coordinate as needed
}

export function disableBoostLight() {
    boostLight.visible = false;
}
