import { LegalPage } from "@/components/legal-page";

export default function ImpressumPage() {
  return (
    <LegalPage title="Impressum">
      <p>
        Angaben gemaess § 5 TMG.
      </p>
      <p>
        Michael Schellenberger
        <br />
        Ziegeleistrasse 32
        <br />
        91572 Bechhofen
      </p>
      <p>
        Kontakt:
        <br />
        E-Mail:{" "}
        <a className="font-semibold text-teal-700 hover:text-teal-900" href="mailto:Info@schellenberger.biz">
          Info@schellenberger.biz
        </a>
      </p>
      <p>
        Verantwortlich fuer den Inhalt nach § 18 Abs. 2 MStV:
        <br />
        Michael Schellenberger, Anschrift wie oben.
      </p>
      <p>
        Bitte pruefe vor der produktiven Veroeffentlichung, ob fuer deinen konkreten Einsatz weitere
        Pflichtangaben erforderlich sind.
      </p>
    </LegalPage>
  );
}
