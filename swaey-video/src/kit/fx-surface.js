/* fx-surface (E.FX): the reference film's surfaces and transitions.
     wash            iridescent / thermal-looking soft field (cyan flood, pastel blobs, holo ribbons, full, night)
     thermalImage    photo → thermal gradient map, flowing displacement, pixel-tile glitch + node grid
     thermalFilter / applyThermal   SVG gradient-map filter for DOM
     sunset          the sunset backdrop gradient (+ faint grain)
     colorBars       motion-blurred colour bars that streak in and land on target rects
     collage         stop-motion collage of caller-supplied cards (scatter / condense)
     gridGeom / nodeGrid   lens-compressed white grid with dots at the intersections
     glitchTiles     cream drop-out tiles over any DOM content
     bento           privacy bento on the node grid that keeps re-arranging
     dotMatrix / bigShield   icon matrix on #1d1d1d that flips to lime shields, then the single shield
     macro           B&W macro "photo" (studio mic grille / MacBook speaker grille), procedural WebGL
     shader          drop-in for E.C.Shader that renders through the shared WebGL context

   All WebGL work goes through ONE shared offscreen context (Chrome loses the oldest context past ~16)
   and is copied into a per-component 2D canvas. Everything is a pure function of its inputs. */
(function () {
  const E = window.E;
  const FX = (E.FX = E.FX || {});
  const clamp = E.clamp, lerp = E.lerp;
  const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const stepOf = (t, d) => Math.floor(t / d + 1e-6);
  const H2 = (a, b) => E.hash(a * 12.9898 + b * 78.233);
  (E.ready = E.ready || []);

  /* ------------------------------------------------------------------ CSS */
  E.h("style", "", document.head, `
  .fxs-abs { position: absolute; left: 0; top: 0; }
  .fxs-cv { position: absolute; left: 0; top: 0; display: block; }
  .fxs-collage { position: absolute; overflow: visible; pointer-events: none; }
  .fxs-card { position: absolute; left: 0; top: 0; transform-origin: 0 0; }
  .fxs-card > * { position: absolute !important; left: 0 !important; top: 0 !important; }
  .fxs-grid { position: absolute; overflow: hidden; }
  .fxs-bento { position: absolute; overflow: hidden; font-family: var(--sf); }
  .fxs-tile { position: absolute; left: 0; top: 0; overflow: hidden; }
  .fxs-tc { position: absolute; left: 0; top: 0; transform-origin: 0 0; }
  .fxs-mono { font-family: var(--sf-mono); letter-spacing: 0; }
  .fxs-lt { background: #f7f1eb; color: #141414; }
  .fxs-dk { background: #121212; color: #fff; }
  .fxs-lab { font: 400 10.5px/1 var(--sf-mono); color: #8d8780; white-space: nowrap; }
  .fxs-big { font: 400 46px/1 var(--sf); letter-spacing: -0.035em; white-space: nowrap; }
  .fxs-unit { font: 400 13px/1 var(--sf); letter-spacing: 0; margin-left: 4px; color: #6f6a65; }
  .fxs-bars { display: flex; align-items: flex-end; gap: 0; height: 100%; }
  .fxs-bars i { flex: 1; border: 1px solid #ddd5cd; border-bottom: 0; margin-right: -1px; }
  .fxs-pill { display: flex; align-items: center; height: 100%; padding: 0 9px 0 14px; gap: 8px; background: #fbf8f4; }
  .fxs-circ { width: 26px; height: 26px; border-radius: 50%; background: #111; display: grid; place-items: center; color: #fff; flex: none; }
  .fxs-tag { display: flex; align-items: center; justify-content: center; gap: 9px; height: 100%; background: #0d0d0d; color: #fff; font: 400 17px/1 var(--sf-mono); letter-spacing: .02em; white-space: nowrap; }
  .fxs-code { font: 400 8.6px/1.62 var(--sf-mono); white-space: pre; color: #d8d8d8; }
  .fxs-sun { position: absolute; background: var(--sunset); overflow: hidden; }
  .fxs-sun-g { position: absolute; inset: 0; }
  .fxs-shield path { fill: none; stroke-linecap: round; stroke-linejoin: round; }
  `);

  /* ============================================================ shared WebGL */
  const GLX = { c: null, gl: null, w: 0, h: 0, progs: new Map(), buf: null, dead: false };
  const VERT = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
  const GLSL_COMMON = `
  float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
  float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
    return mix(mix(h21(i),h21(i+vec2(1.,0.)),u.x), mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),u.x), u.y); }
  float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<4;i++){ v+=a*vnoise(p); p=mat2(1.6,1.2,-1.2,1.6)*p; a*=.5; } return v; }
  float fbm3(vec2 p){ float v=0., a=.5; for(int i=0;i<3;i++){ v+=a*vnoise(p); p=mat2(1.6,1.2,-1.2,1.6)*p; a*=.5; } return v*1.143; }
  vec3 hx(float r,float g,float b){ return vec3(r,g,b)/255.; }
  `;
  function glInit() {
    if (GLX.gl || GLX.dead) return GLX.gl;
    GLX.c = document.createElement("canvas");
    GLX.c.width = GLX.c.height = 8;
    const gl = GLX.c.getContext("webgl", { preserveDrawingBuffer: true, premultipliedAlpha: true, alpha: true, antialias: false, depth: false, stencil: false });
    if (!gl) { GLX.dead = true; console.warn("fx-surface: no WebGL"); return null; }
    GLX.gl = gl;
    GLX.deriv = !!gl.getExtension("OES_standard_derivatives");
    GLX.buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, GLX.buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.disable(gl.BLEND); gl.disable(gl.DEPTH_TEST);
    return gl;
  }
  /* make sure the shared buffer can hold a w×h render (called at build time, so no per-frame resize) */
  function glReserve(w, h) {
    const gl = glInit();
    if (!gl) return;
    w = Math.ceil(w); h = Math.ceil(h);
    if (w > GLX.w || h > GLX.h) {
      GLX.w = Math.max(GLX.w, w); GLX.h = Math.max(GLX.h, h);
      GLX.c.width = GLX.w; GLX.c.height = GLX.h;
    }
  }
  function glProg(frag) {
    let P = GLX.progs.get(frag);
    if (P) return P;
    const gl = GLX.gl;
    const sh = (type, src) => {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error("fx-surface shader: " + gl.getShaderInfoLog(s));
      return s;
    };
    const wants = /fwidth|dFdx|dFdy/.test(frag);
    const ext = wants ? (GLX.deriv ? "#extension GL_OES_standard_derivatives : enable\n" : "#define fwidth(x) (0.0)\n#define dFdx(x) (0.0)\n#define dFdy(x) (0.0)\n") : "";
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, ext + "precision highp float;\nuniform vec2 uRes;uniform float uT;\n" + GLSL_COMMON + frag));
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error("fx-surface link: " + gl.getProgramInfoLog(pr));
    P = { pr, loc: gl.getAttribLocation(pr, "p"), u: {} };
    GLX.progs.set(frag, P);
    return P;
  }
  /* render `frag` at cw×ch into the shared buffer, then copy it into ctx (a 2D context of the same size) */
  function glDraw(ctx, cw, ch, frag, t, uni = {}, tex = null) {
    const gl = GLX.gl;
    if (!gl) { ctx.fillStyle = "#ede8e3"; ctx.fillRect(0, 0, cw, ch); return; }
    const P = glProg(frag);
    gl.viewport(0, 0, cw, ch);
    gl.useProgram(P.pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, GLX.buf);
    gl.enableVertexAttribArray(P.loc);
    gl.vertexAttribPointer(P.loc, 2, gl.FLOAT, false, 0, 0);
    const U = (n) => (n in P.u ? P.u[n] : (P.u[n] = gl.getUniformLocation(P.pr, n)));
    gl.uniform2f(U("uRes"), cw, ch);
    gl.uniform1f(U("uT"), t);
    for (const k in uni) {
      const v = uni[k], l = U(k);
      if (l == null) continue;
      if (typeof v === "number") gl.uniform1f(l, v);
      else if (v.length === 2) gl.uniform2f(l, v[0], v[1]);
      else if (v.length === 3) gl.uniform3f(l, v[0], v[1], v[2]);
      else gl.uniform4f(l, v[0], v[1], v[2], v[3]);
    }
    if (tex) {
      const list = Array.isArray(tex) ? tex : [tex];
      list.forEach((tx, i) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, tx); gl.uniform1i(U(i ? "uTex" + i : "uTex"), i); });
      gl.activeTexture(gl.TEXTURE0);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    ctx.globalCompositeOperation = "copy";
    ctx.drawImage(GLX.c, 0, GLX.h - ch, cw, ch, 0, 0, cw, ch);
    ctx.globalCompositeOperation = "source-over";
  }
  /* image → mipmapped POT texture (loaded before the first frame via E.ready) */
  const TEX = new Map();
  function glTexture(src) {
    if (TEX.has(src)) return TEX.get(src);
    const rec = { tex: null, aspect: 16 / 9, img: new Image() };
    rec.ready = new Promise((res) => {
      rec.img.onload = () => {
        const gl = glInit();
        rec.aspect = rec.img.naturalWidth / rec.img.naturalHeight;
        if (gl) {
          const pc = document.createElement("canvas");
          pc.width = 2048; pc.height = 1024;
          pc.getContext("2d").drawImage(rec.img, 0, 0, 2048, 1024);
          const tx = gl.createTexture();
          gl.bindTexture(gl.TEXTURE_2D, tx);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, pc);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
          gl.generateMipmap(gl.TEXTURE_2D);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
          rec.tex = tx;
        }
        res();
      };
      rec.img.onerror = () => { console.warn("fx-surface: could not load " + src); res(); };
    });
    rec.img.src = src;
    E.ready.push(() => rec.ready);
    TEX.set(src, rec);
    return rec;
  }
  /* 1D palette texture (256×1, mipmapped) from colour stops; cyclic ramps wrap (REPEAT). Lookups through it
     are cheap and the mip chain anti-aliases narrow bands for free. */
  const RAMPTEX = new Map();
  function glRamp(hexes, cyclic) {
    const k = hexes.join() + cyclic;
    if (RAMPTEX.has(k)) return RAMPTEX.get(k);
    const gl = glInit();
    if (!gl) return null;
    const c = document.createElement("canvas"); c.width = 256; c.height = 1;
    const x = c.getContext("2d"), g = x.createLinearGradient(0, 0, 256, 0);
    const n = cyclic ? hexes.length : hexes.length - 1;
    hexes.forEach((h, i) => g.addColorStop(i / n, h));
    if (cyclic) g.addColorStop(1, hexes[0]);
    x.fillStyle = g; x.fillRect(0, 0, 256, 1);
    const tx = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tx);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, cyclic ? gl.REPEAT : gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    RAMPTEX.set(k, tx);
    return tx;
  }
  /* a 2D canvas showing a shader at `scale` resolution, CSS-sized to w×h */
  function glLayer(parent, w, h, scale, cls = "fxs-cv") {
    const c = E.h("canvas", cls, parent);
    c.width = Math.max(2, Math.round(w * scale)); c.height = Math.max(2, Math.round(h * scale));
    E.css(c, { width: w + "px", height: h + "px" });
    glReserve(c.width, c.height);
    return { c, ctx: c.getContext("2d") };
  }
  FX._gl = GLX;

  /* Drop-in for E.C.Shader (same frag conventions: uRes, uT; plus h21/vnoise/fbm/hx helpers),
     rendered through the shared context: new-context-free. */
  FX.shader = (parent, w, h, frag, { scale = 0.5 } = {}) => {
    const L = glLayer(parent, w, h, scale);
    let key = "";
    return {
      el: L.c, c: L.c,
      render(t, uni = {}) {
        const k = t + JSON.stringify(uni);
        if (k === key) return; key = k;
        glDraw(L.ctx, L.c.width, L.c.height, frag, t, uni);
      },
    };
  };

  /* ================================================================== wash */
  const PAL = { cyan: 0, full: 1, pastel: 2, ribbons: 3, holo: 3, night: 4 };
  const FRAG_WASH = `
  uniform float uPal, uFlow, uZoom, uSeed, uCover, uAlpha;
  uniform vec2 uFrom;
  float field(vec2 q, float t){
    vec2 w = vec2(fbm3(q*1.15 + vec2(0.0, t*0.10)), fbm3(q*1.15 + vec2(5.2, 1.3) - vec2(t*0.08, 0.0)));
    return fbm(q*0.85 + (w - 0.5)*2.4 + vec2(t*0.05, -t*0.035));
  }
  vec3 ramp4(float x, vec3 a, vec3 b, vec3 c, vec3 d){
    x = clamp(x, 0., 1.)*3.;
    return x < 1. ? mix(a, b, smoothstep(0.,1.,x)) : x < 2. ? mix(b, c, smoothstep(1.,2.,x)) : mix(c, d, smoothstep(2.,3.,x));
  }
  float sheet(vec2 q, float t){
    vec2 w = vec2(fbm3(q*0.9 + vec2(1.7, t*0.05)), fbm3(q*0.9 + vec2(8.3, -t*0.04)));
    float f = fbm3(q + (w - 0.5)*1.5);
    return f + 0.13*smoothstep(0.45, 0.56, f) + 0.08*smoothstep(0.6, 0.68, f);
  }
  vec3 cyc6(float x, vec3 a, vec3 b, vec3 c, vec3 d, vec3 e, vec3 f){
    x = fract(x)*6.; float s = smoothstep(0.,1.,fract(x)); float i = floor(x);
    return i < 1. ? mix(a,b,s) : i < 2. ? mix(b,c,s) : i < 3. ? mix(c,d,s) : i < 4. ? mix(d,e,s) : i < 5. ? mix(e,f,s) : mix(f,a,s);
  }
  void main(){
    vec2 uv = gl_FragCoord.xy/uRes; uv.y = 1.-uv.y;
    float ar = uRes.x/uRes.y;
    vec2 p = (uv-0.5)*vec2(ar,1.)/uZoom + vec2(uSeed*7.13, uSeed*3.71);
    float t = uT*uFlow;
    vec3 cream = hx(237.,232.,227.);
    vec3 col;
    float v;
    if (uPal < 0.5) {            // cyan flood (ref f_0073-0075)
      v = field(p*vec2(1.05, 1.55), t);
      float vn = clamp((v-0.5)*2.5+0.5, 0., 1.);
      col = vn < 0.3 ? mix(hx(200.,246.,244.), hx(178.,236.,248.), smoothstep(0.,0.3,vn))
          : vn < 0.6 ? mix(hx(178.,236.,248.), hx(166.,214.,245.), smoothstep(0.3,0.6,vn))
          : vn < 0.85 ? mix(hx(166.,214.,245.), hx(178.,182.,238.), smoothstep(0.6,0.85,vn))
          : mix(hx(178.,182.,238.), hx(196.,176.,236.), smoothstep(0.85,1.,vn));
      float w2 = fbm3(p*0.8 + vec2(9.1, 2.7) + t*0.04);
      col = mix(col, hx(249.,236.,200.), smoothstep(0.64, 0.8, w2)*0.85);
      col = mix(col, hx(247.,214.,196.), smoothstep(0.7, 0.86, w2)*smoothstep(0.55, 0.8, vn)*0.6);
    } else if (uPal < 1.5) {     // full: saturated thermal iridescence
      v = field(p*vec2(1.1, 1.7), t);
      float vn = (v-0.5)*2.4;
      col = cyc6(vn*0.9 + 0.35 + 0.15*fbm3(p*2.0 - t*0.05), hx(255.,154.,77.), hx(255.,201.,163.), hx(255.,246.,220.), hx(159.,230.,255.), hx(246.,179.,230.), hx(255.,166.,120.));
    } else if (uPal < 2.5) {     // pastel blobs on cream (ref f_0378-0386): discrete, soft, x-stretched
      vec2 q = p*vec2(2.5, 5.6);
      vec2 w = vec2(vnoise(q*0.55 + vec2(0.0, t*0.06)), vnoise(q*0.55 + vec2(4.2, 1.1) - vec2(t*0.05, 0.)));
      vec2 qq = q + (w - 0.5)*0.8 + vec2(t*0.05, -t*0.02);
      v = vnoise(qq)*0.72 + vnoise(qq*2.03 + 5.1)*0.28;
      float w2 = fbm3(p*1.9 + vec2(3.3, 8.1) + t*0.03);
      float d = clamp((v - 0.56)/0.3, 0., 1.);
      vec3 b = d < 0.22 ? mix(cream, hx(246.,176.,110.), smoothstep(0.,0.22,d))
             : d < 0.45 ? mix(hx(246.,176.,110.), hx(240.,186.,204.), smoothstep(0.22,0.45,d))
             : d < 0.7 ? mix(hx(240.,186.,204.), hx(200.,200.,238.), smoothstep(0.45,0.7,d))
             : mix(hx(200.,200.,238.), hx(180.,226.,242.), smoothstep(0.7,1.,d));
      vec3 b2 = d < 0.5 ? mix(cream, hx(200.,216.,240.), smoothstep(0.,0.5,d)) : mix(hx(200.,216.,240.), hx(178.,226.,240.), smoothstep(0.5,1.,d));
      b = mix(b, b2, smoothstep(0.5, 0.7, w2)*0.8);
      col = mix(cream, b, smoothstep(0.0, 0.3, d)*0.8);
      col = mix(col, hx(228.,221.,215.), 0.1);
    } else if (uPal < 3.5) {     // holographic silk (ref f_0195-0205): white sheet, thin-film colour on the folds
      vec2 q = p*vec2(0.55, 1.1) + vec2(uSeed*1.7, 0.);
      float tt = t*0.8;
      float h = sheet(q, tt);
      float e = 0.004;
      vec2 g = vec2(sheet(q + vec2(e, 0.), tt) - sheet(q - vec2(e, 0.), tt), sheet(q + vec2(0., e), tt) - sheet(q - vec2(0., e), tt))/(2.*e);
      float gl = length(g);
      float hb = fbm3(q*0.7 + vec2(2.0, 7.0) + t*0.02);
      vec3 base = mix(hx(247.,243.,238.), hx(226.,242.,240.), smoothstep(0.45, 0.72, hb));
      float m = smoothstep(0.3, 1.25, gl);
      float s = gl*0.2 + dot(g/max(gl, 1e-3), vec2(0.55, 0.83))*0.1 + h*0.8 + t*0.01;
      vec3 film = cyc6(s, hx(250.,250.,247.), hx(255.,196.,150.), hx(250.,160.,110.), hx(244.,176.,214.), hx(168.,182.,246.), hx(160.,228.,246.));
      col = mix(base, film, m*0.85);
      // glossy white crest just above each crease
      col = mix(col, vec3(1.), smoothstep(1.4, 2.6, gl)*0.3);
      v = h;
    } else {                     // night: barely-there dark iridescence for dark stages
      v = field(p*vec2(1.0, 1.6), t);
      float vn = clamp((v-0.5)*2.2+0.5, 0., 1.);
      col = ramp4(vn, hx(29.,29.,29.), hx(24.,30.,44.), hx(44.,28.,40.), hx(52.,34.,30.));
      cream = hx(29.,29.,29.);
    }
    col += (h21(gl_FragCoord.xy + fract(uT)*91.) - 0.5)/255.*2.;   // dither
    float a = uAlpha;
    if (uCover < 0.999) {
      float c = mix(-0.6, 1.25, uCover) - 0.45*length((uv - uFrom)*vec2(ar*0.7, 1.)) + (v - 0.5)*1.1;
      a *= smoothstep(0.0, 0.22, c);
    }
    gl_FragColor = vec4(col*a, a);
  }`;
  /* wash(parent, w, h, { palette: 'cyan'|'full'|'pastel'|'ribbons'|'night', scale = .25, seed, x, y })
     → { el, render(t, { alpha = 1, flow = 1, zoom = 1, cover = 1, from = [.5,.5] }) }
     cover < 1 floods the field in from `from` (uv 0..1) along the blob shapes (transparent elsewhere). */
  FX.wash = (parent, w = E.W, h = E.H, o = {}) => {
    const pal = PAL[o.palette || "pastel"] ?? 2;
    const L = glLayer(parent, w, h, o.scale ?? (pal === 3 ? 0.33 : 0.25));
    E.css(L.c, { left: (o.x || 0) + "px", top: (o.y || 0) + "px" });
    const seed = o.seed ?? 1;
    let key = "";
    return {
      el: L.c,
      render(t, s = {}) {
        const u = { uPal: pal, uFlow: s.flow ?? 1, uZoom: s.zoom ?? 1, uSeed: seed, uCover: clamp(s.cover ?? 1), uAlpha: clamp(s.alpha ?? 1), uFrom: s.from || [0.5, 0.5] };
        const k = t.toFixed(4) + JSON.stringify(u);
        if (k === key) return; key = k;
        if (u.uAlpha <= 0.001 || u.uCover <= 0.001) { L.ctx.clearRect(0, 0, L.c.width, L.c.height); return; }
        glDraw(L.ctx, L.c.width, L.c.height, FRAG_WASH, t, u);
      },
    };
  };

  /* ============================================================ grid geometry */
  /* Lines spaced geometrically away from a focus line (a lens-like compression toward the edges, as in
     the reference bento): line k sits at f ± s0·(1 − r^k)/(1 − r). Same maths in GLSL (gcoord) so
     shader tiles line up with canvas lines. */
  function axisLines(f, s0, r, lo, hi, minStep) {
    const out = [f];
    for (const dir of [1, -1]) {
      for (let k = 1; k < 200; k++) {
        const d = (s0 * (1 - Math.pow(r, k))) / (1 - r);
        const st = s0 * Math.pow(r, k - 1);
        const x = f + dir * d;
        if (st < minStep || x > hi + st || x < lo - st) break;
        out.push(x);
      }
    }
    return out.sort((a, b) => a - b);
  }
  /* gridGeom(w, h, { fx, fy, cell, cellY, rx, ry, min }) → { xs, ys, i0, j0, x(k), y(k), rect(c0, r0, cw, rh) }
     indices are relative to the focus lines (k = 0 is the line through fx / fy). */
  FX.gridGeom = (w, h, o = {}) => {
    const g = {
      w, h, fx: o.fx ?? w * 0.22, fy: o.fy ?? h * 0.17, sx: o.cell ?? w * 0.13, sy: o.cellY ?? (o.cell ?? w * 0.13) * 0.68,
      rx: o.rx ?? 0.885, ry: o.ry ?? 0.84, min: o.min ?? 5.5,
    };
    g.xs = axisLines(g.fx, g.sx, g.rx, 0, w, g.min);
    g.ys = axisLines(g.fy, g.sy, g.ry, 0, h, g.min);
    g.i0 = g.xs.indexOf(g.fx); g.j0 = g.ys.indexOf(g.fy);
    const at = (f, s0, r, k) => f + Math.sign(k) * (s0 * (1 - Math.pow(r, Math.abs(k)))) / (1 - r);
    g.x = (k) => at(g.fx, g.sx, g.rx, k);
    g.y = (k) => at(g.fy, g.sy, g.ry, k);
    g.rect = (c0, r0, cw = 1, rh = 1) => { const x = g.x(c0), y = g.y(r0); return { x, y, w: g.x(c0 + cw) - x, h: g.y(r0 + rh) - y }; };
    g.uni = (scale = 1) => ({ uGx: [g.fx * scale, g.sx * scale, g.rx, 0], uGy: [g.fy * scale, g.sy * scale, g.ry, 0] });
    return g;
  };

  /* dot sprites (no shadowBlur per frame) */
  const SPR = {};
  function dotSprite(r, glow) {
    const k = r.toFixed(1) + "|" + glow;
    if (SPR[k]) return SPR[k];
    const pad = Math.ceil(glow ? r * 2.2 : 2), s = Math.ceil(r * 2 + pad * 2);
    const c = document.createElement("canvas"); c.width = c.height = s;
    const x = c.getContext("2d");
    if (glow) {
      const g = x.createRadialGradient(s / 2, s / 2, r * 0.6, s / 2, s / 2, s / 2);
      g.addColorStop(0, "rgba(255,255,255,.55)"); g.addColorStop(1, "rgba(255,255,255,0)");
      x.fillStyle = g; x.fillRect(0, 0, s, s);
    }
    x.fillStyle = "#fff"; x.beginPath(); x.arc(s / 2, s / 2, r, 0, Math.PI * 2); x.fill();
    return (SPR[k] = { c, s });
  }

  /* ================================================================ nodeGrid */
  /* nodeGrid(parent, w, h, { cell, cellY, rx, ry, fx, fy, bg, line, split, x, y })
     → { el, below, mid, lines, dots, geom, render(p, { fx, fy, marks, alpha, t }) }
     p 0..1 draws the lines in from the focus outward; dots pop in when both of their lines have passed.
     marks: [[c, r], ...] grid indices (relative to focus) that get the big glowing node dots.
     Layer order inside el: bg · below (slot) · lines canvas · mid (slot) · dots canvas (split: true; otherwise the
     dots share the lines canvas and `mid` sits above both). */
  FX.nodeGrid = (parent, w = E.W, h = E.H, o = {}) => {
    const el = E.h("div", "fxs-grid", parent);
    E.css(el, { left: (o.x || 0) + "px", top: (o.y || 0) + "px", width: w + "px", height: h + "px" });
    if (o.bg !== false) el.style.background = o.bg || "#e2dbd4";
    const below = E.h("div", "fxs-abs", el);
    const lc = E.h("canvas", "fxs-cv", el); lc.width = w; lc.height = h;
    const mid = E.h("div", "fxs-abs", el);
    // one canvas unless content must sit between the lines and the node dots (split: true, used by bento)
    let dc = lc;
    if (o.split) { dc = E.h("canvas", "fxs-cv", el); dc.width = w; dc.height = h; }
    const lx = lc.getContext("2d"), dx = dc.getContext("2d");
    const base = { cell: o.cell, cellY: o.cellY, rx: o.rx, ry: o.ry, min: o.min, fx: o.fx, fy: o.fy };
    let geom = FX.gridGeom(w, h, base), key = "";
    const lineW = o.line ?? 2;
    const self = {
      el, below, mid, lines: lc, dots: dc, get geom() { return geom; },
      setGeom(g) { geom = g; key = ""; },
      render(p = 1, s = {}) {
        if ((s.fx != null && s.fx !== geom.fx) || (s.fy != null && s.fy !== geom.fy) || s.cell != null) {
          geom = FX.gridGeom(w, h, Object.assign({}, base, { fx: s.fx ?? geom.fx, fy: s.fy ?? geom.fy, cell: s.cell ?? base.cell }));
        }
        const marks = s.marks || [];
        const k = p.toFixed(4) + "|" + geom.fx + "|" + geom.fy + "|" + JSON.stringify(marks) + (s.alpha ?? 1);
        if (k === key) return geom; key = k;
        el.style.opacity = s.alpha ?? 1;
        const { xs, ys, i0, j0, fx, fy } = geom;
        lx.clearRect(0, 0, w, h); dx.clearRect(0, 0, w, h);
        const ni = Math.max(i0, xs.length - 1 - i0), nj = Math.max(j0, ys.length - 1 - j0);
        // reach (0..1) of each line from the focus outward
        const ext = (idx, n) => clamp((p * 1.55 - 0.55 * (Math.abs(idx) / Math.max(1, n))) / 0.7);
        const ev = xs.map((_, i) => E.ease.outCubic(ext(i - i0, ni)));
        const eh = ys.map((_, j) => E.ease.outCubic(ext(j - j0, nj)));
        lx.fillStyle = "rgba(255,255,255,.92)";
        const lw = lineW, hw = lw / 2;
        xs.forEach((x, i) => {
          const e = ev[i]; if (e <= 0) return;
          const up = fy * e, dn = (h - fy) * e;
          lx.fillRect(x - hw, fy - up, lw, up + dn);
        });
        ys.forEach((y, j) => {
          const e = eh[j]; if (e <= 0) return;
          const l = fx * e, r = (w - fx) * e;
          lx.fillRect(fx - l, y - hw, l + r, lw);
        });
        // node dots
        const big = new Set(marks.map(([c, r]) => (c + i0) + "," + (r + j0)));
        for (let i = 0; i < xs.length; i++) {
          const cwid = Math.min(xs[i + 1] ?? w, w) - xs[i];
          for (let j = 0; j < ys.length; j++) {
            const x = xs[i], y = ys[j];
            const reachV = Math.abs(y - fy) <= (y < fy ? fy : h - fy) * ev[i] + 0.5;
            const reachH = Math.abs(x - fx) <= (x < fx ? fx : w - fx) * eh[j] + 0.5;
            if (!reachV || !reachH) continue;
            const cell = Math.min(cwid, (ys[j + 1] ?? h) - y, x - (xs[i - 1] ?? 0) + 1, y - (ys[j - 1] ?? 0) + 1);
            const isBig = big.has(i + "," + j);
            let r = isBig ? 8.5 : clamp(cell * 0.026, 1.5, 4.2);
            if (!isBig && H2(i * 3.1, j * 1.7) > 0.93 && cell > 60) r = 5;
            const pop = p >= 1 ? 1 : E.ease.outBack(clamp(Math.min(ev[i], eh[j]) * 1.3 - 0.2));
            if (pop <= 0.02) continue;
            const sp = dotSprite(Math.round(r * 2) / 2, isBig || r >= 5);
            const d = sp.s * pop;
            dx.drawImage(sp.c, x - d / 2, y - d / 2, d, d);
          }
        }
        return geom;
      },
    };
    return self;
  };

  /* ============================================================== glitchTiles */
  /* glitchTiles(parent, w, h, { geom, color, seed, region: {x, y, w, h} }) → { el, render(t, amount, { step, geom }) }
     Cream drop-out rectangles snapped to the grid cells (w×h is the grid's space, normally the stage). Lay it over
     any DOM content (e.g. the tooltip button) so it breaks up with thermalImage's glitch; pass `region` (in the
     same space) to keep the canvas small — only that area is covered. */
  FX.glitchTiles = (parent, w = E.W, h = E.H, o = {}) => {
    const R = o.region || { x: 0, y: 0, w, h };
    const c = E.h("canvas", "fxs-cv", parent); c.width = Math.ceil(R.w); c.height = Math.ceil(R.h);
    E.css(c, { left: (o.x || 0) + R.x + "px", top: (o.y || 0) + R.y + "px" });
    const x = c.getContext("2d");
    const seed = o.seed ?? 3;
    let key = "";
    return {
      el: c,
      render(t, amount = 0, s = {}) {
        const g = s.geom || o.geom || FX.gridGeom(w, h);
        const st = s.step ?? stepOf(t, 1 / 12);
        const k = st + "|" + amount.toFixed(3) + "|" + g.fx + "|" + g.fy;
        if (k === key) return; key = k;
        x.clearRect(0, 0, c.width, c.height);
        if (amount <= 0) return;
        x.fillStyle = o.color || "#e4ded8";
        for (let j = 0; j < g.ys.length - 1; j++) {
          if (g.ys[j + 1] < R.y || g.ys[j] > R.y + R.h) continue;
          let i = 0;
          while (i < g.xs.length - 1) {
            const span = 1 + Math.floor(H2(j + seed, st * 1.3) * 3);
            const i1 = Math.min(i + span, g.xs.length - 1);
            const r = H2(i * 7.1 + seed, j * 3.3 + st * 0.71);
            if (r < amount * 0.85 && g.xs[i1] >= R.x && g.xs[i] <= R.x + R.w) x.fillRect(g.xs[i] - R.x, g.ys[j] - R.y, g.xs[i1] - g.xs[i], g.ys[j + 1] - g.ys[j]);
            i += span;
          }
        }
      },
    };
  };

  /* ================================================================= thermal */
  /* SVG gradient-map filters for DOM. ramp 'thermal': navy → blue → cyan → white → pink → orange;
     'pastel': the reference's cyclic cyan/white/orange/pink map. */
  const RAMPS = {
    thermal: ["#121d4f", "#2a55d6", "#6fc3ff", "#a6ecff", "#f8f7ee", "#f6b3e6", "#ff9a4d"],
    pastel: ["#b0e3f9", "#c4fafa", "#eef5d6", "#f9bb7a", "#f99e52", "#f5b292", "#f4b8cc", "#cbcfee", "#b0e3f9", "#eef5d6", "#f99e52"],
  };
  const RAMP_PASTEL_TH = ["#b0e3f9", "#c4fafa", "#eef5d6", "#f9bb7a", "#f99e52", "#f5b292", "#f4b8cc", "#cbcfee"];
  let svgDefs = null, filtN = 0;
  function defs() {
    if (svgDefs) return svgDefs;
    const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("width", "0"); s.setAttribute("height", "0");
    s.style.position = "absolute";
    s.innerHTML = "<defs></defs>";
    document.body.appendChild(s);
    return (svgDefs = s.firstChild);
  }
  const tableOf = (hexes, ch) => hexes.map((hx) => (parseInt(hx.slice(1 + ch * 2, 3 + ch * 2), 16) / 255).toFixed(3)).join(" ");
  /* thermalFilter({ ramp: 'thermal'|'pastel'|[hex...], id }) → filter id; injected once per ramp */
  FX.thermalFilter = (o = {}) => {
    const hexes = Array.isArray(o.ramp) ? o.ramp : RAMPS[o.ramp || "thermal"];
    const id = o.id || "fxs-thermal-" + (Array.isArray(o.ramp) ? "c" + filtN++ : o.ramp || "thermal");
    if (document.getElementById(id)) return id;
    const f = document.createElementNS("http://www.w3.org/2000/svg", "filter");
    f.setAttribute("id", id);
    f.setAttribute("color-interpolation-filters", "sRGB");
    f.innerHTML = `<feColorMatrix in="SourceGraphic" type="matrix" values="0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0" result="l"/>
      <feComponentTransfer in="l" result="m"><feFuncR type="table" tableValues="${tableOf(hexes, 0)}"/><feFuncG type="table" tableValues="${tableOf(hexes, 1)}"/><feFuncB type="table" tableValues="${tableOf(hexes, 2)}"/></feComponentTransfer>
      <feComposite class="fxs-mixc" in="m" in2="SourceGraphic" operator="arithmetic" k1="0" k2="1" k3="0" k4="0"/>`;
    defs().appendChild(f);
    return id;
  };
  /* applyThermal(el, on, { ramp }) — on: true/false or 0..1 (a per-element filter copy is made for partial mixes).
     Note: CSS/SVG filters re-rasterise the element every frame: fine for a card, avoid on full-screen DOM. */
  FX.applyThermal = (el, on = true, o = {}) => {
    const amt = on === true ? 1 : on === false ? 0 : clamp(on);
    if (amt <= 0.001) { if (el.style.filter) el.style.filter = ""; return; }
    let id;
    if (amt >= 0.999) id = FX.thermalFilter(o);
    else {
      if (!el._fxsF) {
        el._fxsF = FX.thermalFilter({ ramp: (Array.isArray(o.ramp) ? o.ramp : RAMPS[o.ramp || "thermal"]).slice(), id: "fxs-th-el" + filtN++ });
        el._fxsC = document.getElementById(el._fxsF).querySelector(".fxs-mixc");
      }
      id = el._fxsF;
      el._fxsC.setAttribute("k2", amt.toFixed(3)); el._fxsC.setAttribute("k3", (1 - amt).toFixed(3));
    }
    const f = `url(#${id})`;
    if (el.style.filter !== f) el.style.filter = f;
  };

  const FRAG_THERMAL = `
  uniform sampler2D uTex;
  uniform sampler2D uTex1;            // gradient-map ramp (256×1)
  uniform float uImgA, uMix, uZoom, uFlow, uGlitch, uStep, uSeed, uRamp, uScale, uCyc, uOff;
  uniform vec2 uPan;
  uniform vec4 uGx, uGy;
  float gcoord(float x, vec4 g){ float d = x - g.x; float a = max(1. - abs(d)*(1.-g.z)/g.y, 1e-4); return sign(d)*log(a)/log(g.z); }
  float gpos(float k, vec4 g){ return g.x + sign(k)*g.y*(1.-pow(g.z, abs(k)))/(1.-g.z); }
  vec3 pal(float x){ return texture2D(uTex1, vec2(x, 0.5)).rgb; }
  float luma(vec3 c){ return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
  vec2 imgUV(vec2 px){              // px in CSS px → cover-fit image uv (y up for the flipped texture)
    vec2 r = uRes/uScale; float ca = r.x/r.y;
    vec2 uv = px/r;
    uv = (uv - 0.5)/uZoom;
    if (ca > uImgA) uv.y *= uImgA/ca; else uv.x *= ca/uImgA;
    uv += 0.5 + uPan;
    return vec2(uv.x, 1.-uv.y);
  }
  vec3 thermalAt(vec2 px, float t, float blur, float off){
    vec2 q = px/uRes.y*uScale;
    vec2 disp = (vec2(vnoise(q*3.1 + vec2(0., t*0.21)) + 0.5*vnoise(q*6.3 + vec2(2.0, t*0.3)), vnoise(q*3.1 + vec2(4.1, -t*0.17)) + 0.5*vnoise(q*6.3 + vec2(7.0, -t*0.25)))/1.5 - 0.5)*0.035*uFlow;
    vec2 uv = imgUV(px) + disp;
    float L = luma(texture2D(uTex, uv, 0.9 + blur).rgb);
    float Lb = luma(texture2D(uTex, uv, 4.5 + blur).rgb);
    float det = L + (L - Lb)*1.3;
    if (uRamp > 0.5) return pal(det + 0.05*(vnoise(q*5.0 + t*0.3) - 0.5));
    float idx = det*uCyc + 0.30*(fbm3(q*2.6 + vec2(t*0.08, -t*0.05)) - 0.5) + 0.05*(vnoise(q*11. + vec2(t*0.35, t*0.2)) - 0.5)
              + uOff + off + t*0.02*uFlow;
    return pal(idx);
  }
  void main(){
    vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y)/uScale;     // CSS px, y down
    float t = uT;
    float g = uGlitch;
    float blur = g*2.8;
    vec3 col = thermalAt(px, t, blur, 0.);
    if (uMix < 0.999) col = mix(texture2D(uTex, imgUV(px), 0.).rgb, col, uMix);
    vec3 cream = hx(228.,222.,216.);
    if (g > 0.001) {
      float cu = gcoord(px.x, uGx), cv = gcoord(px.y, uGy);
      vec2 ci = floor(vec2(cu, cv));
      float rowH = 1. + step(0.55, h21(vec2(floor(ci.y*0.5), uStep*1.7 + 3.1 + uSeed)));
      float aj = floor(ci.y/rowH)*rowH;
      float span = 1. + floor(h21(vec2(aj, uStep + 9.3 + uSeed))*3.);
      float off = floor(h21(vec2(aj, uStep + 2.1))*span);
      float ai = floor((ci.x + off)/span)*span - off;
      vec2 tid = vec2(ai, aj);
      float rnd = h21(tid + vec2(uStep*0.37, uStep*0.71) + uSeed);
      float kind = h21(tid*1.31 + vec2(uStep*0.11, 7.7));
      // tile rect in px
      vec2 a0 = vec2(gpos(ai, uGx), gpos(aj, uGy)), a1 = vec2(gpos(ai + span, uGx), gpos(aj + rowH, uGy));
      vec2 lc = (px - a0)/max(a1 - a0, vec2(1.));
      vec3 bg = mix(col, cream, smoothstep(0.62, 0.95, g)*0.92);
      col = bg;
      if (rnd < g*1.15) {
        float drop = smoothstep(0.15, 0.85, g);                          // later: more cream drop-outs
        if (kind < 0.30 - drop*0.12) {                                   // magnified, shifted piece
          vec2 c = (a0 + a1)*0.5;
          vec2 sp = c + (px - c)*0.45 + (vec2(h21(tid+3.), h21(tid+5.)) - 0.5)*260.;
          col = thermalAt(sp, t, blur*0.6, 0.35);
        } else if (kind < 0.46 - drop*0.1) {                             // flat mosaic block
          col = thermalAt((a0 + a1)*0.5, t, 3.0, 0.15);
        } else if (kind < 0.82) {                                        // cream drop-out with thermal remnants
          vec3 r = thermalAt(px*0.7 + 90., t, 1.5, 0.0);
          float hot = smoothstep(0.62, 0.42, abs(luma(r) - 0.70)*5.)*smoothstep(0.85, 0.35, luma(r));
          float orange = smoothstep(0.08, 0.0, abs(fract(gcoord(px.x*0.5, uGx)*0.0 + luma(r)*3.3) - 0.45) - 0.05);
          col = mix(cream, mix(hx(246.,178.,92.), hx(242.,200.,170.), lc.y*0.5), clamp(orange*0.85, 0., 1.)*(1. - g*0.3));
        } else {
          col = cream;
        }
      } else if (g > 0.6 && rnd > 0.985) {
        col = thermalAt(px, t, 3.5, 0.2);                                // a few surviving blurred windows
      }
    }
    col += (h21(gl_FragCoord.xy + fract(t)*73.) - 0.5)/255.*2.;
    gl_FragColor = vec4(col, 1.);
  }`;
  /* thermalImage(parent, w, h, { src = 'assets/wp/sonoma.jpg', scale = .5, seed, ramp: 'pastel'|'classic', cycles, grid: {cell, rx, ry, fx, fy} })
     → { el, canvas, grid (nodeGrid overlay), geom, render(t, { mix, zoom, flow, glitch, grid, pan, step, offset }) }
       mix 0 photo … 1 thermal · zoom ≥ 1 push-in · flow 0..1 heat shimmer + band drift · glitch 0..1 pixel-tile
       break-up into cream · grid 0..1 draws the white node grid over it (same cells as the tiles) · pan [u,v] */
  FX.thermalImage = (parent, w = E.W, h = E.H, o = {}) => {
    const el = E.h("div", "fxs-abs", parent);
    E.css(el, { left: (o.x || 0) + "px", top: (o.y || 0) + "px", width: w + "px", height: h + "px", overflow: "hidden" });
    const scale = o.scale ?? 0.5;
    const L = glLayer(el, w, h, scale);
    const tex = glTexture(o.src || "assets/wp/sonoma.jpg");
    const grid = FX.nodeGrid(el, w, h, Object.assign({ bg: false, fx: w / 2, fy: h / 2, cell: w * 0.118, cellY: w * 0.082, rx: 0.86, ry: 0.8 }, o.grid || {}));
    const seed = o.seed ?? 2;
    const classic = o.ramp === "classic";
    const ramp = glRamp(Array.isArray(o.ramp) ? o.ramp : classic ? RAMPS.thermal : RAMP_PASTEL_TH, !classic);
    let key = "";
    return {
      el, canvas: L.c, grid, get geom() { return grid.geom; },
      render(t, s = {}) {
        const g = clamp(s.glitch ?? 0);
        const st = s.step ?? stepOf(t, 1 / 12);
        const gu = grid.geom.uni(1);
        const u = {
          uImgA: tex.aspect, uMix: clamp(s.mix ?? 1), uZoom: s.zoom ?? 1, uFlow: s.flow ?? 1, uGlitch: g, uStep: st % 997,
          uSeed: seed, uRamp: classic ? 1 : 0, uScale: scale, uCyc: o.cycles ?? 2.1, uOff: s.offset ?? 0,
          uPan: s.pan || [0, 0], uGx: gu.uGx, uGy: gu.uGy,
        };
        const k = t.toFixed(4) + JSON.stringify(u);
        if (k !== key) { key = k; if (tex.tex) glDraw(L.ctx, L.c.width, L.c.height, FRAG_THERMAL, t, u, [tex.tex, ramp]); }
        const gp = clamp(s.grid ?? 0);
        grid.el.style.display = gp > 0 ? "" : "none";
        if (gp > 0) grid.render(gp, { marks: s.marks });
      },
    };
  };

  /* ================================================================= sunset */
  let grainURL = null;
  function grain() {
    if (grainURL) return grainURL;
    const c = document.createElement("canvas"); c.width = c.height = 192;
    const x = c.getContext("2d"), id = x.createImageData(192, 192), r = E.rng(77);
    for (let i = 0; i < id.data.length; i += 4) {
      const v = r(); const on = v > 0.5 ? 255 : 0;
      id.data[i] = id.data[i + 1] = id.data[i + 2] = on; id.data[i + 3] = Math.round(Math.abs(v - 0.5) * 2 * 120);
    }
    x.putImageData(id, 0, 0);
    return (grainURL = c.toDataURL());
  }
  /* sunset(parent, w, h, { grain = .5, x, y }) → { el, render(t) } — the tokens' --sunset backdrop; render(t) just moves the grain */
  FX.sunset = (parent, w = E.W, h = E.H, o = {}) => {
    const el = E.h("div", "fxs-sun", parent);
    E.css(el, { left: (o.x || 0) + "px", top: (o.y || 0) + "px", width: w + "px", height: h + "px" });
    const amt = o.grain ?? 0.5;
    let g = null;
    if (amt > 0) {
      g = E.h("div", "fxs-sun-g", el);
      E.css(g, { backgroundImage: `url(${grain()})`, backgroundSize: "192px 192px", opacity: (0.09 * amt).toFixed(3) });
    }
    let last = -1;
    return {
      el,
      render(t = 0) {
        if (!g) return;
        const f = stepOf(t, 1 / 24);
        if (f === last) return; last = f;
        g.style.backgroundPosition = `${Math.round(E.hash(f) * 192)}px ${Math.round(E.hash(f + 0.37) * 192)}px`;
      },
    };
  };

  /* ================================================================ colorBars */
  const BAR_GRADS = [
    ["#f3b2e6", "#ff9a4d"], ["#ff9a4d", "#fff1e6", "#b8e2ff"], ["#d5c2ff", "#f6b3e6"], ["#ffbe8f", "#ff8f50"],
    ["#f6b3e6", "#ffc9a3", "#ff9a4d"], ["#b8e2ff", "#fdf0f6", "#efb6ee"], ["#ff9a4d", "#f6b3e6"], ["#ffcfa8", "#fff4ec", "#cfd0ff"],
  ];
  function mkCanvas(w, h) { const c = document.createElement("canvas"); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
  function fillGrad(x, w, colors) {
    const g = x.createLinearGradient(0, 0, w, 0);
    colors.forEach((c, i) => g.addColorStop(colors.length === 1 ? 0 : i / (colors.length - 1), c));
    if (colors.length === 1) g.addColorStop(1, colors[0]);
    return g;
  }
  /* colorBars(parent, { seed, targets: [{x,y,w,h,color}], n = 8, w, h, radius = 6, from: 'right'|'left'|'both' })
     → { el, bars, render(t, p) }
     p 0 = nothing / bars far off-frame … streaking in (heavy horizontal motion blur, pre-blurred sprites)
     … p 1 = every bar sits exactly on its target rect, crisp, in its target colour (string or [gradient stops]). */
  FX.colorBars = (parent, o = {}) => {
    const W = o.w ?? E.W, Hh = o.h ?? E.H;
    const c = E.h("canvas", "fxs-cv", parent); c.width = W; c.height = Hh;
    E.css(c, { left: (o.x || 0) + "px", top: (o.y || 0) + "px" });
    const x = c.getContext("2d");
    const r = E.rng((o.seed ?? 5) * 9973 + 11);
    let targets = o.targets;
    if (!targets) {
      const n = o.n ?? 8;
      targets = [];
      for (let i = 0; i < n; i++) {
        const bh = 36 + Math.round(r() * 22), bw = 150 + Math.round(r() * 380);
        targets.push({ x: Math.round(W * 0.06 + r() * (W * 0.88 - bw)), y: Math.round(Hh * (0.14 + (i / n) * 0.72) + (r() - 0.5) * 30), w: bw, h: bh });
      }
    }
    const K = 5; // horizontal squash of the soft sprite: blur is K× longer horizontally
    const bars = targets.map((tg, i) => {
      const grad = BAR_GRADS[(i * 3 + Math.floor(r() * 8)) % BAR_GRADS.length];
      const fin = tg.color ? (Array.isArray(tg.color) ? tg.color : [tg.color]) : grad;
      const rad = tg.radius ?? o.radius ?? 6;
      // crisp landing sprite
      const sharp = mkCanvas(tg.w, tg.h);
      { const s = sharp.getContext("2d"); s.fillStyle = fillGrad(s, tg.w, fin); s.beginPath(); s.roundRect(0, 0, tg.w, tg.h, rad); s.fill(); }
      // soft travelling sprite: squashed K× horizontally, tapered toward its tail (right), blurred once
      const pad = 22, sw = tg.w / K, sh = tg.h;
      const raw = mkCanvas(sw + pad * 2, sh + pad * 2);
      { const s = raw.getContext("2d"); s.fillStyle = fillGrad(s, raw.width, grad);
        const taper = 0.3 + r() * 0.3, y0 = pad, y1 = pad + sh, mid = (y0 + y1) / 2;
        s.beginPath(); s.moveTo(pad, y0); s.lineTo(pad + sw, mid - (sh / 2) * taper); s.lineTo(pad + sw, mid + (sh / 2) * taper); s.lineTo(pad, y1); s.closePath(); s.fill(); }
      const soft = mkCanvas(raw.width, raw.height);
      { const s = soft.getContext("2d"); s.filter = "blur(6.5px)"; s.drawImage(raw, 0, 0); }
      const fromRight = o.from === "left" ? false : o.from === "right" ? true : r() > 0.35;
      return {
        tg, sharp, soft, pad, K, fromRight,
        delay: (o.stagger ?? 0.42) * r(), dur: 0.42 + r() * 0.16,
        x0: fromRight ? W + 200 + r() * 900 : -tg.w - 200 - r() * 900,
        dy: (r() - 0.5) * 60,
      };
    });
    let key = "";
    return {
      el: c, bars,
      render(t, p) {
        const k = p.toFixed(5);
        if (k === key) return; key = k;
        x.clearRect(0, 0, W, Hh);
        for (const b of bars) {
          const u = clamp((p - b.delay) / b.dur);
          if (u <= 0) continue;
          const e = E.ease.outExpo(u);
          const vel = Math.abs(10 * Math.pow(2, -10 * u)) * Math.abs(b.tg.x - b.x0) / b.dur; // d x / d p
          const bx = lerp(b.x0, b.tg.x, e), by = b.tg.y + b.dy * (1 - E.ease.outCubic(u));
          const blur = u >= 1 ? 0 : clamp(vel / 2600);
          const streak = Math.min(vel * 0.06, 900) * (b.fromRight ? 1 : 1);
          const sa = clamp(blur * 3.2);            // the soft (motion-blurred) sprite is opaque for most of the flight
          if (sa < 0.999) { x.globalAlpha = 1 - sa; x.drawImage(b.sharp, bx, by, b.tg.w, b.tg.h); }
          if (sa > 0.001) {
            x.globalAlpha = sa;
            const dw = b.tg.w + streak, sx = b.fromRight ? bx : bx - streak;
            const pw = b.pad * b.K * (1 + streak / b.tg.w);
            x.save();
            if (!b.fromRight) { x.translate(sx + dw / 2, 0); x.scale(-1, 1); x.translate(-(sx + dw / 2), 0); }
            x.drawImage(b.soft, sx - pw, by - b.pad, dw + pw * 2, b.tg.h + b.pad * 2);
            x.restore();
          }
          x.globalAlpha = 1;
        }
      },
    };
  };

  /* ================================================================== collage */
  const SLOTS = [[0.13, 0.17], [0.5, 0.1], [0.87, 0.17], [0.09, 0.52], [0.91, 0.5], [0.15, 0.86], [0.52, 0.9], [0.86, 0.85], [0.31, 0.12], [0.7, 0.88]];
  /* collage(parent, { cards: [el | {el, w, h, size}], seed, w, h, keepOut: {x,y,w,h}, step = .25, x, y })
     → { el, items, render(t, { mode: 'scatter'|'condense', p, step, at: [x, y], shrink }) }
     scatter: every `step` s the cards jump to a new loose arrangement around the keep-out rect (the caption),
       overlapping a little, some cropped by the frame edge.
     condense: p 0..1 gathers them into a tight overlapping cluster (still stop-motion), then the cluster
       shrinks toward `shrink` (default .5) and drifts up.  Card sizes are measured on the first visible render. */
  FX.collage = (parent, o = {}) => {
    const W = o.w ?? E.W, Hh = o.h ?? E.H;
    const el = E.h("div", "fxs-collage", parent);
    E.css(el, { left: (o.x || 0) + "px", top: (o.y || 0) + "px", width: W + "px", height: Hh + "px" });
    const ko = o.keepOut || { x: W * 0.32, y: Hh * 0.4, w: W * 0.36, h: Hh * 0.17 };
    const seed = o.seed ?? 7;
    const items = (o.cards || []).map((cd) => {
      const node = cd.el || cd;
      const wrap = E.h("div", "fxs-card", el);
      wrap.appendChild(node);
      wrap.style.visibility = "hidden";
      return { wrap, node, w: cd.w, h: cd.h, size: cd.size ?? 1 };
    });
    const measure = () => {
      for (const it of items) {
        if (it.w && it.h) continue;
        it.wrap.style.transform = "none";
        const r = it.node.getBoundingClientRect(), k = E.scale || 1;
        it.w = it.w || r.width / k || 400; it.h = it.h || r.height / k || 300;
      }
    };
    const cache = new Map();
    const scatter = (st) => {
      const kk = "s" + st;
      if (cache.has(kk)) return cache.get(kk);
      const r = E.rng(seed * 7919 + st * 104729);
      const order = SLOTS.map((s, i) => [r(), i]).sort((a, b) => a[0] - b[0]).map((a) => a[1]);
      const lay = items.map((it, i) => {
        const sl = SLOTS[order[i % SLOTS.length]];
        const tw = W * (0.2 + r() * 0.15) * it.size;
        let s = tw / it.w; if (it.h * s > Hh * 0.46) s = (Hh * 0.46) / it.h;
        const rw = it.w * s, rh = it.h * s;
        let cx = (sl[0] + (r() - 0.5) * 0.09) * W + (i >= SLOTS.length ? (r() - 0.5) * W * 0.12 : 0);
        let cy = (sl[1] + (r() - 0.5) * 0.09) * Hh;
        // keep the caption clear: push out along the shallow axis
        const x0 = cx - rw / 2, y0 = cy - rh / 2;
        const ox = Math.min(x0 + rw, ko.x + ko.w) - Math.max(x0, ko.x), oy = Math.min(y0 + rh, ko.y + ko.h) - Math.max(y0, ko.y);
        if (ox > 0 && oy > 0) {
          if (oy < ox * 1.6) cy += (cy < ko.y + ko.h / 2 ? -1 : 1) * (oy + 14);
          else cx += (cx < ko.x + ko.w / 2 ? -1 : 1) * (ox + 14);
        }
        return { x: cx - rw / 2, y: cy - rh / 2, s, z: Math.floor(r() * 50) };
      });
      cache.set(kk, lay);
      return lay;
    };
    const cluster = (st) => {
      const kk = "c" + st;
      if (cache.has(kk)) return cache.get(kk);
      const r = E.rng(seed * 31 + st * 7727 + 5);
      const n = items.length;
      const lay = items.map((it, i) => {
        const a = i * 2.39996 + r() * 0.5, rad = (0.035 + 0.13 * Math.sqrt((i + 0.5) / n)) * W;
        const tw = W * (0.14 + r() * 0.08) * it.size;
        let s = tw / it.w; if (it.h * s > Hh * 0.3) s = (Hh * 0.3) / it.h;
        return { cx: Math.cos(a) * rad * 1.15, cy: Math.sin(a) * rad * 0.48, s, z: Math.floor(r() * 50) };
      });
      cache.set(kk, lay);
      return lay;
    };
    let measured = false;
    return {
      el, items,
      render(t, s = {}) {
        if (!items.length) return;
        if (!measured) { measure(); measured = true; }
        const stepDur = s.step ?? o.step ?? 0.25;
        const st = stepOf(t, stepDur);
        const mode = s.mode || "scatter";
        const A = scatter(st);
        let pq = 0, P = 0;
        if (mode === "condense") { P = clamp(s.p ?? 1); pq = Math.min(1, Math.ceil(P * 5 - 1e-6) / 5); }
        const C = mode === "condense" ? cluster(stepOf(t, stepDur * 0.8)) : null;
        const e = E.ease.inOutCubic(pq);
        const sh = lerp(1, s.shrink ?? 0.5, E.ease.inOutCubic(clamp((P - 0.55) / 0.45)));
        const at = s.at || [W / 2, Hh * 0.5 - E.ease.inOutCubic(P) * Hh * 0.1];
        items.forEach((it, i) => {
          const a = A[i];
          let X = a.x, Y = a.y, S = a.s, Z = a.z;
          if (C) {
            const c = C[i];
            const cs = c.s * sh, cx = at[0] + c.cx * sh - (it.w * cs) / 2, cy = at[1] + c.cy * sh - (it.h * cs) / 2;
            X = lerp(X, cx, e); Y = lerp(Y, cy, e); S = lerp(S, cs, e); Z = e > 0.5 ? c.z : a.z;
          }
          it.wrap.style.visibility = "";
          it.wrap.style.transform = `translate(${X.toFixed(1)}px,${Y.toFixed(1)}px) scale(${S.toFixed(4)})`;
          it.wrap.style.zIndex = Z;
        });
      },
    };
  };

  /* ================================================================== macro */
  const FRAG_MACRO = `
  uniform float uKind, uFocus, uZoom, uStep, uRot, uExp;
  // studio lighting seen in reflections: a big soft key (upper left, in front), an overhead fill,
  // a hard strip light behind on the right (rim), dark everywhere else. rough widens every source.
  float envL(vec3 r, float rough){
    vec3 k = normalize(vec3(-0.52, 0.58, 0.63));
    float d = dot(r, k);
    float key = smoothstep(0.84 - rough*0.6, 0.965, d)*1.45 + smoothstep(0.975 - rough*0.4, 0.997, d)*1.5;
    float front = 0.30*smoothstep(-0.2 - rough*0.3, 1.0, dot(r, normalize(vec3(0.15, 0.3, 1.0))));
    float top = 0.14*smoothstep(-0.2, 0.95, r.y);
    float strip = smoothstep(0.09 + rough*0.3, 0.03, abs(r.x - 0.78 + r.y*0.1))*smoothstep(-0.65, -0.05, r.y)*smoothstep(0.85, 0.3, r.y)*smoothstep(0.5, -0.1, r.z);
    return 0.02 + front + top + key + 1.1*strip;
  }
  // the grille shot: a big window far behind the deck gives a glancing sheen
  float envG(vec3 r, float rough){
    float d = dot(r, normalize(vec3(-0.22, 0.30, -0.93)));
    return 0.04 + 0.12*smoothstep(-0.2, 1.0, r.y) + 0.85*smoothstep(0.80 - rough*0.5, 0.985, d) + 0.6*smoothstep(0.985 - rough*0.3, 0.999, d);
  }
  float aaStep(float w, float d, float bw){ return smoothstep(w + bw, w - bw, d); }
  mat3 rotY(float a){ float c=cos(a), s=sin(a); return mat3(c,0.,-s, 0.,1.,0., s,0.,c); }
  mat3 rotX(float a){ float c=cos(a), s=sin(a); return mat3(1.,0.,0., 0.,c,s, 0.,-s,c); }
  float bokeh(vec2 p, vec2 c, float r){ float d = length(p - c)/r; return smoothstep(1.0, 0.9, d)*(0.6 + 0.4*smoothstep(0.5, 0.97, d)); }
  float background(vec2 p){
    float g = 0.055*smoothstep(1.5, -0.1, length(p - vec2(-0.55, 0.5)));
    float b = 0.;
    b += 0.085*bokeh(p, vec2(-0.80, 0.34), 0.12);
    b += 0.05*bokeh(p, vec2(-0.58, 0.47), 0.07);
    b += 0.04*bokeh(p, vec2(-0.93, 0.02), 0.16);
    b += 0.06*bokeh(p, vec2(-0.30, 0.52), 0.05);
    return 0.010 + g + b;
  }
  // ---------- studio microphone ball grille: woven wire mesh over a dark foam core ----------
  float micShade(vec3 P, vec3 N, vec3 rd, vec3 Cn, float R, float coc){
    mat3 M = rotX(-0.62)*rotY(uRot);
    vec3 Q = M*(P - Cn)/R;
    float lon = atan(Q.z, Q.x), lat = asin(clamp(Q.y, -1., 1.));
    float D = 27.0;
    float u = lon*D, v = lat*D*1.02;
    // per-direction filter widths (pattern units): pixel footprint grown by the circle of confusion
    float bu = min(fwidth(u), 1.0)*(0.6 + coc*0.55) + 0.012;
    float bv = min(fwidth(v), 1.0)*(0.6 + coc*0.55) + 0.012;
    vec3 axis = vec3(0.,1.,0.)*M;
    vec3 Tu = normalize(cross(axis, N) + vec3(1e-4));
    vec3 Tv = normalize(cross(N, Tu));
    float w = 0.235;
    float fu = fract(u + 0.5) - 0.5, fv = fract(v + 0.5) - 0.5;
    float hA = cos(3.14159*(v + floor(u + 0.5))), hB = -cos(3.14159*(u + floor(v + 0.5)));
    float cA = aaStep(w, abs(fu), bu), cB = aaStep(w, abs(fv), bv);
    float topA = step(hB, hA);
    float useA = cA*(topA + (1. - topA)*(1. - cB));
    float useB = cB*(1. - useA);
    float sA = clamp(fu/w, -1., 1.), sB = clamp(fv/w, -1., 1.);
    vec3 nA = normalize(N*sqrt(max(1. - sA*sA, 0.03)) + Tu*sA - Tv*sin(3.14159*(v + floor(u + 0.5)))*0.16);
    vec3 nB = normalize(N*sqrt(max(1. - sB*sB, 0.03)) + Tv*sB + Tu*sin(3.14159*(u + floor(v + 0.5)))*0.16);
    // sphere-scale light falloff: the side turned to the key gets the light, the far side drops into shadow
    vec3 kd = normalize(vec3(-0.52, 0.58, 0.63));
    float lit = 0.22 + 0.78*smoothstep(-0.35, 0.75, dot(N, kd));
    // the softbox's broad hotspot on the ball (where the base surface mirrors the key)
    float hs = smoothstep(0.55, 0.97, dot(reflect(rd, N), kd));
    lit *= 1. + 1.6*hs;
    float eA = envL(reflect(rd, nA), 0.05), eB = envL(reflect(rd, nB), 0.05);
    float aoA = 0.5 + 0.5*(hA*0.5 + 0.5), aoB = 0.5 + 0.5*(hB*0.5 + 0.5);
    float fr = 0.72 + 0.28*pow(1. - max(dot(-rd, N), 0.), 3.);
    float diff = 0.06*max(dot(N, kd), 0.);
    float wireA = (eA*aoA*0.86 + diff)*lit*fr, wireB = (eB*aoB*0.86 + diff)*lit*fr;
    // what each family blurs to once its wires are below the blur size
    float avgW = (envL(reflect(rd, N), 0.55)*0.6 + diff)*lit*fr;
    wireA = mix(wireA, avgW, smoothstep(0.18, 0.6, bu));
    wireB = mix(wireB, avgW, smoothstep(0.18, 0.6, bv));
    float cA2 = mix(useA, 2.*w*(1. - w), smoothstep(0.25, 0.7, bu));
    float cB2 = mix(useB, 2.*w*(1. - w), smoothstep(0.25, 0.7, bv));
    // through the openings: a finer inner mesh layer and the dark foam behind it
    float iu = lon*D*1.37 + lat*D*0.4, iv = lat*D*1.37 - lon*D*0.4;
    float inner = max(aaStep(0.13, abs(fract(iu) - 0.5), bu*1.4 + 0.08), aaStep(0.13, abs(fract(iv) - 0.5), bv*1.4 + 0.08));
    inner = mix(inner, 0.3, smoothstep(0.2, 0.5, max(bu, bv)));
    float foam = (0.010 + 0.014*vnoise(vec2(u, v)*2.3) + inner*0.022*envL(reflect(rd, N), 0.6))*min(lit, 1.3);
    return wireA*cA2 + wireB*cB2 + foam*clamp(1. - cA2 - cB2, 0., 1.);
  }
  // ---------- MacBook speaker grille: drilled holes in bead-blasted aluminium ----------
  float grilleShade(vec3 P, vec3 rd, float bw){
    vec2 q = P.xz/0.0105;
    vec2 s = vec2(1., 1.7320508);
    vec2 a = mod(q, s) - s*0.5, b = mod(q - s*0.5, s) - s*0.5;
    vec2 g = dot(a, a) < dot(b, b) ? a : b;
    float d = length(g);
    float hr = 0.24;
    float metal = smoothstep(hr - bw, hr + bw, d);
    float rim = smoothstep(hr + 0.16, hr, d)*metal;
    vec3 N = normalize(vec3(0., 1., 0.) + vec3(-g.x, 0., -g.y)/max(d, 1e-3)*rim*1.6);
    float spec = envG(reflect(rd, N), 0.25);
    float grain = 0.9 + 0.1*vnoise(P.xz*vec2(4200., 380.));
    float alu = (0.17 + 0.26*max(dot(N, normalize(vec3(-0.45, 0.85, 0.3))), 0.))*grain + spec*0.42;
    float inside = 0.012 + 0.02*smoothstep(0., hr, d);
    float det = mix(inside, alu, metal);
    float open = 3.14159*hr*hr/1.7320508;
    float avg = mix((0.20 + 0.30*0.86) + envG(reflect(rd, vec3(0.,1.,0.)), 0.5)*0.34, 0.015, open);
    return mix(det, avg, smoothstep(0.14, 0.5, bw));
  }
  void main(){
    vec2 frag = gl_FragCoord.xy;
    vec2 p = (frag - 0.5*uRes)/uRes.y;
    float pxw = 1./uRes.y;
    float col;
    if (uKind < 0.5) {
      vec3 rd = normalize(vec3(p*uZoom, -1.35));
      vec3 Cn = vec3(0.78, -0.40, -2.30); float R = 1.62;
      vec3 oc = -Cn; float b = dot(oc, rd); float c = dot(oc, oc) - R*R; float disc = b*b - c;
      float bg = background(p);
      float tHit = disc > 0. ? -b - sqrt(disc) : -b;
      vec3 P = rd*tHit;
      vec3 N = normalize(P - Cn);
      if (disc <= 0.) P = Cn + N*R;
      float z = -P.z;
      float coc = abs(1./z - 1./uFocus)*0.085/pxw;           // circle of confusion, px
      float s = micShade(P, N, rd, Cn, R, coc);
      float dEdge = (sqrt(max(dot(oc, oc) - b*b, 0.)) - R)/z*1.35/uZoom/pxw;
      float cv = smoothstep(max(coc, 1.0)*0.8, -max(coc, 1.0)*0.8, dEdge);
      col = mix(bg, s, cv);
      // soft bloom around the hot glints (one-pass approximation)
      col += 0.07*smoothstep(0.4, 1.0, dot(reflect(rd, N), normalize(vec3(-0.52, 0.58, 0.63))))*cv;
    } else {
      vec3 ro = vec3(uRot*0.02, 0.085, 0.0);
      float pitch = 0.58;
      vec3 fw = vec3(0., -sin(pitch), -cos(pitch)), rt = vec3(1., 0., 0.), up = vec3(0., cos(pitch), -sin(pitch));
      vec3 rd = normalize(fw*1.55 + rt*p.x*uZoom + up*p.y*uZoom);
      float tp = rd.y < -1e-4 ? -ro.y/rd.y : 1e4;
      vec3 P = ro + rd*min(tp, 50.);
      float coc = abs(1./tp - 1./uFocus)*0.016/pxw;
      float pat = (fwidth(P.x) + fwidth(P.z))/0.0105;
      float bw = pat*0.6 + pat*coc*0.5 + 0.01;
      col = grilleShade(P, rd, min(bw, 1.5));
      // the deck ends: dark beyond the far edge, soft (out of focus)
      float edge = smoothstep(-0.30, -0.36, P.z);
      col = mix(col, 0.012, clamp(edge + smoothstep(0.0, 0.03, rd.y + 0.02), 0., 1.));
    }
    // film grade: exposure, shoulder, contrast, grain, vignette
    col *= uExp;
    col = col/(1. + col*0.6);
    col = smoothstep(0.0, 0.9, col);
    col = pow(col, 1.08);
    float gr = h21(frag + vec2(uStep*17.31, uStep*3.17)) + h21(frag*1.7 + uStep) - 1.;
    col += gr*0.032;
    col *= 1. - 0.38*dot(p*vec2(0.8, 1.), p*vec2(0.8, 1.));
    gl_FragColor = vec4(vec3(col), 1.);
  }`;
  /* macro(parent, w, h, { kind: 'mic'|'grille', scale = 1, x, y }) → { el, canvas, render(t, { focus, zoom, rot, exposure }) }
     A monochrome macro "photograph": studio mic ball-grille (woven wires with per-wire glints, DOF falloff,
     bokeh, grain) or a MacBook speaker grille (perforated, chamfered, brushed aluminium). t slowly turns it. */
  FX.macro = (parent, w = 800, h = 600, o = {}) => {
    const L = glLayer(parent, w, h, o.scale ?? 1);
    E.css(L.c, { left: (o.x || 0) + "px", top: (o.y || 0) + "px" });
    const kind = o.kind === "grille" ? 1 : 0;
    let key = "";
    return {
      el: L.c, canvas: L.c,
      render(t, s = {}) {
        const u = {
          uKind: kind, uFocus: s.focus ?? (kind ? 0.17 : 1.02), uZoom: s.zoom ?? 1, uRot: s.rot ?? 0.55 + t * 0.06,
          uStep: stepOf(t, 1 / 24) % 240, uExp: s.exposure ?? (kind ? 1 : 1.25),
        };
        const k = JSON.stringify(u);
        if (k === key) return; key = k;
        glDraw(L.ctx, L.c.width, L.c.height, FRAG_MACRO, t, u);
      },
    };
  };

  /* ================================================================= dotMatrix */
  const ICP = {
    shield: ["M12 3.2 5 5.8v5.4c0 4.6 3 8.3 7 9.6 4-1.3 7-5 7-9.6V5.8z"],
    shieldBang: ["M12 3.2 5 5.8v5.4c0 4.6 3 8.3 7 9.6 4-1.3 7-5 7-9.6V5.8z", "M12 8.6v4.2", "dot:12:15.9"],
    shieldCheck: ["M12 3.2 5 5.8v5.4c0 4.6 3 8.3 7 9.6 4-1.3 7-5 7-9.6V5.8z", "M9 12.1l2.1 2.1 4-4.3"],
    lock: ["M7 10.5h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z", "M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"],
    warn: ["M10.27 4.5a2 2 0 0 1 3.46 0l7.2 12.5a2 2 0 0 1-1.73 3H4.8a2 2 0 0 1-1.73-3z", "M12 9.6v3.8", "dot:12:16.6"],
    mic: ["M9.2 6a2.8 2.8 0 0 1 5.6 0v5.2a2.8 2.8 0 0 1-5.6 0z", "M6 11.2a6 6 0 0 0 12 0", "M12 17.2v3.3"],
    up: ["M6.5 3.8h11a2.7 2.7 0 0 1 2.7 2.7v11a2.7 2.7 0 0 1-2.7 2.7h-11a2.7 2.7 0 0 1-2.7-2.7v-11a2.7 2.7 0 0 1 2.7-2.7z", "M9 15l6-6", "M10.2 9h4.8v4.8"],
  };
  const DM_COL = { up: "#ff7a45", mic: "#a98bff", warn: "#e8344e", shieldBang: "#ff6a3d", shield: "#d4ef4f", lock: "#d4ef4f", shieldCheck: "#d4ef4f" };
  function iconSprite(name, size, color, sw = 1.9) {
    const k = name + size + color;
    if (SPR[k]) return SPR[k];
    const s = Math.ceil(size + 4), c = mkCanvas(s, s), x = c.getContext("2d");
    x.translate(2, 2); x.scale(size / 24, size / 24);
    x.strokeStyle = color; x.fillStyle = color; x.lineWidth = sw; x.lineCap = "round"; x.lineJoin = "round";
    for (const d of ICP[name]) {
      if (d.startsWith("dot:")) { const [, cx, cy] = d.split(":"); x.beginPath(); x.arc(+cx, +cy, 1.15, 0, Math.PI * 2); x.fill(); }
      else x.stroke(new Path2D(d));
    }
    return (SPR[k] = { c, s });
  }
  /* dotMatrix(parent, w, h, { cols = 16, rows = 6, gap = 106, icon = 30, seed, ghost = true, x, y })
     → { el, render(t, { p, condense, ghost }) }
     t drives the flicker (every 0.1 s); p 0..1 flips cells (progressively, flickering at their threshold)
     from coral ↗ uploads / lavender mics / red warnings to lime shields & locks; condense 0..1 pulls the
     grid toward the centre and drops the outer cells (hand over to bigShield). */
  FX.dotMatrix = (parent, w = E.W, h = E.H, o = {}) => {
    const el = E.h("div", "fxs-abs", parent);
    E.css(el, { left: (o.x || 0) + "px", top: (o.y || 0) + "px", width: w + "px", height: h + "px", background: o.bg || "#1d1d1d", overflow: "hidden" });
    const ghost = o.ghost !== false ? FX.wash(el, w, h, { palette: "night", scale: 0.2, seed: 4 }) : null;
    const c = E.h("canvas", "fxs-cv", el); c.width = w; c.height = h;
    const x = c.getContext("2d");
    const cols = o.cols ?? 16, rows = o.rows ?? 6, gap = o.gap ?? 106, isz = o.icon ?? 30, seed = o.seed ?? 9;
    const cells = [];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const hsh = H2(i + seed, j * 1.37 + seed * 0.1);
      // icons cluster toward the middle columns, like the reference
      const centre = 1 - Math.abs(i - (cols - 1) / 2) / ((cols - 1) / 2);
      cells.push({ i, j, active: hsh < 0.34 + centre * 0.42, th: H2(i * 2.7 + 1, j * 5.1 + seed) * 0.72, kindSeed: H2(i * 9.1, j * 4.3 + 2) });
    }
    const dot = dotSprite(2.1, false);
    let key = "";
    return {
      el,
      render(t, s = {}) {
        const p = clamp(s.p ?? 0), cd = clamp(s.condense ?? 0);
        const st = stepOf(t, 0.1);
        if (ghost) { const ga = (s.ghost ?? 1) * (1 - p) * 0.9; ghost.el.style.display = ga > 0.01 ? "" : "none"; if (ga > 0.01) ghost.render(t, { alpha: ga, flow: 1.2 }); }
        const k = st + "|" + p.toFixed(3) + "|" + cd.toFixed(3);
        if (k === key) return; key = k;
        x.clearRect(0, 0, w, h);
        const cx = w / 2, cy = h / 2;
        const sp = gap * (1 - 0.3 * E.ease.inOutCubic(cd));
        const maxR = Math.hypot(((cols - 1) / 2) * gap, ((rows - 1) / 2) * gap * 2.2);
        for (const cl of cells) {
          const gx = (cl.i - (cols - 1) / 2), gy = (cl.j - (rows - 1) / 2);
          const px = cx + gx * sp, py = cy + gy * sp;
          // condense: outer cells go away first
          const rr = Math.hypot(gx * gap, gy * gap * 2.2) / maxR;
          const keep = cd <= 0 ? 1 : clamp((1 - cd * 1.25 - rr * 0.9 + 0.55) / 0.12);
          if (keep <= 0.02) continue;
          // flicker: some cells blink between icon and dot
          const fl = H2(cl.i * 1.9 + st * 0.13, cl.j * 2.3 + st * 0.71);
          let active = cl.active ? fl > 0.08 : fl > 0.965 && p < 0.9;
          if (!active) { x.globalAlpha = keep * 0.85; x.drawImage(dot.c, px - dot.s / 2, py - dot.s / 2); continue; }
          let name;
          const conv = p > cl.th + 0.18 ? 1 : p > cl.th ? (H2(cl.i + st * 0.31, cl.j - st * 0.17) > 0.45 ? 1 : 0) : 0;
          if (conv) name = cl.kindSeed > 0.78 ? "lock" : "shield";
          else {
            const kk = H2(cl.kindSeed * 13 + Math.floor(st / 3) * 0.57, cl.i);
            name = kk < 0.36 ? "warn" : kk < 0.62 ? "up" : kk < 0.86 ? "mic" : "shieldBang";
          }
          const spr = iconSprite(name, isz, DM_COL[name]);
          x.globalAlpha = keep * (conv && p < 1 && H2(cl.i, st) > 0.9 ? 0.6 : 1);
          x.drawImage(spr.c, Math.round(px - spr.s / 2), Math.round(py - spr.s / 2));
        }
        x.globalAlpha = 1;
      },
    };
  };
  /* bigShield(parent, size, { color = '#d4ef4f', check = true, x, y }) → { el, render(p, { t }) }
     p 0..1: the outline draws on (0 → .6), the ✓ draws (.45 → .9), with a small spring pop. el is centred on (x, y). */
  FX.bigShield = (parent, size = 140, o = {}) => {
    const el = E.h("div", "fxs-abs fxs-shield", parent);
    E.css(el, { left: (o.x ?? E.W / 2) - size / 2 + "px", top: (o.y ?? E.H / 2) - size / 2 + "px", width: size + "px", height: size + "px" });
    const col = o.color || "#d4ef4f";
    el.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" style="overflow:visible;display:block"><path pathLength="1" stroke="${col}" stroke-width="1.85" d="M12 2.6 4.6 5.4v5.8c0 4.9 3.1 8.8 7.4 10.2 4.3-1.4 7.4-5.3 7.4-10.2V5.4z"/>${o.check === false ? "" : `<path pathLength="1" stroke="${col}" stroke-width="1.85" d="M8.6 12.3l2.4 2.4 4.5-4.9"/>`}</svg>`;
    const [ps, pc] = el.querySelectorAll("path");
    return {
      el,
      render(p = 1) {
        const a = clamp(p / 0.6), b = clamp((p - 0.45) / 0.45);
        ps.style.strokeDasharray = "1 1"; ps.style.strokeDashoffset = (1 - E.ease.inOutCubic(a)).toFixed(4);
        if (pc) { pc.style.strokeDasharray = "1 1"; pc.style.strokeDashoffset = (1 - E.ease.outCubic(b)).toFixed(4); pc.style.opacity = b > 0 ? 1 : 0; }
        const sc = p >= 1 ? 1 : 0.86 + 0.14 * E.spring(p * 0.9);
        el.style.transform = `scale(${sc.toFixed(4)})`;
        el.style.opacity = clamp(p * 6);
      },
    };
  };

  /* ================================================================== bento */
  const ARW = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h13M13 6l6 6-6 6"/></svg>';
  function tileHTML(kind, o) {
    switch (kind) {
      case "wpm": return `<div style="position:absolute;inset:0;padding:11px 12px;display:flex;flex-direction:column"><div class="fxs-lab">dictation · live</div><div style="margin-top:10px;display:flex;align-items:baseline"><span class="fxs-big">150</span><span class="fxs-unit">wpm</span></div><div class="fxs-bars" style="flex:1;margin-top:12px"><i style="height:30%"></i><i style="height:46%"></i><i style="height:41%"></i><i style="height:70%"></i><i style="height:58%"></i><i style="height:92%"></i></div></div>`;
      case "pct": return `<div style="position:absolute;inset:0;padding:11px 12px;display:flex;flex-direction:column"><div class="fxs-lab">time back / week</div><div class="fxs-big fxs-pct" style="margin-top:10px;color:#ff6a2c">+19%</div><div class="fxs-bars" style="flex:1;margin-top:12px"><i style="height:22%"></i><i style="height:22%"></i><i style="height:38%"></i><i style="height:38%"></i><i style="height:64%"></i><i style="height:80%"></i></div></div>`;
      case "lat": return `<div style="position:absolute;inset:0;padding:11px 12px;display:flex;flex-direction:column"><div class="fxs-lab">reply latency</div><div style="margin-top:10px;display:flex;align-items:baseline"><span class="fxs-big">&lt; 300</span><span class="fxs-unit">ms</span></div><svg style="flex:1;margin-top:10px;width:100%" viewBox="0 0 100 30" preserveAspectRatio="none"><path vector-effect="non-scaling-stroke" d="M0 22 L10 20 L18 24 L27 14 L36 17 L45 9 L54 13 L63 11 L72 16 L81 7 L90 10 L100 5" fill="none" stroke="#141414" stroke-width="1.4"/><path vector-effect="non-scaling-stroke" d="M0 29.5H100" stroke="#d8d0c8" stroke-width="1"/></svg></div>`;
      case "seven": return `<div style="position:absolute;inset:0;padding:11px 12px;display:flex;flex-direction:column;justify-content:space-between"><div class="fxs-lab">faster than typing</div><div class="fxs-big" style="font-size:54px">7×</div></div>`;
      case "chart": return `<div style="position:absolute;inset:0;padding:10px 11px"><div class="fxs-lab" style="color:#8a8a8a">mic level</div><svg style="position:absolute;left:0;top:28px;right:0;bottom:8px;width:100%;height:calc(100% - 36px)" viewBox="0 0 100 60" preserveAspectRatio="none">${[14, 30, 46, 62, 78, 94].map((xx) => `<path vector-effect="non-scaling-stroke" d="M${xx} 0V60" stroke="#2c2c2c" stroke-width="1"/>`).join("")}<path vector-effect="non-scaling-stroke" d="M0 34 C 8 22, 14 20, 22 30 S 36 46, 44 30 S 58 12, 66 26 S 82 44, 100 36" fill="none" stroke="#e8e8e8" stroke-width="1.3"/><path vector-effect="non-scaling-stroke" d="M0 40 C 10 36, 16 26, 26 24 S 40 36, 50 38 S 66 26, 76 30 S 90 46, 100 44" fill="none" stroke="#d4ef4f" stroke-width="1.3"/></svg></div>`;
      case "code": return `<div style="position:absolute;inset:0;padding:9px 11px" class="fxs-code"><span style="color:#6c7986">// Transcribe.swift</span>
<span style="color:#ff7ab2">let</span> audio = <span style="color:#67b7a4">mic</span>.<span style="color:#67b7a4">capture</span>()
<span style="color:#ff7ab2">let</span> text = <span style="color:#ff7ab2">try await</span>
  <span style="color:#67b7a4">whisper</span>.<span style="color:#67b7a4">transcribe</span>(audio,
    local: <span style="color:#ff7ab2">true</span>)
<span style="color:#6c7986">// bytes uploaded:</span> <span style="color:#d0bf69">0</span></div>`;
      case "tag": return `<div class="fxs-tag"><i style="width:9px;height:9px;border-radius:2px;background:#d4ef4f;display:block"></i>0 audio sent</div>`;
      case "whisper": return `<div class="fxs-tag" style="font-size:11.5px;gap:6px;background:#1b1b1d"><span style="color:#b9a3ff">whisper</span><span style="color:#6d6d70">·</span><span style="color:#f2f2f2">on-device</span></div>`;
      case "price": return `<div class="fxs-pill"><span class="fxs-lab" style="font-size:9.5px">plans from</span><span style="font:400 21px/1 var(--sf);letter-spacing:-.02em;color:#141414">$15/mo</span><span style="flex:1"></span><span class="fxs-circ">${ARW}</span></div>`;
      case "search": return `<div style="position:absolute;inset:0;background:#1b1b1d;display:flex;align-items:center;justify-content:space-between;padding:0 10px;font:400 11px/1 var(--sf);color:#7b7b80"><span>Search</span><span class="fxs-mono" style="font-size:10px">⌘K</span></div>`;
      case "local": return `<div style="position:absolute;inset:0;padding:10px"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9a948e" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="3"/></svg><div style="position:absolute;left:10px;bottom:12px;display:flex;align-items:center;gap:5px" class="fxs-lab"><i style="width:8px;height:8px;border-radius:2px;background:#ff7a45;display:block"></i><span style="color:#2a2a2a;font-size:9px;letter-spacing:.06em">LOCAL</span></div></div>`;
      case "iri": return `<div style="position:absolute;inset:0;background:radial-gradient(60% 55% at 30% 35%, #f3c2ea 0%, rgba(243,194,234,0) 70%), radial-gradient(55% 60% at 75% 70%, #c9c6ff 0%, rgba(201,198,255,0) 72%), radial-gradient(50% 50% at 70% 20%, #bfe9f7 0%, rgba(191,233,247,0) 70%), #efe3ea"></div>`;
      case "face": return ``;
      case "text": return `<div class="fxs-lab" style="position:absolute;left:4px;top:4px;color:#9b948d">${o.text}</div>`;
      default: return "";
    }
  }
  /* tile designs: natural content size (w×h), surface class */
  const TILE = {
    wpm: { w: 170, h: 150, cls: "fxs-lt" }, pct: { w: 170, h: 150, cls: "fxs-lt" }, lat: { w: 170, h: 130, cls: "fxs-lt" },
    seven: { w: 150, h: 120, cls: "fxs-lt" }, chart: { w: 190, h: 150, cls: "fxs-dk" }, code: { w: 200, h: 112, cls: "fxs-dk" },
    tag: { w: 190, h: 40, cls: "" }, whisper: { w: 180, h: 30, cls: "" }, price: { w: 210, h: 50, cls: "" },
    search: { w: 180, h: 26, cls: "" }, local: { w: 80, h: 110, cls: "fxs-lt" }, iri: { w: 100, h: 100, cls: "" },
    face: { w: 120, h: 120, cls: "" }, thumb: { w: 120, h: 100, cls: "" }, macro: { w: 600, h: 560, cls: "" }, text: { w: 160, h: 20, cls: "" },
  };
  /* arrangements: [kind, c0, r0, cols, rows] in grid indices relative to the focus lines.
     A text tile's rect only anchors its label. */
  const BENTO_LAYOUTS = [
    [["macro", 2, 0, 6, 4], ["thumb", 0, 0, 1, 1], ["chart", -1, 1, 1, 2], ["pct", 1, 1, 1, 2], ["price", 0, 3, 1, 0.55], ["code", 1, -1, 1, 1],
     ["tag", 7, 6, 3, 0.75], ["whisper", 1, 4, 1, 0.5], ["search", -1, 5, 1, 0.6], ["local", 8, 1, 1, 1], ["wpm", 8, -1, 2, 1],
     ["text", 1, 0.65, 1, 1, "listening…"], ["text", -1, 3.6, 1, 1, "nothing uploaded"], ["text", 1, 2.65, 1, 1, "transcribing locally"]],
    [["macro", 2, 0, 6, 4], ["thumb", 0, 0, 1, 1], ["chart", -1, 1, 1, 2], ["pct", 1, 1, 1, 2], ["price", 0, 3, 1, 0.55], ["code", 1, -1, 1, 1],
     ["tag", 7, 6, 3, 0.75], ["whisper", 1, 4, 1, 0.5], ["search", -1, 5, 1, 0.6], ["local", 8, 1, 1, 1], ["lat", 8, -1, 2, 1],
     ["iri", 1, 1, 1, 1], ["text", 1, 0.65, 1, 1, "listening…"], ["text", -1, 3.6, 1, 1, "nothing uploaded"]],
    [["macro", 3, 0, 5, 4], ["face", 0, 0, 1, 1], ["chart", -1, 1, 1, 2], ["pct", 1, 0, 2, 2], ["price", 0, 2, 1, 0.55], ["code", 2, -1, 1, 1],
     ["tag", 6, 5, 3, 0.75], ["whisper", 3, 4, 2, 0.6], ["search", -1, 4, 1, 0.6], ["seven", 8, 0, 1, 2], ["thumb", 1, 2, 1, 1],
     ["text", 0, 1.1, 1, 1, "on-device"], ["text", 3, 4.7, 1, 1, "nothing uploaded"]],
    [["macro", 2, -1, 5, 5], ["wpm", 0, 0, 2, 1], ["chart", -1, 1, 1, 2], ["pct", 0, 1, 1, 2], ["price", 0, 3, 2, 0.6], ["code", 0, -1, 1, 1],
     ["tag", 7, 5, 3, 0.75], ["whisper", 2, 4, 2, 0.6], ["face", 7, 0, 1, 1], ["lat", 7, 1, 2, 2], ["iri", -1, 0, 1, 1], ["search", 7, -1, 2, 0.6],
     ["text", 7, 3.05, 1, 1, "local only"], ["text", -1, 3.5, 1, 1, "0 bytes out"]],
  ];
  const PCTS = ["+19%", "+22%", "+27%", "+36%"];
  /* bento(parent, w, h, { seed, step = .2, cell, x, y, layouts }) → { el, grid, macro, render(t, { p, step, layout, alpha }) }
     A privacy bento on the node grid: B&W macro mic, 150 wpm, < 300 ms, a coral → electric percentage that
     climbs (+19% → +22% → +27% → +36%), '0 audio sent' tag, 'whisper · on-device', a dark level chart, a Swift
     code tile, Swaey's face, 7×, '$15/mo' pill… Every `step` seconds the grid focus jumps and the tiles snap to a
     new arrangement (stop-motion). p 0..1 builds it (grid draws in, tiles pop in by distance). layout forces one. */
  FX.bento = (parent, w = E.W, h = E.H, o = {}) => {
    const el = E.h("div", "fxs-bento", parent);
    E.css(el, { left: (o.x || 0) + "px", top: (o.y || 0) + "px", width: w + "px", height: h + "px" });
    const cell = o.cell ?? w * 0.128;
    const grid = FX.nodeGrid(el, w, h, { cell, cellY: cell * 0.66, rx: 0.885, ry: 0.835, split: true });
    const layouts = o.layouts || BENTO_LAYOUTS;
    const tiles = {};
    let macro = null, macroBox = null, thumbCv = null;
    const mk = (kind, idx) => {
      const T = TILE[kind];
      const parentEl = kind === "macro" ? grid.below : grid.mid;
      const tl = E.h("div", "fxs-tile " + T.cls, parentEl);
      const tc = E.h("div", "fxs-tc", tl);
      if (kind === "macro") {
        macroBox = tl;
        macro = FX.macro(tl, 760, 700, { kind: o.kind || "mic", scale: o.macroScale ?? 0.85 });
        macro.el.style.transformOrigin = "0 0";
      } else if (kind === "thumb") {
        thumbCv = E.h("canvas", "fxs-cv", tl); thumbCv.width = 240; thumbCv.height = 200;
        E.css(thumbCv, { width: "100%", height: "100%" });
      } else if (kind === "face") {
        tl.style.background = "radial-gradient(120% 90% at 50% 112%, #1d4fd6 0%, #10297a 34%, #0b1236 62%, #070a18 100%)";
        const f = new E.C.Face(tc, { size: 64 });
        E.css(f.el, { position: "absolute", left: "28px", top: "28px" });
        tl._face = f;
      } else tc.innerHTML = tileHTML(kind, { text: idx });
      return { el: tl, tc, kind, T, pct: tc.querySelector(".fxs-pct") };
    };
    // build every tile used by any layout (text tiles are keyed by their label)
    for (const L of layouts) for (const d of L) {
      const id = d[0] === "text" ? "text:" + d[5] : d[0];
      if (!tiles[id]) tiles[id] = mk(d[0], d[5]);
    }
    let lastKey = "";
    return {
      el, grid, get macro() { return macro; },
      render(t, s = {}) {
        const p = clamp(s.p ?? 1);
        const stepDur = s.step ?? o.step ?? 0.2;
        const st = stepOf(t, stepDur);
        const li = s.layout ?? (st % layouts.length);
        const L = layouts[li];
        // the grid focus jumps a little every step (the "camera" re-frames)
        const fx = w * (0.205 + 0.03 * (H2(st, 1.3) - 0.5)) + (li === 2 ? -w * 0.03 : 0);
        const fy = h * (0.17 + 0.035 * (H2(st, 4.7) - 0.5));
        const g = FX.gridGeom(w, h, { fx, fy, cell, cellY: cell * 0.66, rx: 0.885, ry: 0.835 });
        grid.setGeom(g);
        const marks = [];
        const used = new Set();
        for (const d of L) {
          const id = d[0] === "text" ? "text:" + d[5] : d[0];
          const tl = tiles[id]; used.add(id);
          const r = g.rect(d[1], d[2], d[3], d[4]);
          // appear by distance from the focus as the grid builds
          const dist = Math.hypot(d[1], d[2]) / 8;
          const vis = p >= 1 ? 1 : clamp((p * 1.6 - 0.45 - dist * 0.5) / 0.12);
          tl.el.style.display = vis > 0 ? "" : "none";
          if (vis <= 0) continue;
          E.css(tl.el, { transform: `translate(${r.x.toFixed(1)}px,${r.y.toFixed(1)}px)`, width: r.w.toFixed(1) + "px", height: r.h.toFixed(1) + "px", opacity: vis.toFixed(3) });
          if (d[0] !== "text" && d[0] !== "tag" && d[0] !== "whisper" && d[0] !== "search" && d[0] !== "price") marks.push([d[1], d[2]], [d[1] + d[3], d[2]], [d[1], d[2] + d[4]], [d[1] + d[3], d[2] + d[4]]);
          if (d[0] === "macro") {
            const cw = 760, ch = 700, sc = Math.max(r.w / cw, r.h / ch);
            macro.el.style.transform = `translate(${((r.w - cw * sc) / 2).toFixed(1)}px,${((r.h - ch * sc) / 2).toFixed(1)}px) scale(${sc.toFixed(4)})`;
          } else if (d[0] === "face") {
            const fs = Math.min(r.w, r.h) / 120;
            E.css(tl.tc, { transform: `translate(${((r.w - 120 * fs) / 2).toFixed(1)}px,${((r.h - 120 * fs) / 2).toFixed(1)}px) scale(${fs.toFixed(4)})`, width: "120px", height: "120px" });
            tl.el._face.render({ mood: "happy", t });
          } else if (d[0] !== "thumb" && d[0] !== "macro") {
            const T = tl.T, fit = Math.min(r.w / T.w, r.h / T.h);
            E.css(tl.tc, { transform: `scale(${fit.toFixed(4)})`, width: (r.w / fit).toFixed(1) + "px", height: (r.h / fit).toFixed(1) + "px" });
          }
          if (tl.pct) {
            const v = PCTS[Math.min(PCTS.length - 1, Math.floor(st / 2) % (PCTS.length + 2))] || PCTS[PCTS.length - 1];
            if (tl.pct.textContent !== v) { tl.pct.textContent = v; tl.pct.style.color = v === "+36%" ? "#0f7fff" : "#ff6a2c"; }
          }
        }
        for (const id in tiles) if (!used.has(id)) tiles[id].el.style.display = "none";
        grid.render(p, { marks });
        if (macro && macroBox.style.display !== "none") {
          macro.render(t, { rot: 0.55 + t * 0.05 + (st % 3) * 0.015 });
          if (thumbCv && tiles.thumb && tiles.thumb.el.style.display !== "none") {
            const k = st + "";
            if (k !== lastKey) {
              lastKey = k;
              const tx = thumbCv.getContext("2d"), mc = macro.canvas;
              // a tighter crop of the same "photo" (a second shot from the shoot)
              tx.drawImage(mc, mc.width * 0.12, mc.height * 0.3, mc.width * 0.34, mc.height * 0.3, 0, 0, 240, 200);
            }
          }
        }
        el.style.opacity = s.alpha ?? 1;
      },
    };
  };
})();
