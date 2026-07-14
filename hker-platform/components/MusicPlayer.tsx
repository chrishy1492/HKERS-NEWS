'use client'

import { useEffect, useRef, useState } from 'react'

type Track = {
  id: string
  name: string
  notes: number[]
  wave: OscillatorType
  tempoMs: number
  gain: number
}

// 五種輕柔的環境音組合，全部由 Web Audio API 即時合成，
// 不使用任何外部音檔，避免版權問題。
const TRACKS: Track[] = [
  { id: 'guzheng', name: '寧靜古箏', notes: [523.25, 587.33, 659.25, 784.0, 880.0], wave: 'triangle', tempoMs: 1300, gain: 0.035 },
  { id: 'breeze', name: '薄荷微風', notes: [440, 493.88, 587.33, 659.25], wave: 'sine', tempoMs: 1600, gain: 0.03 },
  { id: 'lounge', name: '琴韻悠然', notes: [392, 440, 466.16, 523.25, 587.33], wave: 'sine', tempoMs: 1450, gain: 0.032 },
  { id: 'glow', name: '電子微光', notes: [329.63, 392, 440, 523.25], wave: 'square', tempoMs: 1100, gain: 0.018 },
  { id: 'birds', name: '山間鳥語', notes: [659.25, 698.46, 783.99, 880.0, 987.77], wave: 'triangle', tempoMs: 900, gain: 0.028 },
]

export default function MusicPlayer() {
  const [open, setOpen] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [trackId, setTrackId] = useState(TRACKS[0].id)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const noteIndexRef = useRef(0)

  useEffect(() => {
    const savedTrack = localStorage.getItem('hker-music-track')
    const savedPlaying = localStorage.getItem('hker-music-playing')
    if (savedTrack) setTrackId(savedTrack)
    if (savedPlaying === 'true') setPlaying(true)
  }, [])

  useEffect(() => {
    localStorage.setItem('hker-music-track', trackId)
  }, [trackId])

  useEffect(() => {
    localStorage.setItem('hker-music-playing', String(playing))
    if (playing) {
      startTrack(trackId)
    } else {
      stopTrack()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, trackId])

  function ensureContext() {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return audioCtxRef.current
  }

  function stopTrack() {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  function startTrack(id: string) {
    stopTrack()
    const ctx = ensureContext()
    const track = TRACKS.find((t) => t.id === id) ?? TRACKS[0]
    noteIndexRef.current = 0

    timerRef.current = setInterval(() => {
      const freq = track.notes[noteIndexRef.current % track.notes.length]
      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()
      osc.type = track.wave
      osc.frequency.value = freq
      gainNode.gain.setValueAtTime(0.0001, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(track.gain, ctx.currentTime + 0.08)
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + track.tempoMs / 1000 - 0.1)
      osc.connect(gainNode).connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + track.tempoMs / 1000)
      noteIndexRef.current++
    }, track.tempoMs)
  }

  function togglePlay() {
    setPlaying((p) => !p)
  }

  function selectTrack(id: string) {
    setTrackId(id)
    if (playing) startTrack(id)
  }

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <div className="flex items-center gap-2">
        <button
          onClick={togglePlay}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-hker-charcoal text-hker-gold-light shadow-lg ring-1 ring-hker-gold/30"
          aria-label={playing ? '關閉音樂' : '開啟音樂'}
        >
          {playing ? '🔊' : '🔇'}
        </button>
        <button
          onClick={() => setOpen((o) => !o)}
          className="rounded-full bg-hker-charcoal px-3 py-2 text-xs text-stone-300 shadow-lg ring-1 ring-hker-gold/20 hover:text-hker-gold-light"
        >
          {TRACKS.find((t) => t.id === trackId)?.name ?? '選曲'} ▾
        </button>
      </div>

      {open && (
        <div className="mt-2 w-40 rounded-lg border border-hker-gold/20 bg-hker-charcoal p-2 shadow-xl">
          {TRACKS.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                selectTrack(t.id)
                setOpen(false)
              }}
              className={`block w-full rounded px-2 py-1.5 text-left text-xs transition ${
                trackId === t.id ? 'bg-hker-lacquer text-white' : 'text-stone-300 hover:bg-hker-ink'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
