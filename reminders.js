const fs = require('fs');
const REMINDERS_FILE = 'reminders.json';

function loadReminders() {
  try {
    return JSON.parse(fs.readFileSync(REMINDERS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveReminders(reminders) {
  fs.writeFileSync(REMINDERS_FILE, JSON.stringify(reminders, null, 2));
}

function addReminder({ title, date, time }) {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);

  // Красноярск = UTC+7
  const eventTimestamp = Date.UTC(year, month - 1, day, hour - 7, minute);
  const notifyTimestamp = eventTimestamp - 15 * 60 * 1000; // за 15 минут

  const reminders = loadReminders();
  reminders.push({
    id: Date.now().toString(),
    title,
    date,
    time,
    notifyTimestamp,
    eventTimestamp,
    notified: false,
  });
  saveReminders(reminders);
}

function startScheduler(bot, chatId) {
  setInterval(() => {
    const reminders = loadReminders();
    const now = Date.now();
    let changed = false;

    reminders.forEach((r) => {
      if (!r.notified && now >= r.notifyTimestamp) {
        bot.telegram.sendMessage(
          chatId,
          `🔔 Напоминание через 15 минут:\n📌 ${r.title}\n🕐 ${r.time}`
        );
        r.notified = true;
        changed = true;
      }
    });

    const fresh = reminders.filter((r) => now - r.eventTimestamp < 24 * 60 * 60 * 1000);

    if (changed || fresh.length !== reminders.length) {
      saveReminders(fresh);
    }
  }, 60 * 1000);
}

module.exports = { addReminder, startScheduler };