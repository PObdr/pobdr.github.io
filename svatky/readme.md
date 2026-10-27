# Svátky — Je otevřeno?

Jednostránkový web, který zobrazuje aktuální datum, české jmeniny a informaci, zda se na obchody s prodejní plochou nad 200 m² právě vztahuje sváteční zákaz prodeje.

Cílová adresa: https://pobdr.github.io/svatky/

## Funkce

- Aktuální datum včetně dne v týdnu.
- Jmeniny podle českého kalendáře.
- Výrazný stav:
  - „Je otevřeno.“ — zeleně.
  - „Je zavřeno.“ — červeně.
- Informace o nejbližším příštím zákazu prodeje.
- Relativní označení vzdálenosti: „dnes“, „zítra“, „pozítří“, „za 3 dny“ nebo „za 5 dní“.
- Výrazné upozornění den před zavřením.
- Automatické aktualizování každých 30 sekund a při návratu na kartu.
- Responzivní zobrazení pro mobil i počítač.

## Příklad zobrazení

Pro 27. 10. 2026 stránka zobrazí:

> Je otevřeno.
>
> Příště bude zavřeno zítra, 28. 10. 2026.

Pod tím se objeví oranžové upozornění:

> Pozor, zítra bude zavřeno!
>
> 28. 10. 2026 – Den vzniku samostatného československého státu.
> Nezapomeňte si nakoupit ještě dnes v běžné otevírací době.

Pokud zákaz prodeje platí dnes i zítra, upozornění místo výzvy k nákupu uvede:

> Zákaz prodeje pokračuje i zítra.

## Význam informace „Je otevřeno.“

Stránka neurčuje skutečnou otevírací dobu konkrétního obchodu.

„Je otevřeno.“ znamená pouze to, že podle pravidel implementovaných ve stránce právě neplatí sváteční zákaz prodeje. Obchod přesto může být zavřený například večer, v noci nebo podle vlastní provozní doby.

Stránka nezjišťuje polohu uživatele, konkrétní provozovny ani jejich otevírací dobu.

## Implementovaná pravidla

Výpočet vychází z pravidel zákona č. 223/2016 Sb., o prodejní době v maloobchodě.

V kódu jsou zahrnuté následující termíny:

| Datum | Svátek | Implementované omezení |
| --- | --- | --- |
| 1. ledna | Nový rok | Celý den |
| Pohyblivé datum | Velikonoční pondělí | Celý den |
| 8. května | Den vítězství | Celý den |
| 28. září | Den české státnosti | Celý den |
| 28. října | Den vzniku samostatného československého státu | Celý den |
| 24. prosince | Štědrý den | Od 12:00 |
| 25. prosince | 1. svátek vánoční | Celý den |
| 26. prosince | 2. svátek vánoční | Celý den |

Velikonoční pondělí se vypočítává automaticky pro příslušný rok.

Na Štědrý den se stav před polednem zobrazuje jako „Je otevřeno.“ a ve 12:00 se přepne na „Je zavřeno.“ Předchozí den upozornění výslovně uvádí, že bude zavřeno až od 12:00.

Zákon obsahuje výjimky, například pro lékárny, čerpací stanice a vybrané prodejny na nádražích, letištích a ve zdravotnických zařízeních. Stránka jednotlivé výjimky neposuzuje.

Pravidla nejsou aktualizována z právní databáze. Při změně legislativy je nutné upravit kód.

Znění zákona: https://www.zakonyprolidi.cz/cs/2016-223

## Technické řešení

Web tvoří jediný soubor `index.html`, který obsahuje:

- HTML strukturu,
- CSS styly,
- JavaScript pro datum, jmeniny, výpočet svátků a upozornění.

Projekt nepoužívá framework, sestavovací nástroj ani vlastní backend.

### Datum a čas

Používá se časové pásmo `Europe/Prague`, nezávisle na časovém pásmu nastaveném v prohlížeči.

Aktuální okamžik vychází ze systémových hodin zařízení. Pokud má zařízení nesprávně nastavený čas, může být nesprávný i zobrazený stav.

### Jmeniny

Jmeniny se načítají ze služby Svátky API:

https://svatkyapi.cz/

Použitý požadavek:

