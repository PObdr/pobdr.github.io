export function createInterface() {
  const get = (id) => document.getElementById(id);
  const card = get('load-activity');
  const bar = get('loading-progress');
  const rows = get('source-list');
  const issues = get('load-issues');
  let phase = 'idle';
  let sources = [];

  function state(next, title, subtitle = '') {
    phase = next;
    card.dataset.state = next;
    card.setAttribute('aria-busy', String(next === 'loading' || next === 'projecting'));
    get('loading-title').textContent = title;
    get('loading-subtitle').textContent = subtitle;
  }

  function showIssues(messages) {
    issues.hidden = messages.length === 0;
    const list = get('issue-list');
    list.replaceChildren();
    for (const message of messages) {
      const item = document.createElement('li');
      item.textContent = message;
      list.append(item);
    }
  }

  function renderSources() {
    rows.replaceChildren();
    let finished = 0;
    for (const [name, message] of sources) {
      const failed = /^CHYBA:/.test(message);
      const done = /^načteno /.test(message);
      const waiting = message === 'čeká';
      if (failed || done) finished += 1;
      const row = document.createElement('li');
      row.dataset.state = failed ? 'error' : done ? 'done' : waiting ? 'waiting' : 'loading';
      row.title = message;
      const dot = document.createElement('span');
      dot.className = 'source-dot';
      dot.setAttribute('aria-hidden', 'true');
      const label = document.createElement('span');
      label.textContent = name;
      const status = document.createElement('span');
      status.className = 'source-result';
      status.textContent = failed ? 'Chyba' : done ? 'Hotovo' : waiting ? 'Čeká' : 'Načítání';
      row.append(dot, label, status);
      rows.append(row);
    }
    get('source-count').textContent = sources.length ? `${finished} / ${sources.length} zdrojů` : 'Čekám na zdroje';
    if (sources.length) {
      bar.max = sources.length;
      bar.value = finished;
    } else {
      bar.removeAttribute('value');
    }
  }

  state('idle', 'Vyber místo', 'Výřez označ třemi kliknutími.');
  return {
    begin() {
      sources = [];
      bar.hidden = false;
      showIssues([]);
      renderSources();
      state('loading', 'Načítám podklady');
      get('source-details').hidden = false;
    },
    progress(text) {
      if (text.startsWith('Převádím')) {
        state('projecting', 'Připravuji kresbu');
        return;
      }
      if (phase !== 'loading') return;
      const parsed = text.split('\n').map((line) =>
        /^(IPR[^:]*|SMZ[^:]*|TSK[^:]*|OSM|THMP):\s*(.*)$/.exec(line)
      ).filter(Boolean).map((match) => [match[1], match[2]]);
      if (parsed.length) {
        sources = parsed;
        renderSources();
      }
    },
    complete(data) {
      const errors = data.errors || [];
      const incomplete = (data.selectedSets || []).some((id) => data.coverage?.[id] !== 'loaded');
      state(errors.length || incomplete ? 'warning' : 'done',
        errors.length || incomplete ? 'Částečný podklad' : 'Podklad připraven',
        errors.length ? `${errors.length} nedostupných zdrojů` : '');
      issues.open = false;
      showIssues(errors);
      bar.hidden = true;
    },
    fail(message) {
      state('error', 'Operace se nezdařila');
      showIssues([String(message)]);
      issues.open = true;
      bar.hidden = true;
    },
    selecting() {
      state('selecting', 'Označ výřez', 'Dva body určí hranu, třetí šířku.');
      bar.hidden = true;
      get('source-details').hidden = true;
      showIssues([]);
    },
    cancelSelection() {
      if (phase === 'selecting') {
        state('idle', 'Vyber místo', 'Výřez označ třemi kliknutími.');
      }
    },
    selectionReady() {
      state('selected', 'Výřez vybraný', 'Načti podklady.');
      bar.hidden = true;
    },
    mapError() {
      get('map-notice').hidden = false;
    }
  };
}
