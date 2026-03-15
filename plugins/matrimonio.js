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
    } catch (e) {
        return [];
    }
};

// Función para buscar imagen sin importar mayúsculas/minúsculas
const buscarImagen = (carpeta, nombreArchivo) => {
    const rutaCarpeta = path.join(process.cwd(), carpeta);
    if (!fs.existsSync(rutaCarpeta)) return null;
    
    const archivos = fs.readdirSync(rutaCarpeta);
    // Buscamos un archivo que coincida en minúsculas
    const coincidencia = archivos.find(f => f.toLowerCase() === nombreArchivo.toLowerCase());
    
    return coincidencia ? fs.readFileSync(path.join(rutaCarpeta, coincidencia)) : null;
};

const handler = async (m, { conn, text, usedPrefix, command }) => {
    const waifusNormales = cargarLista('waifus.js');
    const waifusEspeciales = cargarLista('waifus_especiales.js');

    const usuarioID = m.participant || m.key.participant || m.sender || m.remoteJid;
    if (!usuarioID || usuarioID.includes('@g.us')) return; 

    const nombreUsuario = m.pushName || 'Usuario';

    if (!fs.existsSync('./database')) fs.mkdirSync('./database');
    
    let db = { usuarios: {} };
    if (fs.existsSync(dataPath)) {
        try {
            const contenido = fs.readFileSync(dataPath, 'utf-8');
            if (contenido.trim()) db = JSON.parse(contenido);
        } catch (e) { db = { usuarios: {} }; }
    }

    if (!db.usuarios[usuarioID]) {
        db.usuarios[usuarioID] = { nombre: nombreUsuario, esposas: [], cooldown: 0 };
    }

    const ahora = Date.now();
    const datosUser = db.usuarios[usuarioID];

    if (datosUser.cooldown && ahora < datosUser.cooldown) {
        const restante = Math.ceil((datosUser.cooldown - ahora) / 60000);
        return m.reply(`💔 Espera **${restante} min** para intentar de nuevo.`, null, { mentions: [usuarioID] });
    }

    if (!text) return m.reply(`🎤 Escribe el nombre de la waifu.\nEjemplo: ${usedPrefix + command} Ellen joe`);

    const nombreBusqueda = text.trim().toLowerCase();
    const waifuN = waifusNormales.find(w => w.name.toLowerCase().trim() === nombreBusqueda);
    const waifuE = waifusEspeciales.find(w => w.name.toLowerCase().trim() === nombreBusqueda);
    const waifuData = waifuE || waifuN;

    if (!waifuData) return m.reply(`❌ No encontré a "${text}" en las listas.`);

    let esposoActual = Object.keys(db.usuarios).find(id => 
        db.usuarios[id].esposas.some(e => e.toLowerCase() === waifuData.name.toLowerCase())
    );

    if (esposoActual) {
        const nombreEsposo = db.usuarios[esposoActual].nombre;
        const esPropia = esposoActual === usuarioID;
        if (esPropia) return m.reply(`💍 Ya estás casado con **${waifuData.name}**.`);
        return m.reply(`🚫 No puedes cortejar a **${waifuData.name}**. Ella ya está casada con **${nombreEsposo}** (@${esposoActual.split('@')[0]}).`, null, { mentions: [esposoActual] });
    }

    if (datosUser.esposas.length > 0 && Math.random() < 0.10) {
        const indice = Math.floor(Math.random() * datosUser.esposas.length);
        const seVa = datosUser.esposas.splice(indice, 1)[0];
        fs.writeFileSync(dataPath, JSON.stringify(db, null, 2));
        return m.reply(`⚡ ¡ESCÁNDALO! **${seVa}** se enteró y se divorció de ti por celos. 💔`);
    }

    const esEspecial = waifuE ? true : false;
    const probabilidad = esEspecial ? 0.07 : 0.15; 
    const carpeta = esEspecial ? 'waifus especiales' : 'waifus';
    
    // --- NUEVA LÓGICA DE IMAGEN PERMISIVA ---
    const imagenBuffer = buscarImagen(carpeta, waifuData.file);

    if (Math.random() < probabilidad) {
        datosUser.esposas.push(waifuData.name);
        datosUser.cooldown = ahora + (6 * 60 * 1000); 
        fs.writeFileSync(dataPath, JSON.stringify(db, null, 2));

        const caption = `💍 ¡ACEPTÓ! **${waifuData.name}** de *${waifuData.anime}* ahora es tu esposa oficial.\n\nFelicidades @${usuarioID.split('@')[0]} 🎉 (Cooldown: 6 min)`;

        if (imagenBuffer) {
            await conn.sendMessage(m.chat, { image: imagenBuffer, caption, mentions: [usuarioID] }, { quoted: m });
        } else {
            await m.reply(caption, null, { mentions: [usuarioID] });
        }
    } else {
        datosUser.cooldown = ahora + (4 * 60 * 1000); 
        fs.writeFileSync(dataPath, JSON.stringify(db, null, 2));

        const caption = `💔 **${waifuData.name}** (${waifuData.anime}) te rechazó, @${usuarioID.split('@')[0]}. Sigue soltera. (Cooldown: 4 min)`;

        if (imagenBuffer) {
            await conn.sendMessage(m.chat, { image: imagenBuffer, caption, mentions: [usuarioID] }, { quoted: m });
        } else {
            await conn.sendMessage(m.chat, { text: caption, mentions: [usuarioID] }, { quoted: m });
        }
    }
};

handler.command = /^(matrimonio|casar)$/i;
export default handler;