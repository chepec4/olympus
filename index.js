const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const app = express();

// Render usa el puerto 10000 por defecto
const PORT = process.env.PORT || 10000;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

app.get("/", (req, res) => res.send("🔥 Imperio Proxy: El Norte está cerca"));

app.get("/series", async (req, res) => {
    try {
        const response = await axios.get("https://olympusbiblioteca.com/series", {
            headers: { "User-Agent": UA }
        });

        const $ = cheerio.load(response.data);
        const script = $("script").filter((i, el) => $(el).html().includes("window.__NUXT__")).html();

        if (!script) return res.json({ data: [], error: "No se encontró el script de datos" });

        const rawContent = script.split("window.__NUXT__=")[1].split(";")[0];
        
        const mangas = [];
        // Regex mejorada para capturar nombre y slug
        const regex = /"name":"([^"]+)","slug":"([^"]+)"/g;
        let match;

        while ((match = regex.exec(rawContent)) !== null) {
            const name = match[1];
            const slug = match[2];
            
            if (!mangas.find(m => m.slug === slug)) {
                // ✅ CORREGIDO: Usamos .push() en lugar de .add()
                mangas.push({
                    name: name,
                    slug: slug,
                    cover: `https://dashboard.olympusbiblioteca.com/storage/covers/default.jpg`
                });
            }
        }

        res.json({ data: mangas });

    } catch (err) {
        res.status(500).json({ data: [], error: err.message });
    }
});

// ✅ CORREGIDO: Escuchamos en 0.0.0.0 para que Render nos encuentre
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Norte Conquistado en puerto ${PORT}`);
});
