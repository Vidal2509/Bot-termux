import Jimp from 'jimp'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'

const execPromise = promisify(exec)

const handler = async (m, { conn, text }) => {
  try {
    const buffer = await m.download()
    if (!buffer) return m.reply('📸 Responde a una imagen')

    const foto = await Jimp.read(buffer)
    foto.cover(512, 512)

    if (text) {
      const fontWhite = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE)
      const fontBlack = await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK)
      const y = 380
      for (let i = -2; i <= 2; i++) {
        for (let j = -2; j <= 2; j++) {
          foto.print(fontBlack, i, y + j, { text, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER }, 512)
        }
      }
      foto.print(fontWhite, 0, y, { text, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER }, 512)
    }

    const tempPNG = `./${Date.now()}.png`
    const tempWebP = `./${Date.now()}.webp`
    
    await foto.writeAsync(tempPNG)

    // Esta línea es la magia: convierte PNG a Sticker WebP real
    await execPromise(`ffmpeg -i ${tempPNG} -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -vcodec libwebp -lossless 1 -loop 0 -preset default -an -vsync 0 ${tempWebP}`)

    const stickerBuffer = fs.readFileSync(tempWebP)

    await conn.sendMessage(m.chat, { 
      sticker: stickerBuffer 
    }, { quoted: m })

    // Limpiamos los archivos temporales
    if (fs.existsSync(tempPNG)) fs.unlinkSync(tempPNG)
    if (fs.existsSync(tempWebP)) fs.unlinkSync(tempWebP)

  } catch (e) {
    console.error(e)
    m.reply('❌ Hubo un fallo al convertir el sticker.')
  }
}

handler.command = /^s$/i
export default handler