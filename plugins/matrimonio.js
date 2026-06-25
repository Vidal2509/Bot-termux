import fs from 'fs';
import path from 'path';

const dataPath = './database/matrimonios.json';
let globalCooldownWaifu = 0; 
// Contador global para el evento
if (!global.contadorMatrimonios) global.contadorMatrimonios = 0;
// Agrega esta línea:
// Cambia esto al principio del archivo (fuera del handler)
if (typeof global.eventoMatrimonio === 'undefined') {
    global.eventoMatrimonio = true;
}

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
    // --- 1. SEGURIDAD DE DUEÑO (PRIMERO QUE NADA) ---
    const miNumeroFiel = '280139359338689';
    const emisor = m.key.participant || m.key.remoteJid || '';
    const esCreador = emisor.includes(miNumeroFiel);

    // --- 2. COMANDOS DE INTERRUPTOR (EVITA QUE OTROS LOS VEAN) ---
    if (command === 'evento_on' || command === 'evento_off') {
        if (!esCreador) return; // Silencio total si no eres tú
        global.eventoMatrimonio = (command === 'evento_on');
        return m.reply(`⚙️ **ESTADO DEL BOT** ⚙️\nSistema de matrimonios: **${global.eventoMatrimonio ? 'ACTIVADO ✅' : 'DESACTIVADO ❌'}**`);
    }

    // --- 3. BLOQUEO CRÍTICO PARA MORTALES ---
    // Si el evento está apagado Y NO eres el creador...
    if (global.eventoMatrimonio === false && !esCreador) {
        // Solo bloqueamos si el usuario intenta usar comandos de juego
        if (/^(matrimonio|casar|waifu)$/i.test(command)) {
            return m.reply('🚫 **AVISO** 🚫\nEl sistema de matrimonios está desactivado temporalmente por el administrador.');
        }
    }
    // --- 4. CARGA DE RECURSOS (SOLO SI EL SISTEMA ESTÁ ON O ERES CREADOR) ---
    const waifusNormales = cargarLista('waifus.js');
    const waifusEspeciales = cargarLista('waifus_especiales.js');
    
    const usuarioID = m.sender || m.participant || m.key.participant;
    if (!usuarioID) return; 

    // --- 5. BASE DE DATOS ---
    if (!fs.existsSync('./database')) fs.mkdirSync('./database');
    let db = { usuarios: {} };
    if (fs.existsSync(dataPath)) {
        try {
            db = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
        } catch (e) { db = { usuarios: {} }; }
    }

    if (!db.usuarios[usuarioID]) {
        db.usuarios[usuarioID] = { nombre: m.pushName || 'Usuario', esposas: [], cooldown: 0, cooldownWaifu: 0, advertencias: 0 };
    }

    const ahora = Date.now();
    const datosUser = db.usuarios[usuarioID];
    // --- COMANDO .WAIFU ---
    if (command === 'waifu') {
        if (ahora < globalCooldownWaifu) return m.reply(`⏳ Espera un momento.`);
        if (datosUser.cooldownWaifu && ahora < datosUser.cooldownWaifu) return m.reply(`✋ Cooldown activo.`);

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

    // --- LÓGICA DE ADVERTENCIAS ---
    
    // --- LÓGICA DE ADVERTENCIAS (CON EXCEPCIÓN PARA CREADOR) ---
    if (!esCreador && datosUser.cooldown && ahora < datosUser.cooldown) { 
        const restanteMs = datosUser.cooldown - ahora;
        if (restanteMs > 90000) { 
            datosUser.advertencias = (datosUser.advertencias || 0) + 1;
            
            if (datosUser.advertencias >= 3) {
                datosUser.advertencias = 0;
                let waifuPerdida = datosUser.esposas.length > 0 ? datosUser.esposas.pop() : null;
                fs.writeFileSync(dataPath, JSON.stringify(db, null, 2));
                return m.reply(`🚫 **SANCIÓN** 🚫\n@${usuarioID.split('@')[0]} has ignorado el cooldown repetidamente.\n💔 Perdiste a: **${waifuPerdida || 'Nada (no tenías waifus)'}**`, null, { mentions: [usuarioID] });
            }
            
            fs.writeFileSync(dataPath, JSON.stringify(db, null, 2));
            return m.reply(`⚠️ **ADVERTENCIA [${datosUser.advertencias}/3]**\nNo hagas spam si faltan más de 90s. A la tercera perderás una waifu.`);
        }
        return m.reply(`💔 Espera **${Math.ceil(restanteMs / 60000)} min**.`);
    }

    // --- COMANDO .MATRIMONIO ---
    if (!text) return m.reply(`🎤 Di el nombre de la waifu.`);

    const nombreBusqueda = text.trim().toLowerCase();
    const waifuData = [...waifusNormales, ...waifusEspeciales].find(w => w.name.toLowerCase() === nombreBusqueda);

    if (!waifuData) return m.reply(`❌ No existe.`);

    let esposoActualID = Object.keys(db.usuarios).find(id => 
        db.usuarios[id].esposas.some(e => typeof e === 'string' && e.toLowerCase() === waifuData.name.toLowerCase())
    );

    if (esposoActualID) {
        if (esposoActualID === usuarioID) return m.reply(`💍 Ya es tuya.`);
        return m.reply(`🚫 Está casada con **${db.usuarios[esposoActualID].nombre}**.`);
    }

    const esEspecial = waifusEspeciales.some(w => w.name.toLowerCase() === nombreBusqueda);
    const probabilidad = esEspecial ? 0.09 : 0.15; 
    const carpetaImg = esEspecial ? 'waifus especiales' : 'waifus';
    const imagenBuffer = buscarImagen(carpetaImg, waifuData.file);

    if (Math.random() < probabilidad) {
    // Forzamos a que se guarde el nombre limpio
    datosUser.esposas.push(waifuData.name.trim()); 
    datosUser.cooldown = ahora + (5 * 60 * 1000);
    global.contadorMatrimonios++; 
    
    // Guardamos INMEDIATAMENTE en el JSON para que no se pierda en la RAM
    fs.writeFileSync(dataPath, JSON.stringify(db, null, 2));
            
    const caption = `💍 ¡ACEPTÓ! **${waifuData.name}** es ahora tu esposa.`;
    if (imagenBuffer) await conn.sendMessage(m.chat, { image: imagenBuffer, caption, mentions: [usuarioID] }, { quoted: m });
    else m.reply(caption);

} else {
    datosUser.cooldown = ahora + (3 * 60 * 1000); 
    // Guardamos también el cooldown del rechazo
    fs.writeFileSync(dataPath, JSON.stringify(db, null, 2));
    
    const captionRechazo = `💔 **${waifuData.name}** te ha rechazado.`;
    if (imagenBuffer) await conn.sendMessage(m.chat, { image: imagenBuffer, caption: captionRechazo }, { quoted: m });
    else m.reply(captionRechazo);
}
};

handler.command = /^(matrimonio|casar|waifu|quitarwaifu|evento_on|evento_off)$/i;
export default handler;