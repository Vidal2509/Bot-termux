import fetch from 'node-fetch'
import https from 'https'

const handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!args[0]) return conn.sendMessage(m.chat, { text: `@ Ingresa un enlace de TikTok o YouTube Shorts.` }, { quoted: m })

  try {
    const url = args[0]
    const agent = new https.Agent({ rejectUnauthorized: false })
    let videoUrl = null

    // --- INTENTO 1: API TIKWM (Muy estable para TikTok) ---
    try {
      const res1 = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`, { agent })
      const json1 = await res1.json()
      videoUrl = json1.data?.play || json1.data?.hdplay
    } catch (e) { console.log('Error API 1') }

    // --- INTENTO 2: API VREDEN (Respaldo All-in-One) ---
    if (!videoUrl) {
      try {
        const res2 = await fetch(`https://api.vreden.my.id/api/download/allinone?url=${encodeURIComponent(url)}`, { agent })
        const json2 = await res2.json()
        videoUrl = json2.result?.downloadUrl || json2.result?.video
      } catch (e) { console.log('Error API 2') }
    }

    // --- INTENTO 3: API AGATZ ---
    if (!videoUrl) {
      try {
        const res3 = await fetch(`https://api.agatz.xyz/api/asdl?url=${encodeURIComponent(url)}`, { agent })
        const json3 = await res3.json()
        videoUrl = json3.data?.url || json3.data?.video
      } catch (e) { console.log('Error API 3') }
    }

    if (!videoUrl) throw 'No se pudo obtener el video de ninguna fuente.'

    await conn.sendMessage(m.chat, { 
      video: { url: videoUrl }, 
      caption: '✅ Descargado correctamente\n@ Bot ',
      mimetype: 'video/mp4'
    }, { quoted: m })

  } catch (e) {
    console.error('Error final:', e)
    conn.sendMessage(m.chat, { text: '❌ Error: Los servidores de descarga no responden. Intenta con otro link.' }, { quoted: m })
  }
}

handler.command = /^(video|descargar|dl)$/i
export default handler