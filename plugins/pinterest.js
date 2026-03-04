import fetch from 'node-fetch'
import * as cheerio from 'cheerio'

const usados = new Map()

let handler = async (m, { conn, text, args }) => {
    // 1. Forma segura de obtener el texto sin usar .join()
    let q = text || (Array.isArray(args) ? args.join(' ') : args) || m.text?.split(' ').slice(1).join(' ')
    
    if (!q || q.length < 2) {
        return conn.sendMessage(m.chat, { 
            text: '📌 ¿Qué buscas?\nEjemplo: *.pin luffy*' 
        }, { quoted: m })
    }

    try {
        const query = encodeURIComponent(`site:pinterest.com ${q}`)
        const url = `https://www.bing.com/images/search?q=${query}&qft=+filterui:imagesize-large`

        const res = await fetch(url, {
            headers: { 
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36" 
            }
        })

        const html = await res.text()
        const $ = cheerio.load(html)
        let imagenes = []

        $('a.iusc').each((i, el) => {
            try {
                const data = JSON.parse($(el).attr('m'))
                if (data.murl) imagenes.push(data.murl)
            } catch {}
        })

        if (imagenes.length === 0) throw 'Sin resultados'

        // Lógica anti-repetición
        if (!usados.has(q)) usados.set(q, new Set())
        const historial = usados.get(q)
        let nuevas = imagenes.filter(img => !historial.has(img))
        
        if (nuevas.length === 0) {
            historial.clear()
            nuevas = imagenes
        }

        const seleccionada = nuevas[Math.floor(Math.random() * nuevas.length)]
        historial.add(seleccionada)

        await conn.sendMessage(m.chat, {
            image: { url: seleccionada },
            caption: `📍 *Pinterest:* ${q}`
        }, { quoted: m })

    } catch (e) {
        console.error(e)
        await conn.sendMessage(m.chat, { text: '❌ No encontré resultados.' }, { quoted: m })
    }
}

handler.command = /^(pin|pinterest)$/i
export default handler