'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import {
  Bell,
  Check,
  ChevronDown,
  Heart,
  Info,
  MapPin,
  Search,
} from 'lucide-react';

type Listing = {
  id: string;
  agency: string;
  address: string;
  title: string;
  image: string;
  href: string;
  area: number;
  price: number;
  totalPrice: number;
  ownership: string;
  type: 'Leilighet' | 'Enebolig';
  county: string;
  bedrooms: number;
  publishedToday: boolean;
  viewing: string;
  promoted?: boolean;
};

const listings: Listing[] = [
  { id: '473995301', agency: 'EiendomsMegler 1 Sandefjord', address: 'Kolstadveien 16, Andebu', title: 'HØYJORD - Innholdsrik enebolig med 4 soverom, svømmebasseng og stor tomt | Flere terrasser og god utsikt | Integrert garasje', image: 'https://images.finncdn.no/dynamic/480w/2026/9/vertical-2/01/1/473/995/301_86e79f20-e7d4-47bc-af81-fb88a9094d51.jpg', href: 'https://www.finn.no/realestate/homes/ad.html?finnkode=473995301', area: 255, price: 4500000, totalPrice: 4613590, ownership: 'Selveier', type: 'Enebolig', county: 'Vestfold', bedrooms: 4, publishedToday: false, viewing: 'Visning - 8. sep. kl. 17:00', promoted: true },
  { id: '475386892', agency: 'Raadhuset Eiendomsmegling', address: 'Kveim 110, Gjerstad', title: 'Øvre Gjerstad - Storslått eiendom med fantastisk utsikt over Gjerstadvatnet - Strandlinje - Stor tomt med tilhørende skog', image: 'https://images.finncdn.no/dynamic/480w/2026/9/vertical-2/02/2/475/386/892_4e337bf9-6ebe-4d54-913e-b240cec19a90.jpg', href: 'https://www.finn.no/realestate/homes/ad.html?finnkode=475386892', area: 308, price: 6490000, totalPrice: 6653600, ownership: 'Selveier', type: 'Enebolig', county: 'Agder', bedrooms: 6, publishedToday: true, viewing: 'Visning - 19. sep. kl. 16:00' },
  { id: '457284188', agency: 'Proaktiv Eiendomsmegling Trondheim Øst', address: 'Midtre Tunhøgda 4, Charlottenlund', title: 'CHARLOTTENLUND - Lys og romslig 2-roms leilighet i høy 1. etasje. Vestvendt balkong med ettermiddags- og kveldssol. Parkering.', image: 'https://images.finncdn.no/dynamic/480w/2026/7/vertical-2/06/8/457/284/188_f12b8d86-d981-4b94-ae9a-5e4b06c91f41.jpg', href: 'https://www.finn.no/realestate/homes/ad.html?finnkode=457284188', area: 43, price: 2290000, totalPrice: 2816589, ownership: 'Andel', type: 'Leilighet', county: 'Trøndelag', bedrooms: 1, publishedToday: false, viewing: 'Visning - 14. sep. kl. 16:30' },
  { id: '475375272', agency: 'DNB Eiendom AS', address: 'Nordbyhagen 15, Vestby', title: 'VESTBY SENTRUM - Sentral 3-roms eierleilighet | Stor, solrik & delvis overbygd terrasse | Inngjerdet terrasse & hageflekk | Gasspeis', image: 'https://images.finncdn.no/dynamic/480w/2026/9/vertical-2/02/2/475/375/272_c80d2868-e19b-4415-9ba6-aa3c841479da.jpg', href: 'https://www.finn.no/realestate/homes/ad.html?finnkode=475375272', area: 69, price: 3900000, totalPrice: 4038959, ownership: 'Selveier', type: 'Leilighet', county: 'Akershus', bedrooms: 2, publishedToday: true, viewing: 'Visning - 6. sep. kl. 12:00' },
  { id: '474565040', agency: 'Nordvik Sunnhordland', address: 'Ramsdalen 26, Rubbestadneset', title: 'Rubbestadneset - Klassisk og moderne enebolig med flott uteområde, i populært og barnevennlig område', image: 'https://images.finncdn.no/dynamic/480w/2026/8/vertical-2/25/0/474/565/040_cc9d0025-f736-4ebd-b0a7-b666d93be044.jpg', href: 'https://www.finn.no/realestate/homes/ad.html?finnkode=474565040', area: 170, price: 5390000, totalPrice: 5525840, ownership: 'Selveier', type: 'Enebolig', county: 'Vestland', bedrooms: 4, publishedToday: false, viewing: 'Visning - 14. sep. kl. 16:00' },
  { id: '475386368', agency: 'Exbo Sørlandet AS', address: 'Speiderveien 35B, Grimstad', title: 'Grimstad - Innholdsrik 4-roms leilighet over 2 plan med sjøutsikt, stor veranda, garasje og gode solforhold.', image: 'https://images.finncdn.no/dynamic/480w/2026/9/vertical-2/02/8/475/386/368_738ca4bb-7d38-4828-a1a8-435a671a93c8.jpg', href: 'https://www.finn.no/realestate/homes/ad.html?finnkode=475386368', area: 123, price: 3690000, totalPrice: 3793540, ownership: 'Selveier', type: 'Leilighet', county: 'Agder', bedrooms: 3, publishedToday: true, viewing: 'Visning - 10. sep. kl. 16:00' },
];

