const express = require("express");
const axios = require("axios");
const app = express();

const PORT = process.env.PORT || 3000;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

app.get("/", (req, res) => res.send("🔥 Servidor de Debug Operativo"));

app.get("/series", async (req, res) => {
    try {
        const response = await axios.get("https://olympusbiblioteca.com/series", {
            headers: { 
                "User-Agent": UA,
                "Accept": "text/html",
                "Referer": "https://olympusbiblioteca.com/"
            }
        });

        // 🔍 RADIOGRAFÍA: Enviamos el HTML puro que recibe el servidor
        res.header("Content-Type", "text/html");
        res.send(`
            ${response.data}
        `);

    } catch (err) {
        res.status(500).send(`
            <h1>❌ ERROR DE CONEXIÓN</h1>
            <p>Mensaje: ${err.message}</p>
            <pre>${err.response ? err.response.data : "Sin respuesta del servidor"}</pre>
        `);
    }
});

app.listen(PORT, () => console.log(`🚀 Debug en puerto ${PORT}`));
