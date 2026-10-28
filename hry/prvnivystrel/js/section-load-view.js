import {orderedEdges, collectSamples, duration} from './histogram-model.js';
import {analyzeSectionLoads, teamsOnSection} from './section-load-model.js';
import {esc, fmt} from './utils.js';

export function mountSectionLoads(model) {
  const stations = new Map([...model.stations].map(([id, s]) => [
    id, [id, s.name, s.lat, s.lon, null, null, '', s.nextId]
  ]));
  const edges = orderedEdges(stations, model.route[0]);
  const sections = analyzeSectionLoads(collectSamples(model.teams, edges), edges);
  const offset = model.edition.offsetSeconds ?? 0;
  const clock = time => fmt(time + offset);
  const elapsed = time => time == null ? '—' : duration(time);
  const root = document.createElement('section');
  root.className = 'section-load';
  root.setAttribute('aria-labelledby', 'sl-heading');
  root.innerHTML = `
    <style>
      .section-load {
        margin: 1rem;
        padding: 1rem;
        border: 1px solid #cbd5e1;
        border-radius: 0.5rem;
        background: white;
        color: #172033;
      }
      .section-load .sl-controls {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        margin: 1rem 0;
      }
      .section-load .sl-scroll {
        overflow-x: auto;
      }
      .section-load table {
        width: 100%;
        border-collapse: collapse;
      }
      .section-load th,
      .section-load td {
        padding: 0.5rem;
        border-bottom: 1px solid #e2e8f0;
        text-align: left;
      }
      .section-load button[aria-pressed="true"] {
        outline: 2px solid #1d4ed8;
      }
      .section-load svg {
        display: block;
        width: 100%;
        min-width: 600px;
      }
      .section-load [data-time]:focus {
        outline: 3px solid #b45309;
      }
      .section-load .sl-bars {
        padding: 0;
        list-style: none;
      }
      .section-load .sl-bar {
        display: grid;
        grid-template-columns: minmax(8rem, 14rem) minmax(12rem, 1fr);
        align-items: center;
        gap: 0.5rem;
        width: 100%;
        padding: 0.4rem;
        text-align: left;
        background: transparent;
        color: inherit;
        border: 0;
      }
      .section-load .sl-track {
        display: block;
        height: 1rem;
        background: #f1f5f9;
      }
      .section-load .sl-fill {
        display: block;
        margin-left: var(--left);
        width: max(2px, var(--width));
        height: 100%;
        background: #2563eb;
      }
      .section-load .sl-highlight {
        background: #fef3c7;
      }
      .section-load .sl-time-axis {
        min-width: 600px;
      }
      .section-load .sl-time-control {
        margin: 0 4%;
      }
      .section-load .sl-time-control input[type="range"] {
        appearance: none;
        -webkit-appearance: none;
        box-sizing: border-box;
        display: block;
        width: calc(100% + 16px);
        height: 24px;
        margin: 0 0 0 -8px;
        padding: 0;
        border: 0;
        background: transparent;
        direction: ltr;
        cursor: pointer;
      }
      .section-load #sl-time::-webkit-slider-runnable-track {
        height: 6px;
        border-radius: 3px;
        background: #cbd5e1;
      }
      .section-load #sl-time::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 16px;
        height: 16px;
        margin-top: -5px;
        border: 0;
        border-radius: 50%;
        background: #2563eb;
      }
      .section-load #sl-time::-moz-range-track {
        height: 6px;
        border: 0;
        border-radius: 3px;
        background: #cbd5e1;
      }
      .section-load #sl-time::-moz-range-thumb {
        width: 16px;
        height: 16px;
        border: 0;
        border-radius: 50%;
        background: #2563eb;
      }
    </style>
    <h2 id="sl-heading">Náročnost a vytížení úseků</h2>
    <p>
      Souběh je počet týmů mezi potvrzením začátku a konce stejného úseku,
      nikoli prokázaná fronta nebo přítomnost na jednom místě.
      Čas zahrnuje přesun, řešení i případné čekání.
    </p>
    <p>
      Počítáme všechny týmy s dokončeným průchodem, nezávisle na filtru histogramu.
      Chybějící koncová potvrzení mohou vytížení podhodnotit.
      Průměr souběhu nezahrnuje dobu, kdy byl úsek prázdný.
    </p>
    <div class="sl-controls">
      <label>
        Typ úseků
        <select id="sl-kind">
          <option value="normal">Mezi stanovišti</option>
          <option value="initial">Z nultých míst</option>
        </select>
      </label>
      <label>
        Řadit podle
        <select id="sl-sort">
          <option value="peak">Nejvyšší souběh</option>
          <option value="median">Nejdelší medián času</option>
          <option value="spread">Největší rozptyl Q1–Q3</option>
          <option value="route">Pořadí na trase</option>
        </select>
      </label>
      <label>
        Zvýraznit tým (nemění výpočty)
        <select id="sl-team"><option value="">Žádný</option></select>
      </label>
    </div>
    <div class="sl-scroll">
      <table>
        <caption>Dokončené průchody a souběh týmů</caption>
        <thead>
          <tr>
            <th scope="col">Úsek</th>
            <th scope="col">Průchody / týmy</th>
            <th scope="col">Medián</th>
            <th scope="col">Prostředních 50 % (Q1–Q3)</th>
            <th scope="col">Max. souběh</th>
            <th scope="col">První špička</th>
            <th scope="col">Průměr souběhu</th>
          </tr>
        </thead>
        <tbody id="sl-rows"></tbody>
      </table>
    </div>
    <section id="sl-detail" aria-label="Detail úseku"></section>
  `;
  document.body.append(root);
  const get = id => root.querySelector('#' + id);
  for (const team of [...model.teams].sort((a, b) => a.name.localeCompare(b.name, 'cs'))) {
    const option = document.createElement('option');
    option.value = team.id;
    option.textContent = team.name + ' #' + team.id;
    get('sl-team').append(option);
  }

  let selected = null, time = 0;

  function highlight() {
    const value = get('sl-team').value;
    for (const row of root.querySelectorAll('[data-team]')) {
      row.classList.toggle('sl-highlight', value !== '' && row.dataset.team === value);
    }
  }

  function showTime(value) {
    if (!selected) return;
    time = Number(value);
    get('sl-time').value = time;
    const teams = teamsOnSection(selected, time);
    get('sl-now').textContent = clock(time) + ' · současně ' + teams.length + ' týmů';
    get('sl-active').innerHTML = teams.length ? teams.map(team => `
      <li data-team="${team.id}">${esc(team.name)} #${team.id}</li>
    `).join('') : '<li>V tomto okamžiku není evidován žádný aktivní tým.</li>';
    highlight();
  }

  function detail() {
    const host = get('sl-detail');
    if (!selected) {
      host.innerHTML = '<p>Pro tento typ nejsou dostupné úseky.</p>';
      return;
    }
    if (!selected.passages.length) {
      host.innerHTML = `
        <h3>${esc(selected.label)}</h3>
        <p>Žádné dokončené průchody. Z toho nelze dovodit nulové skutečné vytížení.</p>
      `;
      return;
    }

    const first = selected.passages[0].from;
    const last = selected.passages.reduce((max, p) => Math.max(max, p.to), first);
    const span = last - first || 1;
    const x = t => 40 + (t - first) / span * 920;
    const y = count => 150 - count / Math.max(1, selected.peakCount) * 120;
    const points = selected.timeline.flatMap(s => [
      x(s.from) + ',' + y(s.count), x(s.to) + ',' + y(s.count)
    ]).join(' ');
    const peaks = selected.peakRanges.map(range => `
      <button type="button" data-time="${range.from}">
        ${clock(range.from)}–${clock(range.to)}
      </button>
    `).join(' ');
    host.innerHTML = `
      <h3>${esc(selected.label)}</h3>
      <p>
        Medián ${elapsed(selected.duration.median)} ·
        Q1–Q3 ${elapsed(selected.duration.q1)}–${elapsed(selected.duration.q3)} ·
        maximum souběhu ${selected.peakCount} týmů
      </p>
      <p>Intervaly nejvyššího souběhu: ${peaks || 'žádné (pouze nulové délky průchodů)'}</p>
      <p>Klikni na část grafu, začátek pruhu týmu nebo použij posuvník.</p>
      <div class="sl-scroll">
        <div class="sl-time-axis">
          <svg viewBox="0 0 1000 190" role="group" aria-label="Počet současně aktivních týmů">
            <line x1="40" x2="960" y1="150" y2="150" stroke="#64748b"/>
            <text x="5" y="155">0</text>
            <text x="5" y="30">${selected.peakCount}</text>
            <polyline points="${points}" fill="none" stroke="#2563eb" stroke-width="3"/>
            ${selected.timeline.map(s => `
              <rect
                x="${x(s.from)}" y="20" width="${x(s.to) - x(s.from)}" height="135"
                fill="transparent" tabindex="0" role="button" data-time="${s.from}"
                aria-label="${clock(s.from)} až ${clock(s.to)}: ${s.count} týmů"
              ><title>${clock(s.from)}–${clock(s.to)}: ${s.count} týmů</title></rect>
            `).join('')}
            <text x="40" y="180">${clock(first)}</text>
            <text x="960" y="180" text-anchor="end">${clock(last)}</text>
          </svg>
          <div class="sl-time-control">
            <label for="sl-time">Čas pro výpis aktivních týmů</label>
            <input id="sl-time" type="range" min="${first}" max="${last}" step="1">
          </div>
        </div>
      </div>
      <p id="sl-now" role="status" aria-live="polite"></p>
      <ul id="sl-active"></ul>
      <h4>Časové pruhy dokončených průchodů</h4>
      <p>Pruhy používají stejný časový rozsah jako graf. Koncový okamžik už do souběhu nepatří.</p>
      <div class="sl-scroll">
        <ol class="sl-bars">
          ${selected.passages.map(p => `
            <li data-team="${p.teamId}">
              <button
                type="button" class="sl-bar" data-time="${p.from}"
                style="--left:${(p.from - first) / span * 100}%;--width:${(p.to - p.from) / span * 100}%"
                aria-label="${esc(p.teamName)} #${p.teamId}: ${clock(p.from)} až ${clock(p.to)}, ${elapsed(p.seconds)}"
              >
                <span>${esc(p.teamName)} #${p.teamId}<br>${clock(p.from)}–${clock(p.to)}</span>
                <span class="sl-track"><span class="sl-fill"></span></span>
              </button>
            </li>
          `).join('')}
        </ol>
      </div>
    `;
    get('sl-time').oninput = event => showTime(event.target.value);
    showTime(selected.peakRanges[0]?.from ?? first);
  }

  function table() {
    const initial = get('sl-kind').value === 'initial';
    const rows = sections.filter(s => s.initial === initial);
    const key = get('sl-sort').value;
    const score = section => {
      if (!section.passageCount) return -Infinity;
      if (key === 'median') return section.duration.median;
      if (key === 'spread') return section.duration.q3 - section.duration.q1;
      return section.peakCount;
    };
    if (key !== 'route') rows.sort((a, b) => score(b) - score(a) || a.edge - b.edge);
    if (!selected || selected.initial !== initial) selected = rows[0] ?? null;
    get('sl-rows').innerHTML = rows.map(s => `
      <tr>
        <th scope="row">
          <button type="button" data-edge="${s.edge}" aria-pressed="${s === selected}">
            ${esc(s.label)}
          </button>
        </th>
        <td>${s.passageCount} / ${s.teamCount}</td>
        <td>${elapsed(s.duration.median)}</td>
        <td>${elapsed(s.duration.q1)}–${elapsed(s.duration.q3)}</td>
        <td>${s.peakCount}</td>
        <td>${s.peakRanges.length ? clock(s.peakRanges[0].from) : '—'}</td>
        <td>${s.averageActiveCount == null ? '—' : s.averageActiveCount.toLocaleString('cs', {maximumFractionDigits: 2})}</td>
      </tr>
    `).join('');
    detail();
  }

  root.addEventListener('click', event => {
    const target = event.target.closest('[data-edge], [data-time]');
    if (!target || !root.contains(target)) return;
    if (target.hasAttribute('data-edge')) {
      const initial = get('sl-kind').value === 'initial';
      selected = sections.find(s => s.edge === Number(target.dataset.edge) && s.initial === initial);
      table();
    } else {
      showTime(target.dataset.time);
    }
  });
  root.addEventListener('keydown', event => {
    const target = event.target.closest('rect[data-time]');
    if (target && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      showTime(target.dataset.time);
    }
  });
  get('sl-kind').onchange = table;
  get('sl-sort').onchange = table;
  get('sl-team').onchange = highlight;
  table();
  return root;
}
