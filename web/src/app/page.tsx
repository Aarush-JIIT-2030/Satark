'use client';

import SiteHeader from './site-header';
import ServiceReadiness from '../components/service-readiness';
import { Radar } from '../components/react-bits';
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, ScanSearch, ShieldCheck, Fingerprint,
  FileSearch, BookOpen, Activity, LockKeyhole, ScanLine, CircleDot, ChevronRight,
  Eye, ShieldAlert
} from 'lucide-react';

const workflows = [
  { n: '01', icon: ScanSearch, title: 'Investigate a message or URL', text: 'Run deterministic checks on suspicious text without opening the submitted destination.', href: '/investigate', action: 'Start investigation', tone: 'mint', tag: 'CORE WORKFLOW' },
  { n: '02', icon: Fingerprint, title: 'Inspect image signals', text: 'Review supported metadata markers and calculate a SHA-256 fingerprint locally.', href: '/image-review', action: 'Review an image', tone: 'violet', tag: 'LOCAL ANALYSIS' },
  { n: '03', icon: ScanLine, title: 'Decode a QR payload', text: 'Decode supported QR content locally. Destination inspection is not yet available across browsers.', href: '/qr', action: 'Open QR decoder', tone: 'blue', tag: 'LIMITED SUPPORT' },
  { n: '04', icon: FileSearch, title: 'Review reports', text: 'Open reports and inspect available findings. Persistent case history needs a configured workspace.', href: '/reports', action: 'View reports', tone: 'amber', tag: 'WORKSPACE' },
  { n: '05', icon: Activity, title: 'Manage investigation cases', text: 'Create, prioritize, and update tenant-scoped cases in your saved workspace.', href: '/cases', action: 'Open case workspace', tone: 'blue', tag: 'PERSISTENT WORKSPACE' },
];

const tools: Array<[string, string, string, string, string]> = [
  ['01', 'Text & message triage', 'Spot pressure tactics, impersonation cues and risky requests.', '/investigate', 'OPEN ANALYSIS'],
  ['02', 'URL review', 'Review a URL as text without automatically visiting it.', '/investigate', 'OPEN ANALYSIS'],
  ['03', 'Image metadata & integrity', 'Inspect supported metadata markers and calculate a SHA-256 fingerprint locally. Not an authenticity verdict.', '/image-review', 'OPEN IMAGE REVIEW'],
  ['04', 'QR-code investigation', 'Decode QR payloads locally. Cross-browser decoding and destination inspection are not yet available.', '/qr', 'OPEN QR DECODER'],
  ['05', 'PDF & document review', 'A sandboxed local document pipeline is not yet available here. See the migration status.', '/tools#pdf', 'VIEW STATUS'],
  ['06', 'Video & media signals', 'Video processing and provenance checks are not yet migrated. See the migration status.', '/tools#video', 'VIEW STATUS'],
  ['07', 'Persistent history & exports', 'Review reports; durable case history requires a configured workspace database.', '/reports', 'OPEN REPORTS'],
  ['08', 'Academy & scam challenge', 'Practice recognizing social-engineering patterns with educational examples.', '/learn', 'OPEN LEARNING'],
];

const principles = [
  { icon: Eye, title: 'Uncertainty stays visible', text: 'Signals are triage guidance, not a verdict.' },
  { icon: LockKeyhole, title: 'Privacy-aware by default', text: 'Submitted URLs are not automatically visited.' },
  { icon: ShieldCheck, title: 'Human review stays central', text: 'Verify through a trusted channel before acting.' },
];

