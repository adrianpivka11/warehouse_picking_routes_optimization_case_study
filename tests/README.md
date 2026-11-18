# Budúce testy

Testy budú mať príponu `.test.ts` a budú používať vstavané moduly `node:test` a `node:assert/strict`.
TypeScriptové testy spustíme cez `tsx`; samostatnú testovaciu knižnicu nepotrebujeme.
Zatiaľ je tu jeden test dostupnosti HTTP endpointu. Testy výpočtu a komunikácie s API
pridáme spolu s príslušnou implementáciou.

Pri implementácii doplníme najmä:

- `picking-route-optimization.test.ts`: vzdialenosť zhodných bodov, známy 3D príklad
  s výsledkom `Math.sqrt(34)` a ručne overené minimum pri výbere pozície aj poradia.
- `warehouse-client.test.ts`: úspešná odpoveď, prázdne pole, neplatné dáta a zlyhanie API pomocou simulovaných odpovedí.
- `http-request-handler.test.ts`: validácia requestu a zrozumiteľné chybové odpovede po zavedení HTTP vrstvy.

Bežné testy nebudú potrebovať skutočný API kľúč ani živé skladové API.
Aktuálny test overuje len dostupnosť endpointu a jeho dočasnú JSON odpoveď;
správnosť budúceho algoritmu zatiaľ neoveruje.
