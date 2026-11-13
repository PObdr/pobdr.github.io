# Veřejné osvětlení MHMP / THMP

Zdroj ZIP: https://opendata-storage.praha.eu/enoproxio/Verejne_osvetleni_MHMP.zip
Schéma: https://opendata-storage.praha.eu/EVM_verejne_osvetleni/Verejne_osvetleni_schema.json
Dokumentace: https://opendata-storage.praha.eu/EVM_verejne_osvetleni/Verejne_osvetleni_MHMP_dokumentace.html

Odvozená data jsou převedena z předpokládaného EPSG:5514 do WGS84 a rozdělena do dlaždic 0,01 stupně. Čísla zůstávají textem; nepoužívají se k odvozování městské části. Chybějící a podezřelé souřadnice jsou v rejected.json. Zdrojová data nejsou úplným pasportem všech správců osvětlení. Licence a podmínky původního zdroje platí i pro odvozená data; automatizace je neuděluje.

## Pořadí sestavení a nasazení

Workflow Refresh lighting and deploy Pages se nespouští souběžně při pushi. Pomocí workflow_run čeká na dokončení standardního Pages workflow na main; přijímá názvy pages-build-deployment a pages build and deployment. Navazující publikování proběhne pouze po úspěchu a pro běh ze stejného repozitáře. Týdenní kontrola v pondělí a workflow_dispatch zůstávají zachované. Vlastní workflow lamp není mezi spouštěči, takže se nespouští samo po sobě.

Následný běh načte aktuální main, obnoví cache lamp, zkontroluje zdroj a až potom vytvoří a nasadí celý web včetně dio/data/lamps. Běžné nasazení tak nemá zůstat posledním nasazením bez generovaných dat. Mezi běžným a navazujícím nasazením může být krátké období bez lamp; nejde o jediné atomické nasazení.

Používají se HTTP validátory a SHA256 rozbaleného CSV. Nezměněný zdroj se nemusí celý stahovat znovu, ale existující dlaždice se znovu přibalí do publikovaného webu. Generované dlaždice nejsou commitovány; uchovávají se v Actions cache. Při vymazání nebo neúplnosti cache se zdroj stáhne znovu. Historické dlaždice se ponechávají pro starší manifesty.

První spuštění musí úspěšně stáhnout ZIP. Chyba aktualizace zastaví navazující publikování; v takovém případě může na webu zůstat běžné nasazení bez lamp a je nutné vyřešit chybu a běh zopakovat. Oprávnění Pages a Actions musí dovolovat vlastní nasazení. Je nutné ověřit skutečný navazující běh v Actions; samotná kontrola YAML nepotvrzuje úspěšné nasazení.

## Načítání v aplikaci

Prohlížeč kontroluje pouze malý manifest a načítá relevantní hashované dlaždice z vlastního webu. Používá HTTP cache a omezenou paměťovou cache. Poslední kontrola je uvedena v atributech a během načítání. Čísla lamp jsou samostatná SVG vrstva; další typy zařízení jsou výchozím nastavením skryté. Čísla jsou popisy v původní poloze THMP, nepřesouvají se při slučování.

Lokální offline sestavení: python tools/build_lamps.py --csv exportVO.csv --out dio/data/lamps (vyžaduje pyproj==3.7.1). Samostatné názvy ulic ve vektorovém SVG nejsou zavedené.
