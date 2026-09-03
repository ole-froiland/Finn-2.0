'use client';

import { useEffect, useRef, useState } from 'react';

import 'leaflet/dist/leaflet.css';

import { finnImage, formatNumber, formatPrice } from '@/lib/finn/format';
import type { Listing } from '@/lib/finn/types';

/**
 * Drawing every pin in a 26 000-ad result set would lock the browser up, and
 * shipping them all would bloat the page. The link is rebuilt from the ad id
 * rather than sent, for the same reason.
 */
const MAX_PINS = 1500;

export type MapPoint = Pick<
  Listing,
  'id' | 'lat' | 'lon' | 'title' | 'address' | 'price' | 'area' | 'image'
>;

const adUrl = (id: string) => `https://www.finn.no/realestate/homes/ad.html?finnkode=${id}`;

/**
 * Leaflet reaches for `window` as soon as it is imported, so it is pulled in
 * inside the effect rather than at module scope.
 */
export function MapView({ points, missing }: { points: MapPoint[]; missing: number }) {
  const container = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  // Defensive: a point without a real position would take the whole map down.
  const shown = points
    .filter((point) => typeof point.lat === 'number' && typeof point.lon === 'number')
    .slice(0, MAX_PINS);

  useEffect(() => {
    if (!container.current) return;
    let map: { remove: () => void; invalidateSize: () => void } | null = null;
    let observer: ResizeObserver | null = null;
    let cancelled = false;

    /**
     * Leaflet measures the container once, when the map is created, and never
     * revisits that on its own. React has not painted yet at that point, so
     * creating the map straight away leaves it sized to an empty box: it tiles
     * a fraction of the area and centres on the wrong point. Wait for a real
     * size first, then build.
     */
    const whenSized = () =>
      new Promise<void>((resolve) => {
        const check = () => {
          const element = container.current;
          if (!element) return;
          if (element.clientWidth > 0 && element.clientHeight > 0) resolve();
          else requestAnimationFrame(check);
        };
        check();
      });

    (async () => {
      try {
        const L = await import('leaflet');
        await whenSized();
        if (cancelled || !container.current) return;

        const instance = L.map(container.current, { scrollWheelZoom: true });
        map = instance;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap',
        }).addTo(instance);

        const markers = shown.map((point) =>
          L.circleMarker([point.lat!, point.lon!], {
            radius: 7,
            weight: 2,
            color: '#ffffff',
            fillColor: '#0063fb',
            fillOpacity: 1,
          }).bindPopup(popupHtml(point), { maxWidth: 260 }),
        );

        if (markers.length > 0) {
          const group = L.featureGroup(markers).addTo(instance);
          instance.fitBounds(group.getBounds(), { padding: [28, 28], maxZoom: 14 });
        } else {
          // Nothing to show: sit on Norway rather than the middle of the ocean.
          instance.setView([64.5, 12.5], 4);
        }

        // And re-measure whenever the box changes afterwards.
        observer = new ResizeObserver(() => instance.invalidateSize());
        observer.observe(container.current);
      } catch (error) {
        // Swallowing this made a real failure indistinguishable from an empty
        // map, so the reason goes to the console for anyone debugging.
        console.error('Kartet kunne ikke lastes:', error);
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      observer?.disconnect();
      map?.remove();
    };
  }, [shown]);

  if (failed) {
    return (
      <div className="empty">
        <h2>Kartet kunne ikke lastes</h2>
        <p>Prøv å laste siden på nytt, eller bytt tilbake til listevisning.</p>
      </div>
    );
  }

  return (
    <>
      <div className="map" ref={container} role="application" aria-label="Kart over treffene" />
      <p className="map__note">
        Viser {formatNumber(shown.length)} av {formatNumber(points.length)} treff med kjent posisjon
        {points.length > MAX_PINS && ' (kartet tegner maks 1 500 punkter om gangen)'}.
        {missing > 0 && (
          <>
            {' '}
            {formatNumber(missing)} treff mangler posisjon ennå — den hentes fra annonsesiden
            etter hvert.
          </>
        )}
      </p>
    </>
  );
}

const escape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function popupHtml(point: MapPoint): string {
  const image = finnImage(point.image, 320);
  const facts = [
    point.area !== null ? `${formatNumber(point.area)} m²` : null,
    point.price !== null ? formatPrice(point.price) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return `
    <a class="map-pop" href="${escape(adUrl(point.id))}" target="_blank" rel="noopener noreferrer">
      ${image ? `<img src="${escape(image)}" alt="" loading="lazy">` : ''}
      <strong>${escape(point.title)}</strong>
      <span>${escape(point.address)}</span>
      <span class="map-pop__facts">${escape(facts)}</span>
    </a>`;
}
