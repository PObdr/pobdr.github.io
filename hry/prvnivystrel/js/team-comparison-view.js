import {orderedEdges, collectSamples, duration} from './histogram-model.js';
import {compareSectionTimes} from './team-comparison-model.js';
import {esc} from './utils.js';

const palette = ['#2563eb', '#c2410c', '#7c3aed', '#0f766e'];
const signed = value => value == null ? '—'
  : (value < 0 ? '−' : value > 0 ? '+' : '') + duration(Math.abs(value));

export function mountTeamComparison(model) {
  const roster = [...model.teams].sort((a, b) => a.name.localeCompare(b.name, 'cs'));
  const byId = new Map(roster.map(t => [t.id, t]));
  const stations = new Map([...model.stations].map(([id, s]) => [
    id, [id, s.name, s.lat, s.lon, null, null, '', s.nextId]
  ]));
  const edges = orderedEdges(stations, model.route[0]);
  const samples = collectSamples(model.teams, edges);
  let ids = roster.filter(t => samples.some(s => s.teamId === t.id)).slice(0, 2).map(t => t.id);
  const colors = new Map();
  const color = id => {
    if (!colors.has(id)) colors.set(id, palette.find(c => !ids.some(other => other !== id && colors.get(other) === c)) || palette[0]);
    return colors.get(id);
  };
  document.body.innerHTML = `
    <style>
      .tc {
        max-width: 1300px;
        margin: auto;
        padding: 24px;
        color: #172b49;
        font: 14px system-ui;
      }
      .tc h1 {
        font-size: clamp(26px, 4vw, 40px);
        margin-bottom: 8px;
      }
      .tc .tc-muted {
        color: #51627b;
      }
      .tc .tc-controls,
      .tc .tc-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin: 20px 0;
      }
      .tc button,
      .tc select {
        padding: 9px 12px;
        border: 1px solid #cbd5e1;
        border-radius: 10px;
        background: white;
        color: inherit;
        font: inherit;
      }
      .tc button {
        cursor: pointer;
      }
      .tc button:focus-visible,
      .tc select:focus-visible {
        outline: 3px solid #eab308;
        outline-offset: 2px;
      }
      .tc .tc-chip {
        border-left: 6px solid var(--team);
      }
      .tc .tc-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 16px;
      }
      .tc .tc-card,
      .tc .tc-section {
        padding: 18px;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        background: white;
        box-shadow: 0 5px 20px #172b4908;
      }
      .tc .tc-card {
        border-top: 5px solid var(--team);
      }
      .tc .tc-total {
        font-size: 30px;
        font-weight: 700;
      }
      .tc .tc-section {
        margin: 20px 0;
      }
      .tc .tc-lane {
        display: grid;
        grid-template-columns: minmax(100px, 180px) minmax(180px, 1fr) 80px;
        gap: 10px;
        align-items: center;
        width: 100%;
        margin: 7px 0;
        text-align: left;
      }
      .tc .tc-track {
        position: relative;
        display: block;
        height: 22px;
        background: linear-gradient(to right, #eff6ff 50%, #fff7ed 50%);
        border-left: 1px solid #dbeafe;
        border-right: 1px solid #ffedd5;
      }
      .tc .tc-track::after {
        content: '';
        position: absolute;
        left: 50%;
        height: 100%;
        border-left: 2px solid #64748b;
      }
      .tc .tc-bar {
        position: absolute;
        left: var(--left);
        width: var(--width);
        height: 100%;
        border-radius: 4px;
        background: var(--team);
      }
      .tc .tc-scroll {
        overflow-x: auto;
      }
      .tc .tc-plot {
        min-width: 520px;
      }
      .tc table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 5px;
      }
      .tc td,
      .tc th {
        padding: 10px;
        text-align: left;
        border-radius: 6px;
      }
      .tc .tc-gain {
        background: #dcfce7;
        color: #14532d;
      }
      .tc .tc-loss {
        background: #ffedd5;
        color: #7c2d12;
      }
    </style>
    <main class="tc">
      <p class="tc-muted">První výstřel · ${model.edition.year}</p>
      <h1>Kdo kde získal a ztratil</h1>
      <p>Vyber až čtyři týmy. Vlevo od nuly je získaný čas, vpravo ztracený.</p>
      <div class="tc-controls">
        <label>Přidat tým <select id="tc-add"></select></label>
        <label>Srovnávat s <select id="tc-reference"></select></label>
        <label>Úseky
          <select id="tc-kind">
            <option value="normal">Mezi stanovišti</option>
            <option value="initial">Z nultých míst</option>
          </select>
        </label>
      </div>
      <div id="tc-chips" class="tc-chips"></div>
      <p id="tc-status" role="status"></p>
      <div id="tc-cards" class="tc-cards"></div>
      <p class="tc-muted">
        Bilance používá pouze úseky dokončené všemi vybranými týmy.
        Největší zisk a ztráta používají všechny srovnatelné úseky daného týmu.
        Medián všech týmů se výběrem nemění. Při opakování úseku používáme medián týmu.
        Časy zahrnují přesun, řešení i čekání; nejde o oficiální pořadí.
      </p>
      <div class="tc-section">
        <h2>Zisky a ztráty po úsecích</h2>
        <p id="tc-scale" class="tc-muted"></p>
        <p id="tc-detail" role="status" aria-live="polite">Vyber sloupec pro přesný čas a srovnání.</p>
        <div class="tc-scroll"><div id="tc-chart" class="tc-plot"></div></div>
      </div>
      <div class="tc-section tc-scroll">
        <h2>Rychlý přehled rozdílů</h2>
        <div id="tc-matrix"></div>
      </div>
    </main>
  `;
  const get = id => document.getElementById('tc-' + id);
  let result;

  function controls(reference = '') {
    get('add').innerHTML = '<option value="">Vyber tým…</option>' + roster
      .filter(t => !ids.includes(t.id))
      .map(t => `<option value="${t.id}">${esc(t.name)} #${t.id}</option>`).join('');
    get('add').disabled = ids.length >= 4 || ids.length === roster.length;
    get('reference').innerHTML = '<option value="">Medián všech týmů</option>' + ids
      .map(id => `<option value="${id}">${esc(byId.get(id).name)} #${id}</option>`).join('');
    get('reference').value = ids.includes(Number(reference)) && reference !== '' ? reference : '';
    get('chips').innerHTML = ids.map(id => `
      <button class="tc-chip" data-remove="${id}" style="--team:${color(id)}"
        aria-label="Odebrat ${esc(byId.get(id).name)}">${esc(byId.get(id).name)} #${id} ×</button>
    `).join('');
  }

  function render() {
    result = compareSectionTimes(samples, edges, {
      teamIds: ids,
      referenceTeamId: get('reference').value === '' ? null : Number(get('reference').value),
      initial: get('kind').value === 'initial'
    });
    get('status').textContent = ids.length
      ? ids.length + ' týmů · ' + result.commonEdgeIndexes.length + ' společných úseků pro bilanci'
      : 'Přidej tým pro zobrazení porovnání.';
    const extreme = item => item ? esc(item.label) + ': ' + signed(item.deltaSeconds) : 'žádný';
    get('cards').innerHTML = result.totals.map(t => `
      <article class="tc-card" style="--team:${color(t.teamId)}">
        <h2>${esc(byId.get(t.teamId).name)}</h2>
        <div class="tc-total">${signed(t.deltaSeconds)}</div>
        <p>Bilance na ${result.commonEdgeIndexes.length} společných úsecích</p>
        <p>Největší zisk: ${extreme(t.bestGain)}</p>
        <p>Největší ztráta: ${extreme(t.worstLoss)}</p>
        <small>${t.comparableCount} srovnatelných úseků tohoto týmu</small>
      </article>
    `).join('');
    const max = Math.max(1, ...result.rows.flatMap(r => r.cells.map(c => Math.abs(c.deltaSeconds ?? 0))));
    get('scale').textContent = '← ZISK · 0 · ZTRÁTA → | společné měřítko ±' + duration(max);
    get('detail').textContent = 'Vyber sloupec pro přesný čas a srovnání.';
    get('chart').innerHTML = ids.length ? result.rows.map(row => `
      <section>
        <h3>${esc(row.label)}</h3>
        ${row.cells.map(cell => {
          const delta = cell.deltaSeconds;
          const width = delta == null ? 0 : Math.abs(delta) / max * 45;
          const left = delta != null && delta < 0 ? 50 - width : 50;
          return `
            <button class="tc-lane" data-edge="${row.edge}" data-team="${cell.teamId}"
              style="--team:${color(cell.teamId)};--left:${left}%;--width:${width}%"
              aria-label="${esc(row.label)}, ${esc(byId.get(cell.teamId).name)}: ${delta == null ? 'bez srovnání' : signed(delta)}">
              <span>${esc(byId.get(cell.teamId).name)}</span>
              <span class="tc-track"><span class="tc-bar"></span></span>
              <span>${delta == null ? '—' : signed(delta)}</span>
            </button>
          `;
        }).join('')}
      </section>
    `).join('') : '';
    get('matrix').innerHTML = ids.length ? `
      <table>
        <caption>Záporná hodnota = zisk, kladná = ztráta, — = bez srovnání</caption>
        <thead><tr><th scope="col">Úsek</th>${ids.map(id => `<th scope="col">${esc(byId.get(id).name)}</th>`).join('')}</tr></thead>
        <tbody>${result.rows.map(row => `
          <tr><th scope="row">${esc(row.label)}</th>${row.cells.map(cell => `
            <td class="${cell.deltaSeconds < 0 ? 'tc-gain' : cell.deltaSeconds > 0 ? 'tc-loss' : ''}">${signed(cell.deltaSeconds)}</td>
          `).join('')}</tr>
        `).join('')}</tbody>
      </table>
    ` : '';
  }

  get('add').onchange = () => {
    if (get('add').value === '' || ids.length >= 4) return;
    const reference = get('reference').value;
    ids.push(Number(get('add').value));
    controls(reference);
    render();
  };
  get('chips').onclick = event => {
    const button = event.target.closest('[data-remove]');
    if (!button) return;
    const reference = get('reference').value;
    const removed = Number(button.dataset.remove);
    ids = ids.filter(id => id !== removed);
    colors.delete(removed);
    controls(reference);
    render();
  };
  get('reference').onchange = render;
  get('kind').onchange = render;
  const describe = event => {
    const button = event.target.closest('[data-edge][data-team]');
    if (!button) return;
    const row = result.rows[Number(button.dataset.edge)];
    const cell = row.cells.find(c => c.teamId === Number(button.dataset.team));
    const actual = cell.seconds == null ? 'bez záznamu' : duration(cell.seconds);
    const baseline = row.baselineSeconds == null ? 'bez záznamu' : duration(row.baselineSeconds);
    get('detail').textContent = row.label + ' · ' + byId.get(cell.teamId).name +
      ': čas ' + actual + ', základ ' + baseline + ', rozdíl ' + signed(cell.deltaSeconds) +
      ' · základ z ' + row.baselineTeamCount + ' týmů · průchodů týmu ' + cell.passageCount;
  };
  for (const type of ['click', 'pointerover', 'focusin']) get('chart').addEventListener(type, describe);
  controls();
  render();
}
