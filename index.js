const express = require("express");
const axios = require("axios");
const app = express();

// 🚨 TU URL DE NGROK ACTUAL (Mantenla actualizada si cambia)
const NGROK_URL = "https://rhinoplastic-humid-keri.ngrok-free.dev";

app.get("/series", async (req, res) => {
    try {
        console.log("✈️ Petición recibida. Conectando con el nodo residencial...");

        // Llamamos a tu PC a través del túnel
        const response = await axios.get(`${NGROK_URL}/fetch-series`, {
            params: { page: req.query.page || 1 },
            headers: { 
                // ✅ VITAL: Salta la página de advertencia de ngrok
                "ngrok-skip-browser-warning": "true",
                "Accept": "application/json"
            },
            timeout: 25000 // Tiempo de espera generoso para el túnel
        });

        // 📦 Como tu PC ya envía el ARRAY limpio [{}, {}]
        // Solo nos aseguramos de que sea un array antes de mapear
        const raw = Array.isArray(response.data) ? response.data : [];

        // Formateamos para Kotatsu
        const clean = raw.map(m => ({
            name: m.name || m.title || "Manga",
            slug: m.slug,
            // Construcción de la URL de la portada
            cover: m.cover || `https://dashboard.olympusbiblioteca.com/storage/comics/covers/${m.id}/420-lg.webp`
        })).filter(m => m.slug);

        console.log(`✅ Éxito: ${clean.length} mangas enviados a Kotatsu.`);
        
        // Formato final requerido por la mayoría de parsers de Kotatsu
        res.json({ data: clean });

    } catch (err) {
        console.error("❌ Error en Gateway:", err.message);
        res.status(502).json({ 
            data: [], 
            error: "El nodo residencial (tu PC) no respondió", 
            details: err.message 
        });
    }
});

// Ruta raíz para verificar que el servidor esté vivo
app.get("/", (req, res) => {
    res.send("🏛️ Gateway del Imperio: ONLINE. Apunta Kotatsu a /series");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Gateway de Render listo en el puerto ${PORT}`);
});
