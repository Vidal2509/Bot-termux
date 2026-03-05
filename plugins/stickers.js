import { Sticker, StickerTypes } from 'wa-sticker-formatter'
import Jimp from 'jimp'

const handler = async (m, { conn, text }) => {
  try {
    const buffer = await m.download();
    if (!buffer) return conn.sendMessage(m.chat, { text: '📸 Responde a una imagen con *.s*' }, { quoted: m });

    const foto = await Jimp.read(buffer);
    foto.cover(512, 512);

    if (text) {
      // Cargamos fuente blanca y negra
      const fontWhite = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
      const fontBlack = await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK);
      
      const yPosition = 400; // Posición inferior
      const containerWidth = 512;
      const texto = text.trim();

      // DIBUJAR CONTORNO NEGRO (Desplazamos el texto negro 2px en cada dirección)
      for (let x = -2; x <= 2; x++) {
        for (let y = -2; y <= 2; y++) {
          foto.print(fontBlack, x, yPosition + y, {
            text: texto,
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
          }, containerWidth);
        }
      }

      // DIBUJAR TEXTO BLANCO (Encima de lo negro)
      foto.print(fontWhite, 0, yPosition, {
        text: texto,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
      }, containerWidth);
    }

    const pngBuffer = await foto.getBufferAsync(Jimp.MIME_PNG);
    const stiker = new Sticker(pngBuffer, {
      pack: 'Bot de Vidal',
      author: '@Vidal',
      type: StickerTypes.FULL,
      quality: 75
    });

    const stickerBuffer = await stiker.toBuffer();
    await conn.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: m });

  } catch (e) {
    console.error(e);
    await conn.sendMessage(m.chat, { text: '❌ Error al procesar el sticker.' }, { quoted: m });
  }
}

handler.command = /^s$/i
export default handler