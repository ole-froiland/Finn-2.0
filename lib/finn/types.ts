/**
 * Shape of the data we harvest from FINN's real-estate search result cards,
 * plus the fields that only exist on the ad detail page (enrichment pass).
 */

export type Listing = {
  /** FINN's own ad id ("finnkode"). Stable, and the primary key everywhere. */
  id: string;
  title: string;
  /** Absolute link back to the original ad on finn.no. */
  url: string;
  image: string | null;
  agency: string | null;
  agencyLogo: string | null;
  /** The agency's brand colour, drawn as a 4px rule on top of the card. */
  accent: string | null;
  address: string;

  /** Primary living area in m². */
  area: number | null;
  /** New-build projects quote a span; the upper end lives here. */
  areaMax: number | null;
  /** Prisantydning — the low end of the span for a project. */
  price: number | null;
  priceMax: number | null;
  totalPrice: number | null;
  totalPriceMax: number | null;
  /** Fellesutgifter per month. */
  sharedCost: number | null;
  ownership: string | null;
  propertyType: string | null;
  bedrooms: number | null;

  /** Raw viewing pill text, e.g. "Visning - 15. sep. kl. 16:15". */
  viewing: string | null;
  /** ISO date (YYYY-MM-DD) when the viewing text could be resolved. */
  viewingDate: string | null;

  countyCode: string;
  county: string;
  municipalityCode: string;
  municipality: string;

  /** Lifecycle as FINN models it. */
  status: 'Til salgs' | 'Solgt' | 'Kommer for salg';
  isNewBuild: boolean;
  /** Ads posted by a private seller rather than an estate agency. */
  isPrivate: boolean;

  /** ISO timestamp of when our scraper first saw the ad. */
  firstSeen: string;

  // --- Detail-page enrichment. Null until the enrichment pass has run. ---
  energyLabel: string | null;
  facilities: string[] | null;
  floor: number | null;
  constructionYear: number | null;
  plotArea: number | null;
  hasVideo: boolean | null;
  has360: boolean | null;
};

export type LocationNode = {
  name: string;
  /** FINN's own location code, e.g. "0.20003" (fylke) or "1.20003.20041" (kommune). */
  code: string;
  count: number;
  children?: LocationNode[];
};

export type DatasetMeta = {
  /** ISO timestamp of the harvest that produced this dataset. */
  updatedAt: string;
  /** Number of ads in the file. */
  total: number;
  /** Total hits FINN itself reported at harvest time, for an honest coverage note. */
  finnReportedTotal: number | null;
  /** How many ads carry detail-page enrichment. */
  enriched: number;
  source: string;
};

export type Dataset = {
  listings: Listing[];
  meta: DatasetMeta;
};
