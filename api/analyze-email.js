// Diese Datei macht die KI-Analyse
export default async function handler(req, res) {
  
  // Nur POST-Anfragen erlauben
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Nicht erlaubt' });
  }

  // Daten aus der E-Mail holen
  const { subject, sender, agentType } = req.body;

  try {
    // Mit OpenAI sprechen
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
            content: `Du bist ein ${agentType} AI-Agent. Gib eine sehr kurze Zusammenfassung der E-Mail (max 15 Wörter).`
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
    
    // Priorität bestimmen
    let priority = "📊 Standard";
    if (aiText.toLowerCase().includes('dringend') || subject.toLowerCase().includes('mahnung')) {
      priority = "🚨 Hohe Priorität";
    }

    // Antwort zurückschicken
    res.status(200).json({
      summary: aiText,
      priority: priority
    });

  } catch (error) {
    // Falls Fehler passiert
    res.status(500).json({ 
      summary: 'KI-Analyse nicht verfügbar. Demo-Modus aktiv.',
      priority: '⚙️ System'
    });
  }
}