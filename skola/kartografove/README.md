# Kartografové — třídní MVC aplikace

Katalog používá nahrané PNG v assets/cards a údaje potvrzené uživatelem: 13 průzkumů včetně dvou zřícenin, 8 přepadení (první čtyři promo) s časem 0, 16 bodovacích karet ve čtyřech skupinách, období a výnosy. Bodovací názvy jsou dočasné; skutečná zadání jsou na obrázcích. Dovednosti a průzkum 14–17 nejsou zařazeny.

Layout: výnosy, bodování a překrývající se průzkum; poměr 63:89. Období vlevo, ovládání vpravo. Neaktivní bodování ztlumené, kliknutí nebo Enter/mezerník otevře detail. Escape/tlačítko/kliknutí mimo zavře. Odkryté karty odhalují 20 % levé části předchozích, poslední je celá; pás má horizontální posouvání. Na úzké obrazovce je ovládání dole.

Limity 8/8/7/6, bodování AB/BC/CD/DA. Ruiny se odkrývají spolu s následující kartou na jeden povel; přes přepadení efekt zůstává, běžný průzkum ho spotřebuje a upozornění zůstane během kreslení. Krok zpět obnovuje celý stav. Odkryté přepadení se vyřadí, neodkryté zůstává; každé období přidá jedno nové. Po zimě konec.

Původní GameModel a GameController zůstávají; RuinsGameModel rozšiřuje model. Ukládání zůstává v localStorage. Stará demo uložená hra není kompatibilní s novými ID a musí být nahrazena novou hrou.

Kontrola v reálném prohlížeči a automatizované testy zatím neprovedeny. Zkontrolujte Full HD layout, načtení všech obrázků, zoom, překryv, ruiny/přepadení, přechody a ukládání. Lokálně použijte HTTP server.
