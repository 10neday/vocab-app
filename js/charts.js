// ================================================================
// Custom Canvas Charts (no external libs)
// ================================================================

function readCSSVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// ---------- Donut Chart ----------
function drawDonut(canvasId, segments) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const cx = w / 2, cy = h / 2;
  const outerR = Math.min(w, h) / 2 - 4;
  const innerR = outerR - 22;

  ctx.clearRect(0, 0, w, h);
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total === 0) {
    ctx.beginPath();
    ctx.arc(cx, cy, (outerR + innerR) / 2, 0, Math.PI * 2);
    ctx.lineWidth = outerR - innerR;
    ctx.strokeStyle = readCSSVar('--surface-2');
    ctx.stroke();
    return;
  }

  let start = -Math.PI / 2;
  const gap = 0.015;
  segments.forEach((seg) => {
    const angle = (seg.value / total) * Math.PI * 2;
    if (angle < 0.001) return;
    ctx.beginPath();
    ctx.arc(cx, cy, (outerR + innerR) / 2, start + gap, start + angle - gap);
    ctx.lineWidth = outerR - innerR;
    ctx.lineCap = 'butt';
    ctx.strokeStyle = seg.color;
    ctx.stroke();
    start += angle;
  });
}

// ---------- Ring (progress) Chart ----------
function drawRing(canvasId, value, max) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const cx = w / 2, cy = h / 2;
  const r = Math.min(w, h) / 2 - 6;
  const thickness = 12;

  ctx.clearRect(0, 0, w, h);
  // background ring
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.lineWidth = thickness;
  ctx.strokeStyle = readCSSVar('--surface-2');
  ctx.stroke();

  // progress
  const pct = Math.min(1, value / max);
  if (pct > 0) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2);
    ctx.lineWidth = thickness;
    ctx.lineCap = 'round';
    ctx.strokeStyle = readCSSVar('--brand');
    ctx.stroke();
  }
}

// ---------- Bar Chart ----------
function drawBars(canvasId, items) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || 320;
  const cssH = parseInt(canvas.getAttribute('height')) || 180;
  canvas.width = cssW * dpr;
  canvas.height = cssH * dpr;
  canvas.style.height = cssH + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, cssW, cssH);
  if (!items.length) return;

  const padding = { l: 28, r: 8, t: 18, b: 28 };
  const chartW = cssW - padding.l - padding.r;
  const chartH = cssH - padding.t - padding.b;
  const maxVal = Math.max(...items.map((i) => i.value), 1);
  const niceMax = Math.ceil(maxVal / 100) * 100;
  const barCount = items.length;
  const slot = chartW / barCount;
  const barW = Math.min(slot * 0.55, 36);

  // grid lines + Y labels
  ctx.strokeStyle = readCSSVar('--border');
  ctx.lineWidth = 1;
  ctx.fillStyle = readCSSVar('--text-3');
  ctx.font = '10px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  const steps = 3;
  for (let i = 0; i <= steps; i++) {
    const y = padding.t + (chartH * i) / steps;
    const v = Math.round(niceMax - (niceMax * i) / steps);
    ctx.beginPath();
    ctx.moveTo(padding.l, y);
    ctx.lineTo(cssW - padding.r, y);
    ctx.strokeStyle = i === steps ? readCSSVar('--border-strong') : readCSSVar('--border');
    ctx.globalAlpha = i === steps ? 1 : 0.4;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillText(v, padding.l - 6, y);
  }

  // bars
  ctx.textAlign = 'center';
  items.forEach((item, idx) => {
    const x = padding.l + slot * idx + slot / 2;
    const barH = (item.value / niceMax) * chartH;
    const y = padding.t + chartH - barH;

    // bar
    const gradient = ctx.createLinearGradient(0, y, 0, y + barH);
    gradient.addColorStop(0, readCSSVar('--brand'));
    gradient.addColorStop(1, readCSSVar('--brand-2'));
    ctx.fillStyle = gradient;
    roundedRect(ctx, x - barW / 2, y, barW, barH, 6);
    ctx.fill();

    // value
    ctx.fillStyle = readCSSVar('--text-2');
    ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
    ctx.textBaseline = 'bottom';
    ctx.fillText(item.value, x, y - 4);

    // label
    ctx.fillStyle = readCSSVar('--text-2');
    ctx.font = '500 11px "Plus Jakarta Sans", sans-serif';
    ctx.textBaseline = 'top';
    const labelText = item.label.length > 9 ? item.label.slice(0, 8) + '…' : item.label;
    ctx.fillText(labelText, x, padding.t + chartH + 6);
  });
}

function roundedRect(ctx, x, y, w, h, r) {
  if (h < 0) { y += h; h = -h; }
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, 0);
  ctx.arcTo(x, y + h, x, y, 0);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