```text
GET [https://svatkyapi.cz/api/day/YYYY-MM-DD](https://svatkyapi.cz/api/day/YYYY-MM-DD)
```

Implementace očekává v odpovědi JSON textovou položku `name`.

Načtené jmeniny se ukládají do `localStorage` podle měsíce a dne. Při opakovaném zobrazení stejného data se použije uložená hodnota.

Pokud se údaj nepodaří načíst a není uložený, zobrazí se:

> Jmeniny se nepodařilo načíst.

Výpočet svátečního zákazu prodeje funguje nezávisle na API. Dostupnost jmenin závisí na dostupnosti externí služby a možnosti načíst odpověď z prohlížeče.

## Struktura souborů

```text
svatky/
├── index.html
└── README.md
```

## Lokální spuštění

Pro základní zobrazení lze otevřít `index.html` v moderním prohlížeči.

Pro testování v prostředí podobném nasazení je vhodné použít lokální HTTP server, například:

```bash
python -m http.server 8000
```

Příkaz spusťte v adresáři s webem. Stránka pak bude dostupná na:

```text
http://localhost:8000/
```

Pro načtení jmenin je potřeba připojení k internetu.

## Nasazení na GitHub Pages

Pokud se web publikuje přímo z kořenového adresáře repozitáře `pobdr.github.io`:

1. Vytvořte v publikačním adresáři složku `svatky`.
2. Vložte do ní `index.html` a tento `README.md`.
3. Změny odešlete do větve používané pro GitHub Pages.
4. Po dokončení publikace otevřete:

   https://pobdr.github.io/svatky/

Pokud repozitář používá jiný publikační adresář nebo vlastní nasazovací workflow, umístěte složku `svatky` do odpovídajícího výstupu webu.

## Úpravy a údržba

### Vzhled

Barvy, velikosti písma, rozložení a vzhled upozornění se upravují v bloku `<style>`.

### Svátky a omezení prodeje

Funkce `holidays(year)` obsahuje pevná data, názvy svátků a hodinu začátku omezení.

Funkce `easter(year)` vypočítává datum Velikonočního pondělí.

### Texty a upozornění

Funkce `render()` aktualizuje:

- datum,
- hlavní stav,
- informaci o příštím zavření,
- název aktuálního svátku,
- upozornění na zítřejší omezení.

Upozornění na zítřek se vyhodnocuje samostatně. Může se tedy zobrazit i ve chvíli, kdy už je dnes zavřeno.

### Interval aktualizace

Výchozí interval je 30 sekund:

```javascript
setInterval(render, 30000);
```

Změna stavu se proto na otevřené kartě může projevit s krátkým zpožděním.

## Doporučené testovací scénáře

Následující seznam slouží k ručnímu ověření; projekt neobsahuje automatickou testovací sadu.

| Situace | Očekávané chování |
| --- | --- |
| Běžný den bez omezení | „Je otevřeno.“ |
| Den před celodenním zákazem | Oranžové upozornění na zítřejší zavření |
| Den s celodenním zákazem | „Je zavřeno.“ a název svátku |
| 23. prosince | Upozornění na zavření následující den od 12:00 |
| 24. prosince před 12:00 | „Je otevřeno.“ a informace o dnešním zavření od 12:00 |
| 24. prosince od 12:00 | „Je zavřeno.“ |
| Dva po sobě jdoucí dny se zákazem | Upozornění, že zákaz pokračuje i zítra |
| Přelom roku | Správné nalezení nejbližšího omezení v dalším roce |
| Velikonoční pondělí | „Je zavřeno.“ |
| Výpadek API jmenin | Chybová zpráva u jmenin, ostatní části dále fungují |
| Jiné časové pásmo zařízení | Vyhodnocení podle času v Praze |
| Mobilní displej | Čitelné rozložení bez vodorovného posouvání |

## Omezení

- Nejde o přehled skutečné otevírací doby jednotlivých obchodů.
- Výjimky pro konkrétní provozovny se nevyhodnocují.
- Mimořádná opatření ani legislativní změny se automaticky nenačítají.
- Jmeniny závisejí na externím API nebo dříve uložené hodnotě.
- Správný výsledek předpokládá správně nastavené systémové hodiny zařízení.
