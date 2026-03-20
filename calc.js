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

const windowsMultiplierEPPoff = [
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

const mcSensInput     = document.getElementById('mcSens');
const mcSensError     = document.getElementById('mcSensError');
const dpiInput        = document.getElementById('dpi');
const osSelect        = document.getElementById('osSelect');
const rawInputSelect  = document.getElementById('rawInput');
const osSens          = document.getElementById('osSens');
const osSensVal       = document.getElementById('osSensVal');
const osSensSliderRow = document.getElementById('osSensSliderRow');
const linuxSens       = document.getElementById('linuxSens');
const osSensLabel     = document.getElementById('osSensLabel');
const resolutionInput = document.getElementById('resolution');
const scalingInput    = document.getElementById('displayScaling');
const toolSensInput   = document.getElementById('toolSens');
const toolSensLabel   = document.getElementById('toolSensLabel');
const cm360El         = document.getElementById('cm360');
const mcPercEl        = document.getElementById('mcPercent');
const cursorEl        = document.getElementById('cursorSens');
const copyBtn         = document.getElementById('copyBtn');
const resetBtn        = document.getElementById('resetBtn');

const windowsToLinux = [
  null,
  -0.96875,
  -0.9375,
  -0.875,
  -0.75,
  -0.625,
  -0.5,
  -0.375,
  -0.25,
  -0.125,
  0.0,
  0.25,
  0.5,
  0.75,
  1.0,
  1.25,
  1.5,
  1.75,
  2.0,
  2.25,
  2.5
];

function updateOSUI() {
  const isLinux = osSelect.value === 'linux';

  if (isLinux) {
    osSensLabel.textContent = 'Linux cursor speed';
    osSensSliderRow.classList.add('hidden');
    linuxSens.classList.remove('hidden');
    const winVal = Math.round(safeNum(osSens.value));
    const mapped = (winVal >= 1 && winVal <= 20) ? windowsToLinux[winVal] : 0.0;
    linuxSens.value = mapped.toFixed(5).replace(/\.?0+$/, '') || '0';
    toolSensLabel.textContent = 'Waywall sensitivity (optional)';
  } else {
    osSensLabel.textContent = 'Windows cursor speed (1 to 20)';
    osSensSliderRow.classList.remove('hidden');
    linuxSens.classList.add('hidden');
    osSens.min  = 1;
    osSens.max  = 20;
    osSens.step = 1;
    osSensVal.textContent = osSens.value;
    toolSensLabel.textContent = 'Toolscreen sensitivity (optional)';
  }
}

function getSpeedFactor() {
  const isLinux = osSelect.value === 'linux';
  if (isLinux) {
    const linuxVal = safeNum(linuxSens.value);
    return isFinite(linuxVal) ? linuxVal + 1 : NaN;
  } else {
    const win = Math.round(safeNum(osSens.value));
    if (win >= 1 && win <= 20) return windowsMultiplierEPPoff[win];
    return NaN;
  }
}

function getScalingFactor() {
  const res     = resolutionInput.value.trim();
  const rawScaling = scalingInput.value.trim().replace('%', '');
  const scaling = safeNum(rawScaling);

  if (!res || !isFinite(scaling)) return NaN;

  const parts = res.toLowerCase().split('x');
  if (parts.length !== 2) return NaN;
  const height = safeNum(parts[1].trim());
  if (!isFinite(height) || height === 0) return NaN;

  return (1080 / height) * (scaling / 100);
}

function getToolFactor() {
  const val = safeNum(toolSensInput.value);
  return isFinite(val) ? val : null;
}

function getEdpi(dpi, speedFactor, scalingFactor, toolFactor, rawOn) {
  if (!isFinite(dpi)) return NaN;
  if (rawOn) {
    const isLinux = osSelect.value === 'linux';
    if (toolFactor === null) return dpi;
    if (isLinux) return dpi;
    return dpi * toolFactor;
  } else {
    if (!isFinite(scalingFactor) || !isFinite(speedFactor)) return NaN;
    if (toolFactor === null) return dpi * scalingFactor * speedFactor;
    return dpi * scalingFactor * speedFactor * toolFactor;
  }
}

function getRotationSens(edpi, sensValue) {
  if (!isFinite(edpi) || edpi === 0) return NaN;
  if (!isFinite(sensValue)) return NaN;
  return truncTo(6096 / (8 * edpi * Math.pow(0.6 * sensValue + 0.2, 3)), 2);
}

function compute() {
  const mc  = safeNum(mcSensInput.value);
  const dpi = safeNum(dpiInput.value);
  const rawOn = rawInputSelect.value === 'on';

  if (isFinite(mc) && (mc < 0 || mc > 1)) {
    mcSensError.classList.remove('hidden');
    mcSensInput.classList.add('input-error');
  } else {
    mcSensError.classList.add('hidden');
    mcSensInput.classList.remove('input-error');
  }

  if (isFinite(mc) && mc >= 0 && mc <= 1) {
    mcPercEl.textContent = Math.trunc(mc * 2 * 100) + '%';
    mcPercEl.classList.remove('hidden');
  } else {
    mcPercEl.classList.add('hidden');
  }

  if (!isFinite(mc) || !isFinite(dpi) || mc < 0 || mc > 1) {
    cm360El.textContent    = '—';
    cursorEl.textContent   = '—';
    return;
  }

  const speedFactor   = getSpeedFactor();
  const scalingFactor = getScalingFactor();
  const toolFactor    = getToolFactor();

  const edpi = getEdpi(dpi, speedFactor, scalingFactor, toolFactor, rawOn);

  const cm360 = getRotationSens(edpi, mc);

  let cursorSpeed = NaN;
  if (isFinite(speedFactor) && isFinite(scalingFactor) && isFinite(dpi)) {
    cursorSpeed = speedFactor * scalingFactor * dpi;
  }

  cm360El.textContent  = isFinite(cm360)       ? cm360.toFixed(2)              : '—';
  cursorEl.textContent = isFinite(cursorSpeed)  ? Math.round(cursorSpeed).toString() : '—';
}

const card = document.querySelector('.card');
requestAnimationFrame(() => {
  const top = card.getBoundingClientRect().top + window.scrollY;
  card.style.marginTop = top + 'px';
  document.body.style.alignItems = 'flex-start';
  document.body.style.paddingTop = '0';
});

mcSensInput.addEventListener('input', compute);
dpiInput.addEventListener('input', compute);
resolutionInput.addEventListener('input', compute);
scalingInput.addEventListener('input', compute);
toolSensInput.addEventListener('input', compute);
rawInputSelect.addEventListener('change', () => {
  rawInputSelect.blur();
  compute();
});

osSelect.addEventListener('change', () => {
  osSelect.blur();
  updateOSUI();
  compute();
});

osSens.addEventListener('input', () => {
  osSensVal.textContent = osSens.value;
  compute();
});

linuxSens.addEventListener('input', compute);

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

let copyResetPending = false;

copyBtn.addEventListener('click', () => {
  const na = 'n/a';
  const text = [
    `mcSens=${mcSensInput.value || na}`,
    `DPI=${dpiInput.value || na}`,
    `OS=${osSelect.value}`,
    `RawInput=${rawInputSelect.value}`,
    `OSSens=${osSelect.value === 'linux' ? (linuxSens.value || na) : osSensVal.textContent}`,
    `Resolution=${resolutionInput.value || na}`,
    `DisplayScaling=${scalingInput.value || na}`,
    `ToolSens=${toolSensInput.value || na}`,
    `cm/360=${cm360El.textContent === '—' ? na : cm360El.textContent}`,
    `mc%=${mcPercEl.textContent || na}`,
    `cursorSpeed=${cursorEl.textContent === '—' ? na : cursorEl.textContent}`
  ].join('\n');
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      copyBtn.textContent = 'Copied!';
      copyResetPending = true;
    });
  }
});

copyBtn.addEventListener('mouseleave', () => {
  if (copyResetPending) {
    copyResetPending = false;
    setTimeout(() => {
      copyBtn.textContent = 'Copy';
    }, 750);
  }
});

resetBtn.addEventListener('click', () => {
  mcSensInput.value      = '';
  dpiInput.value         = '';
  osSelect.value         = 'windows';
  rawInputSelect.value   = 'on';
  resolutionInput.value  = '';
  scalingInput.value     = '';
  toolSensInput.value    = '';
  linuxSens.value        = '';
  osSens.value           = 10;
  osSensVal.textContent  = '10';
  mcPercEl.classList.add('hidden');
  mcSensError.classList.add('hidden');
  mcSensInput.classList.remove('input-error');
  updateOSUI();
  compute();
});

updateOSUI();
compute();
