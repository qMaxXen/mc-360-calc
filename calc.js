function parseNumber(value) {
  if (value === null || value === undefined) return NaN;
  const trimmedValue = String(value).trim();
  if (trimmedValue === '') return NaN;
  return Number(trimmedValue);
}

function truncateToDecimals(value, decimalPlaces) {
  if (!isFinite(value)) return NaN;
  const multiplier = Math.pow(10, decimalPlaces);
  return Math.trunc(value * multiplier) / multiplier;
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

const mcSensInput = document.getElementById('mcSens');
const mcSensError = document.getElementById('mcSensError');
const dpiInput = document.getElementById('dpi');
const osSelect = document.getElementById('osSelect');
const rawInputSelect = document.getElementById('rawInput');
const osSens = document.getElementById('osSens');
const osSensVal = document.getElementById('osSensVal');
const osSensSliderRow = document.getElementById('osSensSliderRow');
const linuxSens = document.getElementById('linuxSens');
const osSensLabel = document.getElementById('osSensLabel');
const resolutionInput = document.getElementById('resolution');
const scalingInput = document.getElementById('displayScaling');
const toolscreenSensInput = document.getElementById('toolscreenSens');
const toolscreenSensLabel = document.getElementById('toolscreenSensLabel');
const cm360Element = document.getElementById('cm360');
const mcSensPercentElement = document.getElementById('mcSensPercent');
const cursorElement = document.getElementById('cursorSens');
const copyBtn = document.getElementById('copyBtn');
const resetBtn = document.getElementById('resetBtn');

function isLinuxSelected() {
  return osSelect.value === 'linux';
}

function updateOSFields() {
  if (isLinuxSelected()) {
    osSensLabel.textContent = 'Linux cursor speed';
    osSensSliderRow.classList.add('hidden');
    linuxSens.classList.remove('hidden');
    const windowsSensSetting = Math.round(parseNumber(osSens.value));

    let equivalentLinuxSens;
    if (windowsSensSetting >= 1 && windowsSensSetting <= 20) {
      equivalentLinuxSens = windowsToLinux[windowsSensSetting];
    } else {
      equivalentLinuxSens = 0.0;
    }

    linuxSens.value = equivalentLinuxSens.toFixed(5).replace(/\.?0+$/, '') || '0';
    toolscreenSensLabel.textContent = 'waywall sensitivity (optional)';
  } else {
    osSensLabel.textContent = 'Windows cursor speed (1 to 20)';
    osSensSliderRow.classList.remove('hidden');
    linuxSens.classList.add('hidden');
    osSens.min = 1;
    osSens.max = 20;
    osSens.step = 1;
    osSensVal.textContent = osSens.value;
    toolscreenSensLabel.textContent = 'Toolscreen sensitivity (optional)';
  }
}

function getOsSensMultiplier() {
  if (isLinuxSelected()) {
    const linuxSensValue = parseNumber(linuxSens.value);
    return isFinite(linuxSensValue) ? linuxSensValue + 1 : NaN;
  }

  const windowsSensSetting = Math.round(parseNumber(osSens.value));
  if (windowsSensSetting >= 1 && windowsSensSetting <= 20) {
    return windowsMultiplierEPPoff[windowsSensSetting];
  }
  return NaN;
}

function getDisplayScalingMultiplier() {
  const resolution = resolutionInput.value.trim();
  const displayScalingPercentText = scalingInput.value.trim().replace('%', '');
  const displayScalingPercent = parseNumber(displayScalingPercentText);

  if (!resolution || !isFinite(displayScalingPercent)) return NaN;

  const resolutionParts = resolution.toLowerCase().split('x');
  if (resolutionParts.length !== 2) return NaN;

  const screenHeight = parseNumber(resolutionParts[1].trim());
  if (!isFinite(screenHeight) || screenHeight === 0) return NaN;

  return (1080 / screenHeight) * (displayScalingPercent / 100);
}

function getToolscreenMultiplier() {
  const toolscreenValue = parseNumber(toolscreenSensInput.value);

  if (isFinite(toolscreenValue)) {
    return toolscreenValue;
  }
  return null;
}

function getEdpi(dpi, osSensMultiplier, displayScalingMultiplier, toolscreenMultiplier, isRawInputOn) {
  if (!isFinite(dpi)) return NaN;

  if (isRawInputOn) {
    if (toolscreenMultiplier === null) return dpi;
    if (isLinuxSelected()) return dpi;
    return dpi * toolscreenMultiplier;
  }

  if (!isFinite(osSensMultiplier)) return NaN;

  if (isLinuxSelected()) {
    if (toolscreenMultiplier === null) return dpi * osSensMultiplier;
    return dpi * osSensMultiplier * toolscreenMultiplier;
  }

  if (!isFinite(displayScalingMultiplier)) return NaN;
  if (toolscreenMultiplier === null) return dpi * displayScalingMultiplier * osSensMultiplier;
  return dpi * displayScalingMultiplier * osSensMultiplier * toolscreenMultiplier;
}

function getCm360(edpi, minecraftSensitivity) {
  if (!isFinite(edpi) || edpi === 0) return NaN;
  if (!isFinite(minecraftSensitivity)) return NaN;

  return truncateToDecimals(6096 / (8 * edpi * Math.pow(0.6 * minecraftSensitivity + 0.2, 3)), 2);
}

function updateResults() {
  const minecraftSensitivity = parseNumber(mcSensInput.value);
  const dpi = parseNumber(dpiInput.value);
  const isRawInputOn = rawInputSelect.value === 'on';

  if (isFinite(minecraftSensitivity) && (minecraftSensitivity < 0 || minecraftSensitivity > 1)) {
    mcSensError.classList.remove('hidden');
    mcSensInput.classList.add('input-error');
  } else {
    mcSensError.classList.add('hidden');
    mcSensInput.classList.remove('input-error');
  }

  if (isFinite(minecraftSensitivity) && minecraftSensitivity >= 0 && minecraftSensitivity <= 1) {
    mcSensPercentElement.textContent = Math.trunc(minecraftSensitivity * 2 * 100) + '%';
    mcSensPercentElement.classList.remove('hidden');
  } else {
    mcSensPercentElement.classList.add('hidden');
  }

  if (!isFinite(minecraftSensitivity) || !isFinite(dpi) || minecraftSensitivity < 0 || minecraftSensitivity > 1) {
    cm360Element.textContent = '-';
    cursorElement.textContent = '-';
    return;
  }

  const osSensMultiplier = getOsSensMultiplier();
  const displayScalingMultiplier = getDisplayScalingMultiplier();
  const toolscreenMultiplier = getToolscreenMultiplier();
  const edpi = getEdpi(dpi, osSensMultiplier, displayScalingMultiplier, toolscreenMultiplier, isRawInputOn);
  const cm360 = getCm360(edpi, minecraftSensitivity);

  let cursorSpeed = NaN;
  if (isFinite(osSensMultiplier) && isFinite(displayScalingMultiplier) && isFinite(dpi)) {
    cursorSpeed = osSensMultiplier * displayScalingMultiplier * dpi;
  }

  cm360Element.textContent = isFinite(cm360) ? cm360.toFixed(2) : '-';
  cursorElement.textContent = isFinite(cursorSpeed) ? Math.round(cursorSpeed).toString() : '-';
}

const mainContainer = document.querySelector('.main-container');
requestAnimationFrame(() => {
  const cardTopOffset = mainContainer.getBoundingClientRect().top + window.scrollY;
  mainContainer.style.marginTop = cardTopOffset + 'px';
  document.body.style.alignItems = 'flex-start';
  document.body.style.paddingTop = '0';
});

mcSensInput.addEventListener('input', updateResults);
dpiInput.addEventListener('input', updateResults);
resolutionInput.addEventListener('input', updateResults);
scalingInput.addEventListener('input', updateResults);
toolscreenSensInput.addEventListener('input', updateResults);
rawInputSelect.addEventListener('change', () => {
  rawInputSelect.blur();
  updateResults();
});

osSelect.addEventListener('change', () => {
  osSelect.blur();
  updateOSFields();
  updateResults();
});

osSens.addEventListener('input', () => {
  osSensVal.textContent = osSens.value;
  updateResults();
});

linuxSens.addEventListener('input', updateResults);

document.getElementById('dpiMinus').addEventListener('click', () => {
  const currentDpi = parseNumber(dpiInput.value);

  if (isFinite(currentDpi)) {
    dpiInput.value = Math.max(100, currentDpi - 100);
  } else {
    dpiInput.value = 900;
  }

  updateResults();
});

document.getElementById('dpiPlus').addEventListener('click', () => {
  const currentDpi = parseNumber(dpiInput.value);

  if (isFinite(currentDpi)) {
    dpiInput.value = currentDpi + 100;
  } else {
    dpiInput.value = 1100;
  }

  updateResults();
});

copyBtn.addEventListener('click', () => {
  const notAvailable = 'n/a';

  let osSensitivityValue;
  if (isLinuxSelected()) {
    osSensitivityValue = linuxSens.value || notAvailable;
  } else {
    osSensitivityValue = osSensVal.textContent;
  }

  const clipboardLines = [
    `mcSens=${mcSensInput.value || notAvailable}`,
    `DPI=${dpiInput.value || notAvailable}`,
    `OS=${osSelect.value}`,
    `RawInput=${rawInputSelect.value}`,
    `OSSens=${osSensitivityValue}`,
    `Resolution=${resolutionInput.value || notAvailable}`,
    `DisplayScaling=${scalingInput.value || notAvailable}`,
    `ToolSens=${toolscreenSensInput.value || notAvailable}`,
    `cm/360=${cm360Element.textContent === '-' ? notAvailable : cm360Element.textContent}`,
    `mc%=${mcSensPercentElement.textContent || notAvailable}`,
    `cursorSpeed=${cursorElement.textContent === '-' ? notAvailable : cursorElement.textContent}`
  ];

  const clipboardText = clipboardLines.join('\n');

  navigator.clipboard.writeText(clipboardText).then(() => {
    copyBtn.textContent = 'Copied!';
    setTimeout(() => {
      copyBtn.textContent = 'Copy';
    }, 1000);
  });
});

resetBtn.addEventListener('click', () => {
  mcSensInput.value = '';
  dpiInput.value = '';
  osSelect.value = 'windows';
  rawInputSelect.value = 'on';
  resolutionInput.value = '';
  scalingInput.value = '';
  toolscreenSensInput.value = '';
  linuxSens.value = '';
  osSens.value = 10;
  osSensVal.textContent = '10';
  mcSensPercentElement.classList.add('hidden');
  mcSensError.classList.add('hidden');
  mcSensInput.classList.remove('input-error');
  updateOSFields();
  updateResults();
});

updateOSFields();
updateResults();
