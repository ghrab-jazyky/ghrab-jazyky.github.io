/*
 * CITY QUEST F0.1 — locally authored, deterministic vector illustration.
 * No remote tiles, fonts, images, network requests or untrusted SVG content.
 * All interactive crossroads are rendered separately by app.js on top.
 */
(function (root) {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  function node(name, attributes, text) {
    var n = document.createElementNS(NS, name);
    Object.keys(attributes || {}).forEach(function (key) { n.setAttribute(key, String(attributes[key])); });
    if (text !== undefined && text !== null) n.textContent = String(text);
    return n;
  }
  function put(parent, name, attributes, text) {
    var element = node(name, attributes, text);
    parent.appendChild(element);
    return element;
  }
  function polygon(points) { return points.map(function (p) { return p.join(","); }).join(" "); }
  function gradient(defs, id, stops, vertical) {
    var g = put(defs, "linearGradient", { id:id, x1:0,y1:0,x2:vertical?0:1,y2:vertical?1:0 });
    stops.forEach(function (p) { put(g, "stop", { offset:p[0], "stop-color":p[1] }); });
  }
  function rect(parent,x,y,w,h,fill,radius,extra) {
    return put(parent,"rect",Object.assign({x:x,y:y,width:w,height:h,rx:radius||0,fill:fill},extra||{}));
  }
  function text(parent,x,y,content,size,color,weight,extra){
    return put(parent,"text",Object.assign({x:x,y:y,"font-family":"system-ui, -apple-system, sans-serif","font-size":size||12,fill:color||"#244c55","font-weight":weight||600},extra||{}),content);
  }
  function flower(parent,x,y,color) {
    put(parent,"circle",{cx:x,cy:y,r:3,fill:color});
    put(parent,"circle",{cx:x-4,cy:y+3,r:2.2,fill:"#ffefc1"});
    put(parent,"circle",{cx:x+4,cy:y+3,r:2.2,fill:"#fff8d8"});
  }
  function tree(parent,x,y,r) {
    var size=r||14, g=put(parent,"g",{"aria-hidden":"true"});
    put(g,"ellipse",{cx:x+4,cy:y+size*.8,rx:size*1.15,ry:size*.54,fill:"#245c52",opacity:.14});
    rect(g,x-2,y+4,4,size*1.1,"#8b6950",2);
    put(g,"circle",{cx:x+3,cy:y-1,r:size,fill:"#32896c",stroke:"#27745b","stroke-width":1.5});
    put(g,"circle",{cx:x-5,cy:y+1,r:size*.72,fill:"#4fb789"});
    put(g,"circle",{cx:x+6,cy:y-7,r:size*.74,fill:"#79ce9e"});
    put(g,"circle",{cx:x+9,cy:y-10,r:2.3,fill:"#c6f8c0",opacity:.8});
  }
  function lamp(parent,x,y) {
    put(parent,"ellipse",{cx:x+3,cy:y+10,rx:5,ry:3,fill:"#245d59",opacity:.13});
    put(parent,"path",{d:"M"+x+" "+y+" v-13 q0 -4 5 -4",fill:"none",stroke:"#607d82","stroke-width":2.5});
    put(parent,"circle",{cx:x+5,cy:y-17,r:5,fill:"#fff4c5",stroke:"#d2b47a","stroke-width":1.3});
  }
  function bench(parent,x,y) {
    rect(parent,x,y,25,6,"#ab785c",2);
    rect(parent,x+2,y+7,21,5,"#d0a37f",2);
    put(parent,"path",{d:"M"+(x+5)+" "+(y+11)+"v4m13 -4v4",stroke:"#6c796a","stroke-width":2});
  }
  function label(parent,x,y,name,variant) {
    var size=name.length>16?10.4:11.8;
    var width=Math.max(65,Math.round(name.length*size*.66+22));
    var g=put(parent,"g",{"data-landmark-label":name,"aria-hidden":"true"});
    rect(g,x-width/2+2,y-12+3,width,25,"#244c58",10,{opacity:.15});
    rect(g,x-width/2,y-12,width,25,variant==="highlight"?"#163b50":"#ffffff",9,{"fill-opacity":.97,stroke:variant==="highlight"?"#89eef1":"#cee5dd","stroke-width":1.5});
    text(g,x,y+5,name,size,variant==="highlight"?"#f2ffff":"#214658",850,{"text-anchor":"middle","letter-spacing":.3});
  }
  function building(parent,opts) {
    var x=opts.x,y=opts.y,w=opts.w||110,h=opts.h||55,d=opts.depth||21,fx=9;
    var g=put(parent,"g",{"aria-hidden":"true"});
    put(g,"ellipse",{cx:x+w/2+8,cy:y+h+18,rx:w*.7,ry:23,fill:"#26535d",opacity:.16});
    // Raised front façade and eastern gable create a miniature 2.5D object.
    put(g,"polygon",{points:polygon([[x,y+h-2],[x+w,y+h-2],[x+w+fx,y+h+d],[x+fx,y+h+d]]),fill:opts.front||"#cbab96"});
    put(g,"polygon",{points:polygon([[x+w-2,y],[x+w+fx,y+d],[x+w+fx,y+h+d],[x+w-2,y+h]]),fill:opts.side||"#9b95a0"});
    rect(g,x,y,w,h,opts.roof||"#dba6a6",8,{stroke:"#fffaf0","stroke-width":2});
    // Diagonal roof lighting and ridgelines.
    put(g,"polygon",{points:polygon([[x+9,y+8],[x+w-9,y+8],[x+w-18,y+22],[x+20,y+22]]),fill:"#ffffff",opacity:.19});
    put(g,"path",{d:"M"+(x+11)+" "+(y+h/2)+"H"+(x+w-10),stroke:"#fff7e7","stroke-width":2,opacity:.42});
    for(var i=0;i<Math.max(2,Math.floor((w-18)/27));i++) {
      var px=x+14+i*23;
      rect(g,px,y+26,13,12,"#b9e7ec",3,{stroke:"#fff2d2","stroke-width":1.5});
      put(g,"path",{d:"M"+(px+6.5)+" "+(y+27)+"v10",stroke:"#ffffff","stroke-width":1,opacity:.8});
      rect(g,px+1,y+h+2,12,9,"#d4eff2",2,{stroke:"#c9a392","stroke-width":1});
    }
    if(opts.tower){
      rect(g,x+w*.38,y+4,w*.25,16,"#f8ebd5",4,{stroke:"#cebfae","stroke-width":1.5});
      put(g,"polygon",{points:polygon([[x+w*.38-3,y+5],[x+w*.51,y-15],[x+w*.63+3,y+5]]),fill:"#6e93a5"});
      put(g,"circle",{cx:x+w*.51,cy:y+4,r:3.7,fill:"#f0c965"});
    }
    if(opts.awning){
      var width=55;
      put(g,"polygon",{points:polygon([[x+w/2-width/2,y+h+3],[x+w/2+width/2,y+h+3],[x+w/2+width/2+4,y+h+15],[x+w/2-width/2-4,y+h+15]]),fill:"#fff4ed",stroke:"#cd9c9c","stroke-width":1.5});
      for(var k=-2;k<=2;k++)rect(g,x+w/2+k*9-4,y+h+6,8,8,k%2===0?"#dc8275":"#fff5e7",1);
    }
    if(opts.columns){
      for(var q=0;q<4;q++){rect(g,x+16+q*26,y+h-2,8,d+8,"#f8ebd8",2,{stroke:"#d7c9b2","stroke-width":1});}
      put(g,"polygon",{points:polygon([[x+7,y+h-5],[x+w+4,y+h-5],[x+w+12,y+h+3],[x-1,y+h+3]]),fill:"#ece7d7"});
      rect(g,x+8,y+h+d-2,w-4,5,"#e4cfae",2);
    }
    if(opts.label)label(parent,x+w/2+4,opts.labelY||y+h+d+23,opts.label,opts.highlight?"highlight":null);
  }
  function car(parent,x,y,color,horizontal) {
    var g=put(parent,"g",{transform:"translate("+x+" "+y+") rotate("+(horizontal?0:90)+")","aria-hidden":"true"});
    put(g,"ellipse",{cx:3,cy:6,rx:21,ry:8,fill:"#234b56",opacity:.18});
    rect(g,-17,-7,35,16,color,5,{stroke:"#eff9f3","stroke-width":1.5});
    rect(g,-3,-6,13,12,"#a3e1e8",3);
    rect(g,-10,-9,6,4,"#fff3d3",2);
    rect(g,-10,5,6,4,"#fff3d3",2);
  }
  function park(parent) {
    // Riverside Park between crossing rows 1 & 2, columns 4 & 5.
    rect(parent,872,301,140,113,"#8fd2a6",16,{stroke:"#eaf4d0","stroke-width":4});
    put(parent,"path",{d:"M887 397Q946 342 999 324",stroke:"#f0e4c8","stroke-width":11,fill:"none","stroke-linecap":"round"});
    put(parent,"path",{d:"M889 395Q945 342 1000 325",stroke:"#fcf4d6","stroke-width":5,fill:"none","stroke-linecap":"round"});
    [[893,330,16],[932,320,15],[976,386,14],[1001,365,12],[907,384,12]].forEach(function(p){tree(parent,p[0],p[1],p[2]);});
    flower(parent,958,347,"#f1789c");flower(parent,976,336,"#e88590");
    bench(parent,939,391);lamp(parent,991,399);
    label(parent,941,411,"RIVERSIDE PARK");
  }
  function square(parent) {
    // Market Square occupies the block bounded by roads x512..684, y284..432.
    rect(parent,529,304,140,111,"#efd7b0",16,{stroke:"#fff0d4","stroke-width":4});
    for(var i=0;i<6;i++){
      put(parent,"path",{d:"M"+(538+i*23)+" 310v97",stroke:"#f9e6c9","stroke-width":1.5,opacity:.8});
    }
    put(parent,"ellipse",{cx:599,cy:348,rx:35,ry:25,fill:"#74b6bb",stroke:"#fff4e2","stroke-width":7});
    put(parent,"ellipse",{cx:599,cy:346,rx:29,ry:19,fill:"#66d6dc",stroke:"#b3f0ef","stroke-width":3});
    put(parent,"path",{d:"M597 352 Q580 330 598 321 Q618 332 599 352",stroke:"#f4ffff","stroke-width":4,fill:"none"});
    put(parent,"circle",{cx:599,cy:343,r:4,fill:"#e0ffff"});
    tree(parent,548,321,9);tree(parent,653,386,10);
    bench(parent,540,381);bench(parent,631,323);
    flower(parent,566,397,"#e8898a");flower(parent,629,398,"#ed8a9d");
    label(parent,599,407,"MARKET SQUARE");
  }
  function river(parent) {
    put(parent,"path",{d:"M1089 0 C1074 70 1121 135 1090 220 C1055 303 1138 349 1090 426 C1045 524 1135 568 1082 671 C1069 700 1091 744 1108 756 L1196 756 L1196 0Z",fill:"url(#cqRiver)"});
    put(parent,"path",{d:"M1091 0 C1077 80 1121 132 1091 218 C1055 301 1138 349 1092 427 C1047 524 1135 568 1084 673",fill:"none",stroke:"#e1ffff","stroke-width":7,opacity:.65});
    for(var i=0;i<17;i++) {
      var px=1125+(i%3)*18,py=42+i*38;
      put(parent,"path",{d:"M"+px+" "+py+"q13 -7 25 0",stroke:"#c6f6f2","stroke-width":2,fill:"none",opacity:.64});
    }
    text(parent,1160,475,"RIVERTON RIVER",15,"#1f758c",850,{"letter-spacing":3.3,transform:"rotate(90 1160 475)","text-anchor":"middle"});
    // Ferry jetty with plank texture.
    rect(parent,1068,486,77,18,"#d5aa7a",3,{stroke:"#fff1cd","stroke-width":2});
    for(var j=0;j<8;j++) put(parent,"path",{d:"M"+(1071+j*9)+" 488v13",stroke:"#956e55","stroke-width":1.3});
    put(parent,"path",{d:"M1148 516l22 8 -12 12 -29 -4z",fill:"#fff9e2",stroke:"#5e91a0","stroke-width":3});
    put(parent,"path",{d:"M1150 521v-22l17 19z",fill:"#ee937e"});
  }
  function roads(parent,E) {
    // The route engine has a 6 x 4 rectilinear street graph.
    E.rows.forEach(function(y,i){
      rect(parent,114,y-25,960,50,"#cadcd0",12);
      rect(parent,114,y-20,960,40,"#fff5e5",9);
      put(parent,"path",{d:"M114 "+y+" H1074",stroke:"#d1c9bc","stroke-width":2,fill:"none","stroke-dasharray":"12 12"});
    });
    E.columns.forEach(function(x,i){
      rect(parent,x-26,75,52,644,"#c9ded0",12);
      rect(parent,x-20,75,40,644,"#fff5e5",8);
      put(parent,"path",{d:"M"+x+" 75V719",stroke:"#d1c9bc","stroke-width":2,"stroke-dasharray":"12 12",fill:"none"});
    });
    E.rows.forEach(function(y){
      E.columns.forEach(function(x){
        for(var i=0;i<4;i++){
          rect(parent,x-22+i*12.6,y-30,8.2,6,"#ffffff",1,{opacity:.88});
        }
      });
    });
  }
  function compass(parent) {
    var g=put(parent,"g",{transform:"translate(1138 85)","aria-hidden":"true"});
    put(g,"circle",{r:40,fill:"#f4fff8",opacity:.94,stroke:"#afd9d4","stroke-width":2});
    put(g,"polygon",{points:"0,-27 10,2 0,-3 -10,2",fill:"#1b5970"});
    put(g,"polygon",{points:"0,29 10,2 0,6 -10,2",fill:"#78c6c3"});
    text(g,0,-30,"N",12,"#1f6577",900,{"text-anchor":"middle"});
  }
  function city(map,E) {
    map.replaceChildren();
    var defs=put(map,"defs",{});
    gradient(defs,"cqLand",[["0%","#bee5d4"],["100%","#93cdb8"]],true);
    gradient(defs,"cqRiver",[["0%","#3ca1ba"],["100%","#8dd9de"]],false);
    gradient(defs,"cqGrass",[["0%","#d2e9b6"],["100%","#acd79f"]],true);
    rect(map,0,0,1196,756,"url(#cqLand)");
    // Topographic green patches and a quiet waterfront.
    for(var z=0;z<17;z++){
      put(map,"ellipse",{cx:75+(z*89)%1030,cy:87+(z*137)%640,rx:40+(z%4)*9,ry:18+(z%3)*6,fill:z%2?"#d2ebc5":"#b1d9b8",opacity:.31});
    }
    // Neighbourhood plots lie behind roads and miniature buildings.
    for(var row=0;row<3;row++){
      for(var col=0;col<5;col++){
        var x=188+col*172,y=156+row*148;
        var palette=(row+col)%3===0?"#cce4bc":(row+col)%3===1?"#f3ddbf":"#d8e8cc";
        rect(map,x,y,132,107,palette,12,{stroke:"#e9edd3","stroke-width":3});
        for(var t=0;t<3;t++){
          put(map,"path",{d:"M"+(x+10)+" "+(y+15+t*28)+" h112",stroke:"#ffffff",opacity:.15,"stroke-width":2});
        }
      }
    }
    // Southern quarter between the last crossing and the bottom edge.
    for(var c=0;c<5;c++)rect(map,188+c*172,601,133,115,c%2?"#cde4c4":"#efddc3",12,{stroke:"#e8edda","stroke-width":3});
    river(map);
    roads(map,E);
    // Road names sit on pale road surfaces, separate from building labels.
    text(map,248,104,"STATION ROAD",12.5,"#58777e",850,{"letter-spacing":2.9,"text-anchor":"middle"});
    text(map,760,419,"MARKET AVENUE",11.8,"#59767b",850,{"letter-spacing":2.3,"text-anchor":"middle"});
    text(map,1047,652,"RIVERSIDE",12,"#59767b",850,{transform:"rotate(-90 1047 652)","letter-spacing":2});
    // Decorative crossroads: lamps and traffic furniture never obscure the clickable overlay.
    [[202,126],[374,274],[548,126],[886,274],[718,421],[374,569],[892,570],[1038,422]].forEach(function(p){lamp(map,p[0],p[1]);});
    car(map,430,283,"#e88672",true);car(map,770,580,"#76c4a6",true);car(map,168,357,"#7babc1",false);car(map,1028,486,"#e9b773",false);
    building(map,{x:207,y:171,w:107,h:52,depth:19,roof:"#c77977",front:"#edb8a1",side:"#9f6973",label:"FARMERS MARKET",labelY:256,awning:true});
    building(map,{x:373,y:167,w:108,h:55,depth:19,roof:"#d6a0a4",front:"#f0d2b1",side:"#b58a91",label:"CITY SCHOOL",labelY:256});
    // Focal museum: wide façade, clock tower and columns.
    building(map,{x:543,y:163,w:117,h:61,depth:20,roof:"#e2c47e",front:"#e9d9bd",side:"#b2a47f",label:"CITY MUSEUM",labelY:255,columns:true,tower:true,highlight:true});
    building(map,{x:720,y:170,w:112,h:52,depth:19,roof:"#ba8fae",front:"#edd1d6",side:"#937eab",label:"THE HOTEL",labelY:255});
    building(map,{x:895,y:169,w:105,h:53,depth:20,roof:"#83a6bf",front:"#d9e4e4",side:"#678ca0",label:"HOSPITAL",labelY:255});
    for(var i=0;i<4;i++)tree(map,220+i*28,348+(i%2)*25,10+i%2*2);
    label(map,251,405,"ROSE GARDEN");
    tree(map,396,347,16);tree(map,452,389,15);tree(map,445,325,11);bench(map,399,386);label(map,425,407,"GREEN SQUARE");
    square(map);
    for(var j=0;j<4;j++)tree(map,735+j*25,343+(j%2)*30,11);
    label(map,772,406,"CITY GREEN");
    park(map);
    building(map,{x:206,y:465,w:107,h:52,depth:22,roof:"#cb9194",front:"#e5cdbf",side:"#ae7a7f",label:"BAKERY",labelY:552,awning:true});
    building(map,{x:377,y:466,w:105,h:51,depth:23,roof:"#88bcb9",front:"#edcfb5",side:"#73a09b",label:"SUNRISE CAFÉ",labelY:552,awning:true});
    building(map,{x:545,y:468,w:117,h:54,depth:19,roof:"#d7a18c",front:"#f1d4b9",side:"#be866f",label:"THEATRE",labelY:552});
    building(map,{x:718,y:467,w:112,h:55,depth:22,roof:"#9c9dc4",front:"#dfd6d6",side:"#8e91aa",label:"LIBRARY",labelY:552});
    for(var k=0;k<5;k++)tree(map,897+(k%3)*42,470+Math.floor(k/3)*43,11);
    bench(map,926,540);label(map,943,552,"MAPLE GROVE");
    // Station sits one block south/east of the START junction.
    building(map,{x:205,y:613,w:114,h:53,depth:24,roof:"#819ac0",front:"#eee0bb",side:"#74859b",label:"CENTRAL STATION",labelY:709,tower:true,highlight:true});
    building(map,{x:377,y:615,w:106,h:52,depth:20,roof:"#d3a482",front:"#f0dac6",side:"#ac846c",label:"POST OFFICE",labelY:709});
    building(map,{x:550,y:617,w:111,h:52,depth:18,roof:"#baa0cc",front:"#e9d7d8",side:"#9986ad",label:"CINEMA",labelY:709});
    building(map,{x:719,y:614,w:110,h:51,depth:22,roof:"#e2a8a2",front:"#f4e0bc",side:"#b88f89",label:"SHOPS",labelY:709,awning:true});
    tree(map,905,646,17);tree(map,970,645,15);tree(map,937,683,15);bench(map,875,697);
    // Strong place identity, north marker, river name and start/goal pins.
    text(map,45,43,"RIVERTON",32,"#1d5064",900,{"letter-spacing":2});
    text(map,47,65,"CITY ADVENTURE · WALKING MAP",11,"#397a79",850,{"letter-spacing":2.8});
    compass(map);
    // Pins sit on the crossroads; names are on the nearby buildings, not over the roads.
    put(map,"circle",{cx:168,cy:580,r:19,fill:"#183e58",stroke:"#f7fff1","stroke-width":3,opacity:.97});
    text(map,168,587,"S",19,"#ffffff",900,{"text-anchor":"middle"});
    put(map,"circle",{cx:684,cy:284,r:19,fill:"#19886d",stroke:"#f7fff1","stroke-width":3,opacity:.97});
    text(map,684,291,"M",19,"#ffffff",900,{"text-anchor":"middle"});
  }
  root.CityQuestArt=Object.freeze({render:city});
})(typeof window !== "undefined" ? window : this);
