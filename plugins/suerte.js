import fs from 'fs';

// Memoria para no repetir personas en las predicciones
let historialSuerte = {};

const handler = async (m, { conn, usedPrefix, command }) => {
    const esGrupo = m.chat.endsWith('@g.us');
    if (!esGrupo) return m.reply('*⚠️ Este comando solo se puede usar dentro de un grupo.*');

    try {
        const groupMetadata = await conn.groupMetadata(m.chat);
        const participants = groupMetadata.participants.map(u => u.id);
        
        if (!historialSuerte[m.chat]) historialSuerte[m.chat] = [];

        // Filtramos para buscar gente que no haya salido recientemente
        let disponibles = participants.filter(u => !historialSuerte[m.chat].includes(u));
        
        // Si ya casi todos salieron, reiniciamos la memoria
        if (disponibles.length < 2) {
            historialSuerte[m.chat] = [];
            disponibles = participants;
        }

        // Mezclamos y elegimos a la "víctima" al azar
        let randomUsers = disponibles.sort(() => 0.5 - Math.random());
        let u1 = randomUsers[0]; // Usuario aleatorio del grupo

        // Guardamos en el historial para la rotación
        historialSuerte[m.chat].push(u1);

        const frases = [
            // Predicciones que involucran a otro usuario
             "🔮 @[user] te debe unas papas y no te las va a pagar.",
        "🔮 @[user] te va a invitar una coca bien fría mañana.",
        "🔮 El destino dice: @[user] es tu alma gemela en secreto.",
        "🔮 @[user] se va a besar contigo detras de la plaza .",
        "🔮 La cola de @[user] es tuya ahora.",
        "🔮 ¡Cuidado! @[user] te está vigilando mientras duermes. 👁️👄👁️",
        "🔮 Tu próxima waifu será idéntica a @[user].",
        "🔮 @[user] se va a vestir de femboy solo para ti.",
        "🔮 @[user] esta debajo de tu cama esperando a que te duermas.",
        "🔮 @[user] te esta invitando a ir al monte.",
        "🔮 @[user] te va a dar una de sus tangas.",
        "🔮 @[user] tiene camaras en tu casa .",

            
            // Predicciones individuales (para quien usa el comando)
            "🔮 Hoy te vas a encontrar un billete de 100 en el pantalón.",
        "🔮 Tu suerte es tan mala que hoy hasta el wifi se va a burlar de ti.",
        "🔮 El horóscopo dice: Hoy es un buen día para no bañarte.",
        "🔮 Te va a ir muy bien, pero solo si no sales de tu cama.",
        "🔮 Bañate cochino.",
        "🔮 Mejor ven y prueba tu suerte en mi cama",
        "🔮 Hoy te violara un negro.",
        "🔮 Hoy te van a dar como cajon que no cierra.",
        "🔮 El horóscopo dice: Es probable que te conviertas en admin.",
        "🔮 Peter te tiene que dar un premio pideselo.",
        "🔮 Enrique te va a dar unas buenas chupadas de pinga.",
        "🔮 Un femboy llegara a tu vida.",
        ];

        let frase = frases[Math.floor(Math.random() * frases.length)];
        
        // Reemplazamos @[user] por la mención del usuario aleatorio
        // Si la frase no tiene @[user], simplemente se envía la frase individual
        let textoFinal = frase.replace('@[user]', `@${u1.split('@')[0]}`);

        await conn.sendMessage(m.chat, { 
            text: textoFinal, 
            mentions: [u1] 
        }, { quoted: m });

    } catch (e) {
        console.error("Error en suerte.js:", e);
        m.reply('*❌ Hubo un error al leer las estrellas.*');
    }
};

handler.command = /^(suerte|prediccion)$/i;
handler.group = true;

export default handler;