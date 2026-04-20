const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL;

async function runReport() {
  const twentyFourHoursAgo = new Date(Date.now() - 86400000).toISOString();

  const { data, error } = await supabase
    .from('subreddit_scores')
    .select('*')
    .gte('created_at', twentyFourHoursAgo);

  if (error || !data || !data.length) {
    console.log("No new scans today.");
    return;
  }

  // Find extremes safely with reduce
  const leftiest = data.reduce((prev, curr) => curr.lean_score < prev.lean_score ? curr : prev);
  const rightiest = data.reduce((prev, curr) => curr.lean_score > prev.lean_score ? curr : prev);
  const echoiest = data.reduce((prev, curr) => curr.echo_index > prev.echo_index ? curr : prev);

  const payload = {
    embeds: [{
      title: "📊 Daily Reddit Bias Report",
      description: `Based on **${data.length}** decentralized AI scans in the last 24 hours.`,
      color: 16729344,
      fields: [
        { name: "🟦 Strongest Left Lean", value: `r/${leftiest.subreddit} (${leftiest.lean_score})`, inline: true },
        { name: "🟥 Strongest Right Lean", value: `r/${rightiest.subreddit} (${rightiest.lean_score})`, inline: true },
        { name: "🔊 Thickest Echo Chamber", value: `r/${echoiest.subreddit} (${echoiest.echo_index}/100)`, inline: false }
      ],
      footer: { text: "Reddit Bias Analyzer • Powered by Local AI + WebGPU" },
      timestamp: new Date().toISOString()
    }]
  };

  await fetch(DISCORD_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  console.log("✅ Daily report sent to Discord!");
}

runReport();
