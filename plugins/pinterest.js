import fetch from 'node-fetch'
import * as cheerio from 'cheerio'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'

const execPromise = promisify(exec)

let handler = async (m, { conn, text, command }) => {
    const esGif = command.toLowerCase() === 'gif' || (text && text.toLowerCase().includes('gif'))
    
    if (!text) return conn.sendMessage(m.chat, { text: `🔎 *¿Qué buscas?*\nEjemplo: .${command} anime` }, { quoted: m })

    try {
        // --- CAMBIO A PINTEREST ---
        // Buscamos en Pinterest usando una búsqueda de Google optimizada para imágenes de Pinterest 
        // o directamente el buscador de Pinterest (este método es más estable)
        const url = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(text)}`

        const res = await fetch(url, {
            headers: { 
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36" 
            }
        })

        const html = await res.text()
        const $ = cheerio.load(html)
        let imagenes = []

        // Buscamos las etiquetas <img> dentro de Pinterest
        $('img').each((i, el) => {
            const src = $(el).attr('src')
            if (src && src.includes('736x')) { // '736x' es la versión de alta resolución en Pinterest
                imagenes.push(src)
            } else if (src && src.includes('originals')) {
                imagenes.push(src)
            }
        })

        if (imagenes.length === 0) throw 'Sin resultados en Pinterest'
        
        // Seleccionamos una imagen aleatoria de los resultados
        const seleccionada = imagenes[Math.floor(Math.random() * imagenes.length)]

        if (esGif) {
            const tempGif = `./${Date.now()}.gif`
            const tempMp4 = `./${Date.now()}.mp4`

            const response = await fetch(seleccionada)
            const arrayBuffer = await response.arrayBuffer()
            fs.writeFileSync(tempGif, Buffer.from(arrayBuffer))

            await execPromise(`ffmpeg -i ${tempGif} -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" ${tempMp4}`)

            const videoBuffer = fs.readFileSync(tempMp4)
            await conn.sendMessage(m.chat, { video: videoBuffer, caption: `🎬 *GIF:* ${text}`, gifPlayback: true }, { quoted: m })

            if (fs.existsSync(tempGif)) fs.unlinkSync(tempGif)
            if (fs.existsSync(tempMp4)) fs.unlinkSync(tempMp4)
        } else {
            await conn.sendMessage(m.chat, { 
                image: { url: seleccionada }, 
                caption: `📌 *Pinterest:* ${text}` 
            }, { quoted: m })
        }

    } catch (e) {
        console.error(e)
        // Si falla Pinterest, el bot puede intentar un respaldo (fallback) con tu código de Bing original
        await conn.sendMessage(m.chat, { text: '❌ No se encontraron imágenes. Intenta con palabras más simples.' }, { quoted: m })
    }
}

handler.command = /^(pin|pinterest|img|image|foto|gif)$/i
export default handler