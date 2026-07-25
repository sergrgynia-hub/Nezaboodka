const fs = require('fs');
const { google } = require('googleapis');

const credentials = JSON.parse(fs.readFileSync('credentials.json'));
const { client_secret, client_id, redirect_uris } = credentials.installed;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

const token = JSON.parse(fs.readFileSync('token.json'));
oAuth2Client.setCredentials(token);

const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

async function createCalendarEvent({ title, date, time }) {
  const startDate = new Date(`${date}T${time}:00`);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // +1 час по умолчанию

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