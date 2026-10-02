(() => {
  const root = document.documentElement;
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  const heading = document.querySelector("h1");
  if (heading) {
    heading.innerHTML = heading.innerHTML
      .split(/<br\s*\/?\s*>/i)
      .map((line) => `<span class="hero-line"><span>${line}</span></span>`)
      .join("");
  }
  const reveal = [
    ...document.querySelectorAll(
      ".section-head, .plan, .compare, .quotes blockquote, .gallery-grid figure, .step, .faq-list article, .service, .service-featured, .garden-strip .photo, .comparison-cover figure, .studio-photo",
    ),
  ];
  reveal.forEach((el, i) => {
    el.dataset.reveal = el.matches("figure, .photo") ? "image" : "text";
    el.style.setProperty("--reveal-delay", `${el.matches(".step") ? (i % 3) * 90 : 0}ms`);
  });
  let observer;
  const gallery = document.querySelector("body.mge #galeria");
  const track = gallery?.querySelector(".gallery-grid");
  let scheduled = false;
  function updateScroll() {
    scheduled = false;
    if (root.dataset.motion !== "enabled") return;
    if (track) {
      const wide = innerWidth > 760;
      const rect = gallery.getBoundingClientRect();
      const distance = Math.max(1, gallery.offsetHeight - innerHeight);
      const progress = Math.min(1, Math.max(0, -rect.top / distance));
      const travel = Math.max(0, track.scrollWidth - track.parentElement.clientWidth);
      track.style.transform = wide ? `translate3d(${-progress * travel}px,0,0)` : "";
    }
    document.querySelectorAll(".steps-grid").forEach((grid) => {
      const rect = grid.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (innerHeight * 0.7 - rect.top) / rect.height));
      grid.style.setProperty("--step-progress", progress);
    });
  }
  function requestUpdate() {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(updateScroll);
    }
  }
  function initialize() {
    observer?.disconnect();
    if (preference.matches || !("IntersectionObserver" in window)) {
      root.dataset.motion = "reduced";
      reveal.forEach((el) => el.classList.add("is-visible"));
      if (track) track.style.transform = "";
      return;
    }
    root.dataset.motion = "enabled";
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -35px 0px" },
    );
    reveal.forEach((el) => observer.observe(el));
    updateScroll();
  }
  initialize();
  preference.addEventListener("change", initialize);
  addEventListener("scroll", requestUpdate, { passive: true });
  addEventListener("resize", requestUpdate);
  // Anchor navigation and keyboard focus must never land on hidden content.
  addEventListener("focusin", (event) =>
    event.target.closest("[data-reveal]")?.classList.add("is-visible"),
  );
})();

// Trepadeira: o ramo cresce até perto do fim da tela e as folhas abrem por onde ele passa.
(() => {
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.classList.add("vine");
  svg.setAttribute("aria-hidden", "true");
  document.body.prepend(svg);
  const make = (tag, attrs) => {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  };
  let vines = [];
  function build() {
    svg.replaceChildren();
    const height = document.body.scrollHeight;
    svg.style.height = `${height}px`;
    const margin = (innerWidth - document.querySelector(".wrap").offsetWidth) / 2;
    const wide = margin > 60;
    const sides = wide ? [margin / 2, innerWidth - margin / 2] : [innerWidth - 8];
    const amp = wide ? Math.min(26, margin / 2 - 14) : 4;
    vines = sides.map((cx, side) => {
      let d = `M${cx} 0`;
      for (let y = 0, x = cx, i = 0; y < height; i++) {
        const ny = Math.min(height, y + 170);
        const nx = cx + amp * Math.sin(i * 1.4 + side * 2);
        d += ` C${x} ${y + 85} ${nx} ${ny - 85} ${nx} ${ny}`;
        [x, y] = [nx, ny];
      }
      const stem = make("path", { d, class: "vine-stem" });
      svg.append(stem);
      const length = stem.getTotalLength();
      stem.style.strokeDasharray = length;
      const parts = [];
      for (let at = 70, k = 0; at < length; at += wide ? 52 : 80, k++) {
        const p = stem.getPointAtLength(at);
        const q = stem.getPointAtLength(at + 1);
        const angle = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI;
        const flower = k % 7 === 6;
        const g = make("g", { transform: `translate(${p.x} ${p.y}) rotate(${k % 2 ? angle + 20 : angle - 200})` });
        const part = flower
          ? make("g", { class: "flower" })
          : make("path", { class: "leaf", d: "M0 0C7-6 7-17 0-24C-7-17-7-6 0 0Z" });
        if (flower) {
          for (let i = 0; i < 5; i++) {
            const a = (i * 72 * Math.PI) / 180;
            part.append(make("circle", { cx: 5 * Math.cos(a), cy: -12 + 5 * Math.sin(a), r: 4 }));
          }
          part.append(make("circle", { cx: 0, cy: -12, r: 2.4 }));
        }
        part.style.setProperty("--s", wide ? 1 : 0.6);
        g.append(part);
        svg.append(g);
        parts.push([at, part]);
      }
      return { stem, length, parts };
    });
    grow();
  }
  function grow() {
    const full = document.documentElement.dataset.motion !== "enabled";
    const progress = Math.min(1, (scrollY + innerHeight * 0.85) / document.body.scrollHeight);
    vines.forEach(({ stem, length, parts }) => {
      const drawn = full ? length : length * progress;
      stem.style.strokeDashoffset = length - drawn;
      parts.forEach(([at, part]) => part.classList.toggle("open", at < drawn));
    });
  }
  let frame = 0;
  let timer;
  addEventListener("scroll", () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(grow);
  }, { passive: true });
  addEventListener("resize", () => {
    clearTimeout(timer);
    timer = setTimeout(build, 200);
  });
  addEventListener("load", build);
  build();
})();

