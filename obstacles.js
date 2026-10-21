import { copyStats } from './stats.js';
// Semua data dan status rintangan/checkpoint hanya dihitung di host.
export const obstacleTiles = ["flag_off","spikes","spring","spring_out","lava","lava_top","water","water_top",
  ...["sand","purple"].flatMap(theme=>["left","middle","right"].map(part=>`terrain_${theme}_cloud_${part}`))];
export const fishTextures = ["fish_blue_rest","fish_blue_swim_a","fish_blue_swim_b","fish_purple_rest","fish_purple_up","fish_purple_down","block_idle","block_rest","block_fall"];
export function createObstacles(scene) {
  const level=scene.level;
  scene.hazards=scene.physics.add.group({allowGravity:false,immovable:true});
  scene.springs=scene.physics.add.staticGroup();
  scene.checkpoints=scene.physics.add.staticGroup();
  for(const spec of level.fallingBlocks || []) {
    const e=scene.hazards.create(spec.x,spec.y,"block_idle");
    e.kind="fallingBlock";e.spec=spec;e.state="idle";e.until=0;
    e.body.setSize(52,54).setOffset(6,6);
  }
  for(const spec of level.spikes || []) {
    for(let i=0;i<spec.count;i++) {
      const e=scene.hazards.create(spec.x+i*64,spec.y,"spikes");
      e.kind="spikes"; e.spec=spec;
      e.body.setSize(48,32).setOffset(8,32);
    }
  }
  for(const spec of level.saws || []) {
    const e=scene.hazards.create(spec.x,spec.y,"saw_a").setScale(.75);
    e.kind="saw"; e.spec=spec; e.play("enemy_saw"); e.body.setSize(38,38).setOffset(13,13);
  }
  for(const spec of level.springs || []) {
    const e=scene.springs.create(spec.x,spec.y,"spring");e.spec=spec;
    e.body.setSize(48,20).setOffset(8,44);
  }
  for(const pool of level.pools || []) {
    for(let x=pool.start;x<pool.end;x+=64) {
      const w=Math.min(64,pool.end-x);
      scene.add.image(x+w/2,pool.y,pool.type+"_top").setDisplaySize(w,64).setDepth(-2);
      scene.add.image(x+w/2,pool.y+64,pool.type).setDisplaySize(w,64).setDepth(-2);
    }
    if(pool.fish) {
      const e=scene.hazards.create((pool.start+pool.end)/2,pool.y,"fish_"+pool.fish+"_rest").setScale(.65);
      e.kind="fish";e.spec=pool;e.body.setSize(38,30).setOffset(13,20);
    }
  }
  scene.physics.add.overlap(scene.players,scene.hazards,(p,h)=>{if(h.active)scene.hurt(p,false);});
  scene.physics.add.collider(scene.players,scene.springs,(p,s)=>{
    if(scene.finished || p.body.velocity.y<0 || p.body.prev.y+p.body.height>s.body.top+14 ||
       scene.playTime<(p.springUntil || 0))return;
    p.springUntil=scene.playTime+220;p.variableJump=false;p.bufferUntil=-999;
    p.setVelocityY(-690*1.45);s.setTexture("spring_out");scene.sfx("jump-high");
    scene.time.delayedCall(220,()=>s.active&&s.setTexture("spring"));
  });
  for(const spec of level.checkpoints || []) {
    const active=spec.x<=(scene.session.checkpoint?.x || 0);
    const flag=scene.checkpoints.create(spec.x,spec.y,active?"flag_green_a":"flag_off");
    flag.spec=spec;
  }
  scene.physics.add.overlap(scene.players,scene.checkpoints,(_p,flag)=>{
    if(scene.finished || flag.x<=(scene.session.checkpoint?.x || 0))return;
    scene.session.checkpoint={x:flag.x,y:flag.spec.spawnY ?? 440,scores:{...scene.session.scores},stats:copyStats(scene.session.stats)};
    for(const f of scene.checkpoints.getChildren())if(f.x<=flag.x)f.setTexture("flag_green_a");
    scene.sfx("select");scene.tweens.add({targets:flag,alpha:.35,duration:130,yoyo:true,repeat:2});
    scene.session.hud();
  });
}
export function tickObstacles(scene) {
  for(const h of scene.hazards.getChildren()) {
    const s=h.spec;
    if(h.kind==="fallingBlock") {
      const now=scene.playTime;
      if(h.state==="idle" && now>=h.until && scene.members.some(p=>
          scene.session.presence[p.id] && Math.abs(p.body.center.x-s.x)<=90 && p.body.top>=h.body.bottom)) {
        h.state="warning";h.until=now+400;
      }
      if(h.state==="warning") {
        h.x=s.x+Math.sin(now/18)*3;
        if(now>=h.until) {h.state="fall";h.started=now;h.x=s.x;h.setTexture("block_fall");}
      }
      if(h.state==="fall") {
        h.y=Math.min(s.floor-32,s.y+0.0012*(now-h.started)**2);
        if(h.y>=s.floor-32) {h.state="rest";h.until=now+600;h.setTexture("block_rest");scene.sfx("bump");}
      } else if(h.state==="rest" && now>=h.until) {h.state="rise";h.started=now;}
      else if(h.state==="rise") {
        h.y=Phaser.Math.Linear(s.floor-32,s.y,Math.min(1,(now-h.started)/1500));
        if(now-h.started>=1500) {h.state="idle";h.until=now+2500;h.setTexture("block_idle");}
      }
      // Sinkronkan posisi sebelumnya juga agar postUpdate tidak menerapkan gerak dua kali.
      h.body.reset(h.x,h.y);
    } else if(h.kind==="saw" && s.length>0) {
      const progress=(scene.playTime/1000*s.speed)%(2*s.length);
      const offset=(progress<s.length?progress:2*s.length-progress)-s.length/2;
      h.setPosition(s.x+(s.axis==="x"?offset:0),s.y+(s.axis==="y"?offset:0));
      h.body.updateFromGameObject();
    } else if(h.kind==="fish") {
      const angle=scene.playTime/(s.period || 2600)*Math.PI*2;
      h.y=s.y-Math.max(0,Math.sin(angle))*(s.height || 90);
      const pose=s.fish==="purple"?(Math.cos(angle)>0?"up":"down"):"swim_"+(Math.cos(angle)>0?"a":"b");
      h.setTexture("fish_"+s.fish+"_"+pose);h.body.updateFromGameObject();
    }
  }
}
