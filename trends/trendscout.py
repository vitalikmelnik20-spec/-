#!/usr/bin/env python3
"""TrendScout: що зараз у тренді на YouTube і TikTok, і які відео з цього зняти.

Джерела (кожне необов'язкове, інструмент працює з тим, що доступно):
  * YouTube Data API v3: «Популярне» в регіоні + найсвіжіші хіти у вашій ніші
    (потрібен ключ YOUTUBE_API_KEY, безкоштовна квота 10 000 одиниць/добу);
  * Google Trends: щоденні пошукові тренди країни (RSS, без ключа);
  * TikTok Creative Center: популярні хештеги та звуки (публічні сторінки, без ключа).

Результат: HTML-звіт, JSON з усіма даними, знімок для порівняння з наступним
запуском (що росте) і, за бажанням, ідеї відео від Claude (ANTHROPIC_API_KEY).

Лише стандартна бібліотека Python 3.9+; пакет `anthropic` потрібен тільки для --ai.
"""

from __future__ import annotations

import argparse
import datetime as dt
import html
import json
import math
import os
import re
import statistics
import sys
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from collections import Counter, defaultdict
from pathlib import Path

try:
    from zoneinfo import ZoneInfo
except ImportError:  # Python < 3.9
    ZoneInfo = None

HERE = Path(__file__).resolve().parent
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36"
YT_API = "https://www.googleapis.com/youtube/v3/"
SHORT_MAX_S = 180  # YouTube Shorts можуть бути до 3 хв

STOPWORDS = set("""
і й та а але або що як це цей ця ці той та ті для від до на у в з із зі за про по при під над без між
не ні так вже ще тут там все всі його її їх він вона вони ми ви ти я мене тебе нас вас бо чи коли
де хто який яка яке які чому тому також дуже більше менше можна треба буде було був була були є
и в во не что он на я с со как а то все она так его но да ты к у же вы за бы по только ее мне было
вот от меня еще нет о из ему теперь когда даже ну вдруг ли если уже или ни быть был него до вас
нибудь опять уж вам ведь там потом себя ничего ей может они тут где есть надо ней для мы тебя их чем
была сам чтоб без будто чего раз тоже себе под будет ж тогда кто этот того потому этого какой совсем
ним здесь этом один почти мой тем чтобы нее сейчас были куда зачем всех никогда можно при наконец
два об другой хоть после над больше тот через эти нас про всего них какая много разве три эту моя
the a an and or but of to in on for with at by from is are was were be been it its this that these
those you your we our they their i me my he she his her as not no so do does did have has had can
will just how what why who when where which all more most new vs video official full part episode
shorts short ep live hd 4k 2024 2025 2026 2027 feat ft x de la el en y que los las del se por con
""".split())

FILLER = set("скільки коштує коштуватиме ціна ціни ціною як чому що топ кращі найкращі огляд".split())

WORD_RE = re.compile(r"[^\W\d_][\w'’-]{2,}", re.UNICODE)
HASHTAG_RE = re.compile(r"#([^\s#.,!?;:()\[\]{}\"']{2,})", re.UNICODE)
EMOJI_RE = re.compile("[\U0001F300-\U0001FAFF☀-➿]")


# --------------------------------------------------------------------------- HTTP

def http_get(url: str, params: dict | None = None, timeout: int = 25, headers: dict | None = None) -> bytes:
    if params:
        url += ("&" if "?" in url else "?") + urllib.parse.urlencode(params, doseq=True)
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "uk,en;q=0.8", **(headers or {})})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def warn(msg: str) -> None:
    print(f"  ! {msg}", file=sys.stderr)


# --------------------------------------------------------------------------- YouTube

def parse_iso_duration(s: str) -> int:
    m = re.fullmatch(r"P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", s or "")
    if not m:
        return 0
    d, h, mi, se = (int(x or 0) for x in m.groups())
    return d * 86400 + h * 3600 + mi * 60 + se


class YouTube:
    def __init__(self, key: str):
        self.key = key
        self.quota = 0

    def get(self, endpoint: str, cost: int, **params) -> dict:
        params["key"] = self.key
        self.quota += cost
        try:
            return json.loads(http_get(YT_API + endpoint, params))
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", "replace")
            try:
                reason = json.loads(body)["error"]["message"]
            except Exception:
                reason = body[:200]
            raise RuntimeError(f"YouTube API {endpoint}: HTTP {e.code}: {reason}") from None

    def videos(self, ids: list[str]) -> list[dict]:
        out = []
        for i in range(0, len(ids), 50):
            data = self.get("videos", 1, part="snippet,statistics,contentDetails", id=",".join(ids[i:i + 50]))
            out += data.get("items", [])
        return out

    def popular(self, region: str, category: str | None, limit: int) -> list[dict]:
        items, token = [], None
        while len(items) < limit:
            params = dict(part="snippet,statistics,contentDetails", chart="mostPopular",
                          regionCode=region, maxResults=min(50, limit - len(items)))
            if category:
                params["videoCategoryId"] = category
            if token:
                params["pageToken"] = token
            data = self.get("videos", 1, **params)
            items += data.get("items", [])
            token = data.get("nextPageToken")
            if not token:
                break
        return items

    def search(self, query: str, region: str, lang: str, days: int, limit: int, shorts_only: bool) -> list[dict]:
        after = (dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=days)).strftime("%Y-%m-%dT%H:%M:%SZ")
        params = dict(part="id", q=query, type="video", order="viewCount", publishedAfter=after,
                      regionCode=region, relevanceLanguage=lang, maxResults=min(50, limit))
        if shorts_only:
            params["videoDuration"] = "short"  # < 4 хв
        data = self.get("search", 100, **params)
        ids = [it["id"]["videoId"] for it in data.get("items", []) if it.get("id", {}).get("videoId")]
        return self.videos(ids) if ids else []

    def subscribers(self, channel_ids: list[str]) -> dict[str, int]:
        subs = {}
        ids = list(dict.fromkeys(channel_ids))
        for i in range(0, len(ids), 50):
            data = self.get("channels", 1, part="statistics", id=",".join(ids[i:i + 50]))
            for it in data.get("items", []):
                st = it.get("statistics", {})
                if not st.get("hiddenSubscriberCount"):
                    subs[it["id"]] = int(st.get("subscriberCount", 0))
        return subs


