# První výstřel — mapa a histogram

Statická víceletá aplikace bez buildu a backendu. Hlavní vstup je index.html, exportér je export.html. Další informace o datovém formátu jsou v MULTIYEAR.md. Změny projektu jsou omezené na hry/prvnivystrel/.

## Vstupy
- index.html otevře nejnovější ročník z data/years.json.
- index.html?year=2025&view=map otevře mapu zvoleného roku.
- index.html?year=2025&view=histogram otevře jeho histogram.
- Export HTML v hlavičce otevře export.html; výsledný soubor obsahuje jeden ročník s mapou, histogramem a volitelně fotografiemi.

## Model pohybu
Animace, trasy i možné blízkosti používají pouze úspěšná potvrzení stanovišť a nultých míst. Souřadnice jsou souřadnice stanoviště, nikoli odeslaná GPS poloha. Mezi potvrzeními je přímková interpolace, ne rekonstrukce ulic, MHD nebo skutečného pobytu. Před prvním a po posledním potvrzení polohu neznáme. Možné setkání je odhad, nikoli důkaz.

2025 zachovává 1176 příchodů včetně 39 ručně uznaných, 2026 992 příchodů. Potvrzené zobrazovací posuny: 2025 0 s, 2026 +7200 s. Oficiální výsledky nepřepisují polohové kotvy ani nevytvářejí start týmům bez událostí. Audit GPS nemění pohyb.

## Data a archiv
Aktivní data určuje data/years.json. Oficiální pořadí se nikdy neodvozuje z průběhu hry. Data a fotografie obou let se při úklidu nemažou. data/2026/gps.json uchovává 2109 původních GPS bodů jako archiv; nový loader je pro animaci nenačítá. Zpětná filtrace neúspěšných pokusů jedním prahem přesnosti se neprovádí.

## Provoz a testy
Používat HTTP/HTTPS, ne file://. Internet je potřeba pro Leaflet a mapové dlaždice OSM. npm test spouští tests/*.test.mjs bez instalace závislostí. Při změně UI ověřit oba ročníky, oficiální nuly, sledování týmu, histogram, fotografie, audit, historii a export s fotografiemi i bez nich. Node testy nenahrazují úplný test ve skutečném prohlížeči.
