const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];
const credentials = JSON.parse(fs.readFileSync('credentials.json'));
const { client_secret, client_id, redirect_uris } = credentials.installed;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

const authUrl = oAuth2Client.generateAuthUrl({ access_type: 'offline', scope: SCOPES, prompt: 'consent' });

console.log('\nОткрой ссылку, разреши доступ, вставь код:\n');
console.log(authUrl);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('\nКод: ', (code) => {
  rl.close();
  oAuth2Client.getToken(code, (err, token) => {
    if (err) return console.error('Ошибка:', err);
    fs.writeFileSync('token.json', JSON.stringify(token));
    console.log('\n✅ Готово! Новый token.json сохранён.');
    console.log('\nТеперь скопируй содержимое ниже и вставь в переменную GOOGLE_TOKEN на Railway:\n');
    console.log(JSON.stringify(token));
  });
});