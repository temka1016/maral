'use strict';
const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => [...p.querySelectorAll(s)];
const soundButton = $('#soundToggle');
const volumeControl = $('#volumeControl');
const birthdayMusic = $('#birthdayMusic');
const endingMusic = $('#endingMusic');
let activeMusic = birthdayMusic;
let musicEnabled = false;
let musicStarted = false;
let musicTransitioning = false;
let targetVolume = Number(volumeControl.value) / 100;
let fadeTimer;
for(let i=0;i<18;i++){const petal=document.createElement('i');petal.className='falling-petal';petal.style.left=Math.random()*100+'%';petal.style.top=(-5-Math.random()*60)+'%';petal.style.animationDuration=(6+Math.random()*7)+'s';petal.style.animationDelay=(-Math.random()*10)+'s';petal.style.scale=.55+Math.random()*.8;$('#sakura').append(petal);}

function updateMusicButton() {
  soundButton.textContent = musicEnabled ? '♫' : '🔇';
  soundButton.classList.toggle('playing', musicEnabled);
  soundButton.setAttribute('aria-label', musicEnabled ? 'Хөгжим унтраах' : 'Хөгжим асаах');
}
function fadeIn(audio, duration = 1000) {
  clearInterval(fadeTimer); audio.volume = 0;
  const steps = 24; let step = 0;
  fadeTimer = setInterval(() => { audio.volume = Math.min(targetVolume, targetVolume * (++step / steps)); if (step >= steps) clearInterval(fadeTimer); }, duration / steps);
}
function fadeOut(audio, duration = 900, pauseAfter = true) {
  clearInterval(fadeTimer);
  return new Promise(resolve => { const initial = audio.volume; const steps = 24; let step = 0;
    fadeTimer = setInterval(() => { audio.volume = Math.max(0, initial * (1 - (++step / steps))); if (step >= steps) { clearInterval(fadeTimer); if (pauseAfter) audio.pause(); resolve(); } }, duration / steps);
  });
}
function playMusic() {
  if (!musicEnabled || musicTransitioning) return;
  activeMusic.play().then(() => fadeIn(activeMusic)).catch(() => { musicEnabled = false; updateMusicButton(); });
}
function pauseMusic() { clearInterval(fadeTimer); fadeOut(activeMusic, 350); }
async function switchMusic(nextMusic) {
  if (activeMusic === nextMusic || musicTransitioning) return;
  musicTransitioning = true;
  const shouldContinue = musicEnabled;
  await fadeOut(activeMusic, 1300);
  activeMusic = nextMusic;
  if (shouldContinue && musicEnabled) {
    try { await activeMusic.play(); fadeIn(activeMusic, 1300); } catch (_) { musicEnabled = false; updateMusicButton(); }
  }
  musicTransitioning = false;
}
function toggleMusic() { if (!musicStarted) return; musicEnabled = !musicEnabled; updateMusicButton(); if (musicTransitioning) return; if (musicEnabled) playMusic(); else pauseMusic(); }
soundButton.addEventListener('click', toggleMusic);
volumeControl.addEventListener('input', () => { targetVolume = Number(volumeControl.value) / 100; if (musicEnabled) activeMusic.volume = targetVolume; });
$('#startBtn').addEventListener('click',()=>{ $('#experience').hidden=false; musicStarted=true; musicEnabled=true; activeMusic=birthdayMusic; updateMusicButton(); playMusic(); createHearts(); createCandles(); showScene(1); $('#sceneNavigation').hidden=false; });

