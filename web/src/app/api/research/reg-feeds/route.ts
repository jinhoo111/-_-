import { NextResponse } from "next/server";
import { cacheGet, cacheGetStale, cacheSet } from "@/lib/flow/cache";
import { REG_FEEDS_KR, REG_FEEDS_US, REG_FEED_TTL_MS, type RssItem } from "@/lib/news/constants";
import { fetchRssXml, parseRssItems } from "@/lib/news/server";

async function fetchFeed(feed: { key: string; url: string }): Promise<RssItem[]> {
  const key = `reg:feed:${feed.key}`;
  const cached = await cacheGet(key, REG_FEED_TTL_MS);
  if (cached) return cached as RssItem[];
  try {
    const xml = await fetchRssXml(feed.url);
    const items = parseRssItems(xml, feed.key);
    await cacheSet(key, items);
    return items;
  } catch {
    const stale = await cacheGetStale(key);
    return (stale as RssItem[]) ?? [];
  }
}

export async function GET() {
  const [usResults, krResults] = await Promise.all([
    Promise.allSettled(REG_FEEDS_US.map(fetchFeed)),
    Promise.allSettled(REG_FEEDS_KR.map(fetchFeed)),
  ]);
  const us = usResults.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  const kr = krResults.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  us.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  kr.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return NextResponse.json({ us, kr, builtAt: new Date().toISOString() });
}
