import { freshStats, copyStats } from './stats.js';
import { readVolumes, currentMusic } from './audio.js';
import { bindSound, renderAwards, renderProgress } from './host-polish.js';
import { leaderSlot, validAction } from "./remote.js";
import { Network } from "./network.js";
import { $, roster, ranking } from "./ui.js";
import { createGame, levels } from "./game.js";
import { localTestOptions, prepareLocalScene } from "./local-test.js";
const localStart = localTestOptions(new URL(location.href));
const net = localStart ? {online:true, publish:async()=>{}} : new Network();
let previousLives = 0;
let busy = false, prepared = false, pausedAt = 0;
const commandSeq = {};
const watchedAudio = new WeakSet();
let players = {},
  presence = {},
  game,
  phase = "lobby",
  roomReady = false,
  snapshot = {}, statsSnapshot = {};
const session = {
  level: 0,
  lives: 0,
  maxLives: 0,
  checkpoint: null,
  scores: {},
  stats: {}, volumes:readVolumes(),
  roster: {},
  presence,
  offline: false,
  musicEnabled: true,
  error: (message) => error(new Error(message)),
  hud: renderHUD,
  end: finish,
};
bindSound(session);
function error(e) {
  $("#error").textContent =
    `${e.message}\nPeriksa config.js, Anonymous Auth, serta aturan Firebase (README.md).`;
  $("#connection").textContent = `Masalah: ${e.message}`;
}
net.onError = error;
// Sembunyikan berdasarkan keberhasilan browser, bukan hanya klik tombol.
function updatePrepareReminder() {
  const audio = game?.sound.context || session.audio;
  if (audio && !watchedAudio.has(audio)) {
    watchedAudio.add(audio);
    audio.addEventListener("statechange", updatePrepareReminder);
  }
  if (audio?.state === "running") prepared = true;
  $("#prepare-reminder").hidden = phase === "lobby" || prepared || !!document.fullscreenElement;
}
// Kedua permintaan dimulai pada klik yang sama, sebelum await jaringan.
function unlockAudio() {
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (game?.sound.context) session.audio = game.sound.context;
  if (!session.audio && Audio) session.audio = new Audio();
  updatePrepareReminder();
  return (session.audio?.resume() || Promise.resolve()).then(updatePrepareReminder);
}
async function fullscreen() {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
  } catch {
    $("#screen-hint").textContent = "Layar penuh tidak tersedia; gunakan F11. Audio tetap bisa dipakai.";
  }
}
$("#prepare-screen").onclick = () => {
  const audio = unlockAudio();
  const screen = document.fullscreenElement ? Promise.resolve() : fullscreen();
  Promise.all([audio, screen]).catch(error);
};
$("#prepare-reminder").onclick = () => $("#prepare-screen").click();
$("#fullscreen-toggle").onclick = fullscreen;
document.addEventListener("fullscreenchange", () => {
  $("#fullscreen-toggle").textContent = document.fullscreenElement ? "Keluar layar penuh" : "Layar penuh";
  game?.scale.refresh();
  updatePrepareReminder();
});
function fitGame() {
  if (!game) return;
  const box = $("#game").getBoundingClientRect();
  game.scale.setParentSize(box.width, box.height);
  game.scale.refresh();
  const canvas = game.canvas.getBoundingClientRect();
  const screen = $("#game-screen").getBoundingClientRect();
  $("#lives").style.left = (canvas.left - screen.left + 24) + "px";
  $("#lives").style.top = (canvas.top - screen.top + 24) + "px";
}
new ResizeObserver(fitGame).observe($("#game"));
window.addEventListener("resize", fitGame);
// Hanya kanal musik yang dibisukan; efek suara tetap aktif.
$("#music-toggle").onclick = () => {
  session.musicEnabled = !session.musicEnabled;
  currentMusic(session.scene)?.setMute(!session.musicEnabled);
  $("#music-toggle").textContent = session.musicEnabled ? "Musik: nyala" : "Musik: mati";
  $("#music-toggle").setAttribute("aria-pressed", String(session.musicEnabled));
};
function renderLobby() {
  roster($("#players"), players, {}, presence);
  $("#player-count").textContent = Object.keys(players).length;
  $("#start").disabled =
    !roomReady ||
    !net.online ||
    !Object.keys(players).some((id) => presence[id]);
}
function renderHUD() {
  renderProgress(session,levels[session.level]);
  $("#level-label").textContent =
    `${session.level + 1} / 3 · ${levels[session.level].name}`;
  const hearts = $("#lives");
  if (hearts.children.length !== session.maxLives) {
    hearts.replaceChildren();
    for (let i = 0; i < session.maxLives; i++) {
      const img = document.createElement("img");
      img.alt = ""; img.className = "life-heart";
      hearts.append(img);
    }
  }
  hearts.style.gridTemplateColumns = `repeat(${session.maxLives > 6 ? 4 : session.maxLives}, 32px)`;
  hearts.setAttribute("aria-label", `${session.lives} dari ${session.maxLives} nyawa`);
  [...hearts.children].forEach((img, i) => {
    img.src = "assets/Sprites/Tiles/Default/" + (i < session.lives ? "hud_heart.png" : "hud_heart_empty.png");
    if (i >= session.lives && i < previousLives) {
      img.animate([{transform:"scale(1)"},{transform:"scale(1.25) rotate(-12deg)"},{transform:"rotate(12deg)"},{transform:"scale(1)"}], {duration:360});
    }
  });
  previousLives = session.lives;
  roster($("#hud-players"), session.roster, session.scores);
  const buffs = $("#buff-hud"); buffs.replaceChildren();
  for (const p of session.scene?.members || []) {
    for (const [key, icon, name] of [["starUntil","star","Kebal"],["isBig","mushroom_red","Super Mushroom"]]) {
      const mushroom = key === "isBig";
      const left = Math.ceil((p[key] - session.scene.playTime) / 1000);
      if (mushroom ? !p.isBig && !p.growthPending : left <= 0) continue;
      const badge = document.createElement("span"), img = document.createElement("img");
      img.src = "assets/Sprites/Tiles/Default/" + icon + ".png"; img.alt = name;
      badge.append(img, document.createTextNode(p.dataInfo.name + " · " + (mushroom ? (p.isBig ? "Besar" : "Menunggu ruang") : left + " dtk"))); buffs.append(badge);
    }
  }
}
async function setPhase(value) {
  phase = value;
  await net.publish({ phase: value });
}
async function finish(type, winner) {
  try {
    const ending = type === "complete" && session.level === 2;
    await setPhase(
      type === "gameover" ? "gameover" : ending ? "ending" : "between",
    );
    $("#pause-options").hidden = true;
    $('#awards').hidden=!ending;$('#ranking').hidden=ending;$('#overlay').classList.toggle('awards-ending',ending);
    if(ending)renderAwards($('#awards'),session);
    $("#ending-credits").hidden = !ending;
    $("#result-label").textContent =
      type === "gameover"
        ? "COBA LAGI BERSAMA"
        : ending
          ? "PETUALANGAN SELESAI"
          : `LEVEL ${session.level + 1} SELESAI`;
    const max = Math.max(...Object.values(session.scores));
    const champions = Object.keys(session.scores)
      .filter((id) => session.scores[id] === max)
      .map((id) => session.roster[id].name)
      .join(" & ");
    $("#result-title").textContent =
      type === "gameover"
        ? "Tim butuh napas baru."
        : ending
          ? (Object.keys(session.roster).length===1 ? "Petualangan selesai!" : `${champions} jadi juara!`)
          : "Satu langkah lebih dekat.";
    $("#result-copy").textContent =
      type === "gameover"
        ? `Ulang dengan ${session.maxLives} nyawa dari ${session.checkpoint ? "checkpoint terakhir" : "awal level"}. Skor kembali ke titik tersebut.`
        : `${winner} mencapai bendera pertama (+100). Ini skor total tim sejauh ini.`;
    ranking($("#ranking"), session.roster, session.scores);
    $("#continue").textContent =
      type === "gameover"
        ? "Ulang level →"
        : ending
          ? "Main Lagi →"
          : "Lanjut level →";
    $("#overlay").hidden = false;
  } catch (e) {
    error(e);
  }
}
// Tombol host dan perintah HP memakai jalur aksi yang sama.
function clearInputs() {
  session.inputs = {};
  for (const p of session.scene?.members || []) {
    p.controls = {}; p.bufferUntil = -999;
  }
}
function showPause() {
  $('#awards').hidden=true;$('#ranking').hidden=false;$('#overlay').classList.remove('awards-ending');
  $("#ending-credits").hidden = true;
  $("#result-label").textContent = "JEDA";
  $("#result-title").textContent = "Petualangan dijeda";
  $("#result-copy").textContent = "Lanjutkan dari HP pemimpin atau tombol di layar ini.";
  ranking($("#ranking"), session.roster, session.scores);
  $("#continue").textContent = "Lanjut";
  $("#pause-options").hidden = false;
  $("#overlay").hidden = false;
}
async function performAction(action) {
  if (busy || !net.online || !validAction(phase, action)) return;
  if (action === "start" && (!roomReady || leaderSlot(players, presence) === null)) return;
  if (action === "pause" && (!session.scene?.members || session.scene.finished)) return;
  busy = true;
  try {
    if (action === "start") {
      session.roster = structuredClone(players);
      session.scores = Object.fromEntries(Object.keys(players).map(id => [id, 0]));
      session.stats=freshStats(players);statsSnapshot=copyStats(session.stats);
      session.level = localStart?.level ?? 0; session.maxLives = 4 + Object.keys(session.roster).length;
      session.lives = session.maxLives; session.checkpoint = null; snapshot = { ...session.scores };
      clearInputs();
      await setPhase("playing");
      document.body.classList.add("playing");
      $("#lobby").hidden = true; $("#game-screen").hidden = false;
      updatePrepareReminder();
      if (game) session.scene.scene.restart(); else game = createGame(session);
      requestAnimationFrame(fitGame);
    } else if (action === "pause") {
      clearInputs();
      pausedAt = session.scene.time.now;
      session.scene.scene.pause();
      session.scene.sound.pauseAll();
      await setPhase("paused");
      showPause();
    } else if (action === "resume") {
      clearInputs();
      await setPhase("playing");
      // Deadline pemain memakai waktu absolut; geser agar jeda tidak menghabiskannya.
      const elapsed = Math.max(0, game.loop.time - pausedAt);
      for (const p of session.scene.members) {
        for (const key of ["lastGround", "invincibleUntil", "behindSince"])
          if (p[key] > 0) p[key] += elapsed;
      }
      session.scene.scene.resume();
      session.scene.sound.resumeAll();
      $("#overlay").hidden = true;
    } else if (action === "lobby" || action === "again") {
      clearInputs();
      session.stats=freshStats(session.roster);
      session.scene.sound.stopAll();
      session.scene.scene.stop();
      await setPhase("lobby");
      $("#overlay").hidden = true; $("#game-screen").hidden = true;
      $("#lobby").hidden = false; document.body.classList.remove("playing");
      $("#prepare-reminder").hidden = true;
    } else {
      clearInputs();
      if (action === "restart") { session.scores = { ...(session.checkpoint?.scores || snapshot) }; session.lives = session.maxLives; session.stats=copyStats(session.checkpoint?.stats || statsSnapshot); }
      else { session.level++; session.checkpoint = null; snapshot = { ...session.scores }; statsSnapshot=copyStats(session.stats); }
      session.scene.sound.stopAll();
      await setPhase("playing");
      $("#overlay").hidden = true;
      session.scene.scene.restart();
    }
  } catch (e) { error(e); }
  finally { busy = false; renderLobby(); }
}
$("#start").onclick = () => { unlockAudio().catch(error); void performAction("start"); };
$("#pause").onclick = () => performAction("pause");
$("#continue").onclick = () => performAction(({paused:"resume",gameover:"restart",between:"next",ending:"again"})[phase]);
$("#restart-level").onclick = () => performAction("restart");
$("#back-lobby").onclick = () => performAction("lobby");
if (localStart) {
  players={0:{name:"Uji lokal",color:"green"}};presence={0:true};session.presence=presence;
  roomReady=true;
  $("#connection").textContent="Uji lokal · ← → bergerak · Spasi/↑ lompat · tanpa Firebase";
  session.ready=()=>{prepareLocalScene(session.scene,localStart);updatePrepareReminder();};
  await performAction("start");
} else try {
  await net.connect((online) => {
    session.offline = !online;
    $("#connection").textContent = online
      ? "● Terhubung"
      : "○ Terputus · game dijeda";
    renderLobby();
  });
  const code = await net.createRoom();
  roomReady = true;
  $("#room-code").textContent = code;
  const url = new URL("controller.html", location.href);
  url.searchParams.set("room", code);
  const qr = qrcode(0, "M");
  qr.addData(url.href);
  qr.make();
  $("#qr").innerHTML = qr.createImgTag(4, 0, "QR controller");
  $("#controller-link").href = url.href;
  $("#url-hint").textContent = url.href;
  if (["localhost", "127.0.0.1"].includes(location.hostname))
    $("#url-hint").textContent +=
      " — Untuk HP, buka host lewat alamat IP LAN laptop lalu scan QR baru.";
  net.watch("slots", (value) => {
    players = value || {};
    renderLobby();
  });
  net.watch("presence", (value) => {
    presence = value || {};
    session.presence = presence;
    renderLobby();
  });
  net.watch("inputs", (value) => {
    if (phase !== "playing") {
      for (const p of session.scene?.members || []) p.lastJumpSeq = value?.[p.id]?.jumpSeq || 0;
      clearInputs(); return;
    }
    session.inputs = value || {};
    for (const p of session.scene?.members || [])
      p.receive(value?.[p.id] || {});
  });
  net.watch("commands", value => {
    for (const [slot, command] of Object.entries(value || {})) {
      if (!Number.isFinite(command?.seq) || command.seq <= (commandSeq[slot] ?? -1)) continue;
      // Konsumsi juga perintah tidak sah agar tidak diputar ulang saat pemimpin berubah.
      commandSeq[slot] = command.seq;
      if (slot === leaderSlot(players, presence) && validAction(phase, command.action))
        void performAction(command.action);
    }
  });
  session.ready = () => {
    updatePrepareReminder();
    net.publish({ level: session.level + 1 }).catch(error);
  };
  renderLobby();
} catch (e) {
  error(e);
}
