/**
 * Advertisement footer (unpaid). theAsianparent shows for every country, taking
 * turns with Rumah123 on Indonesia. They are advertisers ONLY, with no product or
 * data responsibility. The "Advertisement"
 * label keeps it from reading as an endorsement. Logos bundled locally (no hotlinking).
 */
import { useEffect, useState } from "react";
import { adForThisOpen, type Ad } from "./ads";
import rumah123Logo from "./rumah123-logo.svg";
import tapLogo from "./tap-logo.png";

const RUMAH123_LINK = "https://www.rumah123.com/?utm_source=arrivalfiller&utm_medium=ext&utm_campaign=arrival_card";
const TAP_APP_STORE = "https://apps.apple.com/app/id1042523855";
const TAP_GOOGLE_PLAY = "https://play.google.com/store/apps/details?id=com.tickledmedia.ParentTown&referrer=utm_source%3Darrivalfiller%26utm_medium%3Dext%26utm_campaign%3Darrival_card";

const link = (href: string, text: string) => <a href={href} target="_blank" rel="noopener noreferrer">{text}</a>;

function Tag() {
  return <span className="tag">Advertisement</span>;
}

export function AdFooter({ ads }: { ads: readonly Ad[] }) {
  const [ad, setAd] = useState<Ad | null>(null);
  useEffect(() => { void adForThisOpen(ads).then(setAd); }, [ads]);

  if (ad === "rumah123") {
    return (
      <div className="ia-ad">
        <img src={rumah123Logo} alt="Rumah123" height={22} />
        <span>
          <Tag />
          Coming to Indonesia? Good time to look for property on {link(RUMAH123_LINK, "rumah123.com")}.
        </span>
      </div>
    );
  }
  if (ad === "theasianparent") {
    return (
      <div className="ia-ad">
        <img src={tapLogo} alt="theAsianparent" width={95} height={16} />
        <span>
          <Tag />
          Parenting? Download Asia's #1 parenting app: {link(TAP_APP_STORE, "App Store")} or {link(TAP_GOOGLE_PLAY, "Google Play")}.
        </span>
      </div>
    );
  }
  return null;
}
