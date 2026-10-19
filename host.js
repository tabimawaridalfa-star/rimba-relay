import { Network } from "./network.js";
import { $, roster, ranking } from "./ui.js";
import { createGame, levels } from "./game.js";
const net = new Network();
let players = {},
  presence = {},
  game,
  phase = "lobby",
  roomReady = false,
  snapshot = {};
const session = {
  level: 0,
  lives: 5,
  scores: {},
  roster: {},
  presence,
  offline: false,
  musicEnabled: true,
  error: (message) => error(new Error(message)),
  hud: renderHUD,
  end: finish,
};
function error(e) {
  $("#error").textContent =
    `${e.message}\nPeriksa config.js, Anonymous Auth, serta aturan Firebase (README.md).`;
  $("#connection").textContent = `Masalah: ${e.message}`;
}
net.onError = error;
// Hanya kanal musik yang dibisukan; efek suara tetap aktif.
$("#music-toggle").onclick = () => {
  session.musicEnabled = !session.musicEnabled;
  session.scene?.sound.get("music")?.setMute(!session.musicEnabled);
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
  $("#level-label").textContent =
    `${session.level + 1} / 3 · ${levels[session.level].name}`;
  $("#lives").textContent = `♥ ${session.lives} / 5`;
  roster($("#hud-players"), session.roster, session.scores);
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
          ? `${champions} jadi juara!`
          : "Satu langkah lebih dekat.";
    $("#result-copy").textContent =
      type === "gameover"
        ? "Ulang level ini dengan 5 nyawa. Skor kembali ke awal level."
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
$("#start").onclick = async () => {
  $("#start").disabled = true;
  try {
    // Klik host membuka audio sebelum file suara selesai dimuat.
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!session.audio && Audio) session.audio = new Audio();
    await session.audio?.resume();
    session.roster = structuredClone(players);
    session.scores = Object.fromEntries(
      Object.keys(players).map((id) => [id, 0]),
    );
    session.level = 0;
    session.lives = 5;
    snapshot = { ...session.scores };
    await setPhase("playing");
    $("#lobby").hidden = true;
    $("#game-screen").hidden = false;
    if (game) session.scene.scene.restart();
    else game = createGame(session);
  } catch (e) {
    error(e);
    renderLobby();
  }
};
$("#continue").onclick = async () => {
  $("#continue").disabled = true;
  try {
    if (phase === "ending") {
      await setPhase("lobby");
      $("#overlay").hidden = true;
      $("#game-screen").hidden = true;
      $("#lobby").hidden = false;
      renderLobby();
      return;
    }
    if (phase === "gameover") {
      session.scores = { ...snapshot };
      session.lives = 5;
    } else {
      session.level++;
      snapshot = { ...session.scores };
    }
    await setPhase("playing");
    $("#overlay").hidden = true;
    session.scene.scene.restart();
  } catch (e) {
    error(e);
  } finally {
    $("#continue").disabled = false;
  }
};
try {
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
    session.inputs = value || {};
    for (const p of session.scene?.members || [])
      p.receive(value?.[p.id] || {});
  });
  session.ready = () => {
    net.publish({ level: session.level + 1 }).catch(error);
  };
  renderLobby();
} catch (e) {
  error(e);
}
