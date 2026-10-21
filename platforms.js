// Pijakan kinematik: posisi dan penumpang dipindahkan sebelum langkah Arcade.
export function createPlatforms(scene) {
  scene.ridePlatforms = [];
  const make = (spec, collapse) => {
    const width = spec.tiles * 64;
    const surface = scene.add.zone(spec.x, spec.y, width, 64);
    scene.physics.add.existing(surface, true);
    surface.spec = spec; surface.collapse = collapse; surface.state = "ready";
    surface.direction = 1; surface.distance = 0; surface.wait = spec.pause || 0;
    surface.parts = Array.from({length:spec.tiles}, (_,i) => scene.add.image(
      spec.x-width/2+32+i*64, spec.y,
      `terrain_${collapse ? "purple" : "sand"}_cloud_${i===0?"left":i===spec.tiles-1?"right":"middle"}`));
    scene.ridePlatforms.push(surface);
    scene.physics.add.collider(scene.players, surface, (a,b) => {
      const p=a===surface?b:a;
      p.rideSurface=surface;
      if (collapse && surface.state === "ready") {
        surface.state="warning"; surface.until=scene.playTime+600; scene.sfx("bump");
      }
    }, (a, b) => {
      // Arcade menukar argumen ketika collider berupa group-versus-object.
      const p=a===surface?b:a;
      return p.body.velocity.y>=0 && p.body.prev.y+p.body.height<=surface.body.top+8;
    });
  };
  for (const spec of scene.level.movingPlatforms || []) make(spec, false);
  for (const spec of scene.level.crumblingPlatforms || []) make(spec, true);
  const before = (_time, delta) => movePlatforms(scene, delta);
  scene.events.on("preupdate", before);
  scene.events.once("shutdown", () => scene.events.off("preupdate", before));
}

export function movePlatforms(scene, delta) {
  if (scene.finished || scene.session.offline || scene.physics.world.isPaused) return;
  for (const f of scene.ridePlatforms) {
    const s=f.spec, oldX=f.x, oldY=f.y;
    if (f.collapse) {
      if (f.state==="warning" && scene.playTime>=f.until) {
        f.state="falling"; f.fellAt=scene.playTime; f.body.enable=false; scene.sfx("disappear");
      }
      if (f.state==="falling") {
        const elapsed=scene.playTime-f.fellAt;
        f.y=s.y+0.00065*elapsed*elapsed;
        if (elapsed>=3000) {f.state="ready";f.y=s.y;f.body.enable=true;}
      }
    } else {
      let remaining=delta/1000;
      if(f.wait>0) {const consumed=Math.min(f.wait,remaining); f.wait-=consumed; remaining-=consumed;}
      const next=f.distance+f.direction*s.speed*remaining;
      f.distance=Phaser.Math.Clamp(next,0,s.range);
      if(next<0 || next>s.range) {f.direction*=-1;f.wait=s.pause || 0;}
      f.x=s.x+(s.axis==="x"?f.distance:0);
      f.y=s.y+(s.axis==="y"?f.distance:0);
    }
    const dx=f.x-oldX,dy=f.y-oldY;
    // Gunakan kontak kaki, bukan daftar penumpang lama: lompat langsung melepaskan pijakan.
    if(f.body.enable) for(const p of scene.members) {
      const b=p.body;
      const supported=p.rideSurface===f && b.bottom>=f.body.top-3 && b.bottom<=f.body.top+32;
      if(!b.enable || b.velocity.y<0 || (!supported && Math.abs(b.bottom-f.body.top)>3) ||
         b.right<=f.body.left+1 || b.left>=f.body.right-1) {
        if(p.rideSurface===f)p.rideSurface=null;
        continue;
      }
      // Kontak tersimpan menjaga kaki tepat pada permukaan ketika terjadi pembulatan Arcade.
      const lift=dy+f.body.top-b.bottom;
      p.x+=dx;p.y+=lift;b.position.x+=dx;b.position.y+=lift;b.velocity.y=0;
      // Bila data level diedit hingga jalur bertemu solid, keluarkan ke sisi terdekat tanpa hit.
      for(const obj of [...scene.ground.getChildren(),...scene.boxes.getChildren()]) {
        const solid=obj.body;
        if(!solid?.enable || b.right<=solid.left+.1 || b.left>=solid.right-.1 ||
           b.bottom<=solid.top+.1 || b.top>=solid.bottom-.1) continue;
        const left=solid.left-b.right-.1,right=solid.right-b.left+.1;
        const push=Math.abs(left)<Math.abs(right)?left:right;
        p.x+=push;b.position.x+=push;
      }
    }
    f.body.updateFromGameObject();
    const shake=f.state==="warning"?Math.sin(scene.playTime/22)*2:0;
    f.parts.forEach((part,i)=>part.setPosition(f.x-s.tiles*32+32+i*64+shake,f.y)
      .setVisible(f.state!=="falling" || scene.playTime-f.fellAt<650));
  }
}
