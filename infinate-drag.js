/*
  Infinate Drag — scattered image gallery effect
  ------------------------------------------------
  Single-file hosted version for GitHub + jsDelivr — matches the setup
  pattern used by your other plugins (moodboard.js etc): one file holds
  the CSS (injected via JS), the effect, and the attribution credit
  together, so nothing needs to be split across Header/Footer manually.

  USAGE ON SQUARESPACE:
  1. This file lives in your GitHub repo as infinate-drag.js, on main.
  2. Settings -> Advanced -> Code Injection -> HEADER: leave empty
     (or remove any old ddg-gallery CSS you'd pasted there previously).
  3. Settings -> Advanced -> Code Injection -> FOOTER: paste just:
       <script src="https://cdn.jsdelivr.net/gh/YOUR-USERNAME/YOUR-REPO@main/infinate-drag.js"></script>
     swapping in your actual GitHub username/repo name.
  4. On any page, add a Code Block with:
       <div class="ddg-gallery" data-collection="/blog" ...></div>
     using whichever data- attributes you want.

  CACHING NOTE: jsDelivr can take up to ~24 hours to reflect edits pushed
  to @main. While actively testing changes, reference a specific commit
  hash in the URL instead of @main to see updates instantly.
*/
(function(){
  // ---- inject CSS once, straight into <head> ----
  if (!document.getElementById('infinate-drag-styles')){
    const style = document.createElement('style');
    style.id = 'infinate-drag-styles';
    style.textContent = `
.ddg-gallery{position:relative;width:100vw;left:50%;right:50%;margin-left:-50vw;margin-right:-50vw;height:var(--ddg-height, 90vh);overflow:hidden;background:transparent;}
.ddg-gallery .ddg-stage{position:absolute;inset:0;touch-action:none;overflow:hidden;}
.ddg-gallery .ddg-field{position:absolute;top:0;left:0;}
.ddg-gallery .ddg-tile{position:absolute;display:block;overflow:hidden;background:transparent;border-radius:2px;z-index:1;}
.ddg-gallery a.ddg-tile{cursor:pointer;}
.ddg-gallery .ddg-tile img{width:100%;height:100%;object-fit:contain;display:block;pointer-events:none;-webkit-user-drag:none;user-select:none;transition:transform .35s cubic-bezier(.2,.8,.2,1), filter .35s ease;}
.ddg-gallery.ddg-grayscale .ddg-tile img{filter:grayscale(1);}
.ddg-gallery .ddg-stage:not(.ddg-dragging) .ddg-tile:hover img{transform:scale(1.08);filter:brightness(1.08);}
.ddg-gallery.ddg-grayscale .ddg-stage:not(.ddg-dragging) .ddg-tile:hover img{filter:grayscale(1) brightness(1.08);}
.ddg-gallery .ddg-stage:not(.ddg-dragging) .ddg-tile:hover{z-index:5;}
.ddg-gallery .ddg-heading{position:absolute;inset:0;z-index:50;pointer-events:none;display:flex;padding:24px 32px;}
.ddg-gallery .ddg-heading h1{margin:0;font-size:var(--ddg-heading-size, clamp(1.5rem,4vw,3rem));}
.ddg-gallery .ddg-heading.ddg-heading-invert h1{color:#fff;mix-blend-mode:difference;}
.ddg-gallery .ddg-heading.ddg-heading-solid h1{color:var(--ddg-heading-color, #000);}
.ddg-gallery .ddg-arrow{position:absolute;bottom:24px;left:50%;transform:translateX(-50%);z-index:60;width:40px;height:40px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#fff;mix-blend-mode:difference;animation:ddgArrowBounce 1.6s ease-in-out infinite;transition:opacity .4s ease;pointer-events:auto;}
.ddg-gallery .ddg-arrow svg{width:100%;height:100%;}
.ddg-gallery .ddg-arrow.ddg-arrow-hidden{opacity:0;pointer-events:none;}
@keyframes ddgArrowBounce{0%,100%{transform:translateX(-50%) translateY(0);}50%{transform:translateX(-50%) translateY(8px);}}
`;
    document.head.appendChild(style);
  }

  function num(v, fallback){ const n = parseFloat(v); return Number.isNaN(n) ? fallback : n; }

  function initGallery(root){
    if (root.__ddgInit) return;
    root.__ddgInit = true;

    const isMobile = window.innerWidth <= 768;

    const cfg = {
      collection:        root.dataset.collection || '/blog',
      minSize:            num(root.dataset.minSize, 240),
      maxSize:            num(root.dataset.maxSize, 340),
      gap:                num(root.dataset.gap, 16),
      gapVariance:        num(root.dataset.gapVariance, 0),
      randomness:         Math.min(1, Math.max(0, num(root.dataset.randomness, 0.5))),
      clickable:          root.dataset.clickable !== 'false',
      wobble:             root.dataset.wobble === 'true',
      grayscale:          root.dataset.grayscale === 'true',
      scrollArrow:        root.dataset.scrollArrow !== 'false',
      heading:            root.dataset.heading || '',
      headingPosition:    root.dataset.headingPosition || 'bottom-left',
      headingSize:        root.dataset.headingSize || '',
      headingSizeMobile:  root.dataset.headingSizeMobile || '',
      headingInvert:      root.dataset.headingInvert !== 'false',
      headingColor:       root.dataset.headingColor || '#000',
      height:             root.dataset.height || '90vh',
    };

    if (cfg.grayscale) root.classList.add('ddg-grayscale');
    root.style.setProperty('--ddg-height', cfg.height);

    const activeHeadingSize = isMobile && cfg.headingSizeMobile ? cfg.headingSizeMobile : cfg.headingSize;
    if (activeHeadingSize) root.style.setProperty('--ddg-heading-size', activeHeadingSize);

    const stage = document.createElement('div');
    stage.className = 'ddg-stage';
    const field = document.createElement('div');
    field.className = 'ddg-field';
    stage.appendChild(field);
    root.appendChild(stage);

    if (cfg.heading){
      const headingWrap = document.createElement('div');
      headingWrap.className = 'ddg-heading ' + (cfg.headingInvert ? 'ddg-heading-invert' : 'ddg-heading-solid');
      if (!cfg.headingInvert) root.style.setProperty('--ddg-heading-color', cfg.headingColor);
      const posMap = {
        'top-left':{alignItems:'flex-start',justifyContent:'flex-start'},
        'top-right':{alignItems:'flex-start',justifyContent:'flex-end'},
        'top-center':{alignItems:'flex-start',justifyContent:'center'},
        'bottom-left':{alignItems:'flex-end',justifyContent:'flex-start'},
        'bottom-right':{alignItems:'flex-end',justifyContent:'flex-end'},
        'bottom-center':{alignItems:'flex-end',justifyContent:'center'},
        'center':{alignItems:'center',justifyContent:'center'},
      };
      const pos = posMap[cfg.headingPosition] || posMap['bottom-left'];
      headingWrap.style.alignItems = pos.alignItems;
      headingWrap.style.justifyContent = pos.justifyContent;
      const h1 = document.createElement('h1');
      h1.textContent = cfg.heading;
      headingWrap.appendChild(h1);
      root.appendChild(headingWrap);
    }

    function dismissHint(){}

    let arrowEl = null;
    if (cfg.scrollArrow){
      arrowEl = document.createElement('div');
      arrowEl.className = 'ddg-arrow';
      arrowEl.setAttribute('role', 'button');
      arrowEl.setAttribute('aria-label', 'Scroll down');
      arrowEl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>';
      root.appendChild(arrowEl);

      arrowEl.addEventListener('click', function(){
        const rect = root.getBoundingClientRect();
        const target = rect.bottom + window.scrollY;
        window.scrollTo({ top: target, behavior: 'smooth' });
      });

      window.addEventListener('scroll', function(){
        const rect = root.getBoundingClientRect();
        if (rect.bottom < 100) arrowEl.classList.add('ddg-arrow-hidden');
        else arrowEl.classList.remove('ddg-arrow-hidden');
      }, { passive: true });
    }

    async function loadImages(){
      try {
        const res = await fetch(cfg.collection + '?format=json');
        if (!res.ok) throw new Error('bad response');
        const data = await res.json();
        const entries = (data.items || [])
          .filter(item => item.assetUrl)
          .map(item => ({ url: item.assetUrl, postUrl: item.fullUrl || null }));
        if (!entries.length) throw new Error('no images in collection');
        return entries;
      } catch (err){
        console.warn('Diagonal Drift Gallery: could not load "' + cfg.collection + '".', err);
        return [];
      }
    }

    function preloadDimensions(entries){
      return Promise.all(entries.map(entry => new Promise(resolve => {
        const img = new Image();
        const fallback = () => resolve({ url:entry.url, postUrl:entry.postUrl, aspect:4/3 });
        const timer = setTimeout(fallback, 6000);
        img.onload = () => {
          clearTimeout(timer);
          resolve({ url:entry.url, postUrl:entry.postUrl, aspect:(img.naturalWidth && img.naturalHeight) ? img.naturalWidth/img.naturalHeight : 4/3 });
        };
        img.onerror = () => { clearTimeout(timer); fallback(); };
        img.src = entry.url;
      })));
    }

    const scale = isMobile ? 0.55 : 1;
    const SIZE_MIN = Math.max(60, cfg.minSize * scale);
    const SIZE_MAX = Math.max(SIZE_MIN + 20, cfg.maxSize * scale);
    const GAP = Math.max(2, cfg.gap * scale);
    const CELL = SIZE_MAX + GAP * 2 + (cfg.gap * (cfg.gapVariance / 100));

    // Horizontal and vertical wrap spans are independent — the horizontal
    // loop stays a fixed, comfortable size, while only the vertical (row)
    // count grows to fill a taller box. This stops tiles from taking a
    // long detour before reappearing on the left edge.
    const GRID_CELLS_X = isMobile ? 6 : 8;
    let GRID_CELLS_Y = isMobile ? 6 : 8;

    const boxHeight = stage.clientHeight;
    const patternHeight = CELL * GRID_CELLS_Y;
    if (boxHeight > 0 && patternHeight < boxHeight){
      GRID_CELLS_Y = Math.ceil(boxHeight / CELL);
    }

    const AUTO_VX = isMobile ? -0.5 : -1.0;
    const AUTO_VY = isMobile ? -0.3 : -0.62;
    const RETURN_EASE = 0.045;
    const TEXT_Z = 50;
    const CANDIDATES = Math.max(1, Math.round(24 * (1 - cfg.randomness)));

    function rand(a,b){ return a + Math.random()*(b-a); }
    function mod(n,m){ return ((n % m) + m) % m; }

    async function build(){
      const entries = await loadImages();
      if (!entries.length) return;
      const IMAGE_DATA = await preloadDimensions(entries);

      const tiles = [];
      const TOTAL_X = CELL * GRID_CELLS_X;
      const TOTAL_Y = CELL * GRID_CELLS_Y;
      const grid = [];
      for (let gx=0; gx<GRID_CELLS_X; gx++) grid.push(new Array(GRID_CELLS_Y).fill(null));

      function rectGap(ax,ay,aw,ah,bx,by,bw,bh){
        const dx = Math.max(0, Math.max(bx-(ax+aw), ax-(bx+bw)));
        const dy = Math.max(0, Math.max(by-(ay+ah), ay-(by+bh)));
        if (dx>0 && dy>0) return Math.sqrt(dx*dx+dy*dy);
        return Math.max(dx,dy);
      }

      for (let gx=0; gx<GRID_CELLS_X; gx++){
        for (let gy=0; gy<GRID_CELLS_Y; gy++){
          const picked = IMAGE_DATA[Math.floor(Math.random()*IMAGE_DATA.length)];
          const longEdge = rand(SIZE_MIN, SIZE_MAX);
          let w,h;
          if (picked.aspect >= 1){ w=longEdge; h=longEdge/picked.aspect; }
          else { h=longEdge; w=longEdge*picked.aspect; }

          const tileGap = GAP * (1 + (Math.random()*2-1) * (cfg.gapVariance/100));

          const neighbors = [[gx-1,gy-1],[gx-1,gy],[gx-1,gy+1],[gx,gy-1]]
            .map(([nx,ny]) => (grid[nx] && ny>=0 && ny<GRID_CELLS_Y) ? grid[nx][ny] : null)
            .filter(Boolean);

          let bestX=0, bestY=0, bestScore=-Infinity;
          for (let k=0; k<CANDIDATES; k++){
            const lx = rand(tileGap, CELL - tileGap - w);
            const ly = rand(tileGap, CELL - tileGap - h);
            const absX = gx*CELL+lx, absY = gy*CELL+ly;
            let minGap = Infinity;
            for (const nb of neighbors) minGap = Math.min(minGap, rectGap(absX,absY,w,h,nb.x,nb.y,nb.w,nb.h));
            if (neighbors.length===0) minGap = Infinity;
            if (minGap > bestScore){ bestScore=minGap; bestX=absX; bestY=absY; }
            if (bestScore >= tileGap) break;
          }

          grid[gx][gy] = { x:bestX, y:bestY, w, h };

          const useLink = cfg.clickable && picked.postUrl;
          const el = document.createElement(useLink ? 'a' : 'div');
          el.className = 'ddg-tile';
          el.style.width = Math.round(w)+'px';
          el.style.height = Math.round(h)+'px';
          if (useLink){ el.href = picked.postUrl; el.setAttribute('aria-label','View post'); }

          if (!isMobile){
            const above = Math.random() < 0.5;
            const z = above ? TEXT_Z+1+Math.floor(Math.random()*20) : Math.max(1, TEXT_Z-1-Math.floor(Math.random()*20));
            el.style.zIndex = String(z);
          }

          const img = document.createElement('img');
          img.src = picked.url;
          img.loading = 'lazy';
          el.appendChild(img);
          field.appendChild(el);

          tiles.push({ el, baseX:bestX, baseY:bestY, phase:Math.random()*Math.PI*2, amp:rand(3,8), speed:rand(0.6,1.2) });
        }
      }

      let offsetX=0, offsetY=0, vx=AUTO_VX, vy=AUTO_VY, dragging=false;

      function render(t){
        const cx = stage.clientWidth/2, cy = stage.clientHeight/2;
        for (const tile of tiles){
          let dx = mod(tile.baseX+offsetX, TOTAL_X) - TOTAL_X/2 + cx;
          let dy = mod(tile.baseY+offsetY, TOTAL_Y) - TOTAL_Y/2 + cy;
          if (cfg.wobble && t !== undefined){
            dx += Math.sin(t/1000*tile.speed + tile.phase) * tile.amp;
            dy += Math.cos(t/1000*tile.speed + tile.phase) * tile.amp;
          }
          tile.el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
        }
      }

      function tick(t){
        if (!dragging){
          vx += (AUTO_VX-vx)*RETURN_EASE;
          vy += (AUTO_VY-vy)*RETURN_EASE;
          offsetX += vx; offsetY += vy;
        }
        render(t);
        requestAnimationFrame(tick);
      }

      let idleTimer=null, recent=[];

      function handleWheel(e){
        e.preventDefault();
        dismissHint();
        const s = e.deltaMode===1 ? 16 : 1;
        const dx=-e.deltaX*s, dy=-e.deltaY*s;
        offsetX+=dx; offsetY+=dy;
        recent.push({dx,dy}); if (recent.length>6) recent.shift();
        dragging=true; stage.classList.add('ddg-dragging');
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
          dragging=false; stage.classList.remove('ddg-dragging');
          if (recent.length){
            let sx=0, sy=0; recent.forEach(r=>{sx+=r.dx; sy+=r.dy;});
            vx=sx/recent.length; vy=sy/recent.length;
          }
          recent=[];
        }, 80);
      }
      stage.addEventListener('wheel', handleWheel, { passive:false });

      let touchLastX=null, touchLastY=null, touchStartX=null, touchStartY=null, touchMovedFar=false;
      const TAP_THRESHOLD = 8;

      function handleTouchStart(e){
        if (e.pointerType!=='touch') return;
        dismissHint();
        touchLastX=e.clientX; touchLastY=e.clientY;
        touchStartX=e.clientX; touchStartY=e.clientY;
        touchMovedFar=false; recent=[];
        clearTimeout(idleTimer);
      }
      function handleTouchMove(e){
        if (e.pointerType!=='touch' || touchLastX===null) return;
        const dx=e.clientX-touchLastX, dy=e.clientY-touchLastY;
        touchLastX=e.clientX; touchLastY=e.clientY;
        if (Math.abs(e.clientX-touchStartX)>TAP_THRESHOLD || Math.abs(e.clientY-touchStartY)>TAP_THRESHOLD) touchMovedFar=true;
        offsetX+=dx; offsetY+=dy;
        recent.push({dx,dy}); if (recent.length>6) recent.shift();
        dragging=true; stage.classList.add('ddg-dragging');
      }
      function handleTouchEnd(e){
        if (e.pointerType!=='touch') return;
        touchLastX=null; touchLastY=null;
        dragging=false; stage.classList.remove('ddg-dragging');
        if (recent.length){
          let sx=0, sy=0; recent.forEach(r=>{sx+=r.dx; sy+=r.dy;});
          vx=sx/recent.length; vy=sy/recent.length;
        }
        recent=[];
      }
      stage.addEventListener('click', function(e){
        if (touchMovedFar){ e.preventDefault(); e.stopPropagation(); touchMovedFar=false; }
      }, true);
      stage.addEventListener('pointerdown', handleTouchStart);
      stage.addEventListener('pointermove', handleTouchMove);
      stage.addEventListener('pointerup', handleTouchEnd);
      stage.addEventListener('pointercancel', handleTouchEnd);

      window.addEventListener('resize', render);
      render();
      requestAnimationFrame(tick);
    }

    build();
  }

  function initAll(){ document.querySelectorAll('.ddg-gallery').forEach(initGallery); }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAll);
  else initAll();

  window.addEventListener('mercury:load', initAll);

  // ---- attribution, injected unconditionally on every load ----
  // Not gated behind a marker or any data-attribute: this runs whenever
  // this script loads at all, regardless of whether a .ddg-gallery block
  // is present on the page. Removing the credit means removing this
  // whole script tag, which also removes the gallery effect.
  function injectAttribution(){
    if (document.getElementById('ddg-attribution')) return;
    const credit = document.createElement('div');
    credit.id = 'ddg-attribution';
    credit.style.cssText = 'text-align:center;font-size:12px;opacity:0.7;padding:20px 0;';
    credit.innerHTML = 'WEBSITE DESIGNED BY <a href="https://www.killvanillastudio.com" target="_blank" style="text-decoration:none;color:inherit;">KILLVANILLASTUDIO.COM</a>';
    document.body.appendChild(credit);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injectAttribution);
  else injectAttribution();
  window.addEventListener('mercury:load', injectAttribution);
})();
