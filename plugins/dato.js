// Memoria para no repetir chismes con las mismas personas
let historialChisme = {};

const handler = async (m, { conn }) => {
    // Detectamos si es grupo revisando si el ID termina en @g.us
    const esGrupo = m.chat.endsWith('@g.us');
    
    if (!esGrupo) return m.reply('*⚠️ Este comando solo se puede usar dentro de un grupo.*');

    try {
        const groupMetadata = await conn.groupMetadata(m.chat);
        const participants = groupMetadata.participants.map(u => u.id);
        
        if (!historialChisme[m.chat]) historialChisme[m.chat] = [];

        // Filtramos para buscar gente que no haya salido recientemente
        let disponibles = participants.filter(u => !historialChisme[m.chat].includes(u));
        
        // Si ya casi todos salieron, reiniciamos la memoria de este grupo
        if (disponibles.length < 2) {
            historialChisme[m.chat] = [];
            disponibles = participants;
        }

        // Mezclamos y elegimos a las víctimas
        let randomUsers = disponibles.sort(() => 0.5 - Math.random());
        let u1 = randomUsers[0];
        let u2 = randomUsers[1] || randomUsers[0];

        // Guardamos en el historial
        historialChisme[m.chat].push(u1, u2);

        const frases = [
            "✨ @[user] es femboy, pero no lo quiere admitir.",
            "👀 Me contaron que @[user] y @[user2] son pareja en secreto.",
            "🤫 ¿Sabían que @[user] todavía duerme con la luz prendida?",
            "🔥 @[user] y @[user2] se traen ganas desde hace meses.",
            "🤡 @[user] dice que es hombre, pero siempre se besa con vagabundos",
            "🤔 @[user] es quien siempre manda fotos en tanga",
            "🤭 Se rumorea que @[user] y @[user2] se escapan juntos los fines de semana.",
            "💸 @[user] le debe dinero a medio grupo y no piensa pagar.",
            "🧼 @[user] no se bañó hoy, se nota desde aquí.",
            "📸 @[user] tiene una cuenta de fans de @[user2] en secreto.",
            "😀 @[user] tiene cuenta secreta en only fans",
            "💀 @[user] se fue a un hotel con una chica y al llegar descubrio que era hombre ",
            "😈 @[user] tiene la tanga de @[user2] pero la mantiene escondida ",
            "🤡 @[user] entro a las mensolimpiadas y gano por mucha diferencia",
            "🤩 @[user] dijo que mandaba fotos en tanga gratis",
            "😇 @[user] me dijo que si le daba waifus me daba  unas buenas chupadas de pinga",
            "😏 Dicen que @[user] borra los mensajes después de las 3 am… algo oculta.",
            "💘 @[user] mira mucho a @[user2], pero finge que no pasa nada.",
            "🕵️ Se filtró que @[user] stalkea el perfil de @[user2] todos los días.",
            "💤 @[user] dice que se duerme temprano, pero siempre está en línea a las 4 am.",
            "🍿 @[user] se sabe todos los chismes del grupo… pero nunca admite que los empezó.",
            "😳 @[user] reaccionó muy rápido al mensaje de @[user2]… sospechoso.",
            "🤨 @[user] siempre dice “yo no fui”, pero todos sabemos que sí fue.",
            "💀 @[user] jura que no stalkea, pero sabe todo lo que hace @[user2].",
            "😈 @[user] se viste de leñadora en bikini cuando nadie lo ve.",
            "🧠 a @[user] lo corrieron del rancho de su abuelo por culiarse a un caballo.",
            "🕵️ El FBI debería arrestar a @[user], por lo que tiene en su galeria.",
            "😈 @[user] jura que es buena persona… pero su historial dice otra cosa.",
            "🔥 @[user] le dio la cola a  @[user2].",
            "😳 @[user] se estaba besando con el admin atras de la plaza.",
            "✨ @[user] tiene puras lolis en su galeria.",
            "😏 Dicen que @[user] hace trabajos manuales atras de los baños.",
            "🤫 @[user] se pone los vestidos de su mama cuando esta solo ",
            "🤫 @[user] Tiene fotos de alexis vetido de femboy no se cuanto le habra pagado ",
            "😳 @[user] Tiene un dildo en su lista de deseos de mercado libre, aunque no se porque.",
            "😈 No le doy datos a geys.",
            "🔥 @[user] invito al monte a @[user2] aunque no se para que.",
            "😏 @[user] se esta haciendo una paja, lo estoy viendo por la camara de su telefono .",
            "✨ @[user] Ve my little pony..... porque se quiere coger a los ponys.",

        ];


        let frase = frases[Math.floor(Math.random() * frases.length)];
        let textoFinal = frase
            .replace('[user]', u1.split('@')[0])
            .replace('[user2]', u2.split('@')[0]);

        await conn.sendMessage(m.chat, { 
            text: textoFinal, 
            mentions: [u1, u2] 
        }, { quoted: m });

    } catch (e) {
        console.error("Error en dato.js:", e);
        m.reply('*❌ No pude obtener la lista de chismes. ¿Soy administrador?*');
    }
};

handler.command = /^(dato|chisme|curiosidad)$/i;

export default handler;