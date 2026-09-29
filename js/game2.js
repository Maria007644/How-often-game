(() => {
  'use strict';
  const people=[
    {label:'Alice',image:'alice-portrait',generated:true,subject:'Alice',third:true,possessive:'her'},
    {label:'Sam',image:'sam-portrait',generated:true,subject:'Sam',third:true,possessive:'his'},
    {label:'Alice and Sam',image:'pair-portrait',generated:true,subject:'Alice and Sam',third:false,possessive:'their'},
    {label:'WE',subject:'We',third:false,possessive:'our'},
    {label:'I',subject:'I',third:false,possessive:'my'}
  ];
  const activities=[
    {label:'clean teeth',image:'clean',base:'clean',third:'cleans',object:'teeth'},
    {label:'read a book',image:'read',generated:true,base:'read',third:'reads',object:'a book'},
    {label:'ride a bike',image:'bike',generated:true,base:'ride',third:'rides',object:'a bike'},
    {label:'feed the fish',image:'fish',base:'feed',third:'feeds',object:'the fish'},
    {label:'have a shower',image:'shower',base:'have',third:'has',object:'a shower'},
    {label:'eat burgers',image:'burger',base:'eat',third:'eats',object:'burgers'},
    {label:'play basketball',image:'basket',base:'play',third:'plays',object:'basketball'},
    {label:'play computer games',image:'games',base:'play',third:'plays',object:'computer games'}
  ];
  const frequencies=['always','usually','often','sometimes','rarely','never','once a week','twice a week','every day'].map(label=>({label}));
  const colors=['#ffd04a','#42bef4','#ae7bf1','#68d6aa','#ff9c63','#7bcbef','#ef93bd','#b9df70','#ffcc78'];
  const ns='http://www.w3.org/2000/svg';
  function svgNode(tag,attrs={},content){const el=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([key,value])=>el.setAttribute(key,value));if(content!==undefined)el.textContent=content;return el;}
  function point(radius,angle){const a=angle*Math.PI/180;return [190+radius*Math.sin(a),190-radius*Math.cos(a)];}
  function asset(item) { return `assets/${item.generated ? 'generated' : 'shared'}/${item.image}.png`; }
  function lines(label) {
    return {'Alice and Sam':['Alice and','Sam'], 'once a week':['once a','week'], 'twice a week':['twice a','week'], 'every day':['every','day']}[label] || [label];
  }
  function wheel(type,items){
    const svg=svgNode('svg',{viewBox:'0 0 380 380',role:'img','aria-label':`${type} wheel: ${items.map(i=>i.label).join(', ')}`});
    const defs=svgNode('defs'),gold=svgNode('radialGradient',{id:`gold-${type}`,cx:'.35',cy:'.25',r:'.8'});
    gold.append(svgNode('stop',{offset:'0','stop-color':'#ffffd2'}),svgNode('stop',{offset:'.45','stop-color':'#ffcc42'}),svgNode('stop',{offset:'1','stop-color':'#e98b0b'}));defs.append(gold);svg.append(defs);
    svg.append(svgNode('circle',{cx:190,cy:190,r:180,fill:'#bb081b',stroke:'#ffcb55','stroke-width':5}),svgNode('circle',{cx:190,cy:190,r:166,fill:'#fff7d9',stroke:'#800523','stroke-width':3}));
    const rotor=svgNode('g',{class:'rotor'});rotor.style.transformOrigin='190px 190px';
    const step=360/items.length,counters=[];
    items.forEach((item,index)=>{
      const angle=index*step,start=point(161,angle-step/2),end=point(161,angle+step/2);
      rotor.append(svgNode('path',{d:`M190 190 L${start.join(' ')} A161 161 0 0 1 ${end.join(' ')} Z`,fill:colors[index],stroke:'#ffffff99','stroke-width':2}));
      const [x,y]=point(type==='who'?103:113,angle);
      const group=svgNode('g',{'data-item':item.label,'data-category':type,transform:`translate(${x} ${y})`});
      const content=svgNode('g',{class:'counter-rotate'});content.style.transformOrigin='0px 0px';counters.push(content);
      if (item.image) {
        const size = type === 'who' ? 74 : 60;
        const pair = item.label === 'Alice and Sam';
        content.append(svgNode('image', {
          href: asset(item), x: -size / 2, y: type === 'who' ? -42 : -30,
          width: size, height: pair ? 64 : size, preserveAspectRatio: 'xMidYMid meet'
        }));
      }
      // Activity sectors are pictures only; their accessible names remain in data/ARIA.
      if (type !== 'activity') {
        const labelLines = lines(item.label);
        const font = type === 'who' ? (item.image ? 12 : 32) : item.label === 'sometimes' ? 12 : 13.5;
        const lineHeight = type === 'frequency' ? 17 : 13;
        const firstY = item.image ? (item.label === 'Alice and Sam' ? 36 : 48) : -(labelLines.length - 1) * lineHeight / 2 + 5;
        const text = svgNode('text', {'text-anchor':'middle', 'font-family':'Arial, sans-serif', 'font-weight':900, 'font-size':font, fill:'#0b3167'});
        labelLines.forEach((line, i) => text.append(svgNode('tspan', {x:0, y:firstY+i*lineHeight}, line)));
        content.append(text);
      }
      group.append(content);
      rotor.append(group);
    });
    svg.append(rotor);
    for(let i=0;i<24;i++){const [x,y]=point(173,i*15);svg.append(svgNode('circle',{cx:x,cy:y,r:4.4,fill:i%2?'#fff9cb':'#ffdc61',stroke:'#ed9a15','stroke-width':1}));}
    svg.append(svgNode('circle',{cx:190,cy:193,r:30,fill:'#9d420c',opacity:.5}),svgNode('circle',{cx:190,cy:190,r:28,fill:`url(#gold-${type})`,stroke:'#fff0a9','stroke-width':3}),svgNode('path',{d:'M169 7 Q190 0 211 7 L194 40 Q190 47 186 40 Z',fill:'#f23725',stroke:'#ffda65','stroke-width':4}),svgNode('circle',{cx:190,cy:14,r:5,fill:'#ffe796'}));
    document.querySelector(`#${type}-wheel`).append(svg);return {svg,rotor,counters,rotation:0,items};
  }
  const wheels={who:wheel('who',people),activity:wheel('activity',activities),frequency:wheel('frequency',frequencies)};
  Object.entries(wheels).forEach(([type,w])=>{const clone=w.svg.cloneNode(true);clone.removeAttribute('role');clone.removeAttribute('aria-label');clone.querySelector('radialGradient').id=`preview-gold-${type}`;clone.querySelectorAll(`[fill="url(#gold-${type})"]`).forEach(el=>el.setAttribute('fill',`url(#preview-gold-${type})`));document.querySelector('#wheels-preview').append(clone);});
  const $ = id => document.getElementById(id);
  let busy = false;
  let round = 0;
  let selected = null;
  let questionRevealed = false;
  let answerRevealed = false;

  function grammar(person, activity, frequency) {
    const object = activity.image === 'clean' ? `${person.possessive} teeth` : activity.object;
    const subject = person.subject === 'We' ? 'we' : person.subject;
    const question = `How often ${person.third ? 'does' : 'do'} ${subject} ${activity.base} ${object}?`;
    const verb = person.third ? activity.third : activity.base;
    const adverb = ['always','usually','often','sometimes','rarely','never'].includes(frequency);
    const answer = adverb
      ? `${person.subject} ${frequency} ${verb} ${object}.`
      : `${person.subject} ${verb} ${object} ${frequency}.`;
    return {question, answer};
  }

  function controls(step) {
    $('spin-pair').disabled = busy;
    $('spin-frequency').disabled = busy || !selected;
    $('show-question').disabled = busy || !selected || questionRevealed;
    $('show-answer').disabled = busy || !selected?.frequency || answerRevealed;
    $('show-question').setAttribute('aria-expanded', String(questionRevealed));
    $('show-answer').setAttribute('aria-expanded', String(answerRevealed));
    document.querySelectorAll('[data-step]').forEach(el => {
      el.classList.toggle('active', Number(el.dataset.step) === step);
      el.classList.toggle('done', Number(el.dataset.step) < step);
    });
  }

  async function spin(wheel) {
    const index = Math.floor(Math.random() * wheel.items.length);
    const target = (360 - index * 360 / wheel.items.length) % 360;
    wheel.rotation += 1080 + (target - wheel.rotation % 360 + 360) % 360;
    wheel.rotor.style.transform = `rotate(${wheel.rotation}deg)`;
    wheel.counters.forEach(el => { el.style.transform = `rotate(${-wheel.rotation}deg)`; });
    await new Promise(resolve => setTimeout(resolve,
      matchMedia('(prefers-reduced-motion: reduce)').matches ? 30 : 1700));
    return wheel.items[index];
  }

  $('spin-pair').addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    selected = null;
    questionRevealed = false;
    answerRevealed = false;
    round++;
    $('round-counter').textContent = `ROUND ${round}`;
    controls(1);
    $('round-hint').textContent = 'The wheels are spinning…';
    $('question-text').textContent = 'Let’s find a new question…';
    $('answer-text').textContent = 'Then spin HOW OFTEN and say the answer.';

    const [person, activity] = await Promise.all([spin(wheels.who), spin(wheels.activity)]);
    selected = {person, activity};
    $('question-text').textContent = 'Ask your question, then press SHOW QUESTION to check.';
    $('round-hint').textContent = 'Try the question yourself. SHOW QUESTION lets you check it.';
    busy = false;
    controls(2);
  });

  $('spin-frequency').addEventListener('click', async () => {
    if (busy || !selected) return;
    busy = true;
    answerRevealed = false;
    delete selected.frequency;
    controls(2);
    $('answer-text').textContent = 'Let’s find out…';
    $('round-hint').textContent = 'The HOW OFTEN wheel is spinning…';
    selected.frequency = (await spin(wheels.frequency)).label;
    $('answer-text').textContent = 'Say your answer, then press SHOW ANSWER to check.';
    $('round-hint').textContent = 'Try the answer yourself. SHOW ANSWER lets you check it.';
    busy = false;
    controls(2);
  });

  $('show-question').addEventListener('click', () => {
    if (busy || !selected || questionRevealed) return;
    questionRevealed = true;
    $('question-text').textContent = grammar(selected.person, selected.activity, 'always').question;
    controls(2);
  });

  $('show-answer').addEventListener('click', () => {
    if (busy || !selected?.frequency || answerRevealed) return;
    answerRevealed = true;
    $('answer-text').textContent = grammar(selected.person, selected.activity, selected.frequency).answer;
    controls(2);
  });

  controls(1);
})();
