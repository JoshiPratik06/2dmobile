const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

/* ================== DIFFICULTY ================== */

const difficultySettings = {
  easy: { lanes: 4, maxObstacles: 2, speedIncrement: 0.5, baseSpeed: 2 },
  medium: { lanes: 5, maxObstacles: 3, speedIncrement: 0.75, baseSpeed: 3 },
  hard: { lanes: 6, maxObstacles: 4, speedIncrement: 1.0, baseSpeed: 4 },
};

let currentDifficulty = "medium";
let lanes = difficultySettings[currentDifficulty].lanes;
let maxObstacles = difficultySettings[currentDifficulty].maxObstacles;
let speedIncrement = difficultySettings[currentDifficulty].speedIncrement;
let laneWidth = canvas.width / lanes;
let speed = difficultySettings[currentDifficulty].baseSpeed;

/* ================== PLAYER ================== */

const playerCar = {
  lane: Math.floor(lanes / 2),
  width: 80,
  height: 120,
  x: 0,
  y: canvas.height - 150,
  angle: 0,
  angleTarget: 0,
  collided: false,
};

playerCar.x =
  playerCar.lane * laneWidth + laneWidth / 2 - playerCar.width / 2;

const obstacles = [];
let gameRunning = false;
let paused = false;
let score = 0;

/* ================== TOP SCORES ================== */

let topScores = {
  easy: parseInt(localStorage.getItem("topScore_easy") || "0"),
  medium: parseInt(localStorage.getItem("topScore_medium") || "0"),
  hard: parseInt(localStorage.getItem("topScore_hard") || "0"),
};

function getTopScore() {
  return topScores[currentDifficulty];
}

function setTopScore(newScore) {
  topScores[currentDifficulty] = newScore;
  localStorage.setItem(`topScore_${currentDifficulty}`, newScore);
}

/* ================== DOM ================== */

const difficultySelect = document.getElementById("difficultySelect");
const startButton = document.getElementById("startButton");
const countdownOverlay = document.getElementById("countdownOverlay");
const countdownText = document.getElementById("countdownText");
const pauseOverlay = document.getElementById("pauseOverlay");
const gameOverPopup = document.getElementById("gameOverPopup");
const restartBtn = document.getElementById("restartBtn");

/* ===== MOBILE BUTTONS ===== */
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");

let roadOffset = 0;

/* ================== ASSETS ================== */

const playerCarImg = new Image();
playerCarImg.src = "player_car.png";

const obstacleImages = [
  "obstacle_car.png",
  "van.png",
  "truck.png",
  "police_car.png",
].map((src) => {
  const img = new Image();
  img.src = src;
  return img;
});

const roadTexture = new Image();
roadTexture.src = "road_texture.png";

/* ================== AUDIO ================== */

const bgMusic = new Audio("background_music.mp3");
const engineSound = new Audio("car_engine.mp3");
const crashSound = new Audio("crash_sound.mp3");

bgMusic.loop = true;
engineSound.loop = true;
bgMusic.volume = 0.6;
engineSound.volume = 0.3;

/* ================== SETUP ================== */

function applyDifficulty(difficulty) {
  const settings = difficultySettings[difficulty];
  lanes = settings.lanes;
  maxObstacles = settings.maxObstacles;
  speedIncrement = settings.speedIncrement;
  laneWidth = canvas.width / lanes;
  speed = settings.baseSpeed;

  playerCar.lane = Math.floor(lanes / 2);
  playerCar.x =
    playerCar.lane * laneWidth +
    laneWidth / 2 -
    playerCar.width / 2;
}

difficultySelect.addEventListener("change", () => {
  if (gameRunning) return;
  currentDifficulty = difficultySelect.value;
  applyDifficulty(currentDifficulty);
});

/* ================== START / COUNTDOWN ================== */

startButton.addEventListener("click", () => {
  startButton.style.display = "none";
  startCountdown();
});

function startCountdown() {
  countdownOverlay.classList.add("show");
  const values = ["3", "2", "1", "GO!"];
  let i = 0;

  countdownText.innerText = values[i++];

  const interval = setInterval(() => {
    if (i < values.length) {
      countdownText.innerText = values[i++];
    } else {
      clearInterval(interval);
      countdownOverlay.classList.remove("show");
      startGame();
    }
  }, 1000);
}

function startGame() {
  gameRunning = true;
  paused = false;
  score = 0;
  speed = difficultySettings[currentDifficulty].baseSpeed;

  bgMusic.currentTime = 0;
  engineSound.currentTime = 0;
  bgMusic.play();
  engineSound.play();

  gameOverPopup.classList.remove("show");
  restartBtn.style.display = "none";

  requestAnimationFrame(gameLoop);
}

/* ================== INPUT ================== */

document.addEventListener("keydown", (e) => {
  if (!gameRunning || paused || playerCar.collided) return;

  if (e.key === "ArrowLeft" && playerCar.lane > 0) {
    playerCar.lane--;
    playerCar.angleTarget = -10;
  } else if (e.key === "ArrowRight" && playerCar.lane < lanes - 1) {
    playerCar.lane++;
    playerCar.angleTarget = 10;
  }
});

// Pause
document.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "p" && gameRunning && !playerCar.collided) {
    paused = !paused;
    pauseOverlay.style.display = paused ? "flex" : "none";
    paused ? bgMusic.pause() : bgMusic.play();
    if (!paused) requestAnimationFrame(gameLoop);
  }
});

