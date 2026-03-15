import fs from 'fs';
import path from 'path';

const dataPath = './database/matrimonios.json';

const cargarLista = (nombreArchivo) => {
    const ruta = path.join(process.cwd(), nombreArchivo);
    if (!fs.existsSync(ruta)) return [];
    try {
        let contenido = fs.readFileSync(ruta, 'utf-8');
        contenido = contenido.replace(/export\s+default|module\.exports\s*=\s*/g, '').trim();
        if (contenido.endsWith(';')) contenido = contenido.slice(0, -1);
        return new Function(`return ${contenido}`)();
    } catch (e) { return []; }
};

const handler = async (m, { conn, usedPrefix }) => {
    const usuarioID = m.participant || m.key.participant || m.sender || m.remoteJid;
    
    if (!fs.existsSync(dataPath)) return m.reply('📑 Aún no hay registros de matrimonios.');
    
    let db = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    const datosUser = db.usuarios[usuarioID];

    // Si no tiene registros, usamos m.pushName para el saludo
    if (!datosUser || !datosUser.esposas || datosUser.esposas.length === 0) {
        const nombreWA = m.pushName || 'Usuario';
        return m.reply(`💔 No tienes ninguna esposa aún, *${nombreWA}*. ¡Usa ${usedPrefix}matrimonio para conquistar una!`);
    }

    // Cargamos las listas para sacar el nombre del anime
    const waifusNormales = cargarLista('waifus.js');
    const waifusEspeciales = cargarLista('waifus_especiales.js');
    const todasLasWaifus = [...waifusNormales, ...waifusEspeciales];

    // USAMOS datosUser.nombre para el título (Peter, Arturo, etc.)
    let mensaje = `✨ *HAREM DE ${datosUser.nombre.toUpperCase()}* ✨\n`;
    mensaje += `__________________________________\n\n`;

    datosUser.esposas.forEach((nombre, index) => {
        const info = todasLasWaifus.find(w => w.name.toLowerCase() === nombre.toLowerCase());
        const anime = info ? info.anime : 'Desconocido';
        mensaje += `${index + 1}. 💍 *${nombre}*\n   🎬 _${anime}_\n\n`;
    });

    mensaje += `__________________________________\n`;
    mensaje += `Total: ${datosUser.esposas.length} esposas`;

    // Enviamos el mensaje respondiendo directamente al mensaje original
    await conn.sendMessage(m.chat, { 
        text: mensaje
    }, { quoted: m });
};

handler.command = /^(harem|miswaifus|esposas)$/i;
export default handler;
