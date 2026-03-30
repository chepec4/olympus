const express = require("express");
const axios = require("axios");
const app = express();

// 🚨 Asegúrate de que esta URL sea la de tu ngrok actual
const NGROK_URL = "https://rhinoplastic-humid-keri.ngrok-free.dev";

app.get("/series", async (req, res) => {
    try {
        console.log("✈️ Conectando con el nodo residencial...");
        const response = await axios.get(`${NGROK_URL}/fetch-series`, {
            params: { page: req.query.page || 1 },
            headers: { 
                "ngrok-skip-browser-warning": "true",
                "Accept": "application/json"
            },
            timeout: 25000 
        });

        // Tu PC ya envía el array limpio [{}, {}]
        res.json(response.data);
    } catch (err) {
        console.error("❌ Error en Gateway:", err.message);
        res.status(502).json([]);
    }
});

app.get("/details/:slug", async (req, res) => {
    try {
        const response = await axios.get(`${NGROK_URL}/fetch-details/${req.params.slug}`, {
            headers: { "ngrok-skip-browser-warning": "true" }
        });
        res.json(response.data);
    } catch (err) {
        res.status(502).json({ error: "No se pudieron obtener detalles" });
    }
});

app.get("/", (req, res) => res.send("🏛️ Gateway Online"));

const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Servidor listo en puerto ${PORT}`);
});
