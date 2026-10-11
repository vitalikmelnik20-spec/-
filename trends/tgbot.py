#!/usr/bin/env python3
"""Telegram-бот TrendScout: запити до аналізу трендів прямо з Telegram.

Команди (і кнопки меню):
  /trends [ua|de|us|all]      повний аналіз ринків (за замовчуванням усі три)
  /topic [ua|de|us] <тема>    аналіз окремої теми, напр. /topic de Miete Berlin
  будь-який текст              те саме, що /topic у вашому основному ринку
  /niche <ринок> <фраза; фраза> змінити постійні нішеві фрази ринку
  /market <ua|de|us>          основний ринок для простого тексту
  /status                     поточні налаштування
  /help                       довідка

Бот відповідає лише власнику (TELEGRAM_CHAT_ID) та чатам із TELEGRAM_ALLOWED_CHATS.
Запуск: python3 trends/tgbot.py  (токени беруться з оточення, див. trends/README.md)
"""

from __future__ import annotations

import json
import os
import queue
import shlex
import subprocess
import sys
import threading
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import trendscout as ts  # noqa: E402

STATE_FILE = Path(os.environ.get("TRENDSCOUT_BOT_STATE", Path.home() / ".trendscout-bot.json"))
MARKETS_FILE = Path(os.environ.get("TRENDSCOUT_MARKETS_FILE", Path.home() / ".trendscout-markets.json"))
OUT_DIR = Path(os.environ.get("TRENDSCOUT_OUT", HERE / "out"))
HELP = """<b>TrendScout</b>: тренди YouTube, TikTok, Google і Threads → ідеї відео.

/trends: усі три ринки (🇺🇦 🇩🇪 🇺🇸)
/trends ua (або de, us): один ринок
/topic оренда Київ: аналіз теми в основному ринку
/topic us rent prices: тема в конкретному ринку
<i>Або просто напишіть тему текстом.</i>

/niche ua вартість життя; ціни: змінити постійні фрази ринку
/market de: основний ринок для тексту
/status: налаштування

Аналіз триває 1–3 хвилини. Результат: кластери трендів по 3 відео + HTML-звіт."""

COMMANDS = [
    ("trends", "Тренди всіх ринків або одного: /trends ua"),
    ("topic", "Аналіз теми: /topic de Miete Berlin"),
    ("niche", "Змінити нішеві фрази: /niche ua оренда; ціни"),
    ("market", "Основний ринок для тексту: /market us"),
    ("status", "Поточні налаштування"),
    ("help", "Довідка"),
]


def load_state() -> dict:
    try:
        return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {"offset": 0, "market": "ua"}


def save_state(state: dict) -> None:
    STATE_FILE.write_text(json.dumps(state, ensure_ascii=False), encoding="utf-8")


def markets() -> dict:
    if not MARKETS_FILE.exists():
        MARKETS_FILE.write_text((HERE / "markets.json").read_text(encoding="utf-8"), encoding="utf-8")
    os.environ["TRENDSCOUT_MARKETS_FILE"] = str(MARKETS_FILE)
    return ts.load_markets()


def send(chat: str, text: str) -> None:
    try:
        ts.tg_send_text(chat, text)
    except Exception as ex:
        ts.warn(f"не вдалося надіслати в {chat}: {ex}")


def allowed_chats() -> set[str]:
    ids = {os.environ.get("TELEGRAM_CHAT_ID", "")}
    ids |= {x.strip() for x in os.environ.get("TELEGRAM_ALLOWED_CHATS", "").split(",")}
    return {x for x in ids if x}


def run_job(chat: str, market_keys: list[str], topic: list[str] | None) -> None:
    """Запускає trendscout.py окремим процесом; він сам надсилає результат у цей чат."""
    args = [sys.executable, str(HERE / "trendscout.py"), "--markets", ",".join(market_keys), "--out", str(OUT_DIR)]
    for t in topic or []:
        args += ["--niche", t]
    if os.environ.get("OPENAI_API_KEY") or os.environ.get("ANTHROPIC_API_KEY"):
        args.append("--ai")
    args += shlex.split(os.environ.get("TRENDSCOUT_EXTRA_ARGS", ""))  # напр. "--days 3 --clusters 7"
    env = dict(os.environ, TELEGRAM_CHAT_ID=chat, TRENDSCOUT_MARKETS_FILE=str(MARKETS_FILE))
    started = time.time()
    proc = subprocess.run(args, env=env, capture_output=True, text=True, timeout=900)
    log = (proc.stdout + proc.stderr)[-3000:]
    print(log, flush=True)
    if proc.returncode != 0 or "Telegram: надіслано" not in proc.stdout:
        warnings = "\n".join(line.strip() for line in log.splitlines() if line.strip().startswith("!"))[-1500:]
        send(chat, "⚠️ Аналіз не вдався або дані не надіслано.\n" + ts.html.escape(warnings or log[-1500:]))
    else:
        print(f"готово за {time.time() - started:.0f} с", flush=True)


def worker(jobs: "queue.Queue[tuple]") -> None:
    while True:
        chat, keys, topic = jobs.get()
        try:
            run_job(chat, keys, topic)
        except subprocess.TimeoutExpired:
            send(chat, "⚠️ Аналіз триває понад 15 хвилин, зупинено. Спробуйте один ринок: /trends ua")
        except Exception as ex:
            send(chat, f"⚠️ Помилка: {ts.html.escape(str(ex))}")
        finally:
            jobs.task_done()


