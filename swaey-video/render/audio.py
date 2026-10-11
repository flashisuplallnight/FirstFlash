"""Original soundtrack + sound design for the heyswaey film.

Everything is synthesised here (no samples, no licensed music): a 128 BPM
track whose sections follow the storyboard, plus UI sound effects placed on
the exact cue times the scenes export. Usage:

    python3 render/audio.py out/cues.json out/soundtrack.wav
"""
import json
import sys

import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
BPM = 136  # the reference film's tempo; its cuts sit on this grid
BEAT = 60 / BPM
BAR = BEAT * 4
RNG = np.random.default_rng(7)


# ---------------------------------------------------------------- helpers
def tt(d):
    return np.arange(int(d * SR)) / SR


def noise(d, seed=None):
    r = RNG if seed is None else np.random.default_rng(seed)
    return r.standard_normal(int(d * SR))


def biquad(kind, f, q=0.707, gain_db=0):
    w = 2 * np.pi * min(f, SR * 0.45) / SR
    a = np.sin(w) / (2 * q)
    c = np.cos(w)
    if kind == "lp":
        b = [(1 - c) / 2, 1 - c, (1 - c) / 2]
        A = [1 + a, -2 * c, 1 - a]
    elif kind == "hp":
        b = [(1 + c) / 2, -(1 + c), (1 + c) / 2]
        A = [1 + a, -2 * c, 1 - a]
    elif kind == "bp":
        b = [a, 0, -a]
        A = [1 + a, -2 * c, 1 - a]
    else:  # peaking
        g = 10 ** (gain_db / 40)
        b = [1 + a * g, -2 * c, 1 - a * g]
        A = [1 + a / g, -2 * c, 1 - a / g]
    return np.array(b) / A[0], np.array(A) / A[0]


def filt(x, kind, f, q=0.707, gain_db=0):
    b, a = biquad(kind, f, q, gain_db)
    return signal.lfilter(b, a, x)


def sweep(x, kind, f0, f1, q=0.9, block=256, curve=2.0):
    """time-varying biquad, cutoff moves exponentially from f0 to f1"""
    out = np.zeros_like(x)
    zi = np.zeros(2)
    n = len(x)
    for i in range(0, n, block):
        u = (i / max(1, n - 1)) ** (1 / curve) if curve != 1 else i / max(1, n - 1)
        f = f0 * (f1 / f0) ** u
        b, a = biquad(kind, f, q)
        seg, zi = signal.lfilter(b, a, x[i:i + block], zi=zi)
        out[i:i + block] = seg
    return out


def saw(freq, d, detune=0.0, phase=0.0):
    """PolyBLEP band-limited saw; freq can be scalar or array"""
    n = int(d * SR)
    f = np.full(n, freq * 2 ** (detune / 1200)) if np.isscalar(freq) else freq[:n] * 2 ** (detune / 1200)
    dt = f / SR
    ph = (np.cumsum(dt) + phase) % 1.0
    y = 2 * ph - 1
    m = ph < dt
    t1 = ph[m] / dt[m]
    y[m] -= t1 + t1 - t1 * t1 - 1
    m = ph > 1 - dt
    t2 = (ph[m] - 1) / dt[m]
    y[m] -= t2 * t2 + t2 + t2 + 1
    return y


def sine(freq, d, phase=0.0):
    n = int(d * SR)
    if np.isscalar(freq):
        return np.sin(2 * np.pi * freq * np.arange(n) / SR + phase)
    return np.sin(2 * np.pi * np.cumsum(freq[:n]) / SR + phase)


def env_ad(d, a=0.005, dec=0.2, sus=None):
    t = tt(d)
    e = np.exp(-t / dec) if sus is None else np.ones_like(t) * sus
    if a > 0:
        e *= np.clip(t / a, 0, 1)
    return e


def env_adsr(d, a, r, total=None):
    t = tt(total or d + r)
    e = np.clip(t / a, 0, 1)
    rel = np.clip(1 - (t - d) / r, 0, 1)
    return np.where(t > d, rel, e) * np.minimum(1, e * 4)


def mtof(m):
    return 440 * 2 ** ((m - 69) / 12)


def pan2(x, p):
    p = np.clip(p, -1, 1)
    l, r = np.cos((p + 1) * np.pi / 4), np.sin((p + 1) * np.pi / 4)
    return np.stack([x * l, x * r], 1)


