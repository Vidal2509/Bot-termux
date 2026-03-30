import yts from 'yt-search'
import { exec } from 'child_process'
import fs from 'fs'
import os from 'os'

const handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) return m.reply(`⚠️ Escribe el nombre de una canción o pega un link.\n\nEjemplo:\n${usedPrefix + command} Believer`)

  try {
    let vid;
    const isUrl = text.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);

    if (isUrl) {
        vid = { 
            url: isUrl[0], 
            title: 'Audio de YouTube', 
            seconds: 0 
        };
    } else {
        const search = await yts(text);
        vid = search.videos[0];
    }

    if (!vid) return m.reply("❌ No se encontró el video");

    // 2. Preparar carpeta temporal
    if (!fs.existsSync('./tmp')) fs.mkdirSync('./tmp')
    const fileName = `./tmp/${Date.now()}.mp3`

    // 3. Configuración de comando
    const ytDlp = os.platform() === "win32" ? "python -m yt_dlp" : "yt-dlp"
    const comando = `${ytDlp} --no-check-certificate -x --audio-format mp3 --audio-quality 0 -o "${fileName}" ${vid.url}`

    // Informar que se está procesando
    await m.reply(`⏳ Procesando audio: *${vid.title}*...`)

    exec(comando, async (err, stdout, stderr) => {
      if (err) {
        console.error("Error de yt-dlp:", stderr)
        return m.reply("❌ Error al procesar el audio. Verifica que yt-dlp y ffmpeg funcionen en tu Termux.")
      }

      if (!fs.existsSync(fileName)) {
          return m.reply("❌ El archivo no se generó correctamente.")
      }

      // 4. ENVIAR EL AUDIO CON PROTECCIÓN DE SUBIDA
      try {
          await conn.sendMessage(m.chat, {
            audio: { url: fileName }, // Pasamos la ruta, es más ligero para la RAM que leer el buffer
            mimetype: 'audio/mpeg',
            fileName: `${vid.title}.mp3`
          }, { quoted: m })
      } catch (err) {
          console.error("Error al subir media a WhatsApp:", err)
          m.reply("❌ WhatsApp rechazó el archivo. Esto ocurre a veces por la conexión de Termux. Intenta de nuevo.")
      }

      // 5. Limpiar archivo temporal (con pequeño retraso para asegurar que se envió)
      setTimeout(() => {
          try {
              if (fs.existsSync(fileName)) fs.unlinkSync(fileName)
          } catch (e) {
              console.log("Error al borrar temporal:", e)
          }
      }, 5000)
    })

  } catch (e) {
    console.error("Error General:", e)
    m.reply("❌ Hubo un fallo en el servidor de búsqueda.")
  }
}

handler.command = /^(play|mp3|audio)$/i
export default handler