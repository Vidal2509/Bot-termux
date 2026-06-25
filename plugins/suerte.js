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

        let disponibles = participants.filter(u => !historialSuerte[m.chat].includes(u));
        
        if (disponibles.length < 2) {
            historialSuerte[m.chat] = [];
            disponibles = participants;
        }

        let randomUsers = disponibles.sort(() => 0.5 - Math.random());
        let u1 = randomUsers[0]; 

        historialSuerte[m.chat].push(u1);

        // --- LÓGICA DE PROBABILIDAD (2%) ---
        let frase = "";
        const suerteAdmin = Math.floor(Math.random() * 100) + 1; // Número del 1 al 100

        if (suerteAdmin <= 2) {
            // Este es el 2% de probabilidad
            frase = "🔮 Peter te tiene que dar un premio pideselo.";
        } else {
            // El otro 98% de las veces elige una de estas
            const frasesComunes = [
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
                "🔮 Hoy te vas a encontrar un billete de 100 en el pantalón.",
                "🔮 Tu suerte es tan mala que hoy hasta el wifi se va a burlar de ti.",
                "🔮 El horóscopo dice: Hoy es un buen día para no bañarte.",
                "🔮 Te va a ir muy bien, pero solo si no sales de tu cama.",
                "🔮 Bañate cochino.",
                "🔮 Mejor ven y prueba tu suerte en mi cama",
                "🔮 Hoy te violara un negro.",
                "🔮 Hoy te van a dar como cajon que no cierra.",
                "🔮 El horóscopo dice: Es probable que te conviertas en admin.",
                "🔮 Enrique te va a dar unas buenas chupadas de pinga.",
                "🔮 Un femboy llegara a tu vida.",
                "🔮 @[user] te está vigilando desde la ventana del vecino ahora mismo." ,
                "🔮 @[user] sabe exactamente qué hiciste anoche a las 3:00 AM.",
                "🔮 @[user] te va a jalar las patas esta noche si no le mandas un DM.",
                "🔮 @[user] ya compró la pala y las bolsas negras... tú sabrás si aceptas su invitación.",
                "🔮 @[user] se esconde en tu clóset y respira muy fuerte.",
                "🔮 @[user] te va a mandar un audio susurrando cosas cochinas esta noche.",
                "🔮 @[user] compró lencería fina y está esperando a que le preguntes si te gusta.",
                "🔮 @[user] se va a poner una falda de maid solo para limpiar tu desorden.",
                "🔮 @[user] está planeando robarte un beso en el próximo stream.",
                "🔮 @[user] quiere que lo/la domines, pero le da pena decírtelo."
            ];
            frase = frasesComunes[Math.floor(Math.random() * frasesComunes.length)];
        }
        
        // Reemplazamos menciones
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