class Bus:
    def __init__(self, n):
        self.x = np.zeros((n, 2))

    def add(self, t0, sig, gain=1.0, pan=0.0):
        if sig.ndim == 1:
            sig = pan2(sig, pan)
        i = int(round(t0 * SR))
        if i < 0:
            sig = sig[-i:]
            i = 0
        j = min(len(self.x), i + len(sig))
        if j > i:
            self.x[i:j] += sig[: j - i] * gain


def make_ir(d=2.4, seed=3, damp=5500):
    n = int(d * SR)
    t = np.arange(n) / SR
    ir = np.zeros((n, 2))
    for ch in range(2):
        r = np.random.default_rng(seed + ch).standard_normal(n)
        r = filt(r, "lp", damp)
        ir[:, ch] = r * np.exp(-t * 6.9 / d)
    ir[: int(0.018 * SR)] = 0
    return ir / np.sqrt((ir ** 2).sum()) * 0.9


def reverb(x, ir):
    return np.stack([signal.fftconvolve(x[:, c], ir[:, c])[: len(x)] for c in range(2)], 1)


# ---------------------------------------------------------------- instruments
def kick(d=0.5, punch=1.0):
    t = tt(d)
    f = 46 + 120 * np.exp(-t / 0.032) + 40 * np.exp(-t / 0.006)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.3)
    body = np.tanh(body * 1.8 * punch) / np.tanh(1.8)
    click = filt(noise(d, 1), "hp", 3000) * np.exp(-t / 0.004) * 0.35
    return body + click


def clap(d=0.5):
    t = tt(d)
    n = filt(noise(d, 2), "bp", 1500, 0.8)
    e = np.zeros_like(t)
    for k, o in enumerate([0, 0.010, 0.021]):
        e += np.where(t >= o, np.exp(-(t - o) / 0.006), 0) * (0.7 + 0.15 * k)
    e += np.where(t >= 0.03, np.exp(-(t - 0.03) / 0.11), 0) * 0.85
    return n * e * 0.9


def hat(d=0.06, dec=0.035, seed=4):
    t = tt(d)
    n = filt(filt(noise(d, seed), "hp", 7500), "hp", 7500)
    return n * np.exp(-t / dec) * 0.8


def crash(d=2.2):
    t = tt(d)
    n = filt(noise(d, 5), "hp", 4500)
    n = filt(n, "peak", 9000, 1.2, 6)
    return n * np.exp(-t / 0.75) * (1 - np.exp(-t / 0.002)) * 0.5


def snare(d=0.25):
    t = tt(d)
    tone = np.sin(2 * np.pi * (190 + 60 * np.exp(-t / 0.02)) * t) * np.exp(-t / 0.06)
    n = filt(noise(d, 6), "bp", 3500, 0.6) * np.exp(-t / 0.08)
    return tone * 0.5 + n * 0.8


def pad_note(m, d, bright=1.0, voices=3):
    sig = np.zeros(int((d + 0.6) * SR))
    for k, cents in enumerate(np.linspace(-11, 11, voices)):
        s = saw(mtof(m), d + 0.6, cents, phase=k * 0.31)
        sig += s
    sig /= voices
    sig = filt(sig, "lp", 900 + 2200 * bright, 0.6)
    sig += sine(mtof(m - 12), d + 0.6) * 0.22
    return sig * env_adsr(d, 0.16, 0.55, d + 0.6)


def pluck(m, d=0.32, bright=1.0):
    t = tt(d)
    s = saw(mtof(m), d) * 0.6 + np.sign(sine(mtof(m), d)) * 0.25 + sine(mtof(m + 12), d) * 0.25
    s = sweep(s, "lp", 300 + 5200 * bright, 380, q=1.1, curve=0.6)
    return s * np.exp(-t / 0.16) * np.clip(t / 0.002, 0, 1)


def bass_note(m, d=0.2):
    t = tt(d)
    s = sine(mtof(m), d) * 0.9 + filt(saw(mtof(m), d), "lp", 520, 0.9) * 0.55
    return np.tanh(s * 1.5) * np.exp(-t / 0.16) * np.clip(t / 0.004, 0, 1)


def sub_note(m, d):
    return sine(mtof(m), d + 0.25) * env_adsr(d - 0.05, 0.08, 0.3, d + 0.25)


