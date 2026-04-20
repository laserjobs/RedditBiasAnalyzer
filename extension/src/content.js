const pathParts = window.location.pathname.split('/');
// Ensure we are on a subreddit homepage, not a post
if (pathParts[1] === 'r' && pathParts[2] && !pathParts[3]) {
  createUI();
}

function createUI() {
  const badge = document.createElement('div');
  badge.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #1a1a1b;
    color: #d7dadc;
    border: 1px solid #343536;
    padding: 16px;
    border-radius: 12px;
    z-index: 999999;
    font-family: system-ui, -apple-system, sans-serif;
    min-width: 280px;
    max-width: 320px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.6);
  `;
  
  badge.innerHTML = `
    <h4 style="margin: 0 0 10px 0; color: #ff4500; font-size: 16px; font-weight: bold;">r/${pathParts[2]} — AI Analysis</h4>
    
    <label style="font-size: 12px; color: #888; display: flex; align-items: center; gap: 6px; margin-bottom: 12px; cursor: pointer;">
        <input type="checkbox" id="optInCheck" checked style="accent-color: #ff4500;">
        Share score anonymously to Leaderboard
    </label>

    <button id="analyzeBtn" style="background:#ff4500;color:white;border:none;padding:10px 16px;border-radius:6px;width:100%;font-weight:bold;cursor:pointer;transition: 0.2s;">
        Run Full AI Scan
    </button>
    
    <div id="results" style="margin-top:12px;font-size:14px;line-height:1.5;display:none;"></div>
    
    <hr style="border-color:#343536; margin: 12px 0; display:none;" id="vibeDivider">
    
    <button id="vibeBtn" style="background:#8a2be2;color:white;border:none;padding:10px;border-radius:6px;width:100%;font-weight:bold;cursor:pointer;display:none;transition: 0.2s;">
        ✨ Generate AI Vibe Check
    </button>
    
    <div id="vibeResult" style="margin-top:10px;font-size:13px;color:#e2e2e2;font-style:italic;line-height: 1.4; display:none;"></div>
  `;
  
  document.body.appendChild(badge);

  // --- ANALYZE BUTTON LOGIC ---
  document.getElementById('analyzeBtn').addEventListener('click', async () => {
    const btn = document.getElementById('analyzeBtn');
    const optIn = document.getElementById('optInCheck').checked;
    
    btn.textContent = 'Analyzing with AI…';
    btn.disabled = true;
    btn.style.opacity = '0.7';

    try {
      chrome.runtime.sendMessage({ action: "analyze", subreddit: pathParts[2], optIn: optIn }, (res) => {
        document.getElementById('results').innerHTML = `
          <strong>Partisan Lean:</strong> ${res.lean} (${res.leanScore})<br>
          <strong>Echo Chamber:</strong> ${res.echoIndex}/100<br>
          <strong>Domain Bias:</strong> ${res.domainBias}<br>
          <em style="color:#888; font-size:12px; display:block; margin-top:6px;">Based on ${res.postsAnalyzed} posts • MobileBERT</em>
        `;
        document.getElementById('results').style.display = 'block';
        btn.style.display = 'none';
        document.getElementById('optInCheck').parentElement.style.display = 'none';
        
        // Reveal Vibe Check Feature
        document.getElementById('vibeDivider').style.display = 'block';
        document.getElementById('vibeBtn').style.display = 'block';
        document.getElementById('vibeResult').style.display = 'block';
      });
    } catch (e) {
      btn.textContent = 'Error — Try Again';
      btn.disabled = false;
      btn.style.opacity = '1';
    }
  });

  // --- VIBE CHECK BUTTON LOGIC ---
  document.getElementById('vibeBtn').addEventListener('click', () => {
    const vBtn = document.getElementById('vibeBtn');
    const vRes = document.getElementById('vibeResult');
    
    vBtn.disabled = true;
    vBtn.style.opacity = "0.5";
    vRes.innerText = "Waking up 1B LLM (First run downloads 800MB. Caches locally forever)...";

    chrome.runtime.sendMessage({ action: "start_vibe_check", subreddit: pathParts[2] });
  });

  // --- LISTEN FOR LLM STREAM ---
  chrome.runtime.onMessage.addListener((msg) => {
    const vRes = document.getElementById('vibeResult');
    if (msg.type === "LLM_PROGRESS") {
        vRes.innerText = msg.text;
    } else if (msg.type === "LLM_STREAM") {
        vRes.innerText = `"${msg.text}"`;
    } else if (msg.type === "LLM_DONE") {
        document.getElementById('vibeBtn').innerText = "✨ Vibe Check Complete";
    } else if (msg.type === "LLM_ERROR") {
        vRes.innerText = `Error: ${msg.text}`;
    }
  });
}
