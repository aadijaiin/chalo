#!/bin/sh
# Renders both formats, then levels the sound to -14 LUFS (what YouTube, Instagram and most
# players aim for), so the video doesn't sound quieter than everything around it.
#   sh scripts/finish.sh [en|hi]
set -e
lang=${1:-en}
suffix=$([ "$lang" = en ] && echo "" || echo "-$lang")
mkdir -p out
for comp in Landscape Portrait; do
  shape=$([ "$comp" = Landscape ] && echo 16x9 || echo 9x16)
  npx remotion render "$comp" "out/raw-$shape$suffix.mp4" --props="{\"lang\":\"$lang\"}" --log=error
  ffmpeg -y -hide_banner -loglevel error -i "out/raw-$shape$suffix.mp4" -c:v copy \
    -af loudnorm=I=-14:TP=-1:LRA=11 -c:a aac -b:a 192k -movflags +faststart "out/chalo$suffix-$shape.mp4"
  rm "out/raw-$shape$suffix.mp4"
  echo "out/chalo$suffix-$shape.mp4"
done
