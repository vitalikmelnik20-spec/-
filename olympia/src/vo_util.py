import numpy as np

def trim(w, sr):
    nz = np.where(np.abs(w) > 0.01 * np.abs(w).max())[0]
    return w[max(0, nz[0] - int(0.02 * sr)): nz[-1] + int(0.08 * sr)]

def tighten(w, sr, max_pause=0.2):
    """shorten silent gaps inside a line (sentence breaks) to max_pause seconds"""
    hop = int(0.01 * sr)
    fr = np.array([np.sqrt(np.mean(w[i:i + hop] ** 2)) for i in range(0, len(w) - hop, hop)])
    q = fr < 0.02 * fr.max(); keep = np.ones(len(w), bool); i = 0
    while i < len(q):
        if q[i]:
            j = i
            while j < len(q) and q[j]: j += 1
            if (j - i) * hop > max_pause * sr:
                keep[i * hop + int(max_pause * sr / 2): j * hop - int(max_pause * sr / 2)] = False
            i = j
        else:
            i += 1
    return w[keep]
