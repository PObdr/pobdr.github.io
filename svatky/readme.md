# Je otevřeno? · Svátky

Jednostránkový web pro adresu https://pobdr.github.io/svatky/, který zobrazuje aktuální datum, české jmeniny a informaci o zákonném omezení prodeje v obchodech s prodejní plochou nad 200 m².

## Funkce

- Aktuální datum včetně dne v týdnu.
- Jmeniny podle českého kalendáře.
- Výrazný hlavní stav:
  - „Je otevřeno.“ zeleně.
  - „Je zavřeno.“ červeně.
- Datum nejbližšího příštího omezení prodeje.
- Relativní označení vzdálenosti: dnes, zítra, pozítří nebo za určitý počet dní.
- Oranžové upozornění den před omezením prodeje.
- Modré upozornění na svátek bez zákazu prodeje, zobrazované tři dny předem a v den svátku.
- Zohlednění zavření na Štědrý den od 12:00.
- Automatický výpočet Velkého pátku a Velikonočního pondělí.
- Aktualizace zobrazení každých 30 sekund a po návratu na kartu.
- Responzivní rozhraní pro mobil i počítač.

## Struktura

    svatky/
    ├── index.html
    └── README.md

Veškeré HTML, CSS a JavaScript jsou obsaženy v souboru `index.html`.

Stránka nepoužívá externí knihovny, nevyžaduje sestavení ani vlastní backend.

## Nasazení

1. Uložte `index.html` do složky `svatky` v publikované části repozitáře `pobdr.github.io`.
2. Volitelně přidejte tento soubor jako `README.md`.
3. Publikujte změny prostřednictvím stávajícího nastavení GitHub Pages.

Cílová adresa:

https://pobdr.github.io/svatky/

## Jak se určuje stav obchodů

Hlavní stav vyjadřuje, zda podle pravidel implementovaných ve stránce právě platí sváteční zákaz prodeje.

„Je otevřeno.“ neznamená, že konkrétní prodejna má právě otevřené dveře. Stránka nekontroluje běžnou otevírací dobu, víkendy ani individuální rozhodnutí obchodníků.

### Dny s celodenním zákazem prodeje

| Datum | Svátek |
| --- | --- |
| 1. ledna | Nový rok a Den obnovy samostatného českého státu |
| Pohyblivé datum | Velikonoční pondělí |
| 8. května | Den vítězství |
| 28. září | Den české státnosti |
| 28. října | Den vzniku samostatného československého státu |
| 25. prosince | 1. svátek vánoční |
| 26. prosince | 2. svátek vánoční |

### Částečné omezení

Na Štědrý den, 24. prosince, se stav přepne na „Je zavřeno.“ od 12:00.

Před polednem stránka upozorňuje:

> Dnes lze prodávat pouze do 12:00.

### Svátky bez zákazu prodeje

Modré informační upozornění se používá pro:

- Velký pátek.
- 1. května — Svátek práce.
- 5. července — Den slovanských věrozvěstů Cyrila a Metoděje.
- 6. července — Den upálení mistra Jana Husa.
- 17. listopadu — Den boje za svobodu a demokracii a Mezinárodní den studentstva.

Text záměrně uvádí, že obchody „mohou mít otevřeno“. Skutečnou otevírací dobu si určuje konkrétní prodejna.

## Upozornění

### Den před zavřením

Oranžový blok upozorní na omezení následující den.

Příklad pro 27. října 2026:

> Pozor, zítra bude zavřeno!
>
> 28. 10. 2026 – Den vzniku samostatného československého státu. Nezapomeňte si nakoupit ještě dnes v běžné otevírací době.

Před Štědrým dnem upozornění výslovně uvádí zavření od 12:00.

Pokud je zavřeno dnes i následující den, zobrazí se místo výzvy k nákupu:

> Zákaz prodeje pokračuje i zítra.

### Svátek bez zákazu prodeje

Modrý blok se zobrazuje tři dny před svátkem až do samotného dne svátku.

Nadpis se mění podle vzdálenosti:

- „Za 3 dny je svátek, obchody mohou mít otevřeno.“
- „Pozítří je svátek, obchody mohou mít otevřeno.“
- „Zítra je svátek, obchody mohou mít otevřeno.“
- „Dnes je svátek, obchody mohou mít otevřeno.“

Pokud jsou v tomto období dva takové svátky, zobrazuje se nejbližší z nich. Po jeho skončení se zobrazí další.

Oranžové upozornění je v rozhraní vždy nad modrým.

## Datum a čas

Stránka používá časové pásmo `Europe/Prague`, nezávisle na časovém pásmu zařízení návštěvníka.

Rozdíly mezi kalendářními dny počítá pomocí pomocných dat v UTC, aby odpočet neovlivňoval přechod na letní nebo zimní čas.

## Jmeniny

Jmeniny se načítají ze služby Svátky API:

https://svatkyapi.cz/

Použitý endpoint:

    https://svatkyapi.cz/api/day/YYYY-MM-DD

Implementace očekává odpověď JSON s položkou `name`.

Úspěšně načtené jmeniny se ukládají do `localStorage` pod klíčem:

    jmeniny:YYYY-MM-DD

Pokud API není dostupné a údaj není uložený, stránka zobrazí:

> Jmeniny se nepodařilo načíst.

Další pokus může proběhnout po minutě. Výpočet svátků a stavu obchodů funguje nezávisle na API.

## Úpravy nastavení

### Předstih modrého upozornění

Počet dní se nastavuje v JavaScriptu:

    const INFO_DAYS_AHEAD = 3;

### Interval aktualizace

Výchozí interval je 30 sekund:

    setInterval(render, 30000);

### Pravidla svátků

Seznam a chování svátků se upravují ve funkci `getHolidays(year)`.

Hodnota `closedFrom` znamená:

| Hodnota | Význam |
| --- | --- |
| `null` | Bez svátečního zákazu prodeje |
| `0` | Zákaz prodeje po celý den |
| `12` | Zákaz prodeje od 12:00 |

## Přístupnost

- Dokument má nastavený český jazyk.
- Rozhraní se přizpůsobuje velikosti obrazovky.
- Stav není rozlišován pouze barvou, ale také textem.
- Změny hlavního stavu a jmenin používají oblasti `aria-live`.
- Oranžové upozornění používá `role="alert"`.
- Modré upozornění používá `role="status"`.
- Bez JavaScriptu se zobrazí vysvětlující zpráva.

## Omezení a údržba

- Stránka nezjišťuje skutečnou otevírací dobu jednotlivých prodejen.
- Nevyhodnocuje jednotlivé zákonné výjimky.
- Nezohledňuje mimořádná zákonná opatření.
- Pravidla jsou součástí zdrojového kódu a neaktualizují se automaticky při změně zákona.
- Jmeniny závisejí na dostupnosti a formátu odpovědi externího API.
- Pro správné datum a čas musí mít zařízení správně nastavené systémové hodiny.
- Pro hlavní funkce je nutný JavaScript.

Právní podklad uvedený na stránce:

https://www.zakonyprolidi.cz/cs/2016-223
