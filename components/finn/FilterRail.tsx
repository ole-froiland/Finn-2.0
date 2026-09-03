'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition, type ReactNode } from 'react';
import { Bell, Check, ChevronDown, ChevronRight, Search, SlidersHorizontal } from 'lucide-react';

import { formatNumber, viewingFacetLabel } from '@/lib/finn/format';
import {
  searchHref,
  toggleValue,
  type MultiKey,
  type RangeKey,
  type SearchQuery,
} from '@/lib/finn/params';
import type { FacetCounts } from '@/lib/finn/search';
import {
  CONDITIONS,
  DETAIL_ONLY_FILTERS,
  ENERGY_LABELS,
  FACILITIES,
  FLOORS,
  LIFECYCLES,
  OWNERSHIP_TYPES,
  PROPERTY_TYPES,
  SELLER_TYPES,
  VIDEO_TYPES,
} from '@/lib/finn/taxonomy';
import type { LocationNode } from '@/lib/finn/types';

type Props = {
  query: SearchQuery;
  facets: FacetCounts;
  locations: LocationNode[];
  enriched: number;
  /** Shown on the mobile toggle, so the button says what it will give you. */
  total: number;
  activeCount: number;
};

export function FilterRail({ query, facets, locations, enriched, total, activeCount }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  // Below the two-column breakpoint the filters live behind a button, the way
  // FINN's do — otherwise you scroll past twenty groups to reach a result.
  const [open, setOpen] = useState(false);

  const go = (next: SearchQuery) => {
    startTransition(() => router.push(searchHref({ ...next, page: 1 }), { scroll: false }));
  };

  const toggle = (key: MultiKey, value: string) => go(toggleValue(query, key, value));

  const setRange = (key: RangeKey, side: 'from' | 'to', value: number | null) =>
    go({ ...query, [key]: { ...query[key], [side]: value } });

  return (
    <aside className={`rail${open ? ' rail--open' : ''}`} aria-label="Filtre">
      <button
        type="button"
        className="rail__toggle"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <SlidersHorizontal size={18} aria-hidden="true" />
        {open ? 'Skjul filtre' : 'Filtrer'}
        {activeCount > 0 && <span className="rail__badge">{activeCount}</span>}
        <span className="rail__toggle-count">{formatNumber(total)} treff</span>
      </button>

      <div className="rail__body">
      <button type="button" className="rail__save">
        <Bell size={18} aria-hidden="true" /> Lagre søk
      </button>

      <TextFilter query={query} onSubmit={(q) => go({ ...query, q })} />

      <Group title="Publisert">
        <CheckLine
          label="Nye i dag"
          count={facets.published?.['Nye i dag'] ?? 0}
          checked={query.published}
          onChange={() => go({ ...query, published: !query.published })}
        />
      </Group>

      <LocationFilter
        locations={locations}
        selected={query.location}
        counts={facets.location ?? {}}
        onToggle={(code) => toggle('location', code)}
        onClear={() => go({ ...query, location: [] })}
      />

      <CheckGroup
        title="Salgsstatus"
        group="lifecycle"
        options={LIFECYCLES}
        query={query}
        counts={facets.lifecycle}
        onToggle={toggle}
      />

      <CheckGroup
        title="Tilstand"
        group="is_new_property"
        options={CONDITIONS}
        query={query}
        counts={facets.is_new_property}
        onToggle={toggle}
      />

      <RangeGroup title="Prisantydning" group="price" unit="kr" query={query} onChange={setRange} />
      <RangeGroup
        title="Totalpris"
        group="price_collective"
        unit="kr"
        query={query}
        onChange={setRange}
      />
      <RangeGroup
        title="Fellesutgifter per måned"
        group="rent"
        unit="kr"
        query={query}
        onChange={setRange}
      />
      <RangeGroup title="Størrelse" group="area" unit="m²" query={query} onChange={setRange} />

      <Group title="Antall soverom">
        <div className="chips">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              className="chip"
              aria-pressed={query.min_bedrooms === value}
              onClick={() =>
                go({ ...query, min_bedrooms: query.min_bedrooms === value ? null : value })
              }
            >
              {value}+
            </button>
          ))}
        </div>
      </Group>

      <RangeGroup
        title="Byggeår"
        group="construction_year"
        unit=""
        query={query}
        onChange={setRange}
        detailOnly={enriched === 0}
      />

      <CheckGroup
        title="Boligtype"
        group="property_type"
        options={PROPERTY_TYPES}
        query={query}
        counts={facets.property_type}
        onToggle={toggle}
        initialVisible={4}
      />

      <CheckGroup
        title="Eierform"
        group="ownership_type"
        options={OWNERSHIP_TYPES}
        query={query}
        counts={facets.ownership_type}
        onToggle={toggle}
      />

      <CheckGroup
        title="Privat/Megler"
        group="is_private_broker"
        options={SELLER_TYPES}
        query={query}
        counts={facets.is_private_broker}
        onToggle={toggle}
      />

      <CheckGroup
        title="Fasiliteter"
        group="facilities"
        options={FACILITIES}
        query={query}
        counts={facets.facilities}
        onToggle={toggle}
        initialVisible={6}
        detailOnly={enriched === 0}
      />

      <CheckGroup
        title="Digitale visninger"
        group="video_type"
        options={VIDEO_TYPES}
        query={query}
        counts={facets.video_type}
        onToggle={toggle}
        detailOnly={enriched === 0}
      />

      <ViewingFilter
        selected={query.viewing}
        counts={facets.viewing ?? {}}
        onToggle={(date) => toggle('viewing', date)}
      />

      <CheckGroup
        title="Etasje"
        group="floor_navigator"
        options={FLOORS}
        query={query}
        counts={facets.floor_navigator}
        onToggle={toggle}
        initialVisible={5}
        detailOnly={enriched === 0}
      />

      <CheckGroup
        title="Energikarakter"
        group="energy_label"
        options={ENERGY_LABELS}
        query={query}
        counts={facets.energy_label}
        onToggle={toggle}
        detailOnly={enriched === 0}
      />

      <RangeGroup
        title="Tomtestørrelse"
        group="plot_area"
        unit="m²"
        query={query}
        onChange={setRange}
        detailOnly={enriched === 0}
      />
      </div>
    </aside>
  );
}

