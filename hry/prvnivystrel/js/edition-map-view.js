import {GameMap} from './map.js?v=follow-1';
import {position} from './movement.js';
import {near, encounters} from './encounters.js';
import {esc, fmt, fold} from './utils.js';
import {sortTeams, plannedSeconds, DEFAULT_TEAM_ORDER} from './edition-team-order.js';
import {stripSharedEnding, storySections} from './stations.js?v=3';
import {$, matches, csv} from './edition-view-utils.js';

export function mountMap(m) {
  document.body.innerHTML = `
    <main class="map-layout">
      <aside>
        <input
          id="search" type="search" placeholder="Název nebo číslo týmu"
          aria-label="Hledat tým"
        >
        <p id="status" role="status"></p>
        <label>
          Řadit
          <select id="order">
            <option value="name">Název</option>
            <option value="rank">Oficiální pořadí</option>
            <option value="start">Start</option>
            <option value="scheduled">Plánovaný start</option>
            <option value="progress">Počet stanovišť</option>
          </select>
        </label>
        <div class="row">
          <button id="all">Vybrat nalezené</button>
          <button id="none">Žádný</button>
          <label><input id="names" type="checkbox"> Jména</label>
          <label><input id="trails" type="checkbox" checked> Trasy</label>
          <button id="fit">Celá mapa</button>
        </div>
        <details>
          <summary>Nastavení času</summary>
          <label>Posun <select id="offset"></select></label>
          <p id="clock-note"></p>
          <p>Polohy mezi potvrzeními a možná setkání jsou odhady.</p>
        </details>
        <details id="audit-box">
          <summary id="audit-title"></summary>
          <label><input id="suspects" type="checkbox"> Zobrazit podezřelé body</label>
          <input
            id="audit-search" type="search" placeholder="Tým, ID, důvod…"
            aria-label="Hledat v auditu"
          >
          <div id="audit"></div>
        </details>
        <details>
          <summary>Možné blízkosti</summary>
          <label>
            Do
            <select id="radius">
              <option>25</option>
              <option selected>50</option>
              <option>100</option>
              <option>200</option>
            </select>
            m
          </label>
          <button id="scan">Najít v celé hře</button>
          <button id="csv" disabled>CSV</button>
          <p id="near"></p>
          <div id="hits"></div>
        </details>
        <details id="detail-box">
          <summary>Detail týmu</summary>
          <div id="detail"></div>
        </details>
        <div id="teams"></div>
      </aside>
      <div id="map"></div>
    </main>
    <footer class="timeline">
      <div class="row">
        <button id="play">▶ Přehrát</button>
        <button id="back">−5 min</button>
        <button id="next">+5 min</button>
        <output id="clock"></output>
        <input id="time" type="time" step="1" aria-label="Čas">
        <label>
          Rychlost
          <select id="speed">
            <option>1</option>
            <option>10</option>
            <option>30</option>
            <option selected>60</option>
            <option>120</option>
            <option>300</option>
            <option>600</option>
            <option>1200</option>
          </select>×
        </label>
      </div>
      <input id="slider" type="range" step="1" aria-label="Časová osa">
      <small id="range"></small>
    </footer>
  `;

  const teams = m.teams, byId = new Map(teams.map(t => [t.id, t])), stations = m.stations,
    selected = new Set(teams.filter(t => t.points.length).map(t => t.id)),
    times = teams.flatMap(t => t.points.map(p => p.time)),
    min = times.length ? Math.min(...times) : 0, max = times.length ? Math.max(...times) : 0,
    compat = new Map([...stations].map(([id, s]) => [
      id, [id, s.name, s.lat, s.lon, s.zero?.lat ?? null, s.zero?.lon ?? null, s.zero?.name || s.name, s.nextId]
    ]));
  let time = min, offset = m.edition.offsetSeconds, playing = false, last = 0, drawn = 0,
    hits = [], focused = null, laidOut = false;

  const map = new GameMap(compat, id => focus(byId.get(id)));
  map.details.open = (id, zero = false) => {
    const s = stations.get(id), story = m.stories.get(id), next = stations.get(zero ? id : s.nextId),
      p = zero ? s.zero : s, d = map.details.dialog,
      url = s.photo ? new URL(encodeURIComponent(s.photo), m.photoBaseURL).href : null;
    d.innerHTML = `
      <article class="station-card">
        <header class="station-header">
          <h2 id="station-heading">${zero ? 'Nulté místo · ' : ''}${esc(s.name)}</h2>
          <button id="close">Zavřít ×</button>
        </header>
        <p>${esc(zero ? s.zero?.name || '' : s.name)} · ${p.lat.toFixed(6)}, ${p.lon.toFixed(6)}</p>
        <p>
          ${zero ? 'Kam dál z nultého místa' : 'Další stanoviště'}:
          <button id="dest">${esc(next.name)}</button>
        </p>
        ${story?.title ? '<h3>' + esc(story.title) + '</h3>' : ''}
        ${url ? `
          <figure>
            <a href="${esc(url)}" target="_blank" rel="noopener noreferrer">
              <img
                class="station-photo-image"
                style="max-width:100%;max-height:60vh"
                src="${esc(url)}" alt="Fotografie stanoviště ${esc(s.name)}"
                loading="lazy"
              >
            </a>
            <figcaption>${zero ? 'Fotografie cílového stanoviště. ' : ''}Kliknutím otevřeš plnou velikost.</figcaption>
          </figure>
        ` : ''}
        ${story ? storySections(story, zero).map(([key, label], i) => `
          <details ${i === 0 ? 'open' : ''}>
            <summary>${label}</summary>
            <p class="station-story">${esc(key === 'end' ? stripSharedEnding(story[key]) : story[key])}</p>
          </details>
        `).join('') : ''}
      </article>
    `;
    $('close').onclick = () => map.details.close();
    $('dest').onclick = () => map.details.open(next.id, false);
    const image = d.querySelector('img');
    if (image) {
      image.onerror = () => {
        image.hidden = true;
        d.querySelector('figcaption').textContent = 'Fotografii se nepodařilo načíst.';
      };
    }
    if (!d.open) d.showModal();
  };

  for (const n of [...new Set([0, 3600, 7200, 10800, offset])].sort((a, b) => a - b)) {
    const o = document.createElement('option');
    o.value = n;
    o.textContent = (n >= 0 ? '+' : '') + n / 3600 + ' h';
    $('offset').append(o);
  }
  $('offset').value = offset;
  $('clock-note').textContent = m.edition.clockNote || '';
  $('audit-box').hidden = !m.audit.rows.length;
  $('audit-title').textContent = 'Podezřelé GPS (' + m.audit.rows.length + ')';
  $('play').disabled = !times.length;

  const chosen = () => teams.filter(t => selected.has(t.id)),
    reason = r => Object.entries(m.audit.reasons)
      .filter(([bit]) => r[6] & Number(bit)).map(([, text]) => text).join('; '),
    auditLabel = r => `
      ${esc(byId.get(r[1])?.name)} · ID ${r[0]} · ${fmt(r[2] + offset)}<br>
      ${esc(reason(r))}<br>
      GPS ${r[3] / 1e5}, ${r[4] / 1e5} · přesnost ${r[5] ?? '—'} m${r[7] ? ' · úspěšná událost zachována' : ''}
    `;

  function audit() {
    map.suspicious(m.audit.rows.filter(r => selected.has(r[1])), $('suspects').checked, auditLabel);
    const q = fold($('audit-search').value);
    $('audit').innerHTML = m.audit.rows
      .filter(r => fold(r[0] + ' ' + byId.get(r[1])?.name + ' ' + reason(r)).includes(q))
      .map(r => `
        <button class="event" data-audit="${r[0]}">${auditLabel(r)}</button>
      `).join('');
  }

  function invalidate() {
    hits = [];
    $('csv').disabled = true;
    $('hits').textContent = 'Výběr změněn — spusť hledání znovu.';
  }

  function trails() {
    map.trails(chosen(), $('trails').checked);
  }

  const planned = t => plannedSeconds(t.scheduledStart) ?? Infinity;

  function list() {
    const rows = sortTeams(teams.filter(t => matches(t, $('search').value)), $('order').value);
    $('teams').innerHTML = rows.map(t => `
      <div class="team">
        <input
          id="team-${t.id}" type="checkbox" data-id="${t.id}"
          ${selected.has(t.id) ? 'checked' : ''}
        >
        <label for="team-${t.id}" style="color:${t.color}">
          ${esc(t.name)} <span class="team-id">#${t.id}</span>
          <small>Start ${t.startTime === null ? '—' : fmt(t.startTime + offset)} · ${t.progress}/${stations.size} · ${t.result ? t.result.rank + '. místo' : 'mimo výsledky'}</small>
        </label>
        <button data-focus="${t.id}" aria-label="Detail ${esc(t.name)}">↗</button>
      </div>
    `).join('');
    $('status').textContent = `${selected.size}/${teams.length} týmů`;
    for (const x of $('teams').querySelectorAll('[data-id]')) {
      x.onchange = () => {
        x.checked ? selected.add(+x.dataset.id) : selected.delete(+x.dataset.id);
        map.retainFollow(selected);
        changed();
      };
    }
    for (const b of $('teams').querySelectorAll('[data-focus]')) {
      b.onclick = () => focus(byId.get(+b.dataset.focus));
    }
  }

  function detail(t) {
    focused = t;
    $('detail-box').open = true;
    const delay = t.startTime === null || !Number.isFinite(planned(t))
      ? null : t.startTime + offset - planned(t);
    $('detail').innerHTML = `
      <h3>${esc(t.name)} #${t.id}</h3>
      <p>
        Start ${t.startTime === null ? '—' : fmt(t.startTime + offset)} · plán ${esc(t.scheduledStart || '—')}${delay === null ? '' : '<br>Odchylka ' + (delay < 0 ? '−' : '+') + fmt(Math.abs(delay))}<br>
        Potvrzeno ${t.progress}/${stations.size}<br>
        Oficiální pořadí: ${t.result?.rank ?? 'mimo výsledky'}<br>
        Oficiální čas: ${esc(t.result?.time ?? '—')}${t.terminatedEarly ? ' · odstoupil' : ''}
      </p>
    ` + t.events.map(e => `
      <button class="event" data-jump="${e.time}">
        ${fmt(e.time + offset)} · ${e.z ? 'nulté místo: ' : ''}${esc(e.z ? stations.get(e.id).zero?.name || stations.get(e.id).name : stations.get(e.id).name)}${e.manual ? ' · ručně uznáno' : ''}
      </button>
    `).join('');
  }

  function focus(t) {
    if (!t) return;
    selected.add(t.id);
    detail(t);
    changed();
    const p = position(t, time) || t.points[0];
    if (p) map.follow(t.id, p);
    else map.stopFollowing();
    draw();
  }

  function draw() {
    $('clock').textContent = fmt(time + offset);
    $('slider').value = time;
    $('play').textContent = playing ? '❚❚ Pozastavit' : '▶ Přehrát';
    if (document.activeElement !== $('time')) $('time').value = fmt(time + offset);
    const active = chosen().map(t => ({t, p: position(t, time)})).filter(a => a.p),
      nearby = near(active, +$('radius').value);
    map.render(active, nearby, $('names').checked);
    $('near').textContent = nearby.slice(0, 12)
      .map(h => h.a.name + ' × ' + h.b.name + ' · ' + Math.round(h.d) + ' m')
      .join(' | ') || 'Nyní žádná možná blízkost.';
  }

  function changed() {
    invalidate();
    list();
    trails();
    audit();
    draw();
  }

  function range() {
    $('range').textContent = m.edition.date + ' · ' + fmt(min + offset) + '–' + fmt(max + offset);
  }

  $('search').oninput = list;
  $('order').onchange = list;
  $('all').onclick = () => {
    teams.filter(t => matches(t, $('search').value)).forEach(t => selected.add(t.id));
    changed();
  };
  $('none').onclick = () => {
    selected.clear();
    map.stopFollowing();
    changed();
  };
  $('trails').onchange = trails;
  $('names').onchange = draw;
  $('suspects').onchange = audit;
  $('audit-search').oninput = audit;
  $('radius').onchange = () => {
    invalidate();
    draw();
  };
  $('fit').onclick = () => map.fit();
  $('play').onclick = () => {
    playing = !playing;
    draw();
  };
  const seek = n => {
    time = Math.max(min, Math.min(max, n));
    draw();
  };
  $('back').onclick = () => seek(time - 300);
  $('next').onclick = () => seek(time + 300);
  $('slider').min = min;
  $('slider').max = max;
  $('slider').oninput = () => seek(+$('slider').value);
  $('time').onchange = () => {
    if (!$('time').value) return;
    const [h, n, s = 0] = $('time').value.split(':').map(Number);
    seek(h * 3600 + n * 60 + s - offset);
  };
  $('offset').onchange = () => {
    offset = +$('offset').value;
    invalidate();
    list();
    audit();
    range();
    if (focused) detail(focused);
    draw();
  };

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-jump],[data-audit]');
    if (!b) return;
    playing = false;
    map.stopFollowing();
    if (b.dataset.jump != null) seek(+b.dataset.jump);
    if (b.dataset.audit) {
      const r = m.audit.rows.find(r => r[0] === +b.dataset.audit);
      selected.add(r[1]);
      time = r[2];
      detail(byId.get(r[1]));
      changed();
      map.map.panTo([r[3] / 1e5, r[4] / 1e5]);
    }
  });

  $('scan').onclick = () => {
    playing = false;
    draw();
    $('scan').disabled = true;
    $('hits').textContent = 'Počítám…';
    setTimeout(() => {
      try {
        hits = encounters(chosen(), +$('radius').value);
        $('hits').innerHTML = `<p>${hits.length} možných setkání (odhad).</p>` +
          hits.slice(0, 250).map(h => `
            <button class="event" data-jump="${h.start}">
              ${fmt(h.start + offset)}–${fmt(h.end + offset)} · ${esc(h.a)} × ${esc(h.b)} · ${Math.round(h.d)} m<br>
              Mezera mezi body až ${Math.round(h.gap / 60)} min
            </button>
          `).join('');
        $('csv').disabled = !hits.length;
      } catch (e) {
        $('hits').textContent = e.message;
      } finally {
        $('scan').disabled = false;
      }
    }, 30);
  };
  $('csv').onclick = () => csv('mozna-setkani-' + m.edition.year + '.csv', [
    ['Tým A', 'Tým B', 'Od', 'Do', 'Minimum m', 'Mezera s'],
    ...hits.map(h => [h.a, h.b, fmt(h.start + offset), fmt(h.end + offset), Math.round(h.d), h.gap])
  ]);

  window.editionPause = () => {
    playing = false;
    if (map.details.dialog.open) map.details.close();
    draw();
  };
  window.editionResume = () => {
    map.map.invalidateSize();
    if (!laidOut) {
      map.fit();
      laidOut = true;
    }
  };

  function tick(now) {
    if (playing && last) {
      time = Math.min(max, time + (now - last) / 1000 * +$('speed').value);
      if (time === max) playing = false;
      if (now - drawn >= 100 || !playing) {
        drawn = now;
        draw();
      }
    }
    last = now;
    requestAnimationFrame(tick);
  }

  $('order').value = DEFAULT_TEAM_ORDER;
  list();
  trails();
  audit();
  range();
  draw();
  if (!window.frameElement?.hidden) window.editionResume();
  requestAnimationFrame(tick);
}
