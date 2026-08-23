import { NextResponse } from 'next/server';
import { getFactbookData } from '../../../lib/factbook';

// The Factbook mirror is a static dataset revised roughly annually.
export const revalidate = 86400;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const isoCode = searchParams.get('country');

  if (!isoCode) {
    return NextResponse.json({ error: 'Country parameter is required' }, { status: 400 });
  }

  const { data, error, status } = await getFactbookData(isoCode);

  if (error) {
    return NextResponse.json({ error }, { status: status ?? 500 });
  }

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
  });
}
