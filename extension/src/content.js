/**
 * Reddit Bias Analyzer - content.js (Launch-Ready Polish)
 * ------------------------------------------------------
 * Handles the UI injection, progress tracking, and message
 * passing between the page and the background AI engine.
 */

const pathParts = window.location.pathname.split('/');
// Only run on subreddit homepages (e.g., /r/technology/)
if (pathParts[1] === 'r' && pathParts[2] && !pathParts[3]) {
  injectUI();
}

function injectUI() {
  const badge = document.createElement('div');
  badge.id = 'rba-root';
  
  // Base Styling
  badge.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #1a1a1b;
    color: #d7dadc;
    border: 1px solid #343536;
    padding: 20px;
    border-radius: 14px;
    z-index: 2147483647;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    width: 300px;
    box-shadow: 0 12px 36px rgba(0,0,0,0.5);
    user-select: none;
  `;
  
  badge.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:15px;">
      <h4 style="margin:0; color:#ff4500; font-size:15px; font-weight:700; letter-spacing:0.5px;">r/${pathParts[2]} AI SCAN</h4>
      <span style="font-size:10px; background:#343536; padding:2px 6px; border-radius:10px; color:#888;">Local WebGPU</span>
    </div>

    <div id="setup-view">
      <label style="font-size:12px; color:#a8aaab; display:flex; align-items:center; gap:8px; margin-bottom:15px; cursor:pointer;">
        <input type="checkbox" id="optInCheck" checked style="accent-color:#ff4500;">
        Contribute to Global Leaderboard
      </label>
      <button id="analyzeBtn" style="background:#ff4500; color:white; border:none; padding:10px; border-radius:8px; width:100%; font-weight:bold; cursor:pointer; font-size:13px; transition:all 0.2s;">
        Run Bias Analysis
      </button>
    </div>

    <div id="results-view" style="display:none; font-size:14px; border-top:1px solid #343536; padding-top:12px; margin-top:5px;">
        <div id="bias-metrics" style="line-height:1.6;"></div>
        
        <button id="vibeBtn" style="margin-top:15px; background:#8a2be2; color:white; border:none; padding:10px; border-radius:8px; width:100%; font-weight:bold; cursor:pointer; font-size:13px;">
          ✨ Generate Vibe Check
        </button>
    </div>

    <!-- Progress HUD (Hidden by default) -->
    <div id="progress-container" style="display:none; margin-top:15px;">
      <div style="display:flex; justify-content:space-between; font-size:10px; color:#888; margin-bottom:5px;">
        <span id="status-text">Waking up AI...</span>
        <span id="percent-text">0%</span>
      </div>
      <div style="width:100%; background:#343536; height:6px; border-radius:10px; overflow:hidden;">
        <div id="progress-bar" style="width:0%; height:100%; background:linear-gradient(90deg, #ff4500, #ff8717); transition:width 0.3s ease;"></div>
      </div>
    </div>

    <div id="vibe-result" style="display:none; margin-top:15px; font-size:13px; line-height:1.5; color:#e2e2e2; padding:10px; background:#272729; border-radius:8px; border-left:3px solid #8a2be2;">
      <div id="vibe-text"></div>
    </div>
  `;

  document.body.appendChild(badge);

  // --- UI References ---
  const analyzeBtn = document.getElementById('analyzeBtn');
  const vibeBtn = document.getElementById('vibeBtn');
  const resultsView = document.getElementById('results-view');
  const setupView = document.getElementById('setup-view');
  const progressContainer = document.getElementById('progress-container');
  const progressBar = document.getElementById('progress-bar');
  const statusText = document.getElementById('status-text');
  const percentText = document.getElementById('percent-text');
  const vibeResult = document.getElementById('vibe-result');
  const vibeText = document.getElementById('vibe-text');
  const metricsDiv = document.getElementById('bias-metrics');

  // --- Logic: Bias Scan ---
  analyzeBtn.addEventListener('click', () => {
    const optIn = document.getElementById('optInCheck').checked;
    analyzeBtn.disabled = true;
    analyzeBtn.innerText = 'Initializing Model...';
    
    // Show progress bar for the classifier (it's smaller but still needs feedback)
    progressContainer.style.display = 'block';
    statusText.innerText = "Loading Classifier...";

    chrome.runtime.sendMessage({ 
      action: "analyze", 
      subreddit: pathParts[2], 
      optIn: optIn 
    }, (res) => {
      // Hide setup, show results
      setupView.style.display = 'none';
      progressContainer.style.display = 'none';
      resultsView.style.display = 'block';
      
      metricsDiv.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
            <span style="color:#888;">Lean</span>
            <span style="font-weight:bold; color:${res.leanScore > 0 ? '#ff585b' : '#60a5fa'}">${res.lean} (${res.leanScore})</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
            <span style="color:#888;">Echo Chamber</span>
            <span style="font-weight:bold;">${res.echoIndex}/100</span>
        </div>
        <div style="display:flex; justify-content:space-between;">
            <span style="color:#888;">Domain Bias</span>
            <span style="font-weight:bold;">${res.domainBias}</span>
        </div>
      `;
    });
  });

  // --- Logic: Vibe Check ---
  vibeBtn.addEventListener('click', () => {
    vibeBtn.disabled = true;
    vibeBtn.style.display = 'none';
    vibeResult.style.display = 'block';
    vibeText.innerHTML = '<span style="color:#888;">Preparing sociological engine...</span>';
    
    // Show progress bar for the heavy Llama download
    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';

    chrome.runtime.sendMessage({ action: "start_vibe_check", subreddit: pathParts[2] });
  });

  // --- Listener for AI Progress & Streaming ---
  chrome.runtime.onMessage.addListener((msg) => {
    // 1. Handle Download/Initialization Progress
    if (msg.type === "LLM_PROGRESS") {
      progressContainer.style.display = 'block';
      statusText.innerText = "Downloading Llama-3...";
      
      // Extract percentage from string if present (e.g., "Loading: 45%")
      const match = msg.text.match(/(\d+)%/);
      if (match) {
        const p = match[1] + "%";
        progressBar.style.width = p;
        percentText.innerText = p;
      } else {
        statusText.innerText = msg.text; // Show text like "Loading weights..."
      }
    }

    // 2. Handle Real-time Text Streaming
    if (msg.type === "LLM_STREAM") {
      // Once streaming starts, hide the progress bar to make room
      progressContainer.style.display = 'none';
      vibeText.innerText = msg.text;
    }

    // 3. Generation Finished
    if (msg.type === "LLM_DONE") {
      statusText.innerText = "Analysis Complete";
      percentText.innerText = "100%";
      progressBar.style.width = "100%";
      setTimeout(() => progressContainer.style.display = 'none', 2000);
    }

    // 4. Handle Errors
    if (msg.type === "LLM_ERROR") {
      statusText.innerText = "GPU Error";
      statusText.style.color = "#ff585b";
      vibeText.innerText = "Error: Your GPU may have run out of memory or doesn't support WebGPU.";
    }
  });
}
