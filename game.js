// DO NOT OPEN - Prototype
// Browser-based co-op horror maze prototype using Three.js

let scene, camera, renderer;
let player = { x: 0, z: 0, yaw: 0, pitch: 0, stamina: 100, battery: 100 };
let flashlight;
let maze = [];
let doors = [];
let enemies = [];
let gameActive = false;
let keys = {};
let mouseDown = false;

// Maze configuration
const MAZE_SIZE = 14; // Doubled map size
const CELL_SIZE = 4;
const WALL_HEIGHT = 3;

// Door types
const DOOR_EXIT = 'exit';
const DOOR_ENEMY = 'enemy';
const DOOR_SUPPLY = 'supply';
const DOOR_EMPTY = 'empty';

function init() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0f);
    scene.fog = new THREE.Fog(0x0a0a0f, 8, 30);

    // Camera (first person)
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 1.6, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('game-container').appendChild(renderer.domElement);

    // Flashlight (spotlight)
    flashlight = new THREE.SpotLight(0xffffee, 3.0, 25, Math.PI / 5, 0.4);
    flashlight.intensity = 0; // Default OFF
    flashlight.position.copy(camera.position);
    camera.add(flashlight);
    scene.add(camera);

    // Lighting - improved visibility
    const ambient = new THREE.AmbientLight(0x404060, 0.5);
    scene.add(ambient);
    
    // Dim overhead light for general visibility
    const overhead = new THREE.PointLight(0xffaa66, 0.3, 50);
    overhead.position.set(MAZE_SIZE * CELL_SIZE / 2, WALL_HEIGHT - 0.5, MAZE_SIZE * CELL_SIZE / 2);
    scene.add(overhead);

    // Generate maze
    generateMaze();

    // Event listeners
    document.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
    document.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', () => { mouseDown = true; });
    document.addEventListener('mouseup', () => { mouseDown = false; });
    window.addEventListener('resize', onResize);

    // Start button
    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('restart-btn').addEventListener('click', restartGame);

    // Game loop
    animate();
}

// Audio management
let bgMusic = null;
let bossMusic = null;
let musicStarted = false;

function initAudio() {
    if (musicStarted) return;
    
    // Background music - loops at 50% volume
    bgMusic = new Audio('music/8-bit Nightmare.mp3');
    bgMusic.loop = true;
    bgMusic.volume = 0.5;
    bgMusic.play().catch(e => console.log('Audio play failed:', e));
    
    // Boss music - plays when patient found
    bossMusic = new Audio('music/The Final Boss.mp3');
    bossMusic.loop = true;
    bossMusic.volume = 0.7;
    
    musicStarted = true;
}

function playBossMusic() {
    if (!bossMusic) return;
    // Stop background, start boss music
    if (bgMusic && !bgMusic.paused) {
        bgMusic.pause();
    }
    bossMusic.currentTime = 0;
    bossMusic.play().catch(e => console.log('Boss music play failed:', e));
}

