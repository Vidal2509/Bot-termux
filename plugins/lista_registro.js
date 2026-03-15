import fs from 'fs';
import path from 'path';

const dataPath = './database/matrimonios.json';

const handler = async (m, { conn }) => {
    // --- SEGURIDAD: TU NÚMERO ---
    const miNumeroFiel = '280139359338689';
    const emisor = m.key.participant || m.key.remoteJid || '';

    if (!emisor.includes(miNumeroFiel)) {
        return m.reply('❌ *Acceso denegado.* Solo mi creador puede ver la base de datos.');
    }

    // 1. Verificar si existe la base de datos
    if (!fs.existsSync(dataPath)) {
        return m.reply('❌ No se encontró el archivo de matrimonios.');
    }

    try {
        const db = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
        const usuarios = db.usuarios;
        const keys = Object.keys(usuarios);

        if (keys.length === 0) {
            return m.reply('📂 La base de datos está vacía.');
        }

        // 2. Construir el mensaje de la lista
        let mensaje = `📝 *USUARIOS REGISTRADOS EN MATRIMONIOS*\n`;
        mensaje += `Total de registros: ${keys.length}\n\n`;

        keys.forEach((id, index) => {
            const user = usuarios[id];
            const numEsposas = user.esposas ? user.esposas.length : 0;
            // Mostramos el nombre guardado y el ID recortado para mayor claridad
            mensaje += `${index + 1}. 👤 *${user.nombre || 'Sin nombre'}*\n`;
            mensaje += `   🆔 ID: ${id.split('@')[0]}\n`;
            mensaje += `   💍 Esposas: ${numEsposas}\n`;
            mensaje += `   ───────────────\n`;
        });

        await m.reply(mensaje);

    } catch (e) {
        console.error(e);
        await m.reply('❌ Error al leer la base de datos. Asegúrate de que el JSON no tenga errores.');
    }
};

handler.command = /^(registro|usuarios|listauser)$/i;

export default handler;