// Basic Environment Setup
const canvas = document.createElement("canvas");
document.querySelector(".myGame").appendChild(canvas);

// It will take over the while width and height of the page
canvas.width = innerWidth;
canvas.height = innerHeight;
const context = canvas.getContext("2d");

let difficulty = 2;
const form = document.querySelector("form");
const scoreBoard = document.querySelector(".scoreBoard");

// Basic Functions

// Event Listener for Difficulty fomr
document.querySelector("input").addEventListener("click", (e) => {
  e.preventDefault(); // prevent from reloading the page

  // Hiding the form
  form.style.display = "none";
  // Showing the scoreBoard
  scoreBoard.style.display = "block";

  // Getting difficulty selected by user
  const userValue = document.getElementById("difficulty").value;
  switch (userValue) {
    case "Easy":
      setInterval(spawnEnemy, 2000);
      return (difficulty = 2);
      break;

    case "Medium":
      setInterval(spawnEnemy, 1400);
      return (difficulty = 3);
      break;

    case "Hard":
      setInterval(spawnEnemy, 1000);
      return (difficulty = 3.5);
      break;

    case "Insane":
      setInterval(spawnEnemy, 700);
      return (difficulty = 4.5);
      break;

    default:
      setInterval(spawnEnemy, 2000);
      return (difficulty = 2);
      break;
  }
});

// ------------------------- Creating Player, Enemy, Weapon, Etc Classes--------------------------------

// Setting player position to center
const playerPosition = {
  x: canvas.width / 2,
  y: canvas.height / 2,
};

// Creating Player Class
class Player {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
  }

  draw() {
    context.beginPath();
    context.arc(
      this.x,
      this.y,
      this.radius,
      (Math.PI / 180) * 0,
      (Math.PI / 180) * 360,
      false
    );
    context.fillStyle = this.color;

    context.fill();
  }
}

// Creating Weapon Class
class Weapon {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
  }

  draw() {
    context.beginPath();
    context.arc(
      this.x,
      this.y,
      this.radius,
      (Math.PI / 180) * 0,
      (Math.PI / 180) * 360,
      false
    );
    context.fillStyle = this.color;
    context.fill();
  }

  update() {
    this.draw();
    (this.x += this.velocity.x), (this.y += this.velocity.y);
  }
}

// Creating Enemy Class
class Enemy {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
  }

  draw() {
    context.beginPath();
    context.arc(
      this.x,
      this.y,
      this.radius,
      (Math.PI / 180) * 0,
      (Math.PI / 180) * 360,
      false
    );
    context.fillStyle = this.color;
    context.fill();
  }

  update() {
    this.draw();
    (this.x += this.velocity.x), (this.y += this.velocity.y);
  }
}

// -----------------------------------------Main Logic Start here--------------------------------------------

// Creating Player Object, Weapons Array, Enemies Array, Etc Array
const prabh = new Player(playerPosition.x, playerPosition.y, 15, "white");

const weapons = [];
const enemies = [];

// -------------------------------Function To Spawn Enemy At Random Location-----------------------------
const spawnEnemy = () => {
  // generating random for enemy
  const enemySize = Math.random() * (40 - 5) + 5; // between 40 and 5

  // generating random color for enemy
  const enemyColor = `rgb(${Math.random() * 250},${Math.random() * 250},${
    Math.random() * 250
  })`;

  // random is Enemy Spawn position
  let random;

  // Making enemy location randombut but only from outside of screen
  if (Math.random() < 0.5) {
    // Making X equal to very left off of the screen or very right off of the screen and setting Y to any where vertically
    random = {
      x: Math.random() < 0.5 ? canvas.width + enemySize : 0 - enemySize,
      y: Math.random() * canvas.height,
    };
  } else {
    // Making Y equal to very up off of the screen or very down off of the screen and setting X to any where horizontally
    random = {
      x: Math.random() * canvas.width,
      y: Math.random() < 0.5 ? canvas.height + enemySize : 0 - enemySize,
    };
  }

  // Finding Angle between center (means Player Position) and enemy position
  const myAngle = Math.atan2(
    playerPosition.y - random.y,
    playerPosition.x - random.x
  );

  // Making velocity or speed of enemy by multipling chosen difficulty to radian
  const velocity = {
    x: Math.cos(myAngle) * difficulty,
    y: Math.sin(myAngle) * difficulty,
  };

  // Adding enemy to enemies array
  enemies.push(new Enemy(random.x, random.y, enemySize, enemyColor, velocity));
};

// ------------------------------------------------Creating Animation Function ---------------------------------------
function animaton() {
  // Making Recursion
  requestAnimationFrame(animaton);

  // Clearing canvas on each frame
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Drawing Player
  prabh.draw();

  //   Generating Bullets
  weapons.forEach((weapon) => {
    weapon.update();
  });

  //  Generating enemies
  enemies.forEach((enemy) => {
    enemy.update();
  });
}
// --------------------------------------Adding Event Listeners----------------------------------

// event Listener for Light Weapon aka left click
canvas.addEventListener("click", (e) => {
  // finding angle between player position(center) and click co-ordinates
  const myAngle = Math.atan2(
    e.clientY - playerPosition.y,
    e.clientX - playerPosition.x
  );

  // Making const speed for light weapon
  const velocity = { x: Math.cos(myAngle) * 2, y: Math.sin(myAngle) * 2 };

  // Adding light weapon in weapons array
  weapons.push(
    new Weapon(playerPosition.x, playerPosition.y, 6, "white", velocity)
  );
});

animaton();
