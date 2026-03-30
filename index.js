const express = require("express");
const axios = require("axios");
const app = express();

// 🚨 TU URL DE NGROK ACTUALIZADA
const NGROK_URL = "https://rhinoplastic-humid-keri.ngrok-free.dev";

app.get("/series", async (req, res) => {
    try {
        // Le pedimos los datos a tu PC a través del túnel
        const response = await axios.get(`${NGROK_URL}/fetch-series?page=${req.query.page || 1}`, {
            // Ngrok a veces pide un header para saltar una advertencia de navegador
            headers: { "ngrok-skip-browser-warning": "69420" } 
        });
        
        let raw = response.data.series?.data || response.data.data || [];
        const clean = raw.map(m => ({
            name: m.name,
            slug: m.slug,
            cover: `https://dashboard.olympusbiblioteca.com/storage/covers/${m.cover}`
        }));

        res.json({ data: clean });
    } catch (err) {
        res.status(503).json({ 
            error: "El nodo residencial (tu PC) está desconectado",
            details: err.message 
        });
    }
});

app.get("/", (req, res) => res.send("🏛️ Gateway del Imperio: Online"));
app.listen(process.env.PORT || 10000, "0.0.0.0");
