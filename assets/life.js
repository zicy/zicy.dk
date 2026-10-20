// Conway's Game of Life rendered as 1/0 glyphs behind the teaser.
(function () {
    var ACCENT = [92, 240, 138]; // #5CF08A
    var CELL = 14;
    var STEP_MS = 110;

    var root = document.querySelector('.tz');
    var el = root && root.querySelector('.tz-canvas');
    if (!el) return;
    var footer = root.querySelector('.tz-bar--bottom');

    var ctx = el.getContext('2d');
    var W = 0, H = 0, dpr = 1, cs = CELL, cols = 0, rows = 0;
    var alive, age, decay, next;
    var gen = 0, pop = 0, lastStep = 0;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function idx(x, y) {
        x = (x + cols) % cols; y = (y + rows) % rows;
        return y * cols + x;
    }
    function seed(density) {
        for (var i = 0; i < alive.length; i++) {
            alive[i] = Math.random() < density ? 1 : 0;
            age[i] = alive[i]; decay[i] = 0;
        }
    }
    function glider(x, y) {
        var g = [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]];
        var fx = Math.random() < 0.5 ? 1 : -1, fy = Math.random() < 0.5 ? 1 : -1;
        g.forEach(function (c) { var i = idx(x + c[0] * fx, y + c[1] * fy); alive[i] = 1; age[i] = 1; });
    }
    function randomGlider() {
        glider(Math.floor(Math.random() * cols), Math.floor(Math.random() * rows));
    }
    function build() {
        cols = Math.max(1, Math.ceil(W / cs)); rows = Math.max(1, Math.ceil(H / cs));
        var n = cols * rows;
        alive = new Uint8Array(n); age = new Uint8Array(n); decay = new Uint8Array(n); next = new Uint8Array(n);
        seed(0.18); gen = 0;
    }
    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = root.clientWidth; H = root.clientHeight;
        el.width = Math.round(W * dpr); el.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        build();
        if (reduce) { for (var s = 0; s < 60; s++) pop = step(); draw(); }
    }
    function step() {
        var p = 0;
        for (var y = 0; y < rows; y++) {
            for (var x = 0; x < cols; x++) {
                var n = alive[idx(x - 1, y - 1)] + alive[idx(x, y - 1)] + alive[idx(x + 1, y - 1)]
                      + alive[idx(x - 1, y)] + alive[idx(x + 1, y)]
                      + alive[idx(x - 1, y + 1)] + alive[idx(x, y + 1)] + alive[idx(x + 1, y + 1)];
                var i = y * cols + x;
                var live = alive[i] ? (n === 2 || n === 3) : n === 3;
                next[i] = live ? 1 : 0;
                if (live) { age[i] = alive[i] ? Math.min(age[i] + 1, 250) : 1; p++; }
                else if (alive[i]) { age[i] = 0; decay[i] = 10; }
                else if (decay[i] > 0) decay[i]--;
            }
        }
        var tmp = alive; alive = next; next = tmp;
        gen++;
        if (gen % 40 === 0) randomGlider();
        if (p < cols * rows * 0.02) { for (var k = 0; k < 6; k++) randomGlider(); }
        return p;
    }
    function draw() {
        ctx.fillStyle = '#08090B'; ctx.fillRect(0, 0, W, H);
        ctx.font = '500 ' + Math.round(cs * 0.86) + 'px "JetBrains Mono", ui-monospace, monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        var fresh = 'rgba(' + ACCENT.join(',') + ',0.9)';
        for (var y = 0; y < rows; y++) {
            for (var x = 0; x < cols; x++) {
                var i = y * cols + x, cx = x * cs + cs / 2, cy = y * cs + cs / 2;
                if (alive[i]) {
                    ctx.fillStyle = age[i] <= 2 ? fresh : 'rgba(230,228,222,' + Math.max(0.28, 0.62 - age[i] * 0.01) + ')';
                    ctx.fillText('1', cx, cy);
                } else if (decay[i] > 0) {
                    ctx.fillStyle = 'rgba(230,228,222,' + (decay[i] * 0.022) + ')';
                    ctx.fillText('0', cx, cy);
                }
            }
        }
        // HUD, kept just above the footer bar so it never overlaps it when the footer wraps
        var by = footer ? footer.getBoundingClientRect().top - root.getBoundingClientRect().top - 9 : H - 52;
        var label = 'gen ' + String(gen).padStart(6, '0') + '  pop ' + String(pop).padStart(5, '0') + '  grid ' + cols + 'x' + rows;
        ctx.font = '400 11px "JetBrains Mono", ui-monospace, monospace';
        ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
        var tw = ctx.measureText(label).width;
        ctx.fillStyle = 'rgba(8,9,11,0.8)';
        ctx.fillRect(W - tw - 32, by - 22, tw + 16, 22);
        ctx.fillStyle = 'rgba(156,154,147,1)';
        ctx.fillText(label, W - 24, by - 5);
    }
    function frame(now) {
        if (now - lastStep > STEP_MS) { pop = step(); lastStep = now; }
        draw();
        requestAnimationFrame(frame);
    }
    function cellAt(e) {
        var r = root.getBoundingClientRect();
        return [Math.floor((e.clientX - r.left) / cs), Math.floor((e.clientY - r.top) / cs)];
    }
    function paint(e) {
        var g = cellAt(e);
        for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) {
            if (dx * dx + dy * dy <= 5 && Math.random() < 0.55) { var i = idx(g[0] + dx, g[1] + dy); alive[i] = 1; age[i] = 1; }
        }
    }
    function onDown(e) {
        var g = cellAt(e);
        glider(g[0], g[1]);
        paint(e);
    }

    resize();
    root.addEventListener('pointermove', paint);
    root.addEventListener('pointerdown', onDown);
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(resize).observe(root);
    else window.addEventListener('resize', resize);

    // Redraw once the web font is ready so the glyphs use JetBrains Mono.
    if (reduce && document.fonts) document.fonts.ready.then(draw);
    if (!reduce) requestAnimationFrame(frame);
})();
