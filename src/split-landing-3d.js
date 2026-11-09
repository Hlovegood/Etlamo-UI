// WEDDO Sovereign Dual-World Landing Experience
// High-Fashion Interactive Mechanism powered by React Bits <DriftWall />, WebGL & GSAP
// Dynamic choice switch, symbolic totem emblem, and cinematic WebGL portal transition

import { sound } from './sound.js';
import { createDriftWall } from './DriftWall.js';
import { renderOrganicButton } from './OrganicButton.js';

let gsapPromise = null;
function loadGSAP() {
  if (window.gsap) return Promise.resolve(window.gsap);
  if (!gsapPromise) {
    gsapPromise = new Promise(resolve => {
      const script = document.createElement('script');
      script.src = '/public/vendor/gsap.min.js';
      script.onload = () => resolve(window.gsap);
      script.onerror = () => resolve(null);
      document.head.appendChild(script);
    });
  }
  return gsapPromise;
}

// WebGL Portal Shader Pipeline for Selection Transition
function createPortalShader(canvas) {
  let gl = null;
  try {
    gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
  } catch (e) {
    console.warn('WebGL context creation failed:', e);
    return null;
  }
  if (!gl) return null;

  const vsSource = `
    attribute vec2 a_pos;
    void main() {
      gl_Position = vec4(a_pos, 0.0, 1.0);
    }
  `;

  const fsSource = `
    precision mediump float;
    uniform vec2 u_resolution;
    uniform float u_progress;
    uniform float u_time;
    uniform vec3 u_color;
    uniform vec2 u_center;

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution.xy;
      vec2 p = uv - u_center;
      p.x *= u_resolution.x / u_resolution.y;
      float dist = length(p);

      // Radial portal ripple & chromatic warp
      float wave = sin(dist * 28.0 - u_progress * 16.0) * 0.5 + 0.5;
      float ring = smoothstep(0.0, 0.35, u_progress) * smoothstep(u_progress * 1.6 + 0.2, u_progress * 1.6, dist);

      // Chromatic dispersion RGB split
      float r = smoothstep(u_progress * 1.5, 0.0, dist + 0.02 * sin(u_time * 6.0));
      float g = smoothstep(u_progress * 1.5, 0.0, dist);
      float b = smoothstep(u_progress * 1.5, 0.0, dist - 0.02 * cos(u_time * 6.0));

      vec3 col = u_color * (r * 0.9 + wave * ring * 0.45);
      col += vec3(1.0, 0.97, 0.92) * pow(ring, 3.0) * 1.6;

      float alpha = smoothstep(0.0, 0.15, u_progress);
      alpha = clamp(alpha * (dist < u_progress * 2.0 ? 1.0 : ring), 0.0, 1.0);

      // Solid color wipe towards completion
      col = mix(col, u_color * 0.12, smoothstep(0.68, 1.0, u_progress));
      alpha = mix(alpha, 1.0, smoothstep(0.72, 1.0, u_progress));

      gl_FragColor = vec4(col, alpha);
    }
  `;

  function createShader(type, source) {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('Shader compile failed:', gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  const vs = createShader(gl.VERTEX_SHADER, vsSource);
  const fs = createShader(gl.FRAGMENT_SHADER, fsSource);
  if (!vs || !fs) return null;

  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn('Program link failed:', gl.getProgramInfoLog(program));
    return null;
  }

  const posBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
    -1,  1,
     1, -1,
     1,  1,
  ]), gl.STATIC_DRAW);

  const aPos = gl.getAttribLocation(program, 'a_pos');
  const uRes = gl.getUniformLocation(program, 'u_resolution');
  const uProg = gl.getUniformLocation(program, 'u_progress');
  const uTime = gl.getUniformLocation(program, 'u_time');
  const uCol = gl.getUniformLocation(program, 'u_color');
  const uCenter = gl.getUniformLocation(program, 'u_center');

  return {
    resize(w, h) {
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
    },
    render(progress, time, rgb, center = [0.35, 0.5]) {
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uProg, progress);
      gl.uniform1f(uTime, time);
      gl.uniform3f(uCol, rgb[0], rgb[1], rgb[2]);
      gl.uniform2f(uCenter, center[0], center[1]);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    },
    destroy() {
      gl.deleteBuffer(posBuffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    }
  };
}

