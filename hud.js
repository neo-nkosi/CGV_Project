import * as THREE from 'three';

let coinScreen, speedScreen, hpScreen, coinURLs, speedURLs, hpURLs, minimapScreen;
export function createHUD(camera,numCoins,numSpeed,currentHPlevel){
    const HUD = new THREE.Scene();

    //===========================================Coins==========================================================


    //Create an var for the coin collected
    coinURLs = ["icons/coins/Coin0.png",
                     "icons/coins/Coin1.png",
                     "icons/coins/Coin2.png",
                     "icons/coins/Coin3.png",];

    //Create a texture from the image
    const coinTexture = new THREE.TextureLoader().load(coinURLs[numCoins]);
    coinTexture.encoding = THREE.sRGBEncoding;

    //Create a plane geometry for the image screen
    const coinPlaneGeometry = new THREE.PlaneGeometry(2,1.5);
    const coinPlaneMaterial = new THREE.MeshBasicMaterial({map: coinTexture, transparent: true});
    coinScreen = new THREE.Mesh(coinPlaneGeometry, coinPlaneMaterial);
    coinScreen.renderOrder = 999;
    coinScreen.material.depthTest = false;
    coinScreen.material.depthWrite = false;
    coinScreen.scale.set(0.07,0.07,1);
    coinScreen.geometry.computeBoundingBox();
    
    updateCoinScreenPosition();
    HUD.add(coinScreen);

    function updateCoinScreenPosition(){
        const box = new THREE.Box3();
        box.copy(coinScreen.geometry.boundingBox).applyMatrix4(coinScreen.matrixWorld);
        let measure = new THREE.Vector3();
        box.getSize(measure);
    
        const vFOV = THREE.MathUtils.degToRad(camera.fov);
        const height = 2 * Math.tan(vFOV/2);
        const width = height * camera.aspect;
    
        //Set the position of the video screen to the bottom left corner
        
        coinScreen.position.x = (-width / 2)+0.2;
        coinScreen.position.y = (height/ 2)-0.1;
        coinScreen.position.z = -1;      
    }

    window.addEventListener('resize', updateCoinScreenPosition);

    //===========================================Speed Boost====================================================

    //Create an var for the coin collected
    speedURLs = ["icons/speed_boost/Speed0.png",
                      "icons/speed_boost/Speed1.png",
                      "icons/speed_boost/Speed2.png",
                      "icons/speed_boost/Speed3.png",];

    //Create a texture from the image
    const speedTexture = new THREE.TextureLoader().load(speedURLs[numSpeed-1]);
    speedTexture.encoding = THREE.sRGBEncoding;

    //Create a plane geometry for the image screen
    const speedPlaneGeometry = new THREE.PlaneGeometry(2,1.5);
    const speedPlaneMaterial = new THREE.MeshBasicMaterial({map: speedTexture, transparent: true});
    speedScreen = new THREE.Mesh(speedPlaneGeometry, speedPlaneMaterial);
    speedScreen.renderOrder = 999;
    speedScreen.material.depthTest = false;
    speedScreen.material.depthWrite = false;
    speedScreen.scale.set(0.07,0.06,1);
    speedScreen.geometry.computeBoundingBox();
    
    updateSpeedScreenPosition();
    HUD.add(speedScreen);

    function updateSpeedScreenPosition(){
        const box = new THREE.Box3();
        box.copy(speedScreen.geometry.boundingBox).applyMatrix4(speedScreen.matrixWorld);
        let measure = new THREE.Vector3();
        box.getSize(measure);
    
        const vFOV = THREE.MathUtils.degToRad(camera.fov);
        const height = 2 * Math.tan(vFOV/2);
        const width = height * camera.aspect;
    
        //Set the position of the video screen to the bottom left corner
        
        speedScreen.position.x = (width / 2)-0.2;
        speedScreen.position.y = (height/ 2)-0.1;
        speedScreen.position.z = -1;        
    }

    window.addEventListener('resize', updateSpeedScreenPosition);

    //===========================================HP BAR=========================================================
    //Create an array of image URLs
    hpURLs = ["icons/hp_bar/HP0.png",
                    "icons/hp_bar/HP1.png",
                    "icons/hp_bar/HP2.png",
                    "icons/hp_bar/HP3.png",
                    "icons/hp_bar/HP4.png",
                    "icons/hp_bar/HP5.png",
                    "icons/hp_bar/HP6.png",
                    "icons/hp_bar/HP7.png",
                    "icons/hp_bar/HP8.png",
                    "icons/hp_bar/HP9.png",
                    "icons/hp_bar/HP10.png"];

    //Create a texture from the first image
    const hpTexture = new THREE.TextureLoader().load(hpURLs[currentHPlevel]);
    hpTexture.encoding = THREE.sRGBEncoding;

    //Create a plane geometry for the image screen
    const hpPlaneGeometry = new THREE.PlaneGeometry(2,1.5);
    const hpPlaneMaterial = new THREE.MeshBasicMaterial({map: hpTexture, transparent: true});
    hpScreen = new THREE.Mesh(hpPlaneGeometry, hpPlaneMaterial);
    hpScreen.renderOrder = 999;
    hpScreen.material.depthTest = false;
    hpScreen.material.depthWrite = false;
    hpScreen.scale.set(0.35,0.18,1);
    hpScreen.geometry.computeBoundingBox();
    
    updateHPScreenPosition();
    HUD.add(hpScreen);

    function updateHPScreenPosition(){
        const box = new THREE.Box3();
        box.copy(hpScreen.geometry.boundingBox).applyMatrix4(hpScreen.matrixWorld);
        let measure = new THREE.Vector3();
        box.getSize(measure);
    
        const vFOV = THREE.MathUtils.degToRad(camera.fov);
        const height = 2 * Math.tan(vFOV/2);
        const width = height * camera.aspect;
    
        //Set the position of the video screen to the bottom left corner
        
        hpScreen.position.x = (-width / 2)+0.42;
        hpScreen.position.y = (-height/ 2)+0.18;
        hpScreen.position.z = -1;       
    }

    //Listen for window resize events and update the video screen position
    window.addEventListener('resize', updateHPScreenPosition);
    //=======================================================================================================================================
    createMinimap(camera, HUD);
    camera.add(HUD);
}

