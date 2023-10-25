import * as THREE from 'three';
function createDirectionalLight(color, intensity) {
    const directionalLight = new THREE.DirectionalLight(color, intensity);
    directionalLight.castShadow = true; // Enable shadow casting if needed

    // You can adjust the light's position as needed based on your scene setup
    // directionalLight.position.set(x, y, z);

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
