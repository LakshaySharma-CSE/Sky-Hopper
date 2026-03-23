var canvas = document.getElementById("gameCanvas");
var ctx = canvas.getContext("2d");

// Logical resolution — game always renders at this size, CSS scales it
var W = 900;
var H = 394;
canvas.width = W;
canvas.height = H;

// States: "waiting" | "playing" | "dead"
var state = "waiting";
var bird, obstacles, frameNo;
var highScore = parseInt(localStorage.getItem("skyHS")) || 0;

// Stars
var stars = [];
for (var i = 0; i < 110; i++) {
  stars.push({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 1.6 + 0.3,
    speed: Math.random() * 0.6 + 0.1,
    a: Math.random() * 0.6 + 0.3,
  });
}

function resetGame() {
  bird = { x: 100, y: H / 2, w: 32, h: 32, vy: 0, gravity: 0.13 };
  obstacles = [];
  frameNo = 0;
}

// ── Loop ──
function loop() {
  update();
  draw();
}

function update() {
  if (state !== "playing") return;

  bird.vy += bird.gravity;
  bird.y += bird.vy;

  if (bird.y < 0) {
    bird.y = 0;
    bird.vy = 0;
  }
  if (bird.y + bird.h >= H) {
    bird.y = H - bird.h;
    die();
    return;
  }

  frameNo++;

  // spawn pipes
  if (frameNo === 1 || frameNo % 130 === 0) {
    var topH = Math.floor(Math.random() * (H * 0.42)) + H * 0.09;
    var gap = Math.floor(Math.random() * 70) + 115;
    obstacles.push({ x: W + 16, w: 28, topH: topH, botY: topH + gap });
  }

  for (var i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].x -= 3;
    if (obstacles[i].x + obstacles[i].w < 0) {
      obstacles.splice(i, 1);
      continue;
    }
    if (hits(bird, obstacles[i])) {
      die();
      return;
    }
  }

  for (var j = 0; j < stars.length; j++) {
    stars[j].x -= stars[j].speed;
    if (stars[j].x < 0) stars[j].x = W;
  }
}

function hits(b, o) {
  var bx = b.x + 5,
    by = b.y + 5,
    bw = b.w - 10,
    bh = b.h - 10;
  return bx + bw > o.x && bx < o.x + o.w && (by < o.topH || by + bh > o.botY);
}

function die() {
  state = "dead";
  if (frameNo > highScore) {
    highScore = frameNo;
    localStorage.setItem("skyHS", highScore);
  }
}

// ── Draw ──
function draw() {
  var bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#060612");
  bg.addColorStop(1, "#0c0c22");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // stars
  for (var i = 0; i < stars.length; i++) {
    var s = stars[i];
    ctx.globalAlpha = s.a;
    ctx.fillStyle = "#c8e0ff";
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // subtle ground line
  ctx.strokeStyle = "rgba(0,245,255,0.07)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, H - 1);
  ctx.lineTo(W, H - 1);
  ctx.stroke();

  for (var i = 0; i < obstacles.length; i++) drawPipe(obstacles[i]);
  drawBird();

  // HUD
  ctx.font = "bold 16px Orbitron, Arial";
  ctx.textAlign = "left";
  ctx.fillStyle = "#00f5ff";
  ctx.shadowColor = "#00f5ff";
  ctx.shadowBlur = 10;
  ctx.fillText("SCORE  " + frameNo, 18, 32);
  ctx.textAlign = "right";
  ctx.fillStyle = "#ff2d78";
  ctx.shadowColor = "#ff2d78";
  ctx.fillText("BEST  " + highScore, W - 18, 32);
  ctx.shadowBlur = 0;
  ctx.textAlign = "left";

  if (state === "waiting") drawWaiting();
  if (state === "dead") drawDead();
}

function drawWaiting() {
  ctx.fillStyle = "rgba(6,6,18,0.62)";
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = "center";
  ctx.shadowColor = "#00f5ff";
  ctx.shadowBlur = 24;
  ctx.font = "bold 44px Orbitron, Arial";
  ctx.fillStyle = "#00f5ff";
  ctx.fillText("SKY HOPPER", W / 2, H / 2 - 16);
  ctx.shadowBlur = 0;

  ctx.font = "13px Orbitron, Arial";
  ctx.fillStyle = "rgba(200,224,255,0.42)";
  ctx.fillText("PRESS SPACE · TAP · JUMP TO START", W / 2, H / 2 + 22);
  ctx.textAlign = "left";
}

function drawDead() {
  ctx.fillStyle = "rgba(6,6,18,0.75)";
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = "center";

  // panel
  var pw = 400,
    ph = 148;
  var px = W / 2 - pw / 2,
    py = H / 2 - ph / 2;
  ctx.fillStyle = "rgba(0,0,18,0.82)";
  roundRect(px, py, pw, ph, 12);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,45,120,0.55)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // title
  ctx.font = "bold 40px Orbitron, Arial";
  ctx.fillStyle = "#ff2d78";
  ctx.shadowColor = "#ff2d78";
  ctx.shadowBlur = 22;
  ctx.fillText("GAME OVER", W / 2, H / 2 - 20);
  ctx.shadowBlur = 0;

  // scores
  ctx.font = "14px Orbitron, Arial";
  ctx.fillStyle = "#00f5ff";
  ctx.fillText(
    "Score: " + frameNo + "     Best: " + highScore,
    W / 2,
    H / 2 + 18,
  );

  // hint
  ctx.font = "10px Orbitron, Arial";
  ctx.fillStyle = "rgba(200,224,255,0.35)";
  ctx.fillText("SPACE · JUMP · TAP to play again", W / 2, H / 2 + 50);
  ctx.textAlign = "left";
}

