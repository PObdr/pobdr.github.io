# Ukončení vykreslených přechodů u chodníku

crossing-mask.js maskuje pouze pruhy vytvořené rendererem přechodů, nikoli ostatní
kresbu. Odečítá plochy IPR plochy s CTVUK_KOD=702 (chodník nebo parková cesta).
Jde o SVG masku zobrazení, ne úpravu zdrojové geometrie přechodu.

Překrývající se chodníky se odečítají jako sjednocení. Otvory polygonů respektují
evenodd. Podporovány jsou i ostrůvky vedené stejným kódem. Osy footway ani
neurčené plochy se nepovažují automaticky za hranici obrubníku.

Maska používá stejné pracovní souřadnice jako kresba. Pro mapový náhled se všechny
její vrcholy přeprojektují společně s přechody; při natočení exportu se použije
v souřadnicích vrstvy před otočením. Pořadí vrstev tak nerozhoduje o odstranění
pruhů z chodníku. Názvy ulic, parkování a růžice se nemění.

Bez dostupné geometrie chodníků zůstává dosavadní kresba, bez libovolného zkrácení.
Nesprávné nebo zastaralé plochy IPR mohou vést k nesprávnému ořezu; nejde o zaměření
obrubníků ani o zaručenou rekonstrukci plochy vozovky.

Browser test: po spuštění statického serveru nad repozitářem lze v konzoli stránky
spustit (await import('./dio/crossing-mask.browser-test.js')).runTests().
Test ověřuje skutečné pixely v Chromium, překryvy, otvor, ostrůvek, otočení o 180°,
přeprojektování masky a zachování ostatních objektů a vstupních dat.
