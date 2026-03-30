const express = require("express");
const puppeteer = require("puppeteer");
const app = express();

const PORT = process.env.PORT || 10000;

app.get("/", (req, res) => res.send("🔥 Imperio Proxy: Modo Navegador Activo"));

app.get("/series", async (req, res) => {
    let browser = null;
    try {
        // Lanzamos un navegador minimalista
        browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: "new"
        });
        
        const page = await browser.newPage();
        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");

        // Vamos a la biblioteca y esperamos a que el JS haga su magia
        await page.goto("https://olympusbiblioteca.com/biblioteca", {
            waitUntil: "networkidle2",
            timeout: 60000
        });

        // Extraemos los datos directamente de la memoria del navegador (Vue/Nuxt)
        const mangas = await page.evaluate(() => {
            // Buscamos en el estado interno de Nuxt que aún vive en RAM
            const nuxt = window.__NUXT__ || window.__NUXT_DATA__;
            if (!nuxt) return [];

            // Buscador universal de objetos con slug y name dentro del JSON de Nuxt
            const results = [];
            const search = (obj) => {
                if (obj && typeof obj === 'object') {
                    if (obj.slug && (obj.name || obj.title)) {
                        results.push({
                            name: obj.name || obj.title,
                            slug: obj.slug,
                            cover: obj.cover || ""
                        });
                    }
                    Object.values(obj).forEach(search);
                }
            };
            search(nuxt);
            return results;
        });

        // Limpiamos duplicados y formateamos covers
        const cleanData = Array.from(new Set(mangas.map(m => m.slug)))
            .map(slug => {
                const m = mangas.find(x => x.slug === slug);
                return {
                    name: m.name,
                    slug: m.slug,
                    cover: m.cover.startsWith('http') ? m.cover : `https://dashboard.olympusbiblioteca.com/storage/covers/${m.cover}`
                };
            });

        res.json({ data: cleanData });

    } catch (err) {
        res.status(500).json({ data: [], error: err.message });
    } finally {
        if (browser) await browser.close(); // Cerramos para no agotar la RAM de Render
    }
});

app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Norte con Puppeteer en puerto ${PORT}`));
