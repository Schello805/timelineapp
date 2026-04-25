import { LegalPage } from "@/components/legal-page";

export default function ImpressumPage() {
  return (
    <LegalPage title="Impressum">
      <p>
        Angaben gemäß § 5 TMG.
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
        Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV:
        <br />
        Michael Schellenberger, Anschrift wie oben.
      </p>
      <p>
        Bitte prüfe vor der produktiven Veröffentlichung, ob für deinen konkreten Einsatz weitere
        Pflichtangaben erforderlich sind.
      </p>
    </LegalPage>
  );
}