// Antes e depois: o controle deslizante move a divisória.
document.querySelectorAll("[data-compare]").forEach((compare) => {
  const input = compare.querySelector("input");
  input.addEventListener("input", () => compare.style.setProperty("--pos", `${input.value}%`));
});

// Jardim vertical e gramado: folhas que balançam e se afastam do ponteiro.
document.querySelectorAll("[data-plants]").forEach((section) => {
  const wall = section.dataset.plants === "wall";
  const canvas = document.createElement("canvas");
  canvas.className = "plants";
  canvas.setAttribute("aria-hidden", "true");
  section.prepend(canvas);
  const ctx = canvas.getContext("2d");
  const greens = ["#1d5a40", "#25694b", "#2f7a57", "#3d8c62", "#4f9e6c", "#6bb27a"];
  let plants = [];
  let width = 0;
  let height = 0;
  let visible = false;
  const pointer = { x: -999, y: -999 };
  function setup() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    plants = [];
    const gap = wall ? 24 : 5;
    for (let x = -10; x < width + 10; x += gap) {
      if (wall) {
        for (let y = -10; y < height + 10; y += gap) {
          plants.push({
            x: x + Math.random() * gap,
            y: y + Math.random() * gap,
            size: 16 + Math.random() * 22,
            angle: Math.random() * Math.PI * 2,
            color: Math.random() < 0.03 ? "#56f09f" : greens[(Math.random() * greens.length) | 0],
            phase: Math.random() * 6.28,
            push: 0,
          });
        }
      } else {
        plants.push({
          x: x + Math.random() * gap,
          y: height,
          size: height * (0.35 + Math.random() * 0.6),
          angle: (Math.random() - 0.5) * 0.35,
          color: greens[(Math.random() * greens.length) | 0],
          phase: Math.random() * 6.28,
          push: 0,
        });
      }
    }
    plants.sort(() => Math.random() - 0.5);
    draw(0);
  }
  function draw(time) {
    ctx.clearRect(0, 0, width, height);
    const still = document.documentElement.dataset.motion !== "enabled";
    for (const p of plants) {
      const dx = p.x - pointer.x;
      const dy = (wall ? p.y : height - p.size / 2) - pointer.y;
      const near = Math.max(0, 1 - Math.hypot(dx, dy) / (wall ? 110 : 80));
      p.push += ((dx > 0 ? 1 : -1) * near * (wall ? 0.9 : 0.6) - p.push) * 0.08;
      const sway = still ? 0 : Math.sin(time * 0.0011 + p.phase) * (wall ? 0.07 : 0.12);
      const angle = p.angle + sway + p.push;
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.color;
      if (wall) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);
        const s = p.size;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(s * 0.45, -s * 0.45, 0, -s);
        ctx.quadraticCurveTo(-s * 0.45, -s * 0.45, 0, 0);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,251,236,0.18)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -s * 0.85);
        ctx.stroke();
        ctx.restore();
      } else {
        const tipX = p.x + Math.sin(angle) * p.size;
        const tipY = height - Math.cos(angle) * p.size;
        ctx.lineWidth = 2.2;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(p.x, height);
        ctx.quadraticCurveTo(p.x, height - p.size * 0.6, tipX, tipY);
        ctx.stroke();
      }
    }
    if (visible && !still) requestAnimationFrame(draw);
  }
  new IntersectionObserver(([entry]) => {
    const was = visible;
    visible = entry.isIntersecting;
    if (visible && !was) requestAnimationFrame(draw);
  }).observe(section);
  section.addEventListener("pointermove", (event) => {
    const box = canvas.getBoundingClientRect();
    pointer.x = event.clientX - box.left;
    pointer.y = event.clientY - box.top;
  });
  section.addEventListener("pointerleave", () => {
    pointer.x = pointer.y = -999;
  });
  let timer;
  addEventListener("resize", () => {
    clearTimeout(timer);
    timer = setTimeout(setup, 200);
  });
  setup();
});
