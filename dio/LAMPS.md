# Veřejné osvětlení MHMP / THMP

Zdroj ZIP: https://opendata-storage.praha.eu/enoproxio/Verejne_osvetleni_MHMP.zip
Schéma: https://opendata-storage.praha.eu/EVM_verejne_osvetleni/Verejne_osvetleni_schema.json
Dokumentace: https://opendata-storage.praha.eu/EVM_verejne_osvetleni/Verejne_osvetleni_MHMP_dokumentace.html

Odvozená data jsou převedena z předpokládaného EPSG:5514 do WGS84 a rozdělena do dlaždic 0,01 stupně. Čísla zůstávají textem; nepoužívají se k odvozování městské části. Chybějící a podezřelé souřadnice jsou v rejected.json. Zdrojová data nejsou úplným pasportem všech správců osvětlení. Licence a podmínky původního zdroje platí i pro odvozená data; automatizace je neuděluje.

Workflow Refresh lighting and deploy Pages kontroluje zdroj při pushi na main, týdně v pondělí a na workflow_dispatch. Používá HTTP validátory a SHA256 rozbaleného CSV. Generované dlaždice nejsou commitovány, jsou uchovány v Actions cache a nasazeny spolu s celým webem. Nastavení repozitáře Pages musí mít Source: GitHub Actions a povolené příslušné workflow/oprávnění. První spuštění musí úspěšně stáhnout ZIP. Při chybě aktualizace se nové nasazení neprovede; poslední publikovaná verze zůstává. Při vymazání cache se zdroj stáhne znovu. Historické dlaždice se v cache ponechávají pro starší manifesty.

Prohlížeč kontroluje pouze malý manifest a načítá relevantní hashované dlaždice z vlastního webu. Používá HTTP cache a omezenou paměťovou cache. Poslední kontrola je uvedena v atributech a během načítání. Čísla lamp jsou samostatná SVG vrstva; další typy zařízení jsou výchozím nastavením skryté. Čísla jsou popisy v původní poloze THMP, nepřesouvají se při slučování.

Lokální offline sestavení: python tools/build_lamps.py --csv exportVO.csv --out dio/data/lamps (vyžaduje pyproj==3.7.1). Tyto změny zatím neobsahují nový panel načítání všech zdrojů ani názvy ulic.
