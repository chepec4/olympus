const express = require("express");
const axios = require("axios");
const app = express();

const PORT = process.env.PORT || 10000;
const SITE = "https://olympusbiblioteca.com";
const API = "https://dashboard.olympusbiblioteca.com/api";

let session = { cookies: "", xsrf: "" };

// 🔥 FUNCIÓN DE INFILTRACIÓN (Warmup)
async function refreshSession() {
    try {
        const res = await axios.get(SITE, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" }
        });
        
        const setCookies = res.headers["set-cookie"] || [];
        session.cookies = setCookies.map(c => c.split(";")[0]).join("; ");
        
        // Extraer y DECODIFICAR el XSRF-TOKEN (Vital para Laravel)
        const tokenMatch = session.cookies.match(/XSRF-TOKEN=([^;]+)/);
        if (tokenMatch) {
            session.xsrf = decodeURIComponent(tokenMatch[1]);
        }
        console.log("✅ Sesión y Token XSRF actualizados");
    } catch (e) {
        console.error("❌ Error en Warmup:", e.message);
    }
}

// Middleware para asegurar que siempre haya sesión
app.use(async (req, res, next) => {
    if (!session.xsrf) await refreshSession();
    next();
});

app.get("/", (req, res) => res.send("🔥 Proxy Olympus Pro: Online"));

// 📚 LISTA DE SERIES
app.get("/series", async (req, res) => {
    try {
        const page = req.query.page || 1;
        const response = await axios.get(`${API}/series?type=comic&page=${page}&limit=20`, {
            headers: {
                "User-Agent": "Mozilla/5.0",
                "Accept": "application/json",
                "X-Requested-With": "XMLHttpRequest",
                "Referer": SITE,
                "X-XSRF-TOKEN": session.xsrf,
                "Cookie": session.cookies
            }
        });

        // Normalización para Kotatsu
        const raw = response.data.series?.data || response.data.data || [];
        const clean = raw.map(m => ({
            name: m.name,
            slug: m.slug,
            cover: m.cover?.startsWith('http') ? m.cover : `https://dashboard.olympusbiblioteca.com/storage/covers/${m.cover}`
        }));

        res.json({ data: clean });
    } catch (err) {
        if (err.response?.status === 419) await refreshSession(); // Auto-reparación
        res.status(500).json({ error: err.message, details: "Reintentando sesión..." });
    }
});

app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Proxy Pro en puerto ${PORT}`));
