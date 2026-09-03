import { formatUpdatedAt } from '@/lib/finn/format';

export function SiteFooter({ updatedAt }: { updatedAt: string }) {
  return (
    <footer className="footer">
      <div className="shell">
        <div className="footer__grid">
          <div>
            <h2>Om Hjemly</h2>
            <ul>
              <li>Slik fungerer søket</li>
              <li>Personvern</li>
              <li>Informasjonskapsler</li>
            </ul>
          </div>
          <div>
            <h2>Eiendom</h2>
            <ul>
              <li>Bolig til salgs</li>
              <li>Nye boliger</li>
              <li>Boligpriser</li>
            </ul>
          </div>
          <div>
            <h2>Data</h2>
            <ul>
              <li>Kilde: finn.no</li>
              <li>Sist oppdatert {formatUpdatedAt(updatedAt)}</li>
            </ul>
          </div>
        </div>
        <p className="footer__legal">
          Hjemly er et uavhengig hobbyprosjekt og er <strong>ikke tilknyttet FINN.no AS</strong>.
          Annonsedata og bilder tilhører FINN og de respektive annonsørene, og alle annonser lenker
          til originalen på finn.no.
        </p>
      </div>
    </footer>
  );
}
