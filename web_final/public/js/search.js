function displaySearchResults(result) {
  const resultsContainer = document.getElementById('searchResults');
  const messageBox = document.getElementById('messageBox');
  if (!resultsContainer || !messageBox) return;

  resultsContainer.innerHTML = '';
  messageBox.textContent = '';
  messageBox.className = '';

  // WAF blocked
  if (result.blocked === true) {
    messageBox.className = 'waf-blocked';
    messageBox.innerHTML = `
      <div style="background:#1a0a0a;border:1px solid #e53e3e;border-radius:8px;padding:16px;color:#fc8181;font-family:sans-serif">
        <div style="font-size:1.1rem;font-weight:700;margin-bottom:8px">&#x1F6A8; Request Blocked by AI Firewall</div>
        <div style="margin-bottom:4px"><b>Attack Type:</b> ${escHtml(result.attack_type || 'Unknown')}</div>
        <div style="margin-bottom:4px"><b>Confidence:</b> ${result.confidence ? (result.confidence * 100).toFixed(1) + '%' : 'N/A'}</div>
        <div style="margin-top:8px;padding:10px;background:#2d1515;border-radius:6px;font-size:0.9rem;line-height:1.5;color:#fca5a5">
          <b>Explanation:</b><br>${escHtml(result.explanation || '')}
        </div>
      </div>`;
    return;
  }

  if (result.error) {
    messageBox.textContent = result.error;
    return;
  }

  const heading = document.createElement('h2');
  heading.textContent = `Search Results for: ${result.searchTerm}`;
  resultsContainer.appendChild(heading);

  result.results.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'story';
    row.innerHTML = `<h3>${escHtml(item.title)}</h3><p>${escHtml(item.description)}</p>`;
    resultsContainer.appendChild(row);
  });
}

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function performSearch(query) {
  const messageBox = document.getElementById('messageBox');
  const resultsContainer = document.getElementById('searchResults');
  if (!messageBox || !resultsContainer) return;

  messageBox.textContent = 'Searching...';
  resultsContainer.innerHTML = '';

  try {
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ searchFor: query })
    });

    const data = await response.json();
    displaySearchResults(data);
  } catch (error) {
    messageBox.textContent = 'Unable to complete search. Please try again later.';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const searchForm  = document.getElementById('searchForm');
  const searchInput = document.getElementById('searchFor');
  const params = new URLSearchParams(window.location.search);
  const query  = params.get('q');

  if (query && searchInput) {
    searchInput.value = query;
    performSearch(query);
  }

  searchForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = searchInput?.value.trim();
    if (value) performSearch(value);
  });
});
