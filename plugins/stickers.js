import Jimp from 'jimp'
import pkg from 'ws-sticker-maker'
const { Sticker } = pkg

const handler = async (m, { conn, text }) => {
  try {
    const buffer = await m.download()
    if (!buffer) return conn.sendMessage(m.chat, { text: '📸 Responde a una imagen con *.s*' }, { quoted: m })

    const foto = await Jimp.read(buffer)
    foto.cover(512, 512)

    if (text) {
      const fontWhite = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE)
      const fontBlack = await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK)
      const y = 380

      for (let i = -2; i <= 2; i += 2) {
        for (let j = -2; j <= 2; j += 2) {
          foto.print(fontBlack, i, y + j, { text: text, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER }, 512)
        }
      }
      foto.print(fontWhite, 0, y, { text: text, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER }, 512)
    }

    const pngBuffer = await foto.getBufferAsync(Jimp.MIME_PNG)

    // Crear el sticker con la nueva importación
    const stiker = new Sticker(pngBuffer)
      .setPack('Bot de Vidal')
      .setAuthor('@Vidal')
      .setType('full')

    const result = await stiker.build()
    await conn.sendMessage(m.chat, { sticker: result }, { quoted: m })

  } catch (e) {
    console.error('ERROR EN STICKER:', e)
  }
}

handler.command = /^s$/i
export default handler