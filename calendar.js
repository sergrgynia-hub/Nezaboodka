const fs = require('fs');
const { google } = require('googleapis');

const credentials = process.env.GOOGLE_CREDENTIALS
  ? JSON.parse(process.env.GOOGLE_CREDENTIALS)
  : JSON.parse(fs.readFileSync('credentials.json'));
const { client_secret, client_id, redirect_uris } = credentials.installed;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

const token = process.env.GOOGLE_TOKEN
  ? JSON.parse(process.env.GOOGLE_TOKEN)
  : JSON.parse(fs.readFileSync('token.json'));
oAuth2Client.setCredentials(token);

const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

async function createCalendarEvent({ title, date, time }) {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);

  // Красноярск = UTC+7 круглый год, без перехода на летнее время
  const utcMs = Date.UTC(year, month - 1, day, hour - 7, minute);
  const startDate = new Date(utcMs);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  const event = {
    summary: title,
    start: { dateTime: startDate.toISOString(), timeZone: 'Asia/Krasnoyarsk' },
    end: { dateTime: endDate.toISOString(), timeZone: 'Asia/Krasnoyarsk' },
  };

  const response = await calendar.events.insert({
    calendarId: 'primary',
    resource: event,
  });

  return response.data.htmlLink;
}

module.exports = { createCalendarEvent };