// Full-screen presentation controller: exactly one story scene is interactive at once.
const scenes = $$('main .section');
const sceneDots = $('#sceneDots');
const nextSceneButton = $('#nextScene');
const previousSceneButton = $('#previousScene');
let currentScene = 0;
let touchStartX = 0;
scenes.forEach((scene, index) => {
  scene.classList.add('scene-page');
  const dot = document.createElement('button');
  dot.className = 'scene-dot';
  dot.setAttribute('aria-label', `${index + 1} дэх хэсэг`);
  dot.addEventListener('click', () => { if (index !== 0 || musicStarted) showScene(index); });
  sceneDots.append(dot);
});
function showScene(index) {
  if (index < 0 || index >= scenes.length || (!musicStarted && index !== 0)) return;
  const direction = index > currentScene ? 'forward' : 'backward';
  scenes.forEach((scene, sceneIndex) => {
    scene.classList.remove('scene-active', 'scene-before', 'scene-after');
    if (sceneIndex === index) scene.classList.add('scene-active');
    else scene.classList.add(sceneIndex < index ? 'scene-before' : 'scene-after');
  });
  currentScene = index;
  $$('.scene-dot', sceneDots).forEach((dot, dotIndex) => dot.classList.toggle('active', dotIndex === index));
  previousSceneButton.disabled = index === 0;
  nextSceneButton.disabled = index === scenes.length - 1;
  nextSceneButton.setAttribute('aria-label', index === scenes.length - 1 ? 'Сүүлийн хэсэг' : 'Дараагийн хэсэг');
  if (scenes[index].id === 'quiz') switchMusic(endingMusic);
  if (direction === 'forward') scenes[index].focus?.({ preventScroll: true });
}
function nextScene() { showScene(currentScene + 1); }
function previousScene() { showScene(currentScene - 1); }
nextSceneButton.addEventListener('click', nextScene);
previousSceneButton.addEventListener('click', previousScene);
document.addEventListener('keydown', event => {
  if (!musicStarted || event.target.matches('input, textarea')) return;
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextScene();
  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') previousScene();
});
document.addEventListener('touchstart', event => { touchStartX = event.changedTouches[0].screenX; }, { passive: true });
document.addEventListener('touchend', event => {
  if (!musicStarted) return;
  const distance = event.changedTouches[0].screenX - touchStartX;
  if (Math.abs(distance) > 55) (distance < 0 ? nextScene : previousScene)();
}, { passive: true });
showScene(0);

document.addEventListener('pointermove',e=>{const glow=$('.cursor-glow');glow.style.left=e.clientX+'px';glow.style.top=e.clientY+'px';});
const arena=$('#heartArena'); let heartCount=0;
function createHearts(){ if(arena.dataset.ready)return; arena.dataset.ready='true'; for(let i=0;i<9;i++){const h=document.createElement('button');h.className='heart';h.textContent='♥';h.style.left=(8+Math.random()*80)+'%';h.style.top=(18+Math.random()*65)+'%';h.style.animationDelay=(-Math.random()*2)+'s';h.addEventListener('click',()=>collectHeart(h));arena.append(h);} }
function collectHeart(h){if(h.classList.contains('collected'))return;h.classList.add('collected');heartCount++;$('#heartScore').textContent=heartCount;if(heartCount===9)$('#heartMessage').textContent='Чи бүх аз жаргалыг оллоо ❤️';}

// Nineteen petals share one center and use a calculated radial angle.
const PETAL_TOTAL = 19;
let petals = 0;
function addBloomPetal(index) {
  const petal = document.createElement('span');
  petal.className = 'petal';
  petal.style.setProperty('--angle', `${index * (360 / PETAL_TOTAL)}deg`);
  petal.style.setProperty('--delay', `${index * 55}ms`);
  $('#flower').append(petal);
}
function addFlowerSparkles() {
  const flower = $('#flower');
  for (let i = 0; i < 8; i++) {
    const sparkle = document.createElement('i');
    sparkle.className = 'flower-sparkle';
    sparkle.style.setProperty('--spark-angle', `${i * 45}deg`);
    sparkle.style.animationDelay = `${i * 120}ms`;
    flower.append(sparkle);
  }
}
$('#seed').addEventListener('click', () => {
  if (petals >= PETAL_TOTAL) return;
  petals++;
  const flower = $('#flower');
  $('#seed .stem').style.height = petals > 3 ? '4.8rem' : `${petals}rem`;
  if (petals === 1) flower.classList.add('bloom');
  addBloomPetal(petals - 1);
  $('#gardenMessage').textContent = petals === PETAL_TOTAL ? '19 дэлбээ, 19 жилийн сайхан дурсамж 🌸' : `${petals} / 19 дэлбээ`;
  $('#seedLabel').textContent = petals === PETAL_TOTAL ? 'цэцэглэв' : 'дахин дар';
  if (petals === PETAL_TOTAL) {
    flower.classList.add('fully-bloomed');
    addFlowerSparkles();
  }
});

