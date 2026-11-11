/**
 * Dr. Md. Tanvir Hasan Majumder - Official Neurosurgeon Website Scripts
 * Progressive enhancement with modern vanilla JavaScript & Bootstrap 5
 */
(function () {
  'use strict';

  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  /* ==========================================================================
     1. Preloader Fadeout
     ========================================================================== */
  (function () {
    var p = document.getElementById('preloader');
    if (!p) return;
    var t0 = window.performance && performance.now ? performance.now() : 0;
    var done = false;

    function hide() {
      if (done) return;
      done = true;
      var elapsed = (window.performance && performance.now ? performance.now() : 0) - t0;
      var wait = Math.max(0, 350 - elapsed);
      setTimeout(function () {
        p.classList.add('is-done');
        setTimeout(function () {
          if (p.parentNode) {
            p.parentNode.removeChild(p);
          }
        }, 700);
      }, wait);
    }

    if (document.readyState !== 'loading') {
      hide();
    } else {
      document.addEventListener('DOMContentLoaded', hide);
    }
    setTimeout(hide, 2000);

    window.addEventListener('pageshow', function (e) {
      if (e.persisted && p.parentNode) {
        p.parentNode.removeChild(p);
      }
    });
  })();

  /* ==========================================================================
     2. Sticky Header Shadow
     ========================================================================== */
  (function () {
    var header = document.querySelector('.site-header');
    if (header) {
      var onScroll = function () {
        header.classList.toggle('is-stuck', window.scrollY > 8);
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }
  })();

  /* ==========================================================================
     3. Mobile Navigation Drawer / Dropdown
     ========================================================================== */
  (function () {
    var menu = document.querySelector('.mnav-wrap');
    if (!menu) return;

    document.addEventListener('click', function (e) {
      if (menu.open && !menu.contains(e.target)) {
        e.preventDefault();
        e.stopPropagation();
        menu.open = false;
      }
    }, true);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.open) {
        menu.open = false;
        var s = menu.querySelector('summary');
        if (s) s.focus();
      }
    });

    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        menu.open = false;
      }
    });

    var mq = window.matchMedia('(min-width: 1101px)');
    var closeOnDesktop = function () {
      if (mq.matches) {
        menu.open = false;
      }
    };
    if (mq.addEventListener) {
      mq.addEventListener('change', closeOnDesktop);
    }
  })();

  /* ==========================================================================
     4. Category Filter Tabs (Services & Photo Gallery)
     ========================================================================== */
  (function () {
    $$('.tabs[data-filter]').forEach(function (tabs) {
      var sel = tabs.getAttribute('data-filter');
      if (!sel) return;
      var list = document.querySelector(sel);
      if (!list) return;
      var items = $$('[data-item]', list);
      var search = document.querySelector('[data-search="' + sel + '"]');
      var empty = document.querySelector('[data-empty="' + sel + '"]');
      var count = document.querySelector('[data-count="' + sel + '"]');
      var key = 'all';

      function apply() {
        var q = search ? search.value.trim().toLowerCase() : '';
        var shown = 0;
        items.forEach(function (el) {
          var cat = el.getAttribute('data-cat') || '';
          var text = (el.getAttribute('data-text') || el.textContent || '').toLowerCase();
          var ok = (key === 'all' || cat === key) && (!q || text.indexOf(q) !== -1);
          el.hidden = !ok;
          if (ok) {
            shown++;
            el.style.display = '';
          } else {
            el.style.display = 'none';
          }
        });
        if (empty) {
          empty.hidden = shown !== 0;
          empty.style.display = shown !== 0 ? 'none' : 'block';
        }
        if (count && count.getAttribute('data-tpl')) {
          var n = String(shown);
          if (document.documentElement.lang === 'bn') {
            n = n.replace(/\d/g, function (d) { return '০১২৩৪৫৬৭৮৯'.charAt(d); });
          }
          count.textContent = count.getAttribute('data-tpl').replace('%s', n);
        }
        list.dispatchEvent(new CustomEvent('dt:filter'));
      }

      tabs.addEventListener('click', function (e) {
        var btn = e.target.closest('.tab');
        if (!btn || !btn.hasAttribute('data-key')) return;
        key = btn.getAttribute('data-key');
        $$('.tab', tabs).forEach(function (b) {
          var on = b === btn;
          b.classList.toggle('is-on', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        apply();
      });

      if (search) {
        search.addEventListener('input', apply);
      }
    });
  })();

  /* ==========================================================================
     5. Photo Lightbox Modal
     ========================================================================== */
  (function () {
    var lb = document.getElementById('lightbox');
    if (!lb) return;

    var img = lb.querySelector('img');
    var cap = lb.querySelector('.lb-cap span');
    var num = lb.querySelector('.lb-cap small');
    var current = 0;

    var visible = function () {
      return $$('[data-lb]').filter(function (p) {
        return !p.closest('[hidden]') && p.style.display !== 'none';
      });
    };

    var show = function (i) {
      var list = visible();
      if (!list.length) return;
      current = (i + list.length) % list.length;
      var p = list[current];
      var fullSrc = p.getAttribute('data-full') || (p.querySelector('img') ? p.querySelector('img').src : '');
      var captionText = p.getAttribute('data-cap') || (p.querySelector('img') ? p.querySelector('img').alt : '');
      
      // Map online path to local relative image path if needed
      if (fullSrc && fullSrc.indexOf('/wp-content/') !== -1) {
        var parts = fullSrc.split('/');
        fullSrc = 'images/' + parts[parts.length - 1];
      }
      
      if (img) {
        img.src = fullSrc;
        img.alt = captionText || '';
      }
      if (cap) cap.textContent = captionText || '';
      if (num) num.textContent = (current + 1) + ' / ' + list.length;
    };

    document.addEventListener('click', function (e) {
      var p = e.target.closest('[data-lb]');
      if (p) {
        var idx = visible().indexOf(p);
        show(idx < 0 ? 0 : idx);
        if (typeof lb.showModal === 'function') {
          lb.showModal();
        } else {
          lb.setAttribute('open', '');
        }
        return;
      }
      if (!lb.open && !lb.hasAttribute('open')) return;
      if (e.target.closest('.lb-x') || e.target === lb || e.target.classList.contains('lb-in')) {
        if (typeof lb.close === 'function') {
          lb.close();
        } else {
          lb.removeAttribute('open');
        }
      } else if (e.target.closest('.lb-p')) {
        show(current - 1);
      } else if (e.target.closest('.lb-n')) {
        show(current + 1);
      }
    });

    lb.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') {
        show(current + 1);
      } else if (e.key === 'ArrowLeft') {
        show(current - 1);
      } else if (e.key === 'Escape') {
        if (typeof lb.close === 'function') {
          lb.close();
        } else {
          lb.removeAttribute('open');
        }
      }
    });

    lb.addEventListener('close', function () {
      if (img) img.removeAttribute('src');
    });
  })();

  /* ==========================================================================
     6. YouTube Video Modal & Embedded Players
     ========================================================================== */
  (function () {
    var YT_OK = /^[A-Za-z0-9_-]{11}$/;
    var vm = document.getElementById('vmodal');
    var vmIn = vm ? vm.querySelector('.vm-in') : null;

    function openVideo(id, title) {
      if (!vm || !vmIn) return;
      vmIn.innerHTML = '<iframe width="100%" height="100%" src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&playsinline=1" title="' + (title || 'Video') + '" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen class="yt-frame"></iframe>';
      if (typeof vm.showModal === 'function') {
        vm.showModal();
      } else {
        vm.setAttribute('open', '');
      }
    }

    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-yt]');
      if (b) {
        var id = b.getAttribute('data-yt');
        var title = b.getAttribute('data-title') || '';
        if (YT_OK.test(id)) {
          openVideo(id, title);
        }
        return;
      }
      if (vm && (vm.open || vm.hasAttribute('open'))) {
        if (e.target.closest('.lb-x') || e.target === vm) {
          if (typeof vm.close === 'function') {
            vm.close();
          } else {
            vm.removeAttribute('open');
          }
          if (vmIn) vmIn.innerHTML = '';
        }
      }
    });

    if (vm) {
      vm.addEventListener('close', function () {
        if (vmIn) vmIn.innerHTML = '';
      });
      vm.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          if (typeof vm.close === 'function') {
            vm.close();
          } else {
            vm.removeAttribute('open');
          }
          if (vmIn) vmIn.innerHTML = '';
        }
      });
    }
  })();

  /* ==========================================================================
     7. Generic Slider / Carousel
     ========================================================================== */
  (function () {
    var sliders = $$('[data-slider]');
    if (!sliders.length) return;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    sliders.forEach(function (sl) {
      var track = sl.querySelector('.sl-track');
      var items = $$('.sl-item', sl);
      var prev = sl.querySelector('.sl-prev');
      var next = sl.querySelector('.sl-next');
      var dotsBox = sl.querySelector('.sl-dots');

      if (!track || items.length < 2) {
        if (prev) prev.hidden = true;
        if (next) next.hidden = true;
        return;
      }

      var timer = null;
      var paused = false;
      var dots = [];

      var offsets = function () {
        var base = items[0].offsetLeft;
        return items.map(function (it) {
          return it.offsetLeft - base;
        });
      };

      var maxScroll = function () {
        return track.scrollWidth - track.clientWidth;
      };

      var pages = function () {
        var m = maxScroll();
        if (m <= 2) return 1;
        var o = offsets();
        var n = 0;
        for (var i = 0; i < o.length; i++) {
          if (o[i] <= m + 2) n++;
        }
        return Math.max(1, n);
      };

      var nearest = function () {
        var o = offsets();
        var x = track.scrollLeft;
        var best = 0;
        var bd = 1e9;
        for (var i = 0; i < o.length; i++) {
          var d = Math.abs(o[i] - x);
          if (d < bd) {
            bd = d;
            best = i;
          }
        }
        return best;
      };

      function buildDots() {
        if (!dotsBox) return;
        dotsBox.innerHTML = '';
        dots = [];
        var n = pages();
        if (n <= 1) {
          dotsBox.hidden = true;
          return;
        }
        dotsBox.hidden = false;
        for (var i = 0; i < n; i++) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'sl-dot' + (i === 0 ? ' is-on' : '');
          b.setAttribute('aria-label', 'স্লাইড ' + (i + 1));
          (function (idx) {
            b.addEventListener('click', function () {
              go(idx);
              restart();
            });
          })(i);
          dotsBox.appendChild(b);
          dots.push(b);
        }
      }

      function sync() {
        var i = Math.min(nearest(), dots.length - 1);
        dots.forEach(function (d, k) {
          d.classList.toggle('is-on', k === i);
        });
        if (prev) prev.disabled = track.scrollLeft <= 4;
        if (next) next.disabled = track.scrollLeft >= maxScroll() - 4;
      }

      function go(idx) {
        var o = offsets();
        var target = Math.min(o[Math.max(0, Math.min(idx, o.length - 1))], maxScroll());
        track.scrollTo({ left: target, behavior: reduce ? 'auto' : 'smooth' });
      }

      if (prev) {
        prev.addEventListener('click', function () {
          go(nearest() - 1);
          restart();
        });
      }
      if (next) {
        next.addEventListener('click', function () {
          go(nearest() + 1);
          restart();
        });
      }

      var tick = null;
      track.addEventListener('scroll', function () {
        if (tick) return;
        tick = requestAnimationFrame(function () {
          sync();
          tick = null;
        });
      }, { passive: true });

      function step() {
        if (paused) return;
        var cur = nearest();
        var n = pages();
        var nextIdx = (cur + 1) >= n ? 0 : cur + 1;
        go(nextIdx);
      }

      var auto = parseInt(sl.getAttribute('data-auto') || '0', 10);
      function restart() {
        if (timer) clearInterval(timer);
        if (auto > 1000 && !reduce) {
          timer = setInterval(step, auto);
        }
      }

      sl.addEventListener('mouseenter', function () { paused = true; });
      sl.addEventListener('mouseleave', function () { paused = false; });
      track.addEventListener('touchstart', function () {
        paused = true;
        setTimeout(function () {
          paused = false;
          restart();
        }, 4000);
      }, { passive: true });

      window.addEventListener('resize', buildDots);
      buildDots();
      restart();
    });
  })();

  /* ==========================================================================
     8. FAQ Accordion: Opening one closes the others
     ========================================================================== */
  (function () {
    var details = $$('.faq-wrap details, .faq details');
    if (!details.length) return;

    details.forEach(function (targetDetail) {
      targetDetail.addEventListener('toggle', function () {
        if (!targetDetail.open) return;
        details.forEach(function (d) {
          if (d !== targetDetail && d.open) {
            d.open = false;
          }
        });
      });
    });
  })();

  /* ==========================================================================
     9. Scroll Reveal Animation
     ========================================================================== */
  (function () {
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var sel = '.grid > *, .sec-head, .sec-row, .split > *, .how li, .steps li, .tags li, .strip-card, .bento > *, .masonry > *, .cta, .more-box, .acta, .faq details, .mv, .moment, .points li';
    var vh = window.innerHeight;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var t = en.target;
          t.classList.add('in');
          io.unobserve(t);
          setTimeout(function () {
            t.classList.remove('rv', 'in');
            t.style.removeProperty('--d');
          }, 1100);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

    var seen = new Map();
    $$(sel).forEach(function (el) {
      if (el.closest('dialog') || el.getBoundingClientRect().top < vh) return;
      var parent = el.parentElement;
      var i = seen.get(parent) || 0;
      seen.set(parent, i + 1);
      el.style.setProperty('--d', Math.min(i, 5) * 0.07 + 's');
      el.classList.add('rv');
      io.observe(el);
    });

    document.documentElement.classList.add('js');
  })();

  /* ==========================================================================
     10. Back to Top Button
     ========================================================================== */
  (function () {
    var b = document.getElementById('totop');
    if (!b) return;
    var tick = false;

    var update = function () {
      var show = window.scrollY > 450;
      b.classList.toggle('show', show);
      if (show) {
        b.removeAttribute('hidden');
      } else {
        b.setAttribute('hidden', '');
      }
      tick = false;
    };

    window.addEventListener('scroll', function () {
      if (!tick) {
        tick = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });
    update();

    b.addEventListener('click', function () {
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      var s = document.querySelector('.skip');
      if (s) {
        s.focus({ preventScroll: true });
        s.blur();
      }
    });
  })();

})();
