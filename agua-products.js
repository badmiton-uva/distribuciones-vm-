window.ProductWorld.init({
  mount: '#familias',
  sections: [
    {
      template:'hero', family:'Bezoya', color:'#cceef4', ink:'#103b50',
      eyebrow:'Agua mineral natural', title:'Ligera desde el origen.',
      description:'Bezoya procede de manantiales de Segovia. Su mineralización muy débil acompaña el día a día en distintos formatos.',
      backword:'BEZOYA', bottom:'01 — Agua sin gas',
      product:{name:'Bezoya · 1,5 L', image:'assets/agua/bezoya-cutout.webp', width:1254, height:1254, alt:'Botella Bezoya de 1,5 litros'}
    },
    {
      template:'range', family:'Nestlé Aquarel', color:'#e8f3e7', ink:'#194a43',
      eyebrow:'Dos formatos para cada ocasión', title:'Aquarel, a tu medida.',
      description:'Una botella para compartir y otra para llevar. Elige el formato que encaja con cada servicio.',
      products:[
        {name:'1,5 litros',description:'Formato para compartir.',image:'assets/agua/aquarel-15.webp',width:1200,height:1200,alt:'Botella Nestlé Aquarel de 1,5 litros'},
        {name:'50 cl',description:'Formato individual.',image:'assets/agua/aquarel-50.jpg',width:600,height:600,alt:'Botella Nestlé Aquarel de 50 centilitros'}
      ]
    },
    {
      template:'hero', family:'S.Pellegrino', color:'#69c5d7', ink:'#082d3e',
      eyebrow:'Agua mineral con gas', title:'La mesa tiene su estrella.',
      description:'La botella de vidrio de S.Pellegrino aporta su silueta inconfundible a la mesa. Un formato de 75 cl pensado para compartir.',
      backword:'ITALIA', bottom:'03 — S.Pellegrino',
      product:{name:'S.Pellegrino · 75 cl',image:'assets/agua/pellegrino-cutout.webp',width:1254,height:1254,alt:'Botella de vidrio S.Pellegrino de 75 centilitros'}
    },
    {
      template:'story', family:'Pedras', color:'#dcead3', ink:'#173b30',
      eyebrow:'Agua con gas y sabores', title:'Una forma distinta de brindar.',
      frames:[
        {name:'Pedras Salgadas',description:'Agua mineral con gas de origen natural, presentada en botella de vidrio.',image:'assets/agua/pedras-75-alt.webp',width:800,height:1200,alt:'Botella Pedras Salgadas de 75 centilitros',color:'#dcead3'},
        {name:'Pedras Limão',description:'Una propuesta con limón para ampliar la carta de bebidas.',image:'assets/agua/pedras-limon.webp',width:1120,height:1120,alt:'Botella Pedras con limón',color:'#f1e9aa'},
        {name:'Frutos vermelhos',description:'Pedras con frutos rojos, otra expresión de la gama.',image:'assets/agua/pedras-frutos.webp',width:1400,height:1991,alt:'Botella Pedras Frutos Vermelhos con frutos rojos',color:'#e8d8d9'}
      ]
    }
  ]
});
