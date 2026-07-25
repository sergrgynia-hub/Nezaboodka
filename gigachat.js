require('dotenv').config();
const axios = require('axios');
const https = require('https');
const { v4: uuidv4 } = require('uuid');

// Вставь сюда свой ключ из "Авторизационные данные"
const GIGACHAT_AUTH_KEY = process.env.GIGACHAT_AUTH_KEY;

// Временно отключаем строгую проверку сертификата (для теста).
// Позже разберём, как поставить сертификат Минцифры и убрать это.
const agent = new https.Agent({ rejectUnauthorized: false });

let accessToken = null;
let tokenExpiresAt = 0;

async function getToken() {
  if (accessToken && Date.now() < tokenExpiresAt) {
    return accessToken;
  }

  const response = await axios.post(
    'https://ngw.devices.sberbank.ru:9443/api/v2/oauth',
    'scope=GIGACHAT_API_PERS',
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'RqUID': uuidv4(),
        'Authorization': `Basic ${GIGACHAT_AUTH_KEY}`,
      },
      httpsAgent: agent,
    }
  );

  accessToken = response.data.access_token;
  tokenExpiresAt = Date.now() + 25 * 60 * 1000; // обновляем каждые 25 минут
  return accessToken;
}

async function askGigaChat(userMessage) {
  const token = await getToken();
  const now = new Date();
  const todayDateTime = now.toLocaleString('sv-SE', { timeZone: 'Asia/Krasnoyarsk' }).slice(0, 16);

  const response = await axios.post(
    'https://gigachat.devices.sberbank.ru/api/v1/chat/completions',
    {
      model: 'GigaChat',
      messages: [
        {
          role: 'system',
          content: `Ты ассистент, который извлекает из сообщений пользователя данные о встречах и событиях. Текущая дата и время: ${todayDateTime}. Если пользователь говорит "через час", "через 30 минут" и т.п. — вычисляй точное время события от текущего момента. Если пользователь просит поставить/создать/запланировать событие — всегда вызывай функцию create_calendar_event.`,
        },
        { role: 'user', content: userMessage },
      ],
      functions: [
        {
          name: 'create_calendar_event',
          description: 'Создаёт событие в календаре пользователя',
          parameters: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Название события' },
              date: { type: 'string', description: 'Дата события в формате YYYY-MM-DD' },
              time: { type: 'string', description: 'Время события в формате HH:MM' },
            },
            required: ['title', 'date', 'time'],
          },
        },
      ],
      function_call: 'auto',
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      httpsAgent: agent,
    }
  );

  return response.data.choices[0].message;
}

module.exports = { askGigaChat };