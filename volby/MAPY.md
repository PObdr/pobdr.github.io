# Mapový prototyp

Větev: volby/mapy-obvodu-okrsku. Produkční main se nemění.

## Lokální náhled

V novém adresáři naklonuj pouze vývojovou větev:

```sh
git clone --single-branch --branch volby/mapy-obvodu-okrsku https://github.com/PObdr/pobdr.github.io.git volby-mapy
cd volby-mapy
python -m http.server 8000
```

Otevři http://localhost:8000/volby/mapy.html pro mapový prototyp nebo http://localhost:8000/volby/?typ=komunal pro aplikaci této větve. Potřebuješ Git a Python. Nepoužívej file://. Náhled používá externí CDN Leaflet, dlaždice OpenStreetMap a službu ČÚZK; vyžaduje internet. Při testování nepřednačítej zbytečně všechny výsledkové dávky.

## Webový náhled

GitHub Pages nemá automatickou adresu pro každou větev. Nepřepínej produkční zdroj Pages na vývojovou větev. Samostatný preview můžeš vytvořit například připojením tohoto repozitáře ke Cloudflare Pages a povolením této preview větve; URL poskytne hosting po nasazení. V projektu není preview hosting automaticky nastaven.

## Rozsah první verze

- Samostatná stránka mapy.html; zatím není přidaná do hlavní navigace.
- Okrsky RÚIAN vrstva 20, načítané na požádání podle výřezu, od zoomu 12.
- Detail polygonu obsahuje identifikátory obce, městské části a číslo okrsku s prefixem, pokud je zdroj poskytuje.
- Senátní polygony lze importovat jako GeoJSON FeatureCollection v WGS84. Oficiální data: https://volby.gov.cz/opendata/se2026/se2026_opendata.htm sekce Hranice senátních obvodů 2026. Použij pokud možno generalizovanou variantu.
- Současné RÚIAN není garantovaný historický stav volebních hranic. Import nepovažujeme za ověření správného roku ani propojení s výsledky.
- Automatické načtení oficiálních senátních geometrií, propojení s výsledky a integrace do aplikace jsou další kroky, nikoli hotové funkce.
- Živý endpoint, CORS a chování v prohlížeči je nutné otestovat; mapový prototyp zatím nebyl v prohlížeči ověřen.
