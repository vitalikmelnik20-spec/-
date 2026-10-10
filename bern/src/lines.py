"""Narration (German), one entry per scene. Prices: the brief's USD figures converted to EUR at the
ECB reference rate of 9 Oct 2026 (1 EUR = 1.1206 USD), rounded the way they are said ("etwa").
Numbers are spelled out because the VITS voice reads characters, not digits."""
USD_PER_EUR = 1.1206
FIGURES = {  # key: (USD from the brief, EUR shown)
    "rent_out": (1500, 1340), "rent_center": (2000, 1780), "food": (620, 550), "health": (460, 410),
    "transport": (105, 95), "total_lo": (3700, 3300), "total_hi": (4400, 3900), "salary": (7200, 6400),
    "buy": (1_100_000, 980_000),
}
LINES = [
    ("hook",   "Wie viel kostet das Leben in Bern, der Hauptstadt der Schweiz?"),
    ("rent",   "Die Miete für eine Einzimmerwohnung liegt bei etwa tausenddreihundertvierzig Euro pro Monat außerhalb des Zentrums, und tausendsiebenhundertachtzig Euro im Zentrum."),
    ("month",  "Für Lebensmittel benötigt man rund fünfhundertfünfzig Euro, die Krankenversicherung kostet vierhundertzehn Euro, und der Transport etwa fünfundneunzig Euro monatlich."),
    ("total",  "Mit Nebenkosten und anderen Ausgaben gibt eine Person etwa dreitausenddreihundert bis dreitausendneunhundert Euro im Monat aus."),
    ("salary", "Das durchschnittliche Nettogehalt liegt bei etwa sechstausendvierhundert Euro."),
    ("buy",    "Eine eigene Wohnung kaufen? Das könnte rund neunhundertachtzigtausend Euro kosten. Fast eine Million!"),
    ("cta",    "Ist das Leben in Bern diesen Preis wert? Schreib ja oder nein in die Kommentare!"),
]
