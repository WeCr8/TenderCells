import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getConsentChoice, setConsentChoice, type ConsentChoice } from "../utils/consent";
import "./CookieConsent.css";

export default function CookieConsent() {
  const [choice, setChoice] = useState<ConsentChoice | null>(() => getConsentChoice());

  useEffect(() => {
    const handleUpdate = () => setChoice(getConsentChoice());
    window.addEventListener("tendercells-consent-updated", handleUpdate);
    return () => window.removeEventListener("tendercells-consent-updated", handleUpdate);
  }, []);

  if (choice) return null;

  const choose = (next: ConsentChoice) => {
    setConsentChoice(next);
    setChoice(next);
  };

  return (
    <div className="cookie-consent" role="dialog" aria-live="polite" aria-label="Cookie choices">
      <div>
        <h2>Cookie Choices</h2>
        <p>
          TenderCells uses necessary site storage and may use Google Analytics, Google Tag Manager,
          and Google advertising cookies for measurement and ads. You can accept or reject optional
          analytics and advertising storage now.
        </p>
        <Link to="/cookie-policy">Cookie Policy</Link>
      </div>
      <div className="cookie-consent-actions">
        <button type="button" className="btn-outline" onClick={() => choose("rejected")}>
          Reject Optional
        </button>
        <button type="button" className="btn-primary" onClick={() => choose("accepted")}>
          Accept
        </button>
      </div>
    </div>
  );
}

