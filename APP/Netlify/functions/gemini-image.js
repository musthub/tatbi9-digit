// ==========================================
// FONCTION NETLIFY : gemini-image.js
// ==========================================
exports.handler = async function (event, context) {
  // Gestion du protocole CORS (Pré-vérification indispensable pour les WebViews)
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

  // RECONNAISSANCE DE LA CLÉ STANDARD GEMINI
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { 
      statusCode: 500, 
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Configuration incomplète : Clé GEMINI_API_KEY introuvable sur Netlify." }) 
    };
  }

  try {
    const { prompt, aspect_ratio } = JSON.parse(event.body);
    
    // URL REST officielle pour Imagen 3 via Google AI Studio
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [
          { prompt: prompt }
        ],
        parameters: {
          sampleCount: 1,
          aspectRatio: aspect_ratio || "1:1",
          outputMimeType: "image/jpeg"
        }
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || "Erreur de réponse de l'API Imagen.");
    }

    const imageBytes = data.predictions?.[0]?.bytesBase64Encoded;
    
    if (!imageBytes) {
      throw new Error("L'API Google n'a renvoyé aucune image ou la structure est incorrecte.");
    }

    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json", 
        "Access-Control-Allow-Origin": "*" 
      },
      body: JSON.stringify({ imageBase64: imageBytes }),
    };
  } catch (error) {
    console.error("Erreur d'exécution de la fonction gemini-image :", error);
    return { 
      statusCode: 500, 
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: error.message }) 
    };
  }
};
