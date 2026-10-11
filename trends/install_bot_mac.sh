#!/bin/bash
# Запускає Telegram-бота TrendScout у фоні на macOS і тримає його увімкненим (launchd, KeepAlive).
#   bash trends/install_bot_mac.sh           # увімкнути (бот стартує й після перезавантаження Mac)
#   bash trends/install_bot_mac.sh --remove  # вимкнути
# Якщо токена бота або chat_id ще немає в ~/.trendscout, скрипт їх спитає.
set -e
LABEL="com.trendscout.bot"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"

if [ "$1" = "--remove" ]; then
  launchctl unload "$PLIST" 2>/dev/null || true
  rm -f "$PLIST"
  echo "Бота вимкнено."
  exit 0
fi

DIR="$(cd "$(dirname "$0")" && pwd)"
CONF="$HOME/.trendscout"
PY="$HOME/.trendscout-venv/bin/python"
if [ ! -x "$PY" ]; then
  echo "Спершу один раз запустіть trends/TrendScout.command (він встановить Python-середовище)."; exit 1
fi
touch "$CONF"; chmod 600 "$CONF"

set_var() {  # set_var ЗМІННА значення: замінює рядок у ~/.trendscout
  grep -v "^export $1=" "$CONF" > "$CONF.tmp" || true
  echo "export $1='$2'" >> "$CONF.tmp"
  mv "$CONF.tmp" "$CONF"; chmod 600 "$CONF"
}

# shellcheck disable=SC1090
source "$CONF"
if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
  echo "Потрібен токен бота від @BotFather (вигляду 123456:ABC...)."
  read -r -p "TELEGRAM_BOT_TOKEN: " TELEGRAM_BOT_TOKEN
  [ -z "$TELEGRAM_BOT_TOKEN" ] && { echo "Без токена бот не запуститься."; exit 1; }
  set_var TELEGRAM_BOT_TOKEN "$TELEGRAM_BOT_TOKEN"
fi
export TELEGRAM_BOT_TOKEN
if [ -z "$TELEGRAM_CHAT_ID" ]; then
  echo
  echo "Відкрийте свого бота в Telegram і натисніть Start (або напишіть йому /start)."
  read -r -p "Потім натисніть тут Enter… "
  if CHAT=$(cd "$DIR" && "$PY" trendscout.py --telegram-chat-id); then
    set_var TELEGRAM_CHAT_ID "$CHAT"
    echo "Чат знайдено: $CHAT"
  else
    echo "Не вдалося знайти чат. Перевірте токен і що ви написали саме цьому боту, і запустіть скрипт ще раз."; exit 1
  fi
fi

mkdir -p "$HOME/Library/LaunchAgents" "$DIR/out"
cat > "$PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key><array>
    <string>/bin/bash</string><string>-c</string>
    <string>source "\$HOME/.trendscout"; exec "\$HOME/.trendscout-venv/bin/python" -u "$DIR/tgbot.py"</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ThrottleInterval</key><integer>30</integer>
  <key>StandardOutPath</key><string>$DIR/out/bot.log</string>
  <key>StandardErrorPath</key><string>$DIR/out/bot.log</string>
</dict></plist>
PLIST

launchctl unload "$PLIST" 2>/dev/null || true
launchctl load "$PLIST"
sleep 3
tail -n 3 "$DIR/out/bot.log" 2>/dev/null || true
echo
echo "Готово: бот працює у фоні. Напишіть йому в Telegram /help."
echo "Він відповідає, поки Mac увімкнений і не спить. Лог: $DIR/out/bot.log"
