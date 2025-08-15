import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import OpenAI from 'openai';

// Umgebungsvariablen laden
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001

// OpenAI initialisieren
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Verfügbare KI-Agenten
const agents = [
  { 
    id: 'debitor', 
    name: 'Debitorenbuchhalter', 
    description: 'Bearbeitet Kundenanfragen, Rechnungen und Mahnungen',
    icon: '📊'
  },
  { 
    id: 'kreditor', 
    name: 'Kreditorenbuchhalter', 
    description: 'Verarbeitet Lieferantenrechnungen und Zahlungen',
    icon: '💰'
  },
  { 
    id: 'controller', 
    name: 'Controller', 
    description: 'Erstellt Berichte und Analysen',
    icon: '📈'
  },
  { 
    id: 'cfo', 
    name: 'CFO Assistant', 
    description: 'Unterstützt bei strategischen Finanzentscheidungen',
    icon: '👔'
  }
];

// API Endpunkte

// Alle verfügbaren Agenten abrufen
app.get('/api/agents', (req, res) => {
  res.json({
    success: true,
    agents: agents
  });
});

// E-Mail mit KI-Agent verarbeiten
app.post('/api/process-email', async (req, res) => {
  try {
    const { emailContent, selectedAgent, actionType } = req.body;
    
    console.log(`📧 Verarbeite E-Mail mit Agent: ${selectedAgent}`);
    console.log(`📝 Action Type: ${actionType}`);
    
    // Den passenden Agent finden
    const agent = agents.find(a => a.id === selectedAgent);
    if (!agent) {
      return res.status(400).json({
        success: false,
        error: 'Agent nicht gefunden'
      });
    }

    // System-Prompt für den ausgewählten Agent erstellen
    const systemPrompt = createSystemPrompt(agent);
    
    // OpenAI API aufrufen
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { 
          role: "system", 
          content: systemPrompt 
        },
        { 
          role: "user", 
          content: `Bitte bearbeite diese E-Mail:\n\n${emailContent}` 
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    const aiResponse = completion.choices[0].message.content;

    // Antwort senden
    res.json({
      success: true,
      agent: agent.name,
      response: aiResponse,
      actionType: actionType,
      message: `E-Mail erfolgreich mit ${agent.name} verarbeitet`
    });

  } catch (error) {
    console.error('❌ Fehler bei der Verarbeitung:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler bei der KI-Verarbeitung'
    });
  }
});

// System-Prompt für verschiedene Agenten erstellen
function createSystemPrompt(agent: any): string {
  const basePrompt = `Du bist ein ${agent.name} bei ALBO Solutions, einem deutschen Finanzdienstleister. 
Du beantwortest E-Mails professionell, höflich und kompetent auf Deutsch.`;

  switch (agent.id) {
    case 'debitor':
      return `${basePrompt}
      
Du bist spezialisiert auf:
- Debitorenbuchhaltung und Kundenforderungen
- Rechnungsversand und Zahlungserinnerungen
- Klärung von Zahlungsfragen

Antworte immer professionell und kundenorientiert.`;

    case 'kreditor':
      return `${basePrompt}
      
Du bist spezialisiert auf:
- Kreditorenbuchhaltung und Lieferantenrechnungen
- Zahlungsfreigaben und Buchungen
- Klärung von Lieferantenfragen

Sei präzise und halte dich an Buchhaltungsstandards.`;

    case 'controller':
      return `${basePrompt}
      
Du bist spezialisiert auf:
- Controlling und Finanzanalysen
- Berichte und Kennzahlen
- Budgetplanung und Forecasts

Antworte analytisch und datenbasiert.`;

    case 'cfo':
      return `${basePrompt}
      
Du bist spezialisiert auf:
- Strategische Finanzplanung
- Investitionsentscheidungen
- Unternehmenssteuerung

Antworte strategisch und zukunftsorientiert.`;

    default:
      return basePrompt;
  }
}

// Server starten
app.listen(PORT, () => {
  console.log(`🚀 ALBO KI-Agent Server läuft auf http://localhost:${PORT}`);
  console.log(`📊 ${agents.length} KI-Agenten verfügbar`);
});

export default app;