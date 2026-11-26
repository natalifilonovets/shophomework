'use strict';

const app = document.querySelector('#app');
const expressions = [
  ['shop around', 'Compare prices or offers from different sellers before buying.'],
  ['save up for', 'Put money aside over time for a future purchase.'],
  ['splash out on', 'Spend a lot of money on something special.'],
  ['cut back on', 'Reduce how much you spend, buy or use.'],
  ['give in to temptation', 'Stop resisting something you want to do or buy.'],
  ['snap up', 'Buy something quickly before the opportunity disappears.']
];
const artwork = {
  bag: 'a structured handbag', shoe: 'a pair of trainers', beauty: 'a fragrance bottle and lipstick',
  dress: 'a silk dress', coat: 'a belted coat', jeans: 'folded denim', glasses: 'a pair of sunglasses'
};
const awards = [
  [16, 'The Shopping Strategist', 'Your shopping vocabulary is runway-ready! You can distinguish even similar expressions with confidence.'],
  [12, 'The Fashion Insider', 'You have a strong fashion vocabulary. A little more practice will make your choices even sharper.'],
  [7, 'The Style Explorer', "You're building your shopping vocabulary. Review the expressions you found tricky and try again."],
  [0, 'The Fashion Rookie', 'Every fashion editor starts somewhere. Revisit the key expressions and practise at your own pace.']
];

let mainRun;
let run;
let bankVisible = true;

function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function normalize(value) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ').replace(/\.$/, '').trimEnd();
}

function startRun(items, retry = false) {
  let queue = shuffle(items);
  if (!retry) {
    while (queue.some((story, i) => i > 0 && story.answer === queue[i - 1].answer)) {
      queue = shuffle(items);
    }
    bankVisible = true;
  }
  run = { queue, retry, results: [], attempts: [] };
  if (!retry) mainRun = run;
  renderStory();
}

