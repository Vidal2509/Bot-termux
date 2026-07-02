const handler = async (m, { conn, args }) => {

    if (!args.length)
        return m.reply("Uso: .pin megumin");

    const tag = args.join("_");

    const url = `https://danbooru.donmai.us/posts.json?tags=${tag}+rating:safe&limit=20`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.length)
        return m.reply("No encontré imágenes.");

    const post = data[Math.floor(Math.random() * data.length)];

    const image = post.file_url;

    await conn.sendMessage(m.chat, {
        image: { url: image },
        caption: `✨ ${args.join(" ")}`
    }, { quoted: m });

};

handler.command = /^pin$/i;

export default handler;