import fetch from 'node-fetch'
import * as cheerio from 'cheerio'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execPromise = promisify(exec)
async function obtenerDuracion(videoPath) {

    try {

        const { stdout } = await execPromise(
            `ffprobe -v error -show_entries format=duration -of csv=p=0 "${videoPath}"`
        )

        const duracion = parseFloat(stdout)

        if (isNaN(duracion)) return 0

        return duracion

    } catch {
        return 0
    }
}

let handler = async (m, { conn, text, command }) => {

    const esGif =
        command.toLowerCase() === 'gif' ||
        text?.toLowerCase().includes('gif')

    if (!text) {
        return conn.sendMessage(
            m.chat,
            {
                text: `🔎 *¿Qué buscas?*\nEjemplo: .${command} anime`
            },
            { quoted: m }
        )
    }

    let tempGif = ''
    let tempMp4 = ''

    try {

        const filter = esGif
            ? '+filterui:photo-animatedgif'
            : '+filterui:imagesize-large'

        const url =
            `https://www.bing.com/images/search?q=${encodeURIComponent(text)}&qft=${filter}&first=1`

        const res = await fetch(url, {
            headers: {
                'User-Agent':
                    'Mozilla/5.0'
            }
        })

        const html = await res.text()

        const $ = cheerio.load(html)

        let imagenes = []

        $('a.iusc').each((i, el) => {
            try {
                const data = JSON.parse($(el).attr('m'))

                if (!data.murl) return

                const ext = data.murl.split('.').pop().toLowerCase()

                // Filtrar formatos basura
                if (
                    data.murl.includes('th?id=') ||
                    ext.includes('svg')
                ) return

                imagenes.push(data.murl)

            } catch {}
        })

        if (!imagenes.length) {
            throw new Error('Sin resultados')
        }

       let seleccionada = null

const mezcladas = imagenes.sort(() => Math.random() - 0.5)

for (const img of mezcladas.slice(0, 8)) {

    try {

        const tempTest = path.resolve(`./test_${Date.now()}.gif`)

        const response = await fetch(img)

        if (!response.ok) continue

        const buffer = Buffer.from(await response.arrayBuffer())

        // ignorar archivos muy pequeños
        if (buffer.length < 50000) continue

        fs.writeFileSync(tempTest, buffer)

        const duracion = await obtenerDuracion(tempTest)

        fs.unlinkSync(tempTest)

        // mínimo 1 segundo
        if (duracion >= 2) {
            seleccionada = img
            break
        }

    } catch (e) {
        console.log('GIF inválido:', e.message)
    }
}

// fallback si ninguno pasó
if (!seleccionada) {
    seleccionada = mezcladas[0]
}

        if (esGif) {

    const query = encodeURIComponent(text)

    const tenorUrl =
        `https://tenor.com/search/${query}-gifs`

    const res = await fetch(tenorUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0'
        }
    })

    const html = await res.text()

    // Buscar MP4 reales
    const matches = [
        ...html.matchAll(/https:\/\/media\.tenor\.com\/.*?\.mp4/g)
    ]

    if (!matches.length) {
        throw new Error('No se encontraron GIFs')
    }

    const gifs = [...new Set(matches.map(v => v[0]))]

    const seleccionado =
        gifs[Math.floor(Math.random() * gifs.length)]

    // DESCARGAR GIF
    const response = await fetch(seleccionado)

    if (!response.ok) {
        throw new Error('No se pudo descargar')
    }

    const buffer = Buffer.from(await response.arrayBuffer())

    // evitar archivos basura
    if (buffer.length < 100000) {
        throw new Error('GIF inválido')
    }

    const tempMp4 = `./gif_${Date.now()}.mp4`

    fs.writeFileSync(tempMp4, buffer)

    const videoBuffer = fs.readFileSync(tempMp4)

    // ENVIAR LOCALMENTE
    await conn.sendMessage(
        m.chat,
        {
            video: videoBuffer,
            gifPlayback: true,
            caption: `🎬 *GIF:* ${text}`
        },
        { quoted: m }
    )

    fs.unlinkSync(tempMp4)

} else {

    await conn.sendMessage(
        m.chat,
        {
            image: { url: seleccionada },
            caption: `🖼️ *Resultado:* ${text}`
        },
        { quoted: m }
    )
}

    } catch (e) {

        console.error(e)

        await conn.sendMessage(
            m.chat,
            {
                text: '❌ No se pudo cargar el archivo.'
            },
            { quoted: m }
        )

    } finally {

        try {
            if (tempGif && fs.existsSync(tempGif))
                fs.unlinkSync(tempGif)

            if (tempMp4 && fs.existsSync(tempMp4))
                fs.unlinkSync(tempMp4)

        } catch {}
    }
}

handler.command = /^(pin|pinterest|img|image|foto|gif)$/i

export default handler