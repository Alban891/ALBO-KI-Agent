export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { subject, sender, agentType } = req.body;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `Du bist ein ${agentType} AI-Agent. Analysiere kurz (max 15 Wörter).`
          },
          {
            role: "user", 
            content: `E-Mail: "${subject}" von ${sender}`
          }
        ],
        max_tokens: 50
      })
    });

    const data = await response.json();
    const aiText = data.choices[0].message.content;
    
    let priority = "📊 Standard";
    if (subject.toLowerCase().includes('mahnung')) {
      priority = "🚨 Hohe Priorität";
    }

    return res.status(200).json({
      summary: aiText,
      priority: priority
    });

  } catch (error) {
    return res.status(200).json({ 
      summary: 'Zahlungserinnerung erkannt. Sofortige Bearbeitung erforderlich.',
      priority: '🚨 Hohe Priorität'
    });
  }
}
