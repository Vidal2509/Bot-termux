import fs from 'fs';
import path from 'path';

const dataPath = './database/matrimonios.json';

// Algoritmo para medir similitud entre textos
const calcularSimilitud = (s1, s2) => {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();
    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
            if (i === 0) costs[j] = j;
            else if (j > 0) {
                let newValue = costs[j - 1];
                if (s1.charAt(i - 1) !== s2.charAt(j - 1))
                    newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                costs[j - 1] = lastValue;
                lastValue = newValue;
            }
        }
        if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
};

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
    
    // 1. Intentar coincidencia exacta (siempre manda si es exacto)
    let waifuData = todasWaifus.find(w => w.name.toLowerCase().trim() === nombreBusqueda);

    // 2. Si NO es exacta, buscamos sugerencias
    if (!waifuData) {
        const mapeoSimilitud = todasWaifus.map(w => ({
            data: w,
            distancia: calcularSimilitud(nombreBusqueda, w.name.toLowerCase())
        }));

        // Filtramos por cercanía o si el nombre contiene la palabra
        const sugerencias = mapeoSimilitud
            .filter(res => res.distancia <= 3 || res.data.name.toLowerCase().includes(nombreBusqueda))
            .sort((a, b) => a.distancia - b.distancia)
            .slice(0, 3); // Límite de 3 sugerencias

        if (sugerencias.length > 0) {
            let sugerenciasTxt = `🤔 ¿Quizás quisiste decir?:\n\n`;
            sugerencias.forEach((s, i) => {
                sugerenciasTxt += `${i + 1}. *${s.data.name}* (de ${s.data.anime})\n`;
            });
            sugerenciasTxt += `\n_Escribe el nombre exacto de la lista._`;
            return m.reply(sugerenciasTxt);
        } else {
            return m.reply(`❌ No encontré ninguna waifu parecida a "${text}".`);
        }
    }

    // LÓGICA DE EJECUCIÓN (Solo llega aquí si waifuData fue exacta)
    const esEspecial = waifusEspeciales.some(w => w.name === waifuData.name);
    const carpeta = esEspecial ? 'waifus especiales' : 'waifus';
    const imagenBuffer = buscarImagenReal(carpeta, waifuData.file);

    if (command === 'buscar') {
        let dueñoID = Object.keys(db.usuarios).find(id => 
            db.usuarios[id].esposas.some(e => e.toLowerCase() === waifuData.name.toLowerCase())
        );

        const txtBase = dueñoID 
            ? (dueñoID === usuarioID ? `💍 **${waifuData.name}** es tu esposa.` : `🕵️ **${waifuData.name}** es esposa de **${db.usuarios[dueñoID].nombre}** (@${dueñoID.split('@')[0]}).`)
            : `✅ **${waifuData.name}** está soltera.`;

        if (imagenBuffer) return conn.sendMessage(m.chat, { image: imagenBuffer, caption: txtBase, mentions: dueñoID ? [dueñoID] : [] }, { quoted: m });
        return m.reply(txtBase, null, { mentions: dueñoID ? [dueñoID] : [] });
    }

    if (command === 'robar') {
        if (datosUser.esposas.length < 1) return m.reply(`🚫 Necesitas al menos una esposa para robar.`);
        if (datosUser.cooldownRobo && ahora < datosUser.cooldownRobo) {
            const restante = Math.ceil((datosUser.cooldownRobo - ahora) / 60000);
            return m.reply(`⏳ Espera **${restante} min**.`);
        }

        let dueñoID = Object.keys(db.usuarios).find(id => 
            db.usuarios[id].esposas.some(e => e.toLowerCase() === waifuData.name.toLowerCase())
        );

        if (!dueñoID) return m.reply(`❌ **${waifuData.name}** no tiene dueño.`);
        if (dueñoID === usuarioID) return m.reply(`🤔 Es tu propia esposa...`);

        datosUser.cooldownRobo = ahora + (5 * 60 * 1000); 
        const azar = Math.random();

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
            return m.reply(`⚡ ¡EL TIRO TE SALIÓ POR LA CULATA! Tu esposa **${seVa}** te dejó por infiel. 🤡`);
        } else { 
            fs.writeFileSync(dataPath, JSON.stringify(db, null, 2));
            const capFallo = `👮 **${waifuData.name}** rechazó tus intenciones.`;
            if (imagenBuffer) return conn.sendMessage(m.chat, { image: imagenBuffer, caption: capFallo }, { quoted: m });
            return m.reply(capFallo);
        }
    }
};

handler.command = /^(robar|buscar)$/i;
export default handler;