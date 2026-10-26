/* Recorrido 3D por el almacén de Distribuciones Valentín.
   Todo el movimiento es función del progreso del scroll (0 a 1): se puede ir y volver. */
(function () {
  'use strict';
  var html = document.documentElement;
  var story = document.getElementById('almacen');
  var canvas = document.getElementById('gl');
  if (!story || !canvas) return;

  function hasGL() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  }
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!window.THREE || !hasGL() || reduce) { html.classList.add('no3d'); return; }
  html.classList.add('has3d');

  var T = window.THREE;
  var DEBUG_P = (/[?&]p=([0-9.]+)/.exec(location.search) || [])[1];
  var small = Math.min(window.innerWidth, window.innerHeight) < 700;

  /* ---------- utilidades ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function rnd(seed) { // generador determinista
    var s = seed >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  var R = rnd(20251025);

  function build() {
  var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;

  var SKY = 0xcfe2f1;
  var scene = new T.Scene();
  scene.background = new T.Color(SKY);
  scene.fog = new T.Fog(SKY, 70, 210);
  var camera = new T.PerspectiveCamera(48, 1.6, 0.1, 500);

  var hemi = new T.HemisphereLight(0xf4f8ff, 0xb9b3a4, 0.62);
  scene.add(hemi);
  var sun = new T.DirectionalLight(0xfff1dc, 1.0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
  var sc = sun.shadow.camera;
  sc.left = -30; sc.right = 30; sc.top = 30; sc.bottom = -30; sc.near = 1; sc.far = 160;
  sun.shadow.bias = -0.0006;
  scene.add(sun); scene.add(sun.target);

  var maxAniso = renderer.capabilities.getMaxAnisotropy();
  function mat(hex, o) {
    o = o || {};
    return new T.MeshStandardMaterial({
      color: hex, roughness: o.r == null ? 0.82 : o.r, metalness: o.m || 0,
      transparent: !!o.t, opacity: o.o == null ? 1 : o.o, side: o.side || T.FrontSide,
      emissive: o.e || 0x000000, vertexColors: !!o.vc
    });
  }
  function add(parent, mesh, x, y, z, cast, recv) {
    mesh.position.set(x || 0, y || 0, z || 0);
    mesh.castShadow = cast !== false;
    mesh.receiveShadow = recv !== false;
    parent.add(mesh);
    return mesh;
  }
  function box(parent, w, h, d, m, x, y, z, cast, recv) {
    return add(parent, new T.Mesh(new T.BoxGeometry(w, h, d), m), x, y, z, cast, recv);
  }
  function canvasTex(w, h, draw) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var g = c.getContext('2d');
    draw(g, w, h);
    var t = new T.CanvasTexture(c);
    t.anisotropy = maxAniso;
    return t;
  }
  var FONT = '"Jost","Helvetica Neue",Arial,sans-serif';
  function fitText(g, text, maxW, size, weight) {
    g.font = weight + ' ' + size + 'px ' + FONT;
    var w = g.measureText(text).width;
    if (w > maxW) { size = size * maxW / w; g.font = weight + ' ' + size + 'px ' + FONT; }
    return size;
  }

  var dirty = true;
  var logoImg = new Image();
  var logoCallbacks = [];
  logoImg.onload = function () { logoCallbacks.forEach(function (f) { f(); }); dirty = true; kick(); };
  logoImg.src = window.LOGO_DATA;
  var logoTex = new T.Texture(logoImg);
  logoTex.anisotropy = maxAniso;
  logoImg.addEventListener('load', function () { logoTex.needsUpdate = true; });

  /* ---------- suelo, camino y escenario ---------- */
  var ground = new T.Mesh(new T.PlaneGeometry(900, 900), mat(0xa3b38f, { r: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
  scene.add(ground);

  (function () {
    var hm = [mat(0x9fb08b, { r: 1 }), mat(0xa9b997, { r: 1 }), mat(0x93a883, { r: 1 })];
    var RH = rnd(11);
    for (var i = 0; i < 16; i++) {
      var sz = 38 + RH() * 36;
      var h = new T.Mesh(new T.SphereGeometry(1, 16, 10), hm[i % 3]);
      h.scale.set(sz * 1.5, sz * 0.36, sz);
      h.position.set(-120 + RH() * 520, 0, (i % 2 ? -330 : 230) + RH() * 70);
      scene.add(h);
    }
  })();
  var ROAD_Z = -62;
  var road = new T.Mesh(new T.PlaneGeometry(400, 10), mat(0x3a3b3e, { r: 0.95 }));
  road.rotation.x = -Math.PI / 2; road.position.set(110, 0.02, ROAD_Z); road.receiveShadow = true;
  scene.add(road);
  var dashes = new T.InstancedMesh(new T.BoxGeometry(3, 0.02, 0.28), new T.MeshBasicMaterial({ color: 0xf2f2ee }), 70);
  (function () {
    var o = new T.Object3D();
    for (var i = 0; i < 70; i++) { o.position.set(-20 + i * 5.5, 0.04, ROAD_Z); o.updateMatrix(); dashes.setMatrixAt(i, o.matrix); }
  })();
  scene.add(dashes);
  var apron = new T.Mesh(new T.PlaneGeometry(46, 36), mat(0xa9aaa3, { r: 0.9 }));
  apron.rotation.x = -Math.PI / 2; apron.position.set(0, 0.012, -58); apron.receiveShadow = true;
  scene.add(apron);
  var forecourt = new T.Mesh(new T.PlaneGeometry(60, 40), mat(0xb4b5ae, { r: 0.9 }));
  forecourt.rotation.x = -Math.PI / 2; forecourt.position.set(0, 0.012, 20); forecourt.receiveShadow = true;
  scene.add(forecourt);

  /* ---------- nave ---------- */
  var building = new T.Group();
  scene.add(building);
  var WALL = mat(0xe3e5e7), REDM = mat(0xd4150f, { r: 0.6 });
  var HALF = 12, DEPTH = 48, HEIGHT = 10, DOORW = 4, DOORH = 5.4;

  box(building, 0.4, HEIGHT, DEPTH, WALL, -HALF - 0.2, HEIGHT / 2, -DEPTH / 2);
  box(building, 0.4, HEIGHT, DEPTH, WALL, HALF + 0.2, HEIGHT / 2, -DEPTH / 2);
  // fachada con hueco de puerta
  box(building, HALF - DOORW, HEIGHT, 0.4, WALL, -(HALF + DOORW) / 2, HEIGHT / 2, 0.2);
  box(building, HALF - DOORW, HEIGHT, 0.4, WALL, (HALF + DOORW) / 2, HEIGHT / 2, 0.2);
  box(building, DOORW * 2, HEIGHT - DOORH, 0.4, WALL, 0, DOORH + (HEIGHT - DOORH) / 2, 0.2);
  // fondo con hueco de muelle
  box(building, HALF - DOORW, HEIGHT, 0.4, WALL, -(HALF + DOORW) / 2, HEIGHT / 2, -DEPTH - 0.2);
  box(building, HALF - DOORW, HEIGHT, 0.4, WALL, (HALF + DOORW) / 2, HEIGHT / 2, -DEPTH - 0.2);
  box(building, DOORW * 2, HEIGHT - DOORH, 0.4, WALL, 0, DOORH + (HEIGHT - DOORH) / 2, -DEPTH - 0.2);
  // franja roja de la fachada
  box(building, HALF * 2 + 0.8, 1.7, 0.5, REDM, 0, 8.3, 0.45);
  box(building, HALF * 2 + 0.8, 0.5, 0.5, mat(0x2a2a2d), 0, 0.25, 0.45);
  // techo (no proyecta sombra para que el interior reciba luz)
  var roof = box(building, HALF * 2 + 1, 0.4, DEPTH + 1, mat(0xcfd2d4), 0, HEIGHT + 0.2, -DEPTH / 2, false, true);
  // suelo interior pulido
  var floor = new T.Mesh(new T.PlaneGeometry(HALF * 2, DEPTH), mat(0x9fa19e, { r: 0.5 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0.03, -DEPTH / 2); floor.receiveShadow = true;
  scene.add(floor);
  // pasillo señalizado
  [-2.2, 2.2].forEach(function (x) {
    var m = new T.Mesh(new T.PlaneGeometry(0.16, DEPTH - 2), new T.MeshBasicMaterial({ color: 0xf0c419 }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, 0.045, -DEPTH / 2); scene.add(m);
  });
  // luminarias
  var lamp = new T.MeshBasicMaterial({ color: 0xffffff });
  for (var lz = -5; lz > -DEPTH; lz -= 7) {
    [-6, 0, 6].forEach(function (lx) {
      var l = new T.Mesh(new T.BoxGeometry(4.2, 0.12, 0.5), lamp);
      l.position.set(lx, HEIGHT - 0.05, lz); scene.add(l);
    });
  }

  // puerta enrollable de la fachada
  var shutterMat = new T.MeshStandardMaterial({ color: 0xb9bcc0, roughness: 0.55, metalness: 0.35 });
  var shutter = new T.Mesh(new T.BoxGeometry(DOORW * 2, DOORH, 0.12), shutterMat);
  shutter.castShadow = true; scene.add(shutter);
  var ribs = new T.InstancedMesh(new T.BoxGeometry(DOORW * 2 - 0.05, 0.06, 0.18), new T.MeshStandardMaterial({ color: 0x8e9196, roughness: 0.6, metalness: 0.3 }), 18);
  scene.add(ribs);
  function setShutter(open) {
    var h = Math.max(0.05, DOORH * (1 - open));
    shutter.scale.y = h / DOORH;
    shutter.position.set(0, DOORH - h / 2, 0.1);
    var o = new T.Object3D();
    for (var i = 0; i < 18; i++) {
      var y = DOORH - (i + 0.5) * (h / 18);
      o.position.set(0, y, 0.12); o.updateMatrix(); ribs.setMatrixAt(i, o.matrix);
    }
    ribs.instanceMatrix.needsUpdate = true;
  }

  // rótulo de la fachada
  function drawSign() {
    var tex = canvasTex(2048, 360, function (g, w, h) {
      g.fillStyle = '#d4150f'; g.fillRect(0, 0, w, h);
      var cx = 190, cy = h / 2, r = 150;
      g.save(); g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.closePath(); g.clip();
      g.fillStyle = '#fff'; g.fillRect(cx - r, cy - r, r * 2, r * 2);
      if (logoImg.complete && logoImg.naturalWidth) { var sc2 = (r * 2) / logoImg.naturalWidth, ih = logoImg.naturalHeight * sc2; g.drawImage(logoImg, cx - r, cy - ih / 2, r * 2, ih); }
      g.restore();
      g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.textAlign = 'left';
      var s = fitText(g, 'DISTRIBUCIONES VALENTÍN', 1560, 190, 700);
      g.fillText('DISTRIBUCIONES VALENTÍN', 400, cy - 28);
      g.font = '500 ' + (s * 0.36) + 'px ' + FONT;
      g.fillText('ALIMENTACIÓN Y MENAJE PARA HOSTELERÍA · MEDINA DEL CAMPO', 404, cy + s * 0.62);
    });
    return tex;
  }
  var signMat = new T.MeshBasicMaterial({ map: drawSign() });
  var sign = new T.Mesh(new T.PlaneGeometry(HALF * 2 - 1.6, (HALF * 2 - 1.6) * 360 / 2048), signMat);
  sign.position.set(0, 8.3, 0.8); scene.add(sign);
  logoCallbacks.push(function () { signMat.map = drawSign(); signMat.needsUpdate = true; });

  /* ---------- estanterías ---------- */
  var KRAFT = [0xc7a06a, 0xb48a55, 0xd2b27d, 0xf2f2ee, 0xf2f2ee, 0xd4150f, 0x8fb0c4, 0x6d7d2b, 0x4a1a22, 0x2b2b2d];
  var SEG = 2.7, LEVELS = [0.35, 2.45, 4.55, 6.65], NSEG = 16, Z0 = -3;
  var beamGeo = new T.BoxGeometry(0.1, 0.18, SEG);
  var upGeo = new T.BoxGeometry(0.14, 7.4, 0.14);
  var beams = new T.InstancedMesh(beamGeo, mat(0xd4150f, { r: 0.55 }), NSEG * LEVELS.length * 4);
  var ups = new T.InstancedMesh(upGeo, mat(0x3a4452, { r: 0.6, m: 0.2 }), (NSEG + 1) * 4);
  beams.castShadow = ups.castShadow = true; beams.receiveShadow = ups.receiveShadow = true;
  var cartons = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), mat(0xffffff, { r: 0.9 }), 900);
  cartons.castShadow = true; cartons.receiveShadow = true;
  (function () {
    var o = new T.Object3D(), bi = 0, ui = 0, ci = 0, col = new T.Color();
    [-1, 1].forEach(function (side) {
      var cx = side * 10.9;
      for (var k = 0; k <= NSEG; k++) {
        var z = Z0 - k * SEG;
        [-0.62, 0.62].forEach(function (dx) {
          o.position.set(cx + dx, 3.7, z); o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1); o.updateMatrix(); ups.setMatrixAt(ui++, o.matrix);
        });
      }
      for (var k2 = 0; k2 < NSEG; k2++) {
        var zc = Z0 - k2 * SEG - SEG / 2;
        LEVELS.forEach(function (y) {
          [-0.62, 0.62].forEach(function (dx) {
            o.position.set(cx + dx, y, zc); o.updateMatrix(); beams.setMatrixAt(bi++, o.matrix);
          });
          var n = 2 + (R() > 0.55 ? 1 : 0);
          for (var j = 0; j < n; j++) {
            if (R() < 0.1) continue;
            var d = SEG / n - 0.16, w = 0.9 + R() * 0.25, h = 0.55 + R() * 0.4;
            o.position.set(cx + (R() - 0.5) * 0.08, y + 0.09 + h / 2, zc - SEG / 2 + (j + 0.5) * (SEG / n));
            o.rotation.set(0, 0, 0); o.scale.set(w, h, d); o.updateMatrix();
            cartons.setMatrixAt(ci, o.matrix);
            col.setHex(KRAFT[Math.floor(R() * KRAFT.length)]);
            cartons.setColorAt(ci, col);
            ci++;
          }
        });
      }
    });
    cartons.count = ci;
    beams.count = bi; ups.count = ui;
    // palés sueltos con cajas en el pasillo central (zona de despensa)
    var pg = new T.BoxGeometry(1.2, 0.16, 1.2);
    var pallets = new T.InstancedMesh(pg, mat(0xa98558, { r: 0.9 }), 12);
    pallets.castShadow = pallets.receiveShadow = true;
    var pi = 0;
    [[-7.5, -31], [-7.5, -35], [-7.5, -41], [7.8, -29], [7.8, -44], [-8.2, -45]].forEach(function (p) {
      o.position.set(p[0], 0.11, p[1]); o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1); o.updateMatrix(); pallets.setMatrixAt(pi++, o.matrix);
      var layers = 2 + Math.floor(R() * 2);
      for (var ly = 0; ly < layers; ly++) {
        o.position.set(p[0], 0.19 + 0.45 + ly * 0.9, p[1]); o.scale.set(1.1, 0.88, 1.1);
        o.rotation.set(0, (R() - 0.5) * 0.12, 0); o.updateMatrix();
        if (ci < 900) { cartons.setMatrixAt(ci, o.matrix); col.setHex(KRAFT[Math.floor(R() * KRAFT.length)]); cartons.setColorAt(ci, col); ci++; }
      }
    });
    pallets.count = pi; scene.add(pallets);
    cartons.count = ci;
  })();
  scene.add(beams); scene.add(ups); scene.add(cartons);

  // carteles de categoría colgados en las estanterías
  function labelPlane(text, w, h, bg, fg) {
    var tex = canvasTex(1024, Math.round(1024 * h / w), function (g, cw, ch) {
      g.fillStyle = bg; g.fillRect(0, 0, cw, ch);
      g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
      fitText(g, text, cw * 0.86, ch * 0.5, 700);
      g.fillText(text, cw / 2, ch / 2 + 4);
    });
    return new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex }));
  }
  [['LÁCTEOS', -1, -30], ['VINOS', -1, -34.5], ['AGUAS', -1, -39], ['MENAJE', -1, -43.5],
   ['ACEITE Y CONSERVAS', 1, -30], ['EMBUTIDOS', 1, -35.5], ['CONGELADOS', 1, -41]].forEach(function (L) {
    var m = labelPlane(L[0], 4.2, 0.95, '#d4150f', '#ffffff');
    m.position.set(L[1] * 10.2, 7.55, L[2]);
    m.rotation.y = L[1] < 0 ? Math.PI / 2 : -Math.PI / 2;
    scene.add(m);
  });

  /* ---------- escenario del café ---------- */
  var CAFE = { x: -5.5, z: -17 };
  function stage(cx, cz, panelCol, texDraw, plinthCol) {
    var g = new T.Group(); g.position.set(cx, 0, cz); scene.add(g);
    var plinth = new T.Mesh(new T.CylinderGeometry(3.4, 3.6, 0.5, 56), mat(plinthCol || 0x2b2b2e, { r: 0.55 }));
    add(g, plinth, 0, 0.25, 0);
    var panelTex = canvasTex(1024, 1152, texDraw);
    var panel = new T.Mesh(new T.BoxGeometry(8, 9, 0.3), [mat(panelCol), mat(panelCol), mat(panelCol), mat(panelCol),
      new T.MeshBasicMaterial({ map: panelTex }), mat(panelCol)]);
    add(g, panel, 0, 4.7, -5.2);
    return g;
  }
  var cafeStage = stage(CAFE.x, CAFE.z, 0x2c1a11, function (g, w, h) {
    g.fillStyle = '#2c1a11'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#d4150f'; g.fillRect(0, h - 150, w, 150);
    g.fillStyle = '#f4e8d2'; g.textAlign = 'center'; g.textBaseline = 'middle';
    fitText(g, 'MOCAY', w * 0.9, 360, 700); g.fillText('MOCAY', w / 2, h * 0.42);
    g.fillStyle = '#d9c3a0'; g.font = '500 62px ' + FONT; g.fillText('CAFÉ PARA HOSTELERÍA', w / 2, h * 0.64);
    g.fillStyle = '#fff'; g.font = '700 54px ' + FONT; g.fillText('DISTRIBUIMOS CAFÉ MOCAY', w / 2, h - 75);
  });

  // taza con platillo
  var CUP_BASE = 0.62;
  (function () {
    var cup = new T.Group(); cup.position.set(0, 0.5, 0); cafeStage.add(cup);
    var ceramic = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.18, metalness: 0.0, side: T.DoubleSide });
    var pts = [[0, 0.12], [1.05, 0.12], [1.18, 0.22], [1.45, 0.82], [1.7, 1.62], [1.8, 2.42], [1.72, 2.46], [1.62, 2.42],
      [1.58, 2.32], [1.4, 1.52], [1.1, 0.82], [0.9, 0.67], [0, 0.62]].map(function (p) { return new T.Vector2(p[0], p[1]); });
    add(cup, new T.Mesh(new T.LatheGeometry(pts, 48), ceramic), 0, 0, 0);
    var sauc = [[0, 0], [2.5, 0], [2.85, 0.16], [3.0, 0.3], [2.88, 0.32], [2.6, 0.2], [0, 0.12]].map(function (p) { return new T.Vector2(p[0], p[1]); });
    add(cup, new T.Mesh(new T.LatheGeometry(sauc, 56), ceramic), 0, 0, 0);
    var handle = new T.Mesh(new T.TorusGeometry(0.62, 0.17, 14, 28, Math.PI), ceramic);
    handle.rotation.z = -Math.PI / 2; add(cup, handle, 1.74, 1.55, 0);
    // franja roja de marca
    var band = new T.Mesh(new T.CylinderGeometry(1.74, 1.55, 0.2, 48, 1, true), new T.MeshStandardMaterial({ color: 0xd4150f, roughness: 0.4, side: T.DoubleSide }));
    add(cup, band, 0, 1.95, 0, false, false);
  })();

  // saco de yute
  (function () {
    var sack = new T.Group(); sack.position.set(CAFE.x + 1.2, 8.3, CAFE.z); sack.rotation.z = -2.35; scene.add(sack);
    var burlap = mat(0xb99c69, { r: 1 });
    var body = new T.Mesh(new T.CylinderGeometry(1.0, 1.15, 2.7, 24), burlap);
    add(sack, body, 0, 0, 0);
    var neck = new T.Mesh(new T.CylinderGeometry(0.55, 1.0, 0.7, 24), burlap);
    add(sack, neck, 0, -1.6, 0);
    var mouth = new T.Mesh(new T.TorusGeometry(0.58, 0.1, 10, 24), mat(0x8a7040, { r: 1 }));
    mouth.rotation.x = Math.PI / 2; add(sack, mouth, 0, -1.95, 0);
    [-0.6, 0.6].forEach(function () {});
    var tag = labelPlane('MOCAY', 1.5, 0.8, '#d4150f', '#ffffff');
    tag.position.set(0, 0.2, 1.17); tag.rotation.y = 0; sack.add(tag);
  })();

  [-0.9, 1.0].forEach(function (dx) {
    var rope = new T.Mesh(new T.CylinderGeometry(0.045, 0.045, 1.9, 6), mat(0x3a3a3a));
    rope.position.set(CAFE.x + 1.2 + dx * 0.9, 9.05, CAFE.z); scene.add(rope);
  });

  /* granos de café */
  var NB = small ? 480 : 900;
  var beanGeo = new T.SphereGeometry(1, 16, 12);
  beanGeo.scale(0.27, 0.185, 0.14);
  (function () {
    var p = beanGeo.attributes.position, cols = [];
    for (var i = 0; i < p.count; i++) {
      var groove = p.getZ(i) > 0.09 && Math.abs(p.getY(i)) < 0.022;
      var v = groove ? 0.28 : 1;
      cols.push(v, v, v);
    }
    beanGeo.setAttribute('color', new T.Float32BufferAttribute(cols, 3));
  })();
  var beans = new T.InstancedMesh(beanGeo, new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, vertexColors: true }), NB);
  beans.castShadow = true; beans.receiveShadow = true; beans.frustumCulled = false;
  scene.add(beans);
  var bean = [];
  (function () {
    var col = new T.Color(), RB = rnd(7);
    var mouthY = 7.1, mx = CAFE.x + 0.05, mz = CAFE.z;
    for (var i = 0; i < NB; i++) {
      var f = i / NB, spill = RB() < 0.07, fx, fy, fz;
      if (spill) {
        var a = RB() * 6.283, r = 2.1 + RB() * 1.1;
        fx = CAFE.x + Math.cos(a) * r; fz = CAFE.z + Math.sin(a) * r; fy = 0.5 + 0.07;
      } else {
        fy = CUP_BASE + 0.5 + 0.18 + Math.pow(f, 0.8) * 1.95 + RB() * 0.12;
        var yl = fy - (CUP_BASE + 0.5);
        var rin = (0.7 + 0.82 * clamp((yl - 0.4) / 1.8, 0, 1)) * 0.82;
        if (yl > 2.0) rin *= 1 - (yl - 2.0) * 1.6;
        var a2 = RB() * 6.283, r2 = Math.sqrt(RB()) * Math.max(0.15, rin);
        fx = CAFE.x + Math.cos(a2) * r2; fz = CAFE.z + Math.sin(a2) * r2;
      }
      bean.push({
        sx: mx + (RB() - 0.5) * 0.5, sz: mz + (RB() - 0.5) * 0.5, sy: mouthY,
        fx: fx, fy: fy, fz: fz,
        s: f * 0.8 + RB() * 0.02, d: 0.15 + RB() * 0.05,
        rx: RB() * 6.28, ry: RB() * 6.28, rz: RB() * 6.28, sp: 3 + RB() * 7,
        k: 0.85 + RB() * 0.35
      });
      col.setHex([0x3a2112, 0x4a2a16, 0x5a3519, 0x2f1a0e][Math.floor(RB() * 4)]);
      beans.setColorAt(i, col);
    }
  })();
  var dummy = new T.Object3D();
  function updateBeans(cp) {
    for (var i = 0; i < NB; i++) {
      var b = bean[i], t = clamp((cp - b.s) / b.d, 0, 1);
      if (t <= 0) { dummy.scale.set(0, 0, 0); dummy.position.set(0, -50, 0); }
      else {
        var e = t * t;
        dummy.scale.set(b.k, b.k, b.k);
        dummy.position.set(lerp(b.sx, b.fx, t) + Math.sin(t * 8 + i) * 0.05 * (1 - t), lerp(b.sy, b.fy, e), lerp(b.sz, b.fz, t));
        var spin = t < 1 ? b.sp * t : b.sp;
        dummy.rotation.set(b.rx + spin, b.ry + spin * 0.7, b.rz);
      }
      dummy.updateMatrix();
      beans.setMatrixAt(i, dummy.matrix);
    }
    beans.instanceMatrix.needsUpdate = true;
  }

  /* ---------- escenario de las bebidas ---------- */
  var BEER = { x: 5.5, z: -35 };
  var beerStage = stage(BEER.x, BEER.z, 0x1f2a35, function (g, w, h) {
    g.fillStyle = '#1f2a35'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#d4150f'; g.fillRect(0, h - 150, w, 150);
    g.fillStyle = '#f3b23b'; g.textAlign = 'center'; g.textBaseline = 'middle';
    fitText(g, 'BEBIDAS', w * 0.9, 300, 700); g.fillText('BEBIDAS', w / 2, h * 0.42);
    g.fillStyle = '#e6edf3'; g.font = '500 62px ' + FONT; g.fillText('AGUAS, VINOS Y MÁS', w / 2, h * 0.64);
    g.fillStyle = '#fff'; g.font = '700 54px ' + FONT; g.fillText('PARA TODA LA CARTA', w / 2, h - 75);
  }, 0x2b2b2e);
  var GLASS_H = 3.5, GLASS_BASE = 0.5;
  function rOut(y) { return 1.0 + 0.62 * (y / GLASS_H); }
  function rIn(y) { return rOut(y) - 0.08; }
  var glassMat = new T.MeshStandardMaterial({ color: 0xe9f6ff, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.22, side: T.DoubleSide, depthWrite: false });
  var glassGrp = new T.Group(); glassGrp.position.y = GLASS_BASE; beerStage.add(glassGrp);
  (function () {
    var pts = [], i;
    for (i = 0; i <= 8; i++) { var y = GLASS_H * i / 8; pts.push(new T.Vector2(rOut(y), y)); }
    pts.push(new T.Vector2(rOut(GLASS_H) - 0.04, GLASS_H + 0.03));
    for (i = 8; i >= 0; i--) { var y2 = Math.max(0.3, GLASS_H * i / 8); pts.push(new T.Vector2(rIn(y2), y2)); }
    pts.push(new T.Vector2(0, 0.3));
    var gm = new T.Mesh(new T.LatheGeometry(pts, 48), glassMat);
    gm.castShadow = false; gm.renderOrder = 3; glassGrp.add(gm);
    var base = new T.Mesh(new T.CylinderGeometry(1.0, 1.0, 0.3, 48), new T.MeshStandardMaterial({ color: 0xcfe4f0, roughness: 0.1, transparent: true, opacity: 0.55 }));
    base.position.y = 0.15; glassGrp.add(base);
  })();
  var beerMat = new T.MeshStandardMaterial({ color: 0xe8a317, roughness: 0.25, emissive: 0x9a5d00, emissiveIntensity: 0.28, transparent: true, opacity: 0.93 });
  var beerMesh = new T.Mesh(new T.BufferGeometry(), beerMat);
  glassGrp.add(beerMesh);
  var foam = new T.Group(); glassGrp.add(foam);
  var foamMat = new T.MeshStandardMaterial({ color: 0xfff7e6, roughness: 1 });
  var foamBody = new T.Mesh(new T.CylinderGeometry(1, 1, 1, 40), foamMat);
  var foamDome = new T.Mesh(new T.SphereGeometry(1, 36, 12, 0, Math.PI * 2, 0, Math.PI / 2), foamMat);
  foam.add(foamBody); foam.add(foamDome);
  var lastLevel = -1;
  function setBeer(level, foamH) {
    level = Math.max(0.31, level);
    if (Math.abs(level - lastLevel) > 0.004) {
      var pts = [new T.Vector2(0, 0.3)], n = 10;
      for (var i = 0; i <= n; i++) { var y = 0.3 + (level - 0.3) * i / n; pts.push(new T.Vector2(rIn(y) - 0.02, y)); }
      pts.push(new T.Vector2(0, level));
      beerMesh.geometry.dispose();
      beerMesh.geometry = new T.LatheGeometry(pts, 40);
      lastLevel = level;
    }
    var r = rIn(level) - 0.02;
    foamBody.scale.set(r, Math.max(0.001, foamH), r); foamBody.position.y = level + foamH / 2;
    foamDome.scale.set(r, Math.max(0.001, foamH * 0.7), r); foamDome.position.y = level + foamH;
    foam.visible = foamH > 0.02;
  }
  // burbujas
  var NBUB = 80;
  var bubbles = new T.InstancedMesh(new T.SphereGeometry(1, 8, 6), new T.MeshBasicMaterial({ color: 0xfff1c2, transparent: true, opacity: 0.75 }), NBUB);
  glassGrp.add(bubbles); bubbles.frustumCulled = false;
  var bub = [];
  (function () { var RB = rnd(99); for (var i = 0; i < NBUB; i++) bub.push({ a: RB() * 6.28, r: Math.sqrt(RB()), ph: RB(), sp: 0.6 + RB() * 1.2, sz: 0.035 + RB() * 0.05 }); })();
  function updateBubbles(level, active) {
    for (var i = 0; i < NBUB; i++) {
      var b = bub[i];
      if (!active || level < 0.6) { dummy.scale.set(0, 0, 0); dummy.position.set(0, -20, 0); }
      else {
        var y = 0.35 + ((b.ph + bp * b.sp * 2.4) % 1) * (level - 0.45);
        var rr = Math.max(0.05, rIn(y) - 0.2) * b.r;
        dummy.position.set(Math.cos(b.a) * rr, y, Math.sin(b.a) * rr);
        dummy.scale.set(b.sz, b.sz, b.sz);
      }
      dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); bubbles.setMatrixAt(i, dummy.matrix);
    }
    bubbles.instanceMatrix.needsUpdate = true;
  }
  // botella
  var bottle = new T.Group(); beerStage.add(bottle);
  var brown = new T.MeshStandardMaterial({ color: 0x5a2d0c, roughness: 0.12, metalness: 0.05, transparent: true, opacity: 0.92 });
  add(bottle, new T.Mesh(new T.CylinderGeometry(0.6, 0.6, 2.2, 28), brown), 0, 0, 0);
  add(bottle, new T.Mesh(new T.CylinderGeometry(0.23, 0.6, 0.72, 28), brown), 0, 1.46, 0);
  add(bottle, new T.Mesh(new T.CylinderGeometry(0.23, 0.23, 0.9, 20), brown), 0, 2.27, 0);
  add(bottle, new T.Mesh(new T.CylinderGeometry(0.62, 0.62, 0.9, 28), mat(0xf3efe6, { r: 0.6 })), 0, -0.05, 0, false);
  add(bottle, new T.Mesh(new T.CylinderGeometry(0.63, 0.63, 0.22, 28), mat(0xd4150f, { r: 0.5 })), 0, 0.2, 0, false);
  var capMesh = add(bottle, new T.Mesh(new T.CylinderGeometry(0.28, 0.28, 0.13, 20), mat(0xd4150f, { r: 0.4 })), 0, 2.76, 0);
  var TIP = 2.72;
  var tipWorld = { x: 0.34, y: GLASS_BASE + GLASS_H + 1.35 };
  var stream = new T.Mesh(new T.CylinderGeometry(0.085, 0.07, 1, 14), new T.MeshStandardMaterial({ color: 0xf0b23a, roughness: 0.1, emissive: 0x9a5d00, emissiveIntensity: 0.3, transparent: true, opacity: 0.92 }));
  stream.castShadow = false; beerStage.add(stream);
  var NSP = 14;
  var splash = new T.InstancedMesh(new T.SphereGeometry(1, 8, 6), new T.MeshStandardMaterial({ color: 0xf6c15a, roughness: 0.2, transparent: true, opacity: 0.9 }), NSP);
  splash.frustumCulled = false; beerStage.add(splash);
  var bp = 0;
  function updateBeer(p) {
    bp = clamp((p - 0.5) / 0.2, 0, 1);
    var tilt = lerp(0.95, 2.1, smooth(bp / 0.2));
    var ox = tipWorld.x - TIP * (-Math.sin(tilt)), oy = tipWorld.y - TIP * Math.cos(tilt);
    bottle.position.set(ox, oy, 0); bottle.rotation.set(0, 0, tilt);
    capMesh.visible = false;
    var pour = smooth((bp - 0.16) / 0.06) * (1 - smooth((bp - 0.94) / 0.06));
    var fill = smooth((bp - 0.16) / 0.74);
    var level = 0.3 + fill * (GLASS_H - 0.55);
    var fH = smooth((bp - 0.2) / 0.7) * 0.62;
    setBeer(level, fH);
    var surfY = GLASS_BASE + level + fH * 0.9;
    var L = Math.max(0.01, tipWorld.y - surfY);
    stream.visible = pour > 0.02;
    stream.scale.set(pour, L, pour);
    stream.position.set(tipWorld.x, tipWorld.y - L / 2, 0);
    for (var i = 0; i < NSP; i++) {
      var a = i / NSP * 6.28 + bp * 20, rr = 0.18 + 0.22 * ((i * 7) % 5) / 5, hh = Math.abs(Math.sin(bp * 60 + i * 1.7)) * 0.3;
      if (pour > 0.3) {
        dummy.position.set(tipWorld.x + Math.cos(a) * rr, surfY + hh, Math.sin(a) * rr);
        var sz = 0.045 + 0.03 * ((i * 3) % 4) / 4; dummy.scale.set(sz, sz, sz);
      } else { dummy.scale.set(0, 0, 0); dummy.position.set(0, -20, 0); }
      dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); splash.setMatrixAt(i, dummy.matrix);
    }
    splash.instanceMatrix.needsUpdate = true;
    updateBubbles(level, fill > 0.03);
  }

  /* ---------- camioneta ---------- */
  function makeTruck() {
    var g = new T.Group();
    var white = mat(0xf6f6f3, { r: 0.45 }), red = mat(0xd4150f, { r: 0.4 }), dark = mat(0x2a2a2d, { r: 0.6 });
    // chasis
    box(g, 7.6, 0.35, 2.5, dark, -0.6, 0.78, 0);
    // caja de carga abierta por detrás
    var cx = -1.8, len = 5.6;
    box(g, len, 0.14, 2.5, white, cx, 1.02, 0);
    box(g, len, 0.14, 2.62, white, cx, 3.5, 0);
    box(g, len, 2.4, 0.14, white, cx, 2.26, 1.24);
    box(g, len, 2.4, 0.14, white, cx, 2.26, -1.24);
    box(g, 0.14, 2.4, 2.5, white, cx + len / 2 - 0.07, 2.26, 0);
    box(g, len + 0.04, 0.6, 0.18, red, cx, 1.42, 1.25);
    box(g, len + 0.04, 0.6, 0.18, red, cx, 1.42, -1.25);
    box(g, 0.12, 2.3, 2.38, mat(0xd9d9d4, { r: 0.8 }), cx - len / 2 + 0.2, 2.26, 0, false); // fondo interior algo más oscuro
    // logotipo a los dos lados
    var logoMat = new T.MeshBasicMaterial({ map: logoTex, transparent: true });
    var lw = 2.5, lh = lw * 192 / 204;
    var l1 = new T.Mesh(new T.PlaneGeometry(lw, lh), logoMat); l1.position.set(cx + 0.2, 2.45, 1.335); g.add(l1);
    var l2 = new T.Mesh(new T.PlaneGeometry(lw, lh), logoMat); l2.position.set(cx + 0.2, 2.45, -1.335); l2.rotation.y = Math.PI; g.add(l2);
    // cabina
    box(g, 2.0, 1.25, 2.5, red, 2.0, 1.55, 0);
    box(g, 1.4, 1.1, 2.4, red, 1.75, 2.7, 0);
    var glassM = mat(0x25323a, { r: 0.08, m: 0.4 });
    var ws = box(g, 0.08, 0.95, 2.1, glassM, 2.5, 2.7, 0, false); ws.rotation.z = -0.28;
    box(g, 0.9, 0.7, 0.08, glassM, 1.85, 2.72, 1.21, false);
    box(g, 0.9, 0.7, 0.08, glassM, 1.85, 2.72, -1.21, false);
    box(g, 0.34, 0.4, 2.6, dark, 3.1, 0.82, 0);
    var hl = new T.MeshBasicMaterial({ color: 0xffe9a8 });
    box(g, 0.06, 0.26, 0.44, hl, 3.02, 1.5, 0.82, false);
    box(g, 0.06, 0.26, 0.44, hl, 3.02, 1.5, -0.82, false);
    box(g, 0.1, 0.1, 0.5, mat(0x1a1a1a), 3.05, 1.12, 0, false);
    // ruedas
    var wheels = [];
    [[-3.1, 1.25], [-3.1, -1.25], [2.0, 1.25], [2.0, -1.25]].forEach(function (w) {
      var piv = new T.Group(); piv.position.set(w[0], 0.52, w[1]); g.add(piv);
      var tire = new T.Mesh(new T.CylinderGeometry(0.52, 0.52, 0.42, 24), mat(0x161616, { r: 0.9 }));
      tire.rotation.x = Math.PI / 2; tire.castShadow = true; piv.add(tire);
      var hub = new T.Mesh(new T.CylinderGeometry(0.26, 0.26, 0.45, 16), mat(0xbdbdbd, { r: 0.35, m: 0.6 }));
      hub.rotation.x = Math.PI / 2; piv.add(hub);
      var nut = new T.Mesh(new T.BoxGeometry(0.08, 0.34, 0.47), mat(0x777777)); piv.add(nut);
      wheels.push(piv);
    });
    return { group: g, wheels: wheels };
  }
  var truck = makeTruck();
  scene.add(truck.group);
  var YARD = { x: 3, z: -58.5 };
  var HERO = { x: 14.2, z: 9.5, ry: -0.3 };

  // cajas que se cargan
  var NLOAD = 12;
  var loadGeo = new T.BoxGeometry(0.9, 0.85, 0.9);
  var loadMesh = new T.InstancedMesh(loadGeo, mat(0xffffff, { r: 0.9 }), NLOAD);
  loadMesh.castShadow = true; loadMesh.receiveShadow = true; loadMesh.frustumCulled = false;
  scene.add(loadMesh);
  var loads = [];
  (function () {
    var col = new T.Color(), RL = rnd(5);
    for (var i = 0; i < NLOAD; i++) {
      var sx = 3.6 + (i % 3) * 1.0, sy = 0.45 + Math.floor(i / 6) * 0.9, sz = -44.9 - (Math.floor(i / 3) % 2) * 1.0;
      var slot = { x: -4.1 + (i % 3) * 1.05, y: 1.5 + Math.floor(i / 6) * 0.95, z: ((Math.floor(i / 3) % 2) ? 0.55 : -0.55) };
      loads.push({ sx: sx, sy: sy, sz: sz, slot: slot, s: (i / NLOAD) * 0.62, d: 0.38, ry: (RL() - 0.5) * 0.4 });
      col.setHex([0xc7a06a, 0xb48a55, 0xf2f2ee, 0xd2b27d][Math.floor(RL() * 4)]);
      loadMesh.setColorAt(i, col);
    }
  })();
  // palé en el muelle
  box(scene, 3.6, 0.16, 2.4, mat(0xa98558, { r: 0.9 }), 4.6, 0.11, -45.4);
  function bez(a, b, c, d, t) { var u = 1 - t; return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d; }
  var truckX = YARD.x;
  function updateLoads(p) {
    var lp = clamp((p - 0.78) / 0.1, 0, 1);
    var tx = truckX - YARD.x;
    for (var i = 0; i < NLOAD; i++) {
      var L = loads[i], t = clamp((lp - L.s) / L.d, 0, 1);
      var tgx = YARD.x + tx + L.slot.x, tgy = L.slot.y, tgz = YARD.z + L.slot.z;
      var e = smooth(t);
      dummy.position.set(
        bez(L.sx, L.sx + 0.5, tgx - 1.5, tgx, e),
        bez(L.sy, L.sy + 3.2, tgy + 3.0, tgy, e),
        bez(L.sz, L.sz - 3.5, tgz + 3, tgz, e));
      dummy.rotation.set(0, L.ry * (1 - e), (1 - e) * Math.sin(e * 3.14) * 0.5);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix(); loadMesh.setMatrixAt(i, dummy.matrix);
    }
    loadMesh.instanceMatrix.needsUpdate = true;
  }

  /* ---------- entorno: árboles, postes y carteles ---------- */
  (function () {
    var RT = rnd(321);
    var N = 130;
    var trunk = new T.InstancedMesh(new T.CylinderGeometry(0.16, 0.2, 1.4, 6), mat(0x6e5a44), N);
    var crown = new T.InstancedMesh(new T.ConeGeometry(1.1, 2.6, 7), mat(0x86a870, { r: 0.95 }), N);
    var crown2 = new T.InstancedMesh(new T.ConeGeometry(0.85, 2.0, 7), mat(0x93b57c, { r: 0.95 }), N);
    crown.castShadow = crown2.castShadow = trunk.castShadow = true;
    var o = new T.Object3D(), col = new T.Color(), c = 0;
    for (var i = 0; i < N; i++) {
      var x, z;
      if (i < 20) { x = (RT() < 0.5 ? -1 : 1) * (15 + RT() * 20); z = 10 + RT() * 40; }
      else if (i < 40) { x = (RT() < 0.5 ? -1 : 1) * (15 + RT() * 14); z = -RT() * 50; }
      else { x = -20 + RT() * 200; z = (RT() < 0.5 ? -1 : 1) * (9 + RT() * 22) + ROAD_Z; }
      if (Math.abs(x) < 14 && z > -50 && z < 8) continue;
      if (x > -16 && x < 26 && z > -72 && z < -46) continue;
      var s = 0.8 + RT() * 0.9;
      o.position.set(x, 0.7 * s, z); o.scale.set(s, s, s); o.rotation.set(0, 0, 0); o.updateMatrix(); trunk.setMatrixAt(c, o.matrix);
      o.position.set(x, 2.3 * s, z); o.updateMatrix(); crown.setMatrixAt(c, o.matrix);
      o.position.set(x, 3.6 * s, z); o.updateMatrix(); crown2.setMatrixAt(c, o.matrix);
      c++;
    }
    trunk.count = crown.count = crown2.count = c;
    scene.add(trunk); scene.add(crown); scene.add(crown2);
    // carteles de la carretera
    [['RUEDA', '14 km', 34], ['OLMEDO', '22 km', 62], ['TORDESILLAS', '26 km', 90], ['VALLADOLID', '45 km', 118]].forEach(function (s) {
      var g = new T.Group(); g.position.set(s[2], 0, ROAD_Z + 7.2); scene.add(g);
      box(g, 0.18, 4.4, 0.18, mat(0x555a60), -1.9, 2.2, 0); box(g, 0.18, 4.4, 0.18, mat(0x555a60), 1.9, 2.2, 0);
      var tex = canvasTex(1024, 400, function (gg, w, h) {
        gg.fillStyle = '#0f5a96'; gg.fillRect(0, 0, w, h);
        gg.fillStyle = '#fff'; gg.fillRect(14, 14, w - 28, h - 28); gg.fillStyle = '#0f5a96'; gg.fillRect(26, 26, w - 52, h - 52);
        gg.fillStyle = '#fff'; gg.textAlign = 'center'; gg.textBaseline = 'middle';
        fitText(gg, s[0], w * 0.8, 150, 700); gg.fillText(s[0], w / 2, h * 0.38);
        gg.font = '500 100px ' + FONT; gg.fillText(s[1], w / 2, h * 0.72);
      });
      var board = new T.Mesh(new T.BoxGeometry(4.6, 1.8, 0.12), [mat(0x0f5a96), mat(0x0f5a96), mat(0x0f5a96), mat(0x0f5a96), new T.MeshBasicMaterial({ map: tex }), mat(0x0f5a96)]);
      add(g, board, 0, 3.7, 0);
    });
    // cartel final
    var g2 = new T.Group(); g2.position.set(170, 0, ROAD_Z + 8); scene.add(g2);
    box(g2, 0.25, 5.6, 0.25, mat(0x555a60), -3.2, 2.8, 0); box(g2, 0.25, 5.6, 0.25, mat(0x555a60), 3.2, 2.8, 0);
    var tex2 = canvasTex(1536, 540, function (gg, w, h) {
      gg.fillStyle = '#d4150f'; gg.fillRect(0, 0, w, h);
      gg.fillStyle = '#fff'; gg.textAlign = 'center'; gg.textBaseline = 'middle';
      fitText(gg, 'REPARTO HASTA 90 KM', w * 0.88, 170, 700); gg.fillText('REPARTO HASTA 90 KM', w / 2, h * 0.4);
      gg.font = '500 90px ' + FONT; gg.fillText('DESDE MEDINA DEL CAMPO', w / 2, h * 0.74);
    });
    add(g2, new T.Mesh(new T.PlaneGeometry(8, 2.8), new T.MeshBasicMaterial({ map: tex2 })), 0, 4.6, 0.18);
    box(g2, 8.2, 3, 0.2, mat(0x2a2a2d), 0, 4.6, 0, true);
  })();

  /* ---------- cámara ---------- */
  var KEYS = [
    [0.00, 4.5, 3.6, 33, 2.5, 4.4, 0],
    [0.08, 2.0, 3.0, 20, 0, 3.6, 0],
    [0.15, 0.0, 2.6, 8, 0, 3.0, -6],
    [0.21, 0.0, 2.5, -3, -2, 3.0, -14],
    [0.27, -0.5, 3.4, -3, -5.5, 4.4, -17],
    [0.44, 0.0, 3.6, -5, -5.5, 4.2, -17],
    [0.50, 0.0, 3.0, -17, 3, 3.0, -30],
    [0.57, 0.8, 3.6, -24, 5.5, 4.2, -35],
    [0.71, 1.0, 3.7, -25, 5.5, 4.1, -35],
    [0.77, 0.0, 3.0, -36, 2, 2.8, -52],
    [0.81, -4.0, 2.8, -40, 2, 1.9, -56],
    [0.845, -1.0, 2.9, -47.5, 2.5, 1.9, -58],
    [0.88, -6.0, 3.2, -56, 3, 1.9, -59]
  ];
  var camPos = new T.Vector3(), camLook = new T.Vector3();
  function hermite(p, ci) {
    var n = KEYS.length, k = 0;
    while (k < n - 2 && p > KEYS[k + 1][0]) k++;
    var a = KEYS[k], b = KEYS[k + 1], h = b[0] - a[0], t = clamp((p - a[0]) / h, 0, 1);
    var prev = KEYS[Math.max(0, k - 1)], next = KEYS[Math.min(n - 1, k + 2)];
    var m0 = (b[ci] - prev[ci]) / (b[0] - prev[0] || 1), m1 = (next[ci] - a[ci]) / (next[0] - a[0] || 1);
    if (k === 0) m0 = (b[ci] - a[ci]) / h; if (k === n - 2) m1 = (b[ci] - a[ci]) / h;
    var t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * a[ci] + (t3 - 2 * t2 + t) * h * m0 + (-2 * t3 + 3 * t2) * b[ci] + (t3 - t2) * h * m1;
  }
  function cameraAt(p) {
    var q = Math.min(p, 0.88);
    camPos.set(hermite(q, 1), hermite(q, 2), hermite(q, 3));
    camLook.set(hermite(q, 4), hermite(q, 5), hermite(q, 6));
    if (camera.aspect < 0.8 && p < 0.25) {
      var pull = lerp(1.45, 1, smooth((p - 0.02) / 0.2));
      camPos.set(camLook.x + (camPos.x - camLook.x) * pull, camPos.y, camLook.z + (camPos.z - camLook.z) * pull);
    }
    if (p > 0.88) {
      var s = clamp((p - 0.9) / 0.1, 0, 1), w = smooth((p - 0.88) / 0.04);
      var fx = truckX - 13 - s * 3, fy = 3.6 + 9 * smooth(s), fz = -50 - 3 * s;
      camPos.set(lerp(camPos.x, fx, w), lerp(camPos.y, fy, w), lerp(camPos.z, fz, w));
      camLook.set(lerp(camLook.x, truckX + 1.5, w), lerp(camLook.y, 1.6, w), lerp(camLook.z, ROAD_Z + 3, w));
    }
  }

  /* ---------- actualización por progreso ---------- */
  function update(p) {
    // camioneta
    var s = clamp((p - 0.9) / 0.1, 0, 1);
    truckX = YARD.x + 140 * smooth(s) * (0.35 + 0.65 * smooth(s));
    if (p < 0.46) {
      truck.group.position.set(HERO.x, 0, HERO.z); truck.group.rotation.y = HERO.ry;
      truck.wheels.forEach(function (w) { w.rotation.z = 0; });
    } else {
      truck.group.position.set(truckX, 0, YARD.z); truck.group.rotation.y = 0;
      truck.wheels.forEach(function (w) { w.rotation.z = -(truckX - YARD.x) / 0.52; });
    }
    setShutter(smooth((p - 0.06) / 0.1));
    updateBeans(clamp((p - 0.25) / 0.2, 0, 1));
    updateBeer(p);
    updateLoads(p);
    cameraAt(p);
    camera.position.copy(camPos); camera.lookAt(camLook);
    sun.position.set(camLook.x + 28, 48, camLook.z + 20);
    sun.target.position.copy(camLook);
    sun.target.updateMatrixWorld();
  }

  /* ---------- capítulos de texto ---------- */
  var chaps = Array.prototype.slice.call(story.querySelectorAll('.chap')).map(function (el) {
    return { el: el, a: +el.dataset.a, b: +el.dataset.b, c: +el.dataset.c, d: +el.dataset.d };
  });
  function updateChaps(p) {
    chaps.forEach(function (c) {
      var o = smooth((p - c.a) / (c.b - c.a)) * (1 - smooth((p - c.c) / (c.d - c.c)));
      c.el.style.opacity = o.toFixed(3);
      c.el.style.transform = 'translateY(' + ((1 - o) * 14).toFixed(1) + 'px)';
      c.el.style.visibility = o < 0.01 ? 'hidden' : 'visible';
      c.el.style.pointerEvents = o > 0.6 ? 'auto' : 'none';
    });
    var bar = document.getElementById('storyBar');
    if (bar) bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
  }

  /* ---------- bucle ---------- */
  var target = 0, cur = 0, running = false, visible = true;
  function resize() {
    var w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = camera.aspect < 0.8 ? 66 : camera.aspect < 1.2 ? 56 : 48;
    camera.updateProjectionMatrix();
    dirty = true; kick();
  }
  function readScroll() {
    var r = story.getBoundingClientRect();
    var max = r.height - window.innerHeight;
    target = clamp(-r.top / (max > 0 ? max : 1), 0, 1);
    visible = r.bottom > -50 && r.top < window.innerHeight + 50;
  }
  function frame() {
    running = false;
    if (DEBUG_P == null) {
      cur += (target - cur) * 0.12;
      if (Math.abs(target - cur) < 0.0004) cur = target;
    }
    if (visible) {
      update(cur); updateChaps(cur);
      renderer.render(scene, camera);
      canvas.classList.add('ready');
    }
    dirty = false;
    if (cur !== target) kick();
  }
  function kick() { if (!running) { running = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', function () { if (DEBUG_P != null) return; readScroll(); kick(); }, { passive: true });
  window.addEventListener('resize', resize);

  function start() {
    resize();
    if (DEBUG_P != null) { cur = target = parseFloat(DEBUG_P); visible = true; }
    else { readScroll(); cur = target; }
    kick();
  }
  start();
  }

  // las etiquetas se dibujan en canvas: se espera a que cargue la tipografía
  if (document.fonts && document.fonts.load) {
    Promise.race([
      Promise.all([document.fonts.load('700 100px Jost'), document.fonts.load('500 60px Jost')]),
      new Promise(function (r) { setTimeout(r, 1500); })
    ]).then(build, build);
  } else build();
})();
