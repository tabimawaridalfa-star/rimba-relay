export const enemyFrames = {
  slime: ["slime_normal_walk_a", "slime_normal_walk_b"],
  snail: ["snail_walk_a", "snail_walk_b"],
  bee: ["bee_a", "bee_b"],
  fly: ["fly_a", "fly_b"],
  frog: ["frog_idle", "frog_jump"],
  ladybug: ["ladybug_walk_a", "ladybug_walk_b"],
  mouse: ["mouse_walk_a", "mouse_walk_b"],
  saw: ["saw_a", "saw_b"],
  worm: ["worm_normal_move_a", "worm_normal_move_b"],
};
export function makeEnemy(scene, spec) {
  const e = scene.enemies
    .create(spec.x, spec.y, enemyFrames[spec.type][0])
    .setScale(0.75);
  e.body.setSize(42, 30).setOffset(11, 30);
  e.spec = spec;
  e.direction = -1;
  e.speed = spec.speed || 55;
  e.play(`enemy_${spec.type}`);
  if (["bee", "fly", "saw"].includes(spec.type)) {
    e.body.setAllowGravity(false);
    e.body.setSize(38, 38).setOffset(13, 13);
  }
  return e;
}
export function tickEnemies(scene) {
  for (const e of scene.enemies.getChildren()) {
    if (e.x <= e.spec.min) e.direction = 1;
    else if (e.x >= e.spec.max) e.direction = -1;
    e.setVelocityX(e.speed * e.direction);
    e.setFlipX(e.direction > 0);
  }
}
