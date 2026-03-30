const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const app = express();

const PORT = process.env.PORT || 3000;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

app.get("/", (req, res) => res.send("🔥 Imperio Proxy: Conexión Estable"));

app.get("/series", async (req, res) => {
    try {
        const response = await axios.get("https://olympusbiblioteca.com/series", {
            headers: { "User-Agent": UA }
        });

        const $ = cheerio.load(response.data);
        // Buscamos el script que contiene los datos de Nuxt
        const script = $("script").filter((i, el) => $(el).html().includes("window.__NUXT__")).html();

        if (!script) return res.json({ data: [], error: "No se encontró el script de datos" });

        // Limpiamos el código para extraer solo el JSON
        const rawContent = script.split("window.__NUXT__=")[1].split(";")[0];
        
        // Usamos una técnica de búsqueda por texto porque Nuxt a veces no es JSON puro
        const mangas = [];
        // Buscamos patrones de: "name":"...","slug":"..."
        const regex = /"name":"([^"]+)","slug":"([^"]+)"/g;
        let match;

        while ((match = regex.exec(rawContent)) !== null) {
            const name = match[1];
            const slug = match[2];
            
            // Evitamos duplicados
            if (!mangas.find(m => m.slug === slug)) {
                mangas.add({
                    name: name,
                    slug: slug,
                    // Buscamos una imagen que coincida con el slug (opcional, si no, ponemos una por defecto)
                    cover: `https://dashboard.olympusbiblioteca.com/storage/covers/default.jpg`
                });
            }
        }

        // Si la regex no saca nada, intentamos parsear como JSON (Plan B)
        if (mangas.length === 0) {
            try {
                const data = JSON.parse(rawContent);
                // Aquí buscaríamos en la estructura si fuera necesario
            } catch (e) {}
        }

        res.json({ data: mangas });

    } catch (err) {
        res.status(500).json({ data: [], error: err.message });
    }
});

app.listen(PORT, () => console.log(`🚀 Norte Conquistado en puerto ${PORT}`));
