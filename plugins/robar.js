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

const handler = async (m, { conn, text, usedPrefix, command }) => {
    const waifusNormales = cargarLista('waifus.js');
    const waifusEspeciales = cargarLista('waifus_especiales.js');
    const todasWaifus = [...waifusNormales, ...waifusEspeciales];

    const usuarioID = m.participant || m.key.participant || m.sender || m.remoteJid;
    if (!usuarioID || usuarioID.includes('@g.us')) return;

    if (!fs.existsSync(dataPath)) return m.reply('📑 No hay registros de matrimonios aún.');
    let db = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    
    if (!db.usuarios[usuarioID]) db.usuarios[usuarioID] = { nombre: m.pushName || 'Usuario', esposas: [], cooldownRobo: 0 };
    const datosUser = db.usuarios[usuarioID];
    const ahora = Date.now();

    if (!text) return m.reply(`🎤 Escribe el nombre de la waifu.\nEjemplo: ${usedPrefix + command} Ellen joe`);
    const nombreBusqueda = text.trim().toLowerCase();
    
    // Buscar la waifu y determinar su carpeta
    const waifuE = waifusEspeciales.find(w => w.name.toLowerCase().trim() === nombreBusqueda);
    const waifuN = waifusNormales.find(w => w.name.toLowerCase().trim() === nombreBusqueda);
    const waifuData = waifuE || waifuN;

    if (!waifuData) return m.reply(`❌ Esa waifu no existe en las listas.`);

    const carpeta = waifuE ? 'waifus especiales' : 'waifus';
    const imagenPath = path.join(process.cwd(), carpeta, waifuData.file);
    const imagenBuffer = fs.existsSync(imagenPath) ? fs.readFileSync(imagenPath) : null;

    // --- FUNCIÓN BUSCAR ---
    if (command === 'buscar') {
        let dueñoID = Object.keys(db.usuarios).find(id => 
            db.usuarios[id].esposas.some(e => e.toLowerCase() === nombreBusqueda)
        );

        if (dueñoID) {
            const esMio = dueñoID === usuarioID;
            const txt = esMio ? `💍 **${waifuData.name}** es tu esposa.` : `🕵️ **${waifuData.name}** ya tiene dueño. Su esposo es **${db.usuarios[dueñoID].nombre}** (@${dueñoID.split('@')[0]}).`;
            
            if (imagenBuffer) return conn.sendMessage(m.chat, { image: imagenBuffer, caption: txt, mentions: [dueñoID] }, { quoted: m });
            return m.reply(txt, null, { mentions: [dueñoID] });
        } else {
            const txtLibre = `✅ **${waifuData.name}** está soltera. ¡Puedes intentar casarte con ella!`;
            if (imagenBuffer) return conn.sendMessage(m.chat, { image: imagenBuffer, caption: txtLibre }, { quoted: m });
            return m.reply(txtLibre);
        }
    }

    // --- FUNCIÓN ROBAR ---
    if (command === 'robar') {
        if (datosUser.esposas.length < 1) return m.reply(`🚫 Necesitas tener al menos una esposa para poder realizar un robo.`);

        if (datosUser.cooldownRobo && ahora < datosUser.cooldownRobo) {
            const restante = Math.ceil((datosUser.cooldownRobo - ahora) / 60000);
            return m.reply(`⏳ Estás bajo vigilancia. Espera **${restante} minutos**.`);
        }

        let dueñoID = Object.keys(db.usuarios).find(id => 
            db.usuarios[id].esposas.some(e => e.toLowerCase() === nombreBusqueda)
        );

        if (!dueñoID) return m.reply(`❌ No puedes robar a **${waifuData.name}** porque no le pertenece a nadie.`);
        if (dueñoID === usuarioID) return m.reply(`🤔 ¿Para qué te vas a robar a tu propia esposa?`);

        const azar = Math.random();
        datosUser.cooldownRobo = ahora + (5 * 60 * 1000); 

        if (azar < 0.20) { 
            // ÉXITO (20%)
            const idx = db.usuarios[dueñoID].esposas.findIndex(e => e.toLowerCase() === nombreBusqueda);
            const robada = db.usuarios[dueñoID].esposas.splice(idx, 1)[0];
            datosUser.esposas.push(robada);
            fs.writeFileSync(dataPath, JSON.stringify(db, null, 2));
            
            const capExito = `🔫 ¡ROBO EXITOSO! Has logrado convencer a **${robada}** de dejar a **${db.usuarios[dueñoID].nombre}** y unirse a ti. 😈`;
            if (imagenBuffer) return conn.sendMessage(m.chat, { image: imagenBuffer, caption: capExito }, { quoted: m });
            return m.reply(capExito);
            
        } else if (azar < 0.40) { 
            // KARMA (20%)
            const idxP = Math.floor(Math.random() * datosUser.esposas.length);
            const seVa = datosUser.esposas.splice(idxP, 1)[0];
            fs.writeFileSync(dataPath, JSON.stringify(db, null, 2));
            
            return m.reply(`⚡ ¡EL TIRO TE SALIÓ POR LA CULATA! Intentaste robar a **${waifuData.name}**, pero tu esposa **${seVa}** se enteró y te dejó por infiel. 🤡`);
            
        } else { 
            // RECHAZO (60%)
            fs.writeFileSync(dataPath, JSON.stringify(db, null, 2));
            const capFallo = `👮 **${waifuData.name}** es fiel a su esposo y rechazó tus sucias intenciones.`;
            if (imagenBuffer) return conn.sendMessage(m.chat, { image: imagenBuffer, caption: capFallo }, { quoted: m });
            return m.reply(capFallo);
        }
    }
};

handler.command = /^(robar|buscar)$/i;
export default handler;