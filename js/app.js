(() => {
  'use strict';
  const app=document.querySelector('#app'),screens=['home','game1','game2'];
  function resize(){app.style.setProperty('--scale',Math.min(innerWidth/1600,innerHeight/948));}
  function navigate(){
    const name=screens.includes(location.hash.slice(1))?location.hash.slice(1):'home';
    screens.forEach(id=>{document.getElementById(id).hidden=id!==name;});
    document.querySelectorAll('.navigation [data-screen]').forEach(link=>{if(link.dataset.screen===name)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
    if(name==='game1'){const frame=document.querySelector('#game1-frame');if(!frame.hasAttribute('src'))frame.src='games/game1_frequency_machine.html';frame.focus();}
    else document.querySelector(name==='home'?'#home-title':'#challenge-title').focus({preventScroll:true});
    document.title=name==='home'?'How Often? — Present Simple Games':name==='game1'?'Game 1 — Spin & Say':'Game 2 — How Often? Challenge';
  }
  const fullscreen=document.querySelector('#fullscreen');fullscreen.hidden=!document.fullscreenEnabled;
  fullscreen.addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{fullscreen.textContent='USE F11';}});
  document.addEventListener('fullscreenchange',()=>{const active=!!document.fullscreenElement;fullscreen.textContent=active?'EXIT FULL SCREEN':'FULL SCREEN';fullscreen.setAttribute('aria-label',active?'Exit full screen':'Enter full screen');resize();});
  addEventListener('resize',resize);addEventListener('hashchange',navigate);resize();navigate();
})();
