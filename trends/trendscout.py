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
import ssl
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
der die das und oder aber ist sind war ein eine einer einen dem den des zu im in am an auf aus mit von für bei nach vor über unter wie was wer wo warum nicht kein keine ich du er sie es wir ihr mein dein sein ihr uns euch so auch noch nur schon sehr mehr hier dort alle alles man wird werden hat haben kann können mal jetzt dann denn doch ja nein vom zum zur ins beim als bis
shorts short ep live hd 4k 2024 2025 2026 2027 feat ft x de la el en y que los las del se por con
""".split())

FILLER = set(("скільки коштує коштуватиме ціна ціни ціною як чому що топ кращі найкращі огляд "
               "україна україні україни україну ukraine ukrainian deutschland germany usa america american year").split())

WORD_RE = re.compile(r"[^\W\d_][\w'’-]{2,}", re.UNICODE)
HASHTAG_RE = re.compile(r"#([^\s#.,!?;:()\[\]{}\"']{2,})", re.UNICODE)
EMOJI_RE = re.compile("[\U0001F300-\U0001FAFF☀-➿]")


# --------------------------------------------------------------------------- HTTP

def _ssl_context():
    # Python з python.org на macOS не бачить системних сертифікатів; certifi, якщо встановлений, це виправляє
    ctx = ssl.create_default_context()  # системні сертифікати лишаються
    try:
        import certifi
        ctx.load_verify_locations(certifi.where())
    except ImportError:
        pass
    return ctx


SSL_CTX = _ssl_context()


def http_get(url: str, params: dict | None = None, timeout: int = 25, headers: dict | None = None) -> bytes:
    if params:
        url += ("&" if "?" in url else "?") + urllib.parse.urlencode(params, doseq=True)
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "uk,en;q=0.8", **(headers or {})})
    with urllib.request.urlopen(req, timeout=timeout, context=SSL_CTX) as r:
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
        for region in args.regions:
            found = yt.popular(region, args.category, args.limit)
            for it in found:
                videos.setdefault(it["id"], normalize_yt(it, f"popular:{region}"))
            print(f"  YouTube «Популярне» {region}: {len(found)} відео")
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
            "geo": geo,
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


# --------------------------------------------------------------------------- Threads

THREADS_API = "https://graph.threads.net/v1.0/keyword_search"


def collect_threads(queries: list[str], now: dt.datetime) -> tuple[dict, dict]:
    """Пошук публічних постів Threads за фразами (офіційний API, потрібен THREADS_ACCESS_TOKEN).

    Без схваленого Meta дозволу threads_keyword_search API шукає лише у ваших власних постах.
    """
    token = os.environ.get("THREADS_ACCESS_TOKEN")
    empty = {"posts": [], "queries": [], "keywords": []}
    if not token:
        return empty, {"status": "skipped: no THREADS_ACCESS_TOKEN"}
    posts, per_query, errors = {}, [], []
    for q in queries:
        try:
            data = json.loads(http_get(THREADS_API, {
                "q": q, "search_type": "TOP", "limit": 25, "access_token": token,
                "fields": "id,text,timestamp,permalink,username,media_type",
            }))
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", "replace")
            try:
                reason = json.loads(body)["error"]["message"]
            except Exception:
                reason = body[:200]
            errors.append(f"«{q}»: HTTP {e.code}: {reason}")
            continue
        except Exception as e:
            errors.append(f"«{q}»: {e}")
            continue
        found = data.get("data", [])
        recent = 0
        for it in found:
            ts = parse_time((it.get("timestamp") or "").replace("+0000", "+00:00"))
            if ts and (now - ts).total_seconds() < 48 * 3600:
                recent += 1
            posts.setdefault(it["id"], {
                "platform": "threads", "query": q, "text": (it.get("text") or "")[:500],
                "username": it.get("username", ""), "url": it.get("permalink", ""),
                "timestamp": it.get("timestamp", ""),
            })
        per_query.append({"query": q, "posts": len(found), "last_48h": recent})
    plist = list(posts.values())
    kw = Counter(t for p in plist for t in set(tokens(p["text"])))
    result = {"posts": plist, "queries": per_query, "keywords": [(k, c) for k, c in kw.most_common(30) if c >= 2]}
    print(f"  Threads: {len(plist)} постів за {len(queries)} запитами")
    authors = {p["username"] for p in plist}
    if plist and len(authors) == 1:
        errors.append("усі пости від одного автора: схоже, API шукає лише у ваших постах, "
                      "бо Meta ще не схвалила дозвіл threads_keyword_search")
    for e in errors:
        warn(f"Threads {e}")
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


def bigrams(text: str) -> list[str]:
    """Пари сусідніх слів; пара через службове слово («cost of living») не склеюється в «cost living»."""
    words = [w.lower().strip("'’-") for w in re.findall(r"[\w'’-]+", text)]
    ok = lambda w: w not in STOPWORDS and WORD_RE.fullmatch(w)
    return [f"{a} {b}" for a, b in zip(words, words[1:]) if ok(a) and ok(b)]


def keyword_weights(videos: list[dict]) -> dict[str, float]:
    weights: dict[str, float] = defaultdict(float)
    for v in videos:
        w = math.log1p(v["vph"])
        words = tokens(v["title"]) + [t for tag in v["tags"] for t in tokens(tag)]
        uniq = set(words)
        uniq |= set(bigrams(v["title"]))
        for term in uniq:
            weights[term] += w
    # Слово, що трапилось лише в одному відео, — шум, а не тренд
    counts = Counter()
    for v in videos:
        counts.update(set(tokens(v["title"]) + [x for tag in v["tags"] for x in tokens(tag)] + bigrams(v["title"])))
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

GENERIC_TAGS = {"fyp", "foryou", "foryoupage", "fy", "viral", "trending", "fürdich", "parati", "xyzbca", "tiktok"}


def build_clusters(an: dict, videos: list[dict], niche: list[str], limit: int = 6) -> list[dict]:
    """Групує сигнали з усіх джерел у теми-кластери і дає по 3 шаблонні ідеї відео на кластер."""
    niche_words = {w for n in niche for w in tokens(n)}
    items = []
    for v in videos:
        items.append({"src": "YouTube", "label": v["title"], "url": v["url"], "w": math.log1p(v["vph"]) + 1,
                      "terms": set(tokens(v["title"])) | {t for tag in v["tags"] for t in tokens(tag)}, "video": v})
    for g in an["google_trends"]:
        items.append({"src": "Google", "label": g["query"], "url": "", "w": math.log1p(g["traffic"]) / 2 + 1,
                      "terms": set(tokens(g["query"] + " " + " ".join(g["news"])))})
    hashtags = [h for h in an["tiktok"].get("hashtags", []) if h["name"].lower() not in GENERIC_TAGS]
    for p in (an.get("threads") or {}).get("posts", []):
        items.append({"src": "Threads", "label": p["text"][:90], "url": p["url"], "w": 1.0, "terms": set(tokens(p["text"]))})
    # Хештег TikTok — одне злите слово («costofliving»), тож шукаємо в ньому слова з інших джерел
    vocab = {t for it in items for t in it["terms"] if len(t) >= 4}
    for h in hashtags:
        name = h["name"].lower()
        terms = {re.sub(r"\d+$", "", name)} | {t for t in vocab if t in name}
        rank = h["rank"] if isinstance(h["rank"], int) else 30
        items.append({"src": "TikTok", "label": "#" + h["name"], "url": "", "w": max(1.0, (31 - rank) / 6), "terms": terms})

    def usable(t):
        return t not in FILLER and t not in niche_words and len(t) >= 3

    # Грубий стемінг: «зарплата/зарплати», «карпати/карпатах» групуються разом; показуємо найчастішу форму
    surface = defaultdict(Counter)

    def stem(t):
        st = t[:6] if len(t) > 6 else t
        surface[st][t] += 1
        return st

    for it in items:
        it["terms"] = {stem(t) for t in it["terms"] if usable(t)}
    word = lambda st: surface[st].most_common(1)[0][0] if surface[st] else st

    weight, count = defaultdict(float), Counter()
    for it in items:
        for t in it["terms"]:
            weight[t] += it["w"]
            count[t] += 1
    seeds = sorted((t for t in weight if count[t] >= 2), key=lambda t: -weight[t])
    assigned, clusters = set(), []
    for seed in seeds:
        members = [i for i, it in enumerate(items) if i not in assigned and seed in it["terms"]]
        if len(members) < 2:
            continue
        co = Counter(t for i in members for t in items[i]["terms"] if t != seed)
        terms = [word(t) for t, c in co.most_common(4) if c >= 2]
        assigned.update(members)
        mem = sorted((items[i] for i in members), key=lambda it: -it["w"])
        best = next((it["video"] for it in mem if it.get("video")), None)
        clusters.append({
            "name": " · ".join([word(seed)] + terms[:2]),
            "seed": word(seed),
            "terms": [word(seed)] + terms,
            "strength": round(sum(it["w"] for it in mem), 1),
            "sources": dict(Counter(it["src"] for it in mem)),
            "signals": [{"src": it["src"], "label": it["label"], "url": it["url"]} for it in mem[:6]],
            "top_video": {"title": best["title"], "url": best["url"], "vph": best["vph"], "is_short": best["is_short"]} if best else None,
        })
        if len(clusters) == limit:
            break
    top = max((c["strength"] for c in clusters), default=1) or 1
    fmt = an.get("format_top") or {}
    short = (fmt.get("shorts_share") or 0) >= 0.4
    for c in clusters:
        c["score"] = round(100 * c["strength"] / top)
        s_, extra = c["seed"].capitalize(), (c["terms"][1] if len(c["terms"]) > 1 else "")
        vids = [{
            "title": f"{s_}: що відбувається і чому всі про це говорять",
            "format": "Short 25–35 с, текст на екрані" if short else "Відео 5–8 хв",
            "hook": f"«{s_}{(' і ' + extra) if extra else ''}: ось що це означає для тебе»",
            "why": "Пояснювач: найшвидший спосіб зайти в тему, поки вона росте",
        }, {
            "title": f"{s_} у цифрах: порівняння",
            "format": "Short 40–60 с, порівняння або топ-5",
            "hook": f"«{s_} у цифрах: що змінилось і де найбільша різниця»",
            "why": "Порівняння і списки дають високе утримання і збереження",
        }]
        if c["top_video"]:
            vids.append({
                "title": f"Своя версія: «{c['top_video']['title'][:60]}»",
                "format": "Short 30–45 с від першої особи" if c["top_video"]["is_short"] else "Відео в тому ж форматі",
                "hook": "Той самий кут, але ваш досвід, ваше місто, ваші цифри",
                "why": f"Найшвидше відео кластера: {fmt_n(c['top_video']['vph'])} переглядів/год",
            })
        else:
            vids.append({
                "title": f"Перевіряю на собі: {c['seed']}",
                "format": "Short 30–45 с від першої особи",
                "hook": f"«Всі говорять про {c['seed']}. Я перевірив»",
                "why": "Особистий досвід вирізняється серед новинних відео",
            })
        c["videos"] = vids
    return clusters


AI_SYSTEM = """Ти досвідчений стратег коротких відео для YouTube Shorts, TikTok і Reels.
Тобі дають зведення трендів, зібране автоматично з YouTube API, Google Trends, TikTok Creative Center і Threads,
а також чорнове автоматичне групування сигналів у кластери.
Твоє завдання: проаналізувати тренди, згрупувати їх у тематичні кластери і для кожного кластера запропонувати
рівно 3 конкретні відео різних форматів, які автор може зняти найближчими днями, щоб зловити хвилю.
Чорнові кластери можна об'єднувати, розділяти, перейменовувати або відкидати, якщо вони беззмістовні.
Спирайся тільки на дані зі зведення; якщо даних мало, так і скажи. Не вигадуй цифр.
Пояснення (summary, why, avoid, format) пиши українською. Назви, хуки, біти сценарію і хештеги пиши мовою цільового ринку,
природно для місцевих глядачів, а не дослівним перекладом. Відповідай лише валідним JSON без markdown."""

AI_SCHEMA_HINT = """Формат відповіді:
{"summary": "2-3 речення: які теми і формати зараз ростуть",
 "clusters": [{"name": "коротка назва теми українською",
               "strength": "висока | середня | низька",
               "why_now": "чому ця тема росте саме зараз, з посиланням на сигнали зі зведення",
               "signals": ["2-4 конкретні сигнали: назви відео, запити, хештеги, пости"],
               "videos": [{"title": "назва відео до 70 символів",
                           "hook": "що сказати/показати в перші 2 секунди",
                           "format": "платформа, тривалість, стиль",
                           "script": ["3-6 коротких бітів сценарію"],
                           "hashtags": ["#..."],
                           "sound": "трендовий звук або стиль музики, якщо доречно",
                           "why": "чому саме цей формат спрацює",
                           "urgency": "зараз | цього тижня | вічнозелене"}]}],
 "avoid": ["що зараз не варто знімати і чому"]}
