const axios = require('axios');

async function recognizeSpeech(audioBuffer) {
  const response = await axios.post(
    'https://stt.api.cloud.yandex.net/speech/v1/stt:recognize?lang=ru-RU&format=oggopus',
    audioBuffer,
    {
      headers: {
        'Authorization': `Api-Key ${process.env.YANDEX_API_KEY}`,
        'Content-Type': 'application/octet-stream',
      },
    }
  );
  return response.data.result;
}

module.exports = { recognizeSpeech };