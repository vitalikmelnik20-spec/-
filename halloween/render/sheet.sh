#!/bin/bash
# contact sheet: sheet.sh out.jpg cols files...
out=$1; cols=$2; shift 2
ffmpeg -nostdin -y -loglevel error $(for f in "$@"; do echo -i $f; done) -filter_complex "$(i=0; for f in "$@"; do echo -n "[$i:v]scale=480:270,drawtext=text='$(basename $f .jpg)':x=8:y=8:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.5[s$i];"; i=$((i+1)); done; for j in $(seq 0 $(($#-1))); do echo -n "[s$j]"; done; echo -n "xstack=inputs=$#:layout=$(python3 -c "
n=$#;c=$cols;print('|'.join(f'{(i%c)*480}_{(i//c)*270}' for i in range(n)))")[o]")" -map "[o]" -q:v 3 $out
