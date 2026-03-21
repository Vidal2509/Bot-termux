import fs from 'fs';
import path from 'path';

const dataPath = './database/matrimonios.json';
let globalCooldownWaifu = 0; 
// Contador global para el evento
if (!global.contadorMatrimonios) global.contadorMatrimonios = 0;

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
    if (datosUser.cooldown && ahora < datosUser.cooldown) {
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
        datosUser.esposas.push(waifuData.name); 
        datosUser.cooldown = ahora + (5 * 60 * 1000);
        global.contadorMatrimonios++; 

        // --- EVENTO "EL BOT ESTÁ MOLESTO" (PROBABILIDAD 50/50) ---
        if (global.contadorMatrimonios >= 3) {
            global.contadorMatrimonios = 0; 
            
            if (!global.historialVictimas) global.historialVictimas = [];

            let usuariosConWaifus = Object.keys(db.usuarios).filter(id => 
                db.usuarios[id].esposas.length > 0 && 
                !global.historialVictimas.includes(id)
            );

            if (usuariosConWaifus.length < 2) {
                global.historialVictimas = [];
                usuariosConWaifus = Object.keys(db.usuarios).filter(id => db.usuarios[id].esposas.length > 0);
            }
            
            // Decidir tipo de evento (50% cada uno)
            const esBombaNuclear = Math.random() < 0.5;
            const cantidadAQuitar = esBombaNuclear ? 3 : 2;
            
            let textoEvento = esBombaNuclear 
                ? `☢️ **¡¡BOMBA NUCLEAR DETONADA!!** ☢️\n¡El Rei Chiquita ha perdido el control total!\n\n`
                : `💢 **Rei Chiquita ESTÁ MOLESTA** 💢\nDemasiados matrimonios... ¡He decidido sembrar el caos!\n\n`;
            
            let victimasTags = [];
            let nuevasVictimas = [];

            if (usuariosConWaifus.length > 0) {
                const shuffled = usuariosConWaifus.sort(() => 0.5 - Math.random());
                const elegidos = shuffled.slice(0, 2);
                
                elegidos.forEach(id => {
                    let perdidas = [];
                    for (let i = 0; i < cantidadAQuitar; i++) {
                        if (db.usuarios[id].esposas.length > 0) {
                            perdidas.push(db.usuarios[id].esposas.pop());
                        }
                    }
                    
                    if (perdidas.length > 0) {
                        textoEvento += `💔 A @${id.split('@')[0]} le quité ${perdidas.length} waifus: **${perdidas.join(', ')}**\n`;
                        victimasTags.push(id);
                        nuevasVictimas.push(id);
                    }
                });

                global.historialVictimas = nuevasVictimas;
            } else {
                textoEvento += `Iba a lanzar la bomba, pero nadie tiene waifus... Suerte para la próxima.`;
            }

            fs.writeFileSync(dataPath, JSON.stringify(db, null, 2));
            await conn.sendMessage(m.chat, { text: textoEvento, mentions: victimasTags }, { quoted: m });
        } else {
            fs.writeFileSync(dataPath, JSON.stringify(db, null, 2));
        }
        
        const caption = `💍 ¡ACEPTÓ! **${waifuData.name}** es ahora tu esposa.`;
        if (imagenBuffer) await conn.sendMessage(m.chat, { image: imagenBuffer, caption, mentions: [usuarioID] }, { quoted: m });
        else m.reply(caption);

    } else {
        datosUser.cooldown = ahora + (3 * 60 * 1000); 
        fs.writeFileSync(dataPath, JSON.stringify(db, null, 2));
        const captionRechazo = `💔 **${waifuData.name}** te ha rechazado.`;
        if (imagenBuffer) await conn.sendMessage(m.chat, { image: imagenBuffer, caption: captionRechazo }, { quoted: m });
        else m.reply(captionRechazo);
    }
    // --- COMANDO .QUITARWAIFU (SOLO CREADOR) ---
    if (command === 'quitarwaifu') {
        const miNumeroFiel = '280139359338689'; // Tu número de creador
        const senderNumber = (m.sender || m.participant || '').replace(/\D/g, '');

        if (!senderNumber.includes(miNumeroFiel)) {
            return m.reply('❌ No tienes permiso para usar este comando de castigo.');
        }

        // Obtener el usuario mencionado o citado
        let victima = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : 
                     m.quoted ? m.quoted.sender : null;

        if (!victima) return m.reply('⚠️ Etiqueta a alguien o responde a su mensaje para quitarle una waifu.');

        if (!db.usuarios[victima] || !db.usuarios[victima].esposas || db.usuarios[victima].esposas.length === 0) {
            return m.reply('💨 Ese usuario no tiene waifus que perder.');
        }

        // Elegir una waifu al azar para quitarla
        const indiceAzar = Math.floor(Math.random() * db.usuarios[victima].esposas.length);
        const waifuQuitada = db.usuarios[victima].esposas.splice(indiceAzar, 1)[0];

        // Guardar cambios en el JSON
        fs.writeFileSync(dataPath, JSON.stringify(db, null, 2));

        const tagVictima = victima.split('@')[0];
        const msg = `🔨 **CASTIGO DIVINO** 🔨\n\nEl creador ha decidido que @${tagVictima} ya no merece a **${waifuQuitada}**.\n\n💔 La waifu ha sido eliminada de su colección.`;

        return await conn.sendMessage(m.chat, { text: msg, mentions: [victima] }, { quoted: m });
    }
};

handler.command = /^(matrimonio|casar|waifu)$/i;
export default handler;