def normalize_yt(item: dict, source: str) -> dict:
    sn, st, cd = item.get("snippet", {}), item.get("statistics", {}), item.get("contentDetails", {})
    dur = parse_iso_duration(cd.get("duration", ""))
    return {
        "platform": "youtube",
        "source": source,
        "id": item["id"],
        "url": f"https://www.youtube.com/watch?v={item['id']}",
        "title": sn.get("title", ""),
        "description": (sn.get("description") or "")[:500],
        "channel": sn.get("channelTitle", ""),
        "channel_id": sn.get("channelId", ""),
        "published_at": sn.get("publishedAt", ""),
        "category_id": sn.get("categoryId", ""),
        "tags": sn.get("tags", [])[:30],
        "lang": sn.get("defaultAudioLanguage") or sn.get("defaultLanguage") or "",
        "duration_s": dur,
        "is_short": 0 < dur <= SHORT_MAX_S,
        "views": int(st.get("viewCount", 0)),
        "likes": int(st.get("likeCount", 0)),
        "comments": int(st.get("commentCount", 0)),
        "thumb": (sn.get("thumbnails", {}).get("medium") or {}).get("url", ""),
    }


def collect_youtube(args) -> tuple[list[dict], dict]:
    key = os.environ.get("YOUTUBE_API_KEY")
    if not key:
        warn("YOUTUBE_API_KEY не задано: YouTube пропущено (див. trends/README.md, як отримати ключ)")
        return [], {"status": "skipped: no key"}
    yt = YouTube(key)
    videos: dict[str, dict] = {}
    try:
        for it in yt.popular(args.region, args.category, args.limit):
            videos[it["id"]] = normalize_yt(it, "popular")
        print(f"  YouTube «Популярне» {args.region}: {len(videos)} відео")
        for q in args.niche:
            found = yt.search(q, args.region, args.lang, args.days, args.niche_limit, args.shorts_only)
            for it in found:
                videos.setdefault(it["id"], normalize_yt(it, f"niche:{q}"))
            print(f"  YouTube ніша «{q}» (останні {args.days} дн.): {len(found)} відео")
        subs = yt.subscribers([v["channel_id"] for v in videos.values()])
        for v in videos.values():
            v["subs"] = subs.get(v["channel_id"])
    except RuntimeError as e:
        warn(str(e))
        return list(videos.values()), {"status": f"partial: {e}", "quota_used": yt.quota}
    return list(videos.values()), {"status": "ok", "quota_used": yt.quota}


# --------------------------------------------------------------------------- Google Trends

def collect_google_trends(geo: str) -> tuple[list[dict], dict]:
    url = f"https://trends.google.com/trending/rss?geo={geo}"
    try:
        root = ET.fromstring(http_get(url))
    except Exception as e:
        warn(f"Google Trends недоступний: {e}")
        return [], {"status": f"error: {e}"}
    ns = {"ht": "https://trends.google.com/trending/rss"}
    out = []
    for item in root.iter("item"):
        traffic = (item.findtext("ht:approx_traffic", "", ns) or "").replace(",", "").replace("+", "")
        mult = 1000 if traffic.upper().endswith("K") else 1_000_000 if traffic.upper().endswith("M") else 1
        try:
            traffic_n = int(float(traffic.rstrip("KkMm") or 0) * mult)
        except ValueError:
            traffic_n = 0
        news = [n.findtext("ht:news_item_title", "", ns) for n in item.findall("ht:news_item", ns)]
        out.append({
            "query": item.findtext("title", ""),
            "traffic": traffic_n,
            "traffic_label": item.findtext("ht:approx_traffic", "", ns),
            "published": item.findtext("pubDate", ""),
            "news": [n for n in news if n][:3],
        })
    print(f"  Google Trends {geo}: {len(out)} запитів")
    return out, {"status": "ok"}


# --------------------------------------------------------------------------- TikTok Creative Center

TT_BASE = "https://ads.tiktok.com/business/creativecenter/inspiration/popular/{kind}/pc/en"


def _walk(obj):
    if isinstance(obj, dict):
        yield obj
        for v in obj.values():
            yield from _walk(v)
    elif isinstance(obj, list):
        for v in obj:
            yield from _walk(v)


def _pick(d: dict, *keys, default=None):
    for k in keys:
        if d.get(k) not in (None, ""):
            return d[k]
    return default


def _trend_slope(points) -> float | None:
    """Відносна зміна інтересу: остання точка до середнього попередніх (0..1 шкала TikTok)."""
    vals = [p.get("value") for p in points or [] if isinstance(p, dict) and isinstance(p.get("value"), (int, float))]
    if len(vals) < 3:
        return None
    base = sum(vals[:-1]) / (len(vals) - 1)
    return round((vals[-1] - base) / base, 2) if base else None


