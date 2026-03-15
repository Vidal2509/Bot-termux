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

const handler = async (m, { conn, text, usedPrefix, command }) => {
    const waifusNormales = cargarLista('waifus.js');
    const waifusEspeciales = cargarLista('waifus_especiales.js');
    const todasWaifus = [...waifusNormales, ...waifusEspeciales];

    const usuarioID = m.participant || m.key.participant || m.sender || m.remoteJid;
    if (!usuarioID || usuarioID.includes('@g.us')) return;

    if (!fs.existsSync(dataPath)) return m.reply('📑 No hay registros aún.');
    let db = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    
    if (!db.usuarios[usuarioID]) db.usuarios[usuarioID] = { nombre: m.pushName || 'Usuario', esposas: [], cooldownRobo: 0 };
    const datosUser = db.usuarios[usuarioID];
    const ahora = Date.now();

    if (!text) return m.reply(`🎤 Escribe el nombre.\nEjemplo: ${usedPrefix + command} Asuka`);
    
    const nombreBusqueda = text.trim().toLowerCase();
    
    // 1. Intentar búsqueda exacta primero
    let waifuData = todasWaifus.find(w => w.name.toLowerCase().trim() === nombreBusqueda);

    // 2. Si no hay exacta, buscar por "contiene" (Sugerencias)
    if (!waifuData) {
        const sugerencias = todasWaifus
            .filter(w => w.name.toLowerCase().includes(nombreBusqueda))
            .slice(0, 5); // Máximo 5 resultados

        if (sugerencias.length > 0) {
            let sugerenciasTxt = `❌ No encontré a "${text}", ¿quizás quisiste decir?:\n\n`;
            sugerencias.forEach((s, i) => {
                sugerenciasTxt += `${i + 1}. *${s.name}* (de ${s.anime})\n`;
            });
            sugerenciasTxt += `\n_Escribe el nombre completo para interactuar._`;
            return m.reply(sugerenciasTxt);
        } else {
            return m.reply(`❌ No encontré ninguna waifu que coincida con "${text}".`);
        }
    }

    // A partir de aquí el código sigue igual para BUSCAR o ROBAR...
    const esEspecial = waifusEspeciales.some(w => w.name === waifuData.name);
    const carpeta = esEspecial ? 'waifus especiales' : 'waifus';
    const imagenBuffer = buscarImagenReal(carpeta, waifuData.file);

    if (command === 'buscar') {
        let dueñoID = Object.keys(db.usuarios).find(id => 
            db.usuarios[id].esposas.some(e => e.toLowerCase() === waifuData.name.toLowerCase())
        );

        if (dueñoID) {
            const esMio = dueñoID === usuarioID;
            const txt = esMio ? `💍 **${waifuData.name}** es tu esposa.` : `🕵️ **${waifuData.name}** ya tiene dueño. Es esposa de **${db.usuarios[dueñoID].nombre}** (@${dueñoID.split('@')[0]}).`;
            if (imagenBuffer) return conn.sendMessage(m.chat, { image: imagenBuffer, caption: txt, mentions: [dueñoID] }, { quoted: m });
            return m.reply(txt, null, { mentions: [dueñoID] });
        } else {
            const txtLibre = `✅ **${waifuData.name}** está soltera. ¡Cásate con ella!`;
            if (imagenBuffer) return conn.sendMessage(m.chat, { image: imagenBuffer, caption: txtLibre }, { quoted: m });
            return m.reply(txtLibre);
        }
    }

    if (command === 'robar') {
        // ... (Tu lógica de robar se mantiene igual, usando waifuData.name)
        if (datosUser.esposas.length < 1) return m.reply(`🚫 Necesitas al menos una esposa para robar.`);
        if (datosUser.cooldownRobo && ahora < datosUser.cooldownRobo) {
            const restante = Math.ceil((datosUser.cooldownRobo - ahora) / 60000);
            return m.reply(`⏳ Espera **${restante} min**.`);
        }

        let dueñoID = Object.keys(db.usuarios).find(id => 
            db.usuarios[id].esposas.some(e => e.toLowerCase() === waifuData.name.toLowerCase())
        );

        if (!dueñoID) return m.reply(`❌ No puedes robar a **${waifuData.name}** porque no tiene dueño.`);
        if (dueñoID === usuarioID) return m.reply(`🤔 Es tu propia esposa...`);

        const azar = Math.random();
        datosUser.cooldownRobo = ahora + (5 * 60 * 1000); 

        if (azar < 0.20) { 
            const idx = db.usuarios[dueñoID].esposas.findIndex(e => e.toLowerCase() === waifuData.name.toLowerCase());
            const robada = db.usuarios[dueñoID].esposas.splice(idx, 1)[0];
            datosUser.esposas.push(robada);
            fs.writeFileSync(dataPath, JSON.stringify(db, null, 2));
            const capExito = `🔫 ¡ROBO EXITOSO! Has robado a **${robada}**. 😈`;
            if (imagenBuffer) return conn.sendMessage(m.chat, { image: imagenBuffer, caption: capExito }, { quoted: m });
            return m.reply(capExito);
        } else if (azar < 0.40) { 
            const idxP = Math.floor(Math.random() * datosUser.esposas.length);
            const seVa = datosUser.esposas.splice(idxP, 1)[0];
            fs.writeFileSync(dataPath, JSON.stringify(db, null, 2));
            return m.reply(`⚡ ¡EL TIRO TE SALIÓ POR LA CULATA! Tu esposa **${seVa}** te dejó por intentar robar a otra. 🤡`);
        } else { 
            fs.writeFileSync(dataPath, JSON.stringify(db, null, 2));
            const capFallo = `👮 **${waifuData.name}** rechazó tus sucias intenciones.`;
            if (imagenBuffer) return conn.sendMessage(m.chat, { image: imagenBuffer, caption: capFallo }, { quoted: m });
            return m.reply(capFallo);
        }
    }
};

handler.command = /^(robar|buscar)$/i;
export default handler;