import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AdsResult {
  url: string;
  status: number | null;
  ok: boolean;
  contentType: string | null;
  length: number | null;
  textSample: string;
  hasPublisherId: boolean;
  endsWithNewline: boolean;
  fetchedAt: string | null;
  error?: string;
}

const ADSENSE_PUB_ID = 'pub-3586730785374238';
const LIVE_ORIGIN = 'https://rezlit.com';
const WWW_ORIGIN = 'https://www.rezlit.com';

type Target = { key: string; label: string; url: string };

const AdsDiagnostics: React.FC = () => {
  const [results, setResults] = useState<Record<string, AdsResult | null>>({});
  const [loadingAll, setLoadingAll] = useState(false);
  const [customUrl, setCustomUrl] = useState('');

  const defaultTargets: Target[] = useMemo(() => [
    { key: 'live', label: 'Live (rezlit.com)', url: `${LIVE_ORIGIN}/ads.txt` },
    { key: 'www', label: 'Live www (www.rezlit.com)', url: `${WWW_ORIGIN}/ads.txt` },
    { key: 'this', label: 'This origin', url: `${window.location.origin}/ads.txt` },
  ], []);

  const fetchOne = useCallback(async (target: Target) => {
    const url = target.url;
    try {
      const res = await fetch(url, { cache: 'no-store' });
      const text = await res.text().catch(() => '');
      const contentType = res.headers.get('content-type');
      const hasPublisherId = text.includes(ADSENSE_PUB_ID);
      const endsWithNewline = text.endsWith('\n');

      const data: AdsResult = {
        url,
        status: res.status ?? null,
        ok: !!res.ok,
        contentType,
        length: (text && text.length) || 0,
        textSample: text.slice(0, 300),
        hasPublisherId,
        endsWithNewline,
        fetchedAt: new Date().toISOString(),
      };
      setResults((prev) => ({ ...prev, [target.key]: data }));
    } catch (error: any) {
      const data: AdsResult = {
        url,
        status: null,
        ok: false,
        contentType: null,
        length: null,
        textSample: '',
        hasPublisherId: false,
        endsWithNewline: false,
        fetchedAt: new Date().toISOString(),
        error: error?.message || 'Fetch failed (possibly CORS-blocked in browser, which is normal for cross-origin).',
      };
      setResults((prev) => ({ ...prev, [target.key]: data }));
    }
  }, []);

  const runDiagnostics = useCallback(async () => {
    setLoadingAll(true);
    try {
      await Promise.all(defaultTargets.map((t) => fetchOne(t)));
    } finally {
      setLoadingAll(false);
    }
  }, [defaultTargets, fetchOne]);

  const addCustomTarget = useCallback(async () => {
    const trimmed = customUrl.trim();
    if (!trimmed) return;
    const url = trimmed.match(/^https?:\/\//) ? trimmed : `https://${trimmed}`;
    const key = `custom:${url}`;
    await fetchOne({ key, label: `Custom (${url})`, url });
  }, [customUrl, fetchOne]);

  useEffect(() => {
    // SEO for this utility page
    document.title = 'Ads.txt Diagnostics | RezLit';
    const desc = 'Check RezLit ads.txt availability, headers, and content.';
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', desc);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', 'https://rezlit.com/ads-diagnostics');

    runDiagnostics();
  }, [runDiagnostics]);

  return (
    <main className="container mx-auto max-w-4xl py-8">
      <section>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Ads.txt Diagnostics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <Button onClick={runDiagnostics} disabled={loadingAll} variant="default">
                {loadingAll ? 'Checking…' : 'Re-check defaults'}
              </Button>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Input
                  placeholder="https://rezlit.com/ads.txt"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                />
                <Button type="button" onClick={addCustomTarget} variant="secondary">
                  Test URL
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {[...defaultTargets.map(t => t.key), ...Object.keys(results).filter(k => !defaultTargets.some(dt => dt.key === k))].map((key) => {
                const target = defaultTargets.find(t => t.key === key) || { key, label: key.startsWith('custom:') ? `Custom (${key.replace('custom:', '')})` : key, url: key.replace('custom:', '') };
                const result = results[key];
                return (
                  <Card key={key} className="border">
                    <CardHeader>
                      <CardTitle className="text-base font-semibold">
                        {target.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3">
                        <a
                          href={target.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                          aria-label={`Open ${target.url} in new tab`}
                        >
                          Open {target.url} in new tab
                        </a>
                        <Button size="sm" variant="outline" onClick={() => fetchOne(target)}>
                          Re-check
                        </Button>
                      </div>

                      {result ? (
                        <div className="space-y-3">
                          <div>
                            <strong>URL:</strong> {result.url}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div><strong>Status:</strong> {result.status ?? 'N/A'}{result.ok ? ' (OK)' : ''}</div>
                            <div><strong>Content-Type:</strong> {result.contentType ?? 'N/A'}</div>
                            <div><strong>Length:</strong> {result.length ?? 'N/A'}</div>
                            <div><strong>Fetched At:</strong> {result.fetchedAt}</div>
                          </div>

                          {result.error && (
                            <div className="text-sm text-muted-foreground">
                              Error: {result.error}
                            </div>
                          )}

                          <div className="space-y-1">
                            <div><strong>Contains publisher ID:</strong> {result.hasPublisherId ? 'Yes' : 'No'}</div>
                            <div><strong>Ends with newline:</strong> {result.endsWithNewline ? 'Yes' : 'No'}</div>
                          </div>

                          <div>
                            <strong>Preview (first 300 chars):</strong>
                            <pre className="mt-2 whitespace-pre-wrap break-words rounded-md p-3 bg-muted/40">
{result.textSample || '(empty)'}
                            </pre>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">No data yet. Click Re-check.</div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="text-sm text-muted-foreground">
              Notes:
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>The canonical production URL is https://rezlit.com/ads.txt (200 OK, Content-Type text/plain).</li>
                <li>www and non-www should serve the same file or redirect to a single canonical host.</li>
                <li>Browser CORS can block reading cross-origin files here; Googlebot is not subject to browser CORS.</li>
                <li>After fixes, Google may take 24–48 hours to re-crawl.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

export default AdsDiagnostics;