// Editorial Copy and Theme Configurations for Choices
export function getChoiceData(isAr) {
  return {
    wedding: {
      badge: isAr ? 'قصور تاريخية وصالونات ملكية' : 'ROYAL HERITAGE & PALATIAL ESTATES',
      title: isAr ? 'أفراح وقصور الملوك' : 'Royal Celebrations',
      desc: isAr
        ? 'استكشف القصور التاريخية المهيبة، وحدائق الزيتون المفتوحة، وصالونات ضفاف النيل الساحرة المُعدّة لأفراح ملكية استثنائية.'
        : 'Explore majestic heritage palaces, open-air olive groves, and historic Nile waterfront salons curated for unforgettable royal weddings.',
      pills: isAr
        ? ['٤٢+ قصراً ملكياً', 'مراسي نيلية خاصة', 'ضيافة ملكية فاخرة']
        : ['42+ Historic Palaces', 'Private Nile Docks', 'Bespoke Royal Banquets'],
      cta: isAr ? 'استكشف القصور الملكية' : 'Explore Royal Palaces',
      accentColor: '#f59e0b',
      bgColor: '#0c0907',
      overlayColor: '#120904',
      ambientGradient: 'radial-gradient(ellipse at 35% 50%, rgba(217, 119, 6, 0.24) 0%, rgba(180, 83, 9, 0.08) 55%, transparent 80%)',
      shaderRgb: [0.96, 0.62, 0.07]
    },
    conference: {
      badge: isAr ? 'مراكز مؤتمرات وقاعات قمم' : 'PLENARY CENTERS & DIPLOMATIC SUITES',
      title: isAr ? 'المؤتمرات والقمم الدولية' : 'Executive Summits',
      desc: isAr
        ? 'اكتشف قاعات المؤتمرات الكبرى، وأجنحة القمم الدبلوماسية، والمدرجات الصوتية المزودة بتقنيات العرض التفاعلية 8K للقمم الدولية.'
        : 'Discover plenary convention halls, diplomatic suites, and 8K acoustic auditoriums engineered for high-level summits and global assemblies.',
      pills: isAr
        ? ['٣٥+ مركزاً دولياً', 'شاشات عرض 8K', 'بروتوكول دبلوماسي']
        : ['35+ Global Plenaries', '8K Immersive AV', 'Diplomatic Security Protocol'],
      cta: isAr ? 'ادخل مراكز المؤتمرات' : 'Enter Executive Summits',
      accentColor: '#38bdf8',
      bgColor: '#050a14',
      overlayColor: '#040a16',
      ambientGradient: 'radial-gradient(ellipse at 35% 50%, rgba(14, 165, 233, 0.24) 0%, rgba(3, 105, 161, 0.08) 55%, transparent 80%)',
      shaderRgb: [0.02, 0.52, 0.98]
    }
  };
}

