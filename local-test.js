// Pintasan pengujian tidak pernah aktif pada domain publik.
export function localTestOptions(url) {
  const host=url.hostname;
  const parts=host.split('.');
  const ipv4=parts.length===4 && parts.every(p=>/^\d{1,3}$/.test(p) && Number(p)<=255);
  const [a,b]=parts.map(Number);
  const allowed=host==='localhost' || host==='127.0.0.1' ||
    (ipv4 && (a===10 || (a===192 && b===168) || (a===172 && b>=16 && b<=31)));
  const match=/^level([123])$/.exec(url.searchParams.get('mulai') || '');
  if(!allowed || !match)return null;
  const raw=url.searchParams.get('x');
  const x=raw===null?160:Number(raw);
  return {level:Number(match[1])-1,x:Number.isFinite(x)?x:160};
}

export function prepareLocalScene(scene, options) {
  const p=scene.members[0];
  if(!scene.session.checkpoint && scene.session.level===options.level) {
    const x=Phaser.Math.Clamp(options.x,40,scene.level.width-200);
    p.body.reset(x,440);p.safe={x,y:440};
    scene.cameras.main.scrollX=Math.max(0,x-560);
  }
  // Keyboard hanya untuk inspeksi lokal tanpa HP/Firebase.
  const keys=new Set();let jumpSeq=0;
  const receive=()=>p.receive({left:keys.has('ArrowLeft'),right:keys.has('ArrowRight'),
    jump:keys.has('Space')||keys.has('ArrowUp'),jumpSeq});
  const down=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','Space'].includes(e.code))return;
    e.preventDefault();if(!keys.has(e.code) && ['Space','ArrowUp'].includes(e.code))jumpSeq++;
    keys.add(e.code);receive();};
  const up=e=>{keys.delete(e.code);receive();};
  const blur=()=>{keys.clear();receive();};
  window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);
  scene.events.once('shutdown',()=>{window.removeEventListener('keydown',down);
    window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);});
}
