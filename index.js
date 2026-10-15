// Basic Environment Setup
const canvas = document.createElement("canvas");
document.querySelector(".myGame").appendChild(canvas);
const context = canvas.getContext("2d");

const form = document.querySelector("form");
const scoreBoard = document.querySelector(".scoreBoard");

const WEAPON_SPEED = 7;
const DIFFICULTIES = {
  Easy: { spawnRate: 2000, speed: 2 },
  Medium: { spawnRate: 1400, speed: 3 },
  Hard: { spawnRate: 1000, speed: 3.5 },
  Insane: { spawnRate: 700, speed: 4.5 },
};

let difficulty = DIFFICULTIES.Easy.speed;
let spawnTimer = null;
let animationId = null;
let score = 0;

// ------------------------------------------ Sound Effects ------------------------------------------
// Synthesized with the Web Audio API, so no audio files are needed
let audioCtx = null;

// Browsers only allow audio after a user gesture, so this is called from the Play button
const initAudio = () => {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
};

// Plays a tone that slides from startFreq to endFreq and fades out
const playTone = (startFreq, endFreq, duration, type = "sine", volume = 0.2) => {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(startFreq, now);
  osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.connect(gain).connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + duration);
};

// Short burst of white noise for explosions
const playNoise = (duration, volume = 0.3) => {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * duration, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  const source = audioCtx.createBufferSource();
  const gain = audioCtx.createGain();
  source.buffer = buffer;
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  source.connect(gain).connect(audioCtx.destination);
  source.start(now);
};

const sounds = {
  shoot: () => playTone(880, 220, 0.12, "square", 0.08),
  hit: () => playTone(400, 150, 0.1, "triangle", 0.2),
  destroy: () => {
    playNoise(0.25, 0.25);
    playTone(200, 40, 0.3, "sawtooth", 0.12);
  },
  gameOver: () => {
    playTone(440, 55, 1.2, "sawtooth", 0.2);
    playNoise(0.6, 0.3);
  },
};

// Player always sits at the center of the canvas
const playerPosition = { x: 0, y: 0 };

// Canvas takes over the whole page and stays in sync with window size
const resizeCanvas = () => {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  playerPosition.x = canvas.width / 2;
  playerPosition.y = canvas.height / 2;
};
resizeCanvas();
addEventListener("resize", resizeCanvas);

// ------------------------- Creating Player, Enemy, Weapon, Etc Classes--------------------------------

// Base class for everything drawn as a filled circle
class Circle {
  constructor(x, y, radius, color, velocity = { x: 0, y: 0 }) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
  }

  draw() {
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    context.fillStyle = this.color;
    context.fill();
  }

  update() {
    this.x += this.velocity.x;
    this.y += this.velocity.y;
    this.draw();
  }

  // Circle vs circle collision (squared distance avoids a sqrt per check)
  collidesWith(other) {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    const minDist = this.radius + other.radius;
    return dx * dx + dy * dy < minDist * minDist;
  }

  isOffScreen() {
    return (
      this.x + this.radius < 0 ||
      this.x - this.radius > canvas.width ||
      this.y + this.radius < 0 ||
      this.y - this.radius > canvas.height
    );
  }
}

class Player extends Circle {
  draw() {
    // Follow center in case the window was resized
    this.x = playerPosition.x;
    this.y = playerPosition.y;
    super.draw();
  }
}

class Weapon extends Circle {}

class Enemy extends Circle {}

// -----------------------------------------Main Logic Start here--------------------------------------------

const prabh = new Player(playerPosition.x, playerPosition.y, 15, "white");

const weapons = [];
const enemies = [];

// -------------------------------Function To Spawn Enemy At Random Location-----------------------------
const spawnEnemy = () => {
  const enemySize = Math.random() * (40 - 5) + 5; // between 5 and 40

  const enemyColor = `hsl(${Math.random() * 360}, 60%, 55%)`;

  // Spawn just outside one of the four screen edges
  let random;
  if (Math.random() < 0.5) {
    random = {
      x: Math.random() < 0.5 ? canvas.width + enemySize : 0 - enemySize,
      y: Math.random() * canvas.height,
    };
  } else {
    random = {
      x: Math.random() * canvas.width,
      y: Math.random() < 0.5 ? canvas.height + enemySize : 0 - enemySize,
    };
  }

  // Head straight for the player
  const myAngle = Math.atan2(
    playerPosition.y - random.y,
    playerPosition.x - random.x
  );
  const velocity = {
    x: Math.cos(myAngle) * difficulty,
    y: Math.sin(myAngle) * difficulty,
  };

  enemies.push(new Enemy(random.x, random.y, enemySize, enemyColor, velocity));
};

const updateScore = () => {
  scoreBoard.textContent = `Score : ${score}`;
};

const gameOver = () => {
  cancelAnimationFrame(animationId);
  clearInterval(spawnTimer);
  spawnTimer = null;
  sounds.gameOver();

  const gameOverBanner = document.createElement("div");
  gameOverBanner.className = "gameover";
  gameOverBanner.innerHTML = `<div>Game Over</div><div>Score : ${score}</div><button>Play Again</button>`;
  gameOverBanner
    .querySelector("button")
    .addEventListener("click", () => location.reload());
  document.body.appendChild(gameOverBanner);
};

// ------------------------------------------------Creating Animation Function ---------------------------------------
function animation() {
  animationId = requestAnimationFrame(animation);

  context.clearRect(0, 0, canvas.width, canvas.height);

  prabh.draw();

  // Move bullets and drop the ones that left the screen
  for (let i = weapons.length - 1; i >= 0; i--) {
    const weapon = weapons[i];
    weapon.update();
    if (weapon.isOffScreen()) weapons.splice(i, 1);
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    enemy.update();

    // Enemy reached the player
    if (enemy.collidesWith(prabh)) {
      gameOver();
      return;
    }

    // Enemy hit by a bullet
    for (let j = weapons.length - 1; j >= 0; j--) {
      if (enemy.collidesWith(weapons[j])) {
        weapons.splice(j, 1);

        // Big enemies shrink first, small ones are destroyed
        if (enemy.radius > 18) {
          enemy.radius -= 10;
          score += 10;
          sounds.hit();
        } else {
          enemies.splice(i, 1);
          score += 25;
          sounds.destroy();
        }
        updateScore();
        break;
      }
    }
  }
}

// --------------------------------------Adding Event Listeners----------------------------------

// Difficulty form (submit also covers pressing Enter)
form.addEventListener("submit", (e) => {
  e.preventDefault();
  initAudio();

  form.style.display = "none";
  scoreBoard.style.display = "block";

  const userValue = document.getElementById("difficulty").value;
  const settings = DIFFICULTIES[userValue] || DIFFICULTIES.Easy;
  difficulty = settings.speed;

  clearInterval(spawnTimer);
  spawnTimer = setInterval(spawnEnemy, settings.spawnRate);
  animation();
});

// Light weapon aka left click
canvas.addEventListener("click", (e) => {
  if (!spawnTimer) return; // game hasn't started

  // Convert the click from page coordinates to canvas coordinates
  const rect = canvas.getBoundingClientRect();
  const clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
  const clickY = (e.clientY - rect.top) * (canvas.height / rect.height);

  const myAngle = Math.atan2(
    clickY - playerPosition.y,
    clickX - playerPosition.x
  );
  const velocity = {
    x: Math.cos(myAngle) * WEAPON_SPEED,
    y: Math.sin(myAngle) * WEAPON_SPEED,
  };

  weapons.push(
    new Weapon(playerPosition.x, playerPosition.y, 6, "white", velocity)
  );
  sounds.shoot();
});
