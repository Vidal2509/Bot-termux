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

const buscarImagenReal = (carpeta, nombreArchivo) => {
    const rutaCarpeta = path.join(process.cwd(), carpeta);
    if (!fs.existsSync(rutaCarpeta)) return null;
    const archivos = fs.readdirSync(rutaCarpeta);
    const coincidencia = archivos.find(f => f.toLowerCase() === nombreArchivo.toLowerCase());
    return coincidencia ? fs.readFileSync(path.join(rutaCarpeta, coincidencia)) : null;
};

// Función de retraso (pausa) de 2 segundos
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const handler = async (m, { conn }) => {
    const esGrupo = m.chat.endsWith('@g.us');
    if (!esGrupo) return m.reply('*⚠️ Este comando solo es para grupos.*');

    // 🔒 RESTRICCIÓN DE OWNER
    const senderID = m.participant || m.key.participant || m.sender || m.remoteJid;
    const numeroLimpio = senderID.split('@')[0];

    // Tu ID autorizado
    const miIDAutorizado = '280139359338689';

    if (numeroLimpio !== miIDAutorizado) {
        return m.reply('❌ Este comando solo puede ser ejecutado por el creador del bot.');
    }

    if (!fs.existsSync(dataPath)) return m.reply('📑 No hay registros de matrimonios.');
    let db = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    const usuariosIDs = Object.keys(db.usuarios || {});
    if (usuariosIDs.length < 5) {
        return m.reply(`⚠️ Se necesitan al menos 5 usuarios registrados en la base de datos para hacer la bendición (hay ${usuariosIDs.length}).`);
    }

    // 🎲 Seleccionamos 5 personas al azar del registro
    const seleccionados = usuariosIDs.sort(() => 0.5 - Math.random()).slice(0, 5);

    // Cargamos todas las waifus disponibles
    const waifusNormales = cargarLista('waifus.js');
    const waifusEspeciales = cargarLista('waifus_especiales.js');
    const todasWaifus = [...waifusNormales, ...waifusEspeciales];

    // Obtenemos una lista con los nombres de todas las waifus que YA tienen dueño en el harem de alguien
    const waifusOcupadas = new Set();
    Object.values(db.usuarios).forEach(u => {
        if (u.esposas && Array.isArray(u.esposas)) {
            u.esposas.forEach(e => waifusOcupadas.add(e.toLowerCase()));
        }
    });

    // Filtramos solo las waifus que están totalmente solteras
    let waifusLibres = todasWaifus.filter(w => !waifusOcupadas.has(w.name.toLowerCase()));

    if (waifusLibres.length < 5) {
        return m.reply('⚠️ No hay suficientes waifus libres en el sistema para repartir 5 bendiciones.');
    }

    await m.reply('😇 *¡El divino ha comenzado a repartir bendiciones celestiales! Preparando altares...*');

    for (let i = 0; i < seleccionados.length; i++) {
        const userID = seleccionados[i];
        const usuarioData = db.usuarios[userID];
        const nombreUsuario = usuarioData.nombre || 'Afortunado/a';

        // Elegimos una waifu libre al azar y la sacamos del array para que no se repita en la misma tanda
        const indexWaifu = Math.floor(Math.random() * waifusLibres.length);
        const waifuAsignada = waifusLibres.splice(indexWaifu, 1)[0];

        // Se la añadimos formalmente al usuario en la base de datos
        if (!usuarioData.esposas) usuarioData.esposas = [];
        usuarioData.esposas.push(waifuAsignada.name);

        // Buscamos su imagen real en las carpetas locales
        const esEspecial = waifusEspeciales.some(w => w.name === waifuAsignada.name);
        const carpeta = esEspecial ? 'waifus especiales' : 'waifus';
        const imagenBuffer = buscarImagenReal(carpeta, waifuAsignada.file);

        // Corrección aplicada en ${nombreUsuario}
        const caption = `✨ *¡BENDICIÓN DIVINA #${i + 1}!* ✨\n\n👤 Para: *${nombreUsuario}* (@${userID.split('@')[0]})\n💍 Ha recibido a: **${waifuAsignada.name}**\n🎥 Anime: *${waifuAsignada.anime}*\n\n_¡Una nueva esposa se une a su harem!_`;

        if (imagenBuffer) {
            await conn.sendMessage(m.chat, { image: imagenBuffer, caption: caption, mentions: [userID] }, { quoted: m });
        } else {
            await conn.sendMessage(m.chat, { text: caption, mentions: [userID] }, { quoted: m });
        }

        // ⏱️ Esperamos 2 segundos exactos antes de mandar la siguiente (siempre y cuando no sea la última)
        if (i < seleccionados.length - 1) {
            await sleep(2000);
        }
    }

    // Guardamos los cambios en el JSON de matrimonios
    fs.writeFileSync(dataPath, JSON.stringify(db, null, 2));
    await m.reply('🌟 *¡La tanda de bendiciones ha finalizado con éxito!*');
};

handler.command = /^bendicion$/i;
export default handler;