У кожному кластері рівно 3 відео: різні формати (наприклад, пояснювач, порівняння/список, особистий досвід/реакція)."""


def ai_brief(an: dict, args) -> str:
    brief = {
        "market": args.market_name,
        "regions": args.regions,
        "audience_language": args.lang_name,
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
        "threads_posts": [{"text": p["text"][:200], "query": p["query"]} for p in (an.get("threads") or {}).get("posts", [])[:25]],
        "threads_queries": (an.get("threads") or {}).get("queries", []),
        "draft_clusters": [{"name": c["name"], "terms": c["terms"], "sources": c["sources"],
                            "signals": [x["label"] for x in c["signals"]]} for c in an.get("clusters", [])],
    }
    return (f"Зведення трендів (JSON):\n{json.dumps(brief, ensure_ascii=False)}\n\n"
            f"Проаналізуй тренди і дай {args.clusters} найсильніших кластерів, по 3 відео в кожному, під мою нішу "
            f"для глядачів, які говорять мовою: {args.lang_name}. {AI_SCHEMA_HINT}")


def parse_ai_json(text: str, who: str) -> dict:
    text = re.sub(r"^```(?:json)?|```$", "", text.strip(), flags=re.M).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        warn(f"{who} повернув не-JSON; зберігаю як текст")
        return {"summary": text, "ideas": [], "avoid": []}


def ai_provider(args) -> str | None:
    if args.ai_provider != "auto":
        return args.ai_provider
    if os.environ.get("OPENAI_API_KEY"):
        return "openai"
    if os.environ.get("ANTHROPIC_API_KEY"):
        return "claude"
    warn("для --ai задайте OPENAI_API_KEY або ANTHROPIC_API_KEY")
    return None


def ai_ideas(an: dict, args) -> dict | None:
    provider = ai_provider(args)
    if provider == "openai":
        return openai_ideas(ai_brief(an, args), args)
    if provider == "claude":
        return claude_ideas(ai_brief(an, args), args)
    return None


def openai_ideas(prompt: str, args) -> dict | None:
    try:
        import openai
    except ImportError:
        warn("для ідей через OpenAI встановіть пакет: pip install openai")
        return None
    try:
        client = openai.OpenAI()
        response = client.chat.completions.create(
            model=args.openai_model,
            messages=[{"role": "system", "content": AI_SYSTEM}, {"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
        )
    except openai.AuthenticationError:
        warn("OpenAI: невірний OPENAI_API_KEY")
        return None
    except openai.NotFoundError:
        warn(f"OpenAI: модель «{args.openai_model}» недоступна; вкажіть іншу через --openai-model")
        return None
    except openai.RateLimitError as e:
        warn(f"OpenAI: ліміт або закінчились кошти на балансі API: {e}")
        return None
    except openai.APIStatusError as e:
        warn(f"OpenAI API {e.status_code}: {e.message}")
        return None
    except openai.APIConnectionError as e:
        warn(f"OpenAI: немає з'єднання: {e}")
        return None
    except openai.OpenAIError as e:  # наприклад, ключ не задано
        warn(f"OpenAI: {e}")
        return None
    choice = response.choices[0]
    if getattr(choice.message, "refusal", None):
        warn(f"OpenAI відмовився відповідати: {choice.message.refusal}")
        return None
    return parse_ai_json(choice.message.content or "", "OpenAI")


def claude_ideas(prompt: str, args) -> dict | None:
    try:
        import anthropic
    except ImportError:
        warn("для ідей через Claude встановіть пакет: pip install anthropic")
        return None
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
    return parse_ai_json("".join(b.text for b in response.content if b.type == "text"), "Claude")


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

    gt = "".join(f"""<tr><td><b>{e(g['query'])}</b>{(' <span class="pill">' + e(g['geo']) + '</span>') if g.get('geo') and len(meta.get('regions', [])) > 1 else ''}<div class="sub">{e(' · '.join(g['news'][:2]))}</div></td>
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

    def video_card(i):
        beats = "".join(f"<li>{e(b)}</li>" for b in i.get("script", []))
        tags = " ".join(e(t) for t in i.get("hashtags", []))
        meta_line = tags + ((" · 🎵 " + e(i["sound"])) if i.get("sound") else "")
        return (f'<div class="idea"><div class="ih"><b>{e(i.get("title", ""))}</b>'
                + (f'<span class="pill">{e(i["urgency"])}</span>' if i.get("urgency") else "") + "</div>"
                f'<div class="sub">{e(i.get("format", ""))}</div><p><b>Хук:</b> {e(i.get("hook", ""))}</p>'
                + (f"<ol>{beats}</ol>" if beats else "") + (f'<p class="sub">{meta_line}</p>' if meta_line else "")
                + f'<p class="why">Чому: {e(i.get("why", ""))}</p></div>')

    def cluster_block(c, auto):
        if auto:
            badge = f'<span class="pill">сила {c["score"]}/100</span>'
            src = " ".join(f'<span class="chip">{e(k)}: {v}</span>' for k, v in c["sources"].items())
            sig = "".join(f'<li><span class="pill">{e(x["src"])}</span> '
                          + (f'<a href="{e(x["url"])}" target="_blank" rel="noopener">{e(x["label"])}</a>' if x["url"] else e(x["label"]))
                          + "</li>" for x in c["signals"])
            why = ""
        else:
            badge = f'<span class="pill">{e(c.get("strength", ""))}</span>' if c.get("strength") else ""
            src = ""
            sig = "".join(f"<li>{e(x)}</li>" for x in c.get("signals", []))
            why = f'<p>{e(c.get("why_now", ""))}</p>' if c.get("why_now") else ""
        return (f'<div class="cluster"><div class="ih"><h3>🧩 {e(c.get("name", ""))}</h3>{badge}</div>{why}'
                + (f"<p>{src}</p>" if src else "")
                + (f'<details><summary class="sub">Сигнали</summary><ul class="sig">{sig}</ul></details>' if sig else "")
                + f'<div class="ideas">{"".join(video_card(v) for v in c.get("videos", [])[:3])}</div></div>')

    ai = report.get("ai")
    if ai and ai.get("clusters"):
        avoid = "".join(f"<li>{e(a)}</li>" for a in ai.get("avoid", []))
        ideas_html = (f'<p>{e(ai.get("summary", ""))}</p>' + "".join(cluster_block(c, False) for c in ai["clusters"])
                      + (f"<h3>Чого уникати</h3><ul>{avoid}</ul>" if avoid else ""))
    elif an.get("clusters"):
        ideas_html = ('<p class="muted">Автоматичні кластери з шаблонними ідеями. Запустіть з <code>--ai</code>, '
                      "щоб AI (OpenAI або Claude) проаналізував кластери й написав 3 відео зі сценарієм для кожного.</p>"
                      + "".join(cluster_block(c, True) for c in an["clusters"]))
    else:
        ideas_html = '<p class="muted">Замало даних, щоб виділити кластери.</p>'

    th = an.get("threads") or {}
    th_rows = "".join(
        f'<tr><td>{e(p["text"][:160])}<div class="sub">@{e(p["username"])} · {e(p["query"])}</div></td>'
        f'<td class="num">' + (f'<a href="{e(p["url"])}" target="_blank" rel="noopener">відкрити</a>' if p["url"] else "") + "</td></tr>"
        for p in th.get("posts", [])[:12])
    th_q = " ".join(f'<span class="chip">{e(q["query"])}: {q["posts"]} постів, {q["last_48h"]} за 48 год</span>' for q in th.get("queries", []))
    th_kw = " ".join(f'<span class="chip">{e(k)}</span>' for k, _ in th.get("keywords", [])[:15])
    threads_html = ((f"<p>{th_q}</p>" if th_q else "") + (f"<p>{th_kw}</p>" if th_kw else "")
                    + (f'<div class="scroll"><table><tr><th>Пост</th><th></th></tr>{th_rows}</table></div>' if th_rows else
                       '<p class="muted">Немає даних. Потрібен THREADS_ACCESS_TOKEN (див. trends/README.md).</p>'))

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
.cluster{{border-top:1px solid var(--line);padding-top:12px;margin-top:14px}}.cluster h3{{margin:0;font-size:16px}}.cluster .ih{{align-items:center;margin-bottom:6px}}
.sig{{font-size:13px;margin:6px 0 10px}}details summary{{cursor:pointer;margin:4px 0}}
</style></head><body><main>
<h1>Тренди: {e(meta.get('market_name') or meta['region'])}{(' · ' + e(', '.join(meta['niche']))) if meta['niche'] else ''}</h1>
<div class="muted"><a href="index.html">← усі ринки</a> · {e(', '.join(meta.get('regions', [meta['region']])))} · Згенеровано {e(meta['generated_local'])} · YouTube, Google Trends, TikTok Creative Center, Threads{' · ДЕМО-ДАНІ' if meta.get('demo') else ''}</div>
<div class="tiles">{tiles_html}</div>

