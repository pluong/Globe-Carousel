import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as content from '../data.json';

function main() {
    console.log('content is', content);
    let contentJson = content.default;
    console.log('json is ', contentJson);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 500);

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    // document.body.appendChild(renderer.domElement);
    document.querySelector('#container').appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    // controls.target.set(0, 5, 0);
    controls.update();


    const width = 1;  // ui: width
    const height = 1;  // ui: height



    const loader = new THREE.TextureLoader();

    let planeArr = [];

    if (contentJson && contentJson.length > 0) {
        let separatorAngle = (2 * Math.PI) / contentJson.length;
        let indx = 0;
        const yAxis = new THREE.Vector3(0, 1, 0);

        for (let slide of contentJson) {
            const geometry = new THREE.PlaneGeometry(width, height);
            // geometry.applyMatrix4(new THREE.Matrix4().makeRotationY(separatorAngle * indx))
            const geometry2 = new THREE.PlaneGeometry(width, height);
            // geometry2.applyMatrix4(new THREE.Matrix4().makeRotationY(separatorAngle * indx + Math.PI));
            geometry2.applyMatrix4(new THREE.Matrix4().makeRotationY( Math.PI));

            const material = new THREE.MeshBasicMaterial({
                map: loader.load(slide?.image),
            });

            const plane = new THREE.Mesh(geometry, material);
            plane.position.z = 2;
            plane.position.applyAxisAngle(yAxis, separatorAngle * indx);
            plane.userData = { url: slide?.url , yRotation: separatorAngle * indx};
            plane.layers.enable(1);
            planeArr.push(plane);

            const plane2 = new THREE.Mesh(geometry2, material);
            plane2.position.z = 2;
            plane2.position.applyAxisAngle(yAxis, separatorAngle * indx)
            plane2.userData = { url: slide?.url, yRotation: separatorAngle * indx };
            plane2.layers.enable(1);
            planeArr.push(plane2);

            indx++;
        }
    }

    camera.position.set(0, 0, 150);
    camera.lookAt(0, 0, 0);

    //------------------------- earth 3d model loader
    let model;
    {
        const loader = new GLTFLoader();

        loader.load('oceanic_currents/scene.gltf', (gltf) => {
            model = gltf.scene;
            planeArr.forEach(plane => model.add(plane));
            scene.add(model);
            // gltf.animations; // Array<THREE.AnimationClip>
            // gltf.scene; // THREE.Group
            // gltf.scenes; // Array<THREE.Group>
            // gltf.cameras; // Array<THREE.Camera>
            // gltf.asset; // Object
            const box = new THREE.Box3().setFromObject(model);
            const boxSize = box.getSize(new THREE.Vector3()).length();
            const boxCenter = box.getCenter(new THREE.Vector3());
            console.log('boxsize', boxSize);
            console.log('boxcenter', boxCenter);

            // set the camera to frame the box
            frameArea(boxSize * 0.8, boxSize, boxCenter, camera);

            // update the Trackball controls to handle the new size
            controls.maxDistance = boxSize * 10;
            controls.target.copy(boxCenter);
            controls.update();
        });
    }

    let shouldRotate = false;
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);

    function rotateY(event) {
        shouldRotate = true;
    }

    function rotateStop(event) {
        shouldRotate = false;
    }

    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    const pointer = new THREE.Vector2();

    function onPointerMove(event) {

        // calculate pointer position in normalized device coordinates
        // (-1 to +1) for both components
        pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;

        // console.log('pointer loc', pointer.x, pointer.y, event.clientX, event.clientY);
    }

    let mouseDown = false;
    function onMouseDown(event) {
        mouseDown = true;
    }
    function onMouseUp(event) {
        mouseDown = false;
    }

    {
        const color = 0xFFFFFF;
        const intensity = 5;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(0, 0, 110);
        light.target.position.set(-50, -100, -110);
        scene.add(light);
        scene.add(light.target);
    }
    {
        const color = 0xFFFFFF;
        const intensity = 5;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(0, 100, 0);
        light.target.position.set(0, 0, 0);
        scene.add(light);
        scene.add(light.target);
    }

    

    let INTERSECTED;
    let direction = 'ctrClockwise';

    let calced = false;
    function calculationQuaternion() {
        if (!calced) {
            let vector = camera.position.clone();
            // vector.y = vector.y - 2;
            // vector.z = vector.z - 0.7;

            let vector2 = INTERSECTED.position.clone();
            vector2.z= vector2.z + 0;
            rotationMatrix.lookAt( vector, vector2, INTERSECTED.up );
			targetQuaternion.setFromRotationMatrix( rotationMatrix );
            calced = true;
        }
    }

    


    const rotationMatrix = new THREE.Matrix4();
    const targetQuaternion = new THREE.Quaternion();
    const clock = new THREE.Clock();
    const speed = 2;
    

    function animate() {
        const delta = clock.getDelta();
        if ( calced && !model.quaternion.equals( targetQuaternion ) ) {
            const step = speed * delta;
            INTERSECTED.quaternion.rotateTowards( targetQuaternion, step );
        }

        // update the picking ray with the camera and pointer position
        raycaster.setFromCamera(pointer, camera);

        // calculate objects intersecting the picking ray
        const intersects = raycaster.intersectObjects(scene.children);

        if (intersects.length > 0) {
            INTERSECTED = intersects[0].object;
            INTERSECTED.scale.set(1.5, 1.5, 1);
            document.body.style.cursor = 'pointer';

            // model.rotation.y = Math.acos((INTERSECTED.position.x), (INTERSECTED.position.z));
            // console.log('new y rotation', model.rotation.y);

            calculationQuaternion();

            
            

            if (mouseDown) {
                window.open(INTERSECTED.userData.url);
            }
        } else {
            if (INTERSECTED) {
                INTERSECTED.scale.set(1, 1, 1);
            }
            document.body.style.cursor = 'default';

            if (model) {
                // if (pointer.x > 0.15 && pointer.x < 0.5) {
                //     model.rotation.y += 0.03;
                //     direction = 'ctrClockwise';
                // } else if (pointer.x < -0.15 && pointer.x > -0.5) {
                //     model.rotation.y -= 0.03;
                //     direction = 'clockwise';
                // } else {
                // if (direction == 'ctrClockwise') {
                //     model.rotation.y += 0.01;
                // } else if (direction == 'clockwise') {
                //     model.rotation.y -= 0.01;
                // }

                // }

                if (!calced) {
                    model.rotation.y += 0.01;
                }
            }
        }

        renderer.render(scene, camera);

        requestAnimationFrame(animate);
    }


    animate();

}

function frameArea(sizeToFitOnScreen, boxSize, boxCenter, camera) {
    const halfSizeToFitOnScreen = sizeToFitOnScreen * 0.5;
    const halfFovY = THREE.MathUtils.degToRad(camera.fov * .5);
    const distance = halfSizeToFitOnScreen / Math.tan(halfFovY);

    // compute a unit vector that points in the direction the camera is now
    // from the center of the box
    const direction = (new THREE.Vector3()).subVectors(camera.position, boxCenter).normalize();

    // move the camera to a position distance units way from the center
    // in whatever direction the camera was from the center already
    camera.position.copy(direction.multiplyScalar(distance).add(boxCenter));
    camera.position.z = camera.position.z + .7;
    camera.position.y = camera.position.y + 2;

    // pick some near and far values for the frustum that
    // will contain the box.
    camera.near = boxSize / 100;
    camera.far = boxSize * 100;

    camera.updateProjectionMatrix();

    // point the camera to look at the center of the box
    camera.lookAt(boxCenter.x, boxCenter.y, boxCenter.z);
}



main();