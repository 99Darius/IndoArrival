/**
 * Rumah123 advertisement footer (unpaid). Rumah123 is an advertiser ONLY — no
 * product or data responsibility. The "Advertisement" label keeps it from
 * reading as an endorsement. Logo bundled locally (no hotlinking).
 */
import logoUrl from "./rumah123-logo.svg";

const AD_LINK = "https://www.rumah123.com/?utm_source=indoarrival&utm_medium=ext&utm_campaign=arrival_card";

export function AdFooter() {
  return (
    <div className="ia-ad">
      <img src={logoUrl} alt="Rumah123" height={22} />
      <span>
        <span className="tag">Advertisement</span>
        Coming to Indonesia? Good time to look for property on{" "}
        <a href={AD_LINK} target="_blank" rel="noopener noreferrer">rumah123.com</a>.
      </span>
    </div>
  );
}