/* -------------------------------------------------------------- building blocks - */

function Group({
  title,
  children,
  onReset,
  note,
}: {
  title: string;
  children: ReactNode;
  onReset?: () => void;
  note?: string;
}) {
  return (
    <section className="filter">
      <div className="filter__head">
        <h2 className="filter__title">{title}</h2>
        {onReset && (
          <button type="button" className="filter__reset" onClick={onReset}>
            Nullstill
          </button>
        )}
      </div>
      {children}
      {note && <p className="rail__note">{note}</p>}
    </section>
  );
}

function CheckLine({
  label,
  count,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  count: number;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <label className={`check${disabled && !checked ? ' check--disabled' : ''}`}>
      <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled && !checked} />
      <span className="check__box" aria-hidden="true">
        <Check size={14} strokeWidth={3} />
      </span>
      <span>
        {label} <span className="check__count">({formatNumber(count)})</span>
      </span>
    </label>
  );
}

function CheckGroup({
  title,
  group,
  options,
  query,
  counts,
  onToggle,
  initialVisible,
  detailOnly = false,
}: {
  title: string;
  group: MultiKey;
  options: readonly string[];
  query: SearchQuery;
  counts: Record<string, number> | undefined;
  onToggle: (group: MultiKey, value: string) => void;
  initialVisible?: number;
  detailOnly?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const selected = query[group];
  const limit = initialVisible ?? options.length;
  const visible = expanded ? options : options.slice(0, limit);

  return (
    <Group
      title={title}
      onReset={selected.length > 0 ? () => selected.forEach((v) => onToggle(group, v)) : undefined}
      note={
        detailOnly && DETAIL_ONLY_FILTERS.has(group)
          ? 'Ingen annonser har denne opplysningen ennå — den hentes fra annonsesiden.'
          : undefined
      }
    >
      {visible.map((option) => (
        <CheckLine
          key={option}
          label={option}
          count={counts?.[option] ?? 0}
          checked={selected.includes(option)}
          onChange={() => onToggle(group, option)}
          disabled={(counts?.[option] ?? 0) === 0}
        />
      ))}
      {options.length > limit && (
        <button type="button" className="filter__more" onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Vis færre' : 'Vis alle'}
        </button>
      )}
    </Group>
  );
}

function RangeGroup({
  title,
  group,
  unit,
  query,
  onChange,
  detailOnly = false,
}: {
  title: string;
  group: RangeKey;
  unit: string;
  query: SearchQuery;
  onChange: (group: RangeKey, side: 'from' | 'to', value: number | null) => void;
  detailOnly?: boolean;
}) {
  const value = query[group];
  return (
    <Group
      title={title}
      onReset={
        value.from !== null || value.to !== null
          ? () => {
              onChange(group, 'from', null);
              onChange(group, 'to', null);
            }
          : undefined
      }
      note={
        detailOnly
          ? 'Ingen annonser har denne opplysningen ennå — den hentes fra annonsesiden.'
          : undefined
      }
    >
      <div className="range">
        <RangeInput
          label={`Fra ${unit}`.trim()}
          value={value.from}
          onCommit={(next) => onChange(group, 'from', next)}
        />
        <RangeInput
          label={`Til ${unit}`.trim()}
          value={value.to}
          onCommit={(next) => onChange(group, 'to', next)}
        />
      </div>
    </Group>
  );
}

/** Applies on blur or Enter, so typing a figure does not fire a search per key. */
function RangeInput({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: number | null;
  onCommit: (value: number | null) => void;
}) {
  const [draft, setDraft] = useState(value === null ? '' : formatNumber(value));

  useEffect(() => {
    setDraft(value === null ? '' : formatNumber(value));
  }, [value]);

  const commit = () => {
    const digits = draft.replace(/\D/g, '');
    const next = digits === '' ? null : Number(digits);
    if (next !== value) onCommit(next);
  };

  return (
    <label>
      {label}
      <input
        inputMode="numeric"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commit();
          }
        }}
      />
    </label>
  );
}

