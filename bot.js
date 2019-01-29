const { Client, Util } = require('discord.js');
const { TOKEN, PREFIX, GOOGLE_API_KEY } = require('./config');
const YouTube = require('simple-youtube-api');
const ytdl = require('ytdl-core');

const client = new Client({ disableEveryone: true });

const youtube = new YouTube(GOOGLE_API_KEY);

const queue = new Map();

client.on('warn', console.warn);

client.on('error', console.error);

client.on('ready', () => console.log('Hazır!'));

client.on('disconnect', () => console.log('Bağlantım koptu ama merak etme hemen bağlanacağım.'));

client.on('reconnecting', () => console.log('Yeniden bağlandım!'));

client.on('message', async msg => { // eslint-disable-line
	if (msg.author.bot) return undefined;
	if (!msg.content.startsWith(PREFIX)) return undefined;

	const args = msg.content.split(' ');
	const searchString = args.slice(1).join(' ');
	const url = args[1] ? args[1].replace(/<(.+)>/g, '$1') : '';
	const serverQueue = queue.get(msg.guild.id);

	let command = msg.content.toLowerCase().split(' ')[0];
	command = command.slice(PREFIX.length)

	if (command === 'çal') {
		const voiceChannel = msg.member.voiceChannel;
		if (!voiceChannel) return msg.channel.send('Müzik veya şarkı çalmam için bir ses kanalına bağlanmalısın yoksa beni nasıl duyacaksın???');
		const permissions = voiceChannel.permissionsFor(msg.client.user);
		if (!permissions.has('CONNECT')) {
			return msg.channel.send('Şuan üzüldüm çünkü müzik kanalına bağlanamadım beni bağlayacak yetkin olmayabilir bir üstün gelsin bekliyorum!');
		}
		if (!permissions.has('SPEAK')) {
			return msg.channel.send('Şarkı veya müzik hep bunu belirtiyorum neyse çalamadım bir üstün gelsin yetkin yok yetkin!');
		}

		if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
			const playlist = await youtube.getPlaylist(url);
			const videos = await playlist.getVideos();
			for (const video of Object.values(videos)) {
				const video2 = await youtube.getVideoByID(video.id); // eslint-disable-line no-await-in-loop
				await handleVideo(video2, msg, voiceChannel, true); // eslint-disable-line no-await-in-loop
			}
			return msg.channel.send(`✅ Şarkı veya müzik çalma listesi: **${playlist.title}** eklendi!`);
		} else {
			try {
				var video = await youtube.getVideo(url);
			} catch (error) {
				try {
					var videos = await youtube.searchVideos(searchString, 10);
					let index = 0;
					msg.channel.send(`
__**Şarkı veya müzik seç:**__
${videos.map(video2 => `**${++index} -** ${video2.title}`).join('\n')}
Listeden seç işte uzattırma.
					`);
					// eslint-disable-next-line max-depth
					try {
						var response = await msg.channel.awaitMessages(msg2 => msg2.content > 0 && msg2.content < 11, {
							maxMatches: 1,
							time: 10000,
							errors: ['time']
						});
					} catch (err) {
						console.error(err);
						return msg.channel.send('Hadi çabuk söyle ne çalayım??');
					}
					const videoIndex = parseInt(response.first().content);
					var video = await youtube.getVideoByID(videos[videoIndex - 1].id);
				} catch (err) {
					console.error(err);
					return msg.channel.send('🆘 Olmayan bir şarkı ismi garipsin olmayan bir şeyi nasıl çalacağım???.');
				}
			}
			return handleVideo(video, msg, voiceChannel);
		}
	} else if (command === 'geç') {
		if (!msg.member.voiceChannel) return msg.channel.send('Bir ses kanalında değilsin kör müsün?!');
		if (!serverQueue) return msg.channel.send('Atlayacak bir şarkı veya müzik yok nasıl atlayayım uzun atlama mı kısa atlama mı?.');
		serverQueue.connection.dispatcher.end('Geç komutu zaten kullanıldı ne iş?');
		return undefined;
	} else if (command === 'dur') {
		if (!msg.member.voiceChannel) return msg.channel.send('Ses kanalında değilsin nasıl durdurayım be!');
		if (!serverQueue) return msg.channel.send('Çalan bir müzik veya şarkı yok ki durdurayım.');
		serverQueue.songs = [];
		serverQueue.connection.dispatcher.end('Dur komutu zaten kullanıldı bıktım be!');
		return undefined;
	} else if (command === 'ses') {
		if (!msg.member.voiceChannel) return msg.channel.send('Ses kanalında değilsin!');
		if (!serverQueue) return msg.channel.send('Çalmıyor çalmıyor çalmıyor of be.');
		if (!args[1]) return msg.channel.send(`Şu anki ses: **${serverQueue.volume}**`);
		serverQueue.volume = args[1];
		serverQueue.connection.dispatcher.setVolumeLogarithmic(args[1] / 5);
		return msg.channel.send(`Sesi ayarlayayım: **${args[1]}**`);
	} else if (command === 'çalan') {
		if (!serverQueue) return msg.channel.send('Hırsız.');
		return msg.channel.send(`🎶 Şuan çalan şarkı veya müzik: **${serverQueue.songs[0].title}**`);
	} else if (command === 'sıra') {
		if (!serverQueue) return msg.channel.send('Ekmek sırası fırında hayde yallah.');
		return msg.channel.send(`
__**Şarkı veya müzik sırası:**__
${serverQueue.songs.map(song => `**-** ${song.title}`).join('\n')}
**Şuan çalan şarkı veya müzik:** ${serverQueue.songs[0].title}
		`);
	} else if (command === 'durdur') {
		if (serverQueue && serverQueue.playing) {
			serverQueue.playing = false;
			serverQueue.connection.dispatcher.pause();
			return msg.channel.send('⏸ Müzik veya şarkı durduruldu mutlu musun sanata engel olmayın -Etem.');
		}
		return msg.channel.send('Çalan bir şey yok.');
	} else if (command === 'devam') {
		if (serverQueue && !serverQueue.playing) {
			serverQueue.playing = true;
			serverQueue.connection.dispatcher.resume();
			return msg.channel.send('▶ Müzik veya şarkı devam ediyor!');
		}
		return msg.channel.send('Çalan şey çalmıyor işte ne yapayım.');
	}

	return undefined;
});

