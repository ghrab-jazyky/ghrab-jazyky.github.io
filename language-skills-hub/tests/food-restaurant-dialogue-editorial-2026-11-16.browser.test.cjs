#!/usr/bin/env node
'use strict';
// Focused rendered-content regression for the four languages at A1/A2/B1.
const {test}=require('node:test'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const root='http://127.0.0.1:8765/language-skills-hub/konverzace/jidlo-piti-restaurace/index.html';
const variants={
 en:{main:'You and three friends want to have dinner at a restaurant on Saturday. How would you book a table?',
  questions:['What time would you like to go, and why?','What would you like to ask about the menu before booking?','What can you say if there is no table available at that time?'],
  support:"I'd like to book a table for four on Saturday at …, please.",
  challenge:'Role-play a telephone reservation. One student is the customer, the other works at the restaurant.',
  a1:'How do you ask for a pizza and a glass of water?',
  b1:'How can you find out how an unfamiliar dish is prepared?'},
 es:{main:'Quieres cenar en un restaurante el sábado con tres amigos. ¿Cómo reservas una mesa?',
  questions:['¿A qué hora quieres ir y por qué?','¿Qué quieres preguntar sobre la carta antes de reservar?','¿Qué puedes decir si no hay mesa libre a esa hora?'],
  support:'Quisiera reservar una mesa para cuatro personas el sábado a las …, por favor.',
  challenge:'Simulad una reserva por teléfono: una persona es el cliente y la otra trabaja en el restaurante.',
  a1:'¿Cómo pides una pizza y un vaso de agua?',
  b1:'¿Cómo puedes averiguar cómo se prepara un plato que no conoces?'},
 de:{main:'Du möchtest am Samstag mit drei Freunden in einem Restaurant zu Abend essen. Wie reservierst du einen Tisch?',
  questions:['Um wie viel Uhr möchtest du hingehen und warum?','Was möchtest du vor der Reservierung über die Speisekarte wissen?','Was kannst du sagen, wenn um diese Uhrzeit kein Tisch frei ist?'],
  support:'Ich möchte für Samstag um … Uhr einen Tisch für vier Personen reservieren.',
  challenge:'Spielt eine Tischreservierung am Telefon: Eine Person ist Gast, die andere arbeitet im Restaurant.',
  a1:'Wie bestellst du eine Pizza und ein Glas Wasser?',
  b1:'Wie kannst du herausfinden, wie ein unbekanntes Gericht zubereitet wird?'},
 fr:{main:'Tu veux dîner au restaurant samedi avec trois amis. Comment réserves-tu une table ?',
  questions:['À quelle heure veux-tu y aller et pourquoi ?','Que veux-tu demander à propos de la carte avant de réserver ?','Que peux-tu dire s’il n’y a pas de table libre à cette heure-là ?'],
  support:'Je voudrais réserver une table pour quatre personnes samedi à … heures, s’il vous plaît.',
  challenge:'Jouez une réservation par téléphone : l’un joue le client, l’autre travaille au restaurant.',
  a1:'Comment commandes-tu une pizza et un verre d’eau ?',
  b1:'Comment peux-tu savoir comment on prépare un plat que tu ne connais pas ?'}
};
for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
 test('Restaurant dialogue renders and works in '+name+' desktop and narrow view',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   for(const viewport of [{width:1280,height:900},{width:390,height:844}]){
    const context=await browser.newContext({viewport});
    try{
     const page=await context.newPage(),jsErrors=[];
     page.on('pageerror',e=>jsErrors.push(e.message));
     for(const [lang,expected] of Object.entries(variants)){
      for(const [level,index,first] of [['A2',4,expected.questions[0]],['A1',5,expected.a1],['B1',4,expected.b1]]){
       const response=await page.goto(root+'?practice=1&lang='+lang+'&level='+level);
       assert.equal(response?.status(),200,name+'/'+lang+'/'+level);
       await page.locator('#sectionNav button').nth(index).click();
       assert.equal(await page.locator('#stationNum').textContent(),String(index+1),lang+'/'+level);
       assert.equal(await page.locator('#questions .question-text').first().textContent(),first,lang+'/'+level);
       if(level==='A2'){
        assert.equal(await page.locator('#mainQuestion').textContent(),expected.main,lang);
        assert.deepEqual(await page.locator('#questions .question-text').allTextContents(),expected.questions,lang);
        await page.locator('#supportBtn').click();
        assert.equal(await page.locator('#supportReveal').evaluate(n=>n.hidden),false,lang+' support visible');
        assert.equal(await page.locator('#supportList li').first().textContent(),expected.support,lang);
        await page.locator('#challengeBtn').click();
        assert.equal(await page.locator('#challengeReveal').evaluate(n=>n.hidden),false,lang+' challenge visible');
        assert.equal(await page.locator('#challengeReveal').textContent(),expected.challenge,lang);
        await page.locator('#stretchBtn').click();
        assert.equal(await page.locator('#stretchReveal').evaluate(n=>n.hidden),false,lang+' stretch visible');
       }
      }
     }
     assert.deepEqual(jsErrors,[],name+' '+viewport.width+'px script errors');
    }finally{await context.close();}
   }
  }finally{await browser.close();}
 });
}
