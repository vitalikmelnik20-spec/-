#!/bin/bash
# Запускає Telegram-бота TrendScout у фоні на macOS і тримає його увімкненим (launchd, KeepAlive).
#   bash trends/install_bot_mac.sh           # увімкнути (бот стартує й після перезавантаження Mac)
#   bash trends/install_bot_mac.sh --remove  # вимкнути
# Спершу хоча б раз запустіть trends/TrendScout.command і підключіть Telegram (він збереже токен і chat_id).
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
if [ ! -x "$HOME/.trendscout-venv/bin/python" ] || ! grep -q "^export TELEGRAM_CHAT_ID=" "$HOME/.trendscout" 2>/dev/null; then
  echo "Спершу запустіть trends/TrendScout.command і підключіть Telegram (токен бота + /start)."; exit 1
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
