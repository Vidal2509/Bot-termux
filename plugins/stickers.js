import sharp from 'sharp'
import { downloadContentFromMessage } from '@whiskeysockets/baileys'

const handler = async (m, { conn, args }) => {
  try {
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage

    if (!quoted || !quoted.imageMessage) {
      return await conn.sendMessage(m.chat, {
        text: '❌ Responde a una imagen con *.s*'
      }, { quoted: m })
    }

    // 🔥 DESCARGA CORRECTA EN BAILEYS 7
    const stream = await downloadContentFromMessage(
      quoted.imageMessage,
      'image'
    )

    let buffer = Buffer.from([])
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk])
    }

    let image = sharp(buffer).resize(512, 512, { fit: 'cover' })

    // Si hay texto después del comando
    if (args && args.trim() !== '') {
      const text = args.trim()

      const svgText = `
      <svg width="512" height="512">
        <style>
          .title {
            fill: white;
            font-size: 60px;
            font-weight: bold;
            stroke: black;
            stroke-width: 5px;
            paint-order: stroke fill;
          }
        </style>
        <text x="50%" y="90%" text-anchor="middle" class="title">
          ${text}
        </text>
      </svg>`

      image = image.composite([
        { input: Buffer.from(svgText), top: 0, left: 0 }
      ])
    }

    const stickerBuffer = await image.webp().toBuffer()

    await conn.sendMessage(m.chat, {
      sticker: stickerBuffer
    }, { quoted: m })

  } catch (err) {
    console.error(err)
    await conn.sendMessage(m.chat, {
      text: '❌ Error al crear el sticker'
    }, { quoted: m })
  }
}

handler.command = /^s$/i

export default handler