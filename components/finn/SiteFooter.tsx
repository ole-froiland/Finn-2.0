import { formatUpdatedAt } from '@/lib/finn/format';

export function SiteFooter({ updatedAt }: { updatedAt: string }) {
  return (
    <footer className="footer">
      <div className="shell">
        <p className="footer__legal">
          Uoffisiell klone av FINN Eiendom, laget som hobbyprosjekt. <strong>Ikke tilknyttet
          FINN.no AS.</strong> FINN-navnet og -logoen tilhører FINN.no AS; annonsedata og bilder
          tilhører FINN og de respektive annonsørene. Hver annonse lenker til originalen på
          finn.no.
        </p>
        <p className="footer__meta">Annonsene ble sist oppdatert {formatUpdatedAt(updatedAt)}.</p>
      </div>
    </footer>
  );
}
