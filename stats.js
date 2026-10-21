export const freshStats = roster => Object.fromEntries(Object.keys(roster).map(id =>
  [id, {coins:0,enemies:0,hits:0,items:0}]));
export const copyStats = stats => structuredClone(stats || {});
export function countStat(session, id, key) {
  session.stats ||= freshStats(session.roster);
  if (session.stats[id]) session.stats[id][key]++;
}
export function titlesFor(stats) {
  const ids=Object.keys(stats), result=Object.fromEntries(ids.map(id=>[id,[]]));
  if(ids.length<2)return result;
  for(const [key,title,least] of [['coins','Raja Koin'],['enemies','Penginjak Terbanyak'],
    ['hits','Si Tangguh',true],['items','Kolektor Item']]) {
    const best=(least?Math.min:Math.max)(...ids.map(id=>stats[id][key]));
    ids.filter(id=>stats[id][key]===best).forEach(id=>result[id].push(title));
  }
  return result;
}
