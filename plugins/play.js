import fetch from 'node-fetch'
import https from 'https'

const handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!args[0]) return conn.sendMessage(m.chat, { text: `@ Ingresa el enlace de TikTok o YouTube.\n\n*Ejemplo:* ${usedPrefix + command} https://youtu.be/xxxx` }, { quoted: m })

  try {
    const url = args[0]
    const agent = new https.Agent({ rejectUnauthorized: false })
    let audioUrl = null

    // --- SI ES TIKTOK: USAMOS TIKWM (Directo y Rápido) ---
    if (url.includes('tiktok.com')) {
      const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`, { agent })
      const json = await res.json()
      audioUrl = json.data?.music || json.data?.music_info?.play
    } 

    // --- SI ES YOUTUBE O FALLÓ TIKTOK: USAMOS API DE RESPALDO ---
    if (!audioUrl) {
      const res2 = await fetch(`https://api.agatz.xyz/api/ytdl?url=${encodeURIComponent(url)}`, { agent })
      const json2 = await res2.json()
      // Buscamos el enlace que sea de audio/mp3
      audioUrl = json2.data?.data?.find(v => v.type === 'mp3')?.url || json2.data?.url
    }

    if (!audioUrl) throw 'No se pudo obtener el audio.'

    await conn.sendMessage(m.chat, { 
      audio: { url: audioUrl }, 
      mimetype: 'audio/mpeg',
      fileName: `audio.mp3`,
      ptt: false 
    }, { quoted: m })

  } catch (e) {
    console.error('Error en audio:', e)
    conn.sendMessage(m.chat, { text: '❌ No se pudo descargar el audio. Intenta con otro link.' }, { quoted: m })
  }
}

handler.command = /^(play|mp3|audio)$/i
export default handler