def collect_tiktok(region: str, period: int) -> tuple[dict, dict]:
    result = {"hashtags": [], "songs": []}
    errors = []
    for kind in ("hashtag", "music"):
        url = TT_BASE.format(kind=kind)
        try:
            page = http_get(url, {"region": region, "period": period}).decode("utf-8", "replace")
            m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', page, re.S)
            if not m:
                raise RuntimeError("на сторінці немає __NEXT_DATA__ (TikTok змінив верстку або просить логін)")
            data = json.loads(m.group(1))
        except Exception as e:
            errors.append(f"{kind}: {e}")
            continue
        seen = set()
        for d in _walk(data):
            if kind == "hashtag" and _pick(d, "hashtagName", "hashtag_name"):
                name = _pick(d, "hashtagName", "hashtag_name")
                if name in seen:
                    continue
                seen.add(name)
                result["hashtags"].append({
                    "name": name,
                    "rank": _pick(d, "rank", default=len(seen)),
                    "rank_diff": _pick(d, "rankDiff", "rank_diff"),
                    "posts": _pick(d, "publishCnt", "publish_cnt", "postCount"),
                    "views": _pick(d, "videoViews", "video_views", "viewCount"),
                    "industry": (_pick(d, "industryInfo", "industry_info", default={}) or {}).get("value"),
                    "is_new": _pick(d, "rankDiffType", "rank_diff_type") == 4,
                    "growth": _trend_slope(_pick(d, "trend")),
                })
            elif kind == "music" and _pick(d, "songId", "song_id", "clipId", "clip_id") and _pick(d, "title"):
                sid = _pick(d, "songId", "song_id", "clipId", "clip_id")
                if sid in seen:
                    continue
                seen.add(sid)
                result["songs"].append({
                    "title": d.get("title"),
                    "author": _pick(d, "author", "artist", default=""),
                    "rank": _pick(d, "rank", default=len(seen)),
                    "rank_diff": _pick(d, "rankDiff", "rank_diff"),
                    "link": _pick(d, "link", "url", default=""),
                    "is_new": _pick(d, "rankDiffType", "rank_diff_type") == 4,
                    "growth": _trend_slope(_pick(d, "trend")),
                })
        if kind == "hashtag" and not result["hashtags"]:
            errors.append("hashtag: дані не знайдено (можливо, регіон не підтримується Creative Center)")
    for key in result:
        result[key].sort(key=lambda x: (x["rank"] if isinstance(x["rank"], int) else 999))
    print(f"  TikTok {region}: {len(result['hashtags'])} хештегів, {len(result['songs'])} звуків")
    for e in errors:
        warn(f"TikTok {e}")
    return result, {"status": "ok" if not errors else "partial: " + "; ".join(errors)}


# --------------------------------------------------------------------------- Аналіз

def parse_time(s: str) -> dt.datetime | None:
    try:
        return dt.datetime.fromisoformat(s.replace("Z", "+00:00"))
    except Exception:
        return None


def score_videos(videos: list[dict], now: dt.datetime) -> None:
    for v in videos:
        pub = parse_time(v["published_at"])
        age_h = max(1.0, (now - pub).total_seconds() / 3600) if pub else 24 * 7
        v["age_h"] = round(age_h, 1)
        v["vph"] = round(v["views"] / age_h, 1)  # перегляди за годину = «швидкість»
        v["er"] = round((v["likes"] + v["comments"]) / v["views"], 4) if v["views"] else 0.0
        subs = v.get("subs")
        v["outlier"] = round(v["views"] / subs, 2) if subs else None  # >1 = відео «вистрілило» понад базу каналу
        raw = math.log10(v["vph"] + 1) * (1 + 4 * v["er"])
        if v["outlier"]:
            raw *= 1 + min(math.log10(v["outlier"] + 1), 1.5) / 3
        v["raw_score"] = raw
    top = max((v["raw_score"] for v in videos), default=1) or 1
    for v in videos:
        v["score"] = round(100 * v.pop("raw_score") / top)


def tokens(text: str) -> list[str]:
    return [w.lower().strip("'’-") for w in WORD_RE.findall(text) if w.lower() not in STOPWORDS]


def keyword_weights(videos: list[dict]) -> dict[str, float]:
    weights: dict[str, float] = defaultdict(float)
    for v in videos:
        w = math.log1p(v["vph"])
        words = tokens(v["title"]) + [t for tag in v["tags"] for t in tokens(tag)]
        uniq = set(words)
        title_words = tokens(v["title"])
        uniq |= {f"{a} {b}" for a, b in zip(title_words, title_words[1:])}
        for term in uniq:
            weights[term] += w
    # Слово, що трапилось лише в одному відео, — шум, а не тренд
    counts = Counter()
    for v in videos:
        t = tokens(v["title"])
        counts.update(set(tokens(v["title"]) + [x for tag in v["tags"] for x in tokens(tag)]
                          + [f"{a} {b}" for a, b in zip(t, t[1:])]))
    return {k: round(w, 2) for k, w in weights.items() if counts[k] >= 2}


