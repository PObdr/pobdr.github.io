import {loadYears, loadEdition} from './edition-loader.js';
import {selection, viewTitles} from './edition-view-selection.js';
import {$} from './edition-view-utils.js';

function notify(year, view, error = null) {
  if (parent !== window && typeof parent.editionReady === 'function') {
    parent.editionReady(year, view, error);
  }
}

async function main() {
  const params = new URLSearchParams(location.search),
    mode = params.get('view') || 'map';
  if (!Object.hasOwn(viewTitles, mode)) throw Error('Neznámé zobrazení.');

  let model;
  if (
    parent !== window &&
    typeof parent.editionModel === 'function' &&
    /^\d{4}$/.test(params.get('year') || '')
  ) {
    model = await parent.editionModel(Number(params.get('year')));
  } else {
    const s = selection(await loadYears(), location.search);
    model = await loadEdition(s.edition);
  }

  document.title = viewTitles[mode] + ' · ' + model.edition.year;

  if (mode === 'map') {
    const {mountMap} = await import('./edition-map-view.js');
    mountMap(model);
  } else if (mode === 'histogram') {
    const {mountHistogram} = await import('./edition-histogram-view.js');
    mountHistogram(model);
    const {mountSectionLoads} = await import('./section-load-view.js');
    mountSectionLoads(model);
  } else {
    const {mountTeamComparison} = await import('./team-comparison-view.js');
    mountTeamComparison(model);
  }

  notify(model.edition.year, mode);
}

main().catch(e => {
  const s = $('status');
  if (s) s.textContent = 'Chyba: ' + e.message;
  const p = new URLSearchParams(location.search);
  notify(Number(p.get('year')), p.get('view') || 'map', e.message);
  console.error(e);
});