<section><h2>🧩 Кластери трендів: по 3 відео на кожен</h2>{ideas_html}</section>

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

<section><h2>🧵 Threads: про що пишуть</h2>{threads_html}</section>

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
    clusters = (report.get("ai") or {}).get("clusters") or an.get("clusters") or []
    if clusters:
        print("Кластери:")
        for c in clusters:
            print(f"  🧩 {c.get('name', '')}")
            for v in c.get("videos", [])[:3]:
                print(f"     - {v.get('title', '')}")
    f = an.get("format_top") or {}
    if f:
        print(f"Формат топу: Shorts {pct(f.get('shorts_share'))}, медіана {fmt_dur(f.get('median_duration_s') or 0)}, "
              f"залучення {pct(f.get('median_er'))}")


# --------------------------------------------------------------------------- main

def load_markets() -> dict:
    data = json.loads((HERE / "markets.json").read_text(encoding="utf-8"))
    return {k: v for k, v in data.items() if not k.startswith("_")}


def run_market(args, now: dt.datetime, out_dir: Path) -> dict | None:
    """Збирає й аналізує один ринок; повертає звіт або None, якщо даних немає."""
    tz = ZoneInfo(args.tz) if ZoneInfo else None
    history = out_dir / "history"
    history.mkdir(parents=True, exist_ok=True)

    print(f"\n### {args.market_name}: {', '.join(args.regions)}")
    sources = {}
    if args.demo:
        demo_all = json.loads((HERE / "demo_data.json").read_text(encoding="utf-8"))
        demo = demo_all.get(args.market_key) or demo_all["ua"]
        # Зсуваємо дати демо-даних до «зараз», щоб швидкість переглядів була реалістичною
        videos = []
        for v in demo["videos"]:
            v = dict(v)
            v["published_at"] = (now - dt.timedelta(hours=v.pop("age_hours"))).isoformat()
            videos.append(v)
        gtrends, tiktok = demo["google_trends"], demo["tiktok"]
        threads_demo = demo.get("threads")
        sources = {"demo": {"status": "демо-дані з trends/demo_data.json (вигадані)"}}
    else:
        videos, gtrends, tiktok = [], [], {"hashtags": [], "songs": []}
        threads_demo = None
        if not args.no_youtube:
            videos, sources["YouTube"] = collect_youtube(args)
        if not args.no_google:
            for region in args.regions:
                found, sources[f"Google Trends {region}"] = collect_google_trends(region)
                gtrends += found
        if not args.no_tiktok:
            tiktok, sources["TikTok"] = collect_tiktok(args.region, args.tiktok_period)

    if not videos and not gtrends and not tiktok.get("hashtags") and not os.environ.get("THREADS_ACCESS_TOKEN"):
        warn(f"{args.market_name}: жодне джерело не дало даних")
        return None

    score_videos(videos, now)
    niche_slug = "-".join(re.sub(r"\W+", "_", n.lower()).strip("_") for n in args.niche) or "all"
    snap_name = f"{args.market_key}_{niche_slug}"
    snaps = sorted(history.glob(f"{snap_name}_*.json"))
    prev = json.loads(snaps[-1].read_text(encoding="utf-8")) if snaps and not args.demo else None
    an = analyze(videos, gtrends, tiktok, tz, prev)
    if threads_demo is not None:
        an["threads"] = threads_demo
    elif not args.no_threads:
        niche_words = {w for n in args.niche for w in tokens(n)}
        extra = [k for k, _ in an["keywords"] if " " not in k and k not in FILLER and k not in niche_words][:3]
        an["threads"], sources["Threads"] = collect_threads(list(dict.fromkeys(args.niche[:3] + extra)), now)
    an["clusters"] = build_clusters(an, videos, args.niche, args.clusters)

    report = {
        "meta": {
            "market": args.market_key, "market_name": args.market_name, "region": args.region,
            "regions": args.regions, "lang": args.lang, "niche": args.niche, "tz": args.tz, "demo": args.demo,
            "generated_utc": now.isoformat(),
            "generated_local": (now.astimezone(tz) if tz else now).strftime("%Y-%m-%d %H:%M"),
            "sources": sources,
        },
        "analysis": an,
        "videos": videos,
    }
    if args.ai:
        provider = ai_provider(args)
        if provider:
            print(f"  Питаю {'OpenAI (' + args.openai_model if provider == 'openai' else 'Claude (' + args.model}) : аналіз кластерів і ідеї…")
            report["ai"] = ai_ideas(an, args)

    stamp = now.astimezone(ZoneInfo("Europe/Kyiv") if ZoneInfo else None).strftime("%Y%m%d_%H%M")
    if not args.demo:
        (history / f"{snap_name}_{stamp}.json").write_text(json.dumps(
            {"generated_utc": now.isoformat(), "keywords": dict(an["keywords"])}, ensure_ascii=False), encoding="utf-8")
    base = out_dir / f"trends_{snap_name}_{stamp}{'_demo' if args.demo else ''}"
    base.with_suffix(".json").write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding="utf-8")
    page = render_html(report)
    base.with_suffix(".html").write_text(page, encoding="utf-8")
    (out_dir / f"latest_{args.market_key}.html").write_text(page, encoding="utf-8")
    report["file"] = f"latest_{args.market_key}.html"

    print_summary(report)
    print(f"Звіт: {base.with_suffix('.html')}")
    return report


