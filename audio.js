import { musicPath } from './config.js';
export const tracks=[{key:'music',path:'assets/music/tema.ogg'},
  {key:'music_final',path:'assets/music/tema-cadangan.ogg'}];
const defaults={music:.22,effects:.35};
const volume=(value,fallback)=>typeof value==='number'&&Number.isFinite(value)?Math.min(1,Math.max(0,value)):fallback;
export function readVolumes() {
  try { const v=JSON.parse(localStorage.getItem('rimba-volumes')) || {};
    return {music:volume(v.music,.22),effects:volume(v.effects,.35)};
  } catch {return {...defaults};}
}
export function saveVolumes(v) {try {localStorage.setItem('rimba-volumes',JSON.stringify(v));}catch {/* Pilihan tetap berlaku di memori. */}}
export function loadMusic(scene) {
  for(const t of [...tracks,...(musicPath?[{key:'music_fallback',path:musicPath}]:[])])
    if(!scene.cache.audio.exists(t.key))scene.load.audio(t.key,t.path);
}
export function currentMusic(scene) {return scene?.sound.sounds.find(s=>['music','music_final','music_fallback'].includes(s.key));}
export function startMusic(scene) {
  let key=tracks[scene.session.level===2?1:0].key;
  if(!scene.cache.audio.exists(key))key='music_fallback';
  // SoundManager lintas-scene: singkirkan track lama sebelum memutar yang baru.
  for(const sound of [...scene.sound.sounds])
    if(['music','music_final','music_fallback'].includes(sound.key)&&sound.key!==key)scene.sound.remove(sound);
  if(!scene.cache.audio.exists(key))return;
  const music=currentMusic(scene)||scene.sound.add(key,{loop:true});
  const config={loop:true,volume:scene.session.volumes?.music ?? .22,mute:scene.session.musicEnabled===false};
  if(!music.isPlaying)music.play(config);
  music.setVolume(config.volume).setMute(config.mute);
}