/* ================== MOBILE INPUT ================== */

function mobileMoveLeft() {
  if (!gameRunning || paused || playerCar.collided) return;
  if (playerCar.lane > 0) {
    playerCar.lane--;
    playerCar.angleTarget = -10;
  }
}

function mobileMoveRight() {
  if (!gameRunning || paused || playerCar.collided) return;
  if (playerCar.lane < lanes - 1) {
    playerCar.lane++;
    playerCar.angleTarget = 10;
  }
}

if (leftBtn && rightBtn) {
  leftBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    mobileMoveLeft();
  });
  rightBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    mobileMoveRight();
  });
}

/* ================== GAME ================== */

function generateObstacle() {
  if (obstacles.length >= maxObstacles) return;

  const lane = Math.floor(Math.random() * lanes);
  const img =
    obstacleImages[Math.floor(Math.random() * obstacleImages.length)];

  obstacles.push({
    x: lane * laneWidth + laneWidth / 2 - 40,
    y: -150,
    width: 80,
    height: 120,
    img,
  });
}

function update() {
  if (!gameRunning || paused || playerCar.collided) return;

  const targetX =
    playerCar.lane * laneWidth +
    laneWidth / 2 -
    playerCar.width / 2;
  playerCar.x += (targetX - playerCar.x) * 0.2;

  roadOffset += speed;
  obstacles.forEach((o) => (o.y += speed));

  for (let o of obstacles) {
    if (
      playerCar.x < o.x + o.width &&
      playerCar.x + playerCar.width > o.x &&
      playerCar.y < o.y + o.height &&
      playerCar.y + playerCar.height > o.y
    ) {
      playerCar.collided = true;
      gameRunning = false;
      bgMusic.pause();
      engineSound.pause();
      crashSound.play();
      showGameOver();
      return;
    }
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    if (obstacles[i].y > canvas.height) {
      obstacles.splice(i, 1);
      score++;
      if (score % 10 === 0) speed += speedIncrement;
    }
  }

  if (Math.random() < 0.05) generateObstacle();
}

/* ================== HUD INSIDE CANVAS ================== */

function drawHUD() {
  ctx.save();

  const isMobile = window.innerWidth <= 768;
  const hudWidth = isMobile ? 220 : 260;
  const hudHeight = isMobile ? 80 : 100;
  const hudX = isMobile ? canvas.width / 2 - hudWidth / 2 : 15;
  const hudY = isMobile ? 30 : 15;

  ctx.fillStyle = "rgba(0,0,0,0.65)";
  ctx.fillRect(hudX, hudY, hudWidth, hudHeight);

  ctx.strokeStyle = "#FFD700";
  ctx.lineWidth = 2;
  ctx.strokeRect(hudX, hudY, hudWidth, hudHeight);

  ctx.fillStyle = "#FFD700";
  ctx.font = isMobile ? "15px Orbitron" : "18px Orbitron";

  ctx.fillText(`Score: ${score}`, hudX + 15, hudY + 30);
  ctx.fillText(`Speed: ${Math.round(speed * 20)} km/h`, hudX + 15, hudY + 55);
  ctx.fillText(
    `Mode: ${currentDifficulty.toUpperCase()}`,
    hudX + 15,
    hudY + (isMobile ? 75 : 85)
  );

  ctx.restore();
}

/* ================== DRAW ================== */

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (roadTexture.complete) {
    for (
      let y = -canvas.height + (roadOffset % canvas.height);
      y < canvas.height;
      y += canvas.height
    ) {
      ctx.drawImage(roadTexture, 0, y, canvas.width, canvas.height);
    }
  }

  ctx.strokeStyle = "#e6e676";
  ctx.lineWidth = 2;
  ctx.shadowBlur = 5;

  for (let i = 1; i < lanes; i++) {
    const x = i * laneWidth;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  ctx.shadowBlur = 0;

  obstacles.forEach((o) =>
    ctx.drawImage(o.img, o.x, o.y, o.width, o.height)
  );

  ctx.save();
  ctx.translate(
    playerCar.x + playerCar.width / 2,
    playerCar.y + playerCar.height / 2
  );
  ctx.rotate((playerCar.angle * Math.PI) / 180);
  ctx.drawImage(
    playerCarImg,
    -playerCar.width / 2,
    -playerCar.height / 2,
    playerCar.width,
    playerCar.height
  );
  ctx.restore();

  drawHUD();
}

/* ================== GAME OVER ================== */

function showGameOver() {
  gameOverPopup.classList.add("show");
  restartBtn.style.display = "block";

  if (score > getTopScore()) {
    setTopScore(score);
  }
}

restartBtn.addEventListener("click", () => {
  gameOverPopup.classList.remove("show");
  restartBtn.style.display = "none";
  resetGame();
});

/* ================== LOOP ================== */

function gameLoop() {
  if (!gameRunning || paused || playerCar.collided) return;
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

/* ================== RESET ================== */

function resetGame() {
  obstacles.length = 0;
  playerCar.collided = false;
  score = 0;
  speed = difficultySettings[currentDifficulty].baseSpeed;

  playerCar.lane = Math.floor(lanes / 2);
  playerCar.x =
    playerCar.lane * laneWidth + laneWidth / 2 - playerCar.width / 2;
  playerCar.angle = 0;
  playerCar.angleTarget = 0;

  startButton.style.display = "block";
}

/* ================== INIT ================== */

applyDifficulty(currentDifficulty);
draw();

