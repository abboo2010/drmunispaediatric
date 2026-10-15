// Tags every editable text in the site's HTML pages with data-cms="key" and writes admin/manifest.json.
//
//   cd tools && npm install && node tag-cms.mjs
//
// Safe to re-run: elements that already have a data-cms key keep it; only new, untagged text gets
// a new key. The HTML is edited in place by inserting attributes at exact source positions, so the
// rest of each file is left byte-for-byte unchanged.
import fs from "node:fs";
import path from "node:path";
import { parseDocument } from "htmlparser2";
import { decodeHTML } from "entities";

const ROOT = path.resolve(import.meta.dirname, "..");
const PAGES = ["index", "about", "services", "contact"];
const INLINE = new Set(["a", "strong", "b", "em", "i", "br", "span", "small", "sup", "sub", "u", "mark"]);
const SKIP_TAGS = new Set(["script", "style", "svg", "head", "iframe", "select", "option", "textarea", "input", "noscript", "template", "form"]);
const SKIP_CLASSES = ["ticker", "wa-float", "nav-toggle", "info-close", "os-block", "form-card-logo"];
const SKIP_IDS = new Set(["infoTitle", "infoText", "infoKicker"]);

const isTag = (n) => n.type === "tag";
const isText = (n) => n.type === "text";
const hasClass = (el, c) => (el.attribs.class || "").split(/\s+/).includes(c);
const squash = (s) => s.replace(/\s+/g, " ").trim();

function textOf(n) {
  if (isText(n)) return decodeHTML(n.data);
  return (n.children || []).map(textOf).join("");
}
function inlineOnly(el) {
  return el.children.every((c) => isText(c) || (isTag(c) && INLINE.has(c.name) && inlineOnly(c)));
}
function innerSource(src, el) {
  if (!el.children.length) return "";
  const a = el.children[0].startIndex;
  const b = el.children[el.children.length - 1].endIndex + 1;
  return src.slice(a, b);
}

const FRIENDLY = [
  ["page-hero", "Page heading"], ["hero", "Hero"], ["appointment", "Appointment"], ["cta-diagonal", "Call-to-action banner"],
  ["hs-section", "Services overview"], ["about", "About"], ["sv-section", "Services"], ["contact", "Contact"],
];
function groupLabel(sec) {
  const cls = sec.attribs.class || "";
  let name = FRIENDLY.find(([k]) => cls.includes(k))?.[1];
  const h = findFirst(sec, (n) => isTag(n) && /^h[12]$/.test(n.name));
  const heading = h ? squash(textOf(h)).slice(0, 48) : "";
  if (!name && sec.name !== "section") name = sec.name[0].toUpperCase() + sec.name.slice(1);
  return [name, heading].filter(Boolean).join(" — ") || "Section";
}
function findFirst(n, pred) {
  for (const c of n.children || []) {
    if (pred(c)) return c;
    const r = findFirst(c, pred);
    if (r) return r;
  }
  return null;
}
function labelFor(el) {
  const n = el.name;
  if (/^h[1-6]$/.test(n)) return "Heading";
  if (n === "p") return "Paragraph";
  if (n === "blockquote") return "Quote";
  if (n === "cite") return "Quote author";
  if (n === "li") return "List item";
  if (n === "label") return "Label";
  if (n === "a" || n === "button" || /\bbtn\b/.test(el.attribs.class || "")) return "Button / link";
  if (hasClass(el, "eyebrow")) return "Small heading";
  return "Text";
}

const manifest = { generated: new Date().toISOString(), shared: { nav: [], footer: [], ticker: true }, pages: {} };
const sharedSeen = { nav: new Map(), footer: new Map() };

