// Easyavfall – OPTER Widget (Small/Medium)
// 1) Sett BASE_URL = din backend (Vercel)
// 2) I widget-innstillinger (hold på widget > Edit): sett "Parameter" som query, f.eks:
//    articles=SEKK,SEKK-1&period=current_week&compare=prev_year&dateType=deliveryDate

const BASE_URL = "https://<din-app>.vercel.app/widget/summary";

const qp = (args.widgetParameter || "").trim();
const url = qp ? `${BASE_URL}?${qp}` : `${BASE_URL}?articles=SEKK,SEKK-1,HENTING&period=current_week&compare=prev_year&dateType=deliveryDate`;

const req = new Request(url);
req.timeoutInterval = 10;

let data;
try { data = await req.loadJSON(); }
catch(e){ data = { error: String(e) }; }

const w = new ListWidget();
w.setPadding(12,12,12,12);

const title = w.addText("Easyavfall – Artikler");
title.font = Font.mediumSystemFont(12);

w.addSpacer(6);

if (!data.error && data.current){
  const periodTxt = `${fmtDate(data?.period?.from)} → ${fmtDate(data?.period?.to)}`;
  const p = w.addText(periodTxt);
  p.font = Font.systemFont(10);
  p.textColor = Color.gray();

  const cur = data.current;
  const l1 = w.addText(`Sekker: ${cur.bags}  |  Ordrer: ${cur.orders}`);
  l1.font = Font.boldSystemFont(16);

  if (data.compareTo){
    w.addSpacer(4);
    const c = data.compareTo;
    const deltaBags = cur.bags - c.bags;
    const deltaOrders = cur.orders - c.orders;
    const sign = v => v>0?`+${v}`:`${v}`;
    const t = w.addText(`Mot ${c.label}: ${c.bags} (${sign(deltaBags)}) / ${c.orders} (${sign(deltaOrders)})`);
    t.font = Font.systemFont(11);
  }

  w.addSpacer(6);
  const arts = Object.entries(cur.byArticle || {}).slice(0,3).map(([k,v]) => `${k}:${v}`).join("  ");
  const a = w.addText(arts || "Ingen artikler");
  a.font = Font.systemFont(11);

  w.addSpacer(6);
  const u = w.addText(`Oppdatert: ${fmtDateTime(data.updated)}`);
  u.font = Font.systemFont(9);
  u.textColor = Color.gray();
} else {
  const err = w.addText("Ingen data / feil");
  err.font = Font.boldSystemFont(14);
  const det = w.addText(String(data.error ?? "Sjekk URL/parameter"));
  det.font = Font.systemFont(10);
  det.textColor = Color.gray();
}

Script.setWidget(w);
// w.presentSmall(); // bruk denne for test i app før du legger den som widget

function fmtDate(s){ try{ return String(s).slice(0,10); }catch(e){ return ""; } }
function fmtDateTime(s){ try{ return String(s).replace("T"," ").slice(0,16); }catch(e){ return ""; } }
