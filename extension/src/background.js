import { pipeline, env } from '@huggingface/transformers';
import { createClient } from '@supabase/supabase-js';
import { CONFIG } from './config.js';
import biasMap from './utils/biasMap.json' with { type: 'json' };

// --- SUPABASE SETUP ---
const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

env.backends.onnx.wasm.wasmPaths = chrome.runtime.getURL('transformers/');
let classifier = null;

// --- ANTI-SPAM UTILS ---
async function getClientId() {
  let data = await chrome.storage.local.get('client_id');
  if (!data.client_id) {
    data.client_id = crypto.randomUUID();
    await chrome.storage.local.set({ client_id: data.client_id });
  }
  return data.client_id;
}

async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- WEBGPU CLASSIFIER ---
async function getClassifier() {
  if (!classifier) {
    classifier = await pipeline('zero-shot-classification', 'Xenova/mobilebert-uncased-mnli', {
      quantized: true,
      progress_callback: (data) => {
        if (data.status === 'progress') console.log(`[Model] ${Math.round(data.progress)}%`);
      }
    });
  }
  return classifier;
}

// --- OFFSCREEN LLM MANAGEMENT ---
let creating;
async function setupOffscreenDocument() {
  const offscreenUrl = chrome.runtime.getURL('offscreen.html');
  const existing = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'], documentUrls: [offscreenUrl] });
  if (existing.length > 0) return;

  if (creating) await creating;
  else {
    creating = chrome.offscreen.createDocument({
      url: 'offscreen.html', reasons: ['WORKERS'], justification: 'WebGPU LLM Vibe Check'
    });
    await creating;
    creating = null;
  }
}

// --- MESSAGE ROUTER ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // 1. WebGPU Bias Scan
  if (request.action === "analyze") {
    (async () => {
      const sub = request.subreddit;
      const hotUrl = `https://www.reddit.com/r/${sub}/hot.json?limit=25`;
      const contUrl = `https://www.reddit.com/r/${sub}/controversial.json?limit=15`;

      const [hotRes, contRes] = await Promise.all([
        fetch(hotUrl).then(r => r.json()),
        fetch(contUrl).then(r => r.json())
      ]);

      const hotPosts = hotRes.data.children;
      const contPosts = contRes.data.children;
      const allText = [...hotPosts, ...contPosts].map(p => p.data.title + " " + (p.data.selftext || "")).join(" ");

      const classifier = await getClassifier();
      const premises = ["left-wing political views", "right-wing political views", "progressive policies", "conservative values"];
      const result = await classifier(allText, premises, { multi_label: true });

      const leftScore = result.scores[0] + result.scores[2];
      const rightScore = result.scores[1] + result.scores[3];
      const leanScore = Math.round(((rightScore - leftScore) / (leftScore + rightScore + 0.01)) * 100);

      let domainBias = 0; let domainCount = 0;
      hotPosts.forEach(p => {
        if (p.data.url) {
          const domain = new URL(p.data.url).hostname.replace('www.', '');
          if (biasMap[domain]) { domainBias += biasMap[domain]; domainCount++; }
        }
      });
      if (domainCount > 0) domainBias = Math.round(domainBias / domainCount);

      let echo = 50;
      if (contPosts.length > 0) {
        const avgContScore = contPosts.reduce((sum, p) => sum + p.data.score, 0) / contPosts.length;
        const lowScorePenalty = Math.max(0, 30 - avgContScore);
        echo = Math.min(95, 40 + lowScorePenalty);
      }

      // Telemetry Opt-in Push
      if (request.optIn) {
        try {
            const clientId = await getClientId();
            const dateStr = new Date().toISOString().split('T')[0];
            const dailyToken = await sha256(`${clientId}-${dateStr}-${sub}`);

            await supabase.from('subreddit_scores').insert([{
                subreddit: sub,
                lean_score: leanScore,
                echo_index: Math.round(echo),
                domain_bias: domainBias,
                daily_token: dailyToken
            }]);
        } catch (e) {
            console.log("Supabase push blocked or rate-limited:", e.message);
        }
      }

      sendResponse({
        subreddit: sub,
        leanScore: leanScore,
        lean: leanScore < -30 ? "Strong Left" : leanScore < -10 ? "Left-Leaning" : leanScore > 30 ? "Strong Right" : leanScore > 10 ? "Right-Leaning" : "Center / Mixed",
        echoIndex: Math.round(echo),
        domainBias: domainBias,
        postsAnalyzed: hotPosts.length + contPosts.length
      });
    })();
    return true;
  }

  // 2. Start Vibe Check LLM
  if (request.action === "start_vibe_check") {
    (async () => {
      await setupOffscreenDocument();
      const hotUrl = `https://www.reddit.com/r/${request.subreddit}/hot.json?limit=15`;
      const data = await fetch(hotUrl).then(r => r.json());
      const textData = data.data.children.map(p => `- ${p.data.title}`).join("\n");

      chrome.runtime.sendMessage({ action: "run_vibe_check", data: { sub: request.subreddit, text: textData }, tabId: sender.tab.id });
      sendResponse({ status: "initializing" });
    })();
    return true;
  }

  // 3. Route LLM stream messages back to Content script
  if (["LLM_STREAM", "LLM_PROGRESS", "LLM_DONE", "LLM_ERROR"].includes(request.type)) {
    if (request.tabId) chrome.tabs.sendMessage(request.tabId, request);
  }
});
