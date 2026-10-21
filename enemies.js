import { countStat } from './stats.js';
export const enemyFrames = {
  slime: ["slime_normal_walk_a", "slime_normal_walk_b"],
  snail: ["snail_walk_a", "snail_walk_b"], bee: ["bee_a", "bee_b"], fly: ["fly_a", "fly_b"],
  frog: ["frog_idle", "frog_jump"], ladybug: ["ladybug_walk_a", "ladybug_walk_b"],
  mouse: ["mouse_walk_a", "mouse_walk_b"], saw: ["saw_a", "saw_b"], worm: ["worm_normal_move_a", "worm_normal_move_b"],
};
export function makeEnemy(scene, spec) {
  const e = scene.enemies.create(spec.x, spec.y, enemyFrames[spec.type][0]).setScale(0.75);
  e.body.setSize(42,30).setOffset(11,30);
  e.spec=spec; e.direction=-1; e.speed=spec.speed || 55;
  e.flying=["bee","fly","saw"].includes(spec.type);
  e.shell=false; e.rolling=false; e.nextHop=0; e.turnUntil=0;
  e.play(`enemy_${spec.type}`);
  if(e.flying) { e.body.setAllowGravity(false); e.body.setSize(38,38).setOffset(13,13); }
  return e;
}
function supported(scene,x,y) {
  return [...scene.ground.getChildren(),...scene.boxes.getChildren()].some(tile =>
    tile.body && x >= tile.body.left && x <= tile.body.right &&
    y >= tile.body.top-3 && y <= tile.body.top+12);
}
export function defeatEnemy(scene,e,owner) {
  if(!e.active || e.spec.type === "saw") return;
  scene.fx?.burst(e.x,e.y,0xe8deca,6);
  e.disableBody(true,true);
  if(owner !== undefined && Object.hasOwn(scene.session.scores,owner)) {scene.session.scores[owner]+=50;countStat(scene.session,owner,'enemies');scene.fx?.score(e.x,e.y,50);}
  scene.sfx("disappear"); scene.session.hud();
}
export function enemyCollision(scene,a,b) {
  if(!a.active || !b.active) return;
  if(a.rolling) { defeatEnemy(scene,b,a.owner); return; }
  if(b.rolling) { defeatEnemy(scene,a,b.owner); return; }
  if(scene.playTime < Math.max(a.turnUntil,b.turnUntil)) return;
  const direction=a.x<=b.x ? -1:1;
  a.direction=direction; b.direction=-direction;
  a.turnUntil=b.turnUntil=scene.playTime+180;
}
export function touchEnemy(scene,p,e) {
  if(scene.finished || !e.active) return;
  if(e.spec.type === "saw") { scene.hurt(p,false); return; }
  if(p.starUntil > scene.playTime) { defeatEnemy(scene,e,p.id); return; }
  const stomp=p.body.velocity.y>30 && p.body.prev.y+p.body.height<=e.body.top+16;
  if(e.shell) {
    if(e.contactUntil > scene.playTime && e.contactPlayer===p.id) return;
    if(stomp && e.rolling) {
      e.rolling=false; e.setVelocityX(0);
      e.contactPlayer=p.id; e.contactUntil=scene.playTime+250;
    } else if(!e.rolling) {
      e.rolling=true; e.owner=p.id; e.direction=p.x<e.x ? 1:-1;
      e.contactPlayer=p.id; e.contactUntil=scene.playTime+250;
      scene.sfx("throw");
    } else { scene.hurt(p,false); return; }
    if(stomp) { p.variableJump=false; p.setVelocityY(-360); }
    return;
  }
  if(stomp) {
    if(e.spec.type === "snail") {
      scene.fx?.burst(e.x,e.y,0xe8deca,4);
      e.anims.stop(); e.setTexture("snail_shell"); e.shell=true; e.setVelocityX(0);
      e.contactPlayer=p.id; e.contactUntil=scene.playTime+180;
      scene.sfx("bump");
    } else defeatEnemy(scene,e,p.id);
    p.variableJump=false; p.setVelocityY(-360);
  } else scene.hurt(p,false);
}
export function tickEnemies(scene) {
  for(const e of scene.enemies.getChildren()) {
    if(!e.active || !e.body.enable) continue;
    if(e.y>850) { e.disableBody(true,true); continue; }
    if(e.shell && !e.rolling) { e.setVelocityX(0); continue; }
    if(!e.rolling) {
      if(e.x<=e.spec.min) e.direction=1;
      else if(e.x>=e.spec.max) e.direction=-1;
    }
    if(!e.flying) {
      if(e.body.blocked.left) e.direction=1;
      else if(e.body.blocked.right) e.direction=-1;
      else if(e.body.blocked.down && !supported(scene,
        e.direction>0 ? e.body.right+6:e.body.left-6, e.body.bottom+4)) e.direction *= -1;
      if(e.spec.type === "frog" && !e.shell) {
        e.anims.stop();
        e.setTexture(e.body.blocked.down ? "frog_idle":"frog_jump");
        const nearest=scene.members.filter(p=>scene.session.presence[p.id]).sort((a,b)=>
          Phaser.Math.Distance.Between(e.x,e.y,a.x,a.y)-Phaser.Math.Distance.Between(e.x,e.y,b.x,b.y))[0];
        if(nearest && e.body.blocked.down && scene.playTime>=e.nextHop &&
          Phaser.Math.Distance.Between(e.x,e.y,nearest.x,nearest.y)<=250) {
          const dir=nearest.x<e.x ? -1:1;
          if(supported(scene,e.x+dir*35,e.body.bottom+4)) {
            e.direction=dir; e.setVelocityY(-390); e.nextHop=scene.playTime+1500;
          }
        }
      }
    }
    e.setVelocityX((e.rolling ? 300:e.speed)*e.direction);
    e.setFlipX(e.direction>0);
  }
}
