import { CreateMLCEngine } from "@mlc-ai/web-llm";

let engine = null;
const MODEL_ID = "Llama-3.2-1B-Instruct-q4f16_1-MLC";

async function initEngine() {
  if (engine) return engine;
  engine = await CreateMLCEngine(MODEL_ID, {
    initProgressCallback: (progress) => {
      chrome.runtime.sendMessage({ 
        type: "LLM_PROGRESS", 
        text: progress.text || `Downloading model: ${Math.round(progress.progress * 100)}%` 
      });
    }
  });
  return engine;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "run_vibe_check") {
    runVibeCheck(request.data, request.tabId);
    sendResponse({ status: "started" });
  }
  return true;
});

async function runVibeCheck(subredditData, tabId) {
  try {
    const llm = await initEngine();
    const prompt = `You are a psychological and sociological analyst. Read the following recent post titles from the subreddit r/${subredditData.sub}. 

Data:
${subredditData.text}

Provide a concise, 3-sentence "Vibe Check" paragraph. Focus strictly on: 
1. The current emotional state of the community (e.g., angry, euphoric, paranoid).
2. Their primary grievances or targets of praise.
3. The in-group vs out-group dynamics.
Do not use filler words. Be analytical and direct.`;

    const chunks = await llm.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      stream: true,
    });

    let fullResponse = "";
    for await (const chunk of chunks) {
      const token = chunk.choices[0]?.delta?.content || "";
      fullResponse += token;
      chrome.runtime.sendMessage({ type: "LLM_STREAM", text: fullResponse, tabId: tabId });
    }
    chrome.runtime.sendMessage({ type: "LLM_DONE", tabId: tabId });
  } catch (error) {
    chrome.runtime.sendMessage({ type: "LLM_ERROR", text: error.message, tabId: tabId });
  }
}
