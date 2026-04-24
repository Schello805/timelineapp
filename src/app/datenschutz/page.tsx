import { LegalPage } from "@/components/legal-page";

export default function DatenschutzPage() {
  return (
    <LegalPage title="Datenschutz">
      <h2 className="text-xl font-semibold text-stone-950">Verantwortlicher</h2>
      <p>
        Michael Schellenberger
        <br />
        Ziegeleistrasse 32
        <br />
        91572 Bechhofen
        <br />
        E-Mail:{" "}
        <a className="font-semibold text-teal-700 hover:text-teal-900" href="mailto:Info@schellenberger.biz">
          Info@schellenberger.biz
        </a>
      </p>
      <h2 className="text-xl font-semibold text-stone-950">Verarbeitung personenbezogener Daten</h2>
      <p>
        Diese App stellt eine oeffentliche Medien-Timeline bereit. Beim Aufruf der Website werden
        technisch notwendige Zugriffsdaten verarbeitet, zum Beispiel IP-Adresse, Zeitpunkt des
        Abrufs, Browserinformationen und angeforderte Seiten. Diese Daten sind erforderlich, um die
        Website sicher und stabil auszuliefern.
      </p>
      <h2 className="text-xl font-semibold text-stone-950">Supabase</h2>
      <p>
        Die App nutzt Supabase fuer Authentifizierung, Datenbank und Dateiablage, sobald die
        entsprechenden Zugangsdaten konfiguriert sind. Im Admin-Bereich werden technisch notwendige
        Session-Daten verarbeitet, damit angemeldete Administratoren erkannt werden koennen.
      </p>
      <h2 className="text-xl font-semibold text-stone-950">Eingebundene Medien</h2>
      <p>
        In der Timeline koennen externe Medienquellen wie YouTube, Vimeo, direkte Bild-URLs,
        Video-Dateien oder PDF-Dateien eingebunden werden. Beim Oeffnen oder Abspielen solcher
        Inhalte koennen Daten an den jeweiligen Anbieter uebertragen werden.
      </p>
      <h2 className="text-xl font-semibold text-stone-950">Kontakt und Betroffenenrechte</h2>
      <p>
        Du kannst dich jederzeit unter{" "}
        <a className="font-semibold text-teal-700 hover:text-teal-900" href="mailto:Info@schellenberger.biz">
          Info@schellenberger.biz
        </a>{" "}
        melden, wenn du Auskunft, Berichtigung, Loeschung, Einschraenkung der Verarbeitung oder
        Widerspruch gegen eine Verarbeitung geltend machen moechtest.
      </p>
      <p>
        Bitte lasse diese Datenschutzerklaerung vor produktiver Nutzung rechtlich pruefen und um
        konkrete Hosting-, Speicher- und Anbieterangaben ergaenzen.
      </p>
    </LegalPage>
  );
}
