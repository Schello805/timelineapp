import { LegalPage } from "@/components/legal-page";

export default function CookiesPage() {
  return (
    <LegalPage title="Cookiehinweise">
      <p>
        Die öffentliche Timeline setzt in der Grundversion keine Tracking-Cookies. Für den
        Admin-Login verwendet die App ein technisch notwendiges Session-Cookie, damit angemeldete
        Administratoren lokal erkannt werden können.
      </p>
      <p>
        Wenn du später Analyse-, Marketing- oder eingebettete Drittanbieterfunktionen erweiterst,
        sollte hier ein Consent-Mechanismus und eine vollständige Cookie-Liste ergänzt werden.
      </p>
    </LegalPage>
  );
}
