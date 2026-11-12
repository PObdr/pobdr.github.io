# Parkování v mapě a SVG

parking.js kreslí v pracovním EPSG:5514; parking-frame.js určuje návaznost pásu,
orientaci a lokální bázi symbolu. Pracovní data se nemění. Stejná geometrie se
použije v mapě a po transformaci i v natočeném exportu.

## Návaznost a přednost údajů

Navazující plochy musí ležet do 1,5 m od sebe na stejné straně stejné ulice,
s téměř souběžnou osou. Pokud oba záznamy mají ZPS_ID, musí se shodovat.
Samotné ID ani blízkost přes vozovku nestačí. Jde o konzervativní prostorovou
heuristiku, nikoli o úplnou topologickou analýzu křižovatek.

Explicitní orientation má přednost před geometrií jednotlivého ZTP a ta před
odhadem běžného pásu z hloubky a PS_ZPS. Geometrie může určit i sklon šikmých čar.
Blok dvou sdružených míst neslouží jako rozměr jednoho auta. Při konfliktu
stejně silných vodítek se sdílená orientace neurčí a dělení ani symbol se nevymýšlí.

## Symbol vozíku

U šikmého/kolmého stání míří spodek symbolu k nejbližší ose vozovky; osa symbolu
odpovídá podélné ose auta. U podélného stání míří horní strana po směru jízdy.
oneway=yes i -1 se respektují; u běžné obousměrné ulice se směr předpokládá podle
pravostranného provozu a strany obrubníku. Neznámý směr ani nejasná orientace
se nezobrazují jako spolehlivý údaj. Symbol bez určené báze se vynechá.

Obrysy, ořez vyhrazených míst, přednost TSK před překrytou kresbou OSM a zdrojový
režim zůstávají zachované. Dělicí čáry jsou schematické a přerušované, nikoli
zaměřené dopravní značení. Inference, anchorId, konflikt a iconBasis jsou v title
objektu SVG jako parkingRendering; klikací panel aplikace se tímto nemění.

Odvození orientace navazuje na Profily ulic, Bára Soukupová, MIT;
viz PROJECTION-LICENSE.txt. Bez vhodné osy nebo zdrojového počtu zůstává obrys.
Testy: node --experimental-default-type=module dio/parking.test.mjs a
node --experimental-default-type=module dio/parking-frame.test.mjs.
Živý mapový řetězec a nasazení je třeba ověřit samostatně.
