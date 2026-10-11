#!/bin/bash
# TrendScout для macOS: подвійний клік у Finder (або ./trends/TrendScout.command у Терміналі).
# Перший запуск: створює окреме середовище Python, питає ключі і зберігає їх у ~/.trendscout.
# Аргументи передаються далі, наприклад: ./trends/TrendScout.command --market de --ai
set -e
cd "$(dirname "$0")"

CONF="$HOME/.trendscout"
VENV="$HOME/.trendscout-venv"

if ! command -v python3 >/dev/null 2>&1 || ! python3 -c 'import sys; sys.exit(sys.version_info < (3, 9))' 2>/dev/null; then
  echo "Потрібен Python 3.9 або новіший."
  echo "Встановіть його з https://www.python.org/downloads/macos/ або командою: xcode-select --install"
  read -r -p "Натисніть Enter, щоб закрити…"; exit 1
fi

if [ ! -x "$VENV/bin/python" ]; then
  echo "Перший запуск: готую середовище Python (близько хвилини)…"
  python3 -m venv "$VENV"
  # certifi лікує типову на Mac помилку CERTIFICATE_VERIFY_FAILED; anthropic потрібен для --ai
  "$VENV/bin/pip" install -q --upgrade pip certifi anthropic openai
fi
"$VENV/bin/python" -c "import openai" 2>/dev/null || "$VENV/bin/pip" install -q openai

ask_key() {  # ask_key ЗМІННА "підказка": питає ключ, якщо його ще немає в ~/.trendscout
  if [ -f "$CONF" ] && grep -q "^export $1=" "$CONF"; then return; fi
  read -r -p "$2" VALUE
  umask 077
  echo "export $1='$VALUE'" >> "$CONF"
  NEW_KEYS=1
}
if [ ! -f "$CONF" ]; then
  echo
  echo "Ключ YouTube Data API (як отримати: trends/README.md, розділ «Як отримати ключ YouTube»)."
fi
ask_key YOUTUBE_API_KEY "YOUTUBE_API_KEY (Enter, щоб пропустити): "
ask_key OPENAI_API_KEY "OPENAI_API_KEY для ідей від ChatGPT (Enter, щоб пропустити): "
ask_key THREADS_ACCESS_TOKEN "THREADS_ACCESS_TOKEN для аналізу Threads (Enter, щоб пропустити): "
ask_key ANTHROPIC_API_KEY "ANTHROPIC_API_KEY для ідей від Claude (Enter, щоб пропустити): "
if [ -n "$NEW_KEYS" ]; then
  echo "Збережено в $CONF (змінити ключі: відредагуйте або видаліть цей файл)."
fi
ask_key TELEGRAM_BOT_TOKEN "TELEGRAM_BOT_TOKEN від @BotFather, щоб отримувати звіти в Telegram (Enter, щоб пропустити): "
# shellcheck disable=SC1090
source "$CONF"

if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -z "$TELEGRAM_CHAT_ID" ]; then
  echo
  echo "Відкрийте свого бота в Telegram і натисніть Start (або напишіть /start). Потім поверніться сюди."
  read -r -p "Натисніть Enter, коли написали боту… "
  if CHAT=$("$VENV/bin/python" trendscout.py --telegram-chat-id); then
    sed -i '' '/^export TELEGRAM_CHAT_ID=/d' "$CONF" 2>/dev/null || true
    echo "export TELEGRAM_CHAT_ID='$CHAT'" >> "$CONF"
    export TELEGRAM_CHAT_ID="$CHAT"
    echo "Telegram підключено (chat_id $CHAT)."
  else
    echo "Не вдалося знайти чат. Звіт буде тільки в браузері; спробуйте ще раз наступного запуску."
  fi
fi

EXTRA=()
if [ $# -eq 0 ] && { [ -n "$OPENAI_API_KEY" ] || [ -n "$ANTHROPIC_API_KEY" ]; }; then EXTRA=(--ai); fi

echo
"$VENV/bin/python" trendscout.py "${EXTRA[@]}" "$@" && open out/index.html

echo
read -r -p "Готово. Натисніть Enter, щоб закрити вікно…"