export function updateHUDHP(currentHPlevel){
    const hpTexture = new THREE.TextureLoader().load(hpURLs[currentHPlevel]);
    hpTexture.encoding = THREE.sRGBEncoding;
    
    hpScreen.material.map = hpTexture;
    
    hpScreen.material.needsUpdate = true;
}

export function updateHUDCoin(numCoins){
    const coinTexture = new THREE.TextureLoader().load(coinURLs[numCoins]);
    coinTexture.encoding = THREE.sRGBEncoding;

    coinScreen.material.map = coinTexture;

    coinScreen.material.needsUpdate = true;
}

export function updateHUDSpeed(numSpeed){
    const speedTexture = new THREE.TextureLoader().load(speedURLs[numSpeed-1]);
    speedTexture.encoding = THREE.sRGBEncoding;

    speedScreen.material.map = speedTexture;

    speedScreen.material.needsUpdate = true;
}

export function createMinimap(camera, scene) {
    const minimapURL = "icons/minimap/mapv2.png"; // Replace with the actual path to your minimap image

    const minimapTexture = new THREE.TextureLoader().load(minimapURL);
    minimapTexture.encoding = THREE.sRGBEncoding;

    const minimapPlaneGeometry = new THREE.PlaneGeometry(2, 1.5);
    const minimapPlaneMaterial = new THREE.MeshBasicMaterial({ map: minimapTexture, transparent: true });
    minimapScreen = new THREE.Mesh(minimapPlaneGeometry, minimapPlaneMaterial);
    minimapScreen.renderOrder = 999;
    minimapScreen.material.depthTest = false;
    minimapScreen.material.depthWrite = false;
    minimapScreen.scale.set(0.35, 0.18, 1);

    scene.add(minimapScreen);

    // Ensure the minimapScreen has loaded its geometry and bounding box
    minimapScreen.geometry.computeBoundingBox();

    updateMinimapPosition();

    function updateMinimapPosition() {
        if (minimapScreen.geometry) {
            const box = new THREE.Box3();
            box.copy(minimapScreen.geometry.boundingBox).applyMatrix4(minimapScreen.matrixWorld);
            let measure = new THREE.Vector3();
            box.getSize(measure);

            const vFOV = THREE.MathUtils.degToRad(camera.fov);
            const height = 2 * Math.tan(vFOV / 2);
            const width = height * camera.aspect;

            minimapScreen.position.x = (width / 2) - 0.42;
            minimapScreen.position.y = (-height / 2) + 0.18;
            minimapScreen.position.z = -1;
        }
    }

    window.addEventListener('resize', updateMinimapPosition);
}
