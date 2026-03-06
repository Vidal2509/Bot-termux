import Jimp from 'jimp'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'

const execPromise = promisify(exec)

const handler = async (m, { conn, text }) => {
  try {
    const buffer = await m.download()
    if (!buffer) return conn.sendMessage(m.chat, { text: '📸 Responde a una imagen o video/gif' }, { quoted: m })

    const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage || m.message
    const isVideo = !!(quoted.videoMessage || quoted.gifPlayback)
    const tempIn = `./${Date.now()}.${isVideo ? 'mp4' : 'png'}`
    const tempOut = `./${Date.now()}.webp`
    fs.writeFileSync(tempIn, buffer)

    if (!isVideo) {
      // --- PROCESO PARA IMÁGENES (CON CONTORNO NEGRO) ---
      const foto = await Jimp.read(tempIn)
      foto.contain(512, 512)

      if (text) {
        // Decidir tamaño de fuente según longitud del texto
        const fontPath = text.length > 30 ? Jimp.FONT_SANS_32_WHITE : Jimp.FONT_SANS_64_WHITE
        const fontPathBlack = text.length > 30 ? Jimp.FONT_SANS_32_BLACK : Jimp.FONT_SANS_64_BLACK
        
        const fontWhite = await Jimp.loadFont(fontPath)
        const fontBlack = await Jimp.loadFont(fontPathBlack)
        
        const maxWidth = 460
        const x = 26
        const textHeight = Jimp.measureTextHeight(fontWhite, text, maxWidth)
        let yPos = 490 - textHeight
        if (yPos < 10) yPos = 10

        // Dibujar CONTORNO NEGRO (Grosor 2)
        for (let i = -2; i <= 2; i++) {
          for (let j = -2; j <= 2; j++) {
            foto.print(fontBlack, x + i, yPos + j, { text, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER }, maxWidth)
          }
        }
        // Dibujar TEXTO BLANCO
        foto.print(fontWhite, x, yPos, { text, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER }, maxWidth)
      }
      await foto.writeAsync(tempIn)
      await execPromise(`ffmpeg -i ${tempIn} -vcodec libwebp -lossless 1 -loop 0 -preset default -an -vsync 0 -s 512:512 ${tempOut}`)
    } else {
      // --- PROCESO PARA VIDEOS/GIFS (FFMPEG) ---
      let fontSize = text && text.length > 30 ? 32 : 50
      let filter = `scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000`
      
      if (text) {
        const cleanText = text.replace(/[':;]/g, '')
        // borderw=3 y bordercolor=black simulan el contorno de Jimp
        filter += `,drawtext=text='${cleanText}':fontcolor=white:fontsize=${fontSize}:x=(w-text_w)/2:y=h-text_h-30:borderw=3:bordercolor=black`
      }
      await execPromise(`ffmpeg -t 6 -i ${tempIn} -vcodec libwebp -vf "${filter}" -lossless 1 -loop 0 -preset default -an -vsync 0 -s 512:512 ${tempOut}`)
    }

    await conn.sendMessage(m.chat, { sticker: fs.readFileSync(tempOut) }, { quoted: m })
    
    // Limpieza
    if (fs.existsSync(tempIn)) fs.unlinkSync(tempIn)
    if (fs.existsSync(tempOut)) fs.unlinkSync(tempOut)

  } catch (e) {
    console.error(e)
    conn.sendMessage(m.chat, { text: '❌ Error al crear sticker.' }, { quoted: m })
  }
}

handler.command = /^s$/i
export default handler