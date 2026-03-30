const express = require("express");
const axios = require("axios");
const app = express();

const PORT = process.env.PORT || 10000;

// 🌐 Lista de dominios espejo para saltar bloqueos de IP
const DOMAINS = [
    "https://olympusbiblioteca.com",
    "https://olympusscanlation.com",
    "https://olympuslectura.com"
];

let currentConfig = { site: DOMAINS[0], cookies: "", xsrf: "", last: 0 };

async function refreshSession() {
    for (const domain of DOMAINS) {
        try {
            console.log(`🔑 Intentando sesión en: ${domain}`);
            const res = await axios.get(domain, {
                headers: { 
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                    "Accept-Language": "es-ES,es;q=0.9"
                },
                timeout: 10000
            });
            
            const setCookies = res.headers["set-cookie"] || [];
            currentConfig.cookies = setCookies.map(c => c.split(";")[0]).join("; ");
            const match = currentConfig.cookies.match(/XSRF-TOKEN=([^;]+)/);
            currentConfig.xsrf = match ? decodeURIComponent(match[1]) : "";
            currentConfig.site = domain;
            currentConfig.last = Date.now();
            
            if (currentConfig.xsrf) {
                console.log(`✅ Sesión lista en ${domain}`);
                return true;
            }
        } catch (e) {
            console.error(`❌ Falló ${domain}: ${e.message}`);
        }
    }
    return false;
}

app.get("/series", async (req, res) => {
    try {
        if (!currentConfig.xsrf || Date.now() - currentConfig.last > 10 * 60 * 1000) {
            await refreshSession();
        }

        const dashboard = currentConfig.site.replace("https://", "https://dashboard.");
        
        const response = await axios.get(`${dashboard}/api/series`, {
            params: { 
                page: req.query.page || 1, 
                direction: "desc" 
                // Omitimos 'type' para evitar el filtro restrictivo
            },
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "Accept": "application/json, text/plain, */*",
                "Accept-Language": "es-ES,es;q=0.9",
                "X-XSRF-TOKEN": currentConfig.xsrf,
                "Cookie": currentConfig.cookies,
                "Referer": `${currentConfig.site}/biblioteca`,
                "Origin": currentConfig.site,
                "X-Requested-With": "XMLHttpRequest",
                "Sec-Fetch-Dest": "empty",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "same-site"
            }
        });

        // 🕵️ Normalización Dinámica (Buscador Universal)
        let raw = [];
        const data = response.data;
        if (data.series?.data) raw = data.series.data;
        else if (data.data?.data) raw = data.data.data;
        else if (Array.isArray(data.data)) raw = data.data;
        else if (Array.isArray(data)) raw = data;
        else raw = Object.values(data).find(v => Array.isArray(v)) || [];

        const clean = raw.map(m => ({
            name: m.name || m.title || "Manga",
            slug: m.slug,
            cover: m.cover?.startsWith('http') ? m.cover : `${dashboard}/storage/covers/${m.cover}`
        })).filter(m => m.slug);

        // Si el resultado es vacío, forzamos un refresh para la próxima
        if (clean.length === 0) currentConfig.xsrf = "";

        res.json({ data: clean, info: { source: currentConfig.site } });

    } catch (err) {
        res.status(500).json({ data: [], error: err.message });
    }
});

app.get("/", (req, res) => res.send("🏛️ Imperio Proxy Híbrido: Online"));
app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Norte en puerto ${PORT}`));
