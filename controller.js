import { Network, neutral } from "./network.js";
import { $ } from "./ui.js";
const net = new Network();
let state = neutral(),
  seq = 0,
  jumpSeq = 0,
  ready = false,
  phase = "lobby",
  hostOnline = false,
  wake;
const pointers = new Map();
$("#room").value =
  new URLSearchParams(location.search).get("room")?.toUpperCase() || "";
$("#name").value = localStorage.getItem("rimba-name") || "";
const error = (e) => {
  const message = `${e.message}\nPeriksa koneksi, config.js, Anonymous Auth, dan aturan database.`;
  $("#error").textContent = message;
  $("#controller-status").textContent = message;
};
net.onError = error;
function status() {
  $("#controller-status").textContent = !net.online
    ? "Koneksi putus · menyambung…"
    : !hostOnline
      ? "Host tidak terhubung"
      : {
          lobby: "Menunggu host…",
          playing: "Ayo, bawa tim ke bendera!",
          between: "Level selesai!",
          gameover: "Nyawa habis · tunggu host",
          ending: "Petualangan selesai!",
        }[phase] || "Menunggu host…";
}
function send() {
  if (ready) net.input({ ...state, seq: ++seq, jumpSeq }).catch(error);
}
function reset() {
  const changed = Object.values(state).some(Boolean);
  state = neutral();
  pointers.clear();
  document
    .querySelectorAll(".control")
    .forEach((b) => b.classList.remove("pressed"));
  if (changed) send();
}
async function keepAwake() {
  try {
    if ("wakeLock" in navigator && document.visibilityState === "visible")
      wake = await navigator.wakeLock.request("screen");
  } catch {
    /* Tidak semua browser mendukung Wake Lock. */
  }
}
$("#join-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("#join-button").disabled = true;
  $("#error").textContent = "";
  try {
    if (!net.uid)
      await net.connect(() => {
        reset();
        status();
      });
    const player = await net.join($("#room").value.trim(), $("#name").value);
    localStorage.setItem("rimba-name", player.name);
    ready = true;
    $("#player-name").textContent = player.name;
    $("#room-label").textContent = net.code;
    $("#avatar").src =
      `assets/Sprites/Characters/Default/character_${player.color}_idle.png`;
    $("#join").hidden = true;
    $("#pad").hidden = false;
    net.watch("phase", (value) => {
      phase = value;
      reset();
      status();
    });
    net.watch("hostOnline", (value) => {
      hostOnline = value;
      reset();
      status();
    });
    await keepAwake();
    try {
      await screen.orientation?.lock?.("landscape");
    } catch {
      /* Petunjuk rotasi tetap tersedia. */
    }
  } catch (e) {
    error(e);
  } finally {
    $("#join-button").disabled = false;
  }
});
for (const button of document.querySelectorAll("[data-action]")) {
  button.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (!ready || !net.online || !hostOnline || phase !== "playing") return;
    button.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, button.dataset.action);
    const action = button.dataset.action;
    if (!state[action]) {
      state[action] = true;
      if (action === "jump") {
        jumpSeq++;
        navigator.vibrate?.(18);
      }
      send();
    }
    button.classList.add("pressed");
  });
  const release = (e) => {
    const action = pointers.get(e.pointerId);
    pointers.delete(e.pointerId);
    if (action && !Array.from(pointers.values()).includes(action)) {
      state[action] = false;
      button.classList.remove("pressed");
      send();
    }
  };
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
}
window.addEventListener("blur", reset);
window.addEventListener("pagehide", reset);
document.addEventListener("visibilitychange", () => {
  reset();
  if (!document.hidden) keepAwake();
});
document.addEventListener("contextmenu", (e) => e.preventDefault());
document.addEventListener("gesturestart", (e) => e.preventDefault());