function generateMaze() {
    // Clear ALL previous scene objects completely
    const toRemove = [];
    for (let i = 0; i < scene.children.length; i++) {
        const child = scene.children[i];
        if (child !== camera && child.type !== 'AmbientLight' && child.type !== 'PointLight') {
            toRemove.push(child);
        }
    }
    for (let obj of toRemove) {
        scene.remove(obj);
    }
    
    doors = [];
    enemies = [];

    // Generate grid (1 = wall, 0 = floor)
    maze = [];
    for (let y = 0; y < MAZE_SIZE; y++) {
        let row = [];
        for (let x = 0; x < MAZE_SIZE; x++) {
            if (x === 0 || x === MAZE_SIZE - 1 || y === 0 || y === MAZE_SIZE - 1) {
                row.push(1); // Border walls
            } else {
                row.push(0); // Floor
            }
        }
        maze.push(row);
    }

    // Add internal walls to create rooms/corridors
    for (let y = 2; y < MAZE_SIZE - 1; y += 2) {
        for (let x = 2; x < MAZE_SIZE - 1; x++) {
            if (x % 2 === 0 && Math.random() > 0.3) {
                maze[y][x] = 1;
            }
        }
    }

    // Build walls as boxes - more visible colors
    const wallMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x8B7355,
        roughness: 0.8,
        metalness: 0.1
    });
    
    for (let y = 0; y < MAZE_SIZE; y++) {
        for (let x = 0; x < MAZE_SIZE; x++) {
            if (maze[y][x] === 1) {
                const wall = new THREE.Mesh(
                    new THREE.BoxGeometry(CELL_SIZE, WALL_HEIGHT, CELL_SIZE),
                    wallMaterial
                );
                wall.position.set(x * CELL_SIZE - CELL_SIZE / 2, WALL_HEIGHT / 2, y * CELL_SIZE - CELL_SIZE / 2);
                scene.add(wall);
            }
        }
    }

    // Floor - lighter, more visible
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(MAZE_SIZE * CELL_SIZE, MAZE_SIZE * CELL_SIZE),
        new THREE.MeshStandardMaterial({ 
            color: 0x6B5B45,
            roughness: 0.9
        })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set((MAZE_SIZE * CELL_SIZE) / 2 - CELL_SIZE / 2, 0, (MAZE_SIZE * CELL_SIZE) / 2 - CELL_SIZE / 2);
    scene.add(floor);

    // Ceiling - distinct from floor
    const ceiling = new THREE.Mesh(
        new THREE.PlaneGeometry(MAZE_SIZE * CELL_SIZE, MAZE_SIZE * CELL_SIZE),
        new THREE.MeshStandardMaterial({ 
            color: 0x4A3F35,
            roughness: 1.0
        })
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set((MAZE_SIZE * CELL_SIZE) / 2 - CELL_SIZE / 2, WALL_HEIGHT, (MAZE_SIZE * CELL_SIZE) / 2 - CELL_SIZE / 2);
    scene.add(ceiling);

    // Place doors at random floor locations (not on walls)
    let doorCount = 0;
    const maxDoors = 16; // More doors for larger map
    
    while (doorCount < maxDoors) {
        const x = Math.floor(Math.random() * (MAZE_SIZE - 2)) + 1;
        const y = Math.floor(Math.random() * (MAZE_SIZE - 2)) + 1;
        
        if (maze[y][x] === 0 && !doors.find(d => d.gridX === x && d.gridY === y)) {
            // Assign door type
            let type;
            if (doorCount === 0) {
                type = DOOR_EXIT; // First door is always exit
            } else {
                const roll = Math.random();
                if (roll < 0.9) type = DOOR_ENEMY; // Almost all doors have patients
                else type = DOOR_SUPPLY;
            }

            createDoor(x, y, type);
            doorCount++;
        }
    }

    // Shuffle exit position among doors
    const exitDoor = doors.find(d => d.type === DOOR_EXIT);
    const randomDoor = doors[Math.floor(Math.random() * doors.length)];
    if (exitDoor !== randomDoor) {
        exitDoor.type = DOOR_EMPTY;
        randomDoor.type = DOOR_EXIT;
    }

    // Reset player position to center of maze
    player.x = Math.floor(MAZE_SIZE / 2) * CELL_SIZE - CELL_SIZE / 2;
    player.z = Math.floor(MAZE_SIZE / 2) * CELL_SIZE - CELL_SIZE / 2;
    camera.position.set(player.x, 1.6, player.z);
}

function createDoor(gridX, gridY, type) {
    const worldX = gridX * CELL_SIZE - CELL_SIZE / 2;
    const worldZ = gridY * CELL_SIZE - CELL_SIZE / 2;
    
    // Door frame (visible structure)
    const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x4A3520 });
    const frameLeft = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.4, 0.1), frameMaterial);
    frameLeft.position.set(worldX - 0.65, 1.2, worldZ);
    const frameRight = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.4, 0.1), frameMaterial);
    frameRight.position.set(worldX + 0.65, 1.2, worldZ);
    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 0.1), frameMaterial);
    frameTop.position.set(worldX, 2.35, worldZ);
    
    // Actual door panel
    const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const door = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 2.2, 0.08),
        doorMaterial
    );
    door.position.set(worldX, 1.1, worldZ);
    
    // DO NOT OPEN sign - make it bigger and more visible
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 512, 128);
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, 504, 120);
    ctx.fillStyle = '#cc0000';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('DO NOT OPEN', 256, 80);
    
    const texture = new THREE.CanvasTexture(canvas);
    const sign = new THREE.Mesh(
        new THREE.PlaneGeometry(1.8, 0.4),
        new THREE.MeshBasicMaterial({ map: texture })
    );
    sign.position.set(worldX, 2.6, worldZ + 0.05);
    
    scene.add(frameLeft);
    scene.add(frameRight);
    scene.add(frameTop);
    scene.add(door);
    scene.add(sign);

    doors.push({
        mesh: door,
        sign: sign,
        frameLeft: frameLeft,
        frameRight: frameRight,
        frameTop: frameTop,
        gridX: gridX,
        gridY: gridY,
        type: type,
        opened: false
    });
}