function focusHeading() {
  const heading = app.querySelector('h1');
  heading.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

function renderStory() {
  const index = run.results.length;
  const story = run.queue[index];
  const total = run.queue.length;
  const number = String(index + 1).padStart(2, '0');
  app.innerHTML = `
    <section class="spread">
      <figure class="plate"><img src="assets/${story.art}.jpg" alt="Editorial photograph of ${artwork[story.art]}"><figcaption>THE SHOPPING DIARIES</figcaption></figure>
      <div class="copy">
        <div class="counter"><p class="eyebrow">${run.retry ? 'Tricky stories' : 'Shopping Diaries'}</p><p class="eyebrow">${number} / ${String(total).padStart(2, '0')}</p></div>
        <progress aria-label="Story progress" value="${index + 1}" max="${total}"></progress>
        <h1 class="story-title" tabindex="-1">${story.title}</h1>
        <p class="sentence" id="sentence">${story.sentence.replace('_____', '<span class="blank"><span class="visually-hidden">blank</span></span>')}</p>
        <form autocomplete="off">
          <label for="answer">Full expression</label>
          <div class="entry">
            <input id="answer" type="text" spellcheck="false" autocapitalize="none" aria-describedby="sentence">
            <button id="check">Check answer</button>
          </div>
          <div class="feedback" role="status" aria-live="polite" aria-atomic="true"></div>
          <button id="next" hidden>Next story</button>
        </form>
        <aside class="bank">
          <div class="bank-head"><span class="eyebrow">Word bank</span><button class="toggle" type="button" aria-controls="words"></button></div>
          <ul class="words" id="words">${shuffle(expressions).map(([word]) => `<li>${word}</li>`).join('')}</ul>
        </aside>
      </div>
    </section>`;

  const form = app.querySelector('form');
  const input = app.querySelector('#answer');
  const check = app.querySelector('#check');
  const next = app.querySelector('#next');
  const feedback = app.querySelector('.feedback');
  const toggle = app.querySelector('.toggle');
  const words = app.querySelector('#words');
  let completed = false;
  let lastSubmission = -Infinity;

  function updateBank() {
    words.hidden = !bankVisible;
    toggle.textContent = bankVisible ? 'Hide word bank' : 'Show word bank';
    toggle.setAttribute('aria-expanded', String(bankVisible));
  }

  toggle.addEventListener('click', () => {
    bankVisible = !bankVisible;
    updateBank();
  });
  updateBank();

  form.addEventListener('keydown', event => {
    if (event.key === 'Enter' && (event.repeat || event.isComposing)) event.preventDefault();
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (performance.now() - lastSubmission < 350) return;
    if (completed) {
      run.attempts = [];
      if (run.results.length === total) renderReport(run);
      else renderStory();
      return;
    }

    const entered = input.value.trim();
    if (!entered) {
      feedback.textContent = 'Type the full expression before checking.';
      input.focus();
      return;
    }

    lastSubmission = performance.now();
    run.attempts.push(entered);
    const correct = normalize(entered) === story.answer;
    if (!correct && run.attempts.length === 1) {
      feedback.innerHTML = `<p><strong>Not quite.</strong> ${story.hint}</p>`;
      check.textContent = 'Try again';
      input.focus();
      input.select();
      return;
    }

    completed = true;
    run.results.push({ story, attempts: [...run.attempts], correct });
    feedback.innerHTML = correct
      ? `<p><strong>Correct!</strong> ${story.explanation}</p>`
      : `<p><strong>Correct expression: ${story.answer}</strong></p><p>${story.sentence.replace('_____', story.answer)}</p><p>${story.explanation}</p>`;
    input.readOnly = true;
    check.hidden = true;
    next.hidden = false;
    next.focus();
  });
  focusHeading();
}

function renderReport(report) {
  const { results, retry } = report;
  const first = results.filter(result => result.correct && result.attempts.length === 1);
  const corrected = results.filter(result => result.correct && result.attempts.length === 2);
  const mistakes = results.filter(result => !first.includes(result));
  const missed = new Set(mistakes.map(({ story }) => story.answer));
  const [ , title, description] = awards.find(([minimum]) => first.length >= minimum);
  const mixed = mistakes.some(({ story, attempts }) =>
    (story.answer === 'snap up' && normalize(attempts[0]) === 'shop around') ||
    (story.answer === 'shop around' && normalize(attempts[0]) === 'snap up')
  );

  app.innerHTML = `
    <section class="report">
      <p class="eyebrow">The Shopping Diaries</p>
      <h1 tabindex="-1">${retry ? 'Tricky Stories Report' : 'Your Style Report'}</h1>
      ${retry ? '' : `<h2>${title}</h2><p>${description}</p>`}
      <div class="metrics">
        <div><strong>${first.length}/${results.length}</strong>First-try score</div>
        <div><strong>${Math.round(100 * first.length / results.length)}%</strong>Correct on the first try</div>
        <div><strong>${corrected.length}</strong>Corrected on the second try</div>
      </div>
      <h2>Expression breakdown</h2>
      <ul class="breakdown">${expressions.map(([word]) => {
        const total = results.filter(({ story }) => story.answer === word).length;
        const score = first.filter(({ story }) => story.answer === word).length;
        return total ? `<li><span>${word}</span><progress value="${score}" max="${total}" aria-label="${word} first-try score"></progress><span>${score}/${total}</span></li>` : '';
      }).join('')}</ul>
      ${mistakes.length ? `<h2>Expressions to revisit</h2>
        ${mixed ? '<p>Shop around is about comparing offers; snap up is about buying quickly.</p>' : ''}
        <ul>${expressions.filter(([word]) => missed.has(word)).map(([word, definition]) => `<li><strong>${word}</strong> — ${definition}</li>`).join('')}</ul>
        <h2>Review your answers</h2><ol class="review"></ol>` : ''}
      <div class="actions">
        ${retry ? '<button type="button" id="report" class="secondary">Back to Your Style Report</button>' : ''}
        ${!retry && mistakes.length ? '<button type="button" id="retry">Retry tricky stories</button>' : ''}
        <button type="button" id="new" class="secondary">Start a new issue</button>
      </div>
    </section>`;

  const review = app.querySelector('.review');
  for (const { story, attempts, correct } of mistakes) {
    const item = document.createElement('li');
    const entries = [story.sentence, `First answer: ${attempts[0]}`];
    if (attempts.length > 1) entries.push(`Second answer: ${attempts[1]}${correct ? ' (correct)' : ''}`);
    entries.push(`Correct expression: ${story.answer}`);
    for (const value of entries) {
      const paragraph = document.createElement('p');
      paragraph.textContent = value;
      item.append(paragraph);
    }
    review.append(item);
  }
  app.querySelector('#retry')?.addEventListener('click', () => startRun(mistakes.map(({ story }) => story), true));
  app.querySelector('#report')?.addEventListener('click', () => renderReport(mainRun));
  app.querySelector('#new').addEventListener('click', () => startRun(stories));
  focusHeading();
}

app.querySelector('#start').addEventListener('click', () => startRun(stories));
