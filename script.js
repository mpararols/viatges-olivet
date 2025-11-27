// ====== FOOTER: Any actual ======
document.getElementById('year').textContent=new Date().getFullYear();

// ====== MENÚ MÒBIL ======
const toggle = document.querySelector('.nav-toggle');
const menu = document.getElementById('menu');

if (toggle && menu) {
  // Obrir/tancar en clicar el botó
  toggle.addEventListener('click', (e) => {
    e.stopPropagation(); // Que aquest clic no compti com "clic fora"
    const opened = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', opened);
  });

  // Tancar quan cliquem fora del menú
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && !toggle.contains(e.target)) {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Opcional: tancar si canvia molt la mida (gires el mòbil, etc.)
  window.addEventListener('resize', () => {
    menu.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  });
}


// ====== CÀRREGA DE VIATGES DES DE JSON ======
async function carregarOlivet(){
  const msg = document.getElementById('msg-viatges');
  try{
    const resp = await fetch('viatges/viatges.json?cacheBust=' + Date.now(), { cache: 'no-store' });
    if(!resp.ok) throw new Error('HTTP ' + resp.status);
    const viatges = await resp.json();
    const container = document.getElementById('carousel');
    container.innerHTML='';
    const MAX_VIATGES = 12;
    (viatges||[])
      .filter(v=>v && v.path && !String(v.path).includes('arxivats'))
      .slice(0, MAX_VIATGES)
      .forEach(v=>{
        const card=document.createElement('div');
        card.className='card';
        card.innerHTML = `
          <a href="${v.path}" class="card-link">
            <div class="card-inner">
              <img loading="lazy" decoding="async" src="${v.imatge}" alt="${v.titol}">
              <h3>${v.titol}</h3>
              <p>${v.dates || ''}</p>
            </div>
          </a>`;
        container.appendChild(card);
      });
    msg.style.display = (container.children.length===0)?'block':'none';
    updateArrows();
  }catch(e){
    console.error('Error carregant viatges:',e);
    msg.style.display='block';
  }
}
carregarOlivet();

// ====== CONTROLS DEL CARROSEL ======
const carr = document.getElementById('carousel');
const btnPrev = document.getElementById('prev');
const btnNext = document.getElementById('next');

function getCardStep(){
  const card = carr.querySelector('.card');
  if(!card) return 320;
  const style = getComputedStyle(carr);
  const gap = parseInt(style.columnGap || style.gap || '16', 10);
  return card.offsetWidth + gap;
}
function scrollCarousel(direction){
  const isMobile = window.matchMedia('(max-width: 900px)').matches;
  const cardsPerStep = isMobile ? 1 : 3;
  carr.scrollBy({ left: direction * getCardStep() * cardsPerStep, behavior:'smooth' });
}
btnPrev.onclick = () => scrollCarousel(-1);
btnNext.onclick = () => scrollCarousel(1);

function updateArrows(){
  const max = carr.scrollWidth - carr.clientWidth - 1;
  btnPrev.disabled = carr.scrollLeft <= 0;
  btnNext.disabled = carr.scrollLeft >= max;
}
carr.addEventListener('scroll', updateArrows, { passive:true });
const ro = new ResizeObserver(updateArrows);
ro.observe(carr);
updateArrows();

// ====== FORMULARI NEWSLETTER: modal i enviament AJAX (Formspree) ======
function showNewsletterModal({ok=true}={}){
  const backdrop = document.createElement('div');
  backdrop.className = 'nl-modal-backdrop';
  backdrop.innerHTML = `
    <div class="nl-modal" role="dialog" aria-modal="true" aria-labelledby="nl-title">
      <h4 id="nl-title">${ok ? '✓ Alta rebuda correctament' : 'Hi ha hagut un problema'}</h4>
      <div class="${ok ? 'ok' : 'err'}">
        <p>${ok ? "Gràcies! Hem registrat la teva sol·licitud d’alta al mailing."
                 : "No s’ha pogut enviar ara mateix. Torna-ho a provar més tard."}</p>
      </div>
      <div class="actions">
        <button class="nl-btn nl-btn-primary" data-close>Entesos</button>
      </div>
    </div>`;
  document.body.appendChild(backdrop);

  // Autotancament als 4s si és èxit (opcional)
  if (ok) { setTimeout(() => { try { backdrop.remove(); } catch{} }, 4000); }

  const close = () => { backdrop.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = (e) => { if(e.key === 'Escape') close(); };
  backdrop.addEventListener('click', (e)=>{ if(e.target === backdrop) close(); });
  backdrop.querySelector('[data-close]').addEventListener('click', close);
  document.addEventListener('keydown', onKey);
  setTimeout(()=>backdrop.querySelector('[data-close]').focus(), 10);
}

document.getElementById('newsletter-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  if (!form.checkValidity()) return;

  const data = new FormData(form);
  const resp = await fetch(form.action, {
    method: 'POST',
    body: data,
    headers: { 'Accept': 'application/json' }
  });

  form.reset();
  showNewsletterModal({ok: resp.ok});
});


// ===== FORMULARI CONTACTE: AJAX + modal =====
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }

    try {
      const resp = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' } // <- evita redirecció de Formspree
      });

      if (resp.ok) {
        form.reset();
        showNewsletterModal({
          ok: true,
          title: 'Missatge enviat!',
          message: 'Gràcies! Hem rebut la teva consulta i et respondrem ben aviat.'
        });
      } else {
        showNewsletterModal({
          ok: false,
          title: 'No s’ha pogut enviar',
          message: 'Torna-ho a provar més tard o escriu-nos a info@vacances-olivet.cat.'
        });
      }
    } catch {
      showNewsletterModal({
        ok: false,
        title: 'Error de connexió',
        message: 'Revisa internet i torna-ho a provar.'
      });
    }
  });
});