export default function Home() {
  return (
    <main className="shell sentinel-home">
      <SiteHeader status />
      <div className="container sentinel-container" id="main-content" tabIndex={-1}>
        <ServiceReadiness />

        <section className="sentinel-hero" aria-labelledby="hero-title">
          <div className="sentinel-hero-copy">
            <div className="sentinel-kicker"><span className="kicker-orb" /> DIGITAL THREAT INVESTIGATION <span className="kicker-divider" /> SATARK SENTINEL</div>
            <h1 id="hero-title">Clarity in the<br /><span>noise.</span></h1>
            <p className="sentinel-lede">Suspicious message? Unexpected link? Start with the evidence—not the panic. SATARK helps you inspect digital threats with transparent signals and clear next steps.</p>
            <div className="sentinel-hero-actions">
              <a className="sentinel-primary" href="/investigate"><ScanSearch size={17} /> Start an investigation <ArrowUpRight size={16} /></a>
              <a className="sentinel-secondary" href="/firstlight">Explore FIRSTLIGHT <ArrowRight size={15} /></a>
            </div>
            <div className="sentinel-trust-line"><span><LockKeyhole size={13} /> Privacy-aware checks</span><i /> <span><Eye size={13} /> Human-reviewed</span><i /> <span><Activity size={13} /> Signals, not verdicts</span></div>
            <p className="field-note sentinel-privacy-note">Local deterministic checks by default. No third-party AI key is required. Optional self-hosted Ollama analysis is only used when configured.</p>
          </div>

          <div className="sentinel-visual" aria-label="Illustrative security investigation visualization">
            <div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" />
            <div className="visual-topline"><span><span className="visual-live-dot" /> INVESTIGATION CONSOLE</span><span className="visual-index">SYS / 001</span></div>
            <div className="visual-radar"><Radar color="#9df2d1" mode="sweep" speed={0.65} trail={0.24} scale={0.91} ringCount={4} spokeCount={10} targets={4} clutter={0.22} mouseInteraction={false} grain={0.008} /></div>
            <div className="visual-center-label"><span className="center-cross">✳</span><span>FOLLOW THE EVIDENCE</span></div>
            <div className="visual-foot">
              <div className="visual-foot-title"><span>TRIAGE FRAMEWORK</span><span className="illustrative-chip">ILLUSTRATIVE</span></div>
              <div className="visual-steps">
                <div><span className="step-num">01</span><span><b>Collect context</b><small>Preserve source and details</small></span><CircleDot size={14} /></div>
                <div><span className="step-num">02</span><span><b>Inspect signals</b><small>Separate facts from hypotheses</small></span><CircleDot size={14} /></div>
                <div><span className="step-num">03</span><span><b>Verify independently</b><small>Choose a safer next step</small></span><CircleDot size={14} /></div>
              </div>
            </div>
            <div className="visual-stamp"><ShieldCheck size={14} /> EVIDENCE FIRST</div>
          </div>
          <div className="hero-bottom-rule"><span>01 / INVESTIGATE WITH INTENTION</span><span>SCROLL TO EXPLORE <ArrowDownRight size={13} /></span></div>
        </section>

        <section className="sentinel-workflows" aria-labelledby="workflow-title">
          <div className="sentinel-section-heading">
            <div><div className="sentinel-overline">YOUR WORKSPACE</div><h2 id="workflow-title">One clear next step.</h2></div>
            <p>Focused tools for common digital safety questions. Every workflow tells you what it can—and cannot—establish.</p>
          </div>
          <div className="sentinel-workflow-grid">
            {workflows.map((item) => {
              const Icon = item.icon;
              return <article className={`sentinel-workflow-card tone-${item.tone}`} key={item.n}>
                <div className="workflow-card-head"><span className="workflow-number">{item.n}</span><span className="workflow-icon"><Icon size={19} strokeWidth={1.7} /></span><span className="workflow-card-arrow"><ArrowUpRight size={17} /></span></div>
                <div className="workflow-tag">{item.tag}</div><h3>{item.title}</h3><p>{item.text}</p>
                <a href={item.href} className="workflow-link">{item.action} <ArrowRight size={14} /></a>
              </article>;
            })}
          </div>
        </section>

        <section className="tools-section home-tools" aria-labelledby="capability-title">
          <div className="sentinel-section-heading">
            <div><div className="sentinel-overline">CAPABILITY MAP</div><h2 id="capability-title">Know what is live—and what is not.</h2></div>
            <p>Available workflows and incomplete migrations are labelled plainly. A missing signal never proves content is safe.</p>
          </div>
          <details className="tools-disclosure">
            <summary><span><strong>Browse all eight capabilities</strong><small>Available tools, current boundaries and migration status</small></span><span className="disclosure-icon" aria-hidden="true">＋</span></summary>
            <div className="tool-grid">
              {tools.map(([number, title, description, href, action]) => <article className="tool-card" key={number}>
                <div className="tool-card-top"><span>{number}</span><span className="tool-arrow" aria-hidden="true">↗</span></div>
                <h3>{title}</h3><p>{description}</p><a className="text-link" href={href}>{action} →</a>
              </article>)}
            </div>
            <div className="tool-boundary"><span aria-hidden="true">i</span><p><strong>Important boundary:</strong> SATARK does not visit submitted URLs or execute uploaded files. Image metadata cannot prove authenticity. Persistent cases and evidence require a configured database and verified tenant access.</p></div>
          </details>
        </section>

        <section className="sentinel-method" aria-labelledby="method-title">
          <div className="method-intro"><div className="sentinel-overline">THE SATARK STANDARD</div><h2 id="method-title">Confidence comes<br />from <span>verification.</span></h2><p>Security tools should help you think clearly—not make decisions for you.</p><a href="/tools" className="method-link">Explore all capabilities <ArrowUpRight size={15} /></a></div>
          <div className="method-principles">
            {principles.map(({ icon: Icon, title, text }, i) => <article key={title} className="principle-row"><span className="principle-icon"><Icon size={18} /></span><span className="principle-number">0{i + 1}</span><div><h3>{title}</h3><p>{text}</p></div><ChevronRight className="principle-chevron" size={17} /></article>)}
          </div>
        </section>

        <section className="sentinel-boundary" aria-label="Capability status">
          <div className="boundary-icon"><ShieldAlert size={20} /></div><div><strong>Built for careful triage—not false certainty.</strong><p>PDF and video pipelines are not yet migrated. QR destination inspection is limited, and persistent case history depends on a correctly configured workspace database. A missing signal never proves that content is safe.</p></div><a href="/tools">Capability status <ArrowUpRight size={15} /></a>
        </section>

        <section className="sentinel-learning-strip">
          <div className="learning-mark"><BookOpen size={20} /></div><div><div className="sentinel-overline">BUILD YOUR INSTINCTS</div><h2>Practice spotting the pressure.</h2><p>Learn the patterns behind urgency, impersonation, and social engineering in a safe environment.</p></div><a href="/learn" className="sentinel-secondary">Open the academy <ArrowRight size={15} /></a>
        </section>
      </div>
      <footer className="sentinel-footer"><a href="/" className="footer-brand"><span className="footer-brand-mark">S</span> SATARK <span className="footer-separator">/</span> SENTINEL</a><span>Evidence-led digital security</span><span>Local-first triage · Human review required</span></footer>
    </main>
  );
}
