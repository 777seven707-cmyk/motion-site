"""Cuts one ElevenLabs take into its phrases and lays each phrase on the
moment its words appear on screen, then ducks the music under the voice,
normalises to -14 LUFS and trims the video to its final length.

    python3 tools/mix_voice.py <voice.mp3> <video.mp4> <out.mp4>
"""
import subprocess
import sys

VOICE, VIDEO, OUT = sys.argv[1:4]
END = 25.0
PRE, POST = 0.05, 0.12

# (phrase start, phrase end) in the take → when the first word should be heard
PHRASES = [
    (0.06, 1.00, 0.15),    # Устал от всего?
    (1.56, 2.33, 2.62),    # Это не лень.
    (2.69, 3.53, 3.62),    # И не слабость.
    (4.02, 6.55, 5.30),    # Просто слишком долго всё держалось на тебе.
    (7.07, 7.35, 8.92),    # Стоп.  (with the thud and the letters)
    (7.91, 9.68, 10.15),   # Сегодня можно сделать меньше.
    (9.96, 10.94, 13.30),  # И не винить себя.  (as the label slides in)
    (11.42, 14.10, 15.20), # Одно маленькое дело — уже достаточно.
    (14.61, 16.08, 19.70), # А выдохнуть можно в Хавн.  («Хавн» as the letters land)
    (16.48, 18.31, 22.00), # Сохрани на день, когда нет сил.
]

chains, labels = [], []
for i, (a, b, at) in enumerate(PHRASES):
    s, e = a - PRE, b + POST
    if i + 1 < len(PHRASES):
        e = min(e, (b + PHRASES[i + 1][0]) / 2)
    ms = int(round((at - PRE) * 1000))
    chains.append(
        f"[1:a]atrim={max(0, s):.3f}:{e:.3f},asetpts=PTS-STARTPTS,aresample=48000,"
        f"aformat=channel_layouts=stereo,afade=t=in:d=0.015,afade=t=out:st={e - s - 0.06:.3f}:d=0.06,"
        f"adelay={ms}|{ms}[p{i}]")
    labels.append(f"[p{i}]")

fc = ";".join(chains) + ";" + "".join(labels) + (
    f"amix=inputs={len(PHRASES)}:normalize=0,highpass=f=75,deesser=i=0.35,"
    "acompressor=threshold=-20dB:ratio=2.5:attack=8:release=150:makeup=2,volume=2.2,apad[vo];"
    "[vo]asplit=2[vo1][vo2];"
    "[0:a]volume=0.85[bedin];"
    "[bedin][vo1]sidechaincompress=threshold=0.025:ratio=5:attack=25:release=400[bed];"
    "[bed][vo2]amix=inputs=2:normalize=0:duration=first,"
    f"atrim=0:{END},afade=t=out:st={END - 0.6}:d=0.6,"
    "loudnorm=I=-14:TP=-1.5:LRA=9,aresample=48000,alimiter=limit=0.8:level=false[a]")

subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", VIDEO, "-i", VOICE, "-filter_complex", fc,
                "-map", "0:v", "-map", "[a]", "-t", str(END), "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
                "-ar", "48000", "-movflags", "+faststart", OUT], check=True)
print("written", OUT)
