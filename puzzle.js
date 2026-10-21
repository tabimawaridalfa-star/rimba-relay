// Teka-teki hanya hidup di memori host; semua deadline memakai playTime.
export const puzzleTiles = ["switch_green", "switch_green_pressed", "door_closed",
  "door_closed_top", "door_open", "door_open_top"];

export function createPuzzle(scene) {
  scene.puzzle = null;
  const spec = scene.level.puzzle;
  if (!spec) return;
  const x = spec.doorX, floor = spec.floor;
  const door = scene.ground.create(x, floor - 32, "door_closed");
  const top = scene.ground.create(x, floor - 96, "door_closed_top");
  // Lorong 128 px; tiga tile di atasnya membuat tembok total 320 px.
  const roof = [160, 224, 288].map(offset =>
    scene.ground.create(x, floor - offset, "purple_block_center"));
  const button = scene.physics.add.staticImage(spec.switchX, floor - 32, "switch_green");
  button.body.setSize(64, 14).setOffset(0, 50);
  const label = scene.add.text(x, floor - 340, "", {
    fontFamily: "Arial", fontSize: "18px", fontStyle: "bold", color: "#28494b",
    backgroundColor: "#ffffffdd", padding: {x:5,y:3},
  }).setOrigin(.5).setVisible(false);
  const hint=scene.add.text(spec.switchX,floor-100,'Lompat ke saklar!',{fontFamily:'Arial',fontSize:'15px',color:'#28494b',backgroundColor:'#ffffffdd',padding:{x:5,y:3}}).setOrigin(.5);
  const puzzle = scene.puzzle = {spec, door, top, roof, button, label, hint, open:false, until:0};
  scene.physics.add.overlap(scene.players, button, (a,b) => {
    const p = a === button ? b : a;
    const body = p.body;
    if (scene.finished || puzzle.open || body.velocity.y < 0 ||
        body.prev.y + body.height > button.body.top + 1) return;
    puzzle.open = true;
    hint.setVisible(false);
    puzzle.until = scene.playTime + spec.duration;
    button.setTexture("switch_green_pressed");
    door.setTexture("door_open"); top.setTexture("door_open_top");
    door.body.enable = top.body.enable = false;
    scene.sfx("select"); scene.sfx("magic");
    scene.tweens.add({targets:button,alpha:.4,duration:100,yoyo:true,repeat:1});
    tickPuzzle(scene);
  });
}

export function tickPuzzle(scene) {
  const puzzle = scene.puzzle;
  if (!puzzle?.open) return;
  const {spec, door, top, button, label} = puzzle;
  const remaining = Math.max(0, puzzle.until - scene.playTime);
  label.setText(String(Math.ceil(remaining / 1000))).setVisible(true);
  if (remaining > 0) return;
  // Tunggu seluruh lorong kosong, termasuk pemain offline yang tubuhnya masih ada.
  const occupied = scene.members.some(p => {
    const b = p.body;
    return b?.enable && b.right > spec.doorX - 34 && b.left < spec.doorX + 34 &&
      b.bottom > spec.floor - 130 && b.top < spec.floor + 2;
  });
  if (occupied) return;
  puzzle.open = false;
  puzzle.hint.setVisible(true);
  door.setTexture("door_closed"); top.setTexture("door_closed_top");
  door.body.enable = top.body.enable = true;
  button.setTexture("switch_green"); label.setVisible(false);
}