let audioContext = null;

function playDoorSound() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Create a creepy door creak + thud sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Low rumble for the thud
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(80, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(40, audioContext.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

function spawnEnemy(gridX, gridY) {
    const worldX = gridX * CELL_SIZE - CELL_SIZE / 2;
    const worldZ = gridY * CELL_SIZE - CELL_SIZE / 2;
    
    // Create a more visible enemy - red humanoid shape
    const group = new THREE.Group();
    
    // Body
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, emissive: 0x330000 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 1.0, 8), bodyMat);
    body.position.y = 0.9;
    group.add(body);
    
    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), bodyMat);
    head.position.y = 1.55;
    group.add(head);
    
    // Eyes (glowing white)
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 4, 4), eyeMat);
    leftEye.position.set(-0.1, 1.6, 0.2);
    group.add(leftEye);
    const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 4, 4), eyeMat);
    rightEye.position.set(0.1, 1.6, 0.2);
    group.add(rightEye);
    
    // Arms
    const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.7, 4), bodyMat);
    leftArm.position.set(-0.4, 1.0, 0);
    leftArm.rotation.z = 0.3;
    group.add(leftArm);
    const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.7, 4), bodyMat);
    rightArm.position.set(0.4, 1.0, 0);
    rightArm.rotation.z = -0.3;
    group.add(rightArm);
    
    // Legs
    const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.8, 4), bodyMat);
    leftLeg.position.set(-0.15, 0.3, 0);
    group.add(leftLeg);
    const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.8, 4), bodyMat);
    rightLeg.position.set(0.15, 0.3, 0);
    group.add(rightLeg);
    
    group.position.set(worldX, 0, worldZ);
    scene.add(group);

    enemies.push({
        mesh: group,
        x: worldX,
        z: worldZ,
        state: 'emerge', // Slowly emerge from the room first
        emergeTime: Date.now(),
        targetX: null,
        targetZ: null,
        lastSeenPlayer: 0
    });
}

function startGame() {
    document.getElementById('instructions').style.display = 'none';
    gameActive = true;
    
    // Start background music
    initAudio();
    
    // Lock pointer for mouse look
    renderer.domElement.requestPointerLock();
}

function restartGame() {
    // Reset music back to nightmare
    if (bossMusic && !bossMusic.paused) {
        bossMusic.pause();
    }
    if (bgMusic) {
        bgMusic.currentTime = 0;
        bgMusic.play().catch(e => console.log('BG music restart failed:', e));
    }
    
    generateMaze();
    player.stamina = 100;
    player.battery = 100;
    updateHUD();
    document.getElementById('overlay').style.display = 'none';
    gameActive = true;
    renderer.domElement.requestPointerLock();
}

