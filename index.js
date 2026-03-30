const express = require("express");
const axios = require("axios");
const app = express();

const PORT = process.env.PORT || 10000;
const SITE = "https://olympusbiblioteca.com";
const API = "https://dashboard.olympusbiblioteca.com/api";

let session = { cookies: "", xsrf: "", last: 0 };

async function refreshSession() {
    try {
        const res = await axios.get(SITE, {
            headers: { 
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8"
            }
        });
        const setCookies = res.headers["set-cookie"] || [];
        session.cookies = setCookies.map(c => c.split(";")[0]).join("; ");
        const match = session.cookies.match(/XSRF-TOKEN=([^;]+)/);
        session.xsrf = match ? decodeURIComponent(match[1]) : "";
        session.last = Date.now();
        console.log("🔥 Sesión Renovada (Infiltración lista)");
    } catch (e) { console.error("❌ Error Sesión:", e.message); }
}

app.get("/series", async (req, res) => {
    try {
        if (!session.xsrf || Date.now() - session.last > 10 * 60 * 1000) await refreshSession();

        // 🚀 PETICIÓN OPTIMIZADA (Headers Humanos)
        const response = await axios.get(`${API}/series`, {
            params: { 
                // Probamos sin 'type' para traer TODO, o cambia a 'manga' si persiste
                page: req.query.page || 1,
                direction: "desc"
            },
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "Accept": "application/json, text/plain, */*",
                "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
                "X-XSRF-TOKEN": session.xsrf,
                "Cookie": session.cookies,
                "Referer": `${SITE}/biblioteca`,
                "Origin": SITE,
                "X-Requested-With": "XMLHttpRequest",
                "Sec-Fetch-Dest": "empty",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "same-site"
            }
        });

        // 🕵️ DEBUG LOG (Para ver en los logs de Render si viene algo)
        console.log("🔍 Respuesta API (primeros 100 chars):", JSON.stringify(response.data).substring(0, 100));

        let raw = [];
        const d = response.data;
        
        // Mapeo dinámico de estructura
        if (d.series?.data) raw = d.series.data;
        else if (d.data?.data) raw = d.data.data;
        else if (Array.isArray(d.data)) raw = d.data;
        else if (Array.isArray(d)) raw = d;
        else raw = Object.values(d).find(v => Array.isArray(v)) || [];

        const clean = raw.map(m => ({
            name: m.name || m.title || "Manga",
            slug: m.slug,
            cover: m.cover?.startsWith('http') ? m.cover : `https://dashboard.olympusbiblioteca.com/storage/covers/${m.cover}`
        })).filter(m => m.slug);

        res.json({ data: clean });

    } catch (err) {
        console.error("❌ Error en /series:", err.message);
        res.status(500).json({ data: [], error: err.message, status: err.response?.status });
    }
});

app.get("/", (req, res) => res.send("🏛️ Imperio Proxy: Online"));
app.listen(PORT, "0.0.0.0", () => console.log(`🚀 El Norte en puerto ${PORT}`));
