import { redirect } from 'next/navigation';

import { parseSearchQuery, searchHref, type RawParams } from '@/lib/finn/params';

/**
 * The search moved to the root. This keeps older links — including any saved
 * searches a visitor already has — pointing somewhere useful.
 */
export default async function LegacySearchPage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  redirect(searchHref(parseSearchQuery(await searchParams)));
}