function onMouseMove(e) {
    if (!gameActive || !document.pointerLockElement) return;
    
    // Horizontal (yaw)
    player.yaw -= e.movementX * 0.002;
    
    // Vertical (pitch) - clamp to avoid flipping
    player.pitch -= e.movementY * 0.002;
    player.pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, player.pitch));
    
    camera.rotation.order = 'YXZ';
    camera.rotation.y = player.yaw;
    camera.rotation.x = player.pitch;
}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function updatePlayer(dt) {
    if (!gameActive) return;

    let speed = 1.5 * dt; // Slower, more deliberate movement
    let sprinting = keys['shift'] && player.stamina > 0;
    
    if (sprinting) {
        speed *= 2;
        player.stamina -= 15 * dt;
    } else {
        player.stamina += 5 * dt; // Regenerate when not sprinting
    }
    
    player.stamina = Math.max(0, Math.min(100, player.stamina));

    // Calculate movement direction based on yaw only (not pitch)
    let moveX = 0;
    let moveZ = 0;
    
    if (keys['w']) { moveX -= Math.sin(player.yaw); moveZ -= Math.cos(player.yaw); }
    if (keys['s']) { moveX += Math.sin(player.yaw); moveZ += Math.cos(player.yaw); }
    if (keys['a']) { moveX -= Math.cos(player.yaw); moveZ += Math.sin(player.yaw); }
    if (keys['d']) { moveX += Math.cos(player.yaw); moveZ -= Math.sin(player.yaw); }

    // Normalize diagonal movement
    const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (length > 0) {
        moveX /= length;
        moveZ /= length;
    }

    let newX = player.x + moveX * speed;
    let newZ = player.z + moveZ * speed;

    // Improved collision detection - check both X and Z separately
    // to prevent getting stuck on corners
    
    // Try moving in X direction
    let testX = Math.floor((newX + CELL_SIZE / 2) / CELL_SIZE);
    let currentY = Math.floor((player.z + CELL_SIZE / 2) / CELL_SIZE);
    if (testX >= 0 && testX < MAZE_SIZE && currentY >= 0 && currentY < MAZE_SIZE) {
        if (maze[currentY][testX] === 0) {
            player.x = newX;
        }
    }
    
    // Try moving in Z direction
    let currentX = Math.floor((player.x + CELL_SIZE / 2) / CELL_SIZE);
    let testZ = Math.floor((newZ + CELL_SIZE / 2) / CELL_SIZE);
    if (currentX >= 0 && currentX < MAZE_SIZE && testZ >= 0 && testZ < MAZE_SIZE) {
        if (maze[testZ][currentX] === 0) {
            player.z = newZ;
        }
    }

    camera.position.set(player.x, 1.6, player.z);
    flashlight.position.copy(camera.position);

    // Check door proximity and interaction
    checkDoorInteraction();
}

function checkDoorInteraction() {
    let nearDoor = null;
    
    for (let door of doors) {
        if (door.opened) continue;
        
        const dx = player.x - door.mesh.position.x;
        const dz = player.z - door.mesh.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        
        if (dist < 2) {
            nearDoor = door;
            break;
        }
    }

    const prompt = document.getElementById('door-prompt');
    
    if (nearDoor) {
        prompt.style.display = 'block';
        
        if (keys['e']) {
            openDoor(nearDoor);
            keys['e'] = false; // Prevent repeated opening
        }
    } else {
        prompt.style.display = 'none';
    }
}

function openDoor(door) {
    door.opened = true;
    
    // Animate door opening - swing it to the side
    const openAnim = () => {
        if (door.mesh.rotation.y < Math.PI / 2) {
            door.mesh.rotation.y += 0.1;
            requestAnimationFrame(openAnim);
        }
    };
    openAnim();
    
    // Remove sign
    scene.remove(door.sign);

    switch (door.type) {
        case DOOR_EXIT:
            showOverlay('ESCAPED!', 'You found the exit. The asylum is behind you... for now.');
            gameActive = false;
            break;
            
        case DOOR_ENEMY:
            playDoorSound();
            showMessage('Something stirs in the darkness...');
            // Play boss music when patient found
            playBossMusic();
            // Delay enemy emergence by 4 seconds
            setTimeout(() => {
                spawnEnemy(door.gridX, door.gridY);
            }, 4000);
            break;
            
        case DOOR_SUPPLY:
            player.battery = Math.min(100, player.battery + 30);
            showMessage('Found batteries! Flashlight recharged.');
            updateHUD();
            break;
            
        case DOOR_EMPTY:
            showMessage('Empty room. Nothing here.');
            break;
    }
}

function updateEnemies(dt) {
    for (let enemy of enemies) {
        const dx = player.x - enemy.x;
        const dz = player.z - enemy.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        switch (enemy.state) {
            case 'emerge':
                // Slowly emerge from the room over 2 seconds
                if (Date.now() - enemy.emergeTime < 2000) {
                    // Scale up from nothing to full size
                    const progress = (Date.now() - enemy.emergeTime) / 2000;
                    enemy.mesh.scale.set(progress, progress, progress);
                } else {
                    enemy.mesh.scale.set(1, 1, 1);
                    enemy.state = 'chase';
                }
                break;
            
            case 'roam':
                // Random wandering
                if (!enemy.targetX || Math.random() < 0.01) {
                    enemy.targetX = player.x + (Math.random() - 0.5) * 20;
                    enemy.targetZ = player.z + (Math.random() - 0.5) * 20;
                }
                
                moveEnemyToward(enemy, enemy.targetX, enemy.targetZ, dt, 1);
                
                // Detect player if close
                if (dist < 8) {
                    enemy.state = 'chase';
                    enemy.lastSeenPlayer = Date.now();
                }
                break;
                
            case 'chase':
                moveEnemyToward(enemy, player.x, player.z, dt, 0.12); // 12% speed - very slow creep
                
                if (dist < 1.5) {
                    showOverlay('CAUGHT!', 'The patient got you. Better luck next time.');
                    gameActive = false;
                }
                
                // Lose sight if too far or timeout
                if (dist > 12 || Date.now() - enemy.lastSeenPlayer > 3000) {
                    enemy.state = 'lose';
                }
                break;
                
            case 'lose':
                // Return to roaming after losing player
                enemy.state = 'roam';
                enemy.targetX = null;
                break;
        }

        enemy.mesh.position.set(enemy.x, 0, enemy.z);
    }
}