def riser(d, f0=300, f1=9000, tonal=True):
    t = tt(d)
    n = sweep(noise(d, 11), "bp", f0, f1, q=2.2, curve=1.0)
    s = n * (t / d) ** 2 * 1.2
    if tonal:
        f = 220 * (8 ** (t / d))
        s += saw(f, d) * (t / d) ** 2.5 * 0.12
    return s


def boom(d=2.0, f=50):
    t = tt(d)
    fr = f * 0.6 + f * 1.4 * np.exp(-t / 0.08)
    b = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t / 0.7)
    n = filt(noise(d, 12), "lp", 900) * np.exp(-t / 0.25) * 0.5
    return np.tanh((b + n) * 1.6) * 0.9


# ---------------------------------------------------------------- sound effects
def whoosh(d=0.45, rev=False, f0=500, f1=6000, seed=20):
    t = tt(d)
    e = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5
    n = sweep(noise(d, seed), "bp", f0, f1, q=1.4, curve=1.0) * e
    if rev:
        n = n * (t / d) ** 1.5 * 2
    L = n * np.linspace(1, 0.3, len(n))
    R = n * np.linspace(0.3, 1, len(n))
    return np.stack([L, R], 1) * 0.9


def blip(f0, f1, d=0.08, dec=0.05):
    t = tt(d)
    f = f0 * (f1 / f0) ** np.clip(t / (d * 0.6), 0, 1)
    return sine(f, d) * np.exp(-t / dec) * np.clip(t / 0.001, 0, 1)


def bell(m, d=1.6, dec=0.6, bright=1.0):
    t = tt(d)
    f = mtof(m)
    mod = np.sin(2 * np.pi * f * 3.5 * t) * (2.2 * bright) * np.exp(-t / 0.25)
    car = np.sin(2 * np.pi * f * t + mod)
    return car * np.exp(-t / dec) * np.clip(t / 0.002, 0, 1)


def click_fx(seed=30):
    out = np.zeros(int(0.09 * SR))
    for k, o in enumerate([0, 0.045]):
        d = 0.03
        t = tt(d)
        s = filt(noise(d, seed + k), "bp", 3800 - k * 900, 1.4) * np.exp(-t / 0.0025)
        s += np.sin(2 * np.pi * (1300 - k * 300) * t) * np.exp(-t / 0.006) * 0.4
        i = int(o * SR)
        out[i:i + len(s)] += s * (1 - k * 0.35)
    return out * 1.2


def key_fx(v=0):
    d = 0.06
    t = tt(d)
    r = np.random.default_rng(100 + int(v))
    f = 2600 + r.uniform(-500, 700)
    s = filt(noise(d, 200 + int(v)), "bp", f, 1.6) * np.exp(-t / 0.006)
    s += np.sin(2 * np.pi * (170 + r.uniform(-20, 30)) * t) * np.exp(-t / 0.012) * 0.6
    return s * r.uniform(0.7, 1.0)


def thock():
    d = 0.18
    t = tt(d)
    s = np.sin(2 * np.pi * (140 + 60 * np.exp(-t / 0.01)) * t) * np.exp(-t / 0.03)
    s += filt(noise(d, 40), "bp", 2200, 1.2) * np.exp(-t / 0.004) * 0.7
    return s


def chime():
    a = bell(88, 1.2, 0.35, 0.5) * 0.5
    b = bell(95, 1.2, 0.45, 0.5) * 0.5
    out = np.zeros(int(1.4 * SR))
    out[: len(a)] += a
    i = int(0.09 * SR)
    out[i:i + len(b)] += b[: len(out) - i]
    return out


def check_fx():
    out = np.zeros(int(1.0 * SR))
    for k, (m, o) in enumerate([(84, 0), (91, 0.075)]):
        s = bell(m, 0.8, 0.22, 0.35) * 0.55 + sine(mtof(m), 0.8) * np.exp(-tt(0.8) / 0.18) * 0.3
        i = int(o * SR)
        out[i:i + len(s)] += s
    return out


def tick_fx(v=0):
    m = [84, 86, 88, 91, 93, 96][int(v) % 6]
    d = 0.12
    t = tt(d)
    return (sine(mtof(m), d) * 0.7 + sine(mtof(m + 12), d) * 0.2) * np.exp(-t / 0.035) + filt(noise(d, 50), "hp", 6000) * np.exp(-t / 0.003) * 0.3


