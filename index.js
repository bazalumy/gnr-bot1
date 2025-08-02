const { Client, GatewayIntentBits, Partials } = require('discord.js');
const express = require('express');
const app = express();

const TOKEN = process.env.TOKEN;

const PROMO_CHANNEL = 'registo-promocoes';
const DESPROMO_CHANNEL = 'registo-despromocoes';
const LOG_CHANNEL = 'registo-entradas-saidas';

const hierarchy = [
  'Recruta', 'Guarda', 'Cabo', 'Sargento',
  'Alferes', 'Tenente', 'Capitão',
  'Tenente-Coronel', 'General-Comandante'
];

const mensagensPromocao = [
  `🆙 {user} subiu de patente! Passou de **{de}** para **{para}**! Parabéns, recruta exemplar!`,
  `🎖️ Promoção aprovada: {user} agora é **{para}** (antes era **{de}**)! Orgulho nacional!`,
  `📈 {user} foi reconhecido pelo bom serviço e promovido para **{para}**!`,
  `🔝 Subida autorizada: {user} agora é **{para}**! Continuar assim, soldado!`,
  `✨ {user} escalou mais um degrau na hierarquia: de **{de}** para **{para}**! 👏`
];

const mensagensDespromocao = [
  `📉 {user} foi despromovido de **{de}** para **{para}**. É preciso rever a conduta!`,
  `⚠️ Atenção: {user} desceu de patente. Novo cargo: **{para}**.`,
  `🔻 {user} perdeu o posto de **{de}**. Foi transferido para o cargo de **{para}**.`,
  `🪓 Decisão disciplinar: {user} agora é **{para}**. Esperamos evolução.`,
  `🚫 {user} despromovido. De **{de}** para **{para}** — manter foco e disciplina.`
];

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

client.once('ready', () => {
  console.log(`🤖 Bot ligado como ${client.user.tag}`);
});

client.on('guildMemberAdd', member => {
  const canal = member.guild.channels.cache.find(c => c.name === LOG_CHANNEL && c.isTextBased());
  if (canal) canal.send(`👮‍♂️ Bem-vindo à GNR, ${member.user.tag}!`);
});

client.on('guildMemberRemove', member => {
  const canal = member.guild.channels.cache.find(c => c.name === LOG_CHANNEL && c.isTextBased());
  if (canal) canal.send(`🚪 ${member.user.tag} abandonou o posto na GNR.`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  const args = message.content.trim().split(/ +/g);
  const comando = args[0].toLowerCase();
  const membro = message.mentions.members.first();

  const promoChan = message.guild.channels.cache.find(c => c.name === PROMO_CHANNEL && c.isTextBased());
  const despromoChan = message.guild.channels.cache.find(c => c.name === DESPROMO_CHANNEL && c.isTextBased());

  if (!['!promover', '!despromover'].includes(comando)) return;
  if (!membro) return message.reply('❗ Tens de mencionar um utilizador.');

  const idx = hierarchy.findIndex(rank =>
    membro.roles.cache.some(r => r.name.toLowerCase() === rank.toLowerCase())
  );

  const currentRole = message.guild.roles.cache.find(r =>
    r.name.toLowerCase() === hierarchy[idx]?.toLowerCase()
  );

  if (comando === '!promover') {
    if (idx === hierarchy.length - 1) return message.reply('⚠️ Já está no cargo mais alto.');
    const nextRole = message.guild.roles.cache.find(r =>
      r.name.toLowerCase() === hierarchy[idx + 1].toLowerCase()
    );
    if (!nextRole) return message.reply('❌ Cargo seguinte não encontrado.');

    if (currentRole) await membro.roles.remove(currentRole);
    await membro.roles.add(nextRole);

    const texto = mensagensPromocao[Math.floor(Math.random() * mensagensPromocao.length)]
      .replace('{user}', membro)
      .replace('{de}', currentRole?.name || 'nenhum')
      .replace('{para}', nextRole.name);

    if (promoChan) promoChan.send(texto);
    message.reply(`✅ ${membro} promovido com sucesso.`);
  }

  if (comando === '!despromover') {
    if (idx <= 0) return message.reply('⚠️ Já está no cargo mais baixo.');
    const prevRole = message.guild.roles.cache.find(r =>
      r.name.toLowerCase() === hierarchy[idx - 1].toLowerCase()
    );
    if (!prevRole) return message.reply('❌ Cargo anterior não encontrado.');

    if (currentRole) await membro.roles.remove(currentRole);
    await membro.roles.add(prevRole);

    const texto = mensagensDespromocao[Math.floor(Math.random() * mensagensDespromocao.length)]
      .replace('{user}', membro)
      .replace('{de}', currentRole?.name || 'nenhum')
      .replace('{para}', prevRole.name);

    if (despromoChan) despromoChan.send(texto);
    message.reply(`✅ ${membro} despromovido com sucesso.`);
  }
});

client.login(TOKEN);

app.get('/', (req, res) => {
  res.send('Bot GNR está vivo!');
});
app.listen(3000, () => {
  console.log('🌐 Servidor web ativo para manter o bot online.');
});