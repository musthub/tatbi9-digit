// netlify/functions/gemini-image.js
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
    const { prompt, aspect_ratio } = JSON.parse(event.body);
    
    // URL REST officielle pour la génération d'images via Imagen 3
    const url = `https://googleapis.com{apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: prompt,
        numberOfImages: 1,
        aspectRatio: aspect_ratio || "1:1",
        outputMimeType: "image/jpeg"
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || "Erreur de réponse de l'API Imagen.");
    }

    // Extraction de la chaîne de caractères Base64 conforme à l'API Google actuelle
    const imageBytes = data.generatedImages?.[0]?.image?.imageBytes;
    
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
