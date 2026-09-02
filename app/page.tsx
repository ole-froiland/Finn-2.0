'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import {
  Bath,
  BedDouble,
  Bell,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  Heart,
  House,
  List,
  Map,
  MapPin,
  Search,
  SlidersHorizontal,
  Square,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Property = {
  id: number;
  image: string;
  place: string;
  address: string;
  title: string;
  type: 'Leilighet' | 'Enebolig' | 'Rekkehus' | 'Hytte';
  transaction: 'Til salgs' | 'Til leie';
  bedrooms: number;
  baths: number;
  area: number;
  price: number;
  monthly?: boolean;
  tag?: string;
  x: number;
  y: number;
};

const properties: Property[] = [
  { id: 1, image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=86', place: 'Nordstrand, Oslo', address: 'Solveien 112', title: 'Lys enebolig med fjordutsikt og solrik hage', type: 'Enebolig', transaction: 'Til salgs', bedrooms: 4, baths: 2, area: 184, price: 12490000, tag: 'Ny i dag', x: 61, y: 58 },
  { id: 2, image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=86', place: 'Frogner, Oslo', address: 'Elisenbergveien 18B', title: 'Klassisk hjørneleilighet med vestvendt balkong', type: 'Leilighet', transaction: 'Til salgs', bedrooms: 3, baths: 1, area: 121, price: 10950000, tag: 'Visning søndag', x: 46, y: 43 },
  { id: 3, image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=86', place: 'Sandviken, Bergen', address: 'Amalie Skrams vei 7', title: 'Moderne familiebolig med nærhet til sjøen', type: 'Rekkehus', transaction: 'Til salgs', bedrooms: 3, baths: 2, area: 146, price: 8790000, x: 22, y: 48 },
  { id: 4, image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=86', place: 'Byåsen, Trondheim', address: 'Stavnevegen 42', title: 'Arkitekttegnet enebolig med panoramautsikt', type: 'Enebolig', transaction: 'Til salgs', bedrooms: 5, baths: 2, area: 226, price: 11200000, tag: 'Prisjustert', x: 57, y: 22 },
  { id: 5, image: 'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1200&q=86', place: 'Grünerløkka, Oslo', address: 'Sofienberggata 31', title: 'Gjennomført toppleilighet med takterrasse', type: 'Leilighet', transaction: 'Til salgs', bedrooms: 2, baths: 1, area: 78, price: 7450000, x: 50, y: 40 },
  { id: 6, image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=86', place: 'Høvik, Bærum', address: 'Strandveien 64C', title: 'Innholdsrikt rekkehus i rolig, familievennlig tun', type: 'Rekkehus', transaction: 'Til salgs', bedrooms: 3, baths: 2, area: 139, price: 9250000, x: 38, y: 52 },
  { id: 7, image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=86', place: 'Tromsøya, Tromsø', address: 'Storgata 88', title: 'Nyere leilighet med utsikt mot sundet', type: 'Leilighet', transaction: 'Til leie', bedrooms: 2, baths: 1, area: 67, price: 21500, monthly: true, tag: 'Ledig nå', x: 66, y: 11 },
  { id: 8, image: 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=1200&q=86', place: 'Majorstuen, Oslo', address: 'Sørkedalsveien 9', title: 'Lun og moderne 3-roms nær alt', type: 'Leilighet', transaction: 'Til leie', bedrooms: 2, baths: 1, area: 72, price: 24800, monthly: true, x: 43, y: 39 },
  { id: 9, image: 'https://images.unsplash.com/photo-1600585152915-d208bec867a1?auto=format&fit=crop&w=1200&q=86', place: 'Kragerø, Telemark', address: 'Skåtøyveien 203', title: 'Sjøhytte med brygge og utsikt mot skjærgården', type: 'Hytte', transaction: 'Til salgs', bedrooms: 3, baths: 1, area: 94, price: 6890000, tag: 'Sjelden mulighet', x: 49, y: 68 },
];

const formatPrice = (property: Property) =>
  `${new Intl.NumberFormat('nb-NO').format(property.price)} kr${property.monthly ? ' / mnd.' : ''}`;

export default function Home() {
  const [query, setQuery] = useState('');
  const [transaction, setTransaction] = useState<'Til salgs' | 'Til leie'>('Til salgs');
  const [type, setType] = useState('Alle boligtyper');
  const [bedrooms, setBedrooms] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);
  const [sort, setSort] = useState('Anbefalt');
  const [view, setView] = useState<'list' | 'map'>('list');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<Property | null>(null);
  const [savedSearch, setSavedSearch] = useState(false);

  const filtered = useMemo(() => {
    const normalized = query.toLocaleLowerCase('nb-NO').trim();
    const result = properties.filter((property) => {
      const searchable = `${property.place} ${property.address} ${property.title}`.toLocaleLowerCase('nb-NO');
      return property.transaction === transaction &&
        (!normalized || searchable.includes(normalized)) &&
        (type === 'Alle boligtyper' || property.type === type) &&
        (!bedrooms || property.bedrooms >= bedrooms) &&
        (!maxPrice || property.price <= maxPrice) &&
        (!favoriteOnly || favorites.has(property.id));
    });
    return [...result].sort((a, b) => {
      if (sort === 'Lavest pris') return a.price - b.price;
      if (sort === 'Høyest pris') return b.price - a.price;
      if (sort === 'Størst areal') return b.area - a.area;
      return a.id - b.id;
    });
  }, [bedrooms, favoriteOnly, favorites, maxPrice, query, sort, transaction, type]);

  const estimatedCount = filtered.length ? filtered.length * 183 : 0;
  const toggleFavorite = (id: number) => {
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-9">
          <button onClick={() => { setQuery(''); setFavoriteOnly(false); }} className="flex items-center gap-2.5 text-xl font-bold tracking-[-0.03em]">
            <span className="grid size-10 place-items-center rounded-[13px] bg-primary text-primary-foreground shadow-sm"><Building2 size={21} strokeWidth={2.4} /></span>
            Hjemly
          </button>
          <nav className="flex items-center gap-1 text-sm font-semibold sm:gap-2">
            <Button variant="ghost" size="lg" className="hidden rounded-full px-4 sm:flex" onClick={() => setSavedSearch(true)}><Bell /> Lagrede søk</Button>
            <Button variant={favoriteOnly ? 'secondary' : 'ghost'} size="lg" className="rounded-full px-3 sm:px-4" onClick={() => setFavoriteOnly((value) => !value)}>
              <Heart className={favoriteOnly ? 'fill-current text-rose-500' : ''} />
              <span className="hidden sm:inline">Favoritter</span>{favorites.size > 0 && <span className="rounded-full bg-foreground px-1.5 text-[11px] text-background">{favorites.size}</span>}
            </Button>
          </nav>
        </div>
      </header>

      <section className="border-b border-border bg-white">
        <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-9 lg:py-8">
          <div className="mb-5 flex gap-1 rounded-full bg-muted p-1 sm:w-fit">
            {(['Til salgs', 'Til leie'] as const).map((option) => (
              <button key={option} onClick={() => { setTransaction(option); setMaxPrice(0); }} className={`flex-1 rounded-full px-5 py-2 text-sm font-semibold transition sm:flex-none ${transaction === option ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>{option}</button>
            ))}
          </div>
          <div className="flex flex-col gap-3 lg:flex-row">
            <label className="flex h-14 flex-1 items-center gap-3 rounded-2xl border border-input bg-white px-4 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 lg:max-w-2xl">
              <Search size={20} className="text-muted-foreground" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Søk etter sted eller adresse" placeholder="Sted, adresse eller postnummer" className="h-auto border-0 p-0 text-base shadow-none focus-visible:ring-0" />
              {query && <button aria-label="Tøm søk" onClick={() => setQuery('')}><X size={18} /></button>}
            </label>
            <div className="grid grid-cols-2 gap-3 sm:flex">
              <label className="filter-select"><House size={17} /><select aria-label="Boligtype" value={type} onChange={(event) => setType(event.target.value)}><option>Alle boligtyper</option><option>Leilighet</option><option>Enebolig</option><option>Rekkehus</option><option>Hytte</option></select><ChevronDown size={15} /></label>
              <label className="filter-select"><BedDouble size={17} /><select aria-label="Minimum antall soverom" value={bedrooms} onChange={(event) => setBedrooms(Number(event.target.value))}><option value="0">Soverom</option><option value="1">1+ soverom</option><option value="2">2+ soverom</option><option value="3">3+ soverom</option><option value="4">4+ soverom</option></select><ChevronDown size={15} /></label>
              <Button variant="outline" size="lg" className={`h-14 rounded-2xl px-5 ${filtersOpen ? 'border-primary bg-primary/5 text-primary' : ''}`} onClick={() => setFiltersOpen((value) => !value)}><SlidersHorizontal /> Flere filtre</Button>
              <Button size="lg" className="h-14 rounded-2xl px-6" onClick={() => setView('list')}>Vis {new Intl.NumberFormat('nb-NO').format(estimatedCount)}</Button>
            </div>
          </div>

          {filtersOpen && (
            <div className="mt-4 grid gap-4 rounded-2xl border border-border bg-background p-4 shadow-sm sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <label className="space-y-2 text-sm font-semibold">Makspris
                <select className="advanced-select" value={maxPrice} onChange={(event) => setMaxPrice(Number(event.target.value))}>
                  <option value="0">Ingen makspris</option>
                  {transaction === 'Til salgs' ? <><option value="7000000">7 000 000 kr</option><option value="9000000">9 000 000 kr</option><option value="11000000">11 000 000 kr</option><option value="13000000">13 000 000 kr</option></> : <><option value="22000">22 000 kr / mnd.</option><option value="25000">25 000 kr / mnd.</option></>}
                </select>
              </label>
              <div className="space-y-2"><p className="text-sm font-semibold">Kvaliteter</p><div className="flex gap-2"><span className="filter-chip"><Check size={14} /> Balkong</span><span className="filter-chip">Parkering</span><span className="filter-chip">Heis</span></div></div>
              <Button variant="ghost" className="h-11 rounded-xl" onClick={() => { setType('Alle boligtyper'); setBedrooms(0); setMaxPrice(0); }}>Nullstill</Button>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-9">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2"><h1 className="text-2xl font-bold tracking-[-0.03em]">{favoriteOnly ? 'Dine favoritter' : `Boliger ${transaction.toLocaleLowerCase('nb-NO')}`}</h1>{query && <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{query}</span>}</div>
            <p className="mt-1 text-sm text-muted-foreground">{new Intl.NumberFormat('nb-NO').format(estimatedCount)} treff · oppdatert akkurat nå</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="sort-select"><span className="hidden sm:inline">Sorter:</span><select aria-label="Sorter boliger" value={sort} onChange={(event) => setSort(event.target.value)}><option>Anbefalt</option><option>Lavest pris</option><option>Høyest pris</option><option>Størst areal</option></select><ChevronDown size={14} /></label>
            <div className="flex rounded-xl border border-input bg-white p-1 shadow-sm">
              <button aria-label="Listevisning" onClick={() => setView('list')} className={`view-button ${view === 'list' ? 'active' : ''}`}><List size={17} /><span className="hidden sm:inline">Liste</span></button>
              <button aria-label="Kartvisning" onClick={() => setView('map')} className={`view-button ${view === 'map' ? 'active' : ''}`}><Map size={17} /><span className="hidden sm:inline">Kart</span></button>
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="grid min-h-[420px] place-items-center rounded-3xl border border-dashed border-input bg-white p-8 text-center">
            <div><span className="mx-auto grid size-14 place-items-center rounded-full bg-muted"><Search /></span><h2 className="mt-4 text-xl font-bold">Ingen boliger passer filtrene</h2><p className="mt-2 text-sm text-muted-foreground">Prøv et annet sted eller fjern ett av filtrene.</p><Button className="mt-5 rounded-xl" onClick={() => { setQuery(''); setType('Alle boligtyper'); setBedrooms(0); setMaxPrice(0); setFavoriteOnly(false); }}>Vis alle boliger</Button></div>
          </div>
        ) : view === 'map' ? (
          <div className="map-layout">
            <div className="map-canvas" aria-label="Forenklet kart over boligtreff">
              <div className="map-water" />
              <span className="map-label" style={{ left: '43%', top: '45%' }}>Oslo</span>
              <span className="map-label" style={{ left: '18%', top: '51%' }}>Bergen</span>
              {filtered.map((property) => <button key={property.id} onClick={() => setSelected(property)} className="map-pin" style={{ left: `${property.x}%`, top: `${property.y}%` }}>{property.monthly ? `${Math.round(property.price / 1000)}k` : `${(property.price / 1000000).toFixed(1).replace('.', ',')} mill.`}</button>)}
              <div className="absolute bottom-4 left-4 rounded-xl bg-white/95 px-3 py-2 text-xs font-semibold shadow-lg">Demokart · boligene er illustrerende</div>
            </div>
            <div className="space-y-3 overflow-auto lg:max-h-[660px]">
              {filtered.map((property) => <PropertyRow key={property.id} property={property} favorite={favorites.has(property.id)} onFavorite={toggleFavorite} onSelect={setSelected} />)}
            </div>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((property) => <PropertyCard key={property.id} property={property} favorite={favorites.has(property.id)} onFavorite={toggleFavorite} onSelect={setSelected} />)}
          </div>
        )}

        {filtered.length > 0 && <div className="mt-10 flex justify-center"><Button variant="outline" size="lg" className="h-12 rounded-full bg-white px-7">Vis flere boliger</Button></div>}
      </section>

      <footer className="mt-10 border-t border-border bg-white"><div className="mx-auto flex max-w-[1500px] flex-col justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row lg:px-9"><p><strong className="text-foreground">Hjemly</strong> · En selvstendig demo av en moderne boligportal.</p><p>Demodata · Bilder fra Unsplash · Ikke tilknyttet FINN.no</p></div></footer>

      {savedSearch && <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl bg-foreground px-5 py-3.5 text-sm font-semibold text-background shadow-2xl"><span className="grid size-7 place-items-center rounded-full bg-primary text-white"><Check size={16} /></span>Søket er lagret<button aria-label="Lukk" onClick={() => setSavedSearch(false)}><X size={17} /></button></div>}

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        {selected && <DialogContent className="max-h-[92vh] max-w-4xl gap-0 overflow-y-auto rounded-3xl p-0" showCloseButton>
          <div className="relative aspect-[16/8] overflow-hidden rounded-t-3xl bg-muted"><Image src={selected.image} alt={selected.title} fill sizes="(max-width: 896px) 100vw, 896px" className="object-cover" /><span className="absolute bottom-4 left-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold shadow">{selected.transaction}</span></div>
          <div className="p-6 sm:p-8">
            <DialogHeader>
              <p className="font-semibold text-primary">{selected.place}</p>
              <DialogTitle className="text-2xl font-bold leading-tight sm:text-3xl">{selected.title}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 text-base"><MapPin size={17} /> {selected.address}</DialogDescription>
            </DialogHeader>
            <div className="my-6 grid grid-cols-3 gap-3"><Fact icon={<BedDouble />} label={`${selected.bedrooms} soverom`} /><Fact icon={<Bath />} label={`${selected.baths} bad`} /><Fact icon={<Square />} label={`${selected.area} m²`} /></div>
            <div className="rounded-2xl bg-background p-5"><p className="text-sm text-muted-foreground">Prisantydning</p><p className="mt-1 text-3xl font-bold tracking-tight">{formatPrice(selected)}</p>{!selected.monthly && <p className="mt-2 text-sm text-muted-foreground">Omkostninger og eventuell fellesgjeld kommer i tillegg.</p>}</div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2"><Button size="lg" className="h-12 rounded-xl" onClick={() => setSavedSearch(true)}><CalendarDays /> Be om visning</Button><Button variant="outline" size="lg" className="h-12 rounded-xl" onClick={() => toggleFavorite(selected.id)}><Heart className={favorites.has(selected.id) ? 'fill-current text-rose-500' : ''} /> {favorites.has(selected.id) ? 'Lagret som favoritt' : 'Lagre som favoritt'}</Button></div>
          </div>
        </DialogContent>}
      </Dialog>
    </main>
  );
}

function PropertyCard({ property, favorite, onFavorite, onSelect }: { property: Property; favorite: boolean; onFavorite: (id: number) => void; onSelect: (property: Property) => void }) {
  return <article className="property-card group">
    <div className="relative aspect-[4/3] overflow-hidden bg-muted"><Image src={property.image} alt={property.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw" className="object-cover transition duration-500 group-hover:scale-[1.025]" />{property.tag && <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold shadow-sm">{property.tag}</span>}<button aria-label={`${favorite ? 'Fjern' : 'Lagre'} ${property.title}`} onClick={() => onFavorite(property.id)} className="favorite-button"><Heart className={favorite ? 'fill-rose-500 text-rose-500' : ''} size={21} /></button></div>
    <div className="p-5"><p className="text-sm font-semibold text-primary">{property.place}</p><button onClick={() => onSelect(property)} className="mt-1.5 block text-left text-lg font-bold leading-snug hover:underline">{property.title}</button><p className="mt-1 text-sm text-muted-foreground">{property.address}</p><div className="mt-4 flex gap-4 text-sm text-muted-foreground"><span className="flex items-center gap-1.5"><BedDouble size={16} /> {property.bedrooms}</span><span className="flex items-center gap-1.5"><Square size={15} /> {property.area} m²</span><span>{property.type}</span></div><p className="mt-4 text-xl font-bold tracking-tight">{formatPrice(property)}</p></div>
  </article>;
}

function PropertyRow({ property, favorite, onFavorite, onSelect }: { property: Property; favorite: boolean; onFavorite: (id: number) => void; onSelect: (property: Property) => void }) {
  return <article className="flex gap-3 rounded-2xl border border-border bg-white p-3 shadow-sm"><Image src={property.image} alt="" width={128} height={112} className="h-28 w-32 rounded-xl object-cover" /><div className="min-w-0 flex-1"><p className="text-xs font-semibold text-primary">{property.place}</p><button onClick={() => onSelect(property)} className="mt-1 line-clamp-2 text-left font-bold leading-snug hover:underline">{property.title}</button><p className="mt-2 text-sm font-bold">{formatPrice(property)}</p></div><button onClick={() => onFavorite(property.id)} aria-label="Lagre bolig" className="self-start p-2"><Heart size={18} className={favorite ? 'fill-rose-500 text-rose-500' : ''} /></button></article>;
}

function Fact({ icon, label }: { icon: React.ReactNode; label: string }) {
  return <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-white p-4 text-center text-sm font-semibold [&_svg]:size-5 [&_svg]:text-primary">{icon}{label}</div>;
}
