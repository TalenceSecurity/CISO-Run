/*
 * CISO Run Game by Talence Security
 * 
 * Copyright (C) 2024 Talence Security
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is 
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * 
 * For credits of third-party resources used in the game, see LICENSE.md file.
 */

// Select the canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Message display elements
const gameOverMessageElement = document.getElementById('gameOverMessage');
const collectionMessageElement = document.getElementById('collectionMessage');
const replayButton = document.getElementById('replayButton');
const ambianceSelector = document.getElementById('ambianceSelector');
const darkModeToggle = document.getElementById('darkModeToggle');
const soundToggle = document.getElementById('soundToggle');

// Global size multiplier for game elements
const sizeMultiplier = 1.1; // Adjust this value as needed

// Game variables
let gameSpeed = 5;
let gravity = 0.7 * sizeMultiplier; // Adjust gravity based on size
let score = 0;
let obstacles = [];
let collectibles = [];
let messageTimer = 0;
let messageDuration = 2000; // Message display duration in milliseconds
let gameOver = false; // Game over flag

// Ambiance sound
let ambianceAudio = null;
let isSoundPaused = false;
let areSoundsOn = soundToggle.checked; // Initialize based on checkbox state

// Load images
// Character images
const cisoRunImage = new Image();
cisoRunImage.src = 'assets/img/characters/cisoRun.png';

const cisoJumpImage = new Image();
cisoJumpImage.src = 'assets/img/characters/cisoJump.png';

const cisoDuckImage = new Image();
cisoDuckImage.src = 'assets/img/characters/cisoDuck.png';

// Sound effects
const jumpSound = new Audio('assets/sounds/jump.mp3');
const duckSound = new Audio('assets/sounds/duck.mp3');
const gameOverSound = new Audio('assets/sounds/gameOver.mp3');
const collectSounds = [
  new Audio('assets/sounds/collectItem1.mp3'),
  new Audio('assets/sounds/collectItem2.mp3'),
  new Audio('assets/sounds/collectItem3.mp3'),
  new Audio('assets/sounds/collectItem4.mp3'),
  new Audio('assets/sounds/collectItem5.mp3')
];

// Collectible messages
const collectibleMessages = {
  'additionalBudget': 'Secured additional budget!',
  'configurationReview': 'Completed a configuration review!',
  'healthcheck': 'Performed a system health check!',
  'hireBlueTeamer': 'Hired a new blue team member!',
  'newFirewalls': 'Installed new firewalls!',
  'newProtection': 'Deployed new security protection!',
  'payRise': 'Received a pay rise! $$$',
  'preventedIncident': 'Prevented a security incident!',
  'securityPatch': 'Applied a critical security patch!',
  'userTraining': 'Conducted user security training!'
};

// Game over messages
const gameOverMessages = {
  'breach': 'Suffered a data breach!',
  'bug': 'A bug crashed your system!',
  'cybercriminal': 'Cybercriminal breached your defenses!',
  'hacktivist': 'Hacktivist disrupted your services!',
  'malware': 'Infected by malware!',
  'phishing': 'Fell for a phishing attack!',
  'ransomware': 'Hit by ransomware!'
};

// CISO character class
class CISO {
  constructor() {
    this.width = 50 * sizeMultiplier;
    this.height = 70 * sizeMultiplier;
    this.x = 50;
    this.y = canvas.height - this.height - 50;
    this.velocityY = 0;
    this.jumpForce = 15 * sizeMultiplier; // Adjust jump force based on size
    this.originalHeight = this.height;
    this.duckHeight = this.originalHeight / 2; // Adjusted ducking height
    this.isJumping = false;
    this.isDucking = false;
    this.grounded = false;
  }

  jump() {
    if (!this.isJumping && !this.isDucking && !gameOver && areSoundsOn) {
      this.isJumping = true;
      this.velocityY = -this.jumpForce;
      jumpSound.play();
    }
  }

  duck() {
    if (!this.isDucking && this.grounded && !gameOver && areSoundsOn) {
      this.isDucking = true;
      this.height = this.duckHeight;
      this.y += this.originalHeight - this.duckHeight;
      duckSound.play();
    }
  }

