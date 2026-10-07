#!/usr/bin/env bash
# Copies the Mixkit SFX used by ChicagoV2 from the installed video-shotcraft skill (Mixkit License:
# free to use in videos, not to be redistributed as standalone files — so they are not committed).
set -euo pipefail; cd "$(dirname "$0")/.."
S=../.claude/skills/video-shotcraft/assets/audio/sfx
[ -d "$S" ] || { echo "run tools/setup-video-tools.sh first"; exit 1; }
mkdir -p public/chicago/sfx
for f in transition/whoosh-fast transition/swoosh-quick transition/transition-soft transition/warp-slide transition/whoosh-big riser/riser-cine \
  impact/impact-deep-whoosh impact/bass-hit-short impact/hit-fast-exciting impact/impact-movie-epic camera/click-camera camera/zoom-swipe-fast \
  counter/clock-tick-single ui/ui-confirm-bleep ui/ui-message-pop ui/pop-electric ui/ui-success-soft light/sparkle light/shimmer-sparkle-sweep \
  paper/paper-slide paper/paper-page-turn mech/lock-quick data/data-compute; do cp "$S/$f.mp3" public/chicago/sfx/; done
echo "sfx ready"
