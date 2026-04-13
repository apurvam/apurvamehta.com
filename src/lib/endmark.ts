// Seeded PRNG (mulberry32)
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

type Rand = () => number;

function generateTree(rand: Rand): string {
  const cx = 32;
  const base = 72;
  const stemH = 28 + rand() * 8;
  const top = base - stemH;
  const sway = (rand() - 0.5) * 6;

  const paths: string[] = [];

  // Stem
  paths.push(`M${cx} ${base} C${cx + sway} ${base - stemH / 3}, ${cx - sway} ${top + stemH / 3}, ${cx} ${top}`);

  // Crown — bumpy cloud shape
  const bumps = 5 + Math.floor(rand() * 3);
  const r = 14 + rand() * 4;
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < bumps; i++) {
    const a = (i / bumps) * Math.PI * 2 - Math.PI / 2;
    const rr = r + (rand() - 0.5) * 8;
    pts.push({ x: cx + Math.cos(a) * rr, y: top - 2 + Math.sin(a) * rr * 0.7 });
  }
  let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length; i++) {
    const curr = pts[i];
    const next = pts[(i + 1) % pts.length];
    const mx = (curr.x + next.x) / 2;
    const my = (curr.y + next.y) / 2;
    d += ` Q${curr.x.toFixed(1)} ${curr.y.toFixed(1)}, ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  d += ' Z';
  paths.push(d);

  // Roots
  const roots = 3 + Math.floor(rand() * 3);
  for (let i = 0; i < roots; i++) {
    const spread = ((i - (roots - 1) / 2) / roots) * 28 + (rand() - 0.5) * 6;
    const len = 4 + rand() * 5;
    paths.push(`M${cx} ${base} Q${cx + spread * 0.5} ${base + len * 0.6}, ${cx + spread} ${base + len}`);
  }

  return paths.map((p) => `<path d="${p}"/>`).join('');
}

function generateFlower(rand: Rand): string {
  const cx = 32;
  const base = 74;
  const paths: string[] = [];

  // Stem with slight curve
  const curve = (rand() - 0.5) * 10;
  const stemTop = 36 + rand() * 6;
  paths.push(`M${cx} ${base} C${cx + curve} ${base - 12}, ${cx - curve} ${stemTop + 10}, ${cx} ${stemTop}`);

  // Leaves on stem
  const numLeaves = 1 + Math.floor(rand() * 2);
  for (let i = 0; i < numLeaves; i++) {
    const ly = base - 12 - i * 14 + rand() * 4;
    const side = i % 2 === 0 ? 1 : -1;
    const lx = cx + side * (8 + rand() * 5);
    paths.push(`M${cx} ${ly} Q${lx} ${ly - 6}, ${lx + side * 2} ${ly - 10}`);
    paths.push(`M${cx} ${ly} Q${lx} ${ly + 2}, ${lx + side * 2} ${ly - 10}`);
  }

  // Petals
  const petals = 5 + Math.floor(rand() * 3);
  const pr = 10 + rand() * 4;
  const cy = stemTop - 2;
  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * Math.PI * 2 - Math.PI / 2;
    const tipX = cx + Math.cos(a) * pr;
    const tipY = cy + Math.sin(a) * pr;
    const cpOff = 4 + rand() * 3;
    const perpA = a + Math.PI / 2;
    paths.push(
      `M${cx} ${cy} Q${cx + Math.cos(perpA) * cpOff} ${cy + Math.sin(perpA) * cpOff}, ${tipX.toFixed(1)} ${tipY.toFixed(1)}`,
    );
    paths.push(
      `M${cx} ${cy} Q${cx - Math.cos(perpA) * cpOff} ${cy - Math.sin(perpA) * cpOff}, ${tipX.toFixed(1)} ${tipY.toFixed(1)}`,
    );
  }

  // Center dot
  paths.push(`M${cx - 1.5} ${cy} A1.5 1.5 0 1 1 ${cx + 1.5} ${cy} A1.5 1.5 0 1 1 ${cx - 1.5} ${cy}`);

  return paths.map((p) => `<path d="${p}"/>`).join('');
}

function generateBranch(rand: Rand): string {
  const paths: string[] = [];
  const startX = 12 + rand() * 8;
  const startY = 65;
  const endX = 52 - rand() * 8;
  const endY = 20 + rand() * 8;

  // Main branch
  const midX = (startX + endX) / 2 + (rand() - 0.5) * 10;
  const midY = (startY + endY) / 2;
  paths.push(`M${startX} ${startY} Q${midX} ${midY}, ${endX} ${endY}`);

  // Sub-branches with buds/leaves
  const subs = 3 + Math.floor(rand() * 3);
  for (let i = 0; i < subs; i++) {
    const t = 0.2 + (i / subs) * 0.65;
    const bx = startX + (endX - startX) * t + (midX - (startX + endX) / 2) * 2 * t * (1 - t);
    const by = startY + (endY - startY) * t;
    const side = rand() > 0.5 ? 1 : -1;
    const bLen = 6 + rand() * 10;
    const ba = -Math.PI / 3 + rand() * 0.5;
    const tipX = bx + Math.cos(ba) * bLen * side;
    const tipY = by + Math.sin(ba) * bLen;
    paths.push(`M${bx.toFixed(1)} ${by.toFixed(1)} Q${(bx + tipX) / 2 + rand() * 3} ${(by + tipY) / 2 - 3}, ${tipX.toFixed(1)} ${tipY.toFixed(1)}`);

    // Small leaf at tip
    const lOff = 3 + rand() * 2;
    paths.push(
      `M${tipX.toFixed(1)} ${tipY.toFixed(1)} Q${tipX - lOff} ${tipY - lOff}, ${tipX + 1} ${tipY - lOff * 1.5}`,
    );
    paths.push(
      `M${tipX.toFixed(1)} ${tipY.toFixed(1)} Q${tipX + lOff} ${tipY - lOff}, ${tipX + 1} ${tipY - lOff * 1.5}`,
    );
  }

  return paths.map((p) => `<path d="${p}"/>`).join('');
}

function generateFern(rand: Rand): string {
  const paths: string[] = [];
  const cx = 32;
  const base = 74;
  const top = 10 + rand() * 6;
  const curve = (rand() - 0.5) * 8;

  // Main frond stem
  paths.push(`M${cx} ${base} C${cx + curve} ${base - 20}, ${cx - curve} ${top + 20}, ${cx} ${top}`);

  // Pinnae (leaf pairs)
  const pairs = 5 + Math.floor(rand() * 3);
  for (let i = 0; i < pairs; i++) {
    const t = 0.15 + (i / pairs) * 0.75;
    const py = base + (top - base) * t;
    const sx = cx + curve * (1 - t) * 0.3;
    const size = (4 + rand() * 4) * (1 - t * 0.5);

    // Left pinna
    const laX = sx - size * 1.8;
    const laY = py - size * 0.5;
    paths.push(`M${sx.toFixed(1)} ${py.toFixed(1)} Q${(sx + laX) / 2} ${laY - 2}, ${laX.toFixed(1)} ${laY.toFixed(1)}`);
    paths.push(`M${sx.toFixed(1)} ${py.toFixed(1)} Q${(sx + laX) / 2} ${py + 1}, ${laX.toFixed(1)} ${laY.toFixed(1)}`);

    // Right pinna
    const raX = sx + size * 1.8;
    const raY = py - size * 0.5;
    paths.push(`M${sx.toFixed(1)} ${py.toFixed(1)} Q${(sx + raX) / 2} ${raY - 2}, ${raX.toFixed(1)} ${raY.toFixed(1)}`);
    paths.push(`M${sx.toFixed(1)} ${py.toFixed(1)} Q${(sx + raX) / 2} ${py + 1}, ${raX.toFixed(1)} ${raY.toFixed(1)}`);
  }

  // Curled tip
  paths.push(`M${cx} ${top} Q${cx + 3} ${top - 3}, ${cx + 5} ${top - 1}`);

  return paths.map((p) => `<path d="${p}"/>`).join('');
}

const generators = [generateTree, generateFlower, generateBranch, generateFern];

export function generateEndMark(slug: string): string {
  const seed = hashString(slug);
  const rand = mulberry32(seed);

  const gen = generators[Math.floor(rand() * generators.length)];
  const inner = gen(rand);

  return `<svg width="64" height="80" viewBox="0 0 64 80" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}
