/* Misma arquitectura de escenas que Pascual. Fotografías de botella sustituibles en este archivo. */
window.ProductWorld.init({
  mount: '#familias',
  sections: [
    {
      template:'hero', family:'Palacio de Bornos', color:'#eba061', ink:'#251d17',
      eyebrow:'Bodega Palacio de Bornos', title:'Verdejo. El origen en primer plano.',
      description:'Palacio de Bornos Verdejo, de la D.O. Rueda. Una botella para abrir el recorrido por la selección de vinos.',
      backword:'RUEDA', bottom:'01 — Palacio de Bornos',
      product:{name:'Palacio de Bornos Verdejo', image:'assets/marcas/bornos-verdejo.png', width:187, height:622, alt:'Botella original de Palacio de Bornos Verdejo'}
    },
    {
      template:'range', family:'Palacio de Bornos', color:'#efe5d3', ink:'#392b1f',
      eyebrow:'Rueda en tres botellas', title:'La gama, a tu ritmo.',
      description:'Recorre tres referencias de Palacio de Bornos presentes en la web de Distribuciones Valentín.',
      products:[
        {name:'Verdejo',description:'Palacio de Bornos Verdejo.',image:'assets/marcas/bornos-verdejo.png',width:187,height:622,alt:'Botella Palacio de Bornos Verdejo'},
        {name:'Sauvignon Blanc',description:'Palacio de Bornos Sauvignon Blanc.',image:'assets/marcas/bornos-sauvignon-2025.png',width:270,height:612,alt:'Botella Palacio de Bornos Sauvignon Blanc'},
        {name:'Verdejo fermentado',description:'Palacio de Bornos Verdejo fermentado en barrica.',image:'assets/marcas/bornos-fermentado.png',width:270,height:612,alt:'Botella Palacio de Bornos Verdejo fermentado en barrica'}
      ]
    },
    {
      template:'editorial', family:'Otras bodegas', color:'#f4f0e9', ink:'#29231f',
      eyebrow:'Más nombres en la selección', title:'Cada botella, su carácter.',
      description:'Cuatro referencias para descubrir más allá de la gama Bornos.',
      products:[
        {name:'La Caprichosa',description:'Verdejo sobre lías de Palacio de Bornos.',image:'assets/vinos/la-caprichosa.webp',width:280,height:1055,alt:'Botella La Caprichosa Verdejo sobre lías'},
        {name:'Pinna Fidelis Roble',description:'Vino de Pinna Fidelis, Ribera del Duero.',image:'assets/vinos/pinna-fidelis.webp',width:130,height:365,alt:'Botella Pinna Fidelis Roble'},
        {name:'Lleiroso Crianza',description:'Botella Lleiroso Crianza, Ribera del Duero.',image:'assets/vinos/lleiroso.webp',width:435,height:1320,alt:'Botella Lleiroso Crianza'},
        {name:'Pinkgoleta',description:'Vino clarete de Pazos de Baró.',image:'assets/vinos/pinkgoleta-cutout.webp',width:182,height:605,alt:'Botella Pinkgoleta de Pazos de Baró'}
      ]
    },
    {
      template:'story', family:'Color y formato', color:'#ee8a33', ink:'#281c16',
      eyebrow:'Un recorrido por otras propuestas', title:'El color cambia. La historia continúa.',
      frames:[
        {name:'Bornos Frizzante',description:'Frizzante Verdejo 5,5º de Palacio de Bornos.',image:'assets/vinos/bornos-frizzante-cutout.webp',width:430,height:1070,alt:'Botella Palacio de Bornos Frizzante Verdejo',color:'#ee8a33'},
        {name:'Laué Frizzante',description:'Frizzante Verdejo de Palacio de Bornos en lata.',image:'assets/vinos/laue-frizzante.webp',width:260,height:570,alt:'Lata Laué Frizzante Verdejo',color:'#f4e9d8'},
        {name:'Pinkgoleta',description:'Clarete de Pazos de Baró.',image:'assets/vinos/pinkgoleta-cutout.webp',width:182,height:605,alt:'Botella Pinkgoleta',color:'#e4334d'}
      ]
    }
  ]
});
