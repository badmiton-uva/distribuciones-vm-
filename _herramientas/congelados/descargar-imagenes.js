// Descarga las imágenes que faltan de la sección Congelados.
// Cómo usarlo: abre https://www.panamarbakery.com/catalogo-panamar en tu navegador,
// baja hasta el final de la página para que cargue todo, abre la consola
// (F12 → pestaña «Consola»), pega este código completo y pulsa Intro.
// El navegador guardará los archivos en tu carpeta de Descargas (acepta las descargas múltiples si lo pide).
(async () => {
  const necesarias = [
  "12151_supernapolit_choco135_2967_Normal.png",
  "12286_baguette_r_Normal.png",
  "130421-paninideverdurasvegano_7354_Normal.png",
  "13339napolitana_jamonyqueso_0179copia_Normal.png",
  "161546620413390normal_Normal.png",
  "161546635213696normal_Normal.png",
  "161546648013383normal_Normal.png",
  "161546741713468normal_Normal.png",
  "161546777813956normal_Normal.png",
  "161547122312123normal_Normal.png",
  "16154721488282normal_Normal.png",
  "161547470813962normal_Normal.png",
  "161547608612166normal_Normal.png",
  "161547828712340normal_Normal.png",
  "161548040312171normal_Normal.png",
  "161548082513001normal_Normal.png",
  "16154813346007normal_Normal.png",
  "161548346112698normal_Normal.png",
  "161548348412463normal_Normal.png",
  "161548409412699normal_Normal.png",
  "1698923171130787_cookie-doble-chocolate_Normal.png",
  "1710158611130868_empanadilla_tomateatun125_int_duo_Normal.png",
  "308_Normal.png",
  "_0000_130578_napol_choco_decor120_vista_Normal.png",
  "_0000_130949_berlina_super_choco_Normal.png",
  "_0001_1261_mini_croissant_recto_marga22_Normal.png",
  "_0001_130572_napolitana_crema_decor120_vista_Normal.png",
  "_0002_131042_palmera_soft160_Normal.png",
  "_0003_13324_1-pepito-crema-azucarado_Normal.png",
  "_0004_13325_1-pepito-choco-azucarado-capas_Normal.png",
  "_0006_13279_Normal.png",
  "_0007_130577_berliblanca_rayada115_Normal.png",
  "_0007_13112_1-croissant-artesano-margcopia_Normal.png",
  "_0009_12177__Normal.png",
  "_0012_12309_Normal.png",
  "_0012_130686croissantrellenocacao52g_Normal.png",
  "_0013_12585-ensaimada-grande-hojaldrada-95g_Normal.png",
  "_0013_130398_Normal.png",
  "_0016_12317_1-maxi-hoops-bombon_Normal.png",
  "_0018_131044_hoop_caramel82_Normal.png",
  "_0018_13934_croissant_recto_supreme60_Normal.png",
  "_0024_13308_Normal.png",
  "brioche_lingote_Normal.png",
  "precui89_1_Normal.png"
];
  const urls = {};
  document.querySelectorAll('img').forEach((i) => {
    const u = i.dataset.src || i.currentSrc || i.src;
    if (!u) return;
    const f = decodeURIComponent(u.split('/').pop().split('?')[0]);
    if (necesarias.includes(f)) urls[f] = new URL(u, location.href).href;
  });
  const faltan = necesarias.filter((f) => !urls[f]);
  console.log('Encontradas:', Object.keys(urls).length, 'de', necesarias.length, 'Sin localizar:', faltan);
  for (const f of Object.keys(urls)) {
    const r = await fetch(urls[f]);
    const b = await r.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = f;
    document.body.appendChild(a);
    a.click();
    a.remove();
    await new Promise((ok) => setTimeout(ok, 400));
  }
  console.log('Listo. Comprime los archivos descargados en un zip y súbelo.');
})();
