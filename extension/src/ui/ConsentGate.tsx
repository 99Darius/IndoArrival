/**
 * Blocking first-run consent gate (design §6 / legal/disclaimers.md). The app is
 * unusable until the user accepts. Acceptance + timestamp stored locally.
 * Wording is kept in sync with legal/disclaimers.md: update both together.
 *
 * Version 2 added Thailand. People who accepted version 1 see the wording once
 * more, because it now covers a second government's form.
 */
import type { ReactNode } from "react";
import { useChromeStorage } from "../lib/useChromeStorage";

const CURRENT = 2;

export interface Consent {
  accepted: boolean;
  at: string | null;
  version?: number;
}

export function ConsentGate({ children }: { children: ReactNode }) {
  const [consent, setConsent, loaded] = useChromeStorage<Consent>("consent", {
    accepted: false,
    at: null,
  });

  if (!loaded) return null;
  if (consent.accepted && consent.version === CURRENT) return <>{children}</>;

  return (
    <div className="ia">
      <div className="ia-head">
        <div className="ia-mark">
          <b>ArrivalFiller</b>
          <span>arrival card</span>
        </div>
        <div className="ia-chip">Before you start</div>
      </div>
      <div className="ia-body">
        <p className="ia-kicker">Please read</p>
        <h1 className="ia-h1">{consent.accepted ? "IndoArrival is now ArrivalFiller" : "A few things first"}</h1>
        {consent.accepted && (
          <p className="ia-lede">It now fills Thailand's arrival card too. Your saved travellers are still here.</p>
        )}
        <ul style={{ paddingLeft: 16, margin: "0 0 14px", fontSize: 12.5, lineHeight: 1.5, color: "#3a4744" }}>
          <li><b>You own the declaration.</b> A customs/immigration form is a legal statement. You're responsible for every field being accurate.</li>
          <li><b>You submit it.</b> ArrivalFiller fills the form; you review and press the government Submit yourself. It never submits for you.</li>
          <li>Not affiliated with the Indonesian or Thai government.</li>
          <li>When you teach it, it reads the form in your browser only. Nothing is sent to a server.</li>
          <li>The <i>Rumah123</i> and <i>theAsianparent</i> links are advertisements. Neither is responsible for this tool and neither gets any of your data. No warranty.</li>
        </ul>
        <p style={{ fontSize: 12, margin: "0 0 12px" }}>
          <a href="https://arrivalfiller.vercel.app/privacy.html" target="_blank" rel="noopener noreferrer">Privacy policy</a>
        </p>
        <button className="ia-btn ia-btn-primary" onClick={() => setConsent({ accepted: true, at: new Date().toISOString(), version: CURRENT })}>
          I understand, let's go
        </button>
      </div>
    </div>
  );
}
