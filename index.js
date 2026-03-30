const express = require("express");
const axios = require("axios");
const app = express();

const NGROK_URL = "https://rhinoplastic-humid-keri.ngrok-free.dev";

app.get("/series", async (req, res) => {
    try {
        const response = await axios.get(`${NGROK_URL}/fetch-series`, {
            params: { page: req.query.page || 1 },
            headers: { "ngrok-skip-browser-warning": "true" }
        });

        // 🎯 EXTRACCIÓN SEGÚN TU CAPTURA:
        // La lista real está en: response.data.series.data
        const raw = response.data?.series?.data || [];

        const clean = raw.map(m => ({
            name: m.name || "Sin título",
            slug: m.slug,
            // Usamos la URL completa que ya viene en el JSON
            cover: m.cover || `https://dashboard.olympusbiblioteca.com/storage/comics/covers/${m.id}/420-lg.webp`
        })).filter(m => m.slug);

        res.json({ data: clean });
    } catch (err) {
        res.status(502).json({ error: "Nodo local no responde", details: err.message });
    }
});

app.get("/", (req, res) => res.send("🏛️ Gateway Online"));
app.listen(process.env.PORT || 10000, "0.0.0.0");
