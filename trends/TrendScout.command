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
  "$VENV/bin/pip" install -q --upgrade pip certifi anthropic
fi

if [ ! -f "$CONF" ]; then
  echo
  echo "Ключ YouTube Data API (як отримати: trends/README.md, розділ «Як отримати ключ YouTube»)."
  read -r -p "YOUTUBE_API_KEY (Enter, щоб пропустити): " YT
  read -r -p "ANTHROPIC_API_KEY для ідей від Claude (Enter, щоб пропустити): " AK
  umask 077
  {
    echo "export YOUTUBE_API_KEY='$YT'"
    echo "export ANTHROPIC_API_KEY='$AK'"
  } > "$CONF"
  echo "Збережено в $CONF (змінити ключі: відредагуйте або видаліть цей файл)."
fi
# shellcheck disable=SC1090
source "$CONF"

EXTRA=()
if [ $# -eq 0 ] && [ -n "$ANTHROPIC_API_KEY" ]; then EXTRA=(--ai); fi

echo
"$VENV/bin/python" trendscout.py "${EXTRA[@]}" "$@" && open out/index.html

echo
read -r -p "Готово. Натисніть Enter, щоб закрити вікно…"
