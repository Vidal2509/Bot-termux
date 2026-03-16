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
        // Si es un link, armamos el objeto vid manualmente
        vid = { 
            url: isUrl[0], 
            title: 'Audio de YouTube', 
            seconds: 0 // Omitimos el check de tiempo para links o puedes usar otra librería
        };
    } else {
        // Si no es link, buscamos normalmente
        const search = await yts(text);
        vid = search.videos[0];
    }

    if (!vid) return m.reply("❌ No se encontró el video");

    // 2. Preparar archivos
    if (!fs.existsSync('./tmp')) fs.mkdirSync('./tmp')
    const fileName = `./tmp/${Date.now()}.mp3`

    // 3. Lógica de comando para Termux/Windows
    // Usamos --no-check-certificate para evitar errores de fecha en Termux
    const ytDlp = os.platform() === "win32" ? "python -m yt_dlp" : "yt-dlp"
    const comando = `${ytDlp} --no-check-certificate -x --audio-format mp3 --audio-quality 0 -o "${fileName}" ${vid.url}`

    exec(comando, async (err, stdout, stderr) => {
      if (err) {
        console.error("Error de yt-dlp:", stderr)
        return m.reply("❌ Error al procesar el audio. Asegúrate de tener ffmpeg instalado.")
      }

      if (!fs.existsSync(fileName)) {
          return m.reply("❌ El archivo no se generó correctamente.")
      }

      // 4. Enviar el audio
      await conn.sendMessage(m.chat, {
        audio: fs.readFileSync(fileName),
        mimetype: 'audio/mpeg',
        fileName: `${vid.title}.mp3`
      }, { quoted: m })

      // 5. Limpiar archivo temporal
      try {
          fs.unlinkSync(fileName)
      } catch (e) {
          console.log("Error al borrar temporal:", e)
      }
    })

  } catch (e) {
    console.error("Error General:", e)
    m.reply("❌ Hubo un fallo en el servidor de búsqueda.")
  }
}

handler.command = /^(play|mp3|audio)$/i
export default handler