/* Sustituye image, width, height y alt al recibir fotografías originales. Textos tomados del material aportado por el cliente. */
const D = 'assets/despensa/';
window.ProductWorld.init({
  mount: '#familias',
  sections: [
    {
      template: 'hero', family: 'Calvo', color: '#fff3c4', ink: '#1f5a3a',
      eyebrow: 'Edición limitada de Navidad', title: '85 años. En una lata.',
      description: 'Coincidiendo con el 85 aniversario de la compañía, Calvo lanza una Edición Limitada de Navidad que rinde homenaje a su historia, recuperando la esencia de aquella primera lata de conserva creada en Galicia.',
      backword: 'CALVO', bottom: '01 — Edición vintage',
      product: {name:'Lata Recetas Gourmet · Edición limitada', image:D+'calvo-lata-85.webp', width:287, height:723, alt:'Lata vintage de Calvo, edición limitada por el 85 aniversario'}
    },
    {
      template: 'editorial', family: 'Calvo', color: '#fbf6e8', ink: '#1f5a3a', columns: 3,
      eyebrow: 'La colección en la mesa', title: 'Conservas con receta.',
      description: 'Las referencias de la edición limitada, presentadas junto a platos pensados para cada una.',
      products: [
        {name:'Sardinillas con cebolla pochada', description:'Sardinillas en salsa con cebolla pochada.', image:D+'calvo-receta-sardinillas-cebolla.webp', width:482, height:361, cover:true, alt:'Lata Calvo de sardinillas en salsa con cebolla pochada junto a un plato servido'},
        {name:'Sardinillas con tomate seco', description:'Sardinillas en salsa con tomate seco.', image:D+'calvo-receta-sardinillas-tomate.webp', width:483, height:361, cover:true, alt:'Lata Calvo de sardinillas en salsa con tomate seco junto a un plato servido'},
        {name:'Mejillones al albariño', description:'Mejillones en salsa de vino albariño.', image:D+'calvo-receta-mejillones-albarino.webp', width:481, height:361, cover:true, alt:'Lata Calvo de mejillones en salsa de vino albariño junto a un plato servido'},
        {name:'Ventresca escabechada', description:'Ventresca de atún claro escabechada.', image:D+'calvo-receta-ventresca.webp', width:482, height:440, cover:true, alt:'Lata Calvo de ventresca de atún claro escabechada junto a un plato servido'},
        {name:'Mejillones en salsa gallega', description:'Mejillones en salsa gallega, listos para una mesa navideña.', image:D+'calvo-receta-mejillones-gallega.webp', width:483, height:440, cover:true, alt:'Latas Calvo de mejillones en salsa gallega y aperitivo servido'},
        {name:'La colección completa', description:'Latas de la edición limitada junto a la lata Recetas Gourmet.', image:D+'calvo-coleccion.webp', width:685, height:444, cover:true, alt:'Colección de latas Calvo de edición limitada sobre una mesa'}
      ]
    },
    {
      template: 'range', family: 'Calvo · Formatos', color: '#dce8f2', ink: '#143a5e',
      eyebrow: 'Del plato a la barra', title: 'Formatos para cocina profesional.',
      description: 'Bolsas y lata de gran formato de la gama Calvo y de las marcas Razo y Eureka.',
      products: [
        {name:'Atún en aceite vegetal', description:'Calvo, atún en trozos en aceite vegetal.', image:D+'calvo-hosteleria-atun-vegetal.webp', width:170, height:240, alt:'Bolsa Calvo de atún en trozos en aceite vegetal'},
        {name:'Atún Razo', description:'Atún en trozos en aceite de girasol.', image:D+'calvo-hosteleria-razo.webp', width:168, height:240, alt:'Bolsa Razo de atún en trozos en aceite de girasol'},
        {name:'Atún Eureka', description:'Atún en trozos en aceite de girasol.', image:D+'calvo-hosteleria-eureka.webp', width:170, height:236, alt:'Bolsa Eureka de atún en trozos en aceite de girasol'},
        {name:'Chipirones en tinta', description:'Calvo, chipirones en tinta en formato bolsa.', image:D+'calvo-hosteleria-chipirones.webp', width:169, height:237, alt:'Bolsa Calvo de chipirones en tinta'},
        {name:'Calamares en tinta', description:'Calvo, calamares en tinta en formato bolsa.', image:D+'calvo-hosteleria-calamares-tinta.webp', width:168, height:232, alt:'Bolsa Calvo de calamares en tinta'},
        {name:'Calamares en salsa americana', description:'Calvo, calamares en salsa americana en formato bolsa.', image:D+'calvo-hosteleria-calamares-americana.webp', width:168, height:232, alt:'Bolsa Calvo de calamares en salsa americana'},
        {name:'Lata de atún Calvo', description:'Lata de gran formato de atún Calvo.', image:D+'calvo-hosteleria-atun-lata-1kg.webp', width:186, height:122, alt:'Lata de gran formato de atún Calvo'}
      ]
    },
    {
      template: 'editorial', family: 'Helios', color: '#c7c9b3', ink: '#2a5a35', columns: 3,
      eyebrow: 'Helios', title: 'El sabor del origen.',
      description: 'Porque, para Helios, origen es sinónimo de calidad. Por eso seleccionan solo las mejores materias primas procedentes de cultivo local.',
      products: [
        {name:'Mermeladas y confituras', description:'Gama de mermeladas y confituras Helios.', image:D+'helios-mermeladas.webp', width:421, height:302, cover:true, alt:'Tarro de mermelada de fresa Helios'},
        {name:'Tomate frito y salsas pasta', description:'Tomate frito mediterráneo y salsas para pasta.', image:D+'helios-tomate-frito.webp', width:425, height:302, cover:true, alt:'Tarro de tomate frito mediterráneo Helios'},
        {name:'Vegetales', description:'Gama de vegetales Helios, con Torti-Ya.', image:D+'helios-vegetales.webp', width:423, height:302, cover:true, alt:'Tarro de Torti-Ya de Helios'}
      ]
    },
    {
      template: 'hero', family: 'Prima', color: '#cf0122', ink: '#ffffff', dark: true,
      eyebrow: 'Salsas Prima', title: 'Salseo del bueno.',
      description: 'Una amplia variedad de deliciosas salsas elaboradas de forma responsable con tu salud, con ingredientes de aquí y la experiencia de más de 40 años a tu lado, acompañando tus platos y trabajando para mejorar cada día.',
      bottom: '05 — Gama de salsas',
      logo: {image:D+'prima-logo.webp', width:430, height:280, alt:'Prima'},
      product: {name:'Gama de salsas Prima', image:D+'prima-gama.webp', width:1425, height:330, wide:true, alt:'Gama de salsas Prima: mayonesas, kétchup, mostazas y otras salsas'}
    },
    {
      template: 'range', family: 'Carbonell · Koipe', color: '#fff8e6', ink: '#1f6b43',
      eyebrow: 'Aceites', title: 'Carbonell, el sabor del hogar.',
      description: 'Considerado un tesoro nacional, Carbonell ha sido un elemento básico en las cocinas españolas durante un siglo y medio. Creado en Andalucía en 1866, es considerado un embajador mundial de la dieta mediterránea.',
      products: [
        {name:'Virgen Extra · 5 L', description:'Carbonell, aceite de oliva virgen extra en formato ahorro.', image:D+'carbonell-virgen-extra-5l.webp', width:233, height:613, alt:'Garrafa Carbonell Virgen Extra de 5 litros'},
        {name:'Carbonell Profesional', description:'Aceite de la gama profesional Carbonell.', image:D+'carbonell-carbonell-profesional.webp', width:110, height:286, alt:'Garrafa Carbonell Profesional'},
        {name:'Koipe Profesional', description:'Aceite de la gama profesional Koipe.', image:D+'carbonell-koipe-profesional.webp', width:103, height:289, alt:'Garrafa Koipe Profesional'},
        {name:'Koipe Sol', description:'Aceite de girasol Koipe Sol.', image:D+'carbonell-koipe-sol.webp', width:103, height:287, alt:'Garrafa Koipe Sol'}
      ]
    }
  ]
});
