# 🧭 Reddit Bias Analyzer (Local AI)

A fully decentralized, privacy-first ecosystem that analyzes Reddit communities using on-device Machine Learning. 

**Zero server costs. Zero data scraping. 100% Local AI.**

## 🌟 Features
* **In-Browser WebGPU AI:** Uses HuggingFace `Transformers.js` (MobileBERT NLI) to detect political lean and domain bias.
* **Local Vibe Checks:** Loads a quantized 1B Llama-3.2 model into your browser cache via `WebLLM` to write accurate sociological summaries.
* **Decentralized Leaderboard:** Waze-style crowd-sourced scoring. Pushes anonymized data to a public Supabase instance.
* **Anti-Spam:** Cryptographic daily hashing prevents leaderboard manipulation without requiring user accounts.
* **Automated Discord Bot:** A zero-cost GitHub Action that posts a daily "State of Reddit" report.

## 🚀 Installation (Extension)
1. Navigate to the `/extension` folder.
2. Run `npm install` and then `npm run build`.
3. Open Chrome -> `chrome://extensions/` -> Turn on **Developer Mode**.
4. Click **Load unpacked** and select the `/extension/dist` folder.
5. Visit any subreddit!

## 📊 Live Dashboard
The decentralized leaderboard and bias heat map are hosted via GitHub Pages. 
[View Live Dashboard Here](#) *(Add your GitHub Pages link here later)*
