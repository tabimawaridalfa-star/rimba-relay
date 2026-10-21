import { leaderSlot, actionsByPhase } from "./remote.js";
import { Network, neutral } from "./network.js";
import { $, roster } from "./ui.js";
const net = new Network();
let state = neutral(),
  seq = 0,
  jumpSeq = 0,
  ready = false,
  phase = "lobby",
  hostOnline = false,
  wake;
const pointers = new Map();
let slots = {}, presence = {}, sending = false;
$("#room").value =
  new URLSearchParams(location.search).get("room")?.toUpperCase() || "";
try { $("#name").value = localStorage.getItem("rimba-name") || ""; } catch {}
const error = (e) => {
  const message = `${e.message}\nPeriksa koneksi, config.js, Anonymous Auth, dan aturan database.`;
  $("#error").textContent = message;
  $("#controller-status").textContent = message;
};
net.onError = error;
function status() {
  renderRemote();
  $("#controller-status").textContent = !net.online
    ? "Koneksi putus · menyambung…"
    : !hostOnline
      ? "Host tidak terhubung"
      : {
          lobby: "Lobi",
          paused: "Permainan dijeda",
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
  paintControls();
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
async function prepareControllerScreen() {
  try {
    const standalone = navigator.standalone || matchMedia("(display-mode: fullscreen)").matches || matchMedia("(display-mode: standalone)").matches;
    if (!document.fullscreenElement && !standalone) {
      if (!document.documentElement.requestFullscreen) throw new Error("unsupported");
      await document.documentElement.requestFullscreen();
    }
    if (screen.orientation?.lock) await screen.orientation.lock("landscape");
    else throw new Error("unsupported");
  } catch {
    $("#install-hint").hidden = false;
  }
}
$("#join-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  void prepareControllerScreen();
  $("#join-button").disabled = true;
  $("#error").textContent = "";
  try {
    if (!net.uid)
      await net.connect(() => {
        reset();
        status();
      });
    const player = await net.join($("#room").value.trim(), $("#name").value);
    try { localStorage.setItem("rimba-name", player.name); } catch {}
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
    net.watch("slots", value => { slots = value || {}; renderRemote(); });
    net.watch("presence", value => { presence = value || {}; renderRemote(); });
    await keepAwake();
  } catch (e) {
    error(e);
  } finally {
    $("#join-button").disabled = false;
  }
});
const directionPad=$('#direction-pad'), jumpPad=$('#jump-pad');
function directionAt(x, previous) {
  const box=directionPad.querySelector('.direction-visual').getBoundingClientRect();
  const ratio=(x-box.left)/box.width;
  if(previous==='left'&&ratio<.465)return 'left';
  if(previous==='right'&&ratio>.535)return 'right';
  return ratio<.445?'left':ratio>.555?'right':null;
}
function paintControls() {
  directionPad.querySelectorAll('[data-side]').forEach(el=>el.classList.toggle('pressed',state[el.dataset.side]));
  jumpPad.classList.toggle('pressed',state.jump);
}
function applyPointers() {
  const held=[...pointers.values()],direction=held.find(p=>p.kind==='direction')?.action;
  const next={left:direction==='left',right:direction==='right',jump:held.some(p=>p.kind==='jump')};
  if(next.left===state.left&&next.right===state.right&&next.jump===state.jump)return;
  if(next.jump&&!state.jump){jumpSeq++;navigator.vibrate?.(18);}
  else if((next.left!==state.left||next.right!==state.right)&&(next.left||next.right))navigator.vibrate?.(9);
  state=next;paintControls();send();
}
for(const [element,kind] of [[directionPad,'direction'],[jumpPad,'jump']]) {
  element.addEventListener('pointerdown',e=>{
    e.preventDefault();
    if(!ready||!net.online||!hostOnline||phase!=='playing')return;
    if(kind==='direction'&&[...pointers.values()].some(p=>p.kind==='direction'))return;
    element.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId,{kind,action:kind==='direction'?directionAt(e.clientX,null):'jump'});
    applyPointers();
  });
  element.addEventListener('pointermove',e=>{
    const held=pointers.get(e.pointerId);
    if(!held||held.kind!=='direction')return;
    held.action=directionAt(e.clientX,held.action);applyPointers();
  });
  const release=e=>{if(pointers.delete(e.pointerId))applyPointers();};
  for(const event of ['pointerup','pointercancel','lostpointercapture'])element.addEventListener(event,release);
}
let swapped=false;
try {swapped=localStorage.getItem('rimba-left-handed')==='true';}catch {}
function showSides(){document.body.classList.toggle('left-handed',swapped);$('#swap-sides').setAttribute('aria-pressed',String(swapped));}
showSides();
$('#swap-sides').onclick=()=>{reset();swapped=!swapped;showSides();try{localStorage.setItem('rimba-left-handed',String(swapped));}catch{}};
window.addEventListener("blur", reset);
window.addEventListener("pagehide", reset);
document.addEventListener("visibilitychange", () => {
  reset();
  if (!document.hidden) keepAwake();
});
document.addEventListener("contextmenu", (e) => e.preventDefault());
document.addEventListener("gesturestart", (e) => e.preventDefault());

const labels = {start:"MULAI",pause:"JEDA",resume:"LANJUT",restart:"ULANG LEVEL",next:"LANJUT",again:"MAIN LAGI",lobby:"KE LOBI"};
function renderRemote() {
  if (!ready) return;
  const leader = leaderSlot(slots, presence);
  const mine = leader === String(net.slot);
  $("#pad").dataset.phase = phase;
  $("#remote-wait").textContent = mine ? "Anda pemimpin" : leader === null ? "Menunggu pemain online" : "Menunggu " + slots[leader].name;
  $("#remote-roster").hidden = phase !== "lobby";
  if (phase === "lobby") roster($("#remote-roster"), slots, {}, presence);
  $("#remote-actions").replaceChildren();
  if (!mine) return;
  for (const action of actionsByPhase[phase] || []) {
    const button = document.createElement("button");
    button.textContent = labels[action]; button.dataset.command = action;
    button.disabled = sending || !net.online || !hostOnline;
    button.onclick = async () => {
      if (sending || leaderSlot(slots, presence) !== String(net.slot)) return;
      navigator.vibrate?.(18); sending = true; renderRemote();
      try { await net.command(action); } catch(e) { error(e); }
      finally { sending = false; renderRemote(); }
    };
    $("#remote-actions").append(button);
  }
}
