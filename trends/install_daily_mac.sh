#!/bin/bash
# Щоденний автозапуск TrendScout на macOS (launchd): звіт приходить у Telegram.
#   bash trends/install_daily_mac.sh          # щодня о 09:00
#   bash trends/install_daily_mac.sh 7 30     # щодня о 07:30
#   bash trends/install_daily_mac.sh --remove # вимкнути
# Спершу хоча б раз запустіть trends/TrendScout.command: він створює ~/.trendscout і ~/.trendscout-venv.
set -e
LABEL="com.trendscout.daily"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"

if [ "$1" = "--remove" ]; then
  launchctl unload "$PLIST" 2>/dev/null || true
  rm -f "$PLIST"
  echo "Автозапуск вимкнено."
  exit 0
fi

HOUR="${1:-9}"; MINUTE="${2:-0}"
DIR="$(cd "$(dirname "$0")" && pwd)"
if [ ! -f "$HOME/.trendscout" ] || [ ! -x "$HOME/.trendscout-venv/bin/python" ]; then
  echo "Спершу запустіть trends/TrendScout.command один раз (він налаштує ключі й Python)."; exit 1
fi

mkdir -p "$HOME/Library/LaunchAgents" "$DIR/out"
cat > "$PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key><array>
    <string>/bin/bash</string><string>-c</string>
    <string>source "\$HOME/.trendscout"; AI=""; if [ -n "\$OPENAI_API_KEY\$ANTHROPIC_API_KEY" ]; then AI="--ai"; fi; cd "$DIR" &amp;&amp; "\$HOME/.trendscout-venv/bin/python" trendscout.py \$AI</string>
  </array>
  <key>StartCalendarInterval</key><dict>
    <key>Hour</key><integer>$HOUR</integer><key>Minute</key><integer>$MINUTE</integer>
  </dict>
  <key>StandardOutPath</key><string>$DIR/out/daily.log</string>
  <key>StandardErrorPath</key><string>$DIR/out/daily.log</string>
</dict></plist>
PLIST

launchctl unload "$PLIST" 2>/dev/null || true
launchctl load "$PLIST"
printf "Готово: TrendScout запускатиметься щодня о %02d:%02d і надсилатиме звіт у Telegram.\n" "$HOUR" "$MINUTE"
echo "Якщо Mac у цей час спить, запуск відбудеться, щойно він прокинеться. Лог: $DIR/out/daily.log"
echo "Перевірити зараз: launchctl start $LABEL"