def shimmer_fx(d=0.9, seed=60):
    r = np.random.default_rng(seed)
    out = np.zeros(int(d * SR))
    for k in range(26):
        o = r.uniform(0, d * 0.6)
        m = r.choice([96, 98, 100, 103, 105, 108])
        s = sine(mtof(m), 0.25) * np.exp(-tt(0.25) / 0.06) * r.uniform(0.2, 0.5)
        i = int(o * SR)
        out[i:i + len(s)] += s[: len(out) - i]
    return out * 0.6


def scratch_fx():
    d = 0.28
    t = tt(d)
    n = filt(noise(d, 70), "bp", 2400, 1.0)
    trem = 0.5 + 0.5 * np.sin(2 * np.pi * 38 * t)
    return n * trem * np.sin(np.pi * t / d) * 0.8


def crumple():
    d = 0.4
    t = tt(d)
    r = np.random.default_rng(80)
    env = np.zeros_like(t)
    for o in r.uniform(0, 0.3, 26):
        env += np.where(t >= o, np.exp(-(t - o) / 0.008), 0) * r.uniform(0.3, 1)
    n = filt(noise(d, 81), "bp", 3000, 0.7)
    return n * env * 0.5


def fx(cue):
    k, v = cue["type"], cue.get("v", 0)
    if k == "key":
        return key_fx(v), 0.5
    if k in ("keydown", "keyup", "toggle"):
        return thock(), 0.9
    if k == "click":
        return click_fx(), 0.85
    if k == "slot":
        out = np.zeros(int(0.5 * SR))
        for i in range(7):
            s = tick_fx(i % 6)
            j = int(i * 0.045 * SR)
            out[j:j + len(s)] += s[: len(out) - j] * 0.6
        return out, 0.6
    if k == "hit":
        return boom(1.2, 46) * 0.8 + 0, 0.9
    if k == "suck":
        return whoosh(0.75, rev=True, f0=300, f1=9000, seed=21), 0.8
    if k == "drop":
        return boom(2.4, 44), 1.0
    if k == "notch":
        d = 0.6
        t = tt(d)
        f = 55 * (4 ** np.clip(t / 0.35, 0, 1))
        s = sine(f, d) * np.exp(-t / 0.3) * 0.8
        return s + shimmer_fx(0.7, 61)[: len(s)] * 0.8, 0.8
    if k == "chime":
        return chime(), 0.55
    if k == "whooshIn":
        return whoosh(0.5, rev=True, seed=22), 0.7
    if k in ("whoosh", "whip"):
        return whoosh(0.38 if k == "whoosh" else 0.24, f0=900, f1=7000, seed=23), 0.75
    if k == "swoosh":
        return whoosh(0.26, f0=1200, f1=5000, seed=24), 0.6
    if k == "logo":
        out = np.zeros(int(2.2 * SR))
        for m, g in [(72, 0.5), (76, 0.35), (79, 0.35), (84, 0.3)]:
            s = bell(m, 2.0, 0.9, 0.4) * g
            out[: len(s)] += s
        b = boom(1.6, 52) * 0.6
        out[: len(b)] += b
        return out, 0.8
    if k == "letters":
        out = np.zeros(int(0.6 * SR))
        for i in range(8):
            s = key_fx(i + 40) * 0.6
            j = int(i * 0.045 * SR)
            out[j:j + len(s)] += s
        return out, 0.6
    if k == "open":
        return blip(320, 720, 0.25, 0.09) * 0.8 + shimmer_fx(0.25, 62)[: int(0.25 * SR)] * 0.5, 0.7
    if k == "think":
        out = np.zeros(int(0.5 * SR))
        for i, m in enumerate([79, 83, 86]):
            s = blip(mtof(m), mtof(m), 0.1, 0.03)
            j = int(i * 0.07 * SR)
            out[j:j + len(s)] += s * 0.5
        return out, 0.5
    if k == "pop":
        return blip(600, 1400, 0.09, 0.04), 0.7
    if k == "card":
        w = whoosh(0.22, f0=1500, f1=4000, seed=25)
        return w[:, 0] + w[:, 1] + np.pad(tick_fx(3), (int(0.12 * SR), 0))[: len(w)] * 0.4, 0.5
    if k == "check":
        return check_fx(), 0.6
    if k == "slam":
        s = kick(0.6, 1.4) * 0.9
        c = clap(0.6)[: len(s)]
        return s + c * 0.55, 0.85
    if k == "scratch":
        return scratch_fx(), 0.6
    if k == "send":
        return blip(420, 1300, 0.16, 0.07) * 0.8 + whoosh(0.16, f0=2000, f1=6000, seed=26)[:, 0][: int(0.16 * SR)] * 0.4, 0.7
    if k == "tick":
        return tick_fx(v), 0.6
    if k == "trash":
        return crumple(), 0.8
    if k == "flip":
        d = 1.2
        t = tt(d)
        f = 180 * (0.25 ** np.clip(t / 0.5, 0, 1))
        s = sine(f, d) * np.exp(-t / 0.5) * 0.9
        w = whoosh(0.5, f0=6000, f1=400, seed=27)
        s[: len(w)] += w[:, 0] * 0.6 + w[:, 1] * 0.6
        return s, 0.9
    if k == "shimmer":
        return shimmer_fx(), 0.6
    if k == "rise":
        return whoosh(0.35, rev=True, f0=600, f1=4000, seed=28), 0.35
    if k == "zap":
        d = 0.22
        t = tt(d)
        f = (2200 + 200 * v) * (0.25 ** (t / d))
        return sine(f, d) * np.exp(-t / 0.08) * 0.6 + filt(noise(d, 90 + int(v)), "hp", 5000) * np.exp(-t / 0.02) * 0.2, 0.55
    if k == "dark":
        return boom(2.0, 40) * 0.7, 0.8
    if k == "cut":
        s = kick(0.4, 1.2) * 0.7
        return s + np.pad(snare(0.25), (0, int(0.15 * SR)))[: len(s)] * 0.5, 0.7
    if k == "touch":
        out = np.zeros(int(3.2 * SR))
        for m, g in [(69, 0.4), (76, 0.3), (81, 0.3), (85, 0.25), (88, 0.25)]:
            s = bell(m, 3.0, 1.3, 0.5) * g
            out[: len(s)] += s
        b = boom(2.5, 42)
        out[: len(b)] += b * 0.9
        c = crash(2.5)
        out[: len(c)] += c * 0.8
        return out, 1.0
    if k == "outro":
        out = np.zeros(int(3.0 * SR))
        for m in [65, 69, 72, 76, 79]:
            s = pad_note(m, 1.6, 1.2)
            out[: len(s)] += s * 0.35
            b = bell(m + 12, 2.6, 1.1, 0.4) * 0.2
            out[: len(b)] += b
        return out, 0.8
    if k == "riser2":
        return riser(0.8, 600, 9000, False) * 0.5, 0.5
    if k == "glitch":
        d = 0.42
        t = tt(d)
        r = np.random.default_rng(300 + int(v))
        out = np.zeros(len(t))
        for o in np.arange(0, d - 0.05, 0.035):
            if r.random() < 0.7:
                seg = int(r.uniform(0.012, 0.03) * SR)
                i = int(o * SR)
                f = r.choice([220, 440, 880, 1320, 1760])
                sq = np.sign(np.sin(2 * np.pi * f * np.arange(seg) / SR)) * 0.35
                nz = np.round(r.standard_normal(seg) * 3) / 3 * 0.25
                out[i:i + seg] += (sq + nz)[: len(out) - i]
        return filt(out, "hp", 300) * 0.8, 0.5
    if k == "type2":
        return np.zeros(10), 0
    return np.zeros(10), 0