export function mountSplitLanding(host, { lang = 'en', onSelect = () => {}, onToggleLanguage = () => {} } = {}) {
  const isAr = lang === 'ar';
  let cancelled = false;
  const disposers = [];

  // Venue picture catalogs for each choice
  const weddingItems = [
    { image: '/public/images/celebration-portal.jpg', title: isAr ? 'قاعة قصر عابدين التاريخية' : 'Abdeen Royal Palace Grand Salon' },
    { image: '/public/images/hero-estate.jpg', title: isAr ? 'قصر البارون إمبان الملكي' : 'Baron Palace Heritage Estate' },
    { image: '/public/images/nile-salon.jpg', title: isAr ? 'صالون النيل الملوكي' : 'Nile Waterfront Royal Salon' },
    { image: '/public/images/olive-garden.jpg', title: isAr ? 'حدائق قصر المانسترلي' : 'Manasterly Garden Estate' },
    { image: '/public/images/azure-court.jpg', title: isAr ? 'قصر الأمير محمد علي' : 'Prince Mohamed Ali Palace Court' },
    { image: '/public/images/pyramids-terrace.jpg', title: isAr ? 'شرفة الأهرامات البانورامية' : 'Pyramids Royal Terrace' },
    { image: '/public/images/celebration-portal.jpg', title: isAr ? 'بهو الثريات الكريستالية' : 'Imperial Crystal Hall' },
    { image: '/public/images/hero-estate.jpg', title: isAr ? 'أجنحة السلاملك الملكية' : 'Salamlek Historic Suites' },
    { image: '/public/images/nile-salon.jpg', title: isAr ? 'صالون لوتس النيل التاريخي' : 'Lotus Nile Ballroom' },
    { image: '/public/images/olive-garden.jpg', title: isAr ? 'بساتين القصور الملكية' : 'Royal Heritage Orchards' },
    { image: '/public/images/azure-court.jpg', title: isAr ? 'بهو الأندلس الملكي' : 'Andalusian Royal Pavilion' },
    { image: '/public/images/pyramids-terrace.jpg', title: isAr ? 'تراس الغروب التاريخي' : 'Sunset Heritage Terrace' },
    { image: '/public/images/celebration-portal.jpg', title: isAr ? 'قاعة المرايا الملكية' : 'Royal Mirror Gallery' },
    { image: '/public/images/hero-estate.jpg', title: isAr ? 'قصر الجزيرة التراثي' : 'Gezira Palace Courtyard' },
    { image: '/public/images/nile-salon.jpg', title: isAr ? 'صالون الفيروز النيلي' : 'Turquoise Nile Grand Salon' }
  ];

  const conferenceItems = [
    { image: '/public/images/conference-portal.jpg', title: isAr ? 'قاعة القمم الرئاسية الكبرى' : 'Presidential Plenary Hall' },
    { image: '/public/images/summit-ballroom.jpg', title: isAr ? 'مركز القاهرة الدولي للمؤتمرات' : 'International Summit Center' },
    { image: '/public/images/cairo-meeting-house.jpg', title: isAr ? 'مدرج المؤتمرات التفاعلي 8K' : '8K Interactive Amphitheater' },
    { image: '/public/images/azure-court.jpg', title: isAr ? 'أجنحة القمم الدبلوماسية' : 'Diplomatic Summit Forum' },
    { image: '/public/images/hero-estate.jpg', title: isAr ? 'قاعة الوفود والمنظمات الدولية' : 'Global Delegation Hall' },
    { image: '/public/images/pyramids-terrace.jpg', title: isAr ? 'شرفة القمة التنفيذية' : 'Executive Summit Terrace' },
    { image: '/public/images/conference-portal.jpg', title: isAr ? 'قاعة المؤتمرات الوزارية' : 'Ministerial Assembly Suite' },
    { image: '/public/images/summit-ballroom.jpg', title: isAr ? 'المركز الصحفي والإعلامي الدولي' : 'International Press Forum' },
    { image: '/public/images/cairo-meeting-house.jpg', title: isAr ? 'قاعة الابتكار والقمم الاقتصادية' : 'Economic Summit Pavilion' },
    { image: '/public/images/azure-court.jpg', title: isAr ? 'مدرج الترجمة الفورية المتعددة' : 'Multilingual Congress Hall' },
    { image: '/public/images/hero-estate.jpg', title: isAr ? 'أجنحة كبار الشخصيات السيادية' : 'Sovereign VIP Plenary Suite' },
    { image: '/public/images/pyramids-terrace.jpg', title: isAr ? 'منتدى القادة والمبتكرين' : 'Global Leaders Forum' },
    { image: '/public/images/conference-portal.jpg', title: isAr ? 'مركز المعارض والقمم التكنولوجية' : 'Tech Summit Convention Center' },
    { image: '/public/images/summit-ballroom.jpg', title: isAr ? 'قاعة الحوار الدبلوماسي' : 'Diplomatic Dialogue Chamber' },
    { image: '/public/images/cairo-meeting-house.jpg', title: isAr ? 'قاعة القمة الرقمية الذكية' : 'Digital Governance Arena' }
  ];

  // Editorial Copy for the Symbolic Item on the Left
  const dataMap = getChoiceData(isAr);

  loadGSAP().then(gsap => {
    if (cancelled) return;

    // DOM Elements
    const landingSection = host.matches?.('.split-landing-page') ? host : (host.querySelector('.split-landing-page') || host);
    const wallMount = host.querySelector('.driftwall-mount');
    const ambientBg = host.querySelector('.drift-ambient-bg');
    const switchEl = host.querySelector('.drift-switch');
    const switchBtns = host.querySelectorAll('.drift-switch-btn');
    const switchPill = host.querySelector('.drift-switch-pill');
    const totemEl = host.querySelector('.drift-totem');
    const choiceContainers = host.querySelectorAll('.drift-choice-container');
    const actionButtons = host.querySelectorAll('.drift-choice-container .organic-btn, .drift-cta-btn, [data-action="confirm-selection"]');
    const portalCanvas = host.querySelector('.drift-portal-canvas');
    const portalVeil = host.querySelector('.drift-portal-veil');
    const gatePortal = host.querySelector('.drift-gate-portal');
    const gateWingLeft = host.querySelector('.drift-gate-wing-left');
    const gateWingRight = host.querySelector('.drift-gate-wing-right');
    const gateLight = host.querySelector('.drift-gate-light-core');
    const gateFlare = host.querySelector('.drift-gate-flare');
    const langBtn = host.querySelector('[data-action="split-toggle-lang"]');

    // State
    const state = {
      currentChoice: 'wedding', // 'wedding' | 'conference'
      isTransitioning: false
    };

    // Language Toggle
    if (langBtn) {
      const handleLang = e => {
        e.stopPropagation();
        sound.tap();
        onToggleLanguage();
      };
      langBtn.addEventListener('click', handleLang);
      disposers.push(() => langBtn.removeEventListener('click', handleLang));
    }

    // Initialize WebGL Portal Shader
    let portalShader = null;
    if (portalCanvas) {
      portalShader = createPortalShader(portalCanvas);
      if (portalShader) {
        portalShader.resize(window.innerWidth, window.innerHeight);
        const onResize = () => {
          portalShader?.resize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', onResize);
        disposers.push(() => {
          window.removeEventListener('resize', onResize);
          portalShader?.destroy();
        });
      }
    }

    // Mount DriftWall from React Bits
    let driftWall = null;
    if (wallMount) {
      const isMobile = window.innerWidth < 768;
      driftWall = createDriftWall(wallMount, {
        items: weddingItems,
        columns: 'auto',
        tileWidth: isMobile ? 160 : 228,
        tileHeight: isMobile ? 108 : 150,
        gap: 16,
        radius: 0,
        tilt: 14,
        turn: isAr ? 12 : -12, // symmetrical 3D perspective in RTL
        roll: 0,
        perspective: 1200,
        depth: 90,
        speed: 38,
        direction: 'up',
        variance: 0.45,
        parallax: 0.6,
        pauseOnHover: false,
        lift: 52,
        fade: 0,
        dim: 0.68,
        grayscale: false,
        overlayColor: '#000000',
        className: 'drift-wall--full',
        onTileClick: () => {
          triggerSelection(state.currentChoice);
        }
      });
      disposers.push(() => driftWall?.destroy());
    }

    // Update Totem Card Content & Choice Containers
    function updateTotem(choice, animate = true) {
      const data = dataMap[choice];
      if (!data) return;

      if (totemEl) totemEl.setAttribute('data-choice', choice);

      const currentContainer = host.querySelector('.drift-choice-container:not([hidden])');
      const targetContainer = host.querySelector(`.drift-choice-container[data-choice="${choice}"]`);

      if (targetContainer && currentContainer && currentContainer !== targetContainer) {
        if (animate && gsap) {
          gsap.to(currentContainer, {
            opacity: 0,
            y: -6,
            duration: 0.18,
            ease: 'power2.in',
            onComplete: () => {
              currentContainer.hidden = true;
              currentContainer.style.opacity = '1';
              currentContainer.style.transform = '';
              targetContainer.hidden = false;
              const children = targetContainer.children;
              gsap.fromTo(children, 
                { opacity: 0, y: 8 }, 
                { opacity: 1, y: 0, duration: 0.35, stagger: 0.04, ease: 'power2.out' }
              );
            }
          });
        } else {
          currentContainer.hidden = true;
          targetContainer.hidden = false;
        }
      } else if (targetContainer) {
        targetContainer.hidden = false;
        choiceContainers.forEach(c => {
          if (c !== targetContainer) c.hidden = true;
        });
      }
    }

    // Update Switch Pill Position dynamically to fit button geometry in LTR and RTL
    function updateSwitchPill(choice) {
      if (!switchPill || !switchEl) return;
      const targetBtn = switchEl.querySelector(`.drift-switch-btn[data-choice="${choice}"]`);
      if (!targetBtn) return;

      const switchRect = switchEl.getBoundingClientRect();
      const btnRect = targetBtn.getBoundingClientRect();
      const x = btnRect.left - switchRect.left;

      switchPill.style.width = `${btnRect.width}px`;
      switchPill.style.transform = `translateX(${x}px)`;

      switchPill.style.borderColor = 'rgba(255, 255, 255, 0.45)';
      switchPill.style.boxShadow = 'none';
    }

    // Switch Choice Handler
    function setChoice(choice, force = false) {
      if (state.isTransitioning) return;
      if (state.currentChoice === choice && !force) {
        updateSwitchPill(choice);
        return;
      }
      state.currentChoice = choice;
      sound.tap();

      const data = dataMap[choice];
      const isWedding = choice === 'wedding';

      // 1. Update Switch Buttons & Pill Position
      switchBtns.forEach(btn => {
        const isCurrent = btn.dataset.choice === choice;
        btn.setAttribute('aria-pressed', String(isCurrent));
        btn.setAttribute('aria-selected', String(isCurrent));
        btn.classList.toggle('is-active', isCurrent);
      });

      updateSwitchPill(choice);

      // 2. Fluid Background Color Shift with GSAP
      if (gsap && landingSection) {
        gsap.to(landingSection, {
          backgroundColor: data.bgColor,
          duration: 0.65,
          ease: 'power2.out'
        });
      } else if (landingSection) {
        landingSection.style.backgroundColor = data.bgColor;
      }

      // 3. Update Ambient Glow
      if (ambientBg) {
        if (gsap) {
          gsap.to(ambientBg, {
            opacity: 0.2,
            duration: 0.25,
            ease: 'power1.out',
            onComplete: () => {
              ambientBg.style.background = data.ambientGradient;
              gsap.to(ambientBg, { opacity: 1, duration: 0.45, ease: 'power2.out' });
            }
          });
        } else {
          ambientBg.style.background = data.ambientGradient;
        }
      }

      // 4. Update DriftWall Items & Tint
      if (driftWall) {
        const newItems = isWedding ? weddingItems : conferenceItems;
        driftWall.updateItems(newItems, data.overlayColor);
      }

      // 5. Update Symbolic Totem on the Left
      updateTotem(choice, true);
    }

    // Switch click listeners
    switchBtns.forEach(btn => {
      const handleClick = (e) => {
        e.preventDefault();
        setChoice(btn.dataset.choice);
      };
      btn.addEventListener('click', handleClick);
      disposers.push(() => btn.removeEventListener('click', handleClick));
    });

    // Initialize Totem & Switch Pill on initial mount
    updateTotem('wedding', false);
    if (switchPill) switchPill.style.transition = 'none';
    updateSwitchPill('wedding');
    requestAnimationFrame(() => {
      updateSwitchPill('wedding');
      requestAnimationFrame(() => {
        if (switchPill) switchPill.style.transition = '';
      });
    });

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        updateSwitchPill(state.currentChoice);
      });
    }

    const onSwitchResize = () => {
      updateSwitchPill(state.currentChoice);
    };
    window.addEventListener('resize', onSwitchResize);
    disposers.push(() => window.removeEventListener('resize', onSwitchResize));

    // --- Grand Sovereign Dimensional Gateway Transition ---
    function triggerSelection(choice) {
      if (state.isTransitioning) return;
      state.isTransitioning = true;
      sound.pop();

      const data = dataMap[choice];
      const isWedding = choice === 'wedding';

      if (gsap) {
        const tl = gsap.timeline({
          onComplete: () => {
            onSelect(choice);
          }
        });

        // 1. Totem & Header UI Exit: smooth slide-out and blur
        if (totemEl) {
          tl.to(totemEl, {
            x: isAr ? 70 : -70,
            y: 8,
            opacity: 0,
            scale: 0.94,
            filter: 'blur(8px)',
            duration: 0.52,
            ease: 'power3.in'
          }, 0);
        }

        if (switchEl) {
          tl.to(switchEl, {
            y: -36,
            opacity: 0,
            filter: 'blur(6px)',
            duration: 0.45,
            ease: 'power2.in'
          }, 0);
        }

        // 2. DriftWall Warp Dive: dive forward into 3D hyperspace
        if (driftWall?.setWarp) {
          const warpObj = { progress: 0 };
          tl.to(warpObj, {
            progress: 1,
            duration: 0.95,
            ease: 'power2.in',
            onUpdate: () => {
              driftWall.setWarp(warpObj.progress);
            }
          }, 0);
        }

        // 3. Grand Sovereign Portal Gate Sequence
        if (gatePortal && gateWingLeft && gateWingRight) {
          gatePortal.setAttribute('data-choice', choice);
          gatePortal.style.pointerEvents = 'auto';

          // Reveal gate container
          tl.to(gatePortal, {
            opacity: 1,
            duration: 0.16,
            ease: 'power1.out'
          }, 0.04);

          // Central light beam pulses bright
          if (gateLight) {
            tl.fromTo(gateLight, 
              { scaleY: 0, opacity: 0 },
              { scaleY: 1, opacity: 1, duration: 0.35, ease: 'power2.out' },
              0.08
            );
          }

          // Left wing swings open into depth
          tl.fromTo(gateWingLeft,
            { rotateY: 0, xPercent: 0 },
            { rotateY: isAr ? 86 : -86, xPercent: isAr ? 25 : -25, duration: 0.82, ease: 'power3.inOut' },
            0.15
          );

          // Right wing swings open into depth
          tl.fromTo(gateWingRight,
            { rotateY: 0, xPercent: 0 },
            { rotateY: isAr ? -86 : 86, xPercent: isAr ? -25 : 25, duration: 0.82, ease: 'power3.inOut' },
            0.15
          );

          // Central anamorphic light flare explodes outward as doors part
          if (gateFlare) {
            tl.fromTo(gateFlare,
              { scale: 0.15, opacity: 0 },
              { scale: 3.5, opacity: 1, duration: 0.65, ease: 'power2.in' },
              0.28
            );
          }
        }

        // 4. WebGL Chromatic light wave shader enhancement
        if (portalCanvas && portalShader) {
          portalCanvas.style.opacity = '1';
          const shaderState = { progress: 0.0 };
          tl.to(shaderState, {
            progress: 1.0,
            duration: 0.95,
            ease: 'power2.inOut',
            onUpdate: () => {
              portalShader.render(
                shaderState.progress,
                performance.now() * 0.001,
                data.shaderRgb,
                [0.5, 0.5] // radiating from center doorway
              );
            }
          }, 0.1);
        }

        // 5. Veil wash at culmination
        if (portalVeil) {
          portalVeil.style.background = isWedding 
            ? 'radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.55) 0%, #0d0906 75%)'
            : 'radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.55) 0%, #050a14 75%)';
          tl.to(portalVeil, {
            opacity: 1,
            duration: 0.35,
            ease: 'power2.in'
          }, 0.68);
        }
      } else {
        if (portalVeil) {
          portalVeil.style.background = data.bgColor;
          portalVeil.style.opacity = '1';
        }
        setTimeout(() => onSelect(choice), 500);
      }
    }

    // CTA Button Click Triggers (Cult UI Organic Button inside choices containers)
    actionButtons.forEach(btn => {
      const handleCta = (e) => {
        e.preventDefault();
        const choice = btn.dataset.choice || btn.closest('[data-choice]')?.dataset?.choice || state.currentChoice;
        triggerSelection(choice);
      };
      btn.addEventListener('click', handleCta);
      disposers.push(() => btn.removeEventListener('click', handleCta));
    });

    // Keyboard Navigation (Enter/Space to enter, Arrow keys to toggle choice)
    const onKeyDown = e => {
      if (state.isTransitioning) return;
      if (e.key === 'ArrowLeft') {
        setChoice(isAr ? 'conference' : 'wedding');
      } else if (e.key === 'ArrowRight') {
        setChoice(isAr ? 'wedding' : 'conference');
      } else if (e.key === 'ArrowUp') {
        setChoice('wedding');
      } else if (e.key === 'ArrowDown') {
        setChoice('conference');
      } else if (e.key === 'Enter' || e.key === ' ') {
        triggerSelection(state.currentChoice);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    disposers.push(() => window.removeEventListener('keydown', onKeyDown));
  });

  return () => {
    cancelled = true;
    disposers.forEach(fn => fn());
  };
}

