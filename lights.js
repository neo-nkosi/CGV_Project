import * as THREE from 'three';

// Define and configure the lights
const createLights = (scene) => {
  // Ambient light
  const light = new THREE.AmbientLight(0xffffff, 0.1);
  light.translateY(10);
  scene.add(light);

  // Directional light 1 (purple light)
  const directionalLight1 = new THREE.DirectionalLight("purple", 0.2);
  directionalLight1.position.set(100, 15, 40);
  // Configure other directional light properties here
  scene.add(directionalLight1);

  // Directional light 2 (blue light)
  const directionalLight2 = new THREE.DirectionalLight("blue", 0.2);
  directionalLight2.position.set(-100, 10, 400);
  // Configure other directional light properties here
  scene.add(directionalLight2);

    // Create a target point on the ground
    const targetPosition = new THREE.Vector3(0, 0, 0);

  // candle1
  const candle1 = new THREE.PointLight(0xffe600, 0.1, 10);
  candle1.position.set(8.21,0.45, -1.42);
  scene.add(candle1);
   
   
 // candle1
 const candle2 = new THREE.PointLight(0xffe600, 0.1, 10);
 candle2.position.set(8.28,0.45, -0.79);
 scene.add(candle2);
  
  

  // Point light on staircase
  const specialpointLightstairs = new THREE.SpotLight("white", 2, 5, Math.PI/2);
  specialpointLightstairs.position.set(-0.25, 1.7, -2.0);
  specialpointLightstairs.target.position.set(-2.07, -0.19, -2.63); 
  scene.add(specialpointLightstairs);
  scene.add(specialpointLightstairs.target); 

  // Point light on staircase
  const pointLightstairs = new THREE.SpotLight("red", 1, 1.5, Math.PI / 2);
  pointLightstairs.position.set(0.1, 0.7, 0.06);
  pointLightstairs.target.position.set(0.1, 0.0, 0.06); 
  scene.add(pointLightstairs);
  scene.add(pointLightstairs.target); 

  // Point light on wall by wall1 by stairs
  const pointLightstairs2 = new THREE.SpotLight("red", 1, 1.5, Math.PI / 2);
  pointLightstairs2.position.set(-1.8, 0.5, -0.06);
  pointLightstairs2.target.position.set(-1.8, 0.0, -0.06); 
  scene.add(pointLightstairs2);
  scene.add(pointLightstairs2.target); 
  // Point light on wall by wall2 by stairs
  const pointLightstairs3 = new THREE.SpotLight("red", 1, 1.5, Math.PI / 2);
  pointLightstairs3.position.set(-2.4, 0.5, -3.01);
  pointLightstairs3.target.position.set(-2.4, 0.0, -3.01); 
  scene.add(pointLightstairs3);
  scene.add(pointLightstairs3.target); 
  // Point light on wall by inner wall 1 left
  const pointLightstairs4 = new THREE.SpotLight("red", 1, 1.5, Math.PI / 2);
  pointLightstairs4.position.set(-2.7, 0.7, 0.62);
  pointLightstairs4.target.position.set(-2.7, 0.0, 0.62); 
  scene.add(pointLightstairs4);
  scene.add(pointLightstairs4.target); 

  // Point light on wall by inner wall 1 right
  const pointLightstairs5 = new THREE.SpotLight("red", 1, 1.5, Math.PI / 2);
  pointLightstairs5.position.set(-5.4, 0.7, 1.18);
  pointLightstairs5.target.position.set(-5.4, 0.0, 1.18); 
  scene.add(pointLightstairs5);
  scene.add(pointLightstairs5.target); 

  // Point light on wall by inner doorway
  const pointLightstairs6 = new THREE.SpotLight("red", 1, 1.5, Math.PI / 2);
  pointLightstairs6.position.set(-4.73, 0.6, -1.93);
  pointLightstairs6.target.position.set(-4.73, 0.0, -1.93); 
  scene.add(pointLightstairs6);
  scene.add(pointLightstairs6.target); 

  // Point light on wall by doorway right
  const pointLightstairs7 = new THREE.SpotLight("red", 1, 1.5, Math.PI / 2);
  pointLightstairs7.position.set(-3.1, 0.6, -4.08);
  pointLightstairs7.target.position.set(-3.1, 0.0, -4.08); 
  scene.add(pointLightstairs7);
  scene.add(pointLightstairs7.target);

  // Point light on wall by wall 3 adjacent
  const pointLightstairs8 = new THREE.SpotLight("red", 1, 1.5, Math.PI / 4);
  pointLightstairs8.position.set(-6.25, 0.6, -0.10);
  pointLightstairs8.target.position.set(-6.25, 0.0, 0.10); 
  scene.add(pointLightstairs8);
  scene.add(pointLightstairs8.target);

  // Point light on wall by back of wall 3
  const pointLightstairs9 = new THREE.SpotLight("red", 1, 1.5, Math.PI / 4);
  pointLightstairs9.position.set(-8.4, 0.6, -1.11);
  pointLightstairs9.target.position.set(-8.4, 0.0, -1.11); 
  scene.add(pointLightstairs9);
  scene.add(pointLightstairs9.target);

  // Point light on wall by fountain wall
  const pointLightstairs1 = new THREE.SpotLight("red", 1, 1.5, Math.PI / 4);
  pointLightstairs1.position.set(-5.43, 0.6, -4.5);
  pointLightstairs1.target.position.set(-5.43, 0.0, -4.5); 
  scene.add(pointLightstairs1);
  scene.add(pointLightstairs1.target);
};


export { createLights };
