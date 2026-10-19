import { firebaseConfig } from "./config.js";
import { initializeApp } from "./vendor/firebase-app.js";
import { getAuth, signInAnonymously } from "./vendor/firebase-auth.js";
import {
  getDatabase,
  ref,
  get,
  set,
  update,
  onValue,
  runTransaction,
  onDisconnect,
} from "./vendor/firebase-database.js";

export const colors = ["beige", "green", "pink", "purple", "yellow"];
export const neutral = () => ({ left: false, right: false, jump: false });
export class Network {
  async connect(onConnection = () => {}) {
    this.app = initializeApp(firebaseConfig);
    this.db = getDatabase(this.app);
    this.uid = (await signInAnonymously(getAuth(this.app))).user.uid;
    this.stops = [];
    this.stops.push(
      onValue(ref(this.db, ".info/connected"), async (snap) => {
        this.online = snap.val() === true;
        onConnection(this.online);
        if (this.online && this.presence)
          await this.armPresence().catch(console.error);
      }),
    );
  }
  path(suffix = "") {
    return ref(this.db, `rooms/${this.code}${suffix ? "/" + suffix : ""}`);
  }
  async createRoom() {
    for (let i = 0; i < 12; i++) {
      this.code = Array.from(
        crypto.getRandomValues(new Uint8Array(4)),
        (n) => "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[n % 26],
      ).join("");
      const offset = crypto.getRandomValues(new Uint8Array(1))[0] % 5;
      const palette = colors.map((_, index) => colors[(index + offset) % 5]);
      const result = await runTransaction(this.path(), (old) =>
        old
          ? undefined
          : {
              host: this.uid,
              createdAt: Date.now(),
              phase: "lobby",
              hostOnline: true,
              palette,
            },
      );
      if (result.committed) {
        this.presence = "hostOnline";
        await this.armPresence();
        return this.code;
      }
    }
    throw new Error("Gagal membuat kode unik. Coba lagi.");
  }
  async join(code, name) {
    if (!name.trim()) throw new Error("Isi nama pemain terlebih dahulu.");
    this.code = code.toUpperCase();
    const room = (await get(this.path())).val();
    if (!room) throw new Error("Room tidak ditemukan. Periksa kode.");
    let slot = -1;
    for (let i = 0; i < 4; i++) if (room.slots?.[i]?.uid === this.uid) slot = i;
    if (slot < 0 && room.phase !== "lobby")
      throw new Error("Permainan sudah dimulai. Tunggu lobi berikutnya.");
    if (slot < 0) {
      for (let i = 0; i < 4; i++) {
        const result = await runTransaction(this.path(`slots/${i}`), (old) =>
          old
            ? undefined
            : {
                uid: this.uid,
                name: name.trim().slice(0, 16),
                color: room.palette[i],
              },
        );
        if (result.committed) {
          slot = i;
          break;
        }
      }
    }
    if (slot < 0) throw new Error("Room penuh (maksimal 4 pemain).");
    this.slot = slot;
    this.presence = `presence/${slot}`;
    await set(this.path(`inputs/${slot}`), {
      ...neutral(),
      seq: 0,
      jumpSeq: 0,
    });
    await this.armPresence();
    return { slot, ...(await get(this.path(`slots/${slot}`))).val() };
  }
  async armPresence() {
    await onDisconnect(this.path(this.presence)).set(false);
    if (this.slot !== undefined) {
      const input = this.path(`inputs/${this.slot}`);
      await onDisconnect(input).set({ ...neutral(), seq: 0, jumpSeq: 0 });
      await set(input, { ...neutral(), seq: 0, jumpSeq: 0 });
    }
    await set(this.path(this.presence), true);
  }
  watch(path, fn) {
    const stop = onValue(
      this.path(path),
      (s) => fn(s.val()),
      (e) => this.onError?.(e),
    );
    this.stops.push(stop);
    return stop;
  }
  input(value) {
    if (!this.online) return Promise.resolve();
    return set(this.path(`inputs/${this.slot}`), value);
  }
  publish(value) {
    return update(this.path(), value);
  }
  async close() {
    if (this.code) await set(this.path(this.presence), false);
    this.stops.forEach((stop) => stop());
  }
}
