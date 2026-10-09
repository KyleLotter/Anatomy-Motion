// Simulated rhythms shared by the 3D scene and the HUD readouts so they stay in step.
// These are illustrative values inside normal resting ranges, not measurements.

// Normal adult resting heart rate is 60-100 bpm (American Heart Association, "All About Heart Rate").
export const HEART_BPM = 72;
// Normal adult resting breathing rate is roughly 12-18 breaths/min (OpenStax Anatomy & Physiology 2e, 22.3).
export const BREATHS_PER_MIN = 14;
// Tidal volume at rest is about 500 mL (OpenStax A&P 2e, 22.3).
export const TIDAL_ML = 500;
// Healthy kidneys filter about half a cup (~120 mL) of blood per minute (NIDDK, "Your Kidneys & How They Work").
export const FILTER_ML_PER_MIN = 120;

const frac = (x) => x - Math.floor(x);
const gauss = (p, m, s, a) => a * Math.exp(-((p - m) ** 2) / (2 * s * s));

export const heartPhase = (t) => frac((t * HEART_BPM) / 60);
// Stylised P-QRS-T shape for one beat, phase 0..1. Not a clinical ECG.
export function ecg(p) {
  return gauss(p, 0.12, 0.025, 0.12) + gauss(p, 0.235, 0.008, -0.14) + gauss(p, 0.25, 0.009, 1)
    + gauss(p, 0.27, 0.009, -0.22) + gauss(p, 0.46, 0.045, 0.28);
}
// Contraction envelope just after the QRS spike, 0..1.
export const contraction = (t) => gauss(heartPhase(t), 0.33, 0.07, 1);
// Lung fill 0..1 for quiet breathing.
export const breath = (t) => 0.5 - 0.5 * Math.cos((t * BREATHS_PER_MIN * 2 * Math.PI) / 60);
// Illustrative alpha-band trace (alpha rhythm is 8-13 Hz; StatPearls, "Normal EEG Waveforms"). Not a recording.
export function alpha(t) {
  return Math.sin(2 * Math.PI * 10 * t) * (0.55 + 0.45 * Math.sin(2 * Math.PI * 0.9 * t)) + 0.25 * Math.sin(2 * Math.PI * 4.3 * t + 1);
}