const countyCounts = [
  ['Agder', '2 310'], ['Akershus', '7 267'], ['Buskerud', '2 269'], ['Innlandet', '2 897'],
  ['Oslo', '5 443'], ['Rogaland', '3 182'], ['Trøndelag', '2 751'], ['Vestfold', '2 104'], ['Vestland', '3 063'],
] as const;

const money = (value: number) => `${new Intl.NumberFormat('nb-NO').format(value)} kr`;

export default function Home() {
  const [query, setQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [newToday, setNewToday] = useState(false);
  const [counties, setCounties] = useState<Set<string>>(new Set());
  const [showAllCounties, setShowAllCounties] = useState(false);
  const [savedSearch, setSavedSearch] = useState(false);
  const [mapMode, setMapMode] = useState<'Tegn' | 'Radius' | null>(null);
  const [types, setTypes] = useState<Set<string>>(new Set());
  const [bedrooms, setBedrooms] = useState(0);
  const [sort, setSort] = useState('Publisert');

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('nb-NO');
    const locationNeedle = locationQuery.trim().toLocaleLowerCase('nb-NO');
    const result = listings.filter((listing) =>
      (!needle || `${listing.title} ${listing.address}`.toLocaleLowerCase('nb-NO').includes(needle)) &&
      (!locationNeedle || `${listing.address} ${listing.county}`.toLocaleLowerCase('nb-NO').includes(locationNeedle)) &&
      (!newToday || listing.publishedToday) &&
      (!counties.size || counties.has(listing.county)) &&
      (!types.size || types.has(listing.type)) &&
      (!bedrooms || listing.bedrooms >= bedrooms),
    );
    return [...result].sort((a, b) => {
      if (sort === 'Prisant lav-høy') return a.price - b.price;
      if (sort === 'Prisant høy-lav') return b.price - a.price;
      if (sort === 'Areal høy-lav') return b.area - a.area;
      return 0;
    });
  }, [bedrooms, counties, locationQuery, newToday, query, sort, types]);

  const toggleType = (type: string) => setTypes((current) => {
    const next = new Set(current);
    if (next.has(type)) next.delete(type); else next.add(type);
    return next;
  });

  const toggleCounty = (county: string) => setCounties((current) => {
    const next = new Set(current);
    if (next.has(county)) next.delete(county); else next.add(county);
    return next;
  });

  const openLiveSearch: NonNullable<React.ComponentProps<'form'>['onSubmit']> = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    window.open(`https://www.finn.no/realestate/homes/search.html${params.size ? `?${params}` : ''}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-white text-[#27272a]">
      <header className="border-b border-[#e5e7eb] bg-white">
        <div className="topbar">
          <a href="#main" className="brand" aria-label="Hjemly forside"><span className="brand-shape" /><span className="brand-word">HJEM</span></a>
        </div>
      </header>

      <main id="main" className="search-shell">
        <aside className="filters" aria-label="Filtre">
          <button className={`save-search${savedSearch ? ' saved' : ''}`} onClick={() => setSavedSearch((current) => !current)}><Bell size={17} /> {savedSearch ? 'Søk lagret' : 'Lagre søk'}</button>

          <FilterSection title="Søk i Eiendom">
            <form onSubmit={openLiveSearch} className="search-field"><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Søk i Eiendom" /><button aria-label="Søk live på FINN"><Search /></button></form>
          </FilterSection>

          <FilterSection title="Publisert">
            <CheckLine checked={newToday} onChange={setNewToday} label="Nye i dag" count="1 270" />
          </FilterSection>

          <FilterSection title="Område i kart">
            <div className="search-field location-field"><input value={locationQuery} onChange={(event) => setLocationQuery(event.target.value)} placeholder="Hvor vil du bo?" aria-label="Søk etter sted" /><span aria-hidden="true"><Search /></span></div>
            <div className="mini-map"><div className="mini-map-water" /><span>NORGE</span><div className="map-actions">{(['Tegn', 'Radius'] as const).map((mode) => <button key={mode} className={mapMode === mode ? 'active' : ''} aria-pressed={mapMode === mode} onClick={() => setMapMode((current) => current === mode ? null : mode)}>{mode}</button>)}</div><MapPin className="map-location" /></div>
          </FilterSection>

          <FilterSection title="Område">
            <div className="county-list">
              {countyCounts.slice(0, showAllCounties ? countyCounts.length : 6).map(([county, count]) => <CheckLine key={county} checked={counties.has(county)} onChange={() => toggleCounty(county)} label={county} count={count} />)}
            </div>
            <button className="show-all" onClick={() => setShowAllCounties((current) => !current)}>{showAllCounties ? 'Vis færre' : 'Vis alle'}</button>
          </FilterSection>

          <FilterSection title="Antall soverom">
            <div className="radio-row">{[0, 1, 2, 3, 4].map((value) => <button key={value} onClick={() => setBedrooms(value)} className={bedrooms === value ? 'selected' : ''}>{value ? `${value}+` : 'Alle'}</button>)}</div>
          </FilterSection>

          <FilterSection title="Boligtype">
            <CheckLine checked={types.has('Leilighet')} onChange={() => toggleType('Leilighet')} label="Leilighet" count="25 685" />
            <CheckLine checked={types.has('Enebolig')} onChange={() => toggleType('Enebolig')} label="Enebolig" count="9 572" />
          </FilterSection>
        </aside>

        <section className="results" aria-labelledby="results-title">
          <div className="results-top">
            <div className="results-heading"><h1 id="results-title">Bolig til salgs</h1><p><strong>{visible.length}</strong> av <strong>{listings.length}</strong> viste annonser</p></div>
            <div className="result-actions"><label>Sorter på<select value={sort} onChange={(event) => setSort(event.target.value)}><option>Publisert</option><option>Prisant lav-høy</option><option>Prisant høy-lav</option><option>Areal høy-lav</option></select><ChevronDown /></label></div>
          </div>

          <div className="source-note"><Info /><p><strong>Ekte annonser, kontrollert 2. september 2026.</strong> Utvalget under lenker til originalannonsene. <a href="https://www.finn.no/realestate/homes/search.html" target="_blank" rel="noreferrer">Åpne alle live treff på FINN</a>.</p></div>

          <div className="listing-stack">
            {visible.map((listing) => (
              <article className="listing-card" key={listing.id}>
                <div className="listing-media">
                  <a href={listing.href} target="_blank" rel="noreferrer" aria-label={`Åpne ${listing.title} på FINN`}><Image src={listing.image} alt={listing.title} fill sizes="(max-width: 760px) 100vw, 616px" className="object-cover" /></a>
                  {listing.promoted && <span className="promoted">Ukens bolig</span>}
                  <button className="card-heart" aria-label="Legg til som favoritt" onClick={() => setFavorites((current) => { const next = new Set(current); if (next.has(listing.id)) next.delete(listing.id); else next.add(listing.id); return next; })}><Heart className={favorites.has(listing.id) ? 'fill-white' : ''} /></button>
                  <span className="image-dots">● <i>● ● ●</i></span>
                </div>
                <div className="listing-body">
                  <div className="listing-meta"><span>{listing.agency}</span><span>{listing.address}</span></div>
                  <h2><a href={listing.href} target="_blank" rel="noreferrer">{listing.title}</a></h2>
                  <div className="price-line"><strong>{listing.area} m²</strong><strong>{money(listing.price)}</strong></div>
                  <div className="facts">Totalpris: {money(listing.totalPrice)} ∙ {listing.ownership} ∙ {listing.type} ∙ {listing.bedrooms} soverom</div>
                  <div className="viewing-row"><span>{listing.viewing}</span><a href={listing.href} target="_blank" rel="noreferrer">Se annonsen ↗</a></div>
                </div>
              </article>
            ))}
          </div>

          {visible.length === 0 && <div className="empty-state"><Search /><h2>Ingen annonser i dette utvalget</h2><p>Fjern et filter, eller søk i hele den levende katalogen.</p><button onClick={() => { setQuery(''); setLocationQuery(''); setNewToday(false); setCounties(new Set()); setTypes(new Set()); setBedrooms(0); }}>Nullstill filtre</button></div>}
          <a className="live-cta" href="https://www.finn.no/realestate/homes/search.html" target="_blank" rel="noreferrer">Vis alle oppdaterte boligannonser <span>↗</span></a>
        </section>
      </main>
    </div>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="filter-section"><h2>{title}</h2>{children}</section>;
}

function CheckLine({ checked, onChange, label, count }: { checked: boolean; onChange: (value: boolean) => void; label: string; count: string }) {
  return <label className="check-line"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span className="fake-check">{checked && <Check />}</span><span>{label}</span><span className="count">({count})</span></label>;
}
