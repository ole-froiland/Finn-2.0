# Hjemly

En boligsøk-klone som henter ekte annonser fra FINN, lar deg filtrere med de
samme filtrene som FINN bruker, og lenker hver annonse til originalen.

> Hjemly er et uavhengig hobbyprosjekt og er **ikke tilknyttet FINN.no AS**.
> Annonsedata og bilder tilhører FINN og de respektive annonsørene.

## Slik henger det sammen

Data hentes ned på forhånd og committes til repoet — siden gjør ingen kall mot
finn.no når noen besøker den. Det gjør siden rask, og den slutter ikke å
fungere om FINN blokkerer serveren vår.

```
scripts/scrape-finn.mjs   →  data/listings.json  →  Next.js (server-rendret søk)
scripts/enrich-finn.mjs   ↗
```

| Fil | Hva det er |
| --- | --- |
| `data/listings.json` | Alle annonser. Skrives av scraperen. |
| `data/meta.json` | Når datasettet sist ble oppdatert, og hvor mye som er beriket. |
| `data/locations.json` | FINNs eget stedshierarki: 16 fylker, 383 kommuner, 69 underområder, med FINNs koder. |
| `lib/finn/search.ts` | Filtermotoren og fasett-tellingen. |
| `lib/finn/params.ts` | URL ↔ søk. Bruker FINNs egne parameternavn. |

## Hente annonser

FINN stopper paginering rundt side 50, så scraperen går gjennom **én kommune om
gangen** med FINNs egne stedskoder. Det holder oss under taket, og gir samtidig
riktig fylke og kommune for hver annonse — noe søkekortene aldri oppgir selv.

Noen få kommuner har flere annonser enn ett søk rekker gjennom (Trondheim ligger
over grensen i dag). De deles automatisk i prisbånd, som partisjonerer rent
siden hver annonse har nøyaktig én prisantydning.

```bash
npm run scrape                              # hele landet (~380 kommuner)
node scripts/scrape-finn.mjs --county=Oslo  # ett fylke
npm run scrape:quick                        # de 25 største kommunene
```

Kjøringen tar vare på `firstSeen` for annonser den har sett før, så «Nye i dag»
fortsetter å bety noe.

### Detaljdata

Energikarakter, fasiliteter, etasje, byggeår og tomtestørrelse står ikke på
søkekortene — de må hentes fra hver annonseside. Det er en egen, inkrementell
kjøring:

```bash
node scripts/enrich-finn.mjs --limit=20 --verbose   # sjekk parseren først
node scripts/enrich-finn.mjs --limit=500            # så en full runde
```

Filtrene som avhenger av disse feltene viser en merknad i grensesnittet så
lenge ingen annonser har dataene ennå.

## Utvikling

```bash
npm install
npm run dev
```

## Drift

`.github/workflows/refresh-listings.yml` kjører scraperen to ganger i døgnet og
committer endringene, noe som utløser en ny Vercel-deploy. Merk at GitHubs
runnere kjører på Azure-IP-er som FINN kan avvise — hvis kjøringen begynner å
komme tom tilbake, kjør `npm run scrape` lokalt og commit resultatet i stedet.
