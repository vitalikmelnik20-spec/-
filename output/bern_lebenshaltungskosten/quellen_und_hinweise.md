# Bern – Lebenshaltungskosten: Zahlen, Umrechnung, Hinweise

## Herkunft der Zahlen

Alle Beträge stammen aus dem vorgegebenen Text des Auftraggebers. Dort standen sie in US-Dollar. Sie wurden **nicht** einzeln aus einer Primärquelle nachrecherchiert.

Ein kurzer Plausibilitätsabgleich mit Expat-Kostenseiten ergibt:

- **[Lifeindexed 2026](https://lifeindexed.com/cost/europe/switzerland/bern/):** 1-Zimmer-Wohnung ca. CHF 1.961/Monat, Einzelperson ca. CHF 3.089/Monat.
- **[Expat Exchange](https://www.expatexchange.com/gdc/8/104/5024/Switzerland/Cost-of-Living-in-Bern):** Zentrum CHF 1.200–1.500, außerhalb CHF 1.000–1.300 (Stand 2024).

Die Mieten im Video liegen damit eher am oberen Rand der Angaben. Im Video sind alle Werte als **Richtwerte** gekennzeichnet („etwa“, „rund“, „ca.“).

## Währungsumrechnung

| | |
|---|---|
| Kurs | EZB-Referenzkurs vom **9. Oktober 2026**: **1 EUR = 1,1206 USD** ([EZB](https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html)) |
| Rundung | auf glatte, sprechbare Beträge (10 € bzw. 100 €); Abweichung ≤ 1 % |

| Posten | Original (USD) | exakt (EUR) | im Video |
|---|---:|---:|---:|
| Miete 1-Zimmer, außerhalb | 1.500 $ | 1.339 € | **1.340 €** |
| Miete 1-Zimmer, Zentrum | 2.000 $ | 1.785 € | **1.780 €** |
| Lebensmittel | 620 $ | 553 € | **550 €** |
| Krankenversicherung | 460 $ | 410 € | **410 €** |
| Transport | 105 $ | 94 € | **95 €** |
| Gesamt pro Person/Monat | 3.700–4.400 $ | 3.302–3.926 € | **3.300–3.900 €** |
| Nettogehalt (Durchschnitt) | 7.200 $ | 6.425 € | **6.400 €** |
| Wohnung kaufen | 1,1 Mio. $ | 981.617 € | **980.000 €** („fast eine Million“) |

Die Einblendung „**Bleiben: ca. 2.500–3.100 €**“ ist eine reine Rechnung aus den Zahlen oben (6.400 € − 3.900 € bzw. − 3.300 €), keine zusätzliche Quelle.

## Hinweise

- **Währung.** In der Schweiz wird in **Franken (CHF)** bezahlt, nicht in Euro. Die Euro-Beträge dienen nur dem Vergleich und schwanken mit dem Wechselkurs.
- **Kurs prüfen.** Wird das Video deutlich später veröffentlicht, Kurs und Beträge neu prüfen. Die Beträge stehen in `bern/src/lines.py`; danach `bash bern/render.sh` ausführen.
- **Visuals.** Alle Bilder (Bundeshaus über der Aare mit Berner Alpen, Altstadt-Lauben mit Zytglogge, rotes Tram, Wohnhaus) sind **eigene Vektor-Illustrationen**. Stock-Footage ist in dieser Umgebung nicht erreichbar.
- **Kein Logo.** Das Tram trägt kein Betreiberlogo, die Zielanzeige lautet „ZYTGLOGGE“.
- **Schweizer Flagge.** Die Flagge auf der Bundeshaus-Kuppel ist als Wahrzeichen dargestellt.
