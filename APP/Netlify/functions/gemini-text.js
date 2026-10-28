// netlify/functions/gemini-text.js
exports.handler = async function (event, context) {
  // Gestion du protocole CORS (Pré-vérification des navigateurs)
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      },
      body: ""
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Méthode non autorisée" };
  }

  // RECONNAISSANCE DE LA CLÉ STANDARD GOOGLE
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { 
      statusCode: 500, 
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Configuration incomplète : Clé GOOGLE_API_KEY introuvable sur Netlify." }) 
    };
  }

  try {
    const { prompt, systemInstruction } = JSON.parse(event.body);
    
    // URL REST officielle et corrigée pour le modèle moderne gemini-2.5-flash
    const url = `https://googleapis.com{apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: {
          parts: [{ text: systemInstruction || "Tu es l'IA officielle de l'Espace Culturel des Pionniers DiGiT." }]
        },
        generationConfig: { 
          temperature: 0.7
        }
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || "Erreur de réponse de l'API Google.");
    }

    // Extraction sécurisée et conforme à la structure JSON de Google Gemini
    const texteGenere = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!texteGenere) {
      throw new Error("L'API Google a renvoyé une réponse vide ou mal structurée.");
    }

    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json", 
        "Access-Control-Allow-Origin": "*" 
      },
      body: JSON.stringify({ text: texteGenere }),
    };
  } catch (error) {
    console.error("Erreur d'exécution de la fonction gemini-text :", error);
    return { 
      statusCode: 500, 
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: error.message }) 
    };
  }
};
