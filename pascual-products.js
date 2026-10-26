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
      description: 'Bifrutas Tropical y batidos Pascual en un recorrido lleno de color.',
      products: [
        {name:'Bifrutas Tropical', description:'Uno de los sabores de la gama Bifrutas.', image:'assets/pascual/bifrutas-tropical.webp', width:240, height:285, alt:'Brik original de Bifrutas Tropical'},
        {name:'Batidos Pascual', description:'Vainilla, chocolate y fresa junto a ColaCao.', image:'assets/pascual/batidos.webp', width:430, height:385, alt:'Botellas originales de batidos Pascual y ColaCao'}
      ]
    },
    {
      template: 'story', family: 'Selección Pascual', color: '#dce59d', ink: '#244433',
      eyebrow: 'Una historia de productos', title: 'De uno a otro. Sin perder el hilo.',
      frames: [
        {name:'Leche para la barra', description:'Leche Pascual Intense, presentada en su envase original.', image:'assets/pascual/intense-cutout.webp', width:240, height:688, alt:'Botella Leche Pascual Intense'},
        {name:'Bebidas de fruta', description:'Bifrutas Tropical, dentro de la selección de bebidas.', image:'assets/pascual/bifrutas-tropical.webp', width:240, height:285, alt:'Brik Bifrutas Tropical'},
        {name:'Zumos Essential', description:'Una selección de botellas Pascual Essential.', image:'assets/pascual/essential.webp', width:680, height:480, alt:'Botellas originales de zumo Pascual Essential'}
      ]
    }
  ]
});
