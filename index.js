require('dotenv').config();
const axios = require('axios');
const { createCalendarEvent } = require('./calendar');
const { Telegraf } = require('telegraf');
const { askGigaChat } = require('./gigachat');
const { recognizeSpeech } = require('./speech');

const token = process.env.TELEGRAM_TOKEN;
const bot = new Telegraf(token);

const MY_ID = process.env.MY_TELEGRAM_ID;

bot.use((ctx, next) => {
  if (String(ctx.from.id) !== MY_ID) {
    console.log('Заблокирован чужой пользователь:', ctx.from.id, ctx.from.username);
    return ctx.reply('Извини, этот бот приватный 🙏');
  }
  return next();
});

async function processMessage(ctx, text) {
  console.log(`Обрабатываю сообщение: ${text}`);

  try {
    const reply = await askGigaChat(text);

    if (reply.function_call) {
      const args = typeof reply.function_call.arguments === 'string'
        ? JSON.parse(reply.function_call.arguments)
        : reply.function_call.arguments;

      console.log('Данные события:', args);

      const eventLink = await createCalendarEvent(args);

      await ctx.reply(
        `Готово! Событие создано:\n📌 ${args.title}\n📅 ${args.date}\n🕐 ${args.time}\n\n🔗 ${eventLink}`
      );
    } else {
      await ctx.reply(reply.content);
    }
  } catch (error) {
    const status = error.response?.status;
    console.error('Ошибка:', error.response?.data || error.message);

    if (status === 429) {
      await ctx.reply('Секунду, я ещё думаю над прошлым сообщением — подожди чуть-чуть и повтори 🙏');
    } else {
      await ctx.reply('Упс, что-то пошло не так 😔');
    }
  }
}

bot.on('text', async (ctx) => {
  await processMessage(ctx, ctx.message.text);
});

bot.on('voice', async (ctx) => {
  try {
    await ctx.reply('🎙️ Распознаю голосовое...');

    const fileLink = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
    const audioResponse = await axios.get(fileLink.href, { responseType: 'arraybuffer' });

    const text = await recognizeSpeech(audioResponse.data);
    console.log('Распознанный текст:', text);

    await processMessage(ctx, text);
  } catch (error) {
    console.error('Ошибка распознавания:', error.response?.data || error.message);
    await ctx.reply('Не смог разобрать голосовое сообщение 😔');
  }
});

bot.launch().catch((err) => {
  console.error('ОШИБКА ЗАПУСКА БОТА:', err.message);
});
console.log('Бот запущен и слушает сообщения...');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));