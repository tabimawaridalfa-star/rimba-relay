import { palette } from './ui.js';
import { titlesFor } from './stats.js';
import { currentMusic, saveVolumes } from './audio.js';
export function bindSound(session) {
  for(const [key,id] of [['music','music-volume'],['effects','effects-volume']]) {
    const input=document.getElementById(id),label=document.getElementById(id+'-value');
    input.value=Math.round(session.volumes[key]*100); label.textContent=input.value+'%';
    input.addEventListener('input',()=>{
      session.volumes[key]=Number(input.value)/100;label.textContent=input.value+'%';
      if(key==='music')currentMusic(session.scene)?.setVolume(session.volumes.music);
      saveVolumes(session.volumes);
    });
  }
}
export function renderAwards(container,session) {
  container.replaceChildren();
  const titles=titlesFor(session.stats);
  for(const [id,p] of Object.entries(session.roster)) {
    const card=document.createElement('article');card.className='award-card';card.style.setProperty('--player',palette[p.color]);
    const name=document.createElement('h3');name.textContent=p.name;
    const avatar=document.createElement('img');avatar.src=`assets/Sprites/Characters/Default/character_${p.color}_idle.png`;avatar.alt=p.color;
    const score=document.createElement('strong');score.textContent=session.scores[id]+' poin';
    const data=document.createElement('dl');
    for(const [key,label] of [['coins','Koin'],['enemies','Musuh kalah'],['hits','Kena hit / jatuh'],['items','Item']]) {
      const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=session.stats[id]?.[key]??0;data.append(dt,dd);
    }
    const badges=document.createElement('div');badges.className='award-titles';
    for(const title of titles[id]||[]) {const span=document.createElement('span');span.textContent=title;badges.append(span);}
    card.append(avatar,name,score,data,badges);container.append(card);
  }
}
export function renderProgress(session,level) {
  const bar=document.getElementById('level-progress'),marks=document.getElementById('progress-markers');
  if(bar.dataset.level!==String(session.level)) {
    bar.dataset.level=session.level;marks.replaceChildren();
    for(const [x,label] of [...level.checkpoints.map(c=>[c.x,'Checkpoint']),[level.flag.x,'Finish']]) {
      const mark=document.createElement('span');mark.style.left=(x/level.width*100)+'%';mark.title=label;mark.className=label==='Finish'?'finish-mark':'';marks.append(mark);
    }
  }
  const front=Math.max(0,...(session.scene?.members||[]).map(p=>p.x));
  const percent=Math.min(100,front/level.width*100);
  document.getElementById('progress-fill').style.width=percent+'%';
  bar.setAttribute('aria-valuenow',String(Math.round(percent)));
}
