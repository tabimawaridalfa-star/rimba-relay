import { countStat } from './stats.js';
// Seluruh item dan durasinya hanya berada di memori host.
export const itemTextures = ["heart", "star", "mushroom_red", "gem_blue"];
export function createMysteries(scene) {
  scene.boxes = scene.physics.add.staticGroup();
  scene.items = scene.physics.add.group();
  for (const [x, y] of scene.level.boxes || []) {
    if (x < (scene.session.checkpoint?.x || 0)) continue;
    const box = scene.boxes.create(x, y, "block_exclamation");
    box.used = false;
  }
  scene.physics.add.collider(scene.players, scene.boxes, (player, box) => {
    // Arcade sudah memisahkan tubuh; posisi sebelumnya memastikan sundulan dari bawah.
    if (player.body.blocked.up && player.body.prev.y >= box.body.bottom - 12 &&
        player.body.y < player.body.prev.y) openBox(scene, box);
  });
  scene.physics.add.collider(scene.enemies, scene.boxes);
  scene.physics.add.collider(scene.items, scene.ground);
  scene.physics.add.collider(scene.items, scene.boxes);
  scene.physics.add.overlap(scene.players, scene.items, (player, item) => {
    if (!scene.finished && item.active && item.ready) collectItem(scene, player, item);
  });
}
export function openBox(scene, box) {
  if (scene.finished || box.used) return;
  box.used = true; box.setTexture("block_empty"); scene.sfx("bump");
  const kind = Phaser.Utils.Array.GetRandom(itemTextures);
  const item = scene.items.create(box.x, box.y, kind).setScale(0.55).setDepth(3);
  item.kind = kind; item.ready = false; item.body.enable = false;
  // Keluar dari atas lalu ke samping, sehingga item turun ke jalur yang mudah diambil.
  scene.tweens.add({targets:item, y:box.y-60, duration:220, onComplete:() => {
    scene.tweens.add({targets:item, x:box.x+78, duration:240, onComplete:() => {
      if (!item.active) return;
      item.body.enable = true; item.body.reset(item.x,item.y);
      item.setDragX(100); item.ready = true;
    }});
  }});
  return item;
}
export function collectItem(scene, player, item) {
  if (!item.active || !item.ready) return;
  countStat(scene.session,player.id,'items');
  item.disableBody(true,true);
  if (item.kind === "heart") { scene.session.lives = Math.min(scene.session.maxLives,scene.session.lives+1); scene.sfx("select"); }
  if (item.kind === "star") { player.starUntil = scene.playTime+6000; scene.sfx("magic"); }
  if (item.kind === "mushroom_red") { player.growthPending = !player.isBig; player.tryGrow(); scene.sfx("jump-high"); }
  if (item.kind === "gem_blue") { scene.session.scores[player.id]+=100;scene.fx?.score(player.x,player.y,100); scene.sfx("gem"); }
  scene.session.hud();
}
