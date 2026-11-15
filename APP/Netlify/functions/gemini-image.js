exports.handler = async function (event, context) {
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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Clé GEMINI_API_KEY absente dans Netlify." })
    };
  }

  try {
    const payload = JSON.parse(event.body || "{}");
    const prompt = payload.prompt || "Décris cette image.";
    const imageBase64 = payload.image; // Optionnel : si tu envoies une image en base64
    const mimeType = payload.mimeType || "image/jpeg";

    // On utilise le modèle gemini-1.5-flash ultra-stable
    const model = "gemini-1.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // Construction des parties du contenu (texte + image optionnelle)
    const parts = [{ text: prompt }];

    if (imageBase64) {
      parts.push({
        inline_data: {
          mime_type: mimeType,
          data: imageBase64
        }
      });
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: parts
          }
        ],
        generationConfig: {
          temperature: 0.4
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error?.message || "Erreur Gemini Image côté serveur.");
    }

    const texteGenere = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!texteGenere) {
      throw new Error("Réponse Gemini Image vide ou mal structurée.");
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ text: texteGenere })
    };

  } catch (error) {
    console.error("Erreur gemini-image :", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: error.message })
    };
  }
};
