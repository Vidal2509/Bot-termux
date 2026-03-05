import Jimp from 'jimp'

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

      // Contorno negro
      for (let i = -2; i <= 2; i++) {
        for (let j = -2; j <= 2; j++) {
          foto.print(fontBlack, i, y + j, { text: text, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER }, 512)
        }
      }
      // Texto blanco
      foto.print(fontWhite, 0, y, { text: text, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER }, 512)
    }

    // Obtenemos el buffer en PNG (WhatsApp lo convierte automáticamente a sticker si lo mandas como tal)
    const result = await foto.getBufferAsync(Jimp.MIME_PNG)

    await conn.sendMessage(m.chat, { 
      sticker: result,
      packname: 'Bot de Vidal',
      author: '@Vidal'
    }, { quoted: m })

  } catch (e) {
    console.error('ERROR EN STICKER:', e)
    m.reply('❌ Error al procesar la imagen.')
  }
}

handler.command = /^s$/i
export default handler