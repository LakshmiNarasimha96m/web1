// Vercel Node Serverless functions don't always provide a parsed `req.body`
// (unlike Express with express.json()).
export async function parseJsonBody(req) {
  if (req && typeof req.body === "object" && req.body !== null) return req.body;

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};

  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

