import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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

const AdsDiagnostics: React.FC = () => {
  const [result, setResult] = useState<AdsResult | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAds = useCallback(async () => {
    setLoading(true);
    const url = `${window.location.origin}/ads.txt`;
    try {
      const res = await fetch('/ads.txt', { cache: 'no-store' });

      const text = await res.text();
      const contentType = res.headers.get('content-type');
      const hasPublisherId = text.includes(ADSENSE_PUB_ID);
      const endsWithNewline = text.endsWith('\n');

      setResult({
        url,
        status: res.status,
        ok: res.ok,
        contentType,
        length: text.length,
        textSample: text.slice(0, 300),
        hasPublisherId,
        endsWithNewline,
        fetchedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      setResult({
        url,
        status: null,
        ok: false,
        contentType: null,
        length: null,
        textSample: '',
        hasPublisherId: false,
        endsWithNewline: false,
        fetchedAt: new Date().toISOString(),
        error: error?.message || 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Basic SEO for this utility page
    document.title = 'Ads.txt Diagnostics | RezLit';
    const desc = 'Check ads.txt availability, headers, and content for RezLit.';
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
    canonical.setAttribute('href', `${window.location.origin}/ads-diagnostics`);

    fetchAds();
  }, [fetchAds]);

  return (
    <main className="container mx-auto max-w-3xl py-8">
      <section>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Ads.txt Diagnostics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Button onClick={fetchAds} disabled={loading} variant="default">
                {loading ? 'Checking…' : 'Re-check /ads.txt'}
              </Button>
              <a
                href="/ads.txt"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Open /ads.txt in new tab
              </a>
            </div>

            {result && (
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

                <div className="text-sm text-muted-foreground">
                  Notes:
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>File must be accessible at https://rezlit.com/ads.txt with HTTP 200 and Content-Type text/plain.</li>
                    <li>Ensure www and non-www both serve the same file or redirect to a single canonical host.</li>
                    <li>CDNs/WAFs should not block bots; allow Googlebot to fetch ads.txt.</li>
                    <li>After fixes, Google may take 24–48 hours to re-crawl.</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

export default AdsDiagnostics;
