'use client';

/**
 * FullscreenFooter - High-Fashion Fullscreen Reveal Footer (JSX)
 * Built with React, GSAP, @gsap/react (useGSAP), and ScrollTrigger.
 */

import React, { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { cn } from '../../lib/utils.js';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function FullscreenFooter({
  className = '',
  lang = 'ar',
  logo,
  tagline,
  protocolPhone = '+20 (2) 2735-WEDDO',
  protocolEmail = 'concierge@weddo.eg',
  children,
  collections,
  spatialTools,
  regionalAddresses,
  links,
  legalText,
}) {
  const footerRef = useRef(null);
  const isAr = lang === 'ar';

  const defaultCollections = collections || [
    { label: isAr ? 'القصور الملكية والسرايات التاريخية' : 'Royal Palaces & Historic Châteaux', href: '#/venues?type=palace' },
    { label: isAr ? 'تراسات ضفاف النيل والحدائق الملكية' : 'Grand Nile Waterfront Terraces', href: '#/venues?type=nile' },
    { label: isAr ? 'باحات القلعة والمحميات الأثرية' : 'Citadel Terraces & Heritage Forts', href: '#/venues?type=citadel' },
    { label: isAr ? 'قصور ساحل المنتزه المتوسطية' : 'Mediterranean Seafront Palaces', href: '#/venues?type=seafront' },
    { label: isAr ? 'أجنحة القمم الدبلوماسية والرئاسية' : 'Presidential & Diplomatic Summits', href: '#/venues?type=presidential' },
    { label: isAr ? 'جزر النيل الخاصة والملاذات النخبوية' : 'Private Nile Island Sanctuaries', href: '#/venues?type=islands' },
  ];

  const defaultSpatialTools = spatialTools || [
    { label: isAr ? 'الجولات الافتراضية ثلاثية الأبعاد 3D' : '3D Spatial Walkthroughs', href: '#/venues' },
    { label: isAr ? 'مخطط المقاعد والمساحات التفاعلي' : 'Interactive Floor Plan & Seating', href: '#/venue-workspace' },
    { label: isAr ? 'فحص التوفر الزمني والبروتوكولي' : 'Real-Time Availability Audit', href: '#/venues' },
    { label: isAr ? 'مقارنة القصور والمواصفات الفنية' : 'Curated Venue Comparison Engine', href: '#/venues' },
    { label: isAr ? 'بوابة الموردين ومنسقي الحفلات' : 'Vendor & Curator Portal', href: '#/vendor' },
  ];

  const defaultAddresses = regionalAddresses || [
    {
      city: isAr ? 'القاهرة — الزمالك التراثي' : 'Cairo — Zamalek Quarter',
      details: isAr ? 'حي الزمالك الدبلوماسي، كورنيش النيل التاريخي' : 'Zamalek Diplomatic Quarter, Historic Nile Corniche',
      contact: '+20 (2) 2735 9330',
    },
    {
      city: isAr ? 'الإسكندرية — ساحل المنتزه' : 'Alexandria — Royal Montaza',
      details: isAr ? 'طريق الكورنيش التاريخي، واجهة قصر المنتزه البحرية' : 'Historic Corniche Way, Montaza Royal Seafront',
      contact: '+20 (3) 5448 200',
    },
    {
      city: isAr ? 'الجيزة — هضبة الأهرامات' : 'Giza — Pyramids Plateau',
      details: isAr ? 'هضبة الأهرامات الملكية، طريق القمم والمواكب' : 'Royal Pyramids Plateau, Presidential Summit Way',
      contact: '+20 (2) 3377 1140',
    },
  ];

  useGSAP(
    () => {
      const footer = footerRef.current;
      if (!footer) return;

      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: footer,
          start: 'top 85%',
          end: 'bottom bottom',
          toggleActions: 'play none none reverse',
        },
      });

      tl.from('.site-footer-hero-band', {
        y: 40,
        opacity: 0,
        duration: 0.85,
        ease: 'power3.out',
      })
        .from(
          '.footer-dir-col',
          {
            y: 35,
            opacity: 0,
            stagger: 0.1,
            duration: 0.75,
            ease: 'power3.out',
          },
          '-=0.5'
        )
        .from(
          '.site-footer-trust-strip .trust-badge-item',
          {
            y: 20,
            opacity: 0,
            stagger: 0.08,
            duration: 0.6,
            ease: 'power2.out',
          },
          '-=0.4'
        )
        .from(
          '.site-footer-bottom-bar',
          {
            y: 15,
            opacity: 0,
            duration: 0.6,
            ease: 'power2.out',
          },
          '-=0.3'
        );
    },
    { scope: footerRef }
  );

  return (
    <footer
      ref={footerRef}
      className={cn(
        'site-footer site-footer-fullscreen min-h-screen min-h-[100dvh] flex flex-col justify-between relative overflow-hidden',
        className
      )}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="site-footer-ambient-glow" aria-hidden="true" />

      <div className="site-footer-inner flex flex-col justify-between flex-1 w-full max-w-[1280px] mx-auto py-12 gap-8 relative z-10">
        {children ? (
          children
        ) : (
          <>
            <div className="site-footer-hero-band flex flex-wrap justify-between items-center gap-6 pb-6 border-b border-white/10">
              <div className="site-footer-brand-lockup flex flex-col gap-2 max-w-xl">
                {logo || <span className="font-bold text-2xl tracking-tight text-white">WEDDO</span>}
                <p className="site-footer-descriptor text-sm opacity-75">
                  {tagline ||
                    (isAr
                      ? 'الأرشيف الملكي المعتمد لأرقى القصور التاريخية، المحميات النيلية، ومقار القمم الدبلوماسية في مصر.'
                      : 'The accredited sovereign archive of Egypt’s premier royal palaces, Nile heritage waterfronts, and presidential diplomatic estates.')}
                </p>
              </div>

              <div className="site-footer-concierge-pill inline-flex items-center gap-3 px-4 py-2.5 rounded border border-[#c5a880]/35 bg-black/30 backdrop-blur-md">
                <span className="protocol-live-indicator w-2 h-2 rounded-full bg-[#c5a880] shadow-[0_0_10px_#c5a880]" />
                <div className="protocol-pill-content flex flex-col">
                  <span className="protocol-pill-eyebrow text-[10px] font-semibold uppercase tracking-wider text-[#f7efc5]">
                    {isAr ? 'المراسم الملكية والخدمات الدبلوماسية' : 'ROYAL PROTOCOL & CONCIERGE'}
                  </span>
                  <span className="protocol-pill-value text-xs font-mono text-white">
                    {isAr ? `متاح ٢٤/٧ · ${protocolPhone}` : `ACTIVE 24/7 · ${protocolPhone}`}
                  </span>
                </div>
              </div>
            </div>

            <div className="site-footer-directory-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 py-4">
              <div className="footer-dir-col flex flex-col gap-3">
                <h4 className="footer-dir-title text-xs font-semibold uppercase tracking-wider text-[#c5a880]">
                  {isAr ? 'مجموعات القصور الملكية' : 'Heritage Collections'}
                </h4>
                <ul className="footer-dir-list flex flex-col gap-2 text-sm opacity-80">
                  {defaultCollections.map((col, idx) => (
                    <li key={idx}>
                      <a href={col.href} className="hover:text-[#c5a880] transition-colors">
                        {col.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="footer-dir-col flex flex-col gap-3">
                <h4 className="footer-dir-title text-xs font-semibold uppercase tracking-wider text-[#c5a880]">
                  {isAr ? 'تخطيط المساحات والمنصة' : 'Spatial Architecture'}
                </h4>
                <ul className="footer-dir-list flex flex-col gap-2 text-sm opacity-80">
                  {defaultSpatialTools.map((tool, idx) => (
                    <li key={idx}>
                      <a href={tool.href} className="hover:text-[#c5a880] transition-colors">
                        {tool.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="footer-dir-col flex flex-col gap-3">
                <h4 className="footer-dir-title text-xs font-semibold uppercase tracking-wider text-[#c5a880]">
                  {isAr ? 'المقرات الإقليمية المعتمدة' : 'Regional Embassies & Hubs'}
                </h4>
                <div className="footer-hub-items flex flex-col gap-3.5">
                  {defaultAddresses.map((addr, idx) => (
                    <div key={idx} className="footer-hub-item flex flex-col gap-0.5">
                      <span className="footer-hub-city text-xs font-semibold text-white">{addr.city}</span>
                      <p className="text-xs opacity-70 leading-relaxed">{addr.details}</p>
                      {addr.contact && (
                        <span className="footer-hub-contact text-[11px] font-mono text-[#c5a880]">{addr.contact}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="footer-dir-col footer-col-registry flex flex-col gap-2.5 p-4 rounded bg-black/20 border border-white/10">
                <h4 className="footer-dir-title text-xs font-semibold uppercase tracking-wider text-[#c5a880]">
                  {isAr ? 'سجل النخبة والمراسم' : 'The Sovereign Registry'}
                </h4>
                <p className="footer-registry-desc text-xs opacity-75 leading-relaxed">
                  {isAr
                    ? 'انضم إلى السجل لتلقي دعوات المعاينة المغلقة للقصور الملكية غير المعلنة وحجوزات القمم الدبلوماسية.'
                    : 'Join the private registry for confidential previews of unlisted royal acquisitions and reserved diplomatic gala dates.'}
                </p>
                <div className="footer-registry-box flex flex-col gap-2">
                  <div className="footer-registry-form flex gap-1.5">
                    <input
                      type="email"
                      className="footer-registry-input flex-1 min-w-0 bg-black/40 border border-white/20 rounded px-2.5 py-1.5 text-xs text-white"
                      placeholder={isAr ? 'البريد الدبلوماسي...' : 'Diplomatic email...'}
                      aria-label="Registry email"
                    />
                    <button
                      type="button"
                      className="footer-registry-btn px-3 py-1.5 text-[11px] font-semibold border border-[#c5a880] text-white hover:bg-[#c5a880] hover:text-[#19140b] rounded transition-colors"
                    >
                      {isAr ? 'طلب دعوة' : 'Request Access'}
                    </button>
                  </div>
                  <span className="footer-registry-note text-[10px] opacity-50">
                    {isAr ? '● سرية تامة وتشفير بنكي. لا مراسلات ترويجية.' : '● Bank-grade encryption & confidentiality.'}
                  </span>
                </div>
                <div className="footer-direct-contacts flex flex-col gap-1 pt-2 mt-1 border-t border-dashed border-white/15 text-xs">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="opacity-60">{isAr ? 'البريد البروتوكولي:' : 'Protocol:'}</span>
                    <a href={`mailto:${protocolEmail}`} className="text-[#f7efc5]">
                      {protocolEmail}
                    </a>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="opacity-60">{isAr ? 'ساعات العمل:' : 'Hours:'}</span>
                    <span className="text-[#f7efc5]">{isAr ? '٠٩:٠٠ — ٢٢:٠٠ بتوقيت القاهرة' : '09:00 — 22:00 Cairo'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="site-footer-trust-strip grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded bg-black/25 border border-white/10">
              <div className="trust-badge-item flex items-center gap-3">
                <svg className="trust-badge-icon text-[#c5a880] shrink-0" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M12 2l7 4v6c0 5-3.5 9.5-7 11-3.5-1.5-7-6-7-11V6l7-4z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
                <div className="trust-badge-text flex flex-col">
                  <strong className="text-xs text-white">{isAr ? 'توثيق تاريخي معتمد' : '100% Certified Heritage'}</strong>
                  <span className="text-[10px] opacity-60">{isAr ? 'قصور مسجلة رسمياً' : 'Official Heritage Registry'}</span>
                </div>
              </div>

              <div className="trust-badge-item flex items-center gap-3">
                <svg className="trust-badge-icon text-[#c5a880] shrink-0" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <div className="trust-badge-text flex flex-col">
                  <strong className="text-xs text-white">{isAr ? 'ميثاق السرية التامة' : 'Diplomatic Discretion'}</strong>
                  <span className="text-[10px] opacity-60">{isAr ? 'حماية تامة للبيانات' : 'Sovereign NDA protection'}</span>
                </div>
              </div>

              <div className="trust-badge-item flex items-center gap-3">
                <svg className="trust-badge-icon text-[#c5a880] shrink-0" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                <div className="trust-badge-text flex flex-col">
                  <strong className="text-xs text-white">{isAr ? 'تأمين المواكب والمراسم' : 'Motorcade & Security'}</strong>
                  <span className="text-[10px] opacity-60">{isAr ? 'تصاريح أمنية وتنسيق رسمي' : 'VVIP convoy coordination'}</span>
                </div>
              </div>

              <div className="trust-badge-item flex items-center gap-3">
                <svg className="trust-badge-icon text-[#c5a880] shrink-0" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <div className="trust-badge-text flex flex-col">
                  <strong className="text-xs text-white">{isAr ? 'ضيافة ملكية رفيعة' : 'Master Culinary Alliances'}</strong>
                  <span className="text-[10px] opacity-60">{isAr ? 'طهاة عالميون معتمدون' : 'Haute cuisine sommeliers'}</span>
                </div>
              </div>
            </div>

            <div className="site-footer-bottom-bar flex flex-wrap justify-between items-center gap-4 pt-4 border-t border-white/10">
              <div className="site-footer-legal-group flex flex-col gap-1">
                <p className="site-footer-copyright text-xs opacity-75">
                  {isAr
                    ? '© ٢٠٢٦ أرشيف ويدو للقصور والمناسبات الملكية (WEDDO). كافة الحقوق محفوظة.'
                    : '© 2026 WEDDO Sovereign Heritage & Royal Venues Archive. All Sovereign Rights Reserved.'}
                </p>
                {legalText && <small className="site-footer-legal-notice text-[10px] opacity-50">{legalText}</small>}
              </div>

              {links && links.length > 0 && (
                <nav className="site-footer-bottom-actions flex flex-wrap gap-5 items-center">
                  {links.map((link, idx) => (
                    <a key={idx} href={link.href} className="text-xs uppercase tracking-wider hover:text-[#c5a880] transition-colors">
                      {link.label}
                    </a>
                  ))}
                </nav>
              )}
            </div>
          </>
        )}
      </div>
    </footer>
  );
}

export default FullscreenFooter;
