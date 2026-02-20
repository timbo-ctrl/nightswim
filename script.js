/* ============================================
   NIGHTSWIM — MAXIMUM DYNAMICS ENGINE
   ============================================ */
(function () {
  'use strict';

  // =============================================
  //  CUSTOM SMOOTH SCROLL (lerp-based)
  // =============================================
  let scrollY = 0;
  let smoothY = 0;
  const scrollLerp = 0.08;

  function lerpScroll() {
    scrollY = window.scrollY;
    smoothY += (scrollY - smoothY) * scrollLerp;

    // Update scroll progress bar
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
    const bar = document.getElementById('scrollProgress');
    if (bar) bar.style.width = progress + '%';

    requestAnimationFrame(lerpScroll);
  }
  lerpScroll();

  // =============================================
  //  INIT ON LOAD
  // =============================================
  window.addEventListener('load', () => {
    // Activate mesh bg
    setTimeout(() => {
      document.getElementById('meshBg').classList.add('active');
      document.getElementById('nav').classList.add('visible');
    }, 300);

    initWaterRipple();
    initNavScroll();
    initActiveNav();
    initMobileMenu();
    initSmoothAnchors();
    initRevealAnimations();
    initSplitText();
    initSplitLines();
    initParticles();
    initRippleCanvas();
    initParallax();
    initTiltCards();
    initMagneticElements();
    initCountUp();
    initTextScramble();
    initQuoteReveal();
    initHorizontalScroll();
  });

  // =============================================
  //  WATER RIPPLE SIMULATION (hero section)
  // =============================================
  function initWaterRipple() {
    const canvas = document.getElementById('waterCanvas');
    const hero = document.querySelector('.hero');
    if (!canvas || !hero) return;

    const ctx = canvas.getContext('2d');
    let width, height;
    let current, previous, temp;
    const damping = 0.97;
    let resolution = 4; // pixel size of each cell
    let cols, rows;
    let isHeroVisible = true;

    function resize() {
      const rect = hero.getBoundingClientRect();
      width = canvas.width = Math.floor(rect.width);
      height = canvas.height = Math.floor(rect.height);
      cols = Math.floor(width / resolution);
      rows = Math.floor(height / resolution);
      current = new Float32Array(cols * rows);
      previous = new Float32Array(cols * rows);
    }

    resize();
    window.addEventListener('resize', resize);

    // Check if hero is in view
    const heroObs = new IntersectionObserver(entries => {
      isHeroVisible = entries[0].isIntersecting;
    }, { threshold: 0 });
    heroObs.observe(hero);

    // Drop a ripple at a point
    function dropRipple(x, y, radius, strength) {
      const cx = Math.floor(x / resolution);
      const cy = Math.floor(y / resolution);
      const r = Math.floor(radius / resolution);

      for (let j = -r; j <= r; j++) {
        for (let i = -r; i <= r; i++) {
          const dist = Math.sqrt(i * i + j * j);
          if (dist < r) {
            const px = cx + i;
            const py = cy + j;
            if (px >= 0 && px < cols && py >= 0 && py < rows) {
              const falloff = 1 - (dist / r);
              previous[py * cols + px] += strength * falloff * falloff;
            }
          }
        }
      }
    }

    // Mouse interaction
    let lastMX = 0, lastMY = 0, lastDrop = 0;

    hero.addEventListener('mousemove', e => {
      const rect = hero.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const now = Date.now();

      // Calculate velocity for dynamic ripple size
      const dx = x - lastMX;
      const dy = y - lastMY;
      const speed = Math.sqrt(dx * dx + dy * dy);

      if (now - lastDrop > 30) {
        const radius = Math.min(20 + speed * 0.5, 50);
        const strength = Math.min(80 + speed * 2, 200);
        dropRipple(x, y, radius, strength);
        lastDrop = now;
      }

      lastMX = x;
      lastMY = y;
    });

    // Click for big splash
    hero.addEventListener('click', e => {
      const rect = hero.getBoundingClientRect();
      dropRipple(e.clientX - rect.left, e.clientY - rect.top, 60, 400);
    });

    // Ambient drips
    setInterval(() => {
      if (isHeroVisible) {
        dropRipple(
          Math.random() * width,
          Math.random() * height,
          15 + Math.random() * 20,
          40 + Math.random() * 60
        );
      }
    }, 2500);

    // Initial splash
    setTimeout(() => {
      dropRipple(width / 2, height / 2, 50, 150);
    }, 500);

    // Simulation loop
    function simulate() {
      for (let y = 1; y < rows - 1; y++) {
        for (let x = 1; x < cols - 1; x++) {
          const i = y * cols + x;
          current[i] = (
            previous[i - 1] +
            previous[i + 1] +
            previous[(y - 1) * cols + x] +
            previous[(y + 1) * cols + x]
          ) / 2 - current[i];
          current[i] *= damping;
        }
      }

      // Swap buffers
      temp = previous;
      previous = current;
      current = temp;
    }

    // Render
    function render() {
      if (!isHeroVisible) {
        requestAnimationFrame(render);
        return;
      }

      simulate();
      ctx.clearRect(0, 0, width, height);

      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;

      for (let y = 1; y < rows - 1; y++) {
        for (let x = 1; x < cols - 1; x++) {
          const val = current[y * cols + x];

          // Only draw if there's significant displacement
          if (Math.abs(val) > 0.5) {
            // Calculate normals for lighting effect
            const dx = current[y * cols + (x - 1)] - current[y * cols + (x + 1)];
            const dy = current[(y - 1) * cols + x] - current[(y + 1) * cols + x];

            const highlight = dx * 0.3;
            const intensity = Math.max(0, Math.min(1, Math.abs(val) / 60));

            // Teal-tinted water color
            const r = Math.max(0, Math.min(255, 20 + highlight * 60));
            const g = Math.max(0, Math.min(255, 160 + highlight * 120));
            const b = Math.max(0, Math.min(255, 120 + highlight * 100));
            const a = intensity * 120;

            // Fill the cell
            for (let py = 0; py < resolution; py++) {
              for (let px = 0; px < resolution; px++) {
                const pixelX = x * resolution + px;
                const pixelY = y * resolution + py;
                if (pixelX < width && pixelY < height) {
                  const idx = (pixelY * width + pixelX) * 4;
                  data[idx] = r;
                  data[idx + 1] = g;
                  data[idx + 2] = b;
                  data[idx + 3] = a;
                }
              }
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      requestAnimationFrame(render);
    }

    render();
  }

  // =============================================
  //  NAV
  // =============================================
  function initNavScroll() {
    const nav = document.getElementById('nav');
    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          nav.classList.toggle('scrolled', window.scrollY > 60);
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  function initActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const links = document.querySelectorAll('.nav-link[data-section]');

    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          links.forEach(l => l.classList.toggle('active', l.dataset.section === entry.target.id));
        }
      });
    }, { threshold: 0.3, rootMargin: '-80px 0px -40% 0px' });

    sections.forEach(s => obs.observe(s));
  }

  function initMobileMenu() {
    const btn = document.getElementById('menuBtn');
    const menu = document.getElementById('mobileMenu');

    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      menu.classList.toggle('active');
      document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';
    });

    menu.querySelectorAll('.mobile-link').forEach(link => {
      link.addEventListener('click', () => {
        btn.classList.remove('active');
        menu.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  function initSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        const target = document.querySelector(a.getAttribute('href'));
        if (target) {
          window.scrollTo({ top: target.offsetTop - 72, behavior: 'smooth' });
        }
      });
    });
  }

  // =============================================
  //  REVEAL ON SCROLL
  // =============================================
  function initRevealAnimations() {
    const els = document.querySelectorAll('.reveal, .reveal-delay-1, .reveal-delay-2, .reveal-delay-3');
    const stagger = document.querySelectorAll('.reveal-stagger');

    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

    els.forEach(el => obs.observe(el));

    const sObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const idx = parseInt(e.target.dataset.index) || 0;
          setTimeout(() => e.target.classList.add('visible'), idx * 130);
          sObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -20px 0px' });

    stagger.forEach(el => sObs.observe(el));
  }

  // =============================================
  //  SPLIT TEXT — letter by letter animation
  // =============================================
  function initSplitText() {
    document.querySelectorAll('[data-split]').forEach(el => {
      const text = el.textContent;
      el.innerHTML = '';
      let charIndex = 0;

      text.split(' ').forEach((word, wi) => {
        const wordSpan = document.createElement('span');
        wordSpan.className = 'word';

        word.split('').forEach(char => {
          const span = document.createElement('span');
          span.className = 'char';
          span.textContent = char;
          span.style.animationDelay = (0.8 + charIndex * 0.03) + 's';
          wordSpan.appendChild(span);
          charIndex++;
        });

        el.appendChild(wordSpan);

        // Add space
        if (wi < text.split(' ').length - 1) {
          const space = document.createElement('span');
          space.className = 'word';
          space.innerHTML = '&nbsp;';
          el.appendChild(space);
        }
      });
    });
  }

  // =============================================
  //  SPLIT LINES — line-by-line reveal on scroll
  // =============================================
  function initSplitLines() {
    document.querySelectorAll('[data-split-lines]').forEach(el => {
      const text = el.textContent.trim();
      // Split into words, then group into lines based on a rough character limit
      const words = text.split(/\s+/);
      const maxChars = window.innerWidth < 768 ? 25 : 40;
      const lines = [];
      let currentLine = '';

      words.forEach(word => {
        if ((currentLine + ' ' + word).trim().length > maxChars && currentLine) {
          lines.push(currentLine.trim());
          currentLine = word;
        } else {
          currentLine = (currentLine + ' ' + word).trim();
        }
      });
      if (currentLine) lines.push(currentLine.trim());

      el.innerHTML = lines.map(line =>
        `<span class="line-wrap"><span class="line-inner">${line}</span></span>`
      ).join('');

      const obs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            el.querySelectorAll('.line-inner').forEach((line, i) => {
              setTimeout(() => line.classList.add('visible'), i * 150);
            });
            obs.unobserve(el);
          }
        });
      }, { threshold: 0.2 });

      obs.observe(el);
    });
  }

  // =============================================
  //  PARTICLES
  // =============================================
  function initParticles() {
    const container = document.getElementById('heroParticles');
    if (!container) return;

    const count = window.innerWidth < 768 ? 25 : 70;

    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'hero-particle';
      const size = Math.random() * 3 + 0.5;
      Object.assign(p.style, {
        left: Math.random() * 100 + '%',
        top: (Math.random() * 80 + 40) + '%',
        width: size + 'px',
        height: size + 'px',
        opacity: Math.random() * 0.4 + 0.05,
        animationDuration: (Math.random() * 20 + 15) + 's',
        animationDelay: (Math.random() * 15) + 's'
      });
      container.appendChild(p);
    }
  }

  // =============================================
  //  RIPPLE CANVAS
  // =============================================
  function initRippleCanvas() {
    const canvas = document.getElementById('rippleCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let w, h, ripples = [], lastTime = 0;

    function resize() { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; }
    resize();
    window.addEventListener('resize', resize);

    document.addEventListener('mousemove', e => {
      const now = Date.now();
      if (now - lastTime > 180) {
        ripples.push({ x: e.clientX, y: e.clientY, r: 0, maxR: 50 + Math.random() * 40, o: 0.1, s: 1 + Math.random() });
        lastTime = now;
      }
    });

    // Ambient ripples
    setInterval(() => {
      if (ripples.length < 15) {
        ripples.push({ x: Math.random() * w, y: Math.random() * h, r: 0, maxR: 60 + Math.random() * 100, o: 0.02 + Math.random() * 0.02, s: 0.3 + Math.random() * 0.4 });
      }
    }, 2000);

    function draw() {
      ctx.clearRect(0, 0, w, h);
      ripples = ripples.filter(r => r.o > 0.001);

      ripples.forEach(r => {
        r.r += r.s;
        r.o *= 0.99;

        // Outer ring
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(80, 189, 151, ${r.o})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();

        // Inner ring
        if (r.r > 8) {
          ctx.beginPath();
          ctx.arc(r.x, r.y, r.r * 0.5, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(61, 168, 126, ${r.o * 0.5})`;
          ctx.lineWidth = 0.4;
          ctx.stroke();
        }
      });

      requestAnimationFrame(draw);
    }
    draw();
  }

  // =============================================
  //  PARALLAX
  // =============================================
  function initParallax() {
    const hero = document.querySelector('.hero-content');
    const grid = document.querySelector('.hero-grid');
    const cue = document.querySelector('.hero-scroll-cue');

    if (!hero || window.innerWidth < 768) return;

    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const sy = window.scrollY;
          const vh = window.innerHeight;

          if (sy < vh * 1.2) {
            const p = sy / vh;
            hero.style.transform = `translateY(${sy * 0.4}px) scale(${1 - p * 0.1})`;
            hero.style.opacity = 1 - p * 1.5;

            if (grid) grid.style.transform = `translateY(${sy * 0.2}px)`;
            if (cue) cue.style.opacity = Math.max(0, 1 - p * 4);
          }

          ticking = false;
        });
        ticking = true;
      }
    });
  }

  // =============================================
  //  3D TILT CARDS
  // =============================================
  function initTiltCards() {
    if (window.innerWidth < 768) return;

    document.querySelectorAll('[data-tilt]').forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        const tiltX = (y - 0.5) * -12;
        const tiltY = (x - 0.5) * 12;

        card.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.02)`;
        card.style.transition = 'transform 0.1s ease';

        // Move glow to follow cursor
        const glow = card.querySelector('.card-border-glow');
        if (glow) {
          const angle = Math.atan2(y - 0.5, x - 0.5) * (180 / Math.PI) + 180;
          glow.style.setProperty('--glow-angle', angle + 'deg');
        }
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale(1)';
        card.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
      });
    });
  }

  // =============================================
  //  MAGNETIC ELEMENTS
  // =============================================
  function initMagneticElements() {
    if (window.innerWidth < 768) return;

    document.querySelectorAll('.magnetic').forEach(el => {
      el.addEventListener('mousemove', e => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        el.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
        el.style.transition = 'transform 0.2s ease';
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
        el.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
      });
    });
  }

  // =============================================
  //  COUNT UP
  // =============================================
  function initCountUp() {
    document.querySelectorAll('[data-count]').forEach(el => {
      const obs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const target = parseInt(el.dataset.count);
            const suffix = el.dataset.suffix || '';
            let start = 0;
            const duration = 2000;
            const startTime = performance.now();

            function update(now) {
              const elapsed = now - startTime;
              const progress = Math.min(elapsed / duration, 1);
              // Ease out cubic
              const eased = 1 - Math.pow(1 - progress, 3);
              const current = Math.round(eased * target);
              el.textContent = current + suffix;
              if (progress < 1) requestAnimationFrame(update);
            }
            requestAnimationFrame(update);
            obs.unobserve(el);
          }
        });
      }, { threshold: 0.5 });
      obs.observe(el);
    });
  }

  // =============================================
  //  TEXT SCRAMBLE on hover
  // =============================================
  function initTextScramble() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%';

    document.querySelectorAll('[data-scramble]').forEach(el => {
      const original = el.textContent;
      let interval;

      el.addEventListener('mouseenter', () => {
        let iteration = 0;
        clearInterval(interval);

        interval = setInterval(() => {
          el.textContent = original
            .split('')
            .map((char, i) => {
              if (i < iteration) return original[i];
              return chars[Math.floor(Math.random() * chars.length)];
            })
            .join('');

          if (iteration >= original.length) clearInterval(interval);
          iteration += 1 / 2;
        }, 30);
      });

      el.addEventListener('mouseleave', () => {
        clearInterval(interval);
        el.textContent = original;
      });
    });
  }

  // =============================================
  //  QUOTE WORD-BY-WORD REVEAL ON SCROLL
  // =============================================
  function initQuoteReveal() {
    const el = document.getElementById('bigQuoteText');
    if (!el) return;

    const html = el.innerHTML;
    // Extract text content, preserving HTML entities
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const text = temp.textContent;
    const words = text.split(/\s+/);

    el.innerHTML = words.map(w => `<span class="quote-word">${w}</span>`).join(' ');

    const quoteWords = el.querySelectorAll('.quote-word');

    function updateQuote() {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = vh * 0.85;
      const end = vh * 0.25;
      const progress = Math.max(0, Math.min(1, (start - rect.top) / (start - end)));

      const litCount = Math.floor(progress * quoteWords.length);
      quoteWords.forEach((w, i) => {
        w.classList.toggle('lit', i < litCount);
      });

      requestAnimationFrame(updateQuote);
    }
    updateQuote();
  }

  // =============================================
  //  SCROLL-JACKED HORIZONTAL PORTFOLIO
  // =============================================
  function initHorizontalScroll() {
    const wrapper = document.getElementById('portfolioScroll');
    const track = document.getElementById('portfolioTrack');
    if (!wrapper || !track) return;

    function update() {
      const rect = wrapper.getBoundingClientRect();
      const wrapperHeight = wrapper.offsetHeight;
      const scrollableDistance = wrapperHeight - window.innerHeight;
      const trackWidth = track.scrollWidth - window.innerWidth;

      if (rect.top <= 0 && rect.bottom >= window.innerHeight) {
        // How far through the pinned section we've scrolled (0 to 1)
        const progress = Math.min(1, Math.max(0, -rect.top / scrollableDistance));
        track.style.transform = `translateX(${-progress * trackWidth}px)`;
      }

      requestAnimationFrame(update);
    }

    update();
  }

})();