def handle(text: str, chat: str, state: dict, jobs: "queue.Queue[tuple]") -> None:
    mk = markets()
    text = text.strip()
    cmd, _, rest = text.partition(" ")
    cmd = cmd.split("@")[0].lower() if cmd.startswith("/") else ""
    rest = rest.strip() if cmd else text

    def enqueue(keys, topic=None):
        busy = jobs.unfinished_tasks
        what = f"тему «{'; '.join(topic)}»" if topic else "тренди"
        names = ", ".join(mk[k]["name"] for k in keys)
        send(chat, f"⏳ Аналізую {ts.html.escape(what)}: {names}. Це займе 1–3 хв."
                   + (f"\nУ черзі перед вами: {busy}." if busy else ""))
        jobs.put((chat, keys, topic))

    if cmd in ("/start", "/help"):
        send(chat, HELP)
    elif cmd == "/status":
        lines = [f"Основний ринок: <b>{ts.html.escape(mk.get(state.get('market', 'ua'), {}).get('name', state.get('market')))}</b>"]
        for k, m in mk.items():
            lines.append(f"{m['name']} (<code>{k}</code>): {ts.html.escape('; '.join(m.get('niche', [])))}")
        keys = {"YouTube": "YOUTUBE_API_KEY", "ChatGPT": "OPENAI_API_KEY", "Claude": "ANTHROPIC_API_KEY", "Threads": "THREADS_ACCESS_TOKEN"}
        lines.append("Джерела: " + ", ".join(f"{n} {'✅' if os.environ.get(v) else '—'}" for n, v in keys.items()))
        send(chat, "\n".join(lines))
    elif cmd == "/market":
        key = rest.lower()
        if key not in mk:
            send(chat, f"Вкажіть ринок: {', '.join(mk)}")
        else:
            state["market"] = key
            save_state(state)
            send(chat, f"Основний ринок: {mk[key]['name']}")
    elif cmd == "/niche":
        key, _, phrases = rest.partition(" ")
        key = key.lower()
        items = [x.strip() for x in phrases.replace(",", ";").split(";") if x.strip()]
        if key not in mk or not items:
            send(chat, "Формат: <code>/niche ua вартість життя; ціни</code>")
        else:
            data = json.loads(MARKETS_FILE.read_text(encoding="utf-8"))
            data[key]["niche"] = items
            MARKETS_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
            send(chat, f"✅ {mk[key]['name']}: {ts.html.escape('; '.join(items))}")
    elif cmd == "/trends":
        arg = rest.lower()
        keys = list(mk) if arg in ("", "all") else [k.strip() for k in arg.replace(",", " ").split() if k.strip()]
        bad = [k for k in keys if k not in mk]
        if bad:
            send(chat, f"Невідомий ринок: {', '.join(bad)}. Є: {', '.join(mk)}")
        else:
            enqueue(keys)
    elif cmd in ("/topic", ""):
        first, _, tail = rest.partition(" ")
        if first.lower() in mk and tail.strip():
            key, topic = first.lower(), tail.strip()
        else:
            key, topic = state.get("market", "ua"), rest
        if not topic:
            send(chat, "Напишіть тему, наприклад: <code>/topic оренда Київ</code>")
        elif len(topic) > 100:
            send(chat, "Тема задовга: до 100 символів.")
        else:
            enqueue([key], [x.strip() for x in topic.split(";") if x.strip()])
    else:
        send(chat, "Не знаю такої команди. /help")


def main() -> int:
    if not os.environ.get("TELEGRAM_BOT_TOKEN"):
        print("Задайте TELEGRAM_BOT_TOKEN", file=sys.stderr)
        return 1
    owners = allowed_chats()
    if not owners:
        print("Задайте TELEGRAM_CHAT_ID (ваш чат). Його знаходить: python3 trends/trendscout.py --telegram-chat-id",
              file=sys.stderr)
        return 1
    me = ts.tg_call("getMe")["result"]
    ts.tg_call("setMyCommands", {"commands": json.dumps([{"command": c, "description": d} for c, d in COMMANDS],
                                                         ensure_ascii=False)})
    print(f"Бот @{me.get('username')} працює. Власники: {', '.join(sorted(owners))}. Ctrl+C для зупинки.", flush=True)

    state = load_state()
    jobs: "queue.Queue[tuple]" = queue.Queue()
    threading.Thread(target=worker, args=(jobs,), daemon=True).start()
    while True:
        try:
            res = ts.tg_call("getUpdates", {"offset": state.get("offset", 0), "timeout": 50,
                                            "allowed_updates": json.dumps(["message"])})
        except Exception as ex:
            ts.warn(f"getUpdates: {ex}; повтор через 10 с")
            time.sleep(10)
            continue
        for upd in res.get("result", []):
            state["offset"] = upd["update_id"] + 1
            save_state(state)
            msg = upd.get("message") or {}
            chat = str((msg.get("chat") or {}).get("id", ""))
            text = msg.get("text")
            if not chat or not text:
                continue
            if chat not in owners:
                send(chat, f"⛔ Немає доступу. Ваш chat_id: <code>{chat}</code>. "
                           "Власник може додати його в TELEGRAM_ALLOWED_CHATS.")
                continue
            print(f"[{time.strftime('%H:%M:%S')}] {chat}: {text}", flush=True)
            try:
                handle(text, chat, state, jobs)
            except Exception as ex:
                send(chat, f"⚠️ Помилка: {ts.html.escape(str(ex))}")


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\nЗупинено.")