function moveEnemyToward(enemy, targetX, targetZ, dt, speedMultiplier) {
    const dx = targetX - enemy.x;
    const dz = targetZ - enemy.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    
    if (dist > 0.1) {
        const speed = 2 * dt * speedMultiplier;
        
        // Try to move toward player, but check for wall collisions
        let newX = enemy.x + (dx / dist) * speed;
        let newZ = enemy.z + (dz / dist) * speed;
        
        // Check X movement
        let testXGrid = Math.floor((newX + CELL_SIZE / 2) / CELL_SIZE);
        let currentYGrid = Math.floor((enemy.z + CELL_SIZE / 2) / CELL_SIZE);
        if (testXGrid >= 0 && testXGrid < MAZE_SIZE && currentYGrid >= 0 && currentYGrid < MAZE_SIZE) {
            if (maze[currentYGrid][testXGrid] === 0) {
                enemy.x = newX;
            } else {
                // Wall in X direction, try moving only in Z
                let testZGrid = Math.floor((newZ + CELL_SIZE / 2) / CELL_SIZE);
                let currentXGrid = Math.floor((enemy.x + CELL_SIZE / 2) / CELL_SIZE);
                if (currentXGrid >= 0 && currentXGrid < MAZE_SIZE && testZGrid >= 0 && testZGrid < MAZE_SIZE) {
                    if (maze[testZGrid][currentXGrid] === 0) {
                        enemy.z = newZ;
                    }
                }
            }
        } else {
            // Out of bounds in X, try Z only
            let testZGrid = Math.floor((newZ + CELL_SIZE / 2) / CELL_SIZE);
            let currentXGrid = Math.floor((enemy.x + CELL_SIZE / 2) / CELL_SIZE);
            if (currentXGrid >= 0 && currentXGrid < MAZE_SIZE && testZGrid >= 0 && testZGrid < MAZE_SIZE) {
                if (maze[testZGrid][currentXGrid] === 0) {
                    enemy.z = newZ;
                }
            }
        }
    }
}

function updateHUD() {
    document.getElementById('stamina-fill').style.width = player.stamina + '%';
    document.getElementById('battery-fill').style.width = player.battery + '%';
    
    // Flashlight battery drain
    if (gameActive && flashlight.intensity > 0) {
        player.battery -= 2 * 0.016; // ~30 seconds of use
        if (player.battery <= 0) {
            flashlight.intensity = 0;
            showMessage('Flashlight battery died!');
        }
    }
}

function showMessage(text) {
    const msgArea = document.getElementById('message-area');
    msgArea.textContent = text;
    
    setTimeout(() => {
        msgArea.textContent = '';
    }, 3000);
}

function showOverlay(title, message) {
    document.getElementById('overlay-title').textContent = title;
    document.getElementById('overlay-message').textContent = message;
    document.getElementById('overlay').style.display = 'flex';
    
    if (document.pointerLockElement) {
        document.exitPointerLock();
    }
}

function animate() {
    requestAnimationFrame(animate);
    
    const dt = 0.016; // Fixed timestep for simplicity
    
    updatePlayer(dt);
    updateEnemies(dt);
    updateHUD();
    
    renderer.render(scene, camera);
}

// Toggle flashlight with F key
document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'f' && gameActive) {
        if (flashlight.intensity > 0) {
            flashlight.intensity = 0;
            showMessage('Flashlight off');
        } else if (player.battery > 0) {
            flashlight.intensity = 3.0;
            showMessage('Flashlight on');
        }
    }
});

// Start the game
init();