async function handleVideo(video, msg, voiceChannel, playlist = false) {
	const serverQueue = queue.get(msg.guild.id);
	console.log(video);
	const song = {
		id: video.id,
		title: Util.escapeMarkdown(video.title),
		url: `https://www.youtube.com/watch?v=${video.id}`
	};
	if (!serverQueue) {
		const queueConstruct = {
			textChannel: msg.channel,
			voiceChannel: voiceChannel,
			connection: null,
			songs: [],
			volume: 5,
			playing: true
		};
		queue.set(msg.guild.id, queueConstruct);

		queueConstruct.songs.push(song);

		try {
			var connection = await voiceChannel.join();
			queueConstruct.connection = connection;
			play(msg.guild, queueConstruct.songs[0]);
		} catch (error) {
			console.error(`Ses kanalına bağlanamadım ağlayayım mı: ${error}`);
			queue.delete(msg.guild.id);
			return msg.channel.send(`Ses kanalına bağlanamadım: ${error}`);
		}
	} else {
		serverQueue.songs.push(song);
		console.log(serverQueue.songs);
		if (playlist) return undefined;
		else return msg.channel.send(`✅ **${song.title}** çalma sırasına eklendi!`);
	}
	return undefined;
}

function play(guild, song) {
	const serverQueue = queue.get(guild.id);

	if (!song) {
		serverQueue.voiceChannel.leave();
		queue.delete(guild.id);
		return;
	}
	console.log(serverQueue.songs);

	const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
		.on('end', reason => {
			if (reason === 'Çalan şeyin hızı yeterince yetmiyor.') console.log('Şarkı veya müzik bitti.');
			else console.log(reason);
			serverQueue.songs.shift();
			play(guild, serverQueue.songs[0]);
		})
		.on('error', error => console.error(error));
	dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);

	serverQueue.textChannel.send(`🎶 Müzik veya şarkı çalmaya başladı: **${song.title}**`);
}

client.login(TOKEN);
