"""
The site's ambience: a slow, warm pad with a few glass chimes in a long room.

  python3 scripts/ambience.py public/media/ambience.mp3

Four chords in D major (D add9, G major 7, B minor 7, A sus4 add9), 21 seconds
each, melting into one another; every note is three slightly detuned voices
that breathe at their own pace; a pentatonic chime now and then; a long, dark
reverb over everything. The file starts and ends at full level on purpose:
the page crossfades its last seconds into its first, so it loops with no seam
(see src/lib/ambience.ts).

Requires numpy and scipy, and ffmpeg for the MP3.
"""

import os
import subprocess
import sys
import tempfile
import wave

import numpy as np
from scipy import signal

SR = 44100
LENGTH = 84.0  # seconds in the file
PRE = 14.0  # sounded before the file begins, so pad and room are already full at 0
CHORD = LENGTH / 4
MELT = 7.0  # seconds over which one chord gives way to the next
SEED = 2003


def hz(note):
    """'F#3' -> frequency, A4 = 440."""
    names = {"C": -9, "C#": -8, "D": -7, "D#": -6, "E": -5, "F": -4, "F#": -3, "G": -2, "G#": -1, "A": 0, "A#": 1, "B": 2}
    return 440.0 * 2 ** ((names[note[:-1]] + 12 * (int(note[-1]) - 4)) / 12)


# (note, level). The weight sits between 150 and 900 Hz, where a laptop or a
# phone still speaks; the low notes only warm it, the top ones only glow.
CHORDS = [
    [("D2", 0.24), ("A2", 0.26), ("D3", 0.30), ("F#3", 0.30), ("A3", 0.30), ("E4", 0.30), ("F#4", 0.24), ("A4", 0.20), ("D5", 0.12), ("E5", 0.07), ("F#5", 0.05), ("A5", 0.03)],
    [("G2", 0.24), ("D3", 0.28), ("G3", 0.30), ("B3", 0.30), ("D4", 0.28), ("F#4", 0.26), ("A4", 0.18), ("B4", 0.14), ("D5", 0.10), ("F#5", 0.05), ("A5", 0.03)],
    [("B2", 0.24), ("F#3", 0.30), ("A3", 0.30), ("D4", 0.30), ("F#4", 0.26), ("A4", 0.18), ("B4", 0.12), ("D5", 0.10), ("E5", 0.07), ("F#5", 0.04)],
    [("A2", 0.24), ("E3", 0.30), ("A3", 0.30), ("B3", 0.26), ("D4", 0.28), ("E4", 0.28), ("A4", 0.18), ("B4", 0.14), ("D5", 0.08), ("E5", 0.08), ("A5", 0.03)],
]
CHIME_NOTES = ["A4", "B4", "D5", "E5", "F#5", "A5", "B5", "D6"]