  standUp() {
    if (this.isDucking) {
      this.isDucking = false;
      this.y -= this.originalHeight - this.duckHeight;
      this.height = this.originalHeight;
    }
  }

  update() {
    this.y += this.velocityY;
    if (this.y + this.height < canvas.height - 50) {
      this.velocityY += gravity;
      this.grounded = false;
    } else {
      this.velocityY = 0;
      this.isJumping = false;
      this.grounded = true;
      this.y = canvas.height - this.height - 50;
    }
  }

  draw() {
    let image;
    if (this.isDucking) {
      image = cisoDuckImage;
    } else if (this.isJumping) {
      image = cisoJumpImage;
    } else {
      image = cisoRunImage;
    }
    ctx.drawImage(image, this.x, this.y, this.width, this.height);
  }
}

// Obstacle class
class Obstacle {
  constructor(type) {
    this.type = type;
    this.speed = gameSpeed;
    this.x = canvas.width;

    // Set properties based on type
    this.image = new Image();
    this.image.src = `assets/img/obstacles/${type}.png`;

    this.width = 50 * sizeMultiplier;
    this.height = 50 * sizeMultiplier;

    const isAirObstacle = Math.random() < 0.5;

    if (isAirObstacle) {
      // Air obstacle
      this.y = canvas.height - this.height - 90 * sizeMultiplier;
    } else {
      // Ground obstacle
      this.y = canvas.height - this.height - 50;
    }
  }

  update() {
    this.x -= this.speed;
  }

  draw() {
    ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
  }
}

// Collectible class
class Collectible {
  constructor(type) {
    this.type = type;
    this.x = canvas.width;
    this.width = 50 * sizeMultiplier;
    this.height = 50 * sizeMultiplier;
    this.y = canvas.height - this.height - 200 * sizeMultiplier;
    this.speed = gameSpeed;
    this.image = new Image();
    this.image.src = `assets/img/collectibles/${type}.png`;
  }

  update() {
    this.x -= this.speed;
  }

  draw() {
    ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
  }
}

// Initialize game objects
const ciso = new CISO();

// Control handling
document.addEventListener('keydown', function (event) {
  if (event.code === 'Space' || event.code === 'ArrowUp') {
    ciso.jump();
    event.preventDefault();
  }
  if (event.code === 'ArrowDown') {
    ciso.duck();
    event.preventDefault();
  }
});

document.addEventListener('keyup', function (event) {
  if (event.code === 'ArrowDown') {
    ciso.standUp();
    event.preventDefault();
  }
});

// Replay button event listener
replayButton.addEventListener('click', function () {
  resetGame();
  replayButton.blur();
});

// Dark Mode Toggle Event Listener
darkModeToggle.addEventListener('change', function () {
  if (this.checked) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
});

// Sound Pills Toggle Event Listener
soundToggle.addEventListener('change', function () {
  if (this.checked) {
    areSoundsOn = true;
    // Removed text content assignment to prevent labels inside the pill
    if (ambianceAudio && isSoundPaused === false) {
      ambianceAudio.play();
    }
  } else {
    areSoundsOn = false;
    // Removed text content assignment to prevent labels inside the pill
    if (ambianceAudio) {
      ambianceAudio.pause();
    }
  }
});

// Ambiance selector event listener
ambianceSelector.addEventListener('change', function () {
  const selectedTheme = ambianceSelector.value;
  if (ambianceAudio) {
    ambianceAudio.pause();
    ambianceAudio.currentTime = 0;
  }
  if (selectedTheme !== 'none') {
    ambianceAudio = new Audio(`assets/sounds/ambiance${selectedTheme}.mp3`);
    ambianceAudio.loop = true;
    ambianceAudio.volume = 0.5;
    if (areSoundsOn) {
      ambianceAudio.play();
    }
    isSoundPaused = false;
  } else {
    ambianceAudio = null;
  }
});

