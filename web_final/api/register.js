import fetch from 'node-fetch';
import { validateField, sanitizeInput } from '../utils/wafRules.js';
import { parseJsonBody } from '../utils/parseBody.js';

const WAF_URL = process.env.WAF_URL || "https://firewall-o5y1.onrender.com";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST is allowed for register.' });
  }

  const body = await parseJsonBody(req);
  const usernameRaw = body?.username ?? '';
  const emailRaw    = body?.email ?? '';
  const password    = body?.password ?? '';
  const username    = String(usernameRaw).trim();
  const email       = String(emailRaw).trim();

  const userValidation  = validateField(username, { minLength: 3, maxLength: 32 });
  const emailValidation = validateField(email,    { minLength: 5, maxLength: 128 });
  const passValidation  = validateField(password, { minLength: 5, maxLength: 128 });

  if (!userValidation.valid)  return res.status(400).json({ error: userValidation.message });
  if (!emailValidation.valid) return res.status(400).json({ error: emailValidation.message });
  if (!passValidation.valid)  return res.status(400).json({ error: passValidation.message });

  // --- CALL AI WAF on combined username + email ---
  const combined = `${username} ${email}`;
  try {
    const wafRes = await fetch(`${WAF_URL}/api/waf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: combined, source: 'register' })
    });

    const wafResult = await wafRes.json();

    if (wafResult.block === true) {
      fetch(`${WAF_URL}/api/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attack_type: wafResult.attack_type,
          confidence: wafResult.confidence,
          explanation: wafResult.explanation,
          payload: combined,
          source: 'register-endpoint'
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
    console.error('WAF ERROR (register):', err.message);
  }

  const safeUsername = sanitizeInput(username);
  const safeEmail    = sanitizeInput(email);
  return res.status(200).json({ message: `Registration successful for ${safeUsername}.`, username: safeUsername, email: safeEmail });
}
