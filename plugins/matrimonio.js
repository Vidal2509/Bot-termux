import fs from 'fs';
import path from 'path';

const dataPath = './database/matrimonios.json';
let globalCooldownWaifu = 0; // Cooldown global para .waifu

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

const buscarImagen = (carpeta, nombreArchivo) => {
    const rutaCarpeta = path.join(process.cwd(), carpeta);
    if (!fs.existsSync(rutaCarpeta)) return null;
    const archivos = fs.readdirSync(rutaCarpeta);
    const coincidencia = archivos.find(f => f.toLowerCase() === nombreArchivo.toLowerCase());
    return coincidencia ? fs.readFileSync(path.join(rutaCarpeta, coincidencia)) : null;
};

const handler = async (m, { conn, text, usedPrefix, command }) => {
    const waifusNormales = cargarLista('waifus.js');
    const waifusEspeciales = cargarLista('waifus_especiales.js');
    const todasWaifus = [...waifusNormales, ...waifusEspeciales];

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
        db.usuarios[usuarioID] = { nombre: nombreUsuario, esposas: [], cooldown: 0, cooldownWaifu: 0 };
    }

    const ahora = Date.now();
    const datosUser = db.usuarios[usuarioID];

    // --- LÓGICA COMANDO .WAIFU (Azar Soltera) ---
    if (command === 'waifu') {
        // Cooldown Global (20 seg)
        if (ahora < globalCooldownWaifu) {
            const esperaGlobal = Math.ceil((globalCooldownWaifu - ahora) / 1000);
            return m.reply(`⏳ Cooldown global activo. Espera **${esperaGlobal}s**.`);
        }

        // Cooldown Usuario (2 min)
        if (datosUser.cooldownWaifu && ahora < datosUser.cooldownWaifu) {
            const esperaUser = Math.ceil((datosUser.cooldownWaifu - ahora) / 1000);
            return m.reply(`✋ Ya pediste una waifu. Espera **${esperaUser}s**.`);
        }

        // Obtener lista de waifus casadas
        const casadas = Object.values(db.usuarios).flatMap(u => u.esposas.map(e => e.toLowerCase()));
        
        // Filtrar solo las de waifus.js (normales) que estén solteras
        const solteras = waifusNormales.filter(w => !casadas.includes(w.name.toLowerCase()));

        if (solteras.length === 0) return m.reply("😔 No quedan waifus solteras en la lista normal.");

        const waifuAzar = solteras[Math.floor(Math.random() * solteras.length)];
        const imagenBuffer = buscarImagen('waifus', waifuAzar.file);

        // Aplicar Cooldowns
        globalCooldownWaifu = ahora + (20 * 1000);
        datosUser.cooldownWaifu = ahora + (2 * 60 * 1000);
        fs.writeFileSync(dataPath, JSON.stringify(db, null, 2));

        const txt = `✨ **WAIFU AL AZAR** ✨\n\nHe encontrado a esta waifu soltera:\n👑 **${waifuAzar.name}**\n🎥 Anime: *${waifuAzar.anime}*\n\n_¡Puedes intentar casarte con ella usando ${usedPrefix}matrimonio!_`;

        if (imagenBuffer) {
            return await conn.sendMessage(m.chat, { image: imagenBuffer, caption: txt }, { quoted: m });
        } else {
            return m.reply(txt);
        }
    }

    // --- LÓGICA COMANDO MATRIMONIO / CASAR ---
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
        return m.reply(`🚫 **${waifuData.name}** ya está casada con **${nombreEsposo}).`, null, { mentions: [esposoActual] });
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
    const imagenBuffer = buscarImagen(carpeta, waifuData.file);

    if (Math.random() < probabilidad) {
        datosUser.esposas.push(waifuData.name);
        datosUser.cooldown = ahora + (6 * 60 * 1000); 
        fs.writeFileSync(dataPath, JSON.stringify(db, null, 2));
        const caption = `💍 ¡ACEPTÓ! **${waifuData.name}** ahora es tu esposa oficial.\n\nFelicidades @${usuarioID.split('@')[0]} 🎉`;
        if (imagenBuffer) await conn.sendMessage(m.chat, { image: imagenBuffer, caption, mentions: [usuarioID] }, { quoted: m });
        else await m.reply(caption, null, { mentions: [usuarioID] });
    } else {
        datosUser.cooldown = ahora + (4 * 60 * 1000); 
        fs.writeFileSync(dataPath, JSON.stringify(db, null, 2));
        const caption = `💔 **${waifuData.name}** te rechazó, @${usuarioID.split('@')[0]}. Sigue soltera.`;
        if (imagenBuffer) await conn.sendMessage(m.chat, { image: imagenBuffer, caption, mentions: [usuarioID] }, { quoted: m });
        else await conn.sendMessage(m.chat, { text: caption, mentions: [usuarioID] }, { quoted: m });
    }
};

handler.command = /^(matrimonio|casar|waifu)$/i;
export default handler;