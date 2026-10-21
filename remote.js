// Pemimpin dihitung dari slot dan presence, tanpa field database tambahan.
export function leaderSlot(slots = {}, presence = {}) {
  return Object.keys(slots).filter(id => presence[id] === true).sort((a,b) => Number(a)-Number(b))[0] ?? null;
}
export const actionsByPhase = {
  lobby: ['start'], playing: ['pause'], paused: ['resume','restart','lobby'],
  between: ['next'], gameover: ['restart'], ending: ['again']
};
export function validAction(phase, action) { return actionsByPhase[phase]?.includes(action) === true; }
