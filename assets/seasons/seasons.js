// Special dates for the numberparrot site. Sets data-season on <html> from the visitor's
// local date, dresses Pico for it, adds a chip with an off switch (remembered per season)
// and light particles in the hero. ?season=<id> forces a season, ?season=off disables it.
(function (g) {
  var IDS = ["newyear", "carnival", "easter", "valentine", "junina", "halloween", "christmas"];
  function easter(y) {
    var a = y % 19, b = (y / 100) | 0, c = y % 100, d = (b / 4) | 0, e = b % 4;
    var h = (19 * a + b - d - (((b - (((b + 8) / 25) | 0) + 1) / 3) | 0) + 15) % 30;
    var l = (32 + 2 * e + 2 * ((c / 4) | 0) - h - (c % 4)) % 7;
    var m = ((a + 11 * h + 22 * l) / 451) | 0, n = h + l - 7 * m + 114;
    return new Date(y, ((n / 31) | 0) - 1, (n % 31) + 1);
  }
  // Whole days from date to Easter of its year, safe across daylight saving changes.
  function toEaster(t) {
    var e = easter(t.getFullYear());
    return Math.round((Date.UTC(e.getFullYear(), e.getMonth(), e.getDate()) - Date.UTC(t.getFullYear(), t.getMonth(), t.getDate())) / 864e5);
  }
  function seasonFor(t, br) {
    var md = (t.getMonth() + 1) * 100 + t.getDate(), e = toEaster(t);
    if (md >= 1230 || md <= 102) return "newyear";
    if (md >= 1218 && md <= 1226) return "christmas";
    if (md >= 1024 && md <= 1031) return "halloween";
    if (e >= 0 && e <= 2) return "easter";
    if (e >= 46 && e <= 50) return "carnival";
    if (md === 214 || (br && md === 612)) return "valentine";
    if (md >= 613 && md <= 629) return "junina";
    return null;
  }
  function pick(search, t, br, store) {
    var q = /[?&]season=([a-z]+)/.exec(search || "");
    if (q && q[1] === "off") return null;
    if (q && IDS.indexOf(q[1]) >= 0) return { id: q[1], on: true };
    var id = seasonFor(t, br), off = false;
    if (!id) return null;
    try { off = !!store && store.getItem("numberparrot:season-off:" + id) === "1"; } catch { /* blocked */ }
    return { id: id, on: !off };
  }
  function label(id, br) {
    return { newyear: "New Year", carnival: "Carnival", easter: "Easter", valentine: "Valentine's", junina: br ? "Festa Junina" : "Midsummer", halloween: "Halloween", christmas: "Christmas" }[id];
  }
  g.numberparrotSeasons = { IDS: IDS, easter: easter, seasonFor: seasonFor, pick: pick, label: label };
  if (typeof document === "undefined") return;

  var root = document.documentElement, store = null;
  try { store = localStorage; } catch { /* blocked */ }
  var br = [].concat(navigator.languages || [], navigator.language || []).some(function (l) { return /^pt-br$/i.test(l); });
  var s = pick(location.search, new Date(), br, store);
  if (!s) return;
  if (s.on) root.setAttribute("data-season", s.id);
  var base = new URL("assets/seasons/" + s.id + "/", document.currentScript ? document.currentScript.src : location.href).href;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function imgs(name, cls) {
    return '<img class="' + cls + ' np-sl" src="' + base + name + '-light.svg" alt=""><img class="' + cls + ' np-sd" src="' + base + name + '-dark.svg" alt="">';
  }

  function fx(hero) {
    if (fx.go) return fx.go();
    if (reduce) return;
    var c = document.createElement("canvas"), x = c.getContext("2d"), W, H, ps = [], seen = true, run = false;
    var up = s.id === "newyear" || s.id === "junina";
    var cols = { newyear: ["#e9b949", "#a993e6", "#7fb0ff"], carnival: ["#e9b949", "#ee76b4", "#5dd6cf", "#a993e6"], easter: ["#f4b6c9", "#9eddc2", "#f7e08a", "#c9b6ee"], valentine: ["#ff7a95", "#f6b8c8", "#e04e6e"], junina: ["#ffc83d", "#f08a2e", "#ffe08a"], halloween: ["#e8833a", "#c9894a", "#b85a1e", "#5b4a8a"], christmas: ["#cfdbe6", "#ffffff"] }[s.id];
    c.className = "np-season-fx";
    c.setAttribute("aria-hidden", "true");
    hero.prepend(c);
    function size() { var r = Math.min(devicePixelRatio || 1, 2); W = c.width = hero.clientWidth * r; H = c.height = hero.clientHeight * r; }
    function add(any) { return { x: Math.random() * W, y: any ? Math.random() * H : up ? H + 9 : -9, v: (0.35 + Math.random() * 0.6) * H / 800, r: 2 + Math.random() * 3.5, a: Math.random() * 6, c: cols[ps.length % cols.length] }; }
    size();
    for (var i = 0; i < 30; i++) ps.push(add(1));
    addEventListener("resize", size, { passive: true });
    new IntersectionObserver(function (e) { seen = e[0].isIntersecting; go(); }).observe(hero);
    document.addEventListener("visibilitychange", go);
    function live() { return seen && !document.hidden && root.hasAttribute("data-season"); }
    function go() { if (!run && live()) { run = true; requestAnimationFrame(tick); } }
    function tick() {
      if (!live()) { run = false; return; }
      x.clearRect(0, 0, W, H);
      ps.forEach(function (p, i) {
        p.a += 0.02;
        p.y += up ? -p.v : p.v;
        p.x += Math.sin(p.a) * 0.5;
        if (p.y > H + 10 || p.y < -10) ps[i] = p = add(0);
        x.save();
        x.translate(p.x, p.y);
        x.rotate(p.a);
        x.globalAlpha = up ? Math.min(1, p.y / H + 0.2) * 0.8 : 0.7;
        x.fillStyle = p.c;
        x.beginPath();
        if (s.id === "carnival" || s.id === "newyear") x.rect(-p.r, -p.r / 3, p.r * 2, p.r / 1.5);
        else if (s.id === "christmas" || up) x.arc(0, 0, p.r / (up ? 2 : 1.3), 0, 7);
        else x.ellipse(0, 0, p.r * 1.4, p.r / 1.8, 0, 0, 7);
        x.fill();
        x.restore();
      });
      requestAnimationFrame(tick);
    }
    fx.go = go;
    go();
  }

  function ready() {
    var name = label(s.id, br) + " mode", hero = document.querySelector(".np-hero");
    document.querySelectorAll("[data-pico]").forEach(function (el) { el.insertAdjacentHTML("beforeend", imgs("pico", "np-pico-season")); });
    if (hero) {
      hero.insertAdjacentHTML("afterbegin", '<div class="np-season-hero" aria-hidden="true">' + imgs("hero", "") + "</div>");
      if (s.on) fx(hero);
    }
    var el = document.createElement("div");
    el.className = "np-season-chip";
    el.innerHTML = '<span class="np-season-mini" aria-hidden="true">' + imgs("pico", "") + "</span><span>" + name + '</span><button type="button" role="switch" class="np-season-sw"></button>';
    var b = el.querySelector("button");
    b.setAttribute("aria-label", name);
    function sync() { b.setAttribute("aria-checked", String(s.on)); }
    b.onclick = function () {
      s.on = !s.on;
      sync();
      if (s.on) { root.setAttribute("data-season", s.id); if (hero) fx(hero); } else root.removeAttribute("data-season");
      try { if (s.on) store.removeItem("numberparrot:season-off:" + s.id); else store.setItem("numberparrot:season-off:" + s.id, "1"); } catch { /* private mode */ }
    };
    sync();
    document.body.appendChild(el);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready);
  else ready();
})(typeof window !== "undefined" ? window : globalThis);
