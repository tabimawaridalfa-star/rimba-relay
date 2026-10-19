import { Player } from "./player.js";
import { enemyFrames, makeEnemy, tickEnemies } from "./enemies.js";
import level1 from "./levels/level1.js";
import level2 from "./levels/level2.js";
import level3 from "./levels/level3.js";
import { musicPath } from "./config.js";
export const levels = [level1, level2, level3];
const colors = ["beige", "green", "pink", "purple", "yellow"];
const sounds = [
  "jump",
  "jump-high",
  "coin",
  "gem",
  "hurt",
  "bump",
  "disappear",
  "magic",
  "select",
  "throw",
];
export class Adventure extends Phaser.Scene {
  constructor(session) {
    super("Adventure");
    this.session = session;
  }
  preload() {
    const root = "assets/Sprites/";
    for (const color of colors)
      for (const pose of [
        "idle",
        "walk_a",
        "walk_b",
        "jump",
        "duck",
        "hit",
        "climb_a",
        "climb_b",
      ])
        this.load.image(
          `${color}_${pose}`,
          `${root}Characters/Default/character_${color}_${pose}.png`,
        );
    for (const frames of Object.values(enemyFrames))
      for (const f of frames)
        this.load.image(f, `${root}Enemies/Default/${f}.png`);
    for (const theme of ["grass", "sand", "purple"])
      for (const part of ["block_top", "block_center"])
        this.load.image(
          `${theme}_${part}`,
          `${root}Tiles/Default/terrain_${theme}_${part}.png`,
        );
    for (const tile of [
      "block_plank",
      "coin_gold",
      "flag_green_a",
      "flag_green_b",
      "bush",
      "grass",
      "mushroom_red",
      "sign_right",
    ])
      this.load.image(tile, `${root}Tiles/Default/${tile}.png`);
    for (const bg of ["hills", "desert", "mushrooms"])
      this.load.image(
        bg,
        `${root}Backgrounds/Default/background_color_${bg}.png`,
      );
    for (const s of sounds) this.load.audio(s, `assets/Sounds/sfx_${s}.ogg`);
    if (musicPath && !this.cache.audio.exists("music")) this.load.audio("music", musicPath);
    this.load.on("loaderror", (file) =>
      this.session.error(`Aset gagal dimuat: ${file.url}`),
    );
  }
  create() {
    this.level = levels[this.session.level];
    this.finished = false;
    this.members = [];
    this.cameras.main.setBackgroundColor("#c2e6e8");
    this.add
      .tileSprite(0, 0, 1280, 720, this.level.background)
      .setOrigin(0)
      .setScrollFactor(0)
      .setTileScale(2.82)
      .setDepth(-5);
    this.physics.world.setBounds(0, -300, this.level.width, 1200);
    this.cameras.main.setBounds(0, 0, this.level.width, 720);
    this.ground = this.physics.add.staticGroup();
    for (const [start, end] of this.level.ground) {
      for (let x = start; x < end; x += 64) {
        const w = Math.min(64, end - x);
        const top = this.ground
          .create(x + w / 2, 552, `${this.level.theme}_block_top`)
          .setDisplaySize(w, 64);
        top.refreshBody();
        for (let y = 616; y < 760; y += 64)
          this.add
            .image(x + w / 2, y, `${this.level.theme}_block_center`)
            .setDisplaySize(w, 64);
      }
      for (let x = start + 300; x < end - 100; x += 530)
        this.add
          .image(
            x,
            496,
            this.level.theme === "purple" ? "mushroom_red" : "bush",
          )
          .setDepth(-1);
    }
    for (const [x, y, n] of this.level.platforms)
      for (let i = 0; i < n; i++)
        this.ground.create(x + i * 64, y, "block_plank");
    for (const c of colors)
      if (!this.anims.exists(`${c}_walk`))
        this.anims.create({
          key: `${c}_walk`,
          frames: [{ key: `${c}_walk_a` }, { key: `${c}_walk_b` }],
          frameRate: 9,
          repeat: -1,
        });
    for (const [type, frames] of Object.entries(enemyFrames))
      if (!this.anims.exists(`enemy_${type}`))
        this.anims.create({
          key: `enemy_${type}`,
          frames: frames.map((key) => ({ key })),
          frameRate: 6,
          repeat: -1,
        });
    this.coins = this.physics.add.staticGroup();
    for (const [x, y, n] of this.level.coinRows)
      for (let i = 0; i < n; i++)
        this.coins
          .create(x + i * 55, y, "coin_gold")
          .setScale(0.6)
          .refreshBody();
    this.enemies = this.physics.add.group();
    this.level.enemies.forEach((e) => makeEnemy(this, e));
    this.physics.add.collider(this.enemies, this.ground);
    this.players = this.physics.add.group({ runChildUpdate: false });
    Object.entries(this.session.roster).forEach(([id, data], i) => {
      const p = new Player(
        this,
        id,
        data,
        this.level.spawn.x + i * 62,
        this.level.spawn.y,
      );
      p.lastJumpSeq = this.session.inputs?.[id]?.jumpSeq || 0;
      this.players.add(p);
      p.setDragX(1450).setMaxVelocity(235, 800);
      this.members.push(p);
    });
    this.physics.add.collider(this.players, this.ground);
    // Arcade memisahkan tubuh pemain; tidak ada callback damage antarpemain.
    this.physics.add.collider(this.players, this.players);
    this.physics.add.overlap(this.players, this.coins, (p, c) => {
      if (this.finished || !c.active) return;
      c.disableBody(true, true);
      this.session.scores[p.id] += 10;
      this.sfx("coin");
      this.session.hud();
    });
    this.physics.add.overlap(this.players, this.enemies, (p, e) => {
      if (this.finished || !e.active) return;
      const previousBottom = p.body.prev.y + p.body.height;
      if (p.body.velocity.y > 30 && previousBottom <= e.body.top + 16) {
        e.disableBody(true, true);
        p.setVelocityY(-360);
        this.session.scores[p.id] += 50;
        this.sfx("bump");
        this.session.hud();
      } else this.hurt(p, false);
    });
    this.flag = this.physics.add.staticImage(
      this.level.flag.x,
      this.level.flag.y,
      "flag_green_a",
    );
    if (!this.anims.exists("flag"))
      this.anims.create({
        key: "flag",
        frames: [{ key: "flag_green_a" }, { key: "flag_green_b" }],
        frameRate: 5,
        repeat: -1,
      });
    this.add.sprite(this.flag.x, this.flag.y, "flag_green_a").play("flag");
    this.flag.setVisible(false);
    this.physics.add.overlap(this.flag, this.players, (_flag, p) => {
      if (this.finished) return;
      this.session.scores[p.id] += 100;
      this.sfx("magic");
      this.finish("complete", p.dataInfo.name);
    });
    this.add.image(420, 488, "sign_right");
    this.add.text(
      170,
      285,
      `${String(this.session.level + 1).padStart(2, "0")} / ${this.level.name}`,
      {
        fontFamily: "Arial",
        fontSize: "30px",
        color: "#28494b",
        fontStyle: "bold",
      },
    );
    this.add.text(170, 330, "Koin +10  ·  Musuh +50  ·  Bendera pertama +100", {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#28494b",
    });
    // SoundManager dipakai bersama antarlevel: cukup satu instance musik.
    if (musicPath && this.cache.audio.exists("music")) {
      const music = this.sound.get("music") || this.sound.add("music", { loop: true, volume: 0.22 });
      if (!music.isPlaying) music.play();
      // play() memulihkan konfigurasi awal; terapkan pilihan mute sesudahnya.
      music.setMute(this.session.musicEnabled === false);
    }
    this.session.scene = this;
    this.session.hud();
    this.session.ready?.();
  }
  sfx(key) {
    if (this.cache.audio.exists(key)) this.sound.play(key, { volume: 0.35 });
  }
  hurt(p, fall) {
    if (this.finished || (!fall && this.time.now < p.invincibleUntil)) return;
    this.session.lives = Math.max(0, this.session.lives - 1);
    this.sfx("hurt");
    p.invincibleUntil = this.time.now + 1600;
    if (fall) p.respawn(this.safePoint(p));
    else p.setVelocity(-p.body.velocity.x * 0.4, -280);
    this.session.hud();
    if (this.session.lives === 0) this.finish("gameover");
  }
  safePoint(p) {
    const lead = this.members
      .filter((m) => m !== p)
      .sort((a, b) => b.safe.x - a.safe.x)[0];
    return lead?.safe || p.safe;
  }
  finish(type, winner) {
    this.finished = true;
    this.physics.pause();
    // Hentikan langsung pada ending, tanpa menunggu respons jaringan.
    if (type === "complete" && this.session.level === levels.length - 1) {
      this.sound.get("music")?.stop();
    }
    this.session.end(type, winner);
  }
  update(time, delta) {
    if (this.finished || !this.members) return;
    if (this.session.offline) {
      this.physics.pause();
      return;
    } else if (this.physics.world.isPaused) this.physics.resume();
    tickEnemies(this);
    const active = this.members.filter((p) => this.session.presence[p.id]);
    const lead = Math.max(
      ...(active.length ? active : this.members).map((p) => p.x),
    );
    const center =
      (Math.min(...this.members.map((p) => Math.max(p.x, lead - 850))) + lead) /
      2;
    const camera = this.cameras.main;
    const desired = Phaser.Math.Clamp(center - 560, 0, this.level.width - 1280);
    camera.scrollX = Phaser.Math.Linear(
      camera.scrollX,
      desired,
      Math.min(1, delta / 160),
    );
    for (const p of this.members) {
      if (!this.session.presence[p.id]) p.controls = {};
      p.tick(time);
      if (p.y > 780) this.hurt(p, true);
      if (p.x < camera.scrollX - 45) {
        if (!p.behindSince) p.behindSince = time;
        if (time - p.behindSince >= 3000) {
          p.respawn(this.safePoint(p));
          this.sfx("disappear");
        }
      } else p.behindSince = 0;
    }
  }
}
export function createGame(session) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: "game",
    width: 1280,
    height: 720,
    backgroundColor: "#c2e6e8",
    pixelArt: true,
    audio: { context: session.audio },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_HORIZONTALLY,
    },
    physics: {
      default: "arcade",
      arcade: { gravity: { y: 1350 }, debug: false },
    },
    scene: new Adventure(session),
  });
}
