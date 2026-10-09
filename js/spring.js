// Springs in Apple's terms: damping ratio (1 = no overshoot) and response (seconds).
// Stepped with the closed-form solution, so they are stable at any dt and can be
// retargeted or grabbed mid-flight from the live value and velocity.

export class Spring {
  constructor(value = 0, { response = 0.35, damping = 1 } = {}) {
    this.x = value; this.v = 0; this.target = value;
    this.response = response; this.damping = damping;
  }
  to(target, opts) {
    this.target = target;
    if (opts) { if (opts.response != null) this.response = opts.response; if (opts.damping != null) this.damping = opts.damping; }
    return this;
  }
  // Pin to a value with no motion (used while a finger is driving it, and for reduced motion).
  snap(value = this.target) { this.x = this.target = value; this.v = 0; return this; }
  get settled() { return Math.abs(this.x - this.target) < 1e-4 && Math.abs(this.v) < 1e-3; }
  step(dt) {
    const d = this.x - this.target;
    if (Math.abs(d) < 1e-6 && Math.abs(this.v) < 1e-6) { this.x = this.target; this.v = 0; return this.x; }
    const w = (2 * Math.PI) / this.response, z = this.damping;
    if (z >= 1) {
      const c2 = this.v + w * d, e = Math.exp(-w * dt);
      this.x = this.target + (d + c2 * dt) * e;
      this.v = (c2 - w * (d + c2 * dt)) * e;
    } else {
      const wd = w * Math.sqrt(1 - z * z), c2 = (this.v + z * w * d) / wd;
      const e = Math.exp(-z * w * dt), cos = Math.cos(wd * dt), sin = Math.sin(wd * dt);
      this.x = this.target + e * (d * cos + c2 * sin);
      this.v = e * ((c2 * wd - z * w * d) * cos - (d * wd + z * w * c2) * sin);
    }
    return this.x;
  }
}

// Where a flick would come to rest (exponential decay, as in scroll deceleration). v is units/second.
export function project(v, rate = 0.998) { return (v / 1000) * rate / (1 - rate); }

// Progressive resistance past a boundary: the further past, the less it follows.
export function rubberband(over, dimension, c = 0.55) {
  return (over * dimension * c) / (dimension + c * Math.abs(over));
}

// Velocity from a short pointer history [{t (ms), v}], over the last ~100 ms.
export function historyVelocity(hist, now) {
  let first = null;
  for (const h of hist) if (now - h.t <= 100) { first = h; break; }
  const last = hist[hist.length - 1];
  if (!first || !last || last.t - first.t < 8) return 0;
  return ((last.v - first.v) / (last.t - first.t)) * 1000;
}

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
