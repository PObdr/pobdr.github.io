import {selection as selectEdition} from './edition-model.js';

export const viewTitles = Object.freeze({
  map: 'Mapa',
  histogram: 'Histogram',
  comparison: 'Porovnání týmů'
});

// Keep edition/year validation in the data model; route UI views here.
export function selection(data, search = '') {
  const params = new URLSearchParams(search);
  const view = params.get('view') || 'map';
  if (!Object.hasOwn(viewTitles, view)) throw Error('Neznámé zobrazení.');
  params.set('view', 'map');
  return {...selectEdition(data, params.toString()), view};
}
