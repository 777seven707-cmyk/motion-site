#!/usr/bin/env bash
# Puts the ElevenLabs lines on their timecodes over the finished video,
# ducks the music bed under the voice and normalises to -14 LUFS.
#   tools/mix_vo.sh <video.mp4> <dir with 1.mp3..8.mp3> <out.mp4>
set -euo pipefail
VIDEO=$1; DIR=$2; OUT=$3
# start of each line in ms (see VOICEOVER.md)
STARTS=(150 2600 5300 8850 10300 15200 19700 22000)

inputs=(-i "$VIDEO"); chains=""; labels=""; n=0
for i in "${!STARTS[@]}"; do
  f=$(ls "$DIR/$((i + 1))".* 2>/dev/null | head -1 || true)
  [ -z "$f" ] && { echo "skip line $((i + 1)): no file"; continue; }
  inputs+=(-i "$f"); n=$((n + 1))
  chains+="[$n:a]aresample=48000,aformat=channel_layouts=stereo,adelay=${STARTS[$i]}|${STARTS[$i]}[v$n];"
  labels+="[v$n]"
done
[ "$n" -eq 0 ] && { echo "no voice files in $DIR"; exit 1; }

ffmpeg -y "${inputs[@]}" -filter_complex "\
${chains}${labels}amix=inputs=$n:normalize=0,highpass=f=80,acompressor=threshold=-18dB:ratio=3:attack=5:release=120[vo];\
[vo]apad,asplit=2[vo1][vo2];\
[0:a][vo1]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=350[bed];\
[bed][vo2]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5:LRA=9,aresample=48000,alimiter=limit=0.75:level=false[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart "$OUT"
echo "written $OUT"
