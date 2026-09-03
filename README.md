# FINN Eiendom — uoffisiell klone

Henter ekte annonser fra FINN, filtrerer dem med FINNs eget filtersett, viser
dem i liste eller kart, og lenker hver annonse til originalen.

**Live:** https://finn-2-0.vercel.app

> Hobbyprosjekt, **ikke tilknyttet FINN.no AS**. FINN-navnet og -logoen tilhører
> FINN.no AS; annonsedata og bilder tilhører FINN og de respektive annonsørene.
> Siden er `noindex`.

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
| `components/finn/MapView.tsx` | Kartvisningen (Leaflet + OpenStreetMap). |

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
node scripts/enrich-finn.mjs --limit=20 --verbose   # se hva parseren finner
node scripts/enrich-finn.mjs                        # 1200 om gangen
```

Framdriften spores på `enrichedAt`, ikke på om et bestemt felt fikk verdi:
mange annonser har for eksempel ingen energimerking i det hele tatt, og å måle
på et felt som lovlig kan mangle ville fått jobben til å hente de samme
annonsene i det uendelige.

Denne kjøringen henter også **koordinatene**, som er det kartet lever av.

En ting å vite: en lang kjøring med fire parallelle begynte å gi «fetch failed»
mot slutten — forbigående struping, ikke manglende data. De samme annonsene
gikk gjennom uten en eneste feil med `--concurrency=2`. Prøv roligere før du
leter etter årsaken i dataene.

### Annonselenker

FINN legger annonser under tre stier — `/realestate/homes/`,
`/realestate/project/` og `/realestate/projectsingle/` — og søkekortene sier
ikke hvilken. Vi lagrer derfor FINNs egen kortlenke, `finn.no/<finnkode>`, som
redirigerer til riktig sti uansett type. Å anta `homes` for alle ga 404 på hver
nybyggannonse, altså 14 % av katalogen.

Filtrene som avhenger av disse feltene viser en merknad i grensesnittet så
lenge ingen annonser har dataene ennå.

## Utvikling

```bash
npm install
npm run dev
```

## Drift

`.github/workflows/refresh-listings.yml` kjører **hver 6. time** og committer
endringene, noe som utløser en ny Vercel-deploy. Én høsting er ~900
forespørsler, så fire i døgnet holder dataene ferske uten å lene seg hardt på
FINN.

Jobben er testet mot GitHubs runnere og slipper gjennom til finn.no. Den
sjekker likevel at FINN svarer 200 før den begynner, og stopper med en tydelig
feil framfor å skrive et tomt datasett over et godt et. Skulle det skje, kjør
`npm run scrape` lokalt og commit resultatet i stedet.

To vern mot dårlige data:

- En kjøring begrenset med `--county` eller `--max-municipalities` **slår
  sammen** med det som ligger der, i stedet for å erstatte alt. En testkjøring
  med tre kommuner sletter altså ikke de øvrige 26 000.
- En full kjøring som kommer tilbake med under 60 % av forrige antall avbryter
  uten å skrive. `--force` overstyrer når nedgangen er reell.
