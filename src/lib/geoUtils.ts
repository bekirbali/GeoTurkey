/**
 * Haversine Formula: İki coğrafi koordinat arasındaki küresel mesafeyi kilometre cinsinden hesaplar.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Dünya yarıçapı (km)
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

export interface ScoreEvaluation {
  score: number;
  label: string;
  color: string;
  badge: string;
  isPassed: boolean;
}

/**
 * Tıklanan mesafe, tolerans ve deneme sırasına (1, 2, 3) göre puan ve başarı derecesini değerlendirir.
 */
export function evaluateGuess(
  distanceKm: number,
  toleranceKm: number,
  attempt: number = 1
): ScoreEvaluation {
  // Deneme katsayısı: 1. deneme = %100, 2. deneme = %60, 3. deneme = %30
  const multiplier = attempt === 1 ? 1.0 : attempt === 2 ? 0.6 : 0.3;
  const attemptPrefix = attempt > 1 ? `(${attempt}. Hakta) ` : "";

  // Eğer göl veya dağ toleransı içindeyse tam isabet
  if (distanceKm <= toleranceKm) {
    const rawScore = 1000;
    const finalScore = Math.round(rawScore * multiplier);
    return {
      score: finalScore,
      label: attempt === 1 ? "Tam İsabet! Muhteşem!" : `${attemptPrefix}Tam İsabet!`,
      color: "text-emerald-500",
      badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
      isPassed: true,
    };
  }

  const excessDistance = distanceKm - toleranceKm;

  if (excessDistance <= 35) {
    const rawScore = 850;
    const finalScore = Math.round(rawScore * multiplier);
    return {
      score: finalScore,
      label: `${attemptPrefix}Çok Yakın! Harika`,
      color: "text-teal-400",
      badge: "bg-teal-500/20 text-teal-300 border-teal-500/40",
      isPassed: true,
    };
  }

  if (excessDistance <= 80) {
    const rawScore = 600;
    const finalScore = Math.round(rawScore * multiplier);
    return {
      score: finalScore,
      label: `${attemptPrefix}Yaklaştın! İyi`,
      color: "text-amber-400",
      badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      isPassed: true,
    };
  }

  if (excessDistance <= 160) {
    const rawScore = 300;
    const finalScore = Math.round(rawScore * multiplier);
    return {
      score: finalScore,
      label: `${attemptPrefix}Biraz Uzak Kaldın`,
      color: "text-orange-400",
      badge: "bg-orange-500/20 text-orange-300 border-orange-500/40",
      isPassed: false,
    };
  }

  return {
    score: 0,
    label: "Iskaladın!",
    color: "text-rose-500",
    badge: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    isPassed: false,
  };
}

/**
 * Web Audio API kullanarak harici ses dosyasına ihtiyaç duymadan
 * zarif ses efektleri üretir.
 */
class SoundEffects {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  playSuccess() {
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5
    osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.2); // G5

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  playClose() {
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(440, now); // A4
    osc.frequency.exponentialRampToValueAtTime(554.37, now + 0.15); // C#5

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  playMiss() {
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.25);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }
}

export const soundEffects = new SoundEffects();
