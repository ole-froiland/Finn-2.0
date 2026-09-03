/**
 * The page carries FINN's mark, so it has to say plainly that it is not FINN.
 * Kept to one quiet line so it states the fact without shouting over the UI.
 */
export function Disclaimer() {
  return (
    <p className="disclaimer">
      <span className="shell">
        Uoffisiell klone av FINN Eiendom — ikke tilknyttet FINN.no. Annonser lenker til originalen.
      </span>
    </p>
  );
}
