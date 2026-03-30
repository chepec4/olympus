const express = require("express");
const axios = require("axios");
const app = express();

const PORT = process.env.PORT || 10000;
const SITE = "https://olympusbiblioteca.com";
// Cambiamos a la URL de búsqueda interna, que suele estar más abierta
const SEARCH_API = "https://dashboard.olympusbiblioteca.com/api/search";

let session = { cookies: "", xsrf: "", last: 0 };

async function refreshSession() {
    try {
        const res = await axios.get(SITE, {
            headers: { 
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            }
        });
        const setCookies = res.headers["set-cookie"] || [];
        session.cookies = setCookies.map(c => c.split(";")[0]).join("; ");
        const match = session.cookies.match(/XSRF-TOKEN=([^;]+)/);
        session.xsrf = match ? decodeURIComponent(match[1]) : "";
        session.last = Date.now();
        console.log("✅ Sesión Refrescada");
    } catch (e) { console.error("Error sesión:", e.message); }
}

app.get("/series", async (req, res) => {
    try {
        if (!session.xsrf || Date.now() - session.last > 10 * 60 * 1000) await refreshSession();

        // 🚀 Usamos el endpoint de SEARCH sin query para que nos de las novedades
        // Este endpoint es el que usa la barra de búsqueda y es más difícil de bloquear
        const response = await axios.post(SEARCH_API, {
            "type": "comic",
            "search": "" 
        }, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "Accept": "application/json",
                "X-XSRF-TOKEN": session.xsrf,
                "Cookie": session.cookies,
                "Referer": `${SITE}/biblioteca`,
                "X-Requested-With": "XMLHttpRequest"
            }
        });

        // 🕵️ Normalizador de emergencia
        let raw = response.data.data || response.data.series?.data || response.data || [];
        
        // Si sigue viniendo vacío, intentamos el endpoint de "novedades"
        if (raw.length === 0) {
            const alt = await axios.get("https://dashboard.olympusbiblioteca.com/api/series?type=comic&direction=desc", {
                headers: { "X-XSRF-TOKEN": session.xsrf, "Cookie": session.cookies, "User-Agent": "Mozilla/5.0" }
            });
            raw = alt.data.series?.data || alt.data.data || [];
        }

        const clean = raw.map(m => ({
            name: m.name || m.title,
            slug: m.slug,
            cover: m.cover?.startsWith('http') ? m.cover : `https://dashboard.olympusbiblioteca.com/storage/covers/${m.cover}`
        })).filter(m => m.slug);

        res.json({ data: clean });

    } catch (err) {
        res.status(500).json({ data: [], error: err.message, log: "Intenta limpiar cookies en Kotatsu" });
    }
});

app.get("/", (req, res) => res.send("🏛️ Imperio Proxy v3: Online"));
app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Puerto ${PORT}`));
