import { useEffect, useRef, useState } from 'react';
import { createEagleCaller } from './eagleSound';

const KEY = 'f.eagle.sound';

/** Eagle cry every 5 seconds. Browsers only allow audio after the first tap or key press; this button mutes it. */
export default function EagleSoundToggle() {
  const [on, setOn] = useState(() => {
    try {
      return localStorage.getItem(KEY) !== 'off';
    } catch {
      return true;
    }
  });
  const caller = useRef<ReturnType<typeof createEagleCaller> | null>(null);

  useEffect(() => {
    caller.current = createEagleCaller();
    return () => caller.current?.dispose();
  }, []);

  useEffect(() => {
    caller.current?.setEnabled(on);
    try {
      localStorage.setItem(KEY, on ? 'on' : 'off');
    } catch {
      /* ignore */
    }
  }, [on]);

  return (
    <button
      type="button"
      className={`eaglesound ${on ? 'is-on' : ''}`}
      aria-pressed={on}
      aria-label={on ? 'Eagle sound on. Click to mute' : 'Eagle sound off. Click to turn on'}
      onClick={() => setOn((v) => !v)}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z" />
        {on ? <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /> : <path d="M16 9.5l5 5M21 9.5l-5 5" />}
      </svg>
      <span>{on ? 'Eagle call' : 'Muted'}</span>
    </button>
  );
}
