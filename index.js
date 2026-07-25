require('dotenv').config();
const { createCalendarEvent } = require('./calendar');
const { Telegraf } = require('telegraf');
const { askGigaChat } = require('./gigachat');

const token = process.env.TELEGRAM_TOKEN;
console.log('ЖЖЖ_ПРОВЕРКА_12345', 'длина:', token ? token.length : 'НЕТ ТОКЕНА', 'значение:', JSON.stringify(token));
const bot = new Telegraf(token);

bot.on('text', async (ctx) => {
  const text = ctx.message.text;
  console.log(`Пришло сообщение: ${text}`);

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
});

bot.launch().catch((err) => {
  console.error('ОШИБКА ЗАПУСКА БОТА:', err.message);
  console.error('Токен (длина):', token ? token.length : 'НЕТ ТОКЕНА');
  console.error('Токен (значение):', JSON.stringify(token));
});
console.log('Бот запущен и слушает сообщения...');

// Корректное завершение при Control+C
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));