function TextFilter({
  query,
  onSubmit,
}: {
  query: SearchQuery;
  onSubmit: (value: string) => void;
}) {
  const [draft, setDraft] = useState(query.q);
  useEffect(() => setDraft(query.q), [query.q]);

  return (
    <Group title="Søk i Eiendom">
      <form
        className="header__search"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(draft.trim());
        }}
      >
        <label className="sr-only" htmlFor="rail-search">
          Søk i Eiendom
        </label>
        <input
          id="rail-search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Adresse, sted, megler…"
        />
        <button type="submit" aria-label="Søk">
          <Search size={18} />
        </button>
      </form>
    </Group>
  );
}

function LocationFilter({
  locations,
  selected,
  counts,
  onToggle,
  onClear,
}: {
  locations: LocationNode[];
  selected: string[];
  counts: Record<string, number>;
  onToggle: (code: string) => void;
  onClear: () => void;
}) {
  const [expanded, setExpanded] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);

  const withAds = locations.filter((county) => (counts[county.code] ?? 0) > 0 || selected.includes(county.code));
  const list = showAll ? locations : withAds.slice(0, 8);

  return (
    <Group title="Område" onReset={selected.length > 0 ? onClear : undefined}>
      {list.map((county) => {
        const open = expanded.includes(county.code);
        const municipalities = (county.children ?? []).filter(
          (m) => (counts[m.code] ?? 0) > 0 || selected.includes(m.code),
        );

        return (
          <div key={county.code}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckLine
                label={county.name}
                count={counts[county.code] ?? 0}
                checked={selected.includes(county.code)}
                onChange={() => onToggle(county.code)}
                disabled={(counts[county.code] ?? 0) === 0}
              />
              {municipalities.length > 0 && (
                <button
                  type="button"
                  className="filter__reset"
                  aria-expanded={open}
                  aria-label={`${open ? 'Skjul' : 'Vis'} kommuner i ${county.name}`}
                  onClick={() =>
                    setExpanded((current) =>
                      current.includes(county.code)
                        ? current.filter((code) => code !== county.code)
                        : [...current, county.code],
                    )
                  }
                >
                  {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
              )}
            </div>

            {open && (
              <div style={{ paddingLeft: 30 }}>
                {municipalities.map((municipality) => (
                  <CheckLine
                    key={municipality.code}
                    label={municipality.name}
                    count={counts[municipality.code] ?? 0}
                    checked={selected.includes(municipality.code)}
                    onChange={() => onToggle(municipality.code)}
                    disabled={(counts[municipality.code] ?? 0) === 0}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {locations.length > list.length && (
        <button type="button" className="filter__more" onClick={() => setShowAll(true)}>
          Vis alle fylker
        </button>
      )}
    </Group>
  );
}

function ViewingFilter({
  selected,
  counts,
  onToggle,
}: {
  selected: string[];
  counts: Record<string, number>;
  onToggle: (date: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const dates = Object.keys(counts).sort();
  const visible = expanded ? dates : dates.slice(0, 5);

  return (
    <Group title="Visningsdato">
      {dates.length === 0 && <p className="rail__note">Ingen kommende visninger i utvalget.</p>}
      {visible.map((date) => (
        <CheckLine
          key={date}
          label={viewingFacetLabel(date)}
          count={counts[date]}
          checked={selected.includes(date)}
          onChange={() => onToggle(date)}
        />
      ))}
      {dates.length > 5 && (
        <button type="button" className="filter__more" onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Vis færre' : 'Vis alle'}
        </button>
      )}
    </Group>
  );
}