def analyze(videos: list[dict], gtrends: list[dict], tiktok: dict, tz, prev: dict | None) -> dict:
    by_score = sorted(videos, key=lambda v: v["score"], reverse=True)
    top = by_score[: max(10, len(by_score) // 3)]

    kw = keyword_weights(videos)
    top_kw = sorted(kw.items(), key=lambda x: x[1], reverse=True)[:40]
    prev_kw = (prev or {}).get("keywords", {})
    rising = []
    for k, w in top_kw:
        if prev is None:
            break
        before = prev_kw.get(k)
        if before is None:
            rising.append({"term": k, "weight": w, "change": "NEW"})
        elif w > before * 1.3:
            rising.append({"term": k, "weight": w, "change": f"+{round(100 * (w / before - 1))}%"})

    hashtags = Counter()
    for v in videos:
        for h in HASHTAG_RE.findall(v["title"] + " " + v["description"]):
            hashtags[h.lower()] += 1

    def summary(vs):
        if not vs:
            return {}
        durs = [v["duration_s"] for v in vs if v["duration_s"]]
        titles = [v["title"] for v in vs]
        return {
            "count": len(vs),
            "shorts_share": round(sum(v["is_short"] for v in vs) / len(vs), 2),
            "median_duration_s": int(statistics.median(durs)) if durs else None,
            "median_er": round(statistics.median(v["er"] for v in vs), 4),
            "median_title_len": int(statistics.median(len(t) for t in titles)),
            "with_number": round(sum(bool(re.search(r"\d", t)) for t in titles) / len(titles), 2),
            "with_question": round(sum("?" in t for t in titles) / len(titles), 2),
            "with_emoji": round(sum(bool(EMOJI_RE.search(t)) for t in titles) / len(titles), 2),
            "with_caps_word": round(sum(bool(re.search(r"\b[A-ZА-ЯІЇЄҐ]{4,}\b", t)) for t in titles) / len(titles), 2),
        }

    hours = Counter()
    weekdays = Counter()
    for v in top:
        pub = parse_time(v["published_at"])
        if pub:
            local = pub.astimezone(tz) if tz else pub
            hours[local.hour] += 1
            weekdays[local.strftime("%a")] += 1

    channels = Counter(v["channel"] for v in top)
    return {
        "top_videos": by_score[:30],
        "shorts": sorted([v for v in videos if v["is_short"]], key=lambda v: v["score"], reverse=True)[:15],
        "outliers": sorted([v for v in videos if v.get("outlier") and v["outlier"] >= 1.5],
                           key=lambda v: v["outlier"], reverse=True)[:15],
        "keywords": top_kw,
        "rising_keywords": rising[:20],
        "hashtags_in_titles": hashtags.most_common(20),
        "format_top": summary(top),
        "format_all": summary(videos),
        "best_hours": sorted(hours.items()),
        "best_weekdays": weekdays.most_common(),
        "top_channels": channels.most_common(10),
        "google_trends": sorted(gtrends, key=lambda g: g["traffic"], reverse=True)[:25],
        "tiktok": tiktok,
    }


# --------------------------------------------------------------------------- Ідеї

def rule_based_ideas(an: dict, niche: list[str]) -> list[dict]:
    """Прості ідеї без AI: перетин вашої ніші з тим, що зараз набирає."""
    ideas = []
    niche_words = {w for n in niche for w in tokens(n)}
    kws = []
    for k, _ in an["keywords"]:
        words = k.split()
        # Пропускаємо службові слова, саму нішу і слова, вже покриті вибраною фразою
        if all(w in FILLER or w in niche_words for w in words):
            continue
        if any(w in chosen.split() for chosen in kws for w in words):
            continue
        kws.append(k)
        if len(kws) == 4:
            break
    fmt = an.get("format_top") or {}
    short = (fmt.get("shorts_share") or 0) >= 0.4
    hook_q = (fmt.get("with_question") or 0) >= 0.2
    topic = niche[0] if niche else "ваша тема"
    for k in kws:
        ideas.append({
            "title": f"{k.capitalize()} + {topic}: те, про що зараз говорять",
            "format": "Short 30–45 с" if short else "Відео 6–10 хв",
            "hook": f"«{k.capitalize()}? Ось що це означає для тебе{'?' if hook_q else '.'}»",
            "why": f"«{k}» серед найвагоміших слів у швидких відео цього тижня",
        })
    for g in an["google_trends"][:3]:
        ideas.append({
            "title": f"{g['query']}: коротко і по суті",
            "format": "Short 20–30 с, текст на екрані",
            "hook": f"«Всі шукають «{g['query']}». Пояснюю за 20 секунд»",
            "why": f"Google Trends: {g['traffic_label'] or g['traffic']} пошуків",
        })
    for h in an["tiktok"].get("hashtags", [])[:3]:
        ideas.append({
            "title": f"#{h['name']} у вашій ніші",
            "format": "TikTok/Reels 15–30 с",
            "hook": f"Адаптуйте тренд #{h['name']} під «{topic}»",
            "why": f"TikTok: місце {h['rank']}" + (" (новий)" if h.get("is_new") else ""),
        })
    return ideas


AI_SYSTEM = """Ти досвідчений стратег коротких відео для YouTube Shorts, TikTok і Reels.
Тобі дають зведення трендів, зібране автоматично з YouTube API, Google Trends і TikTok Creative Center.
Твоє завдання: запропонувати конкретні ідеї відео, які автор може зняти найближчими днями, щоб зловити хвилю.
Спирайся тільки на дані зі зведення; якщо даних мало, так і скажи. Не вигадуй цифр.
Пиши українською. Відповідай лише валідним JSON без markdown."""

AI_SCHEMA_HINT = """Формат відповіді:
{"summary": "2-3 речення: які теми і формати зараз ростуть",
 "ideas": [{"title": "назва відео до 70 символів",
            "hook": "що сказати/показати в перші 2 секунди",
            "format": "платформа, тривалість, стиль",
            "script": ["3-6 коротких бітів сценарію"],
            "hashtags": ["#..."],
            "sound": "трендовий звук або стиль музики, якщо доречно",
            "why": "на який конкретний тренд зі зведення спирається",
            "urgency": "зараз | цього тижня | вічнозелене"}],
 "avoid": ["що зараз не варто знімати і чому"]}"""


def ai_ideas(an: dict, args) -> dict | None:
    try:
        import anthropic
    except ImportError:
        warn("для --ai встановіть пакет: pip install anthropic")
        return None
    brief = {
        "region": args.region,
        "niche": args.niche,
        "channel_about": args.about,
        "top_videos": [{k: v[k] for k in ("title", "channel", "views", "vph", "er", "outlier", "duration_s", "is_short", "tags")}
                       for v in an["top_videos"][:20]],
        "outliers": [{"title": v["title"], "outlier_x": v["outlier"], "subs": v.get("subs")} for v in an["outliers"][:8]],
        "keywords": an["keywords"][:30],
        "rising_keywords": an["rising_keywords"],
        "format_of_top": an["format_top"],
        "best_hours_local": an["best_hours"],
        "google_trends": [{"query": g["query"], "traffic": g["traffic_label"], "news": g["news"]} for g in an["google_trends"][:15]],
        "tiktok_hashtags": an["tiktok"].get("hashtags", [])[:20],
        "tiktok_sounds": an["tiktok"].get("songs", [])[:15],
    }
    prompt = (f"Зведення трендів (JSON):\n{json.dumps(brief, ensure_ascii=False)}\n\n"
              f"Запропонуй {args.ideas} ідей відео під мою нішу. {AI_SCHEMA_HINT}")
    try:
        client = anthropic.Anthropic()
        response = client.beta.messages.create(
            model=args.model,
            max_tokens=16000,
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
            output_config={"effort": "medium"},
            system=AI_SYSTEM,
            messages=[{"role": "user", "content": prompt}],
        )
    except anthropic.AuthenticationError:
        warn("Claude: невірний ANTHROPIC_API_KEY")
        return None
    except TypeError:  # SDK не знайшов жодних облікових даних
        warn("Claude: задайте ANTHROPIC_API_KEY (або виконайте `ant auth login`)")
        return None
    except anthropic.RateLimitError:
        warn("Claude: перевищено ліміт запитів, спробуйте пізніше")
        return None
    except anthropic.APIStatusError as e:
        warn(f"Claude API {e.status_code}: {e.message}")
        return None
    except anthropic.APIConnectionError as e:
        warn(f"Claude: немає з'єднання: {e}")
        return None
    if response.stop_reason == "refusal":
        warn("Claude відмовився відповідати на цей запит")
        return None
    text = "".join(b.text for b in response.content if b.type == "text").strip()
    text = re.sub(r"^```(?:json)?|```$", "", text, flags=re.M).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        warn("Claude повернув не-JSON; зберігаю як текст")
        return {"summary": text, "ideas": [], "avoid": []}


# --------------------------------------------------------------------------- Звіт

def fmt_n(n) -> str:
    if n is None:
        return "—"
    n = float(n)
    for unit, div in (("млрд", 1e9), ("млн", 1e6), ("тис", 1e3)):
        if abs(n) >= div:
            return f"{n / div:.1f} {unit}".replace(".0 ", " ")
    return f"{int(n)}"


def fmt_dur(s: int) -> str:
    return f"{s // 60}:{s % 60:02d}" if s else "—"


def pct(x) -> str:
    return "—" if x is None else f"{round(100 * x)}%"


def render_html(report: dict) -> str:
    e = html.escape
    an, meta = report["analysis"], report["meta"]

    def video_rows(vs):
        rows = []
        for v in vs:
            badge = '<span class="pill short">Short</span>' if v["is_short"] else '<span class="pill">Long</span>'
            rows.append(f"""<tr>
<td class="num"><b>{v['score']}</b></td>
<td><a href="{e(v['url'])}" target="_blank" rel="noopener">{e(v['title'])}</a>
<div class="sub">{e(v['channel'])} · {badge} {fmt_dur(v['duration_s'])} · {e(v['source'])}</div></td>
<td class="num">{fmt_n(v['views'])}</td><td class="num">{fmt_n(v['vph'])}/год</td>
<td class="num">{pct(v['er'])}</td>
<td class="num">{(str(v['outlier']) + '×') if v.get('outlier') else '—'}</td></tr>""")
        head = "<tr><th>Бал</th><th>Відео</th><th>Перегляди</th><th>Швидкість</th><th>Залуч.</th><th>×підп.</th></tr>"
        return f'<div class="scroll"><table>{head}{"".join(rows)}</table></div>' if rows else '<p class="muted">Немає даних.</p>'

    def bars(items, label_fn=str, value_fn=lambda x: x):
        if not items:
            return '<p class="muted">Немає даних.</p>'
        mx = max(value_fn(v) for _, v in items) or 1
        return "".join(
            f'<div class="bar"><span class="lbl">{e(label_fn(k))}</span>'
            f'<span class="track"><span class="fill" style="width:{100 * value_fn(v) / mx:.0f}%"></span></span>'
            f'<span class="val">{e(fmt_n(value_fn(v)) if value_fn(v) >= 10 else str(round(value_fn(v), 1)))}</span></div>'
            for k, v in items)

    fmt = an.get("format_top") or {}
    tiles = [
        ("Відео проаналізовано", str(len(report["videos"]))),
        ("Частка Shorts у топі", pct(fmt.get("shorts_share"))),
        ("Медіанна тривалість топу", fmt_dur(fmt.get("median_duration_s") or 0)),
        ("Медіанне залучення", pct(fmt.get("median_er"))),
        ("Назви з цифрою", pct(fmt.get("with_number"))),
        ("Назви з питанням", pct(fmt.get("with_question"))),
    ]
    tiles_html = "".join(f'<div class="tile"><div class="tv">{e(v)}</div><div class="tl">{e(k)}</div></div>' for k, v in tiles)

    rising = "".join(f'<span class="chip up">{e(r["term"])} <b>{e(r["change"])}</b></span>' for r in an["rising_keywords"]) \
        or '<p class="muted">З\'явиться після другого запуску: інструмент порівнює зі збереженим знімком.</p>'

    gt = "".join(f"""<tr><td><b>{e(g['query'])}</b><div class="sub">{e(' · '.join(g['news'][:2]))}</div></td>
<td class="num">{e(g['traffic_label'] or fmt_n(g['traffic']))}</td></tr>""" for g in an["google_trends"])
    gt = f'<div class="scroll"><table><tr><th>Запит</th><th>Пошуки</th></tr>{gt}</table></div>' if gt else '<p class="muted">Немає даних.</p>'

    def tt_rows(items, kind):
        out = []
        for h in items[:25]:
            diff = h.get("rank_diff")
            arrow = "NEW" if h.get("is_new") else (f"▲{diff}" if isinstance(diff, int) and diff > 0 else (f"▼{-diff}" if isinstance(diff, int) and diff < 0 else ""))
            growth = f"{'+' if (h.get('growth') or 0) > 0 else ''}{round(100 * h['growth'])}%" if h.get("growth") is not None else ""
            if kind == "hashtag":
                name = f'<a href="https://www.tiktok.com/tag/{urllib.parse.quote(h["name"])}" target="_blank" rel="noopener">#{e(h["name"])}</a>'
                extra = f"{fmt_n(h.get('posts'))} постів · {fmt_n(h.get('views'))} переглядів" + (f" · {e(h['industry'])}" if h.get("industry") else "")
            else:
                name = f'<a href="{e(h["link"])}" target="_blank" rel="noopener">{e(h["title"])}</a>' if h.get("link") else e(h["title"])
                extra = e(h.get("author") or "")
            out.append(f'<tr><td class="num">{e(str(h["rank"]))}</td><td>{name}<div class="sub">{extra}</div></td>'
                       f'<td class="num">{e(arrow)}</td><td class="num">{e(growth)}</td></tr>')
        return (f'<div class="scroll"><table><tr><th>#</th><th>{"Хештег" if kind == "hashtag" else "Звук"}</th><th>Позиція</th><th>Ріст</th></tr>{"".join(out)}</table></div>'
                if out else '<p class="muted">Немає даних (див. «Джерела» нижче).</p>')

    ai = report.get("ai")
    if ai:
        cards = []
        for i in ai.get("ideas", []):
            beats = "".join(f"<li>{e(b)}</li>" for b in i.get("script", []))
            tags = " ".join(e(t) for t in i.get("hashtags", []))
            cards.append(f"""<div class="idea"><div class="ih"><b>{e(i.get('title', ''))}</b><span class="pill">{e(i.get('urgency', ''))}</span></div>
<div class="sub">{e(i.get('format', ''))}</div><p><b>Хук:</b> {e(i.get('hook', ''))}</p>
{f'<ol>{beats}</ol>' if beats else ''}<p class="sub">{tags}{(' · 🎵 ' + e(i['sound'])) if i.get('sound') else ''}</p>
<p class="why">Чому: {e(i.get('why', ''))}</p></div>""")
        avoid = "".join(f"<li>{e(a)}</li>" for a in ai.get("avoid", []))
        ideas_html = (f'<p>{e(ai.get("summary", ""))}</p><div class="ideas">{"".join(cards)}</div>'
                      + (f'<h3>Чого уникати</h3><ul>{avoid}</ul>' if avoid else ""))
    else:
        cards = "".join(f"""<div class="idea"><b>{e(i['title'])}</b><div class="sub">{e(i['format'])}</div>
<p><b>Хук:</b> {e(i['hook'])}</p><p class="why">Чому: {e(i['why'])}</p></div>""" for i in report["rule_ideas"])
        ideas_html = (f'<p class="muted">Шаблонні ідеї. Запустіть з <code>--ai</code>, щоб Claude написав повні ідеї зі сценарієм.</p>'
                      f'<div class="ideas">{cards}</div>')

    hours = dict(an["best_hours"])
    hours_html = "".join(
        f'<div class="hcol"><div class="hfill" style="height:{100 * hours.get(h, 0) / (max(hours.values()) if hours else 1):.0f}%"></div><span>{h}</span></div>'
        for h in range(24))

    sources = "".join(f"<li><b>{e(k)}</b>: {e(str(v.get('status')))}" + (f" (квота YouTube: {v['quota_used']})" if v.get("quota_used") else "") + "</li>"
                      for k, v in meta["sources"].items())

    return f"""<!doctype html><html lang="uk"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Тренди {e(meta['region'])}: {e(meta['generated_local'])}</title>
<style>
:root{{--bg:#f7f7f8;--card:#fff;--fg:#17171a;--muted:#6b6b76;--line:#e6e6ea;--acc:#e5484d;--acc2:#0b7bdc;--ok:#1a9f5a}}
@media (prefers-color-scheme:dark){{:root{{--bg:#111114;--card:#1b1b20;--fg:#ececf1;--muted:#9a9aa6;--line:#2c2c33;--acc:#ff6369;--acc2:#4aa8ff;--ok:#3dd68c}}}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}}
main{{max-width:1100px;margin:0 auto;padding:24px 16px 64px}}h1{{margin:0 0 4px;font-size:26px}}h2{{font-size:18px;margin:0 0 12px}}h3{{font-size:15px}}
.muted,.sub{{color:var(--muted)}}.sub{{font-size:12.5px}}a{{color:var(--acc2);text-decoration:none}}a:hover{{text-decoration:underline}}
section{{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px;margin-top:16px}}
.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(320px,100%),1fr));gap:16px}}.grid section{{margin-top:0}}
.tiles{{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(150px,100%),1fr));gap:12px;margin-top:16px}}
.tile{{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px}}.tv{{font-size:24px;font-weight:700}}.tl{{color:var(--muted);font-size:12.5px}}
.scroll{{overflow-x:auto}}table{{width:100%;border-collapse:collapse}}th,td{{padding:8px 6px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}}
th{{font-size:12px;color:var(--muted);font-weight:600}}td.num{{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}}
.pill{{display:inline-block;font-size:11px;padding:1px 7px;border-radius:99px;border:1px solid var(--line);color:var(--muted)}}.pill.short{{border-color:var(--acc);color:var(--acc)}}
.chip{{display:inline-block;margin:3px;padding:4px 10px;border-radius:99px;border:1px solid var(--line);font-size:13px}}.chip.up b{{color:var(--ok)}}
.bar{{display:grid;grid-template-columns:minmax(90px,170px) 1fr 52px;gap:8px;align-items:center;margin:4px 0;font-size:13px}}
.lbl{{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}}.track{{background:var(--line);border-radius:4px;height:8px}}.fill{{display:block;height:8px;border-radius:4px;background:var(--acc2)}}.val{{text-align:right;color:var(--muted)}}
.hours{{display:flex;gap:3px;align-items:flex-end;height:120px}}.hcol{{flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;height:100%}}
.hfill{{width:100%;background:var(--acc);border-radius:3px 3px 0 0;min-height:2px}}.hcol span{{font-size:10px;color:var(--muted)}}
.ideas{{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(280px,100%),1fr));gap:12px}}.idea{{border:1px solid var(--line);border-radius:12px;padding:14px}}
.idea p{{margin:6px 0}}.idea ol{{margin:6px 0;padding-left:20px;font-size:13.5px}}.ih{{display:flex;justify-content:space-between;gap:8px}}.why{{font-size:12.5px;color:var(--ok)}}
code{{background:var(--line);padding:1px 5px;border-radius:4px}}
</style></head><body><main>
<h1>Тренди: {e(meta['region'])}{(' · ' + e(', '.join(meta['niche']))) if meta['niche'] else ''}</h1>
<div class="muted">Згенеровано {e(meta['generated_local'])} · YouTube, Google Trends, TikTok Creative Center{' · ДЕМО-ДАНІ' if meta.get('demo') else ''}</div>
<div class="tiles">{tiles_html}</div>

<section><h2>💡 Ідеї для відео</h2>{ideas_html}</section>

<section><h2>📈 Що росте з минулого запуску</h2>{rising}</section>

<section><h2>🔥 Найшвидші відео (YouTube)</h2>
<p class="sub">Бал 0–100 = швидкість переглядів × залучення × «вистріл» понад підписників. «×підп.» = перегляди / підписники каналу: 3× означає, що тема спрацювала втричі краще за звичайну аудиторію каналу. Такі теми найкраще копіювати.</p>
{video_rows(an['top_videos'][:20])}</section>

<div class="grid" style="margin-top:16px">
<section><h2>🎯 Аномалії (тема > канал)</h2>{video_rows(an['outliers'][:10])}</section>
<section><h2>⚡ Топ Shorts</h2>{video_rows(an['shorts'][:10])}</section>
</div>

<div class="grid" style="margin-top:16px">
<section><h2>🔑 Ключові слова у швидких відео</h2>{bars(an['keywords'][:20])}</section>
<section><h2>🔎 Google Trends: що шукають зараз</h2>{gt}</section>
</div>

<div class="grid" style="margin-top:16px">
<section><h2>#️⃣ TikTok: хештеги</h2>{tt_rows(an['tiktok'].get('hashtags', []), 'hashtag')}</section>
<section><h2>🎵 TikTok: трендові звуки</h2>{tt_rows(an['tiktok'].get('songs', []), 'music')}</section>
</div>

<div class="grid" style="margin-top:16px">
<section><h2>🕒 Коли публікували топ ({e(meta['tz'])})</h2><div class="hours">{hours_html}</div>
<p class="sub">Години публікації найкращих відео. Публікуйте за 1–2 год до піку.</p></section>
<section><h2>📺 Канали, які зараз у топі</h2>{bars(an['top_channels'])}</section>
</div>

<section><h2>Джерела</h2><ul>{sources}</ul></section>
</main></body></html>"""


def print_summary(report: dict) -> None:
    an = report["analysis"]
    print("\n=== ГОЛОВНЕ ===")
    if an["keywords"]:
        print("Ключові слова: " + ", ".join(k for k, _ in an["keywords"][:12]))
    if an["rising_keywords"]:
        print("Ростуть:       " + ", ".join(f"{r['term']} ({r['change']})" for r in an["rising_keywords"][:10]))
    if an["google_trends"]:
        print("Google Trends: " + ", ".join(g["query"] for g in an["google_trends"][:8]))
    if an["tiktok"].get("hashtags"):
        print("TikTok #:      " + ", ".join("#" + h["name"] for h in an["tiktok"]["hashtags"][:10]))
    for v in an["top_videos"][:5]:
        print(f"  [{v['score']:>3}] {v['title'][:70]}  ({fmt_n(v['vph'])}/год)")
    f = an.get("format_top") or {}
    if f:
        print(f"Формат топу: Shorts {pct(f.get('shorts_share'))}, медіана {fmt_dur(f.get('median_duration_s') or 0)}, "
              f"залучення {pct(f.get('median_er'))}")


# --------------------------------------------------------------------------- main

def main(argv=None) -> int:
    p = argparse.ArgumentParser(description="Аналіз трендів YouTube / TikTok / Google для ідей відео",
                                formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    p.add_argument("--region", default="UA", help="код країни ISO (UA, US, DE, PL…)")
    p.add_argument("--lang", default="uk", help="мова для пошуку в ніші (uk, en, de…)")
    p.add_argument("--niche", action="append", default=[], help="ключова фраза вашої ніші; можна кілька разів")
    p.add_argument("--about", default="", help="1–2 речення про ваш канал (для --ai)")
    p.add_argument("--days", type=int, default=7, help="наскільки свіжі відео в ніші")
    p.add_argument("--limit", type=int, default=50, help="скільки відео з «Популярного»")
    p.add_argument("--niche-limit", type=int, default=25, help="скільки відео на кожну нішеву фразу")
    p.add_argument("--category", default=None, help="ID категорії YouTube (24=Розваги, 10=Музика, 20=Ігри, 22=Люди і блоги, 27=Освіта, 28=Наука)")
    p.add_argument("--shorts-only", action="store_true", help="у ніші шукати лише короткі відео")
    p.add_argument("--tiktok-period", type=int, default=7, choices=[7, 30, 120], help="період TikTok у днях")
    p.add_argument("--tz", default="Europe/Kyiv", help="часовий пояс для годин публікації")
    p.add_argument("--no-youtube", action="store_true")
    p.add_argument("--no-google", action="store_true")
    p.add_argument("--no-tiktok", action="store_true")
    p.add_argument("--ai", action="store_true", help="згенерувати ідеї через Claude (потрібен ANTHROPIC_API_KEY)")
    p.add_argument("--ideas", type=int, default=10, help="скільки ідей просити в Claude")
    p.add_argument("--model", default="claude-opus-5-5", help="модель Claude для --ai")
    p.add_argument("--out", default=str(HERE / "out"), help="тека для звітів")
    p.add_argument("--demo", action="store_true", help="без мережі: показати звіт на демо-даних")
    args = p.parse_args(argv)
    args.region = args.region.upper()

    tz = ZoneInfo(args.tz) if ZoneInfo else None
    now = dt.datetime.now(dt.timezone.utc)
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    history = out_dir / "history"
    history.mkdir(exist_ok=True)

    print(f"Збираю тренди для {args.region}…")
    sources = {}
    if args.demo:
        demo = json.loads((HERE / "demo_data.json").read_text(encoding="utf-8"))
        # Зсуваємо дати демо-даних до «зараз», щоб швидкість переглядів була реалістичною
        for v in demo["videos"]:
            v["published_at"] = (now - dt.timedelta(hours=v.pop("age_hours"))).isoformat()
        videos, gtrends, tiktok = demo["videos"], demo["google_trends"], demo["tiktok"]
        sources = {"demo": {"status": "демо-дані з trends/demo_data.json"}}
    else:
        videos, gtrends, tiktok = [], [], {"hashtags": [], "songs": []}
        if not args.no_youtube:
            videos, sources["YouTube"] = collect_youtube(args)
        if not args.no_google:
            gtrends, sources["Google Trends"] = collect_google_trends(args.region)
        if not args.no_tiktok:
            tiktok, sources["TikTok"] = collect_tiktok(args.region, args.tiktok_period)

    if not videos and not gtrends and not tiktok.get("hashtags"):
        print("\nЖодне джерело не дало даних. Перевірте ключ YOUTUBE_API_KEY та доступ до інтернету,"
              " або запустіть з --demo, щоб побачити приклад звіту.", file=sys.stderr)
        return 1

    score_videos(videos, now)
    niche_slug = "-".join(re.sub(r"\W+", "_", n.lower()).strip("_") for n in args.niche) or "all"
    snap_name = f"{args.region}_{niche_slug}"
    snaps = sorted(history.glob(f"{snap_name}_*.json"))
    prev = json.loads(snaps[-1].read_text(encoding="utf-8")) if snaps else None
    an = analyze(videos, gtrends, tiktok, tz, prev)

    report = {
        "meta": {
            "region": args.region, "niche": args.niche, "tz": args.tz, "demo": args.demo,
            "generated_utc": now.isoformat(),
            "generated_local": (now.astimezone(tz) if tz else now).strftime("%Y-%m-%d %H:%M"),
            "sources": sources,
        },
        "analysis": an,
        "videos": videos,
        "rule_ideas": rule_based_ideas(an, args.niche),
    }
    if args.ai:
        print(f"Питаю Claude ({args.model}) про ідеї…")
        report["ai"] = ai_ideas(an, args)

    stamp = (now.astimezone(tz) if tz else now).strftime("%Y%m%d_%H%M")
    if not args.demo:
        (history / f"{snap_name}_{stamp}.json").write_text(json.dumps(
            {"generated_utc": now.isoformat(), "keywords": dict(an["keywords"])}, ensure_ascii=False), encoding="utf-8")
    base = out_dir / f"trends_{snap_name}_{stamp}{'_demo' if args.demo else ''}"
    base.with_suffix(".json").write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding="utf-8")
    base.with_suffix(".html").write_text(render_html(report), encoding="utf-8")
    (out_dir / "latest.html").write_text(render_html(report), encoding="utf-8")

    print_summary(report)
    print(f"\nЗвіт: {base.with_suffix('.html')}\nДані: {base.with_suffix('.json')}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
