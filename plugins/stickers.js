import Jimp from 'jimp'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'

const execPromise = promisify(exec)

const handler = async (m, { conn, text }) => {
  try {
    const q = m.quoted ? m.quoted : m
    const buffer = await q.download()
    if (!buffer) return conn.sendMessage(m.chat, { text: '📸 Responde a una imagen' }, { quoted: m })

    const foto = await Jimp.read(buffer)
    // Mantiene la imagen completa sin recortes feos
    foto.contain(512, 512, Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE)

    if (text) {
      // Cargamos fuente 64 (Siempre Grande)
      const fontWhite = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE)
      const fontBlack = await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK)

      const maxWidth = 460
      const x = 26
      
      // Calculamos cuánto mide el bloque de texto en total
      const textHeight = Jimp.measureTextHeight(fontWhite, text, maxWidth)
      
      // Posición dinámica: El texto se apoya en el fondo (490) y crece hacia arriba
      let yPos = 490 - textHeight

      // Evitamos que el texto se salga por arriba si es demasiado largo
      if (yPos < 10) yPos = 10

      // Dibujar contorno negro (Grosor 2 para fuente 64)
      for (let i = -2; i <= 2; i++) {
        for (let j = -2; j <= 2; j++) {
          foto.print(fontBlack, x + i, yPos + j, {
            text: text,
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
          }, maxWidth)
        }
      }
      
      // Dibujar texto blanco principal
      foto.print(fontWhite, x, yPos, {
        text: text,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
      }, maxWidth)
    }

    const tempPNG = `./${Date.now()}.png`
    const tempWebP = `./${Date.now()}.webp`
    await foto.writeAsync(tempPNG)

    // Conversión optimizada
    await execPromise(`ffmpeg -i ${tempPNG} -vcodec libwebp -lossless 1 -loop 0 -preset default -an -vsync 0 -s 512:512 ${tempWebP}`)

    const stickerBuffer = fs.readFileSync(tempWebP)
    await conn.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: m })

    if (fs.existsSync(tempPNG)) fs.unlinkSync(tempPNG)
    if (fs.existsSync(tempWebP)) fs.unlinkSync(tempWebP)

  } catch (e) {
    console.error(e)
    conn.sendMessage(m.chat, { text: '❌ Hubo un fallo al crear el sticker.' }, { quoted: m })
  }
}

handler.command = /^s$/i
export default handler