const PREF_KEY = "kyntra.reminderSound";

/** Reminder sound preference (default on). Stored per browser. */
export function isSoundEnabled(): boolean {
  try {
    return localStorage.getItem(PREF_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSoundEnabled(on: boolean) {
  try {
    localStorage.setItem(PREF_KEY, on ? "on" : "off");
  } catch {
    // Storage blocked: the preference just won't persist.
  }
}

let ctx: AudioContext | null = null;

/**
 * A soft two-note chime generated with Web Audio (no audio file needed).
 * Browsers only allow audio after the user has interacted with the page once; if
 * playback is blocked this fails silently rather than throwing.
 */
export async function playChime({
  force = false,
}: { force?: boolean } = {}): Promise<void> {
  if (!force && !isSoundEnabled()) return;
  try {
    const AudioCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtor) return;
    ctx ??= new AudioCtor();
    if (ctx.state === "suspended") await ctx.resume();

    const now = ctx.currentTime;
    // E5 then A5, with a quick attack and a gentle decay.
    [
      { freq: 659.25, start: 0 },
      { freq: 880, start: 0.18 },
    ].forEach(({ freq, start }) => {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.35, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + 0.9);
      osc.connect(gain).connect(ctx!.destination);
      osc.start(now + start);
      osc.stop(now + start + 1);
    });
  } catch (error) {
    console.warn("Couldn't play reminder sound", error);
  }
}