def cross_market(reports: list[dict]) -> dict:
    """Що є в кількох ринках одразу, і що вже є в США, але ще не дійшло до інших."""
    generic = GENERIC_TAGS
    tags = {r["meta"]["market"]: {h["name"].lower() for h in r["analysis"]["tiktok"].get("hashtags", [])} - generic for r in reports}
    kws = {r["meta"]["market"]: {k for k, _ in r["analysis"]["keywords"]} for r in reports}
    names = {r["meta"]["market"]: r["meta"]["market_name"] for r in reports}

    def shared(sets):
        cnt = Counter(x for s in sets.values() for x in s)
        return sorted(((x, [names[m] for m, s in sets.items() if x in s]) for x, c in cnt.items() if c >= 2),
                      key=lambda t: -len(t[1]))

    ahead = {}
    if "us" in tags:
        for m, t in tags.items():
            if m != "us":
                ahead[names[m]] = [h for h in (x["name"] for r in reports if r["meta"]["market"] == "us"
                                               for x in r["analysis"]["tiktok"].get("hashtags", []))
                                   if h.lower() not in t and h.lower() not in generic][:12]
    return {"shared_hashtags": shared(tags)[:20], "shared_keywords": shared(kws)[:20], "us_ahead": ahead}


def render_index(reports: list[dict], cross: dict, generated: str, demo: bool) -> str:
    e = html.escape
    cols = []
    for r in reports:
        an, m = r["analysis"], r["meta"]
        f = an.get("format_top") or {}
        hours = sorted(an["best_hours"], key=lambda x: -x[1])[:3]
        li = lambda items: "".join(f"<li>{x}</li>" for x in items) or '<li class="muted">немає даних</li>'
        clusters = (r.get("ai") or {}).get("clusters") or an.get("clusters") or []
        cl_html = "".join(f'<li><b>{e(c.get("name", ""))}</b><ul>'
                          + "".join(f'<li>{e(v.get("title", ""))}</li>' for v in c.get("videos", [])[:3]) + "</ul></li>"
                          for c in clusters[:4]) or '<li class="muted">немає даних</li>'
        cols.append(f"""<section><h2>{e(m['market_name'])}</h2>
<div class="sub">{e(', '.join(m['regions']))} · ніша: {e(', '.join(m['niche']) or '—')}</div>
<p><a class="btn" href="{e(r['file'])}">Повний звіт →</a></p>
<div class="kpis"><div><b>{pct(f.get('shorts_share'))}</b><span>Shorts у топі</span></div>
<div><b>{fmt_dur(f.get('median_duration_s') or 0)}</b><span>медіана</span></div>
<div><b>{e(', '.join(f'{h}:00' for h, _ in hours) or '—')}</b><span>години топу ({e(m['tz'].split('/')[-1])})</span></div></div>
<h3>🔑 Ключові слова</h3><p>{''.join(f'<span class="chip">{e(k)}</span>' for k, _ in an['keywords'][:10]) or '<span class="muted">—</span>'}</p>
{('<h3>📈 Ростуть</h3><p>' + ''.join(f'<span class="chip up">{e(x["term"])} <b>{e(x["change"])}</b></span>' for x in an['rising_keywords'][:8]) + '</p>') if an['rising_keywords'] else ''}
<h3>🔎 Google Trends</h3><ol>{li(e(g['query']) for g in an['google_trends'][:6])}</ol>
<h3>#️⃣ TikTok</h3><p>{''.join(f'<span class="chip">#{e(h["name"])}</span>' for h in an['tiktok'].get('hashtags', [])[:8]) or '<span class="muted">немає даних</span>'}</p>
<h3>🔥 Топ відео</h3><ol>{li(f'<a href="{e(v["url"])}" target="_blank" rel="noopener">{e(v["title"])}</a> <span class="sub">{fmt_n(v["vph"])}/год</span>' for v in an['top_videos'][:5])}</ol>
<h3>🧩 Кластери і відео</h3><ul>{cl_html}</ul></section>""")

    def shared_html(items, prefix=""):
        return "".join(f'<li><b>{e(prefix + x)}</b> <span class="sub">{e(" · ".join(ms))}</span></li>' for x, ms in items) \
            or '<li class="muted">Спільних поки немає</li>'
    ahead = "".join(f"<p><b>{e(m)}:</b> " + (" ".join(f'<span class="chip">#{e(h)}</span>' for h in hs) or '<span class="muted">—</span>') + "</p>"
                    for m, hs in cross["us_ahead"].items())
    return f"""<!doctype html><html lang="uk"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Тренди: три ринки</title>
<style>
:root{{--bg:#f7f7f8;--card:#fff;--fg:#17171a;--muted:#6b6b76;--line:#e6e6ea;--acc2:#0b7bdc;--ok:#1a9f5a}}
@media (prefers-color-scheme:dark){{:root{{--bg:#111114;--card:#1b1b20;--fg:#ececf1;--muted:#9a9aa6;--line:#2c2c33;--acc2:#4aa8ff;--ok:#3dd68c}}}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}}
main{{max-width:1300px;margin:0 auto;padding:24px 16px 64px}}h1{{margin:0 0 4px;font-size:26px}}h2{{margin:0;font-size:20px}}h3{{font-size:14px;margin:16px 0 6px}}
.muted,.sub{{color:var(--muted)}}.sub{{font-size:12.5px}}a{{color:var(--acc2);text-decoration:none}}
section{{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px}}
.cols{{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(340px,100%),1fr));gap:16px;margin-top:16px}}
.chip{{display:inline-block;margin:2px;padding:3px 9px;border-radius:99px;border:1px solid var(--line);font-size:13px}}.chip.up b{{color:var(--ok)}}
.btn{{display:inline-block;padding:6px 12px;border-radius:8px;border:1px solid var(--acc2)}}
.kpis{{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}}.kpis div{{border:1px solid var(--line);border-radius:10px;padding:8px}}.kpis b{{display:block;font-size:17px}}.kpis span{{font-size:12px;color:var(--muted)}}
ol,ul{{padding-left:20px;margin:4px 0}}li{{margin:3px 0}}
</style></head><body><main>
<h1>Тренди: три ринки</h1><div class="muted">Згенеровано {e(generated)}{' · ДЕМО-ДАНІ (вигадані)' if demo else ''}</div>
<div class="cols">
<section><h2>🌍 Тренд у кількох ринках</h2><p class="sub">Хештеги й слова, що є одразу в кількох ринках. Ці теми найбезпечніше знімати на всі три канали.</p>
<h3>TikTok-хештеги</h3><ul>{shared_html(cross['shared_hashtags'], '#')}</ul><h3>Слова</h3><ul>{shared_html(cross['shared_keywords'])}</ul></section>
<section><h2>⏩ Уже в США, ще не у вас</h2><p class="sub">Хештеги з TikTok США, яких ще немає в топі інших ринків. Тренди зі США часто доходять до Європи за 1–3 тижні: можна зняти першим.</p>{ahead or '<p class="muted">Потрібен ринок us і ще хоча б один.</p>'}</section>
</div>
<div class="cols">{''.join(cols)}</div>
</main></body></html>"""


