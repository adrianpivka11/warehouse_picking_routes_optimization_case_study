# Warehouse Picking Routes Optimization

Backend case study pre GymBeam v Node.js a TypeScripte.

## Aktuálny stav

Projekt používa Express a spúšťa HTTP server na porte 3000. Endpoint `POST /optimize`
prijíma JSON požiadavku, ale zatiaľ vracia stav `501` a správu, že výpočet trasy ešte nie je implementovaný.
Načítavanie skladových dát, výpočet trasy a validáciu obsahu requestu doplníme v ďalších krokoch.

## Požiadavky a inštalácia

- Node.js 24, minimálne 24.14.1; `.nvmrc` uvádza použitú verziu.
- npm 11.

Po získaní projektu nainštaluj presné verzie závislostí z `package-lock.json`:

```sh
npm ci
```

Voliteľne priprav lokálnu konfiguráciu v PowerShelli:

```powershell
Copy-Item .env.example .env
```

Do `.env` neskôr doplň `WAREHOUSE_API_KEY` zo zadania. Skutočný kľúč sa neukladá do zdrojového kódu
ani do `.env.example`; súbor `.env` Git ignoruje. Server funguje aj bez kľúča.

Príkazy `dev` a `start` načítajú `.env`, ak existuje. Pri chýbajúcom súbore môže Node vypísať
informačnú správu a pokračuje. Premenné prostredia majú prednosť pred hodnotami zo súboru.
`PORT` určuje port servera a predvolená hodnota je 3000. Musí byť celé číslo od 1 do 65535.
`WAREHOUSE_API_BASE_URL` a `WAREHOUSE_API_KEY` sú pripravené pre neskoršiu komunikáciu so skladom.

## Vyskúšanie endpointu

Po spustení `npm run dev` odošli v Postmane `POST` na `http://localhost:3000/optimize`.
V záložke Body vyber `raw` a `JSON` a vlož:

```json
{
  "products": ["product-1", "product-2"],
  "startingPosition": { "x": 0, "y": 0, "z": 0 }
}
```

Aktuálna odpoveď má HTTP stav `501`:

```json
{ "error": "Picking route optimization is not implemented yet." }
```

Stav `501` znamená, že endpoint je dostupný, ale požadovaný výpočet ešte neexistuje.
Obsah JSON sa zatiaľ nevaliduje; typy v `types.ts` samy neoverujú údaje poslané klientom.

## Príkazy

| Príkaz | Účel |
| --- | --- |
| `npm run dev` | Spustí TypeScript cez tsx a sleduje zmeny vstupného súboru a jeho importov. Ukončenie: Ctrl+C. |
| `npm run typecheck` | Overí typy zdrojového kódu a budúcich testov bez vytvárania JavaScriptu. |
| `npm run build` | Preloží zdrojový kód zo `src` do `dist`. Testy sa do výsledku nezahrnú. |
| `npm start` | Spustí `dist/index.js`; predtým treba vykonať build. |
| `npm test` | Spustí vstavaný testovací nástroj Node.js cez tsx. |
| `npm run test:watch` | Spustí testovací nástroj v režime sledovania zmien. |

`tsx` spúšťa TypeScript, ale nenahrádza kontrolu typov. Tú zabezpečuje `typecheck` a build.
Projekt používa ES moduly (`type: module`) a režim TypeScriptu `NodeNext`.
Pri budúcich relatívnych importoch používaj príponu `.js`, napríklad `./types.js`;
TypeScript ju pri kontrole priradí k príslušnému `.ts` súboru. Typy importuj cez `import type`.

## Rozdelenie zodpovedností

```text
src/
  index.ts                       Spustí HTTP server
  server.ts                      Vytvorí Express aplikáciu a registruje endpoint
  env.ts                         Načíta a overí číslo portu
  http-request-handler.ts        Odpovie na POST /optimize
  warehouse-client.ts            Budúca komunikácia s externým API
  types.ts                       Súradnice, skladové pozície, vstup a výsledok
  picking-route-optimization.ts  Budúci výpočet 3D vzdialenosti a presnej najkratšej trasy
tests/
  README.md                    Plán testov
```

Súbory s `TODO` sú pripravené pre ďalšie kroky a nemajú predstierať hotovú funkcionalitu.
Výpočet trasy bude pracovať s dátami a nebude závisieť od HTTP ani od živého API.
TypeScriptové typy samy neoverujú JSON prijatý z requestu alebo externého systému;
runtime validáciu pridáme pri implementácii týchto hraníc.

## Dohodnuté pravidlá budúceho riešenia

- Jeden business endpoint `POST /optimize`, lokálne na porte 3000.
- Vstup: `products` a `startingPosition` so súradnicami `x`, `y`, `z`.
- Jeden kus každého produktu, výber pozície s dostupným množstvom aspoň jeden kus.
- Prázdny zoznam a duplicitné produkty sa odmietnu.
- Produkt bez dostupnej pozície znamená chybu pre celú objednávku.
- Vzdialenosť meriame priamo v 3D bez prekážok; predpokladáme rovnakú mierku osí.
- Súradnice môžu byť aj desatinné. Vzdialenosť uvádzame v súradnicových jednotkách.
- Trasa začína na `startingPosition` a končí pri poslednom produkte bez návratu na štart.
- Cieľom je globálne minimum cez všetky poradia a výbery pozícií. Pri zhode ponecháme prvé nájdené minimum.
- Výstup: `distance` a `pickingOrder` s dvojicami `productId`, `positionId`.
- Limity presného výpočtu budeme merať postupným zväčšovaním vstupu; zatiaľ nie sú stanovené.

Pri overení skladového API vrátil `product-1` sedem pozícií. Testovací identifikátor
`product-999999999` vrátil HTTP 200 s prázdnym poľom. Ide o pozorovanie pri overení,
nie o garantovaný obsah budúcich odpovedí.

## Použité nástroje a dokumentácia

- [TypeScript](https://www.typescriptlang.org/tsconfig/): striktná kontrola typov a preklad.
- [tsx](https://tsx.is/): spúšťanie TypeScriptu počas vývoja.
- [Node.js test runner](https://nodejs.org/docs/latest-v24.x/api/test.html): budúce testy cez `node:test` a `node:assert/strict`.
- [Node.js CLI](https://nodejs.org/docs/latest-v24.x/api/cli.html): sledovanie zmien a načítanie `.env`.
- [Express](https://expressjs.com/en/guide/routing/): HTTP server, smerovanie požiadaviek a JSON odpovede.

Express je závislosť potrebná pri behu aplikácie. Na načítavanie skladových dát plánujeme zabudovaný `fetch`.
