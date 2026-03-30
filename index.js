const express = require("express");
const axios = require("axios");
const app = express();

// 🚨 ACTUALIZA ESTO SI TU NGROK CAMBIA
const NGROK_URL = "https://rhinoplastic-humid-keri.ngrok-free.dev";

// Puente para la lista
app.get("/series", async (req, res) => {
    try {
        const r = await axios.get(`${NGROK_URL}/fetch-series`, {
            params: { page: req.query.page || 1 },
            headers: { "ngrok-skip-browser-warning": "true" }
        });
        res.json(r.data);
    } catch (e) { res.json([]); }
});

// Puente para detalles
app.get("/details/:slug", async (req, res) => {
    try {
        const r = await axios.get(`${NGROK_URL}/fetch-details/${req.params.slug}`, {
            headers: { "ngrok-skip-browser-warning": "true" }
        });
        res.json(r.data);
    } catch (e) { res.status(502).json({ error: "PC offline" }); }
});

// Puente para páginas
app.get("/pages/:serieId/:capId", async (req, res) => {
    try {
        const r = await axios.get(`${NGROK_URL}/fetch-pages/${req.params.serieId}/${req.params.capId}`, {
            headers: { "ngrok-skip-browser-warning": "true" }
        });
        res.json(r.data);
    } catch (e) { res.status(502).json({ error: "PC offline" }); }
});

app.get("/", (req, res) => res.send("🏛️ GATEWAY OLYMPUS ONLINE"));

const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => console.log(`🚀 RENDER ONLINE EN PUERTO ${PORT}`));