def main(argv=None) -> int:
    markets = load_markets()
    p = argparse.ArgumentParser(description="Аналіз трендів YouTube / TikTok / Google для ідей відео",
                                formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    p.add_argument("--markets", default="ua,de,us",
                   help=f"ринки через кому з trends/markets.json: {', '.join(markets)}; або 'all'")
    p.add_argument("--market", default=None, help="один ринок (скорочення для --markets)")
    p.add_argument("--region", default=None, help="замість ринку: довільна країна ISO (PL, FR…)")
    p.add_argument("--lang", default="en", help="мова пошуку для --region")
    p.add_argument("--niche", action="append", default=[], help="нішева фраза; замінює фрази ринку; можна кілька разів")
    p.add_argument("--about", default="", help="1–2 речення про ваш канал (для --ai)")
    p.add_argument("--days", type=int, default=7, help="наскільки свіжі відео в ніші")
    p.add_argument("--limit", type=int, default=50, help="скільки відео з «Популярного» на країну")
    p.add_argument("--niche-limit", type=int, default=25, help="скільки відео на кожну нішеву фразу")
    p.add_argument("--category", default=None, help="ID категорії YouTube (24=Розваги, 10=Музика, 20=Ігри, 22=Люди і блоги, 27=Освіта, 28=Наука)")
    p.add_argument("--shorts-only", action="store_true", help="у ніші шукати лише короткі відео")
    p.add_argument("--tiktok-period", type=int, default=7, choices=[7, 30, 120], help="період TikTok у днях")
    p.add_argument("--tz", default=None, help="часовий пояс (за замовчуванням з ринку)")
    p.add_argument("--no-youtube", action="store_true")
    p.add_argument("--no-google", action="store_true")
    p.add_argument("--no-tiktok", action="store_true")
    p.add_argument("--no-threads", action="store_true")
    p.add_argument("--clusters", type=int, default=5, help="скільки кластерів трендів (по 3 відео в кожному)")
    p.add_argument("--ai", action="store_true", help="згенерувати ідеї через AI (потрібен OPENAI_API_KEY або ANTHROPIC_API_KEY)")
    p.add_argument("--ai-provider", default="auto", choices=["auto", "openai", "claude"],
                   help="хто пише ідеї; auto = OpenAI, якщо задано OPENAI_API_KEY, інакше Claude")
    p.add_argument("--openai-model", default="gpt-5.4-mini", help="модель OpenAI для --ai")
    p.add_argument("--model", default="claude-opus-5-5", help="модель Claude для --ai")
    p.add_argument("--out", default=str(HERE / "out"), help="тека для звітів")
    p.add_argument("--demo", action="store_true", help="без мережі: показати звіт на демо-даних")
    args = p.parse_args(argv)

    if args.region:
        region = args.region.upper()
        plan = {region.lower(): {"name": region, "regions": [region], "lang": args.lang, "lang_name": args.lang,
                                 "tz": args.tz or "UTC", "niche": []}}
    else:
        keys = list(markets) if args.markets == "all" else [k.strip().lower() for k in (args.market or args.markets).split(",") if k.strip()]
        unknown = [k for k in keys if k not in markets]
        if unknown:
            p.error(f"невідомі ринки: {', '.join(unknown)}; є: {', '.join(markets)}")
        plan = {k: markets[k] for k in keys}

    now = dt.datetime.now(dt.timezone.utc)
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    reports = []
    for key, m in plan.items():
        a = argparse.Namespace(**vars(args))
        a.market_key, a.market_name = key, m["name"]
        a.regions = [r.upper() for r in m["regions"]]
        a.region = a.regions[0]
        a.lang, a.lang_name = m["lang"], m.get("lang_name", m["lang"])
        a.tz = args.tz or m["tz"]
        a.niche = args.niche or list(m.get("niche", []))
        rep = run_market(a, now, out_dir)
        if rep:
            reports.append(rep)

    if not reports:
        print("\nЖодне джерело не дало даних. Перевірте ключ YOUTUBE_API_KEY та доступ до інтернету,"
              " або запустіть з --demo, щоб побачити приклад звіту.", file=sys.stderr)
        return 1
    generated = now.astimezone(ZoneInfo("Europe/Kyiv") if ZoneInfo else None).strftime("%Y-%m-%d %H:%M")
    (out_dir / "index.html").write_text(render_index(reports, cross_market(reports), generated, args.demo), encoding="utf-8")
    print(f"\nЗагальна сторінка: {out_dir / 'index.html'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
