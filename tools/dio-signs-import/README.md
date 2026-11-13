# DIOGEN: inventura DWG a zkušební převod

První fáze, nikoli hotová knihovna značek. Workflow stáhne oficiálně odkazovaný
ZIP VL 6.1 z PJPK, uchová jej s SHA-256 a bezpečně rozbalí i vnořené ZIPy.
Inventář obsahuje všechny nalezené soubory, velikosti, otisky a DWG hlavičky.
Doprovodné informace zůstanou v artefaktu pro kontrolu podmínek převzetí.

Pilot vybere nejvýše 8 DWG (ručně 4/8/12), přednostně několik různých kódů
podle názvů souborů. Názvy nejsou ověřeným právním přiřazením značek.
LibreDWG 0.13.3 převede DWG na DXF; ezdxf 1.4.3 vytvoří SVG modelového prostoru.
Celé technické výkresy ani bloky se automaticky nepovažují za samostatné značky.
V galerii a pilot.json jsou výsledky vždy označené jako neověřené.

Chyby konkrétního souboru jsou v protokolech. Částečný převod není kompletní
katalog. Při nulovém počtu náhledů workflow selže, artefakt se přesto uchová.
Jednotlivé převody mají časový limit; rozbalování má limity velikosti a hloubky.
Kontrolují se aktivní a externí odkazy v SVG. Fontové styly, bloky, vrstvy a typy
entit jsou zaznamenané. Neprohlašuje se shoda textů ani úplnost vykreslení.
Bahnschrift se při tomto kroku nepoužívá k plošnému nahrazování CAD fontů.

Workflow má jen contents:read. Nic necommitne, nezmění DIOGEN ani lampy
a nevloží SVG do veřejné aplikace. Výstup je GitHub Actions artefakt na 14 dní:
source.zip, source/, inventory.json, preview/, pilot.json, index.html a protokoly.
Stáhnout artefakt a otevřít rozbalené index.html pro vizuální kontrolu.

Následuje oddělení značek od rámů/kót, audit fontů, barev, významu a aktuálnosti,
porovnání s novelami a doplnění ostatních příloh 1–11. Podmínky dalšího převzetí
musí být ověřené před publikací výsledné knihovny. Runtime převod se zde
neprovádí v prohlížeči ani na návštěvníkově počítači.

Lokálně: python tools/dio-signs-import/test_import.py
Závislosti: python -m pip install -r tools/dio-signs-import/requirements.txt
