# Budúce testy

Testy budú mať príponu `.test.ts` a budú používať vstavané moduly `node:test` a `node:assert/strict`.
TypeScriptové testy spustíme cez `tsx`; samostatnú testovaciu knižnicu nepotrebujeme.
Testy endpointu a skladového klienta používajú simulované odpovede externého API.
Testy výpočtu trasy používajú malé príklady s ručne overiteľným výsledkom.

Pri implementácii doplníme najmä:

- `picking-route-optimization.test.ts`: doplniť meranie výkonu pri väčšom počte produktov.
- `warehouse-client.test.ts`: doplniť ďalšie neplatné dátové tvary a sieťové zlyhania.
- `http-request-handler.test.ts`: ďalšie chybové odpovede a prepojenie s výpočtom trasy.

Bežné testy nebudú potrebovať skutočný API kľúč ani živé skladové API.
Aktuálne HTTP testy overujú prijatý tvar vstupu, výsledok a chybové odpovede;
správnosť algoritmu overujú malé pripravené príklady.
