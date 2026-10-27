/* Sustituye image, width, height y alt al recibir fotografías originales. */
window.ProductWorld.init({
  mount: '#familias',
  sections: [
    {
      template: 'hero', family: 'Leche Pascual', color: '#f4efe7', ink: '#271e1b',
      eyebrow: 'La barra empieza aquí', title: 'Intense. La leche entra en escena.',
      description: 'Leche Pascual Intense para hostelería, en botella de 1,5 litros. Un producto protagonista para descubrir de cerca.',
      backword: 'INTENSE', bottom: '01 — Leche para hostelería',
      product: {name:'Leche Pascual Intense · 1,5 L', image:'assets/pascual/intense-cutout.webp', width:240, height:688, alt:'Botella original Leche Pascual Intense para hostelería de 1,5 litros'}
    },
    {
      template: 'range', family: 'Vivesoy Barista', color: '#e9eacb', ink: '#214b32',
      eyebrow: 'Dos variedades, una misma barra', title: 'Vegetal, en movimiento.',
      description: 'Dos bebidas vegetales Vivesoy Barista para descubrir en la barra.',
      products: [
        {name:'Barista Soja', description:'Bebida de soja Vivesoy Barista.', image:'assets/pascual/vivesoy-soja.webp', width:260, height:710, alt:'Envase original Vivesoy Barista Soja de 1 litro'},
        {name:'Barista Avena', description:'Bebida de avena Vivesoy Barista.', image:'assets/pascual/vivesoy-avena.webp', width:245, height:710, alt:'Envase original Vivesoy Barista Avena de 1 litro'}
      ]
    },
    {
      template: 'editorial', family: 'Bebidas Pascual', color: '#ffedda', ink: '#512f1c',
      eyebrow: 'Una selección para cada momento', title: 'Color en la carta.',
      description: 'Bifrutas Tropical, batidos y zumos Essential de Pascual en un recorrido lleno de color.',
      products: [
        {name:'Bifrutas Tropical', description:'Uno de los sabores de la gama Bifrutas.', image:'assets/pascual/bifrutas-tropical.webp', width:240, height:285, alt:'Brik original de Bifrutas Tropical'},
        {name:'Batidos Pascual', description:'Vainilla, chocolate y fresa junto a ColaCao.', image:'assets/pascual/batidos.webp', width:430, height:385, alt:'Botellas originales de batidos Pascual y ColaCao'},
        {name:'Zumos Essential', description:'Una selección de botellas Pascual Essential.', image:'assets/pascual/essential.webp', width:680, height:480, alt:'Botellas originales de zumo Pascual Essential'}
      ]
    },
    {
      template: 'lineup', family: 'Yogikids', color: '#d9ecf7', ink: '#17405e',
      eyebrow: 'Para los más pequeños', title: 'Yogikids, en formato individual.',
      note: 'Imagen de la gama · sabor fresa',
      product: {name:'Yogikids de fresa', image:'assets/pascual/yogikids-fresa.webp', width:336, height:545, alt:'Envase individual Yogikids de Pascual, sabor fresa'},
      variants: [
        {name:'Yogikids de fresa · 80 g', description:'Yogur Pascual en formato individual de 80 g y sabor fresa.'},
        {name:'Yogikids de fresa y plátano · 80 g', description:'Yogur Pascual en formato individual de 80 g, con sabor a fresa y plátano.'}
      ]
    },
    {
      template: 'lineup', family: 'Yogures Pascual', color: '#fbe8e6', ink: '#7a1218',
      eyebrow: 'Pack de 4 × 120 g', title: 'Un yogur para cada sabor.',
      note: 'Imagen de la gama · sabor fresa',
      product: {name:'Yogur Pascual', image:'assets/pascual/yogur-vaso.webp', width:464, height:511, alt:'Vaso de yogur Pascual de fresa, imagen de la gama'},
      variants: [
        {name:'Yogur de fresa', description:'Yogur Pascual de fresa en pack de cuatro unidades.'},
        {name:'Yogur de limón', description:'Yogur Pascual con sabor a limón en pack de cuatro unidades.'},
        {name:'Yogur de plátano', description:'Yogur Pascual con sabor a plátano en pack de cuatro unidades.'},
        {name:'Yogur de macedonia', description:'Yogur Pascual con sabor a macedonia en pack de cuatro unidades.'},
        {name:'Yogur de coco', description:'Yogur Pascual con sabor a coco en pack de cuatro unidades.'},
        {name:'Yogur de fresa y plátano', description:'Yogur Pascual con sabor a fresa y plátano en pack de cuatro unidades.'},
        {name:'Yogur natural', description:'Yogur Pascual de sabor natural en pack de cuatro unidades.'},
        {name:'Yogur natural azucarado', description:'Yogur Pascual natural con azúcar en pack de cuatro unidades.'},
        {name:'Yogur de arándanos', description:'Yogur Pascual con sabor a arándanos en pack de cuatro unidades.'},
        {name:'Yogur de vainilla', description:'Yogur Pascual con sabor a vainilla en pack de cuatro unidades.'},
        {name:'Yogur desnatado con fresa', description:'Yogur Pascual desnatado con sabor a fresa en pack de cuatro unidades.'},
        {name:'Yogur desnatado con macedonia', description:'Yogur Pascual desnatado con sabor a macedonia en pack de cuatro unidades.'},
        {name:'Yogur griego natural azucarado', description:'Yogur Pascual estilo griego, de sabor natural azucarado, en pack de cuatro unidades.'}
      ]
    },
    {
      template: 'hero', family: 'Postres Pascual', color: '#fff0c4', ink: '#59330f',
      eyebrow: 'Flan de huevo', title: 'El postre de siempre.',
      description: 'Postre Pascual de flan de huevo, presentado en cuatro unidades individuales.',
      backword: 'FLAN', bottom: 'Pack de 4 × 100 g',
      product: {name:'Flan de huevo · pack de 4 × 100 g', image:'assets/pascual/flan-huevo.webp', width:391, height:533, alt:'Flan de huevo Pascual, imagen de la gama'}
    },
    {
      template: 'lineup', family: 'Natillas Pascual', color: '#ead9cb', ink: '#4a2a1b',
      eyebrow: 'Vaso individual de 120 g', title: 'Natillas, a cucharadas.',
      note: 'Imagen de la gama · natillas de chocolate',
      product: {name:'Natillas de chocolate', image:'assets/pascual/natillas.webp', width:464, height:511, alt:'Vaso de natillas de chocolate Pascual, imagen de la gama'},
      variants: [
        {name:'Natillas de vainilla · 120 g', description:'Natillas Pascual de vainilla en vaso individual.'},
        {name:'Natillas de chocolate · 120 g', description:'Natillas Pascual de chocolate en vaso individual.'}
      ]
    }
  ]
});
