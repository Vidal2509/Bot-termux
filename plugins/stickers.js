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
    
    // 1. SOLUCIÓN AL RECORTE: Usamos contain para que la imagen quepa completa
    // Agrega franjas transparentes a los lados o arriba según sea necesario
    foto.contain(512, 512, Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE)

    if (text) {
      // Usamos una fuente un poco más pequeña (32) para que quepa más texto
      const fontWhite = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE)
      const fontBlack = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK)
      
      // 2. SOLUCIÓN AL TEXTO: Definimos un ancho máximo (480px) para que haga salto de línea
      const maxWidth = 480
      const x = 16 
      const y = 350 // Ajusta este valor si quieres el texto más arriba o abajo

      // Dibujar contorno negro para legibilidad
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          foto.print(fontBlack, x + i, y + j, {
            text: text,
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
            alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
          }, maxWidth)
        }
      }
      // Dibujar texto blanco central
      foto.print(fontWhite, x, y, {
        text: text,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
      }, maxWidth)
    }

    const tempPNG = `./${Date.now()}.png`
    const tempWebP = `./${Date.now()}.webp`
    
    await foto.writeAsync(tempPNG)

    // Conversión limpia con FFmpeg
    await execPromise(`ffmpeg -i ${tempPNG} -vcodec libwebp -lossless 1 -loop 0 -preset default -an -vsync 0 -s 512:512 ${tempWebP}`)

    const stickerBuffer = fs.readFileSync(tempWebP)

    await conn.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: m })

    if (fs.existsSync(tempPNG)) fs.unlinkSync(tempPNG)
    if (fs.existsSync(tempWebP)) fs.unlinkSync(tempWebP)

  } catch (e) {
    console.error(e)
    conn.sendMessage(m.chat, { text: '❌ Hubo un fallo.' }, { quoted: m })
  }
}

handler.command = /^s$/i
export default handler