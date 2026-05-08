import fetch from 'node-fetch';
import { validateField, sanitizeInput } from '../utils/wafRules.js';
import { parseJsonBody } from '../utils/parseBody.js';

const WAF_URL = process.env.WAF_URL || "https://firewall-o5y1.onrender.com";

function payloadPreview(value) {
  const s = String(value ?? "");
  const trimmed = s.trim();
  const max = 120;
  return {
    payload_len: trimmed.length,
    payload_preview: trimmed.length > max ? trimmed.slice(0, max) + "..." : trimmed
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST is allowed for login.' });
  }

  const body = await parseJsonBody(req);
  const usernameRaw = body?.username ?? '';
  const password    = body?.password ?? '';
  const username    = String(usernameRaw).trim();

  const userValidation = validateField(username, { minLength: 3, maxLength: 32 });
  const passValidation = validateField(password, { minLength: 5, maxLength: 128 });

  if (!userValidation.valid) return res.status(400).json({ error: userValidation.message });
  if (!passValidation.valid) return res.status(400).json({ error: passValidation.message });

  // --- CALL AI WAF ---
  try {
    const wafRes = await fetch(`${WAF_URL}/api/waf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: username, source: 'login' })
    });

    const wafResult = await wafRes.json();

    if (wafResult.block === true) {
      console.warn('[WAF][BLOCK][ai]', {
        endpoint: 'login',
        attack_type: wafResult.attack_type || 'Unknown',
        confidence: wafResult.confidence ?? null,
        explanation: wafResult.explanation ?? null,
        ...payloadPreview(username)
      });
      fetch(`${WAF_URL}/api/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attack_type: wafResult.attack_type,
          confidence: wafResult.confidence,
          explanation: wafResult.explanation,
          payload: username,
          source: 'login-endpoint'
        })
      }).catch(() => {});

      return res.status(400).json({
        blocked: true,
        error: '\uD83D\uDEA8 Attack Blocked by AI Firewall',
        attack_type: wafResult.attack_type,
        confidence: wafResult.confidence,
        explanation: wafResult.explanation
      });
    }
  } catch (err) {
    console.error('WAF ERROR (login):', err?.message || String(err));
  }

  const safeUsername = sanitizeInput(username);
  return res.status(200).json({ message: `Welcome back, ${safeUsername}!`, username: safeUsername });
}
