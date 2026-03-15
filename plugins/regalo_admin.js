import fs from 'fs';
import path from 'path';

const dataPath = './database/matrimonios.json';
let isProcessing = false; 

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

const buscarImagenReal = (carpeta, nombreArchivo) => {
    const rutaCarpeta = path.join(process.cwd(), carpeta);
    if (!fs.existsSync(rutaCarpeta)) return null;
    const archivos = fs.readdirSync(rutaCarpeta);
    const coincidencia = archivos.find(f => f.toLowerCase() === nombreArchivo.toLowerCase());
    return coincidencia ? fs.readFileSync(path.join(rutaCarpeta, coincidencia)) : null;
};

const handler = async (m, { conn, usedPrefix, command, text }) => {
    // 1. Seguridad de Dueño
    const miNumeroFiel = '280139359338689';
    const emisor = m.key.participant || m.key.remoteJid || '';
    if (!emisor.includes(miNumeroFiel)) return;

    // 2. Bloqueo de ejecución doble
    if (isProcessing) return;
    isProcessing = true;

    try {
        if (!fs.existsSync(dataPath)) {
            isProcessing = false;
            return m.reply('❌ No hay base de datos.');
        }

        let db = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

        // Detectar usuario
        let who = m.quoted ? m.quoted.sender : (m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : null);
        if (!who && text) {
            let num = text.replace(/[^0-9]/g, '');
            if (num.length > 8) who = num + '@s.whatsapp.net';
        }

        if (!who) {
            isProcessing = false;
            return m.reply(`🎤 Menciona a un usuario registrado.`);
        }

        // Unificación de ID real
        const bareID = who.split('@')[0];
        const idReal = Object.keys(db.usuarios).find(key => key.startsWith(bareID));

        if (!idReal) {
            isProcessing = false;
            return m.reply(`❌ El usuario @${bareID} no está registrado.`);
        }

        // Obtener waifu soltera
        const waifusNormales = cargarLista('waifus.js');
        const waifusEspeciales = cargarLista('waifus_especiales.js');
        const todasWaifus = [...waifusNormales, ...waifusEspeciales];

        const casadas = Object.values(db.usuarios).flatMap(u => u.esposas.map(e => e.toLowerCase()));
        const solteras = todasWaifus.filter(w => !casadas.includes(w.name.toLowerCase()));

        if (solteras.length === 0) {
            isProcessing = false;
            return m.reply('❌ No quedan waifus solteras.');
        }

        const waifuData = solteras[Math.floor(Math.random() * solteras.length)];

        // Guardar en DB
        db.usuarios[idReal].esposas.push(waifuData.name);
        fs.writeFileSync(dataPath, JSON.stringify(db, null, 2));

        // Preparar mensaje e imagen
        const esEspecial = waifusEspeciales.some(w => w.name === waifuData.name);
        const carpeta = esEspecial ? 'waifus especiales' : 'waifus';
        const imagenBuffer = buscarImagenReal(carpeta, waifuData.file);
        const mensaje = `🎁 *REGALO EXCLUSIVO* 🎁\n\nFelicidades @${idReal.split('@')[0]}, has recibido a:\n✨ **${waifuData.name}**\n\n¡Disfrútala! 💍`;

        // ENVIAR Y TERMINAR
        if (imagenBuffer) {
            await conn.sendMessage(m.chat, { image: imagenBuffer, caption: mensaje, mentions: [idReal] }, { quoted: m });
        } else {
            await conn.sendMessage(m.chat, { text: mensaje, mentions: [idReal] }, { quoted: m });
        }

    } catch (e) {
        console.error("Error en regalo:", e);
    } finally {
        // Liberar el candado inmediatamente al terminar la ejecución exitosa
        isProcessing = false;
    }
};

handler.command = /^(regalo|regalwaifu)$/i;
export default handler;