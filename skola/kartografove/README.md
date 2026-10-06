# Kartografové — třídní MVC prototyp

Statická aplikace s ES moduly. Všechny změny jsou omezeny na tuto složku.

## Důležité
Tato verze používá výhradně testovací karty a umělé časové hodnoty. Není připravena pro skutečnou partii. Skutečné skeny nejsou součástí tohoto commitu. Dvojice bodovaných výnosů a zvláštní pravidla ruin nejsou implementovány ani odhadnuty.

## Architektura
- js/data.js: katalog a konfigurace období.
- js/GameModel.js: pravidla a serializovatelný stav bez DOM.
- js/GameView.js: vykreslení pomocí DOM a textContent.
- js/GameController.js: akce, historie, localStorage, fullscreen.
- js/app.js: sestavení aplikace.

## Implementovaný průběh
Na začátku hry jedna bodovací karta z každé ze čtyř testovacích skupin, náhodně přiřazená k A–D. Osm přepadení tvoří zamíchanou zásobu. Každé období obnoví 13 průzkumných karet, zachová neodkrytá přepadení, přidá jedno nové a zamíchá celý balíček. Odkrytá přepadení se trvale vyřazují. Limity jsou 8/8/7/6. Po dosažení limitu karta zůstává viditelná; učitel potvrzuje bodování a další období. Po zimě hra končí. Krok zpět obnovuje přesný stav včetně pořadí balíčků. Stav se ukládá po akcích.

## Ruční kontrola prototypu
1. Spustit novou hru: 14 karet a čas 0/8.
2. Otáčet až do dosažení limitu: poslední karta musí zůstat viditelná.
3. Přejít k bodování a do léta: čas 0/8 a obnovený balíček.
4. Pokud přepadení nebylo odkryto, další období má o jedno přepadení více; pokud bylo odkryto, nesmí se vrátit.
5. Krok zpět a opětovný krok mají zachovat přesné losování.
6. Obnovit stránku: pokračovat ve stejném stavu.
7. Dokončit zimu: nepřipravovat další balíček.

Automatizované testy a test v reálném prohlížeči zatím nebyly provedeny. Pro lokální spuštění použijte HTTP server, nikoli file://.