export function splitLandingSection({ lang = 'en' } = {}) {
  const isAr = lang === 'ar';
  const dataMap = getChoiceData(isAr);
  return `
    <section class="split-landing-page" aria-label="${isAr ? 'بوابة اتلموا (ETLAMO): اختر بين الأفراح والقصور الملكية أو المؤتمرات والقمم الدولية' : 'ETLAMO Sovereign Portal: Choose between Royal Weddings or Executive Summits'}">
      
      <!-- Full-screen React Bits <DriftWall /> Mount -->
      <div class="driftwall-mount" aria-hidden="true"></div>

      <!-- Atmospheric Radial Gradient Backing -->
      <div class="drift-ambient-bg" aria-hidden="true"></div>

      <!-- Header Floating Navigation & Controls -->
      <header class="drift-header">
        <!-- Minimalist Luxury Wordmark -->
        <div class="drift-brand">
          <span class="drift-brand-text">ETLAMO</span>
          <span class="drift-brand-sub">${isAr ? 'اتلموا · مصر' : 'EGYPT'}</span>
        </div>

        <!-- Choice Segmented Switch -->
        <nav class="drift-switch" role="tablist" aria-label="${isAr ? 'اختر الوجهة' : 'Select Destination'}">
          <div class="drift-switch-pill" aria-hidden="true"></div>
          <button type="button" class="drift-switch-btn is-active" data-choice="wedding" role="tab" aria-selected="true" aria-pressed="true">
            <svg class="drift-switch-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 2l3 5h5l-4 4 1.5 6L12 14l-5.5 3L8 11 4 7h5z"/>
            </svg>
            <span>${isAr ? 'أفراح وقصور الملوك' : 'Royal Weddings'}</span>
          </button>
          <button type="button" class="drift-switch-btn" data-choice="conference" role="tab" aria-selected="false" aria-pressed="false">
            <svg class="drift-switch-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
            <span>${isAr ? 'المؤتمرات والقمم' : 'Executive Summits'}</span>
          </button>
        </nav>

        <!-- Minimalist Language Toggle Only (Nav Removed per Landing Screen Guidelines) -->
        <div class="drift-lang-wrap">
          <button type="button" class="drift-lang-pill" data-action="split-toggle-lang" aria-label="${isAr ? 'Switch to English' : 'التغيير إلى العربية'}" title="${isAr ? 'Switch to English' : 'التغيير إلى العربية'}">
            <svg class="drift-lang-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 2a14.5 14.5 0 0 0 0 20M12 2a14.5 14.5 0 0 1 0 20M2 12h20"/>
            </svg>
            <span class="drift-lang-code">${isAr ? 'EN' : 'عربي'}</span>
          </button>
        </div>
      </header>

      <!-- Symbolic Item on the Left: Floating Editorial Totem with Choices' Containers -->
      <aside class="drift-totem" data-choice="wedding" aria-label="${isAr ? 'تفاصيل الوجهة المختارة' : 'Selected Destination Highlights'}">
        <!-- Choice 1: Royal Weddings Container -->
        <div class="drift-choice-container" data-choice="wedding" id="totem-choice-wedding">
          <div class="drift-totem-header">
            <div class="drift-totem-emblem" aria-hidden="true">
              <svg class="drift-emblem-svg drift-emblem-wedding" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>
              </svg>
            </div>
            <span class="drift-totem-badge">${dataMap.wedding.badge}</span>
          </div>

          <h1 class="drift-totem-title">${dataMap.wedding.title}</h1>

          <p class="drift-totem-desc">${dataMap.wedding.desc}</p>

          <div class="drift-totem-pills" aria-label="${isAr ? 'مميزات الوجهة' : 'Key Highlights'}">
            ${dataMap.wedding.pills.map(p => `<span class="drift-pill">${p}</span>`).join('')}
          </div>

          <!-- Primary Action CTA: Cult UI Organic Button -->
          <div class="drift-totem-actions">
            ${renderOrganicButton({
              label: dataMap.wedding.cta,
              choice: 'wedding',
              variant: 'wedding',
              size: 'md',
              className: 'drift-cta-btn',
              action: 'confirm-selection',
              isAr
            })}
          </div>
        </div>

        <!-- Choice 2: Executive Summits Container -->
        <div class="drift-choice-container" data-choice="conference" id="totem-choice-conference" hidden>
          <div class="drift-totem-header">
            <div class="drift-totem-emblem" aria-hidden="true">
              <svg class="drift-emblem-svg drift-emblem-conference" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <circle cx="12" cy="11" r="3"/>
              </svg>
            </div>
            <span class="drift-totem-badge">${dataMap.conference.badge}</span>
          </div>

          <h2 class="drift-totem-title">${dataMap.conference.title}</h2>

          <p class="drift-totem-desc">${dataMap.conference.desc}</p>

          <div class="drift-totem-pills" aria-label="${isAr ? 'مميزات الوجهة' : 'Key Highlights'}">
            ${dataMap.conference.pills.map(p => `<span class="drift-pill">${p}</span>`).join('')}
          </div>

          <!-- Primary Action CTA: Cult UI Organic Button -->
          <div class="drift-totem-actions">
            ${renderOrganicButton({
              label: dataMap.conference.cta,
              choice: 'conference',
              variant: 'conference',
              size: 'md',
              className: 'drift-cta-btn',
              action: 'confirm-selection',
              isAr
            })}
          </div>
        </div>
      </aside>

      <!-- Grand Sovereign Architectural Portal Gate for Dimension Transition -->
      <div class="drift-gate-portal" aria-hidden="true">
        <!-- Left Sovereign Wing -->
        <div class="drift-gate-wing drift-gate-wing-left">
          <div class="drift-gate-inner">
            <div class="drift-gate-arch"></div>
            <div class="drift-gate-crests">
              <svg class="drift-gate-emblem" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
                <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Right Sovereign Wing -->
        <div class="drift-gate-wing drift-gate-wing-right">
          <div class="drift-gate-inner">
            <div class="drift-gate-arch"></div>
            <div class="drift-gate-crests">
              <svg class="drift-gate-emblem" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <circle cx="12" cy="11" r="3"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Luminous Center Seam & Anamorphic Light Burst -->
        <div class="drift-gate-light-core"></div>
        <div class="drift-gate-flare"></div>
      </div>

      <!-- WebGL Chromatic Portal Canvas for Seamless Dimension Transition -->
      <canvas class="drift-portal-canvas" aria-hidden="true"></canvas>

      <!-- Screen Transition Veil -->
      <div class="drift-portal-veil" aria-hidden="true"></div>
    </section>
  `;
}
