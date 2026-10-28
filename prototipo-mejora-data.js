window.ProductWorld.init({
  mount: '#familias',
  sections: [
    {
      template: 'hero', family: 'Café Mocay', color: '#2a1a12', ink: '#f4e8da', dark: true,
      eyebrow: 'Para barras y cafeterías', title: 'Café Mocay. La barra empieza aquí.',
      description: 'Café de primera marca para hostelería, con cápsulas, grano e infusiones de la gama Mocay.',
      backword: 'MOCAY', bottom: '01 — Café',
      cta: {label: 'Explorar Café Mocay', href: 'cafe-mocay.html'},
      product: {name:'Cápsulas Mocay', image:'assets/mocay/capsulas.webp', width:935, height:295, alt:'Cápsulas de café Mocay', wide:true}
    },
    {
      template: 'range', family: 'Aguas', color: '#dcecf0', ink: '#12465a',
      eyebrow: 'Cinco referencias, una misma mesa', title: 'Agua para cada servicio.',
      description: 'S.Pellegrino, Bezoya y Pedras en los formatos que pide la sala.',
      products: [
        {name:'S.Pellegrino 25 cl', description:'Formato pequeño para alta restauración.', image:'assets/agua/sanpellegrino-25cl.webp', width:186, height:560, alt:'Botella S.Pellegrino de 25 cl'},
        {name:'S.Pellegrino 50 cl', description:'El formato de mesa para el servicio diario.', image:'assets/agua/sanpellegrino-50cl.webp', width:245, height:900, alt:'Botella S.Pellegrino de 50 cl'},
        {name:'S.Pellegrino 75 cl', description:'Botella grande para compartir en mesa.', image:'assets/agua/sanpellegrino-75cl.webp', width:248, height:895, alt:'Botella S.Pellegrino de 75 cl'},
        {name:'Bezoya', description:'Agua mineral natural de montaña.', image:'assets/agua/bezoya-cutout.webp', width:900, height:900, alt:'Botella de agua Bezoya'},
        {name:'Pedras Salgadas', description:'Agua con gas natural, en botella de 75 cl.', image:'assets/agua/pedras-75-alt.webp', width:700, height:1050, alt:'Botella de Pedras Salgadas de 75 cl'}
      ]
    },
    {
      template: 'hero', family: 'Vinos', color: '#ece3c9', ink: '#33401a',
      eyebrow: 'Vinos de Rueda', title: 'Bornos. Una burbuja en la carta.',
      description: 'Palacio de Bornos, entre las bodegas que distribuimos: verdejo, sauvignon blanc, fermentados en barrica y frizzantes.',
      backword: 'BORNOS', bottom: '03 — Vinos',
      cta: {label: 'Ver la selección de vinos', href: 'vinos.html'},
      product: {name:'Palacio de Bornos Frizzante', image:'assets/vinos/bornos-frizzante-cutout.webp', width:430, height:1070, alt:'Botella de Palacio de Bornos Frizzante'}
    },
    {
      template: 'editorial', family: 'Despensa y charcutería', color: '#f6e4d3', ink: '#4a2616',
      eyebrow: 'Cocina y barra', title: 'Conservas, aceite y charcutería.',
      description: 'Conservas Calvo, aceite Carbonell y Campofrío, de la despensa a la cámara.',
      products: [
        {name:'Conservas Calvo', description:'Atún, sardinillas y mejillones de la gama de hostelería.', image:'assets/despensa/calvo-lata-85.webp', width:287, height:701, alt:'Lata de conservas Calvo'},
        {name:'Aceite Carbonell', description:'Virgen extra en formato profesional de 5 litros.', image:'assets/despensa/carbonell-virgen-extra-5l.webp', width:233, height:613, alt:'Garrafa de aceite Carbonell virgen extra de 5 litros'},
        {name:'Campofrío', description:'Jamón cocido, chorizo y salchichón para bocadillos y tablas.', image:'assets/marcas/campofrio-jamon-cocido.webp', width:624, height:414, alt:'Jamón cocido extra Campofrío'}
      ],
      cta: {label: 'Ver la despensa', href: 'despensa.html'}
    },
    {
      template: 'hero', family: 'Leche Pascual', color: '#f4efe7', ink: '#271e1b',
      eyebrow: 'Lácteos y postres', title: 'Pascual. De la barra al primer sorbo.',
      description: 'Leche, bebidas vegetales, yogures y postres de Grupo Leche Pascual para hostelería.',
      backword: 'PASCUAL', bottom: '05 — Lácteos',
      cta: {label: 'Explorar la gama Pascual', href: 'pascual.html'},
      product: {name:'Leche Pascual Intense · 1,5 L', image:'assets/pascual/intense-cutout.webp', width:240, height:688, alt:'Botella de Leche Pascual Intense de 1,5 litros'}
    },
    {
      template: 'lineup', family: 'Un solo pedido', color: '#e8ddd0', ink: '#2a1d16',
      eyebrow: 'Un proveedor, un reparto', title: 'Ocho categorías, un pedido.',
      note: 'Una imagen por categoría',
      variants: [
        {name:'Café', description:'Mocay, para barras y cafeterías.', image:'assets/mocay/capsulas.webp', width:935, height:295, alt:'Cápsulas de café Mocay'},
        {name:'Lácteos', description:'Grupo Leche Pascual, de la leche a los postres.', image:'assets/pascual/intense-cutout.webp', width:240, height:688, alt:'Leche Pascual Intense'},
        {name:'Vinos', description:'Palacio de Bornos y otras bodegas.', image:'assets/marcas/bornos-verdejo.webp', width:187, height:622, alt:'Palacio de Bornos Verdejo'},
        {name:'Aguas', description:'S.Pellegrino, Bezoya, Aquarel y Pedras.', image:'assets/agua/sanpellegrino-50cl.webp', width:245, height:900, alt:'S.Pellegrino 50 cl'},
        {name:'Aceite y conservas', description:'Salsas, conservas y AOVE.', image:'assets/despensa/carbonell-virgen-extra-5l.webp', width:233, height:613, alt:'Aceite Carbonell de 5 litros'},
        {name:'Refrigerados', description:'Lácteos, quesos, preparados y charcutería.', image:'assets/marcas/campofrio-jamon-cocido.webp', width:624, height:414, alt:'Jamón cocido Campofrío'},
        {name:'Congelados', description:'Gama de congelados para hostelería.', image:'assets/congelados/12309-croissant-artesano-margarina-ferm-120g.webp', width:345, height:261, alt:'Croissant artesano congelado'},
        {name:'Menaje', description:'Vajilla, cubertería, cristalería, mantelería y auxiliar.'}
      ]
    }
  ]
});
