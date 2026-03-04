

import { Sticker, StickerTypes } from 'wa-sticker-formatter'
import { downloadContentFromMessage } from '@whiskeysockets/baileys'
import Jimp from 'jimp'

let handler = async (m, { conn, args }) => {
    try {
        let q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage || m.message
        let type = Object.keys(q || {})[0]
        if (!/image/i.test(type)) return

        let stream = await downloadContentFromMessage(q[type], type.replace('Message', ''))
        let buffer = Buffer.from([])
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])

        let textoMeme = args ? args.trim() : ''
        const foto = await Jimp.read(buffer)
        foto.cover(512, 512)

        if (textoMeme) {
            // LÓGICA DE TAMAÑO: Si el texto tiene más de 20 caracteres, usa fuente pequeña
            let fontW = await Jimp.loadFont(textoMeme.length > 20 ? Jimp.FONT_SANS_32_WHITE : Jimp.FONT_SANS_64_WHITE)
            let fontB = await Jimp.loadFont(textoMeme.length > 20 ? Jimp.FONT_SANS_32_BLACK : Jimp.FONT_SANS_64_BLACK)

            const x = 10
            const maxW = 492
            // Ajustar altura: si es fuente pequeña, lo subimos un poco para que quepan más líneas
            const y = textoMeme.length > 20 ? 380 : 400

            // CONTORNO NEGRITO REFORZADO
            for (let i = -2; i <= 2; i++) {
                for (let j = -2; j <= 2; j++) {
                    foto.print(fontB, x + i, y + j, {
                        text: textoMeme,
                        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
                        alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
                    }, maxW, 100) // 100 es la altura máxima permitida para el bloque de texto
                }
            }

            // TEXTO BLANCO
            foto.print(fontW, x, y, {
                text: textoMeme,
                alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
                alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
            }, maxW, 100)
        }

        const finalBuffer = await foto.getBufferAsync(Jimp.MIME_PNG)
        const sticker = new Sticker(finalBuffer, {
            pack: 'Bot de Vidal 🤖',
            author: '@Vidal',
            type: StickerTypes.FULL
        })

        await conn.sendMessage(m.chat, { sticker: await sticker.toBuffer() }, { quoted: m })

    } catch (e) {
        console.error(e)
    }
}

handler.command = /^(s|sticker|stiker)$/i
export default handler