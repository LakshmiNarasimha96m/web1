function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function showWafBlock(messageBox, data) {
  messageBox.innerHTML = `
    <div style="background:#1a0a0a;border:1px solid #e53e3e;border-radius:8px;padding:16px;color:#fc8181;font-family:sans-serif">
      <div style="font-size:1.1rem;font-weight:700;margin-bottom:8px">&#x1F6A8; Request Blocked by AI Firewall</div>
      <div style="margin-bottom:4px"><b>Attack Type:</b> ${escHtml(data.attack_type || 'Unknown')}</div>
      <div style="margin-bottom:4px"><b>Confidence:</b> ${data.confidence ? (data.confidence * 100).toFixed(1) + '%' : 'N/A'}</div>
      <div style="margin-top:8px;padding:10px;background:#2d1515;border-radius:6px;font-size:0.9rem;line-height:1.5;color:#fca5a5">
        <b>Explanation:</b><br>${escHtml(data.explanation || '')}
      </div>
    </div>`;
}

document.addEventListener('DOMContentLoaded', () => {
  const loginForm  = document.getElementById('loginForm');
  const messageBox = document.getElementById('messageBox');

  loginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('username')?.value.trim();
    const password = document.getElementById('password')?.value;

    if (!username || !password) {
      messageBox.textContent = 'Username and password are required.';
      return;
    }

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.blocked === true) {
        showWafBlock(messageBox, data);
        return;
      }

      if (!response.ok) {
        messageBox.textContent = data.error || 'Login failed.';
        return;
      }

      localStorage.setItem('vulnweb.username', data.username || username);
      messageBox.textContent = data.message || 'Login successful.';
      setTimeout(() => { window.location.href = './index.html'; }, 800);
    } catch (error) {
      messageBox.textContent = 'Unable to login at this time.';
    }
  });
});
