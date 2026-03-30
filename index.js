const express = require("express");
const axios = require("axios");
const app = express();

// 🚨 REEMPLAZA ESTA URL si llegas a reiniciar ngrok y te da una nueva
const NGROK_URL = "https://rhinoplastic-humid-keri.ngrok-free.dev";

app.get("/series", async (req, res) => {
    try {
        console.log("✈️ Viajando al nodo residencial...");
        
        const response = await axios.get(`${NGROK_URL}/fetch-series`, {
            params: { page: req.query.page || 1 },
            headers: { 
                // ✅ VITAL: Esto salta el cartel de publicidad/advertencia de ngrok
                "ngrok-skip-browser-warning": "true",
                "Accept": "application/json"
            },
            timeout: 25000 
        });

        const d = response.data;
        
        // 🕵️ Buscador de datos inteligente (por si Olympus cambia la estructura)
        let raw = [];
        if (d.series?.data) raw = d.series.data;
        else if (d.data?.data) raw = d.data.data;
        else if (Array.isArray(d.data)) raw = d.data;
        else if (Array.isArray(d)) raw = d;
        else if (typeof d === 'object') {
            raw = Object.values(d).find(v => Array.isArray(v)) || [];
        }

        // Limpieza de datos para Kotatsu
        const clean = raw.map(m => ({
            name: m.name || m.title || "Manga",
            slug: m.slug,
            cover: m.cover?.startsWith('http') ? m.cover : `https://dashboard.olympusbiblioteca.com/storage/covers/${m.cover}`
        })).filter(m => m.slug);

        console.log(`✅ Enviando ${clean.length} mangas a Kotatsu`);
        res.json({ data: clean });

    } catch (err) {
        console.error("❌ Error en Gateway:", err.message);
        res.status(502).json({ 
            error: "Nodo residencial no disponible", 
            details: err.message 
        });
    }
});

app.get("/", (req, res) => res.send("🏛️ Gateway del Imperio: ONLINE"));

const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Servidor Render listo en puerto ${PORT}`);
});
