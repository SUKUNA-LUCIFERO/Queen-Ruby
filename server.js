// server.js (exemple simple)
import express from "express";
import fetch from "node-fetch";
import multer from "multer";
import FormData from "form-data";
import fs from "fs";

const app = express();
app.use(express.json());
const upload = multer({ dest: "uploads/" });

// configure
const OPENAI_KEY = process.env.OPENAI_API_KEY; // stocker en variable d'env
const PORT = process.env.PORT || 3000;

// 1) générer prompt via ChatGPT-5
app.post("/api/generate-prompt", async (req, res) => {
  const { mangaka, effect } = req.body;
  // Construis ton prompt système + user ici.
  const system = "Tu es un assistant qui transforme les préférences d'un mangaka en PROMPT précis pour un modèle d'image (style, texture, hachures...). Rends la sortie courte et claire.";
  const user = `Crée un prompt pour styliser un dessin papier. Style: ${mangaka}. Effet demandé: ${effect}. Donne une phrase concise, avec instructions sur lineart, trame, contraste et niveau de détail.`;

  try {
    // Exemple générique d'appel à l'API Responses de OpenAI
    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type":"application/json", "Authorization":"Bearer " + OPENAI_KEY },
      body: JSON.stringify({
        model: "gpt-5", // adapte si besoin
        input: [
          { role: "system", content: system },
          { role: "user", content: user }
        ],
        max_tokens: 200
      })
    });
    const data = await r.json();
    // Extraire la sortie selon la structure renvoyée (adapter)
    const prompt = data?.output?.[0]?.content?.[0]?.text || (data?.choices?.[0]?.message?.content) || JSON.stringify(data);
    res.json({ prompt });
  } catch(err){
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 2) traiter l'image : on reçoit image + prompt -> on appelle un modèle d'image (OpenAI image ou un serveur SD)
app.post("/api/enhance-image", upload.single("image"), async (req, res) => {
  const prompt = req.body.prompt || "";
  const effect = req.body.effect || "";
  const filePath = req.file.path;

  try {
    // EXEMPLE GENERIQUE: Si tu utilises une API qui accepte multipart/form-data d'image + prompt,
    // fais-le ici. Pour Stable Diffusion tu pourrais appeler un serveur local AUTOMATIC1111 ou un service.
    // Exemple (pseudocode) : envoie file stream + prompt à l'API image, récupère image modifiée.
    // Ici nous renvoyons simplement le fichier original pour tester l'intégration.
    const buffer = fs.readFileSync(filePath);
    // Nettoyage
    fs.unlinkSync(filePath);
    // Renvoie l'image transformée (ici: juste renvoie l'original)
    res.setHeader("Content-Type", "image/png");
    return res.send(buffer);
  } catch(err){
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, ()=> console.log("Server running on", PORT));