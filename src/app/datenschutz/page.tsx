import { LegalPage } from "@/components/legal-page";

export default function DatenschutzPage() {
  return (
    <LegalPage title="Datenschutz">
      <p>
        Diese Datenschutzerklaerung ist ein technischer Platzhalter. Die App nutzt Supabase fuer
        Authentifizierung, Datenbank und Dateiablage, sobald die entsprechenden Zugangsdaten
        konfiguriert sind.
      </p>
      <p>
        In der Timeline koennen externe Medienquellen wie YouTube, Vimeo oder direkte Bild- und
        PDF-URLs eingebunden werden. Beim Oeffnen solcher Inhalte koennen Daten an den jeweiligen
        Anbieter uebertragen werden.
      </p>
      <p>
        Ergaenze hier Verantwortlichen, Rechtsgrundlagen, Speicherdauer, Betroffenenrechte,
        Hosting-Informationen und Kontaktmoeglichkeiten passend zu deinem Projekt.
      </p>
    </LegalPage>
  );
}
