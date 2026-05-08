import fetch from 'node-fetch';

const WAF_URL = process.env.WAF_URL || "https://firewall-o5y1.onrender.com";

const sampleProducts = [
  { title: 'Abstract oil painting', description: 'A colorful abstract oil painting for modern interiors.' },
  { title: 'Classic sculpture', description: 'A hand-finished modern sculpture in resin and stone.' },
  { title: 'Contemporary canvas', description: 'A vibrant canvas print that brightens any room.' },
  { title: 'Minimalist art print', description: 'A simple, elegant print that works in every home.' }
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST is allowed for search.' });
  }

  const rawTerm = req.body?.searchFor ?? '';
  const searchTerm = String(rawTerm).trim();

  // --- CALL AI WAF ---
  try {
    const wafRes = await fetch(`${WAF_URL}/api/waf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: searchTerm, source: 'search' })
    });

    const wafResult = await wafRes.json();

    if (wafResult.block === true) {
      // Send notification to firewall admin (belt-and-suspenders)
      fetch(`${WAF_URL}/api/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attack_type: wafResult.attack_type,
          confidence: wafResult.confidence,
          explanation: wafResult.explanation,
          payload: searchTerm,
          source: 'search-endpoint'
        })
      }).catch(() => {});

      return res.status(200).json({
        blocked: true,
        error: `\uD83D\uDEA8 Attack Blocked by AI Firewall`,
        attack_type: wafResult.attack_type,
        confidence: wafResult.confidence,
        explanation: wafResult.explanation
      });
    }
  } catch (err) {
    console.error('WAF ERROR:', err.message);
    // Fail open — don't block users if WAF is unreachable
  }

  // --- NORMAL SEARCH ---
  const results = sampleProducts.filter(item => {
    const lower = searchTerm.toLowerCase();
    return item.title.toLowerCase().includes(lower) ||
           item.description.toLowerCase().includes(lower);
  });

  return res.status(200).json({
    searchTerm,
    results: results.length ? results : [{ title: 'No matches found', description: `No results for '${searchTerm}'.` }]
  });
}
