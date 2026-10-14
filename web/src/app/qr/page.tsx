'use client';

import SiteHeader from '../site-header';
import { useState } from 'react';

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_PIXELS = 40_000_000;

type DetectedBarcode = { rawValue: string; format?: string };
type BarcodeDetectorLike = { detect(source: ImageBitmap): Promise<DetectedBarcode[]> };
type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => BarcodeDetectorLike;

function getDetector(): BarcodeDetectorConstructor | null {
  const browserWindow = window as Window & { BarcodeDetector?: BarcodeDetectorConstructor };
  return browserWindow.BarcodeDetector ?? null;
}

function classifyPayload(value: string) {
  try {
    const parsed = new URL(value);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return { kind: 'URL', note: 'Destination decoded only. SATARK has not visited or verified this URL.' };
    }
    return { kind: 'Non-web URI', note: 'Do not open this value unless you understand its scheme and trust its source.' };
  } catch {
    return { kind: 'Text payload', note: 'This QR code contains text rather than a directly recognized HTTP/HTTPS URL.' };
  }
}

export default function QrPage() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [payloads, setPayloads] = useState<string[]>([]);
  const [notice, setNotice] = useState('');

  async function decode() {
    setError('');
    setNotice('');
    setPayloads([]);
    if (!file) { setError('Choose a QR-code image first.'); return; }
    if (file.size > MAX_FILE_BYTES) { setError('Image exceeds the 10 MiB processing limit.'); return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setError('Use a JPEG, PNG or WebP image.'); return; }
    const Detector = getDetector();
    if (!Detector) {
      setError('This browser does not provide a native QR decoder. Use a supported browser or wait for the cross-browser decoder migration. Your file has not been uploaded.');
      return;
    }

    setBusy(true);
    let bitmap: ImageBitmap | null = null;
    try {
      bitmap = await createImageBitmap(file);
      if (bitmap.width * bitmap.height > MAX_PIXELS) throw new Error('Image dimensions exceed the 40-million-pixel processing limit.');
      const detector = new Detector({ formats: ['qr_code'] });
      const results = await detector.detect(bitmap);
      const values = [...new Set(results.map(item => item.rawValue.trim()).filter(Boolean))];
      if (!values.length) setNotice('No QR payload was decoded. This does not mean the image or any embedded destination is safe.');
      else { setPayloads(values); setNotice('Decoded locally in your browser. SATARK did not open the payload or send the image to a server.'); }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not decode this image.');
    } finally {
      bitmap?.close();
      setBusy(false);
    }
  }

  return (
    <main className="shell">
      <SiteHeader />
      <div className="container subpage" id="main-content" tabIndex={-1}>
        <div className="eyebrow">WORKSPACE / QR INVESTIGATION</div>
        <h1>Decode first. Verify before you visit.</h1>
        <p className="lead">Decode QR payloads locally where the browser supports the native BarcodeDetector API. The image is not uploaded and decoded destinations are never opened automatically.</p>
        <section className="panel" aria-labelledby="upload-heading">
          <div className="eyebrow">LOCAL PROCESSING</div>
          <h2 id="upload-heading">Choose a QR-code image</h2>
          <p>JPEG, PNG or WebP · maximum 10 MiB · maximum 40 million pixels. Native decoder support varies by browser.</p>
          <label className="field-label" htmlFor="qr-image">QR image</label>
          <input id="qr-image" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setError(''); setNotice(''); setPayloads([]); }} />
          {file && <p className="muted">{file.name} · {(file.size / 1024).toFixed(1)} KiB</p>}
          <div className="actions">
            <button className="btn btn-primary" type="button" disabled={busy || !file} onClick={decode}>{busy ? 'Decoding…' : 'Decode QR locally'}</button>
          </div>
          {error && <p role="alert" className="error-message">{error}</p>}
          {notice && <p role="status" className="notice">{notice}</p>}
        </section>
        {payloads.length > 0 && (
          <section className="panel" aria-labelledby="results-heading">
            <div className="eyebrow">OBSERVATIONS · NOT A VERDICT</div>
            <h2 id="results-heading">Decoded payloads</h2>
            {payloads.map((payload, index) => {
              const classification = classifyPayload(payload);
              return (
                <article className="workspace-card" key={index}>
                  <h3>Payload {index + 1} · {classification.kind}</h3>
                  <pre className="code-output">{payload}</pre>
                  <p>{classification.note}</p>
                  <button className="btn btn-secondary" type="button" onClick={() => { void navigator.clipboard?.writeText(payload).catch(() => undefined); }}>Copy payload</button>
                </article>
              );
            })}
            <p className="muted">A decoded URL is not a safety verdict. Verify the domain independently. This page does not fetch the URL, check live reputation, or guarantee detection across all browsers.</p>
          </section>
        )}
        <section className="panel">
          <h2>What this tool does not do</h2>
          <ul>
            <li>It does not visit, redirect to, or fetch a decoded destination.</li>
            <li>It does not query a threat-intelligence provider.</li>
            <li>It does not certify a QR code as safe or malicious.</li>
            <li>It does not yet provide cross-browser QR decoding when BarcodeDetector is unavailable.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
