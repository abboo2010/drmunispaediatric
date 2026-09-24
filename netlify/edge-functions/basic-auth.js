// Temporary password lock for the preview site.
// Username and password come from Netlify environment variables
// SITE_USER and SITE_PASSWORD (Project configuration > Environment variables).
// If they are not set, the site stays locked (fails closed).
// To remove the lock later: delete this file from the repository and redeploy.

export default async (request, context) => {
  const user = Deno.env.get("SITE_USER");
  const pass = Deno.env.get("SITE_PASSWORD");

  if (!user || !pass) {
    return new Response("This site is temporarily unavailable.", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const header = request.headers.get("authorization") || "";
  if (header.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6));
      const i = decoded.indexOf(":");
      if (i > -1 && decoded.slice(0, i) === user && decoded.slice(i + 1) === pass) {
        return context.next();
      }
    } catch (_) { /* fall through to 401 */ }
  }

  return new Response("Preview site - please sign in.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Dr. Muniswaran website preview", charset="UTF-8"',
      "Cache-Control": "no-store",
    },
  });
};

export const config = { path: "/*" };
