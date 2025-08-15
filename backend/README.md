# Easyavfall OPTER-widget (MVP)

Dette repoet gir en minimal backend for å hente og aggregere OPTER-data for bruk i en iPhone-widget (Scriptable).
Det er ferdig til å deploye på Vercel. Inntil OPTER kobles på bruker backend en mock-generator slik at du kan teste med én gang.

## Hurtigstart (minst mulig arbeid)
1. Opprett prosjekt i Vercel og pek det til denne mappen.
2. Deploy – du får en URL som `https://<appnavn>.vercel.app`.
3. Installer **Scriptable** på iPhone og lim inn skriptet fra `scriptable/Easyavfall-OPTER-Widget.js`.
4. Sett `BASE_URL` i skriptet til din Vercel-URL, legg til widget på Hjem-skjermen.

### Test i nettleser
```
https://<din-app>.vercel.app/widget/summary?articles=SEKK,SEKK-1,HENTING&period=current_week&compare=prev_year&dateType=deliveryDate
```

## Parametre
- `articles` (kommaseparert, f.eks. `SEKK,SEKK-1,HENTING`)
- `period` = `current_week` | `current_month` | `custom` (+ `from` & `to` når custom)
- `compare` = `prev_year` | `prev_period` | `none`
- `dateType` = `deliveryDate` | `orderDate` (tilpass etter OPTER)

## Koble til OPTER
Bytt ut funksjonen `fetchOpterData` i `index.mjs` med ekte API-kall og bruk to miljøvariabler i Vercel:
- `OPTER_BASE`
- `OPTER_TOKEN`

## Lisens
MIT
