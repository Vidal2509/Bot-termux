import fs from 'fs';
import path from 'path';

const dataPath = './database/matrimonios.json';

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
    const usuarioID = m.participant || m.key.participant || m.sender || m.remoteJid;

    if (!fs.existsSync(dataPath)) return m.reply('📑 No hay registros.');
    let db = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    
    if (!db.usuarios[usuarioID]) db.usuarios[usuarioID] = { nombre: m.pushName || 'Usuario', esposas: [], cooldownRobo: 0 };

    if (!text) return m.reply(`🎤 Escribe el nombre de una waifu o de un anime.\nEjemplo: ${usedPrefix + command} Asuka  O  ${usedPrefix + command} One Piece`);
    
    const nombreBusqueda = text.trim().toLowerCase();
    const waifusNormales = cargarLista('waifus.js');
    const waifusEspeciales = cargarLista('waifus_especiales.js');
    const todasWaifus = [...waifusNormales, ...waifusEspeciales];

    if (command === 'buscar') {
        // --- CASO 1: BÚSQUEDA POR ANIME PRIMERO (SOLO TEXTO, SIN FOTO) ---
        const waifusDelAnime = todasWaifus.filter(w => w.anime && w.anime.toLowerCase().includes(nombreBusqueda));

        if (waifusDelAnime.length > 0) {
            const nombreAnimeOficial = waifusDelAnime[0].anime;
            let respuestaAnime = `🌸 **Waifus encontradas en "${nombreAnimeOficial}"** (${waifusDelAnime.length}):\n\n`;
            
            waifusDelAnime.forEach((w, index) => {
                let dueñoID = Object.keys(db.usuarios).find(id => 
                    db.usuarios[id].esposas && db.usuarios[id].esposas.some(e => e.toLowerCase() === w.name.toLowerCase())
                );
                
                let estado = dueñoID ? `💍 (${db.usuarios[dueñoID].nombre || 'Dueño'})` : `✅ Soltera`;
                respuestaAnime += `${index + 1}. **${w.name}** - ${estado}\n`;
            });

            return m.reply(respuestaAnime);
        }

        // --- CASO 2: BÚSQUEDA POR WAIFU INDIVIDUAL (CON FOTO) ---
        let waifuData = todasWaifus.find(w => w.name.toLowerCase().trim() === nombreBusqueda);

        if (!waifuData) {
            const mapeoSimilitud = todasWaifus.map(w => ({
                data: w,
                distancia: calcularSimilitud(nombreBusqueda, w.name.toLowerCase())
            }));
            const sugerencias = mapeoSimilitud
                .filter(res => res.distancia <= 3 || res.data.name.toLowerCase().includes(nombreBusqueda))
                .sort((a, b) => a.distancia - b.distancia)
                .slice(0, 3);

            if (sugerencias.length > 0) {
                let sugerenciasTxt = `🤔 ¿Quizás quisiste decir?:\n\n`;
                sugerencias.forEach((s, i) => { sugerenciasTxt += `${i + 1}. *${s.data.name}* (de ${s.data.anime})\n`; });
                return m.reply(sugerenciasTxt + `\n_Escribe el nombre exacto._`);
            } else {
                return m.reply(`❌ No encontré ninguna waifu ni ningún anime con el nombre "${text}".`);
            }
        }

        const esEspecial = waifusEspeciales.some(w => w.name === waifuData.name);
        const carpeta = esEspecial ? 'waifus especiales' : 'waifus';
        const imagenBuffer = buscarImagenReal(carpeta, waifuData.file);

        let dueñoID = Object.keys(db.usuarios).find(id => 
            db.usuarios[id].esposas.some(e => e.toLowerCase() === waifuData.name.toLowerCase())
        );

        const txtBase = dueñoID 
            ? (dueñoID === usuarioID ? `💍 **${waifuData.name}** es tu esposa.` : `🕵️ **${waifuData.name}** es esposa de **${db.usuarios[dueñoID].nombre}** (@${dueñoID.split('@')[0]}).`)
            : `✅ **${waifuData.name}** está soltera.\n🎥 Anime: *${waifuData.anime}*`;

        // Si es individual, sí manda la foto (imagenBuffer)
        if (imagenBuffer) {
            return conn.sendMessage(m.chat, { image: imagenBuffer, caption: txtBase, mentions: dueñoID ? [dueñoID] : [] }, { quoted: m });
        }
        return m.reply(txtBase, null, { mentions: dueñoID ? [dueñoID] : [] });
    }
};

handler.command = /^(buscar|search)$/i;
export default handler;