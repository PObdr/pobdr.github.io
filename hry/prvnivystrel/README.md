# První výstřel 2026
Statický web bez buildu, backendu a importu Excelu. Změny pouze commity do hry/prvnivystrel/.

## Místní data
- data/2026/source.json obsahuje stanoviště, nultá místa, týmy, plánované starty a časy všech 992 úspěšných událostí.
- data/2026/gps.json obsahuje 2109 GPS bodů z původního Excelu s deklarovanou přesností do 100 m. Souřadnice jsou zaokrouhlené na 5 desetinných míst. Přesnost konkrétní GPS se v tomto toku neukládá; audit ji má zvlášť.
- data/2026/suspicious.json zůstává beze změny: 243 kandidátů ke kontrole, nikoliv potvrzených chyb.
Data se již nestahují z historického HTML, raw.githubusercontent.com ani GitHub Contents API. Leaflet a mapové dlaždice vyžadují internet.

GPS tok je gzip-base64, po rozbalení obsahuje pro každý tým v teamIds počet bodů jako unsigned varint, potom pro každý bod tři ZigZag-varint rozdíly: čas v sekundách logu, zeměpisná šířka a délka vůči předchozímu bodu. Počáteční hodnoty jsou nula; souřadnice jsou v jednotkách 1e-5 stupně s počátkem [50,14]. Dekodér je v js/data.js a kontroluje úplnost, počty a rozsah.

Podezřelé GPS nevstupují do pohybu ani setkání. Zobrazení červených značek je výchozně vypnuté; přepínač nemění výpočty. Úspěšná potvrzení bez použitelné GPS se doplňují na známé souřadnice stanovišť nebo odlišných nultých míst. Čas potvrzení není přesný příchod nebo odchod. Časový posun +2 h není potvrzené pásmo exportu. Pohyb mezi body a blízkosti jsou modelové odhady.

Lokálně používejte HTTP server, ne file://. npm test nepotřebuje instalaci závislostí. Po aktualizaci obnovte stránku včetně cache. Původní archivní fallback je úmyslně odstraněn, chyba místních dat se neskrývá vzdáleným zdrojem.
