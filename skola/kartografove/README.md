# Hra Kartografové

Neoficiální výuková adaptace deskové hry Kartografové pro společné hraní. Aplikace zobrazuje karty a řídí průběh partie; hráči zakreslují terén do papírových map a body vyhodnocují sami.

Online verze: https://pobdr.github.io/skola/kartografove/

## Podklady pro hraní

V aplikaci jsou dostupné odkazy na:

- [Mapy k tisku](assets/mapy.pdf)
- [Pravidla hry](assets/pravidla.pdf)

Tlačítko `?` vedle odkazu na pravidla otevírá informace o projektu a autorství.

## Karty a herní data

Katalog v `js/data.js` používá obrázky PNG ze složky `assets/cards` a obsahuje:

- 13 karet průzkumu včetně dvou zřícenin.
- 8 karet přepadení s časem 0; první čtyři jsou promo.
- 16 bodovacích karet ve čtyřech skupinách.
- 4 karty ročních období a výnosy A–D.

Průzkumy, přepadení i bodovací karty mají původní české názvy podle potvrzeného mapování obrázků. Zadání bodovacích karet jsou na jejich obrázcích; aplikace body automaticky nepočítá.

### Bodovací karty

Pořadí odpovídá souborům `bodovani-{skupina}-{číslo}.png`.

| Skupina | 1 | 2 | 3 | 4 |
| --- | --- | --- | --- | --- |
| Lesy | Lesní království | Hraniční les | Lesnaté podhůří | Lesní houština |
| Farmy a voda | Údolí čarodějů | Zavlažovací kanály | Úrodné břehy | Pradávná sýpka |
| Vesnice | Královské město | Úrodné pláně | Osada | Obranný val |
| Rozložení mapy | Zapomenuté hrabství | Pohraničí | Propasti | Dlážděná cesta |

## Ovládání

- Tlačítko hlavní akce zahájí hru, odkryje další kartu nebo posune hru k bodování a dalšímu období.
- Kliknutí na dobírací balíček během průzkumu odkryje další kartu.
- Klávesy šipka doprava, šipka dolů a Page Down provedou další krok.
- Tlačítko Zpět nebo klávesy šipka doleva, šipka nahoru, Backspace a Page Up vrátí předchozí krok.
- Kliknutí na bodovací kartu, aktuální kartu či kartu v historii otevře detail. U zaměřené karty fungují také Enter a mezerník.
- Detail se zavírá tlačítkem, klávesou Escape nebo kliknutím mimo dialog.
- Tlačítko Celá obrazovka přepíná zobrazení pro promítání.
- Zahájení nové hry během rozehrané partie vyžaduje potvrzení.

Klávesové ovládání kroků hry se neuplatňuje při otevřeném dialogu ani při psaní do vstupních polí.

## Průběh hry

| Období | Časový limit | Bodované výnosy |
| --- | --- | --- |
| Jaro | 8 | A + B |
| Léto | 8 | B + C |
| Podzim | 7 | C + D |
| Zima | 6 | D + A |

Po dosažení limitu hráči dokončí poslední kartu a přejdou k bodování. Po bodování zimy aplikace zobrazí konec hry a připomene sečtení výsledků všech období.

### Zříceniny

Po odkrytí zříceniny běží odpočet 5 sekund, po kterém se automaticky odkryje další karta.

Odpočet se pozastaví při skrytí stránky, otevření dialogu nebo během zpracování akce.

Efekt zřícenin čeká na následující běžnou kartu průzkumu. Přepadení jej nespotřebuje. U příslušného průzkumu zůstává během kreslení pokyn k zakreslení přes zříceninu a náhradní postup pro případ, že to není možné.

Na začátku dalšího období se čekající efekt zřícenin ruší.

### Přepadení

Aplikace zobrazí směr předání map podle karty. Po zakreslení nestvůr hráči vrátí mapy majitelům.

Odkrytá přepadení se vyřazují; neodkrytá zůstávají v balíčku. Každé období přidá jedno nové přepadení.

### Krok zpět a ukládání

Krok zpět obnovuje celý uložený stav před akcí. Rozehraná partie se ukládá do `localStorage` prohlížeče.

Staré demo uložené hry s odlišnými ID karet nejsou kompatibilní s aktuálním katalogem; v takovém případě je potřeba zahájit novou hru.

## Zobrazení

- Roční období je vlevo, výnosy a bodovací karty nahoře, ovládání vpravo.
- Na úzké obrazovce se ovládání přesouvá dolů.
- Neaktivní bodovací karty jsou ztlumené.
- Historie odkrytých karet je v horizontálně posuvném pásu.
- Aktuální karta a dobírací balíček jsou vedle sebe; pokyny pro hráče se zobrazují nad dobíracím balíčkem.
- Obrázky karet zachovávají poměr stran 63:89.
- Rozhraní používá písmo Whisky1670, běžnou tloušťku textu a pokyny bez verzálek.

Otočení karty používá samostatnou vrstvu přes okno prohlížeče. Animace se ořezává na hranicích okna, nikoli u souhrnu pod kartami. Vrstva se po dokončení odstraní a počítá také s režimem celé obrazovky.

Při nastavení omezeného pohybu v prohlížeči nebo systému se animace otočení vynechá.

## Technická struktura

Aplikace používá JavaScriptové moduly a rozdělení model–view–controller.

- `js/data.js` — katalog karet, názvy, časy, směry přepadení, období a výnosy.
- `js/GameModel.js`, `js/GameController.js`, `js/GameView.js` — základní model, řízení a zobrazení.
- `js/Classroom.js` — pokyny pro hráče, obsluha zřícenin, odpočet a klávesové ovládání.
- `js/Enhancements.js` — přednačítání obrázků, zobrazení bodování a potvrzení nové hry.
- `js/DeckPresentation.js` — uspořádání aktuální karty a balíčku a animace otočení.
- `js/Interactions.js` — klikání na balíček, informace o autorství a závěrečný banner.
- `js/app.js` — načtení stylů, podkladů a inicializace aplikace.
- `css/` — styly rozhraní.
- `assets/cards/` — obrázky karet.
- `assets/font/` — soubory písma.
- `assets/mapy.pdf`, `assets/pravidla.pdf` — podklady pro hraní.

Aktuální inicializace používá `ClassroomModel` a `FinalPresentationView` / `FinalPresentationController`. Soubor `RuinsGameModel.js` není v aktuálním `app.js` použit.

Před začátkem hry aplikace přednačte obrázky. Pokud některé nelze načíst, nabídne opakování; hra začne až po úspěšném načtení všech požadovaných obrázků.

## TODO

- Doplnit podporu minirozšíření Dovednosti.

## Autorství a účel

Tato neoficiální výuková adaptace je určena výhradně pro nekomerční použití ve výuce.

Údaje zobrazované v aplikaci:

- Původní hra a použité herní materiály: © 2019 REXhry; © 2019 Thunderworks Games LLC.
- Autoři písma Whisky: Manuel Corradine & Sergio Ramz.

Toto README neuděluje licenci k dalšímu šíření cizích herních materiálů ani písma.
