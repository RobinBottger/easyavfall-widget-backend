import express from "express";
import fetch from "node-fetch";
import dayjs from "dayjs";
import isoWeek from "iso-week";

const app = express();

/**
 * Endepunkt:
 * GET /widget/summary?articles=SEKK,SEKK-1,HENTING&period=current_week&compare=prev_year&dateType=deliveryDate
 * Alternativer:
 *  - period: current_week | current_month | custom  (bruk from=YYYY-MM-DD&to=YYYY-MM-DD når custom)
 *  - compare: prev_year | prev_period | none
 *  - dateType: deliveryDate | orderDate (tilpasses OPTER)
 */
app.get("/widget/summary", async (req, res) => {
  try {
    const articles = (req.query.articles || "").split(",").map(s => s.trim()).filter(Boolean);
    const compare = (req.query.compare || "prev_year"); // prev_year | prev_period | none
    const period = (req.query.period || "current_week"); // current_week | current_month | custom
    const dateType = (req.query.dateType || "deliveryDate");

    let fromISO, toISO;
    const now = dayjs();
    if (period === "current_week") {
      const { year, week } = { year: now.year(), week: isoWeek.week(now.toDate()) };
      const start = isoWeek.startOfWeek(year, week, 1); // mandag
      const end   = isoWeek.endOfWeek(year, week, 1);   // søndag
      fromISO = new Date(start).toISOString();
      toISO   = new Date(end).toISOString();
    } else if (period === "current_month") {
      fromISO = now.startOf("month").toDate().toISOString();
      toISO   = now.endOf("month").toDate().toISOString();
    } else if (period === "custom") {
      if (!req.query.from || !req.query.to) {
        return res.status(400).json({ error: "missing_from_to_for_custom_period" });
      }
      fromISO = new Date(req.query.from).toISOString();
      toISO   = new Date(req.query.to).toISOString();
    } else {
      return res.status(400).json({ error: "bad_period" });
    }

    // --- 2) Hent hovedperiode fra OPTER ---
    const curRows = await fetchOpterData({ fromISO, toISO, dateType, articles });

    // --- 3) Finn sammenligningsperiode ---
    let compFromISO = null, compToISO = null, compLabel = null;
    if (compare === "prev_year") {
      const f = dayjs(fromISO).subtract(1, "year"); const t = dayjs(toISO).subtract(1, "year");
      compFromISO = f.toISOString(); compToISO = t.toISOString(); compLabel = `${f.year()}`;
    } else if (compare === "prev_period") {
      const spanDays = dayjs(toISO).diff(dayjs(fromISO), "day") + 1;
      const f = dayjs(fromISO).subtract(spanDays, "day"); const t = dayjs(fromISO).subtract(1, "day");
      compFromISO = f.toISOString(); compToISO = t.toISOString(); compLabel = "forrige periode";
    }

    const compRows = (compare === "none") ? [] : await fetchOpterData({ fromISO: compFromISO, toISO: compToISO, dateType, articles });

    // --- 4) Aggreger ---
    const agg = rows => ({
      orders: rows.length,
      bags: rows.reduce((s, r) => s + (r.bags ?? 0), 0),
      byArticle: countBy(rows.map(r => r.articleCode || "UKJENT"))
    });

    const curAgg  = agg(curRows);
    const compAgg = agg(compRows);

    // --- 5) Resultat JSON ---
    res.json({
      updated: new Date().toISOString(),
      period: { from: fromISO, to: toISO, dateType },
      filter: { articles, compare },
      current: curAgg,
      compareTo: (compare === "none") ? null : { label: compLabel, ...compAgg }
    });

  } catch (e) {
    res.status(500).json({ error: "backend_error", detail: String(e) });
  }
});

function countBy(arr){
  return arr.reduce((m, k) => (m[k]=(m[k]||0)+1, m), {});
}

/**
 * TODO: Bytt denne mocken med ekte OPTER-API-kall.
 * Her filtrerer vi på artikkelkoder på serversiden, ikke i appen/telefonen.
 */
async function fetchOpterData({ fromISO, toISO, dateType, articles }) {
  // EKSEMPEL (pseudo):
  // const url = `${process.env.OPTER_BASE}/statistics?dateFrom=${encodeURIComponent(fromISO)}&dateTo=${encodeURIComponent(toISO)}&dateType=${dateType}`;
  // const r = await fetch(url, { headers: { Authorization: `Bearer ${process.env.OPTER_TOKEN}` } });
  // const json = await r.json();
  // return json.items
  //   .filter(i => articles.length === 0 ? true : matchesArticle(i.articleCode, articles))
  //   .map(i => ({
  //     articleCode: i.articleCode,
  //     bags: deriveBags(i) // tilpass: hent antall sekker fra riktig felt/linjenivå
  //   }));

  // Midlertidig MOCK for at du kan teste widgeten før OPTER er koblet:
  const rnd = (n)=>Math.floor(Math.random()*n)+1;
  const sample = ["SEKK","SEKK-1","HENTING","HENTING-3","ANNET"];
  const rows = Array.from({length: rnd(50)}).map(() => {
    const code = sample[rnd(sample.length)-1];
    return { articleCode: code, bags: ["SEKK","SEKK-1"].includes(code) ? rnd(3) : 0 };
  });
  return rows.filter(r => articles.length ? matchesArticle(r.articleCode, articles) : true);
}

function matchesArticle(code, allowed) {
  const c = String(code || "").toLowerCase();
  return allowed.some(a => {
    const x = a.toLowerCase().trim();
    return c === x || c.startsWith(x); // eksakt eller prefiks
  });
}

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Running on http://localhost:"+port));
