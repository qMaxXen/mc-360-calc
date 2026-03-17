function safeNum(v) {
  if (v === null || v === undefined) return NaN;
  const s = String(v).trim();
  if (s === '') return NaN;
  return Number(s);
}

function truncTo(n, d) {
  if (!isFinite(n)) return NaN;
  const p = Math.pow(10, d);
  return Math.trunc(n * p) / p;
}

const defaultLookup = [
  null,
  0.03125, // 1
  0.0625,  // 2
  0.125,   // 3
  0.25,    // 4
  0.375,   // 5
  0.5,     // 6
  0.625,   // 7
  0.75,    // 8
  0.875,   // 9
  1,       // 10
  1.25,    // 11
  1.5,     // 12
  1.75,    // 13
  2,       // 14
  2.25,    // 15
  2.5,     // 16
  2.75,    // 17
  3,       // 18
  3.25,    // 19
  3.5      // 20
];
let lookup = defaultLookup.slice();

const mcSensInput     = document.getElementById('mcSens');
const mcSensError     = document.getElementById('mcSensError');
const dpiInput      = document.getElementById('dpi');
const winRange      = document.getElementById('winSens');
const winVal        = document.getElementById('winVal');
const in360El       = document.getElementById('in360');
const cm360El       = document.getElementById('cm360');
const degPerCountEl = document.getElementById('degPerCount');
const mcPercEl      = document.getElementById('mcPercent');
const cursorEl      = document.getElementById('cursorSens');
const copyBtn       = document.getElementById('copyBtn');
const resetBtn      = document.getElementById('resetBtn');

function compute() {
  const mc  = safeNum(mcSensInput.value);
  const dpi = safeNum(dpiInput.value);
  const win = safeNum(winRange.value);

  if (isFinite(mc) && (mc < 0 || mc > 1)) {
    mcSensError.classList.remove('hidden');
    mcSensInput.classList.add('input-error');
  } else {
    mcSensError.classList.add('hidden');
    mcSensInput.classList.remove('input-error');
  }

  if (!isFinite(mc) || !isFinite(dpi) || mc < 0 || mc > 1) {
    in360El.textContent = '—';
    cm360El.textContent = '—';
    degPerCountEl.textContent = '—';
    mcPercEl.textContent = '—';
    cursorEl.textContent = '—';
    return;
  }

  const degreesPerCount = Math.pow(mc * 0.6 + 0.2, 3) * 1.2;
  const countsPer360    = 360 / (degreesPerCount * dpi);
  const in360           = truncTo(countsPer360, 2);
  const cm360           = truncTo(countsPer360 * 2.54, 2);

  in360El.textContent       = isFinite(in360) ? in360.toFixed(2) : '—';
  cm360El.textContent       = isFinite(cm360) ? cm360.toFixed(2) : '—';
  degPerCountEl.textContent = isFinite(degreesPerCount) ? truncTo(degreesPerCount, 6).toFixed(6) : '—';
  mcPercEl.textContent      = isFinite(mc) ? (Math.trunc(mc * 2 * 100) + '%') : '—';

  let multiplier = NaN;
  if (isFinite(win) && Number.isInteger(win) && win >= 1 && win <= 20) {
    multiplier = lookup[win];
  }
  const cursorVal = isFinite(multiplier) && isFinite(dpi) ? multiplier * dpi : NaN;
  cursorEl.textContent = isFinite(cursorVal) ? Math.round(cursorVal).toString() : '—';
}

mcSensInput.addEventListener('input', compute);
dpiInput.addEventListener('input', compute);
winRange.addEventListener('input', e => { winVal.textContent = e.target.value; compute(); });

document.getElementById('dpiMinus').addEventListener('click', () => {
  const current = safeNum(dpiInput.value);
  dpiInput.value = isFinite(current) ? Math.max(100, current - 100) : 900;
  compute();
});

document.getElementById('dpiPlus').addEventListener('click', () => {
  const current = safeNum(dpiInput.value);
  dpiInput.value = isFinite(current) ? current + 100 : 1100;
  compute();
});

copyBtn.addEventListener('click', () => {
  const text = [
    `mcSens=${mcSensInput.value || ''}`,
    `DPI=${dpiInput.value || ''}`,
    `WindowsSens=${winRange.value}`,
    `in/360=${in360El.textContent}`,
    `cm/360=${cm360El.textContent}`,
    `degreesPerCount=${degPerCountEl.textContent}`,
    `mc%=${mcPercEl.textContent}`,
    `cursorSens=${cursorEl.textContent}`
  ].join('\n');
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = 'Copy'; }, 900);
    });
  }
});

resetBtn.addEventListener('click', () => {
  mcSensInput.value = '';
  dpiInput.value    = '';
  winRange.value    = '10';
  winVal.textContent = '10';
  lookup = defaultLookup.slice();
  mcSensError.classList.add('hidden');
  mcSensInput.classList.remove('input-error');
  compute();
});

winRange.value     = '10';
winVal.textContent = '10';
mcSensInput.value  = '';
dpiInput.value     = '';
compute();