const letterText='Сайн уу Марал ❤️\n\n19 насны төрсөн өдөрт чинь хамгийн сайхан бүхнийг хүсье.\n\nҮргэлж инээмсэглэж, өөрийнхөөрөө гэрэлтэж яваарай. Чиний зөөлөн сэтгэл, зоригтой мөрөөдөл бүхэн энэ хорвоог илүү сайхан болгодог шүү.\n\nӨнөөдөр, маргааш, үргэлж аз жаргал чамтай хамт байх болтугай.';
$('#giftBox').addEventListener('click',function(){if(this.classList.contains('open'))return;this.classList.add('open');setTimeout(()=>{$('#letter').hidden=false;typeLetter();},550);});
function typeLetter(){let i=0,el=$('#typedLetter');const timer=setInterval(()=>{el.textContent+=letterText[i++]||'';if(i>=letterText.length)clearInterval(timer);},23);}

let out=0;function createCandles(){const holder=$('#candles');if(holder.children.length)return;for(let i=0;i<19;i++){const c=document.createElement('button');c.className='candle';c.setAttribute('aria-label',`${i+1} дэх лааг унтраах`);c.innerHTML='<span class="flame"></span>';c.addEventListener('click',()=>{if(c.classList.contains('out'))return;c.classList.add('out');out++;$('#candleMessage').textContent=out===19?'Хүслээ биелээсэй! ✨':`${out} / 19 лаа унтарсан`;if(out===19)celebrate();});holder.append(c);}}

const questions=[['Маралын хамгийн тод гэрэл нь?',['Түүний инээмсэглэл','Түүний зориг','Хоёулаа']],['19 насанд хамгийн их хэрэгтэй зүйл?',['Итгэл','Аз жаргал','Мөрөөдөл']],['Маралд өгөх хамгийн гоё бэлэг?',['Дулаан дурсамж','Чин сэтгэлийн ерөөл','Хоёулаа']]];
questions.forEach((q,i)=>{const card=document.createElement('article');card.className='quiz-card';card.innerHTML=`<h3>${i+1}. ${q[0]}</h3><div class="answers">${q[1].map(a=>`<button class="answer">${a}</button>`).join('')}</div>`;$$('.answer',card).forEach(b=>b.addEventListener('click',()=>{ $$('.answer',card).forEach(x=>x.classList.remove('chosen'));b.classList.add('chosen');if($$('.quiz-card .chosen').length===3)$('#quizMessage').textContent='Яг зөв — Марал хамгийн сайхан бүхнийг хүртэх ёстой хүн шүү ♥';}));$('#quizCards').append(card);});

function celebrate(){const canvas=$('#fireworks'),ctx=canvas.getContext('2d');canvas.width=innerWidth;canvas.height=innerHeight;canvas.style.position='fixed';canvas.style.inset=0;canvas.style.zIndex=35;canvas.style.pointerEvents='none';let particles=[];for(let j=0;j<140;j++){const a=Math.random()*Math.PI*2,s=2+Math.random()*7;particles.push({x:innerWidth*(.25+Math.random()*.5),y:innerHeight*.45,vx:Math.cos(a)*s,vy:Math.sin(a)*s-2,c:['#ff8ec3','#ffe282','#b6a3ff','#9ee7ff'][j%4],life:80+Math.random()*45});}function draw(){ctx.clearRect(0,0,canvas.width,canvas.height);particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.08;p.life--;ctx.globalAlpha=Math.max(p.life/120,0);ctx.fillStyle=p.c;ctx.fillRect(p.x,p.y,4,4);});particles=particles.filter(p=>p.life>0);if(particles.length)requestAnimationFrame(draw);else {ctx.clearRect(0,0,canvas.width,canvas.height);canvas.removeAttribute('style');}}draw();}
$('#replayBtn').addEventListener('click',()=>{$('#top').scrollIntoView({behavior:'smooth'});celebrate();});
window.addEventListener('resize',()=>{const c=$('#fireworks');c.width=innerWidth;c.height=innerHeight;});
