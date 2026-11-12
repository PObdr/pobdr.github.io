# Parkování v mapě a SVG

Kreslení provádí parking.js v metrických pracovních souřadnicích EPSG:5514.
Stejnou geometrii používá mapový náhled i export. Zdrojové prvky a jejich
identifikátory zůstávají zachované; inference se zapisuje do title objektu SVG
jako parkingRendering. Původní zdrojový režim a kontrolní podvrstvy se nemění.

## První verze

- TSK stání: zdrojový obrys a schematické dělení, pokud je dostupná blízká osa
  ulice OSM a platný zdrojový počet PS_ZPS. Žádný počet se nedopočítává z normové šířky.
- OSM plocha: explicitní orientation a capacity, pokud jsou přítomné.
- TSK ZTP a OSM plochy vyhrazené celé pro disabled: modrý obrys a vektorový
  symbol vozíku, pokud se dovnitř vejde. Neurčuje přesné rozmístění jednotlivých míst.
- Částečná capacity:disabled neoznačí celou plochu za ZTP.
- Zásobování, speciální stání a zákaz: obrys bez běžných boxů.
- Dělicí čáry běžného stání se ořezávají mimo vyhrazené plochy a zákazy.
- Překryté části OSM se nekreslí přes přednostní TSK; nekryté části zůstávají.

## Omezení

Orientace TSK se odhaduje heuristikou z projektu Profily ulic, Bára Soukupová,
MIT; viz PROJECTION-LICENSE.txt. Využívá průměrnou hloubku plochy a délku na místo.
Jde o odhad, ne zaměřené dopravní značení. Šikmé dělení používá schematických 45°
a odhadnutou stranovost. Dělení je přerušované i u explicitní orientace, protože
polohy jednotlivých čar nejsou zdrojem doložené. U složitých vícedílných ploch,
chybějící osy ulice, nulového či neplatného počtu zůstane jen obrys.
ZPS a OSM nemají vždy totožné hranice; mimo společný překryv mohou zůstat oba obrysy.

Test: node --experimental-default-type=module dio/parking.test.mjs.
Jednotkové testy doplňuje kontrola DOM exportu v Chromium s testovacími závislostmi.
Celý živý řetězec s Leafletem a vzdálenými službami musí být ověřen po nasazení.
