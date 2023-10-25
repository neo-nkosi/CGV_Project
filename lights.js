import * as THREE from 'three';

// Define and configure the lights
const createLights = (scene) => {
  // Ambient light
  const light = new THREE.AmbientLight(0xffffff, 0.3);
  light.translateY(10);
  scene.add(light);

  // Directional light 1 (purple light)
  const directionalLight1 = new THREE.DirectionalLight("purple", 0.2);
  directionalLight1.position.set(100, 15, 40);
  // Configure other directional light properties here
  scene.add(directionalLight1);

  // Directional light 2 (blue light)
  const directionalLight2 = new THREE.DirectionalLight("blue", 0.2);
  directionalLight2.position.set(-100, 10, 40);
  // Configure other directional light properties here
  scene.add(directionalLight2);

    // Create a target point on the ground
    const targetPosition = new THREE.Vector3(0, 0, 0);

    // Point light on staircase
    const pointLightstairs = new THREE.SpotLight("red", 1, 2, Math.PI / 2);
    pointLightstairs.position.set(0.1, 0.7, 0.06);
    pointLightstairs.target.position.copy(targetPosition); // Set the light's target
    scene.add(pointLightstairs);
    scene.add(pointLightstairs.target); // Add the target object to the scene

    // Point light on wall by staircase
    const pointLightstairs2 = new THREE.SpotLight("red", 1, 2, Math.PI / 2);
    pointLightstairs2.position.set(-1.8, 0.5, -0.06);
    pointLightstairs2.target.position.copy(targetPosition); // Set the light's target
    scene.add(pointLightstairs2);
    scene.add(pointLightstairs2.target); // Add the target object to the scene
    // Point light on wall by staircase
    const pointLightstairs3 = new THREE.SpotLight("red", 1, 2, Math.PI / 2);
    pointLightstairs3.position.set(-2.4, 0.5, -3.01);
    pointLightstairs3.target.position.copy(targetPosition); // Set the light's target
    scene.add(pointLightstairs3);
    scene.add(pointLightstairs3.target); // Add the target object to the scene
    // Point light on wall by staircase
    const pointLightstairs4 = new THREE.SpotLight("red", 1, 2, Math.PI / 2);
    pointLightstairs4.position.set(-2.7, 0.7, 0.62);
    pointLightstairs4.target.position.copy(targetPosition); // Set the light's target
    scene.add(pointLightstairs4);
    scene.add(pointLightstairs4.target); // Add the target object to the scene

    // Point light on wall by staircase
    const pointLightstairs5 = new THREE.SpotLight("red", 1, 2, Math.PI / 2);
    pointLightstairs5.position.set(-5.4, 0.7, 1.18);
    pointLightstairs5.target.position.copy(targetPosition); // Set the light's target
    scene.add(pointLightstairs5);
    scene.add(pointLightstairs5.target); // Add the target object to the scene

    // Point light on wall by staircase
    const pointLightstairs6 = new THREE.SpotLight("red", 1, 2, Math.PI / 2);
    pointLightstairs6.position.set(-4.73, 0.6, -1.93);
    pointLightstairs6.target.position.copy(targetPosition); // Set the light's target
    scene.add(pointLightstairs6);
    scene.add(pointLightstairs6.target); // Add the target object to the scene

     // Point light on wall by staircase
     const pointLightstairs7 = new THREE.SpotLight("red", 1, 2, Math.PI / 2);
     pointLightstairs7.position.set(-3.1, 0.6, -4.08);
     pointLightstairs7.target.position.copy(targetPosition); // Set the light's target
     scene.add(pointLightstairs7);
     scene.add(pointLightstairs7.target);

      // Point light on wall by staircase
      const pointLightstairs8 = new THREE.SpotLight("red", 1, 2, Math.PI / 4);
      pointLightstairs8.position.set(-6.25, 0.6, -0.10);
      pointLightstairs8.target.position.copy(targetPosition); // Set the light's target
      scene.add(pointLightstairs8);
      scene.add(pointLightstairs8.target);

      // Point light on wall by staircase
      const pointLightstairs9 = new THREE.SpotLight("red", 1, 2, Math.PI / 4);
      pointLightstairs9.position.set(-8.4, 0.6, -1.11);
      pointLightstairs9.target.position.copy(targetPosition); // Set the light's target
      scene.add(pointLightstairs9);
      scene.add(pointLightstairs9.target);

      // Point light on wall by staircase
      const pointLightstairs1 = new THREE.SpotLight("red", 1, 2, Math.PI / 4);
      pointLightstairs1.position.set(-5.43, 0.6, -4.5);
      pointLightstairs1.target.position.copy(targetPosition); // Set the light's target
      scene.add(pointLightstairs1);
      scene.add(pointLightstairs1.target);
};


export { createLights };