def render():
    rng = np.random.default_rng(SEED)
    n = int((PRE + LENGTH) * SR)
    t = np.arange(n) / SR - PRE
    two_pi = 2 * np.pi

    # ---- The pad. Each chord is full during its 21 seconds and melts into
    # the next around the boundary (equal power); the first is already
    # sounding before the file begins and the last still is when it ends.
    def gate(k):
        g = np.ones(n)
        if k > 0:
            g *= np.sin(np.clip((t - (k * CHORD - MELT / 2)) / MELT, 0, 1) * np.pi / 2)
        if k < 3:
            g *= np.cos(np.clip((t - ((k + 1) * CHORD - MELT / 2)) / MELT, 0, 1) * np.pi / 2)
        return g

    pad = np.zeros((2, n))
    for k, chord in enumerate(CHORDS):
        g = gate(k)
        on = g > 1e-4
        tt = t[on]
        left = np.zeros(tt.size)
        right = np.zeros(tt.size)
        for note, level in chord:
            f = hz(note)
            # Harmonics: more on the low notes (small speakers hear those),
            # next to none on the high ones.
            if f < 130:
                harmonics = (1.0, 0.45, 0.22, 0.10)
            elif f < 300:
                harmonics = (1.0, 0.30, 0.12, 0.05)
            elif f < 600:
                harmonics = (1.0, 0.18, 0.06, 0.02)
            else:
                harmonics = (1.0, 0.08)
            # Cents between the three voices: narrower up high, so nothing
            # flutters, and down low, so the bass does not swell and fade.
            spread = 5.0 * min(1.0, (220.0 / f) ** 0.5) * (0.6 if f < 130 else 1.0)
            width = 0.2 if f < 150 else 0.6  # the low notes stay in the middle
            for cents, pan in ((-spread, -width), (0.0, 0.0), (spread * 1.2, width)):
                fv = f * 2 ** ((cents + rng.uniform(-0.6, 0.6)) / 1200)
                breath = 1 + 0.16 * np.sin(two_pi * tt / rng.uniform(9, 23) + rng.uniform(0, two_pi))
                voice = np.zeros(tt.size)
                for h, a in enumerate(harmonics, start=1):
                    voice += a * np.sin(two_pi * fv * h * tt + rng.uniform(0, two_pi))
                voice *= breath * level / 3
                p = np.clip(pan + rng.uniform(-0.12, 0.12), -1, 1)
                left += voice * np.cos((p + 1) * np.pi / 4)
                right += voice * np.sin((p + 1) * np.pi / 4)
        pad[0, on] += left * g[on]
        pad[1, on] += right * g[on]
    # One slow breath over the whole pad.
    pad *= 1 + 0.06 * np.sin(two_pi * t / 13.7)

    # ---- The chimes: glass struck softly, one every few seconds, sometimes two.
    chimes = np.zeros((2, n))

    def strike(at, note, amp, pan):
        f = hz(note)
        i0 = int((at + PRE) * SR)
        m = min(n - i0, int(9 * SR))
        if m <= 0:
            return
        x = np.arange(m) / SR
        attack = np.sin(np.clip(x / 0.014, 0, 1) * np.pi / 2) ** 2
        tone = (
            np.exp(-x / 2.6) * np.sin(two_pi * f * x)
            + 0.30 * np.exp(-x / 1.6) * np.sin(two_pi * 2 * f * x)
            + 0.10 * np.exp(-x / 0.9) * np.sin(two_pi * 3.01 * f * x)
            + 0.03 * np.exp(-x / 0.5) * np.sin(two_pi * 4.2 * f * x)
        )
        tone *= attack * amp
        chimes[0, i0 : i0 + m] += tone * np.cos((pan + 1) * np.pi / 4)
        chimes[1, i0 : i0 + m] += tone * np.sin((pan + 1) * np.pi / 4)

    at = -PRE + 2.0
    while at < LENGTH:
        note = rng.choice(CHIME_NOTES)
        amp = rng.uniform(0.10, 0.17) * (0.8 if hz(note) > 900 else 1.0)
        strike(at, note, amp, rng.uniform(-0.6, 0.6))
        if rng.random() < 0.3:
            strike(at + rng.uniform(0.38, 0.62), rng.choice(CHIME_NOTES), amp * 0.8, rng.uniform(-0.6, 0.6))
        at += rng.uniform(4.2, 8.6)

    # ---- A breath of air: band-limited noise, far back, rising and falling.
    air = np.zeros((2, n))
    sos = signal.butter(2, [350, 2800], "bandpass", fs=SR, output="sos")
    slow = signal.butter(2, 0.07, "lowpass", fs=SR, output="sos")
    for c in range(2):
        swell = signal.sosfilt(slow, rng.standard_normal(n))
        swell = 0.5 + 0.5 * swell / (np.abs(swell).max() + 1e-9)
        air[c] = signal.sosfilt(sos, rng.standard_normal(n)) * swell * 0.022

    # ---- The room: six seconds of decaying noise, darker as it dies away.
    m = int(6.5 * SR)
    x = np.arange(m) / SR
    onset = np.sin(np.clip((x - 0.022) / 0.07, 0, 1) * np.pi / 2) ** 2
    room = np.zeros((2, m))
    bands = [((None, 500), 6.5), ((500, 2000), 5.0), ((2000, 6000), 2.8)]
    for c in range(2):
        for (lo, hi), rt60 in bands:
            noise = rng.standard_normal(m)
            if lo is None:
                band = signal.sosfilt(signal.butter(2, hi, "lowpass", fs=SR, output="sos"), noise)
            else:
                band = signal.sosfilt(signal.butter(2, [lo, hi], "bandpass", fs=SR, output="sos"), noise)
            room[c] += band * np.exp(-x * (6.91 / rt60))
        room[c] *= onset
        room[c] /= np.sqrt(np.sum(room[c] ** 2))

    def wet(dry):
        return np.stack([signal.fftconvolve(dry[c], room[c])[:n] for c in range(2)])

    mix = 0.55 * pad + 0.80 * wet(pad) + 0.5 * chimes + 0.95 * wet(chimes) + wet(air)

    # ---- Master: no rumble, no hiss, peak well below full scale.
    mix = signal.sosfilt(signal.butter(2, 30, "highpass", fs=SR, output="sos"), mix, axis=1)
    mix = signal.sosfilt(signal.butter(2, 9000, "lowpass", fs=SR, output="sos"), mix, axis=1)
    out = mix[:, int(PRE * SR) :]
    out = out / np.sqrt(np.mean(out**2, axis=1, keepdims=True))  # both sides equally loud
    out = out / np.abs(out).max() * 10 ** (-4 / 20)
    return out


def describe(out):
    rms = 20 * np.log10(np.sqrt(np.mean(out**2)))
    peak = 20 * np.log10(np.abs(out).max())
    win = SR
    frames = out[:, : out.shape[1] // win * win].reshape(2, -1, win)
    per_second = 20 * np.log10(np.sqrt(np.mean(frames**2, axis=(0, 2))))
    f, p = signal.welch(out.mean(0), SR, nperseg=1 << 15)
    c = np.cumsum(p) / np.sum(p)
    print(f"{out.shape[1] / SR:.1f} s  peak {peak:.1f} dBFS  rms {rms:.1f} dBFS  per second {per_second.min():.1f} to {per_second.max():.1f} dBFS")
    print(f"half the energy below {f[np.searchsorted(c, 0.5)]:.0f} Hz, 95 % below {f[np.searchsorted(c, 0.95)]:.0f} Hz, 99.9 % below {f[np.searchsorted(c, 0.999)]:.0f} Hz")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    dst = sys.argv[1]
    out = render()
    describe(out)
    pcm = (np.clip(out.T, -1, 1) * 32767).astype("<i2")
    with tempfile.TemporaryDirectory() as tmp:
        wav = os.path.join(tmp, "ambience.wav")
        with wave.open(wav, "wb") as w:
            w.setnchannels(2)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes(pcm.tobytes())
        if dst.endswith(".wav"):
            os.replace(wav, dst)
        else:
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-codec:a", "libmp3lame", "-b:a", "112k", "-joint_stereo", "1", dst], check=True)
    print(f"{dst}  {os.path.getsize(dst) // 1024} KB")
