// Temporary sign-in page for the preview site (until the doctor approves it).
//
// Username and password come from Netlify environment variables
//   SITE_USER and SITE_PASSWORD  (Project configuration > Environment variables).
// If they are not set, the site stays locked (fails closed).
// To remove the lock later: delete this file from the repository and redeploy.

const COOKIE = "site_auth";
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // stay signed in for 7 days
const LOGO_PATH = "/img/logo-mark.png"; // must be public so the sign-in page can show it

const enc = new TextEncoder();
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

async function hmac(secret, msg) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", key, enc.encode(msg)));
}
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
function getCookie(req, name) {
  for (const part of (req.headers.get("cookie") || "").split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return null;
}
async function makeToken(secret) {
  const exp = String(Date.now() + TTL_MS);
  return exp + "." + (await hmac(secret, exp));
}
async function validToken(secret, token) {
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || !(Number(exp) > Date.now())) return false;
  return safeEqual(sig, await hmac(secret, exp));
}
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const safeNext = (n) => (typeof n === "string" && n.startsWith("/") && !n.startsWith("//") && !n.includes("\\") ? n : "/");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function loginPage(next, error) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Sign in | Dr. Muniswaran A/L Nadesin</title>
<link rel="icon" type="image/png" href="${LOGO_PATH}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,600;8..60,700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{--navy:#0c2038;--blue:#2f6fa8;--blue-dark:#1f4d78;--ink:#1c2530;--slate:#5b6878;--line:#dbe4ec;--bg:#f3f7fb}
*{box-sizing:border-box}
html,body{margin:0;min-height:100%}
body{font-family:'Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:var(--ink);background:
  radial-gradient(900px 500px at 15% -10%,#dcecf8 0%,transparent 60%),
  radial-gradient(800px 500px at 100% 110%,#e3f1f1 0%,transparent 55%),var(--bg);
  min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px 16px}
.card{width:100%;max-width:420px;margin-top:64px;background:#fff;border:1px solid var(--line);border-radius:24px;padding:36px 32px 28px;
  box-shadow:0 24px 60px rgba(12,32,56,.12),0 2px 6px rgba(12,32,56,.05);text-align:center}
.logo{width:96px;height:96px;border-radius:50%;background:#fff;box-shadow:0 8px 24px rgba(12,32,56,.15);
  display:flex;align-items:center;justify-content:center;margin:-68px auto 18px;padding:6px;border:1px solid var(--line)}
.logo img{width:100%;height:100%;object-fit:contain;border-radius:50%}
.wrap{margin-top:52px}
.badge{display:inline-block;font-size:11.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--blue);
  background:#eaf3fa;border-radius:999px;padding:6px 12px;margin-bottom:14px}
h1{font-family:'Source Serif 4',Georgia,serif;font-size:26px;line-height:1.2;margin:0 0 4px;color:var(--navy)}
.role{font-size:13.5px;font-weight:600;color:var(--blue);margin:0 0 14px}
.lede{font-size:14.5px;line-height:1.55;color:var(--slate);margin:0 0 24px}
form{text-align:left}
label{display:block;font-size:13px;font-weight:600;color:var(--navy);margin:0 0 6px}
.field{margin-bottom:16px}
input[type=text],input[type=password]{width:100%;font:inherit;font-size:15.5px;color:var(--ink);background:#f7fafd;border:1.5px solid var(--line);
  border-radius:14px;padding:13px 14px;outline:none;transition:border-color .15s,box-shadow .15s,background .15s}
input:focus{border-color:var(--blue);background:#fff;box-shadow:0 0 0 4px rgba(47,111,168,.14)}
.pw{position:relative}
.pw input{padding-right:50px}
.eye{position:absolute;top:50%;right:6px;transform:translateY(-50%);width:40px;height:40px;border:0;background:transparent;color:var(--slate);
  border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center}
.eye:hover{color:var(--blue);background:#eaf3fa}
.eye:focus-visible{outline:3px solid rgba(47,111,168,.35)}
.eye .off{display:none}
.eye.on .off{display:block}.eye.on .show{display:none}
.btn{width:100%;font:inherit;font-size:16px;font-weight:600;color:#fff;background:var(--blue);border:0;border-radius:999px;padding:14px 20px;cursor:pointer;
  box-shadow:0 10px 24px rgba(47,111,168,.28);transition:transform .15s,background .15s;margin-top:4px}
.btn:hover{background:var(--blue-dark);transform:translateY(-1px)}
.err{background:#fdeeee;border:1px solid #f3c6c6;color:#9b2226;border-radius:12px;padding:11px 14px;font-size:14px;margin:0 0 16px;text-align:left}
.help{margin:22px 0 0;padding-top:18px;border-top:1px solid var(--line);font-size:13px;line-height:1.6;color:var(--slate);text-align:center}
.help a{color:var(--blue-dark);font-weight:600;text-decoration:none;white-space:nowrap}
.help a:hover{text-decoration:underline}
@media (max-width:420px){.card{padding:32px 22px 24px}h1{font-size:23px}}
</style>
</head>
<body>
<main class="card">
  <div class="logo"><img src="${LOGO_PATH}" alt="Dr. Muniswaran A/L Nadesin logo"></div>
  <div class="wrap">
    <span class="badge">Private preview</span>
    <h1>Dr. Muniswaran A/L Nadesin</h1>
    <p class="role">Consultant Paediatric Surgeon</p>
    <p class="lede">This website is being prepared and is not yet open to the public. Please sign in to view it.</p>
    ${error ? `<div class="err" role="alert">${esc(error)}</div>` : ""}
    <form method="POST" action="/__login">
      <input type="hidden" name="next" value="${esc(next)}">
      <div class="field">
        <label for="u">Username</label>
        <input id="u" name="username" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" required autofocus>
      </div>
      <div class="field">
        <label for="p">Password</label>
        <div class="pw">
          <input id="p" name="password" type="password" autocomplete="current-password" required>
          <button type="button" class="eye" id="eye" aria-label="Show password" aria-pressed="false" title="Show password">
            <svg class="show" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>
            <svg class="off" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.9 17.9A10.6 10.6 0 0 1 12 19c-6.4 0-10-7-10-7a17.6 17.6 0 0 1 4.1-4.9M9.9 5.2A9.9 9.9 0 0 1 12 5c6.4 0 10 7 10 7a17.7 17.7 0 0 1-2.2 3.2M1 1l22 22"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>
          </button>
        </div>
      </div>
      <button class="btn" type="submit">Sign in</button>
    </form>
    <p class="help">For enquiries or appointments, please call the clinic on <a href="tel:+6088346616">088-346616</a> / <a href="tel:+60885188888">088-518 888</a> or WhatsApp <a href="https://wa.me/60106696074" target="_blank" rel="noopener">010-669 6074</a>.</p>
  </div>
</main>
<script>
(function(){
  var b=document.getElementById('eye'),p=document.getElementById('p');
  b.addEventListener('click',function(){
    var show=p.type==='password';
    p.type=show?'text':'password';
    b.classList.toggle('on',show);
    b.setAttribute('aria-pressed',show?'true':'false');
    var t=show?'Hide password':'Show password';
    b.setAttribute('aria-label',t);b.title=t;
    p.focus();
  });
})();
</script>
</body>
</html>`;
}

const html = (body, status) =>
  new Response(body, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });

export default async (request, context) => {
  const user = Deno.env.get("SITE_USER");
  const pass = Deno.env.get("SITE_PASSWORD");

  if (!user || !pass) {
    return new Response("This site is temporarily unavailable.", { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  const url = new URL(request.url);
  const secret = user + "\n" + pass;

  // The logo must load on the sign-in page before anyone is signed in.
  if (url.pathname === LOGO_PATH && request.method === "GET") return context.next();

  // Sign out (handy for testing): /__logout
  if (url.pathname === "/__logout") {
    return new Response(null, {
      status: 303,
      headers: { Location: "/", "Set-Cookie": `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`, "Cache-Control": "no-store" },
    });
  }

  // Sign-in form submitted
  if (url.pathname === "/__login" && request.method === "POST") {
    let u = "", p = "", next = "/";
    try {
      const form = await request.formData();
      u = String(form.get("username") || "").trim();
      p = String(form.get("password") || "");
      next = safeNext(String(form.get("next") || "/"));
    } catch (_) { /* treat as failed */ }

    if (safeEqual(u, user) && safeEqual(p, pass)) {
      const token = await makeToken(secret);
      return new Response(null, {
        status: 303,
        headers: {
          Location: next,
          "Set-Cookie": `${COOKIE}=${token}; Path=/; Max-Age=${TTL_MS / 1000}; HttpOnly; Secure; SameSite=Lax`,
          "Cache-Control": "no-store",
        },
      });
    }
    await sleep(800); // slows down password guessing
    return html(loginPage(next, "That username or password is not correct. Please try again."), 401);
  }

  // Already signed in?
  if (await validToken(secret, getCookie(request, COOKIE))) return context.next();

  // Otherwise show the sign-in page
  return html(loginPage(safeNext(url.pathname + url.search), ""), 401);
};

export const config = { path: "/*" };