// Game loop functions
function spawnObstacle() {
  let obstacleTypes = [
    'breach',
    'bug',
    'cybercriminal',
    'hacktivist',
    'malware',
    'phishing',
    'ransomware'
  ];
  let type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
  obstacles.push(new Obstacle(type));
}

function spawnCollectible() {
  let collectibleTypes = [
    'additionalBudget',
    'configurationReview',
    'healthcheck',
    'hireBlueTeamer',
    'newFirewalls',
    'newProtection',
    'payRise',
    'preventedIncident',
    'securityPatch',
    'userTraining'
  ];
  let type = collectibleTypes[Math.floor(Math.random() * collectibleTypes.length)];
  collectibles.push(new Collectible(type));
}

let obstacleTimer = 0;
let obstacleInterval = 2000;
let collectibleTimer = 0;
let collectibleInterval = 2500;

function updateGame(deltaTime) {
  if (gameOver) {
    return;
  }

  ciso.update();

  // Update obstacles
  for (let i = 0; i < obstacles.length; i++) {
    let obstacle = obstacles[i];
    obstacle.update();
    if (obstacle.x + obstacle.width < 0) {
      obstacles.splice(i, 1);
      i--;
      continue;
    }
    if (checkCollision(ciso, obstacle)) {
      if (areSoundsOn) {
        gameOverSound.play();
      }
      let message = gameOverMessages[obstacle.type] || 'Game Over!';
      showGameOverMessage(message);
      gameOver = true;
      replayButton.disabled = false;
      return;
    }
  }

  // Update collectibles
  for (let i = 0; i < collectibles.length; i++) {
    let collectible = collectibles[i];
    collectible.update();
    if (collectible.x + collectible.width < 0) {
      collectibles.splice(i, 1);
      i--;
      continue;
    }
    if (checkCollision(ciso, collectible)) {
      score += 100;
      if (areSoundsOn) {
        let randomSound = collectSounds[Math.floor(Math.random() * collectSounds.length)];
        randomSound.play();
      }
      let message = collectibleMessages[collectible.type] || 'Collected an item!';
      showCollectionMessage(message);
      collectibles.splice(i, 1);
      i--;
    }
  }

  // Spawn obstacles
  obstacleTimer += deltaTime;
  if (obstacleTimer > obstacleInterval) {
    spawnObstacle();
    obstacleTimer = 0;
  }

  // Spawn collectibles
  collectibleTimer += deltaTime;
  if (collectibleTimer > collectibleInterval) {
    spawnCollectible();
    collectibleTimer = 0;
  }

  // Increase game speed over time
  gameSpeed += 0.001;

  // Update message timer
  if (messageTimer > 0) {
    messageTimer -= deltaTime;
    if (messageTimer <= 0) {
      collectionMessageElement.textContent = '';
      gameOverMessageElement.textContent = '';
    }
  }
}

function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ciso.draw();

  obstacles.forEach(obstacle => {
    obstacle.draw();
  });

  collectibles.forEach(collectible => {
    collectible.draw();
  });

  ctx.fillStyle = 'var(--text-color)';
  ctx.font = '20px Arial';
  ctx.fillText('Score: ' + score, 10, 30);
}

let lastTime = 0;

function gameLoop(timestamp) {
  let deltaTime = timestamp - lastTime;
  lastTime = timestamp;

  updateGame(deltaTime);
  drawGame();

  requestAnimationFrame(gameLoop);
}

function resetGame() {
  obstacles = [];
  collectibles = [];
  score = 0;
  gameSpeed = 5;
  ciso.x = 50;
  ciso.y = canvas.height - ciso.height - 50;
  collectionMessageElement.textContent = '';
  gameOverMessageElement.textContent = '';
  gameOver = false;
  replayButton.disabled = true;
}

// Message display functions
function showCollectionMessage(text) {
  collectionMessageElement.textContent = text;
  messageTimer = messageDuration;
}

function showGameOverMessage(text) {
  gameOverMessageElement.textContent = text;
  messageTimer = messageDuration;

  obstacles = [];
  collectibles = [];
}

resetGame();
requestAnimationFrame(gameLoop);

// Collision detection function
function checkCollision(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}