function drawBird() {
  var b = bird;

  // halo
  var grd = ctx.createRadialGradient(
    b.x + b.w / 2,
    b.y + b.h / 2,
    2,
    b.x + b.w / 2,
    b.y + b.h / 2,
    28,
  );
  grd.addColorStop(0, "rgba(0,245,255,0.22)");
  grd.addColorStop(1, "rgba(0,245,255,0)");
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(b.x + b.w / 2, b.y + b.h / 2, 28, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.shadowColor = "#00f5ff";
  ctx.shadowBlur = 15;
  var bg = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
  bg.addColorStop(0, "#7af8ff");
  bg.addColorStop(1, "#0099aa");
  ctx.fillStyle = bg;
  roundRect(b.x, b.y, b.w, b.h, 9);
  ctx.fill();
  ctx.strokeStyle = "#00f5ff";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = "#08081a";
  ctx.beginPath();
  ctx.arc(b.x + b.w - 9, b.y + b.h / 2 - 2, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(b.x + b.w - 8, b.y + b.h / 2 - 3.5, 1.8, 0, Math.PI * 2);
  ctx.fill();
}

function drawPipe(o) {
  ctx.save();
  ctx.shadowColor = "#aaff00";
  ctx.shadowBlur = 12;

  function pipe(x, y, w, h) {
    if (h <= 0) return;
    var g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, "#1a4d1a");
    g.addColorStop(0.35, "#44cc44");
    g.addColorStop(0.7, "#2e8b2e");
    g.addColorStop(1, "#112211");
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "#88ff88";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
  }

  function cap(x, y, w, h) {
    if (h <= 0) return;
    var g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, "#1a4d1a");
    g.addColorStop(0.4, "#55dd55");
    g.addColorStop(1, "#112211");
    ctx.fillStyle = g;
    roundRect(x, y, w, h, 4);
    ctx.fill();
    ctx.strokeStyle = "#aaff88";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  pipe(o.x, 0, o.w, o.topH);
  pipe(o.x, o.botY, o.w, H - o.botY);
  cap(o.x - 5, o.topH - 14, o.w + 10, 14);
  cap(o.x - 5, o.botY, o.w + 10, 14);
  ctx.restore();
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ── Input ──
function jump() {
  if (state === "waiting") {
    state = "playing";
    bird.vy = -4.5;
  } else if (state === "playing") {
    bird.vy = -4.5;
  }
}

function doRestart() {
  resetGame();
  state = "playing";
}

// JUMP button — starts OR jumps OR restarts
function handleJump() {
  if (state === "dead") doRestart();
  else jump();
}

function restartGame() {
  doRestart();
}

document.addEventListener("keydown", function (e) {
  if (e.code !== "Space") return;
  e.preventDefault();
  if (state === "dead") doRestart();
  else jump();
});

canvas.addEventListener("click", function () {
  if (state === "dead") doRestart();
  else jump();
});

canvas.addEventListener(
  "touchstart",
  function (e) {
    e.preventDefault();
    if (state === "dead") doRestart();
    else jump();
  },
  { passive: false },
);

// Boot
resetGame();
setInterval(loop, 20);
