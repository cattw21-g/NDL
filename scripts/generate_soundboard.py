import os
import math
import numpy as np
import soundfile as sf

os.makedirs("public/sounds", exist_ok=True)

def write_ogg(filename, samples, sample_rate=44100):
    arr = np.array(samples, dtype=np.float32)
    sf.write(filename, arr, sample_rate, format='OGG')
    print(f"[*] Saved {filename} ({len(samples)/sample_rate:.2f}s, {os.path.getsize(filename)} bytes)")

def generate_soundboard_sounds():
    sample_rate = 44100
    
    # 1. GD Checkpoint (Practice mode sparkling crystal ding)
    duration = 0.65
    n_samples = int(sample_rate * duration)
    samples = []
    for i in range(n_samples):
        t = i / sample_rate
        env = math.exp(-t * 6.5)
        s = 0.55 * math.sin(2 * math.pi * 1760 * t) + 0.35 * math.sin(2 * math.pi * 2640 * t) + 0.15 * math.sin(2 * math.pi * 3520 * t)
        samples.append(s * env * 0.8)
    write_ogg("public/sounds/gd_checkpoint.ogg", samples)

    # 2. GD Secret Coin (Ascending 4-tone triumphant arpeggio: C6, E6, G6, C7)
    freqs = [1046.5, 1318.5, 1567.98, 2093.0]
    tone_len = 0.12
    tail_len = 0.35
    total_len = len(freqs) * tone_len + tail_len
    n_samples = int(sample_rate * total_len)
    samples = []
    for i in range(n_samples):
        t = i / sample_rate
        tone_idx = min(int(t / tone_len), len(freqs) - 1)
        freq = freqs[tone_idx]
        local_t = t - tone_idx * tone_len
        env = math.exp(-local_t * 5.0) if tone_idx == len(freqs) - 1 else math.exp(-local_t * 3.0)
        s = 0.7 * math.sin(2 * math.pi * freq * t) + 0.3 * math.sin(2 * math.pi * freq * 2 * t)
        samples.append(s * env * 0.75)
    write_ogg("public/sounds/gd_coin.ogg", samples)

    # 3. GD Level Complete (Triumphant victory fanfare chord)
    duration = 1.4
    n_samples = int(sample_rate * duration)
    samples = []
    chord = [523.25, 659.25, 783.99, 1046.50]
    for i in range(n_samples):
        t = i / sample_rate
        env = (1.0 - math.exp(-t * 35.0)) * math.exp(-t * 2.2)
        s = sum(0.25 * math.sin(2 * math.pi * f * t) for f in chord)
        s += 0.15 * math.sin(2 * math.pi * 1046.50 * 2 * t) * math.exp(-t * 4.0)
        samples.append(s * env * 0.8)
    write_ogg("public/sounds/gd_victory.ogg", samples)

    # 4. GD Death Thud (Classic deep explosion thud with pitch drop)
    duration = 0.45
    n_samples = int(sample_rate * duration)
    samples = []
    for i in range(n_samples):
        t = i / sample_rate
        freq = max(35.0, 240.0 * math.exp(-t * 12.0))
        env = math.exp(-t * 7.5)
        s = 0.6 * math.sin(2 * math.pi * freq * t) + 0.3 * (1.0 if (t * freq % 1.0) > 0.5 else -1.0)
        samples.append(s * env * 0.85)
    write_ogg("public/sounds/gd_death_thud.ogg", samples)

if __name__ == "__main__":
    generate_soundboard_sounds()
