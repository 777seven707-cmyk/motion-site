# HAVN · «Устал от всего?»

TikTok-рубрика для слота «среда 21.10, 22:00» (ролик №12 плана недели),
переделанная с нуля: тушь от руки + бумажный коллаж, кинетическая
типографика, параллакс слоёв, музыка и звуковой дизайн.

- `release/havn_ustal_ot_vsego.mp4` — готовое видео: 1080×1920, 60 fps,
  25,5 с, H.264 + AAC, музыка и SFX без голоса
- `release/havn_ustal_ot_vsego_s_golosom.mp4` — **финал для публикации**: с голосом
  (ElevenLabs, Tatyana Voloshina), 25 с, −14 LUFS
- `release/cover.png` — кадр для обложки
- `VOICEOVER.md` — текст для ElevenLabs с таймкодами, настройки голоса,
  описание к публикации
- `STORYBOARD.md` — раскадровка и отброшенные варианты

## Исходники

- `index.html` + `scene.js` — вся анимация на Canvas 2D: таймлайн `T`,
  камера `CAMK`, по одной функции на сцену. В браузере (через любой
  статический сервер) играет в реальном времени; `?t=12.3` показывает один
  кадр.
- `tools/render.mjs` — покадровый рендер в headless Chromium → ffmpeg
  (`node tools/render.mjs video 4`; `stills 1.5 7.6` — отдельные кадры).
- `tools/audio.py` — музыка и SFX синтезируются в numpy по списку событий,
  который экспортирует сцена (`out/sfx.json`).
- `tools/mix_voice.py` — режет один дубль ElevenLabs на фразы и ставит каждую
  под её слово на экране (`python3 tools/mix_voice.py voice.mp3 video.mp4 out.mp4`).
- `tools/mix_vo.sh` — подкладывает реплики ElevenLabs на таймкоды,
  приглушает под ними музыку и нормализует громкость.

Полная сборка:

```
node tools/render.mjs video 4      # out/video.mp4 + out/sfx.json
python3 tools/audio.py             # out/music_sfx.wav
ffmpeg -i out/video.mp4 -i out/music_sfx.wav -map 0:v -map 1:a -c:v copy \
  -c:a aac -b:a 192k -shortest -movflags +faststart out/havn_ustal_ot_vsego.mp4
```

Шрифты: Unbounded и Caveat (SIL OFL, из @fontsource), Inter и
Cormorant Garamond — те же файлы, что на сайте HAVN.
