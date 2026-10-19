export const palette = {
  beige: "#e8c9a0",
  green: "#a9dc66",
  pink: "#f2a4bd",
  purple: "#bba4ed",
  yellow: "#f4db70",
};
export const $ = (s) => document.querySelector(s);
export function roster(container, players, scores = {}, presence = {}) {
  container.replaceChildren();
  Object.entries(players || {}).forEach(([id, p]) => {
    const row = document.createElement("div");
    row.className = "player-card";
    row.style.setProperty("--player", palette[p.color]);
    const img = document.createElement("img");
    img.src = `assets/Sprites/Characters/Default/character_${p.color}_idle.png`;
    img.alt = p.color;
    const text = document.createElement("span");
    text.textContent = p.name;
    const score = document.createElement("b");
    score.textContent =
      scores[id] === undefined
        ? presence[id]
          ? "Siap"
          : "Menghubungkan…"
        : `${scores[id]} poin`;
    row.append(img, text, score);
    container.append(row);
  });
}
export function ranking(container, players, scores) {
  const sorted = Object.entries(players).sort(
    (a, b) => (scores[b[0]] || 0) - (scores[a[0]] || 0),
  );
  roster(
    container,
    Object.fromEntries(
      sorted.map(([id, p], i) => [
        "p" + id,
        { ...p, name: `${i + 1}. ${p.name}` },
      ]),
    ),
    Object.fromEntries(sorted.map(([id]) => ["p" + id, scores[id] || 0])),
  );
}
