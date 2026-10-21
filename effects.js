// Pool kecil: partikel dan angka bersama-sama tidak pernah melebihi 40 objek.
export function createEffects(scene) {
  const active=new Set();
  const animate=(object,config)=>{
    active.add(object);
    scene.tweens.add({targets:object,...config,onComplete:()=>{active.delete(object);object.destroy();}});
  };
  scene.fx={active,
    burst(x,y,color=0xffffff,count=5) {
      for(let i=0;i<count&&active.size<40;i++) {
        const a=(Math.PI*2*i)/count;
        const dot=scene.add.circle(x,y,2+i%2,color).setDepth(8);
        animate(dot,{x:x+Math.cos(a)*20,y:y-12+Math.sin(a)*12,alpha:0,scale:.2,duration:300});
      }
    },
    score(x,y,value) {
      if(active.size>=40)return;
      const label=scene.add.text(x,y,'+'+value,{fontFamily:'Arial',fontSize:'17px',fontStyle:'bold',color:'#fff6b2',stroke:'#233338',strokeThickness:3}).setOrigin(.5).setDepth(9);
      animate(label,{y:y-34,alpha:0,duration:650});
    },
    landing(p) {
      const feet=p.body.bottom;
      if(!p.body.blocked.down) p.fxPeak=Math.min(p.fxPeak??feet,feet);
      else {if(p.fxPeak!==undefined&&feet-p.fxPeak>80)scene.fx.burst(p.x,feet,0xe5e1d0,4);p.fxPeak=undefined;}
    },
  };
  scene.events.once('shutdown',()=>{active.forEach(o=>o.destroy());active.clear();});
}
