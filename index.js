const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const app = express();

const PORT = process.env.PORT || 3000;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// ✅ 1. RUTA DE SALUD (Para que no salga "Cannot GET /")
app.get("/", (req, res) => {
    res.send("🔥 Imperio Proxy Olympus: El servidor está vivo y operando.");
});

// ✅ 2. RUTA DE TEST (Para confirmar que el JSON funciona)
app.get("/test", (req, res) => {
    res.json({ status: "ok", message: "Conexión con el proxy exitosa" });
});

// ⚡ 3. RUTA DEL NORTE (Scraping de Series)
app.get("/series", async (req, res) => {
    try {
        // Entramos a la web principal (Nuxt) en lugar de la API
        const response = await axios.get('https://olympusbiblioteca.com/series', {
            headers: { 'User-Agent': UA }
        });

        const $ = cheerio.load(response.data);
        
        // Extraemos el objeto __NUXT__ que es el "corazón" de los datos
        const script = $('script').filter((i, el) => $(el).html().includes('window.__NUXT__')).html();
        
        if (!script) {
            return res.status(500).json({ error: "Cloudflare bloqueó el acceso al HTML" });
        }

        // Limpieza y parseo del objeto Nuxt
        const jsonString = script.split('window.__NUXT__=')[1].split(';')[0];
        const nuxtData = JSON.parse(jsonString);

        // Buscador recursivo de la lista de mangas
        let rawData = [];
        const findSeries = (obj) => {
            if (Array.isArray(obj) && obj.length > 0 && (obj[0].slug || obj[0].name)) {
                rawData = obj;
                return;
            }
            if (obj && typeof obj === 'object') {
                for (let key in obj) findSeries(obj[key]);
            }
        };
        findSeries(nuxtData);

        // Normalización para Kotatsu
        const cleanData = rawData.map(m => ({
            name: m.name || m.title || "Manga sin nombre",
            slug: m.slug || "",
            cover: m.cover?.startsWith('http') ? m.cover : `https://dashboard.olympusbiblioteca.com/storage/covers/${m.cover}`
        })).filter(m => m.slug !== ""); // Filtramos basura

        res.json({ data: cleanData });

    } catch (err) {
        res.status(500).json({ 
            error: "Olympus bloqueó la conexión", 
            message: err.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`🔥 Imperio Proxy corriendo en el puerto ${PORT}`);
});