# 🧭 Reddit Bias Analyzer (Local AI)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![WebGPU](https://img.shields.io/badge/Tech-WebGPU-orange)](https://developer.chrome.com/docs/capabilities/webgpu)
[![Local AI](https://img.shields.io/badge/AI-Local--First-blueviolet)](https://huggingface.co/docs/transformers.js)

A fully decentralized, privacy-first ecosystem that analyzes Reddit communities using state-of-the-art on-device Machine Learning. 

**Zero server costs. Zero data scraping. 100% Local AI.**

## 🌟 Features
*   **In-Browser WebGPU AI:** Uses HuggingFace `Transformers.js` (MobileBERT NLI) to detect political lean and domain bias using your hardware, not a remote API.
*   **Local Vibe Checks:** Loads a quantized 1B Llama-3.2 model into your browser cache via `WebLLM` to write accurate sociological summaries of subreddit culture.
*   **Decentralized Leaderboard:** A "Waze-style" crowd-sourced scoring system. Pushes anonymized, aggregated scores to a public Supabase instance.
*   **Anti-Spam Logic:** Cryptographic daily hashing ensures each user can only contribute one scan per subreddit per day, preventing manipulation without requiring logins.
*   **Automated Discord Bot:** A zero-cost GitHub Action that computes and posts a daily "State of Reddit" report to your community.

## 🏗️ Technical Architecture
This project is built on:
1.  **Extension (The Edge):** Runs inference on the user's GPU using WebGPU and WASM.
2.  **Supabase (The Consensus):** Acts as a neutral, anonymous aggregator for scores.
3.  **GitHub Pages (The View):** Visualizes the global data as a Bias Heat Map.
4.  **GitHub Actions (The Oracle):** Performs daily automated analytics for the Discord/Telegram bot.

## 🚀 Installation (Extension)

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18 or higher)
*   Google Chrome (v121+ for WebGPU support)

### Setup
1.  Clone the repository:
    ```bash
    git clone https://github.com/YOUR_USERNAME/RedditBiasAnalyzer.git
    ```
2.  Navigate to the `/extension` folder:
    ```bash
    cd extension
    npm install
    ```
3.  Add your Supabase URL and Anon Key in `src/background.js`.
4.  Build the extension:
    ```bash
    npm run build
    ```
5.  Open Chrome and go to `chrome://extensions/`.
6.  Turn on **Developer Mode** (top right).
7.  Click **Load unpacked** and select the `extension/dist` folder.

## 🛡️ Privacy & Security
*   **No Raw Text Ever Leaves Your Device:** The analysis happens in the browser. Only the final numerical scores (e.g., -42, 85) are sent to the leaderboard if you opt-in.
*   **Anonymity by Design:** No accounts or email addresses are required. A random `client_id` is generated locally to prevent spam but is never linked to your Reddit identity.

## 📊 Live Dashboard
The decentralized leaderboard and bias heat map are hosted via GitHub Pages. 
[View Live Dashboard Here](https://laserjobs.github.io/RedditBiasAnalyzer/)

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.

---
*Built with ❤️ using HuggingFace Transformers.js, MLC WebLLM, and Supabase.*
