const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const app = express();

const PORT = process.env.PORT || 3000;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

app.get("/", (req, res) => res.send("🔥 Proxy Olympus: Activo"));

app.get("/series", async (req, res) => {
    try {
        // 1. Cargamos la página de la biblioteca (donde están todos los mangas)
        const response = await axios.get('https://olympusbiblioteca.com/biblioteca', {
            headers: { 'User-Agent': UA }
        });

        const $ = cheerio.load(response.data);
        const script = $('script').filter((i, el) => $(el).html().includes('window.__NUXT__')).html();
        
        if (!script) return res.json({ data: [], error: "No se detectó el script de datos" });

        // 2. Extraemos el contenido del objeto Nuxt
        const jsonText = script.split('window.__NUXT__=')[1].split(';')[0];
        const nuxt = JSON.parse(jsonText);

        // 3. BUSCADOR PROFUNDO: Rastreamos cualquier array que contenga mangas
        let foundData = [];
        
        function deepSearch(obj) {
            if (foundData.length > 0) return;
            if (Array.isArray(obj)) {
                // Si el array tiene objetos con 'slug', estos son los mangas
                if (obj.length > 0 && obj[0] && (obj[0].slug || obj[0].name)) {
                    foundData = obj;
                    return;
                }
            }
            if (obj && typeof obj === 'object') {
                for (let key in obj) deepSearch(obj[key]);
            }
        }

        deepSearch(nuxt);

        // 4. Limpiamos y formateamos para Kotatsu
        const result = foundData.map(m => ({
            name: m.name || m.title || "Sin título",
            slug: m.slug || "",
            cover: m.cover?.startsWith('http') ? m.cover : `https://dashboard.olympusbiblioteca.com/storage/covers/${m.cover}`
        })).filter(m => m.slug !== "");

        res.json({ data: result });

    } catch (err) {
        res.status(500).json({ data: [], error: err.message });
    }
});

// Endpoint para capítulos (Necesario para el siguiente paso)
app.get("/series/:slug", async (req, res) => {
    try {
        const { slug } = req.params;
        const response = await axios.get(`https://olympusbiblioteca.com/series/${slug}`, {
            headers: { 'User-Agent': UA }
        });
        const $ = cheerio.load(response.data);
        const script = $('script').filter((i, el) => $(el).html().includes('window.__NUXT__')).html();
        const jsonText = script.split('window.__NUXT__=')[1].split(';')[0];
        res.json(JSON.parse(jsonText));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.listen(PORT, () => console.log(`🚀 Puerto ${PORT}`));