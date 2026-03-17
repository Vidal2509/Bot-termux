import fs from 'fs';
import path from 'path';

const dataPath = './database/matrimonios.json';
let globalCooldownWaifu = 0; 

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
    
    const usuarioID = m.sender || m.participant || m.key.participant;
    if (!usuarioID) return; 

    if (!fs.existsSync('./database')) fs.mkdirSync('./database');
    let db = { usuarios: {} };
    if (fs.existsSync(dataPath)) {
        try {
            db = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
        } catch (e) { db = { usuarios: {} }; }
    }

    if (!db.usuarios[usuarioID]) {
        db.usuarios[usuarioID] = { nombre: m.pushName || 'Usuario', esposas: [], cooldown: 0, cooldownWaifu: 0 };
    }

    const ahora = Date.now();
    const datosUser = db.usuarios[usuarioID];

    // --- COMANDO .WAIFU ---
    if (command === 'waifu') {
        if (ahora < globalCooldownWaifu) return m.reply(`⏳ Espera un momento.`);
        if (datosUser.cooldownWaifu && ahora < datosUser.cooldownWaifu) return m.reply(`✋ Cooldown activo.`);

        // FILTRO SEGURO: Solo tomamos lo que sea texto (string)
        const casadas = Object.values(db.usuarios)
            .flatMap(u => u.esposas)
            .filter(e => typeof e === 'string') 
            .map(e => e.toLowerCase());
        
        const solteras = waifusNormales.filter(w => !casadas.includes(w.name.toLowerCase()));
        if (solteras.length === 0) return m.reply("😔 No hay solteras.");

        const waifuAzar = solteras[Math.floor(Math.random() * solteras.length)];
        const imagenBuffer = buscarImagen('waifus', waifuAzar.file);

        globalCooldownWaifu = ahora + (10 * 1000);
        datosUser.cooldownWaifu = ahora + (60 * 1000);
        fs.writeFileSync(dataPath, JSON.stringify(db, null, 2));

        const txt = `✨ **WAIFU SOLTERA**\n👑 **${waifuAzar.name}**\n🎥 Anime: *${waifuAzar.anime}*`;
        if (imagenBuffer) return await conn.sendMessage(m.chat, { image: imagenBuffer, caption: txt }, { quoted: m });
        return m.reply(txt);
    }

    // --- COMANDO .MATRIMONIO ---
    if (datosUser.cooldown && ahora < datosUser.cooldown) {
        const restante = Math.ceil((datosUser.cooldown - ahora) / 60000);
        return m.reply(`💔 Espera **${restante} min**.`);
    }

    if (!text) return m.reply(`🎤 Di el nombre de la waifu.`);

    const nombreBusqueda = text.trim().toLowerCase();
    const waifuData = [...waifusNormales, ...waifusEspeciales].find(w => w.name.toLowerCase() === nombreBusqueda);

    if (!waifuData) return m.reply(`❌ No existe.`);

    // BUSQUEDA SEGURA DE ESPOSO: Validamos que 'e' sea string antes de toLowerCase
    let esposoActualID = Object.keys(db.usuarios).find(id => 
        db.usuarios[id].esposas.some(e => typeof e === 'string' && e.toLowerCase() === waifuData.name.toLowerCase())
    );

    if (esposoActualID) {
        if (esposoActualID === usuarioID) return m.reply(`💍 Ya es tuya.`);
        return m.reply(`🚫 Está casada con **${db.usuarios[esposoActualID].nombre}**.`);
    }

    const esEspecial = waifusEspeciales.some(w => w.name.toLowerCase() === nombreBusqueda);
    const probabilidad = esEspecial ? 0.10 : 0.70; 
    const carpetaImg = esEspecial ? 'waifus especiales' : 'waifus';
    const imagenBuffer = buscarImagen(carpetaImg, waifuData.file);

    if (Math.random() < probabilidad) {
        datosUser.esposas.push(waifuData.name); 
        datosUser.cooldown = ahora + (5 * 60 * 1000); 
        fs.writeFileSync(dataPath, JSON.stringify(db, null, 2));
        
        const caption = `💍 ¡ACEPTÓ! **${waifuData.name}** es tu esposa.`;
        if (imagenBuffer) await conn.sendMessage(m.chat, { image: imagenBuffer, caption, mentions: [usuarioID] }, { quoted: m });
        else m.reply(caption);
    } else {
        datosUser.cooldown = ahora + (3 * 60 * 1000); 
        fs.writeFileSync(dataPath, JSON.stringify(db, null, 2));
        m.reply(`💔 Te rechazó.`);
    }
};

handler.command = /^(matrimonio|casar|waifu)$/i;
export default handler;