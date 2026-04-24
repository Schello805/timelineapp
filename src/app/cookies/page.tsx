import { LegalPage } from "@/components/legal-page";

export default function CookiesPage() {
  return (
    <LegalPage title="Cookiehinweise">
      <p>
        Die oeffentliche Timeline setzt in der Grundversion keine Tracking-Cookies. Fuer den
        Admin-Login verwendet die App ein technisch notwendiges Session-Cookie, damit angemeldete
        Administratoren lokal erkannt werden koennen.
      </p>
      <p>
        Wenn du spaeter Analyse-, Marketing- oder eingebettete Drittanbieterfunktionen erweiterst,
        sollte hier ein Consent-Mechanismus und eine vollstaendige Cookie-Liste ergaenzt werden.
      </p>
    </LegalPage>
  );
}
