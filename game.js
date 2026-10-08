// DO NOT OPEN - Prototype
// Browser-based co-op horror maze prototype using Three.js

let scene, camera, renderer;
let player = { x: 0, z: 0, rotation: 0, stamina: 100, battery: 100 };
let flashlight;
let maze = [];
let doors = [];
let enemies = [];
let gameActive = false;
let keys = {};
let mouseDown = false;

// Maze configuration
const MAZE_SIZE = 7;
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
    scene.background = new THREE.Color(0x111111);
    scene.fog = new THREE.Fog(0x111111, 5, 25);

    // Camera (first person)
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 1.6, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('game-container').appendChild(renderer.domElement);

    // Flashlight (spotlight)
    flashlight = new THREE.SpotLight(0xffffff, 1.5, 20, Math.PI / 6, 0.5);
    flashlight.position.copy(camera.position);
    camera.add(flashlight);
    scene.add(camera);

    // Ambient light (very dim)
    const ambient = new THREE.AmbientLight(0x333333, 0.3);
    scene.add(ambient);

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

function generateMaze() {
    // Clear previous maze objects
    doors.forEach(d => scene.remove(d.mesh));
    enemies.forEach(e => scene.remove(e.mesh));
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

    // Build walls as boxes
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x554433, roughness: 0.9 });
    
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

    // Floor
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(MAZE_SIZE * CELL_SIZE, MAZE_SIZE * CELL_SIZE),
        new THREE.MeshStandardMaterial({ color: 0x333322 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set((MAZE_SIZE * CELL_SIZE) / 2 - CELL_SIZE / 2, 0, (MAZE_SIZE * CELL_SIZE) / 2 - CELL_SIZE / 2);
    scene.add(floor);

    // Ceiling
    const ceiling = new THREE.Mesh(
        new THREE.PlaneGeometry(MAZE_SIZE * CELL_SIZE, MAZE_SIZE * CELL_SIZE),
        new THREE.MeshStandardMaterial({ color: 0x222211 })
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set((MAZE_SIZE * CELL_SIZE) / 2 - CELL_SIZE / 2, WALL_HEIGHT, (MAZE_SIZE * CELL_SIZE) / 2 - CELL_SIZE / 2);
    scene.add(ceiling);

    // Place doors at random floor locations (not on walls)
    let doorCount = 0;
    const maxDoors = 8;
    
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
                if (roll < 0.3) type = DOOR_ENEMY;
                else if (roll < 0.5) type = DOOR_SUPPLY;
                else type = DOOR_EMPTY;
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
    const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const door = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 2.2, 0.1),
        doorMaterial
    );
    
    const worldX = gridX * CELL_SIZE - CELL_SIZE / 2;
    const worldZ = gridY * CELL_SIZE - CELL_SIZE / 2;
    door.position.set(worldX, 1.1, worldZ);
    
    // Add "DO NOT OPEN" sign (simple text via sprite)
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('DO NOT OPEN', 128, 40);
    
    const texture = new THREE.CanvasTexture(canvas);
    const sign = new THREE.Mesh(
        new THREE.PlaneGeometry(1.5, 0.3),
        new THREE.MeshBasicMaterial({ map: texture })
    );
    sign.position.set(worldX, 2.5, worldZ + 0.06);
    
    scene.add(door);
    scene.add(sign);

    doors.push({
        mesh: door,
        sign: sign,
        gridX: gridX,
        gridY: gridY,
        type: type,
        opened: false
    });
}

function spawnEnemy(gridX, gridY) {
    const enemyMaterial = new THREE.MeshStandardMaterial({ color: 0x8B0000 });
    const enemy = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.4, 1.2, 4, 8),
        enemyMaterial
    );
    
    const worldX = gridX * CELL_SIZE - CELL_SIZE / 2;
    const worldZ = gridY * CELL_SIZE - CELL_SIZE / 2;
    enemy.position.set(worldX, 0.6, worldZ);
    
    scene.add(enemy);

    enemies.push({
        mesh: enemy,
        x: worldX,
        z: worldZ,
        state: 'roam', // roam, chase, lose
        targetX: null,
        targetZ: null,
        lastSeenPlayer: 0
    });
}

function startGame() {
    document.getElementById('instructions').style.display = 'none';
    gameActive = true;
    
    // Lock pointer for mouse look
    renderer.domElement.requestPointerLock();
}

function restartGame() {
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
    
    player.rotation -= e.movementX * 0.002;
    camera.rotation.y = player.rotation;
}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function updatePlayer(dt) {
    if (!gameActive) return;

    let speed = 3 * dt;
    let sprinting = keys['shift'] && player.stamina > 0;
    
    if (sprinting) {
        speed *= 2;
        player.stamina -= 15 * dt;
    } else {
        player.stamina += 5 * dt; // Regenerate when not sprinting
    }
    
    player.stamina = Math.max(0, Math.min(100, player.stamina));

    // Calculate movement direction based on camera rotation
    let moveX = 0;
    let moveZ = 0;
    
    if (keys['w']) { moveX -= Math.sin(player.rotation); moveZ -= Math.cos(player.rotation); }
    if (keys['s']) { moveX += Math.sin(player.rotation); moveZ += Math.cos(player.rotation); }
    if (keys['a']) { moveX -= Math.cos(player.rotation); moveZ += Math.sin(player.rotation); }
    if (keys['d']) { moveX += Math.cos(player.rotation); moveZ -= Math.sin(player.rotation); }

    // Normalize diagonal movement
    const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (length > 0) {
        moveX /= length;
        moveZ /= length;
    }

    let newX = player.x + moveX * speed;
    let newZ = player.z + moveZ * speed;

    // Simple collision with walls
    const gridX = Math.floor((newX + CELL_SIZE / 2) / CELL_SIZE);
    const gridY = Math.floor((newZ + CELL_SIZE / 2) / CELL_SIZE);
    
    if (gridX >= 0 && gridX < MAZE_SIZE && gridY >= 0 && gridY < MAZE_SIZE) {
        if (maze[gridY][gridX] === 0) {
            player.x = newX;
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
    
    // Remove door mesh (it's "opened")
    scene.remove(door.mesh);
    scene.remove(door.sign);

    switch (door.type) {
        case DOOR_EXIT:
            showOverlay('ESCAPED!', 'You found the exit. The asylum is behind you... for now.');
            gameActive = false;
            break;
            
        case DOOR_ENEMY:
            showMessage('Something comes running out of that door!');
            spawnEnemy(door.gridX, door.gridY);
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
                moveEnemyToward(enemy, player.x, player.z, dt, 2); // Faster when chasing
                
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

        enemy.mesh.position.set(enemy.x, 0.6, enemy.z);
    }
}

function moveEnemyToward(enemy, targetX, targetZ, dt, speedMultiplier) {
    const dx = targetX - enemy.x;
    const dz = targetZ - enemy.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    
    if (dist > 0.1) {
        const speed = 2 * dt * speedMultiplier;
        enemy.x += (dx / dist) * speed;
        enemy.z += (dz / dist) * speed;
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
            flashlight.intensity = 1.5;
            showMessage('Flashlight on');
        }
    }
});

// Start the game
init();