# ---------------------------------------------------------------- arrangement
PROG_A = [  # Fmaj7 – G6 – Am7 – Em7
    ([53, 57, 60, 64], 41), ([55, 59, 62, 64], 43), ([57, 60, 64, 67], 45), ([52, 55, 59, 62], 40)]
PROG_B = [  # Dm9 – Bbmaj7 – Fmaj7 – C6 (dark mode)
    ([50, 53, 57, 64], 38), ([46, 50, 53, 57], 34), ([53, 57, 60, 64], 41), ([48, 52, 55, 57], 36)]


# v2 arrangement in seconds, following the reference film's energy curve
SECTIONS = [(0.0, "intro"), (4.41, "groove"), (18.0, "dark"), (20.0, "break"), (28.2, "dark"),
            (33.9, "hands"), (36.0, "drop2"), (42.0, "dark"), (44.0, "drop2"), (46.0, "end")]


def section_t(t):
    cur = "intro"
    for a, name in SECTIONS:
        if t >= a:
            cur = name
    return cur


def build(meta, out_path):
    dur = meta["duration"]
    n = int((dur + 0.05) * SR)
    drums, bass, pads, arp, fxb, send = (Bus(n) for _ in range(6))
    kicks = []
    nbars = int(np.ceil(dur / BAR))
    for b16 in range(nbars * 16):
        t = b16 * BEAT / 4
        if t >= dur:
            break
        bar = b16 / 16
        sec = section_t(t)
        step = b16 % 16
        beat_i = step // 4
        # ---- kick
        four = sec in ("groove", "drop2", "dark") or (sec == "end" and t < 48.0)
        if step % 4 == 0 and four:
            drums.add(t, kick(), 0.9)
            kicks.append(t)
        if sec == "break" and step == 0:
            drums.add(t, kick(0.6, 0.7), 0.45)
            kicks.append(t)
        # ---- clap / snare
        if sec in ("groove", "drop2") and step in (4, 12):
            c = clap()
            drums.add(t, c, 0.55)
            send.add(t, c, 0.25)
        if sec == "dark" and step == 8:
            c = clap()
            drums.add(t, c, 0.6)
            send.add(t, c, 0.35)
        # ---- hats
        if sec in ("groove", "dark", "drop2") or (sec == "end" and t < 48.0):
            if step % 2 == 1 or (sec == "drop2"):
                drums.add(t, hat(dec=0.03 + (0.02 if step % 4 == 2 else 0), seed=4 + step), 0.16 if step % 4 == 2 else 0.11, pan=0.25)
            if step % 4 == 2 and sec in ("groove", "drop2"):
                drums.add(t, hat(0.25, 0.16, 9), 0.08, pan=-0.2)
        if sec == "intro" and t >= 1.76 and step % 2 == 0:
            drums.add(t, hat(seed=4 + step), 0.05, pan=0.3)
        # ---- bass: rolling off-beat 8ths
        prog = PROG_B if sec in ("dark", "break") else PROG_A
        chord, root = prog[int(bar) % 4]
        if sec in ("groove", "dark", "drop2") and step % 4 == 2:
            bass.add(t, bass_note(root + 12 if sec != "dark" else root + 12, BEAT * 0.45), 0.55)
        # ---- arp (16ths)
        if sec in ("groove", "dark", "drop2") or (sec == "end" and t < 48.0) or (sec == "intro" and t >= 1.76):
            pat = [0, 1, 2, 3, 2, 1, 2, 3]
            m = chord[pat[step % 8]] + 12 + (12 if step % 8 == 3 else 0)
            br = {"intro": 0.25 + 0.2 * (t - 1.76), "groove": 0.7, "dark": 0.5, "drop2": 1.0, "end": 0.55}[sec]
            g = {"intro": 0.10, "groove": 0.14, "dark": 0.12, "drop2": 0.16, "end": 0.10}[sec]
            arp.add(t, pluck(m, 0.3, br), g * (1.0 if step % 4 == 0 else 0.75), pan=-0.35 if step % 2 else 0.35)

    # ---- pads, sub, per bar
    for bi in range(nbars):
        t = bi * BAR
        if t >= dur:
            break
        sec = section_t(t + 0.01)
        prog = PROG_B if sec in ("dark", "break") else PROG_A
        chord, root = prog[bi % 4]
        bright = {"intro": 0.15, "groove": 0.55, "dark": 0.35, "break": 0.3, "drop2": 0.8, "hands": 0.45, "end": 0.5}[sec]
        g = {"intro": 0.16, "groove": 0.13, "dark": 0.15, "break": 0.2, "drop2": 0.13, "hands": 0.22, "end": 0.16}[sec]
        for k, m in enumerate(chord):
            p = pad_note(m, BAR, bright)
            pads.add(t, p, g, pan=(k - 1.5) * 0.35)
        if sec in ("intro", "break", "hands", "end"):
            pads.add(t, sub_note(root, BAR), 0.16 if sec == "intro" else 0.22)
    # half-bar notches (b10.5 → b11 keep the A progression)

    # ---- transitions (seconds)
    for t0, t1, g in [(1.76, 4.41, 0.5), (26.9, 28.2, 0.3), (33.9, 36.0, 0.6)]:
        fxb.add(t0, riser(t1 - t0), g)
    for tc in [4.41, 18.0, 28.2, 36.0, 44.0, 46.0, 48.0]:
        drums.add(tc, crash(), 0.33)
        send.add(tc, crash(), 0.15)
    # snare roll into drop 2
    roll_start, roll_end = 34.6, 36.0
    tcur = roll_start
    while tcur < roll_end - 0.02:
        u = (tcur - roll_start) / (roll_end - roll_start)
        step = BEAT / 2 if u < 0.5 else BEAT / 4 if u < 0.8 else BEAT / 8
        drums.add(tcur, snare(), 0.12 + 0.35 * u)
        tcur += step

    # ---- sound effects from the scene cues
    for c in meta["cues"]:
        sig, base = fx(c)
        if base == 0:
            continue
        g = base * c.get("g", 1.0)
        if sig.ndim == 1:
            sig = pan2(sig, 0)
        fxb.add(c["t"], sig, g * 0.8)
        if c["type"] in ("chime", "check", "logo", "touch", "outro", "shimmer", "tick", "open", "send", "zap", "pop"):
            send.add(c["t"], sig, g * 0.35)

    # ---- sidechain (music ducks under the kick)
    tline = np.arange(n) / SR
    duck = np.ones(n)
    for kt in kicks:
        i = int(kt * SR)
        j = min(n, i + int(0.3 * SR))
        u = (tline[i:j] - kt)
        duck[i:j] = np.minimum(duck[i:j], 1 - 0.6 * np.exp(-u / 0.09))
    duck = duck[:, None]
    music = bass.x * duck + pads.x * duck + arp.x * (0.6 + 0.4 * duck)

    # arp ping-pong delay
    dl, dr = int(BEAT * 0.75 * SR), int(BEAT * 1.5 * SR)
    wet = np.zeros_like(arp.x)
    src = arp.x.mean(1)
    for rep in range(5):
        g = 0.38 ** (rep + 1)
        off = dl * (rep + 1) if rep % 2 == 0 else dr * (rep + 1) // 2
        ch = 0 if rep % 2 == 0 else 1
        if off < n:
            wet[off:, ch] += filt(src[: n - off], "lp", 3500) * g
    music += wet * 0.5 * duck

    # ---- section dynamics: the reference breathes (quiet ≈ 1/4 of the drops)
    LV = {"intro": 0.32, "groove": 1.0, "dark": 0.58, "break": 0.3, "hands": 0.26, "drop2": 1.05, "end": 0.62}
    g = np.array([LV[section_t(x)] for x in np.arange(0, n, 480) / SR])
    g = np.repeat(g, 480)[:n]
    k = int(0.12 * SR)
    g = np.convolve(g, np.ones(k) / k, mode="same")
    drums.x *= g[:, None]
    music *= g[:, None]

    ir = make_ir()
    send.x += (pads.x * 0.3 + arp.x * 0.25) * g[:, None]
    rev = reverb(send.x, ir)
    mix = drums.x * 1.0 + music * 1.0 + fxb.x * 1.0 + rev * 0.55
    mix = filt(filt(mix.T, "hp", 34).T.T, "hp", 34).T

    # fade the tail, then master: gentle glue + soft clip + normalise
    fade_t = 1.0
    f0 = int((dur - fade_t) * SR)
    mix[f0:] *= np.linspace(1, 0, n - f0)[:, None] ** 1.5
    mix[: int(0.01 * SR)] *= np.linspace(0, 1, int(0.01 * SR))[:, None]
    rms = np.sqrt(np.mean(mix ** 2))
    mix *= 0.16 / max(rms, 1e-9)
    mix = np.tanh(mix * 1.15) / np.tanh(1.15)
    peak = np.max(np.abs(mix))
    mix *= 0.84 / peak
    wavfile.write(out_path, SR, (mix * 32767).astype(np.int16))
    print(f"wrote {out_path}: {dur:.2f}s, rms {20*np.log10(np.sqrt(np.mean(mix**2))):.1f} dBFS, {len(meta['cues'])} cues, {len(kicks)} kicks")


if __name__ == "__main__":
    meta = json.load(open(sys.argv[1]))
    build(meta, sys.argv[2])