for (const page of PAGES) {
  const file = path.join(ROOT, page + ".html");
  const src = fs.readFileSync(file, "utf8");
  const doc = parseDocument(src, { withStartIndices: true, withEndIndices: true, decodeEntities: false });
  const inserts = []; // {pos, text}
  const fields = [];

  // continue numbering after any keys that already exist
  let counter = 0;
  for (const m of src.matchAll(new RegExp(`data-cms="${page}\\.(\\d+)"`, "g"))) counter = Math.max(counter, +m[1]);
  const counters = { nav: 0, footer: 0 };
  for (const m of src.matchAll(/data-cms="(nav|footer)\.(\d+)"/g)) counters[m[1]] = Math.max(counters[m[1]], +m[2]);

  function keyFor(scope) {
    if (scope === "nav" || scope === "footer") return `${scope}.${String(++counters[scope]).padStart(2, "0")}`;
    return `${page}.${String(++counter).padStart(2, "0")}`;
  }
  function record(scope, group, key, label, html, def) {
    const f = { key, group, label, html, default: def };
    if (scope === "nav" || scope === "footer") {
      if (!sharedSeen[scope].has(key)) {
        sharedSeen[scope].set(key, f);
        manifest.shared[scope].push({ ...f, group: scope === "nav" ? "Top menu & logo" : "Footer" });
      } else if (sharedSeen[scope].get(key).default !== def) {
        console.warn(`  ! ${page}: ${key} differs from the first page ("${def.slice(0, 30)}")`);
      }
    } else fields.push(f);
  }

  function walk(el, ctx) {
    if (!isTag(el)) return;
    if (SKIP_TAGS.has(el.name)) return;
    if (el.attribs["data-clinic"] !== undefined) return;
    if (SKIP_IDS.has(el.attribs.id) || el.attribs["data-cms-skip"] !== undefined) return;
    if (SKIP_CLASSES.some((c) => hasClass(el, c))) return;
    if (page !== "services" && hasClass(el, "os-block")) return;

    let c = ctx;
    if (el.name === "header") c = { scope: "nav", group: "Top menu & logo" };
    else if (el.name === "footer") c = { scope: "footer", group: "Footer" };
    else if (el.name === "dialog") c = { scope: "main", group: "Service pop-up (fixed wording)" };
    else if (el.name === "section" || (el.name === "div" && hasClass(el, "form-success"))) c = { scope: ctx.scope, group: groupLabel(el) };

    const already = el.attribs["data-cms"];
    const text = squash(textOf(el));
    const kids = el.children.filter(isTag);
    const directText = el.children.filter((n) => isText(n) && squash(n.data) && decodeHTML(n.data).replace(/[\s ]/g, ""));

    const isField = already !== undefined || (inlineOnly(el) && text && (directText.length > 0 || kids.length === 0));
    if (isField) {
      const html = kids.length > 0;
      let key = already;
      if (key === undefined) {
        key = keyFor(c.scope);
        inserts.push({ pos: el.startIndex + 1 + el.name.length, text: ` data-cms="${key}"${html ? " data-cms-html" : ""}` });
      }
      const defRaw = squash(innerSource(src, el));
      const isHtml = html || el.attribs["data-cms-html"] !== undefined;
      record(c.scope, c.group, key, labelFor(el), isHtml, isHtml ? defRaw : decodeHTML(defRaw));
      return;
    }
    // mixed content (text next to an icon / block child): wrap each bare text node in a tagged span
    for (const t of directText) {
      const raw = t.data;
      const lead = raw.length - raw.trimStart().length;
      const trail = raw.length - raw.trimEnd().length;
      const key = keyFor(c.scope);
      inserts.push({ pos: t.startIndex + lead, text: `<span data-cms="${key}">` });
      inserts.push({ pos: t.startIndex + raw.length - trail, text: `</span>` });
      record(c.scope, c.group, key, labelFor(el), false, decodeHTML(squash(raw)));
    }
    for (const k of kids) walk(k, c);
  }

  const html = doc.children.find((n) => isTag(n) && n.name === "html");
  const body = html && html.children.find((n) => isTag(n) && n.name === "body");
  const top = { scope: "main", group: "Page" };
  // header & footer are siblings inside body; walk everything in body
  for (const k of (body || html).children) walk(k, top);

  // page title / description
  const titleM = src.match(/<title>([^<]*)<\/title>/);
  const descM = src.match(/<meta\s+name="description"\s+content="([^"]*)"/);
  const meta = [];
  if (titleM) meta.push({ key: `${page}.__title`, group: "Browser tab & Google", label: "Page title (browser tab)", html: false, default: decodeHTML(titleM[1]) });
  if (descM) meta.push({ key: `${page}.__desc`, group: "Browser tab & Google", label: "Description (shown by Google)", html: false, default: decodeHTML(descM[1]) });

  // apply inserts from the end so earlier positions stay valid
  inserts.sort((a, b) => b.pos - a.pos || (a.text.startsWith("</") ? -1 : 1));
  let out = src;
  for (const ins of inserts) out = out.slice(0, ins.pos) + ins.text + out.slice(ins.pos);
  if (out !== src) fs.writeFileSync(file, out);
  manifest.pages[page] = { fields: [...meta, ...fields] };
  console.log(`${page}: ${fields.length} editable texts (${inserts.length ? "tagged" : "already tagged"})`);
}

fs.mkdirSync(path.join(ROOT, "admin"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "admin", "manifest.json"), JSON.stringify(manifest, null, 1));
console.log(`nav: ${manifest.shared.nav.length}, footer: ${manifest.shared.footer.length}`);
