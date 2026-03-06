import fetch from 'node-fetch'
import * as cheerio from 'cheerio'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'

const execPromise = promisify(exec)
const usados = new Map()

let handler = async (m, { conn, text, command }) => {
    // Definimos si es GIF basado estrictamente en el comando o si el usuario escribió "gif"
    const esGif = command.toLowerCase() === 'gif' || (text && text.toLowerCase().includes('gif'))
    
    if (!text) return conn.sendMessage(m.chat, { text: `🔎 *¿Qué buscas?*\nEjemplo: .${command} anime` }, { quoted: m })

    try {
        const filter = esGif ? '+filterui:photo-animatedgif' : '+filterui:imagesize-large'
        const url = `https://www.bing.com/images/search?q=${encodeURIComponent(text)}&qft=${filter}&first=1`

        const res = await fetch(url, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36" }
        })

        const html = await res.text()
        const $ = cheerio.load(html)
        let imagenes = []

        $('a.iusc').each((i, el) => {
            try {
                const mData = JSON.parse($(el).attr('m'))
                if (mData.murl) imagenes.push(mData.murl)
            } catch {}
        })

        if (imagenes.length === 0) throw 'Sin resultados'
        const seleccionada = imagenes[Math.floor(Math.random() * imagenes.length)]

        if (esGif) {
            // --- LÓGICA PARA GIF (CONVERSIÓN) ---
            const tempGif = `./${Date.now()}.gif`
            const tempMp4 = `./${Date.now()}.mp4`

            const response = await fetch(seleccionada)
            const arrayBuffer = await response.arrayBuffer()
            fs.writeFileSync(tempGif, Buffer.from(arrayBuffer))

            // Conversión forzada a MP4 para que WhatsApp no dé error
            await execPromise(`ffmpeg -i ${tempGif} -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" ${tempMp4}`)

            const videoBuffer = fs.readFileSync(tempMp4)
            await conn.sendMessage(m.chat, { video: videoBuffer, caption: `🎬 *GIF:* ${text}`, gifPlayback: true }, { quoted: m })

            if (fs.existsSync(tempGif)) fs.unlinkSync(tempGif)
            if (fs.existsSync(tempMp4)) fs.unlinkSync(tempMp4)
        } else {
            // --- LÓGICA PARA IMAGEN (DIRECTO) ---
            // Aquí mandamos la URL directo, mucho más rápido y sin errores de video
            await conn.sendMessage(m.chat, { 
                image: { url: seleccionada }, 
                caption: `🖼️ *Resultado:* ${text}` 
            }, { quoted: m })
        }

    } catch (e) {
        console.error(e)
        await conn.sendMessage(m.chat, { text: '❌ No se pudo cargar el archivo. Intenta de nuevo.' }, { quoted: m })
    }
}

handler.command = /^(pin|pinterest|img|image|foto|gif)$/i
export default handler