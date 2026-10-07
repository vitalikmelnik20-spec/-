#!/usr/bin/env bash
# Restores the video toolchain in a fresh cloud session with one command:
#   bash tools/setup-video-tools.sh
# 1) third-party skills for Claude Code -> .claude/skills/ (git-ignored)
# 2) Remotion + HyperFrames + GSAP + Lottie -> remotion-lab/node_modules (from remotion-lab/package-lock.json)
# 3) Python audio helpers (numpy, scipy, soundfile, pyloudnorm, kokoro-onnx)
# Sources (cloned shallow, read-only use):
#   remotion-dev/skills           – official Remotion agent skills (Remotion: free for individuals / ≤3-person companies)
#   heygen-com/hyperframes        – HTML -> video framework + skills (Apache-2.0)
#   Vincentwei1021/video-shotcraft – Remotion shot recipes / motion library (Apache-2.0)
#   Vincentwei1021/anything2explainer – topic -> narrated explainer (PolyForm NONCOMMERCIAL: commercial use needs the author's OK)
#   mvanhorn/last30days-skill     – last-30-days trend research (MIT)
set -euo pipefail
cd "$(dirname "$0")/.."
DEST=.claude/skills
SRC=$(mktemp -d)
mkdir -p "$DEST"
clone() { git clone -q --depth 1 "https://github.com/$1.git" "$SRC/$(echo "$1" | tr / _)"; }
clone remotion-dev/skills
clone heygen-com/hyperframes
clone Vincentwei1021/video-shotcraft
clone Vincentwei1021/anything2explainer
clone mvanhorn/last30days-skill
# one directory per skill; each keeps the files its SKILL.md references
for d in "$SRC"/remotion-dev_skills/skills/*/; do n=$(basename "$d"); rm -rf "$DEST/$n"; cp -r "$d" "$DEST/$n"; done
for d in "$SRC"/heygen-com_hyperframes/skills/*/; do n=$(basename "$d"); rm -rf "$DEST/$n"; cp -r "$d" "$DEST/$n"; done
cp "$SRC"/heygen-com_hyperframes/LICENSE "$DEST/hyperframes/LICENSE" 2>/dev/null || true
for r in video-shotcraft anything2explainer; do
  rm -rf "$DEST/$r"; mkdir -p "$DEST/$r"
  (cd "$SRC/Vincentwei1021_$r" && tar --exclude=.git --exclude=node_modules -cf - .) | (cd "$DEST/$r" && tar -xf -)
done
# last30days (MIT): trend research across Reddit/X/YouTube/HN/Polymarket/web. Needs Python 3.12+
# (.claude/settings.json sets LAST30DAYS_PYTHON). Browser-cookie reads stay OFF unless you explicitly consent.
rm -rf "$DEST/last30days"; cp -r "$SRC/mvanhorn_last30days-skill/skills/last30days" "$DEST/last30days"; cp "$SRC/mvanhorn_last30days-skill/LICENSE" "$DEST/last30days/"
rm -rf "$SRC"
echo "installed skills:"; ls "$DEST" | tr '\n' ' '; echo
(cd remotion-lab && npm ci --silent)
pip install -q numpy scipy soundfile pyloudnorm kokoro-onnx
echo "remotion-lab ready; python audio helpers ready"
