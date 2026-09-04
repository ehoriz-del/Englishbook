document.querySelectorAll('#year').forEach(el => el.textContent = new Date().getFullYear());

function esc(s = '') {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

async function getData() {
  const data = window.ENGLISHBOOK_DATA;
  if (!data || !Array.isArray(data.books) || !data.chapters) {
    throw new Error('Site data is missing. Please redeploy the complete EnglishBook package.');
  }
  return data;
}

function showError(root, message) {
  root.innerHTML = `<div class="error-card"><h2>We couldn’t load this page.</h2><p>${esc(message)}</p><p>Please refresh the page or try again shortly.</p></div>`;
}

async function buildHome() {
  const root = document.getElementById('books');
  if (!root) return;
  try {
    const data = await getData();
    const heroBook = data.books.find(b => b.series === data.featuredSeries && b.status === 'published');
    if (heroBook?.hero) {
      document.getElementById('hero').style.backgroundImage =
        `linear-gradient(90deg,rgba(255,253,247,.97) 0%,rgba(255,253,247,.76) 34%,rgba(255,255,255,.04) 68%),url('${heroBook.hero}')`;
    }

    data.books.forEach(b => {
      const published = b.status === 'published';
      const card = document.createElement('article');
      card.className = 'book-card';
      const chapterCount = (data.chapters[b.id] || []).length;
      card.innerHTML = `
        <button class="book-head" type="button" aria-expanded="false" ${published ? '' : 'disabled'}>
          <img class="book-cover" src="${esc(b.cover)}" alt="Original watercolor illustration for ${esc(b.title)}">
          <span class="book-copy">
            <span class="book-title">${esc(b.title)}</span>
            <span class="author">${esc(b.author)}</span>
            <span class="book-desc">${esc(b.description || '')}</span>
            ${published ? `<span class="count">${chapterCount} chapters</span>` : `<span class="soon">Coming soon</span>`}
          </span>
          <span class="chev" aria-hidden="true">⌄</span>
        </button>
        <div class="chapter-list" aria-hidden="true"></div>`;

      const head = card.querySelector('.book-head');
      const list = card.querySelector('.chapter-list');
      if (published) {
        head.addEventListener('click', () => {
          const open = card.classList.toggle('open');
          head.setAttribute('aria-expanded', String(open));
          list.setAttribute('aria-hidden', String(!open));
        });
        (data.chapters[b.id] || []).forEach(ch => {
          const a = document.createElement('a');
          a.className = 'chapter-row';
          a.href = `lesson.html?book=${encodeURIComponent(b.id)}&chapter=${ch.number}`;
          a.innerHTML = `<span class="chapter-no">Chapter ${ch.number}</span><span>${esc(ch.title)}</span><span class="arrow">›</span>`;
          list.appendChild(a);
        });
      }
      root.appendChild(card);
    });
  } catch (e) {
    showError(root, e.message);
  }
}

function inline(s) {
  let x = esc(s);
  x = x.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  x = x.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return x;
}

function parseMd(md) {
  const exm = md.match(/```exercise\s*([\s\S]*?)```/);
  let exercises = [];
  if (exm) {
    try { exercises = JSON.parse(exm[1]); } catch (_) {}
    md = md.replace(exm[0], '');
  }

  const lines = md.split(/\r?\n/);
  let html = '', sectionOpen = false, listOpen = false, paragraph = [];
  const flushP = () => {
    if (paragraph.length) {
      html += `<p>${inline(paragraph.join(' '))}</p>`;
      paragraph = [];
    }
  };
  const closeList = () => { if (listOpen) { html += '</ul>'; listOpen = false; } };
  const closeSec = () => { flushP(); closeList(); if (sectionOpen) { html += '</section>'; sectionOpen = false; } };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flushP(); closeList(); continue; }
    if (line.startsWith('# Chapter')) continue;
    if (line.startsWith('## Practice')) continue;
    if (line.startsWith('## ')) {
      closeSec();
      html += `<section class="lesson-section"><h2>${inline(line.slice(3))}</h2>`;
      sectionOpen = true;
      continue;
    }
    if (line.startsWith('### ')) {
      flushP(); closeList(); html += `<h3>${inline(line.slice(4))}</h3>`; continue;
    }
    if (line.startsWith('- ')) {
      flushP();
      if (!listOpen) { html += '<ul class="term-list">'; listOpen = true; }
      const x = line.slice(2);
      const parts = x.split('—');
      if (parts.length > 1) html += `<li><strong>${inline(parts.shift().trim())}</strong><span> — ${inline(parts.join('—').trim())}</span></li>`;
      else html += `<li>${inline(x)}</li>`;
      continue;
    }
    closeList();
    const speaker = line.match(/^([A-Za-z .’'’-]+):\s*(.*)$/);
    if (speaker) {
      flushP();
      html += `<div class="dialogue"><strong>${inline(speaker[1])}:</strong><span>${inline(speaker[2])}</span></div>`;
    } else if (line.startsWith('*') && line.endsWith('*')) {
      flushP(); html += `<p class="dialogue-note"><em>${inline(line.slice(1,-1))}</em></p>`;
    } else {
      paragraph.push(line);
    }
  }
  closeSec();
  return {html, exercises};
}

function practiceHTML(exs) {
  if (!exs.length) return '';
  const dialogue = q => q.dialogue?.length
    ? `<div class="quiz-dialogue">${q.dialogue.map(x => `<p><strong>${esc(x.speaker)}:</strong> ${esc(x.text)}</p>`).join('')}</div>`
    : '';
  return `<section class="lesson-section practice-section"><div class="practice-heading"><div><span class="eyebrow">Quick practice</span><h2>Try it yourself</h2></div><span class="question-count">${exs.length} questions</span></div><div class="practice">${exs.map((q,i) => `
    <div class="q" data-i="${i}">
      <div class="q-number">${i+1}</div>
      <p>${esc(q.prompt)}</p>
      ${q.type === 'dialogue' ? dialogue(q) : ''}
      ${(q.type === 'choice' || q.type === 'dialogue')
        ? `<div class="opts">${q.options.map(o => `<button class="opt" type="button" data-val="${esc(o)}">${esc(o)}</button>`).join('')}</div>`
        : q.type === 'fill'
          ? `<input class="fill" autocomplete="off" spellcheck="false" placeholder="Type your answer">`
          : q.type === 'order'
            ? `<div class="order-help">Tap the words one by one. Tap a chosen word to remove it.</div><div class="order-tokens">${q.tokens.map((o,j) => `<button class="order-token" type="button" data-val="${esc(o)}" data-token="${j}">${esc(o)}</button>`).join('')}</div><div class="order-answer" aria-live="polite"></div><button class="order-reset" type="button">Reset</button>`
            : ''}
      <button class="check" type="button">Check answer</button>
      <div class="result" aria-live="polite"></div>
    </div>`).join('')}</div></section>`;
}
async function buildLesson() {
  const root = document.getElementById('lesson');
  if (!root) return;
  try {
    const params = new URLSearchParams(location.search);
    const bookId = params.get('book') || 'anne-of-green-gables';
    const num = parseInt(params.get('chapter') || '1', 10);
    const data = await getData();
    const book = data.books.find(x => x.id === bookId);
    const chapters = data.chapters[bookId] || [];
    const ch = chapters.find(x => x.number === num) || chapters[0];
    if (!book || !ch) throw new Error('This lesson could not be found.');
    if (book.status !== 'published') throw new Error('This book is not published yet.');

    const md = data.chapterContent?.[ch.file];
    if (typeof md !== 'string') throw new Error('The chapter content is missing from the site data.');
    const parsed = parseMd(md);
    document.title = `Chapter ${ch.number}: ${ch.title} — EnglishBook`;

    root.innerHTML = `
      <div class="crumb"><a href="./">${esc(book.title)}</a><span>›</span><span>Chapter ${ch.number}</span></div>
      <span class="chapter-num">Chapter ${ch.number} of ${book.totalChapters}</span>
      <h1 class="lesson-title">${esc(ch.title)}</h1>
      <img class="chapter-art" src="${esc(ch.image)}" alt="Original watercolor-style scene inspired by Chapter ${ch.number}, ${esc(ch.title)}">
      <div class="lesson-content">${parsed.html}${practiceHTML(parsed.exercises)}</div>
      <nav class="lesson-nav" aria-label="Chapter navigation">
        ${ch.number > 1 ? `<a class="navbtn" href="lesson.html?book=${encodeURIComponent(bookId)}&chapter=${ch.number-1}">← Chapter ${ch.number-1}</a>` : '<span></span>'}
        ${ch.number < book.totalChapters ? `<a class="navbtn" href="lesson.html?book=${encodeURIComponent(bookId)}&chapter=${ch.number+1}">Chapter ${ch.number+1} →</a>` : '<a class="navbtn" href="./">Back to books →</a>'}
      </nav>`;

    root.querySelectorAll('.q').forEach(qel => {
      const q = parsed.exercises[Number(qel.dataset.i)];
      let selected = '';
      const chosen = [];

      qel.querySelectorAll('.opt').forEach(btn => btn.addEventListener('click', () => {
        qel.querySelectorAll('.opt').forEach(x => x.classList.remove('selected'));
        btn.classList.add('selected');
        selected = btn.dataset.val;
      }));

      const input = qel.querySelector('.fill');
      if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') qel.querySelector('.check').click(); });

      const answerLine = qel.querySelector('.order-answer');
      const renderOrder = () => {
        if (!answerLine) return;
        answerLine.innerHTML = '';
        chosen.forEach((item, idx) => {
          const chip = document.createElement('button');
          chip.type = 'button';
          chip.className = 'order-chip';
          chip.textContent = item.value;
          chip.title = 'Tap to remove';
          chip.addEventListener('click', () => {
            const token = qel.querySelector(`.order-token[data-token="${item.id}"]`);
            if (token) token.disabled = false;
            chosen.splice(idx, 1);
            renderOrder();
          });
          answerLine.appendChild(chip);
        });
      };
      qel.querySelectorAll('.order-token').forEach(btn => btn.addEventListener('click', () => {
        chosen.push({id: btn.dataset.token, value: btn.dataset.val});
        btn.disabled = true;
        renderOrder();
      }));
      qel.querySelector('.order-reset')?.addEventListener('click', () => {
        chosen.length = 0;
        qel.querySelectorAll('.order-token').forEach(x => x.disabled = false);
        renderOrder();
        const r = qel.querySelector('.result');
        r.className = 'result'; r.textContent = '';
      });

      qel.querySelector('.check').addEventListener('click', () => {
        let given = '';
        if (q.type === 'choice' || q.type === 'dialogue') given = selected;
        else if (q.type === 'fill') given = (input?.value || '').trim();
        else if (q.type === 'order') given = chosen.map(x => x.value).join(' ');
        const r = qel.querySelector('.result');
        if (!given) {
          r.className = 'result show no';
          r.textContent = q.type === 'order' ? 'Tap the words first.' : 'Choose or type an answer first.';
          return;
        }
        const accepted = (q.accepted || [q.answer]).map(x => String(x).toLowerCase().trim());
        const ok = accepted.includes(String(given).toLowerCase().trim());
        r.className = `result show ${ok ? 'ok' : 'no'}`;
        r.innerHTML = ok
          ? `<strong>✓ Correct.</strong> ${esc(q.explanation || '')}`
          : `<strong>Not quite.</strong> Correct answer: <strong>${esc(q.answer)}</strong>. ${esc(q.explanation || '')}`;
      });
    });
  } catch (e) {
    showError(root, e.message);
  }
}

buildHome();
buildLesson();
