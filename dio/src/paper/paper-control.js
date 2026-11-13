import { SCALES, validatePrintSettings, solvePaper } from './paper.js';

export function createPaperControl({ dimensions, changed }) {
  let settings = validatePrintSettings();
  let saved = { ...settings };
  let current;
  let customSelected = false;
  const original = document.getElementById('scale');
  const scale = document.createElement('input');
  scale.type = 'hidden';
  scale.id = 'scale';
  scale.value = '500';
  original.replaceWith(scale);
  const panel = scale.closest('.export-panel');
  const root = document.createElement('div');
  root.id = 'paper-controls';
  root.innerHTML = `
    <label for="paper-format" class="field-label">Papír detailu</label>
    <select id="paper-format">
      <option value="free">Vlastní rozměr podle měřítka</option>
      <option value="A4">Vejít na A4</option>
      <option value="A3">Vejít na A3</option>
    </select>
    <div id="paper-fixed">
      <label for="paper-mode" class="field-label">Přizpůsobení</label>
      <select id="paper-mode">
        <option value="recommended">Doporučené měřítko</option>
        <option value="exact">Přesně využít papír</option>
        <option value="manual">Zachovat zadané měřítko</option>
      </select>
      <label for="paper-orientation" class="field-label">Orientace papíru</label>
      <select id="paper-orientation">
        <option value="auto">Automaticky</option>
        <option value="portrait">Na výšku</option>
        <option value="landscape">Na šířku</option>
      </select>
      <label for="paper-margin" class="field-label">Okraje (mm)</label>
      <input id="paper-margin" type="number" min="0" max="50" step="1" value="10">
    </div>
  `;
  panel.querySelector('label[for="scale"]').before(root);
  const choice = document.createElement('select');
  choice.id = 'scale-choice';
  for (const value of [...SCALES, 'custom']) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value === 'custom' ? 'Vlastní měřítko…' :
      `1 : ${new Intl.NumberFormat('cs-CZ').format(value)}`;
    choice.append(option);
  }
  scale.after(choice);
  panel.querySelector('label[for="scale"]').htmlFor = 'scale-choice';
  const customBox = document.createElement('div');
  customBox.innerHTML = `
    <label for="scale-custom" class="field-label">Vlastní měřítko 1 : …</label>
    <input id="scale-custom" type="number" min="1" max="1000000" step="any" value="500">
  `;
  choice.after(customBox);
  const info = document.createElement('p');
  info.id = 'paper-info';
  info.setAttribute('role', 'status');
  info.setAttribute('aria-live', 'polite');
  customBox.after(info);
  const style = document.createElement('style');
  style.textContent = `
    #paper-margin, #scale-custom {
      width: 100%;
      min-height: 42px;
      margin-bottom: 10px;
      padding: 8px 10px;
      border: 1px solid var(--line, #ddd);
      border-radius: 9px;
    }
    #paper-info {
      font-size: 12px;
      color: var(--muted, #64747e);
      overflow-wrap: anywhere;
    }
    #paper-info[data-error="true"] {
      color: #9b411b;
    }
  `;
  root.append(style);
  const get = (id) => document.getElementById(id);
  const number = (n) => new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 6 }).format(n);

  function resolve() {
    return solvePaper(dimensions(), settings);
  }

  function refresh() {
    current = null;
    get('paper-fixed').hidden = settings.format === 'free';
    const automatic = settings.format !== 'free' && settings.mode !== 'manual';
    choice.disabled = automatic;
    get('scale-custom').disabled = automatic;
    let shown = settings.scale;
    info.dataset.error = 'false';
    try {
      saved = validatePrintSettings(settings);
      if (dimensions()) {
        current = resolve();
        shown = current.scale;
        scale.value = String(current.scale);
        const orientation = current.orientation === 'landscape' ? 'na šířku' : 'na výšku';
        const size = `${number(current.widthMm)} × ${number(current.heightMm)} mm`;
        info.textContent = `List: ${size}${current.format === 'free' ? '' : `, ${orientation}`}. Měřítko 1 : ${number(current.scale)}.`;
        if (!current.fits) {
          info.dataset.error = 'true';
          info.textContent += ` Nevejde se s okraji ${settings.marginMm} mm. Použij doporučené měřítko nebo větší papír.`;
        }
      } else {
        scale.value = String(settings.scale);
        info.textContent = 'Vyber výřez pro výpočet velikosti papíru.';
      }
    } catch (error) {
      info.dataset.error = 'true';
      info.textContent = error.message;
    }
    choice.value = (!automatic && customSelected) || !SCALES.includes(shown) ? 'custom' : String(shown);
    customBox.hidden = choice.value !== 'custom';
    if (Number.isFinite(shown)) get('scale-custom').value = String(shown);
  }

  function change(update) {
    settings = { ...settings, ...update };
    refresh();
    changed();
  }
  get('paper-format').onchange = (event) => change({ format: event.target.value });
  get('paper-mode').onchange = (event) => change({ mode: event.target.value });
  get('paper-orientation').onchange = (event) => change({ orientation: event.target.value });
  get('paper-margin').onchange = (event) => change({ marginMm: event.target.valueAsNumber });
  choice.onchange = () => {
    customSelected = choice.value === 'custom';
    change({ scale: customSelected ? get('scale-custom').valueAsNumber : Number(choice.value) });
  };
  get('scale-custom').onchange = (event) => change({ scale: event.target.valueAsNumber });
  refresh();
  return {
    resolve, refresh,
    ready() {
      return Boolean(current?.fits) && info.dataset.error !== 'true';
    },
    snapshot() {
      return { ...saved };
    },
    adopt(value) {
      settings = validatePrintSettings(value);
      customSelected = !SCALES.includes(settings.scale);
      for (const [id, key] of [
        ['paper-format', 'format'], ['paper-mode', 'mode'],
        ['paper-orientation', 'orientation'], ['paper-margin', 'marginMm']
      ]) get(id).value = settings[key];
      refresh();
    }
  };
}

