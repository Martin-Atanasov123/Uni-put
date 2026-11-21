/*
  Началната страница по taste-skill (design-taste-frontend 2.5.1).

  type: software (безплатно уеб приложение: калкулатор за приемен бал и кариерен тест)
  deal: hero centred, nav-mega, close-type, footer-dark, rhythm space, buttons arrow, mark initial;
        palette mint-pink-accounts (почти бял фон и тъмнозелен акцент: зеленото е „влизаш“, цветът
        на резултата над минимума); type onest (Chivo, Host Grotesk и Outfit, раздадени първи, нямат
        кирилица); grounds и effect: няма (CLAUDE.md забранява градиенти и орбове, а земите и шейдърите
        на скила са градиенти).
  moments: line-carries-colour (#pat, на ground-surface), letters-assemble (#bezplatno).

  Всички числа в прозорците са реални: формулите и минималните балове са от базата (universities,
  admission_min_scores), гимназиите от gymnasium_rankings (2026, I етап), сроковете от admission_events.
  Оценките 5.50 / 5.75 / 6.00 са въведени от нас, за да покажат изчислението; балът следва от формулата.
*/

const ARROW = '<svg class="m-arrow" viewBox="0 0 12 12" aria-hidden="true"><path class="m-arrow__stem" d="M1 6h8"/><path class="m-arrow__head" d="M4.5 2.5 8 6l-3.5 3.5"/></svg>';
const CHEV = '<svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const LIST_ROWS = [
    ["Американски университет в България", "Информатика и компютърни науки", "5170"],
    ["ВСУ „Черноризец Храбър“", "Информатика и компютърни науки", "25"],
    ["Великотърновски университет", "Педагогика на обучението по математика и информатика", "26.4"],
    ["Европейски политехнически университет", "Информатика и компютърни науки", "6"],
    ["Икономически университет – Варна", "Информатика и компютърни науки", "30"],
    ["Минно-геоложки университет", "Геология и геоинформатика", "48"],
    ["Нов български университет", "Информатика", "1000"],
    ["Пловдивски университет", "Математика, информатика и информационни технологии", "36", true],
    ["Пловдивски университет", "Информатика", "36"],
    ["Русенски университет", "Педагогика на обучението по математика и информатика", "24"],
    ["Софийски университет", "Информатика", "25.5"],
];

const listRows = LIST_ROWS.map(([uni, spec, max, on]) => `
          <div class="cw-row${on ? " is-on" : ""}"><b>${spec}</b><span>${uni}</span><em>от ${max}</em></div>`).join("");

export const HOME_HTML = `
<header class="nav">
  <div class="wrap nav__bar">
    <a class="skip-link" href="#top">Към съдържанието</a>
    <a class="nav__logo" href="#top"><span class="mark mark--initial" aria-hidden="true">У</span>УниПът</a>
    <nav class="nav__links" aria-label="Основно">
      <div class="nav__item">
        <a class="nav__link" href="#instrumenti">Инструменти ${CHEV}</a>
        <div class="nav__menu">
          <div class="wrap grid">
            <div class="menu-col span-3">
              <p class="t-label">В 12. клас</p>
              <a href="/calculator/">Калкулатор<span>Балът по формулата на МОН</span></a>
              <a href="/universities/">Университети<span>51 университета в 17 града</span></a>
              <a href="/calendar/">Календар<span>Срокове, изпити, класирания</span></a>
            </div>
            <div class="menu-col span-3">
              <p class="t-label">Преди това</p>
              <a href="/career-advisor/">Кариерен тест<span>30 въпроса, около 3 минути</span></a>
              <a href="/dzi-strateg/">ДЗИ Стратег<span>Кой втори ДЗИ да избереш</span></a>
              <a href="/priem-7-klas/">Прием след 7. клас<span>Бал за гимназиите в София</span></a>
            </div>
            <a class="menu-card span-3 start-10" href="/specialnosti/">
              <div class="panel"><div class="menu-mini" aria-hidden="true"><span>Информатика</span><span>Медицина</span><span>Право</span><span>Психология</span></div></div>
              <span class="t-card">Специалности</span>
              <span class="t-small muted">859 специалности с формула</span>
            </a>
          </div>
        </div>
      </div>
      <div class="nav__item"><a class="nav__link" href="/universities/">Университети</a></div>
      <div class="nav__item"><a class="nav__link" href="/dormitories/">Общежития</a></div>
      <div class="nav__item"><a class="nav__link" href="#faq">Въпроси</a></div>
    </nav>
    <div class="nav__actions">
      <a class="nav__link" href="/login">Вход</a>
      <a class="btn btn--primary" href="/calculator/">Изчисли моя бал</a>
    </div>
    <button class="nav__toggle" type="button" aria-expanded="false" aria-label="Меню">
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M2 5h14M2 13h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
    </button>
  </div>
</header>

<main id="top">
  <section class="hero hero--centred" data-enter data-testid="hero-section" aria-labelledby="hero-h">
    <div class="wrap"><div class="hero-text">
      <div class="hero__c">
        <a class="pill" href="#kalkulator"><span>Прием 2027</span><span class="muted">Как се смята балът</span></a>
        <h1 id="hero-h">Калкулатор за приемен бал</h1>
        <p class="hero__lead">Формулите на 51 университета: избираш специалност, въвеждаш оценките от ДЗИ и дипломата и виждаш бала си до минималния бал от миналия прием.</p>
        <div class="btn-row"><a class="btn btn--primary" href="/calculator/">Изчисли моя бал${ARROW}</a><a class="btn btn--secondary" href="/career-advisor/">Направи кариерния тест</a></div>
      </div>
      <div class="hero__window" role="img" aria-label="Калкулаторът показва бал 34.00 от 36 за Информатика в Пловдивския университет, с 16 точки над минималния бал от 2025 г.">
        <div class="ly-piece cw" aria-hidden="true">
          <div class="cw__bar"><span class="cw__dots"><i></i><i></i><i></i></span><span><b>Информатика</b> · Пловдивски университет</span><span class="cw__sp"></span><span class="cw__tag">Прием 2027</span></div>
          <div class="cw__body">
            <div class="cw__list">
              <div class="cw__q">информатика</div>
              <div class="cw-row is-on"><b>Информатика</b><span>Пловдивски университет</span><em>от 36</em></div>
              <div class="cw-row"><b>Информатика</b><span>Софийски университет</span><em>от 25.5</em></div>
            </div>
            <div class="cw__open" data-ly-steps="900">
              <div class="cw__grades" data-step><span>ДЗИ математика <b>5.50</b></span><span>Математика, диплома <b>5.75</b></span><span>Информатика, диплома <b>6.00</b></span></div>
              <div class="cw__result" data-step><b>34.00</b><span>от 36</span></div>
              <p class="cw__verdict" data-step>+16.00 т. над минималния бал от 2025 г. (18.00, III класиране)</p>
            </div>
          </div>
        </div>
      </div>
    </div></div>
  </section>

  <section class="section" id="kalkulator" style="--h: 1; --hm: 2" aria-labelledby="kalk-h">
    <div class="wrap">
      <div class="grid grid--top">
        <h2 id="kalk-h" class="span-5">Балът по формулата на всяка специалност</h2>
        <div class="span-6 start-7 stack-4">
          <p class="kalk-intro">Калкулаторът взима коефициентите от правилника на университета, показва формулата и смята, докато пишеш. Където има публикуван минимален бал, виждаш колко точки над или под него си.</p>
          <p><a class="link" href="/calculator/">Отвори калкулатора</a></p>
        </div>
      </div>
      <div class="ui app fill" role="img" aria-label="Списък с програми по информатика в 11 университета и отворената програма Математика, информатика и информационни технологии в Пловдивския университет: бал 34.00 от 36, с 11.26 точки над минималния бал от 2025 г.">
        <div class="app__pane app__pane--list" aria-hidden="true">
          <div class="cw__q cw__q--pane">информатика</div>${listRows}
        </div>
        <div class="app__pane app__pane--open" aria-hidden="true">
          <div class="op">
            <p class="op__uni">Пловдивски университет „Паисий Хилендарски“ · Пловдив</p>
            <p class="op__spec">Математика, информатика и информационни технологии</p>
            <p class="op__formula">Формула: 3 × ДЗИ по математика (или информатика, ИТ) + 2 × математика от дипломата + математика, информатика или ИТ от дипломата</p>
            <div class="op__inputs">
              <div><span>ДЗИ математика</span><b>5.50</b></div>
              <div><span>Математика, диплома</span><b>5.75</b></div>
              <div><span>Информатика, диплома</span><b>6.00</b></div>
            </div>
            <div class="op__score"><b>34.00</b><span>бал от 36</span></div>
            <p class="op__min">Минимален бал 2025 (III класиране): <b>22.74</b></p>
            <p class="op__verdict">+11.26 т. над минималния бал</p>
            <div class="op__acts"><span>Сподели</span><span>Картинка</span><span>Провери в сайта</span></div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="section" id="bezplatno" data-moment="letters-assemble" aria-labelledby="free-h">
    <div class="wrap">
      <h2 id="free-h" class="mo-la__type">Безплатно и без реклами</h2>
      <p class="mo-la__sub">Първите три специалности изчисляваш без акаунт. С безплатен акаунт пазиш списъка си, оценките и резултата от теста.</p>
      <ul class="free-facts">
        <li><b>51</b> университета с формули за бал</li>
        <li><b>859</b> специалности в калкулатора</li>
        <li><b>1002</b> професии в кариерния тест</li>
      </ul>
    </div>
  </section>

  <section class="section g2" id="instrumenti" aria-labelledby="tools-h">
    <div class="wrap">
      <div class="group">
        <div class="section-head">
          <h2 id="tools-h">Още четири инструмента. <span class="muted">Всички са безплатни.</span></h2>
        </div>
        <div class="grid">
          <article class="card card--row card--open span-6">
            <h3><a href="/career-advisor/">Показва кариерния ти тип</a></h3>
            <p>30 въпроса за около 3 минути подреждат шестте типа на Холанд и ги свързват с 910 специалности.</p>
            <div class="panel"><div class="mini mini--riasec" aria-hidden="true">
              <div><b>R</b><span>Реалист</span><i style="--w:38%"></i></div>
              <div><b>I</b><span>Изследовател</span><i style="--w:92%"></i></div>
              <div><b>A</b><span>Артист</span><i style="--w:55%"></i></div>
              <div><b>S</b><span>Социален</span><i style="--w:47%"></i></div>
              <div><b>E</b><span>Предприемач</span><i style="--w:30%"></i></div>
              <div><b>C</b><span>Конвенционален</span><i style="--w:62%"></i></div>
            </div></div>
          </article>
          <article class="card card--row card--open span-6">
            <h3><a href="/universities/">Търси в 51 университета</a></h3>
            <p>Каталог по специалност, град и степен: 859 специалности с формула за бал в 17 града.</p>
            <div class="panel"><div class="mini mini--search" aria-hidden="true">
              <div class="mini__q">Медицина</div>
              <div class="mini__r"><b>Медицина</b><span>Медицински университет – София</span></div>
              <div class="mini__r"><b>Медицина</b><span>Медицински университет – Пловдив</span></div>
              <div class="mini__r"><b>Медицина</b><span>Медицински университет – Варна</span></div>
              <div class="mini__r"><b>Медицина</b><span>Медицински университет – Плевен</span></div>
            </div></div>
          </article>
        </div>
      </div>
      <div class="grid">
        <article class="card card--row card--open span-6">
          <h3><a href="/calendar/">Пази сроковете за прием</a></h3>
          <p>Регистрации, изпити и класирания по университети, с напомняне по имейл преди срока.</p>
          <div class="panel"><div class="mini mini--dates" aria-hidden="true">
            <p class="mini__label">Софийски университет, 2026</p>
            <div class="mini__d"><time>18–26 апр.</time><span>Кандидатстудентски изпити, I сесия</span></div>
            <div class="mini__d"><time>6–21 юни</time><span>Кандидатстудентски изпити, II сесия</span></div>
            <div class="mini__d"><time>12 юни – 2 юли</time><span>Регистрация за класиране, такса 25 €</span></div>
            <div class="mini__d"><time>9 юли</time><span>Първи етап на класиране</span></div>
          </div></div>
        </article>
        <article class="card card--row card--open span-6">
          <h3><a href="/calculator/">Прави картинка с бала ти</a></h3>
          <p>Резултатът става картинка за телефона или линк, който пращаш на родителите си.</p>
          <div class="panel"><div class="mini mini--share" aria-hidden="true">
            <div class="share">
              <span class="share__brand">УниПът</span>
              <span class="share__spec">Информатика · Пловдивски университет</span>
              <b class="share__score">34.00</b>
              <span class="share__of">бал от 36</span>
            </div>
          </div></div>
        </article>
      </div>
    </div>
  </section>

  <section class="section" id="faq" aria-labelledby="faq-h">
    <div class="wrap">
      <div class="grid grid--top">
        <div class="span-5 stack-4">
          <h2 id="faq-h">Въпроси за калкулатора</h2>
          <p class="faq-side">Не намираш отговора? Пиши ни и ще отговорим.</p>
          <p><a class="link" href="mailto:uniput1000@gmail.com">Пиши ни</a></p>
        </div>
        <div class="faq span-6 start-7">
          <div class="faq__item"><h3>Безплатен ли е УниПът?</h3><p>Да. Калкулаторът, тестът и каталогът са безплатни. Без акаунт изчисляваш първите три специалности; с безплатен акаунт продължаваш без ограничение.</p></div>
          <div class="faq__item"><h3>Откъде са формулите?</h3><p>От правилниците за прием на университетите. Минималните балове са от класиранията, които те публикуват.</p></div>
          <div class="faq__item"><h3>Гарантира ли балът, че ще вляза?</h3><p>Не. Формулата е точна, но минималният бал се мени всяка година според броя кандидати. Миналогодишният е ориентир.</p></div>
          <div class="faq__item"><h3>Какво е кариерният тест?</h3><p>Моделът на Холанд с шест типа, на който стъпва и базата O*NET. 30 въпроса за около 3 минути.</p></div>
          <div class="faq__item"><h3>Няма моята специалност. Какво да правя?</h3><p>Пиши ни и ще я добавим. Работим по университетите, които още липсват.</p></div>
        </div>
      </div>
    </div>
  </section>
  <section class="section ground-surface" id="pat" style="--h: 1; --hm: 2" data-moment="line-carries-colour" data-moment-opts='{"from":"base"}' aria-labelledby="pat-h">
    <div class="wrap">
      <div class="section-head"><h2 id="pat-h">Три решения от 7. до 12. клас</h2></div>
      <div class="grid">
        <article class="card card--row card--open span-4">
          <span class="step-num">1</span>
          <h3><a href="/priem-7-klas/">Избери гимназия в София</a></h3>
          <p>Балът ти за всяка паралелка и минималните балове от последните 4 години, по данни на РУО.</p>
          <div class="panel"><div class="mini mini--gym" aria-hidden="true">
            <p class="mini__label">Минимален бал, 2026, I етап</p>
            <div class="mini__g"><span>СМГ, математика и информатика</span><b>485.75</b></div>
            <div class="mini__g"><span>СМГ, математика и физика</span><b>483.00</b></div>
            <div class="mini__g"><span>НПМГ, математика и информатика</span><b>481.25</b></div>
          </div></div>
        </article>
        <article class="card card--row card--open span-4">
          <span class="step-num">2</span>
          <h3><a href="/dzi-strateg/">Избери втория ДЗИ</a></h3>
          <p>Добавяш специалностите, които те привличат, и виждаш коя матура ги държи отворени.</p>
          <div class="panel"><div class="mini mini--dzi" aria-hidden="true">
            <div class="mini__s"><b>Информатика, ПУ</b><span><i>Математика</i><i>Информатика</i><i>ИТ</i></span></div>
            <div class="mini__s"><b>Информатика, СУ</b><span><i>Математика</i><i>Информатика</i><i>ИТ</i></span></div>
            <div class="mini__s"><b>Информатика и компютърни науки, ИУ – Варна</b><span><i>Математика</i><i>Всеки друг ДЗИ, с коефициент 2</i></span></div>
          </div></div>
        </article>
        <article class="card card--row card--open span-4">
          <span class="step-num">3</span>
          <h3><a href="/calculator/">Изчисли бала за университет</a></h3>
          <p>Точната формула на всяка специалност и минималният бал там, където университетът го публикува.</p>
          <div class="panel"><div class="mini mini--score" aria-hidden="true">
            <p class="mini__label">Информатика и компютърни науки, ИУ – Варна, с 5.50 по всички предмети</p>
            <b class="mini__big">27.50</b>
            <span>бал от 30</span>
          </div></div>
        </article>
      </div>
    </div>
  </section>
</main>

<footer class="footer closing footer--dark ground-inverse" id="contact" aria-labelledby="close-h">
  <div class="wrap">
    <div class="closing__cta close--type">
      <div class="section-head">
        <h2 id="close-h">Изчисли бала за своята специалност</h2>
        <p class="t-small muted">Безплатно, по формулите на 51 университета.</p>
      </div>
      <a class="btn btn--primary btn--xl btn--wide" href="/calculator/">Изчисли моя бал${ARROW}</a>
    </div>
    <div class="closing__links">
      <div class="grid">
        <div class="span-4 stack-4">
          <a class="nav__logo footer__name" href="#top"><span class="mark mark--initial" aria-hidden="true">У</span>УниПът</a>
          <p class="footer__lede">Калкулатор за приемен бал и кариерен тест за кандидат-студенти в България.</p>
        </div>
        <div class="span-2 footer__col"><h3>Кандидатствай</h3><ul><li><a href="/calculator/">Калкулатор</a></li><li><a href="/universities/">Университети</a></li><li><a href="/specialnosti/">Специалности</a></li><li><a href="/calendar/">Календар</a></li></ul></div>
        <div class="span-2 footer__col"><h3>Избери път</h3><ul><li><a href="/career-advisor/">Кариерен тест</a></li><li><a href="/dzi-strateg/">ДЗИ Стратег</a></li><li><a href="/priem-7-klas/">Прием след 7. клас</a></li></ul></div>
        <div class="span-2 footer__col"><h3>Студенти</h3><ul><li><a href="/dormitories/">Общежития</a></li><li><a href="/favorites/">Любими</a></li><li><a href="/login">Вход</a></li></ul></div>
        <div class="span-2 footer__col"><h3>Проектът</h3><ul><li><a href="/about/">За нас</a></li><li><a href="https://www.mon.bg">Данни от МОН</a></li><li><a href="mailto:uniput1000@gmail.com">Пиши ни</a></li></ul></div>
      </div>
      <div class="footer__legal">
        <span>&copy; 2026 УниПът &nbsp; <a href="/privacy/">Поверителност</a> &nbsp; <a href="/terms/">Условия</a></span>
        <div class="socials"></div>
      </div>
    </div>
  </div>
</footer>

<nav class="actionbar" aria-label="Бързи действия">
  <a class="btn btn--primary" href="/calculator/">Изчисли моя бал</a>
</nav>
`;

// Page CSS: само вътре във визуалите (прозорците, мини-панелите) и рецептата на app-frame.
export const HOME_CSS = `
/* hero window: плосък фон вместо земя (без градиенти); маската на рамката е функционална */
.hero--centred .hero__window { background: var(--g-alt, #eeeeee); }
.cw { background: #fff; border: 1px solid rgb(10 10 10 / .10); border-radius: 14px; box-shadow: 0 24px 60px rgb(10 10 10 / .10); overflow: hidden; font-size: 14px; color: #0a0a0a; text-align: left; }
.cw__bar { display: flex; align-items: center; gap: 12px; height: 40px; padding: 0 14px; border-bottom: 1px solid rgb(10 10 10 / .08); color: #5e5e5e; font-size: 13px; }
.cw__bar b { color: #0a0a0a; font-weight: 500; }
.cw__dots { display: inline-flex; gap: 6px; } .cw__dots i { width: 10px; height: 10px; border-radius: 50%; background: #dcdcdc; }
.cw__sp { flex: 1; } .cw__tag { padding: 2px 8px; border-radius: 99px; background: #eef5f0; color: #1f6b3a; font-weight: 500; }
.cw__body { display: grid; grid-template-columns: 260px 1fr; min-height: 420px; }
.cw__list { border-right: 1px solid rgb(10 10 10 / .08); padding: 10px; display: grid; align-content: start; gap: 2px; }
.cw__q { height: 34px; margin-bottom: 6px; border-radius: 9px; background: #f2f2f2; display: flex; align-items: center; padding: 0 10px; color: #5e5e5e; font-size: 13px; }
.cw-row { display: grid; grid-template-columns: 1fr auto; gap: 1px 10px; padding: 9px 8px; border-radius: 9px; font-size: 13px; }
.cw-row.is-on { background: #eef5f0; }
.cw-row b { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cw-row span { grid-column: 1; color: #5e5e5e; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cw-row em { grid-column: 2; grid-row: 1 / span 2; align-self: center; font: 500 13px/1 var(--font-mono); font-style: normal; color: #5e5e5e; }
.cw__open { display: grid; align-content: start; gap: 12px; padding: 18px 20px; }
.cw__formula { margin: 0; padding: 10px 12px; border-radius: 10px; background: #f2f2f2; color: #3a3a3a; font-size: 13px; }
.cw__grades { display: flex; flex-wrap: wrap; gap: 8px; } .cw__grades span { padding: 6px 10px; border: 1px solid rgb(10 10 10 / .12); border-radius: 8px; color: #5e5e5e; font-size: 13px; }
.cw__grades b { margin-left: 4px; color: #0a0a0a; font: 500 13px/1 var(--font-mono); }
.cw__result { display: flex; align-items: baseline; gap: 10px; } .cw__result b { font: 500 36px/1 var(--font-mono); letter-spacing: -.03em; color: #1f6b3a; } .cw__result span { color: #5e5e5e; }
.cw__verdict { margin: 0; color: #1f6b3a; font-weight: 500; }
@media (max-width: 639px) { .cw__body { grid-template-columns: 1fr; min-height: 220px; } .cw__list, .cw__grades { display: none; } .cw__bar .cw__tag { display: none; } .cw__open { padding: 14px 16px; } }

/* app-frame (рецептата от sections-library.md) */
.kalk-intro, .faq-side { margin: 0; color: var(--ink); max-width: 52ch; }
/* текстът, който се чете, е в мастило (7:1), не в сивото на кита */
.hero--centred .hero__lead, #bezplatno .mo-la__sub { color: var(--ink); }
/* React монтира страницата в #root: без кутия, за да са header, main и footer на нивото на body */
#root, .taste-home { display: contents; }
/* DaisyUI (за админ панела) дава на .footer > * place-items: start; китът очаква редовете да са на цялата ширина */
footer.closing > .wrap { place-items: normal; }
@media (max-width: 400px) { .nav__actions > .nav__link { display: none; } }
.app.ui { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); margin-top: var(--s-7); background: var(--u-bg, #fff); border: 1px solid var(--u-border, rgb(10 10 10 / .12)); border-radius: var(--u-r, 16px); box-shadow: var(--u-shadow, none); }
.app > .app__pane { position: relative; min-width: 0; min-height: 0; overflow: hidden; }
.app > .app__pane + .app__pane { border-left: 1px solid var(--u-line, rgb(10 10 10 / .08)); }
.app > .app__pane::after { content: ""; position: absolute; inset: auto 0 0 0; height: 64px; background: linear-gradient(transparent, var(--u-bg, #fff)); pointer-events: none; }
.app__pane--list { padding: 12px; display: grid; align-content: start; gap: 2px; }
.cw__q--pane { margin-bottom: 8px; }
.app .cw-row { padding: 11px 10px; }
.op { padding: 24px 28px; display: grid; gap: 14px; align-content: start; font-size: 15px; }
.op__uni { margin: 0; color: var(--muted); font-size: 14px; }
.op__spec { margin: 0; font: var(--display-weight, 400) 24px/1.25 var(--font-display); letter-spacing: -.01em; }
.op__formula { margin: 0; padding: 12px 14px; border-radius: 10px; background: #f2f2f2; color: #3a3a3a; font-size: 14px; }
.op__inputs { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.op__inputs div { display: grid; gap: 6px; padding: 10px 12px; border: 1px solid rgb(10 10 10 / .12); border-radius: 10px; }
.op__inputs span { color: var(--muted); font-size: 13px; } .op__inputs b { font: 500 18px/1 var(--font-mono); }
.op__score { display: flex; align-items: baseline; gap: 12px; } .op__score b { font: 500 38px/1 var(--font-mono); letter-spacing: -.03em; color: #1f6b3a; } .op__score span { color: var(--muted); }
.op__min, .op__verdict { margin: 0; } .op__min b { font-family: var(--font-mono); font-weight: 500; } .op__verdict { color: #1f6b3a; font-weight: 500; }
.op__acts { display: flex; gap: 8px; } .op__acts span { padding: 8px 12px; border-radius: 8px; border: 1px solid rgb(10 10 10 / .14); font-size: 13px; font-weight: 500; }
.op__acts span:first-child { background: #1f6b3a; border-color: #1f6b3a; color: #fff; }
@media (min-width: 1024px) and (max-width: 1279px) { .app.ui { grid-template-columns: minmax(0, 4fr) minmax(0, 8fr); } }
@media (max-width: 1023px) {
  .app.ui { grid-template-columns: minmax(0, 1fr); grid-template-rows: auto minmax(0, 1fr); }
  .app > .app__pane--list { max-height: 252px; } .app > .app__pane--list::after { display: none; }
  .app > .app__pane + .app__pane { border-left: 0; border-top: 1px solid var(--u-line, rgb(10 10 10 / .08)); }
}
@media (max-width: 639px) {
  .app.ui { grid-template-rows: minmax(0, 1fr); } .app > .app__pane--list { display: none; }
  .app > .app__pane + .app__pane { border-top: 0; } .op__inputs { grid-template-columns: 1fr; } .op__score b { font-size: 32px; }
}

/* мини-панели в картите */
#instrumenti .panel { --p-h: 300px; } #pat .panel { --p-h: 380px; }
/* панелите на кита стоят на осветена (градиентна) земя; CLAUDE.md забранява градиенти: плосък фон */
#instrumenti .panel, #pat .panel { background: #e9e9e7; background-image: none; }
@media (max-width: 639px) { #instrumenti .panel { --p-h: 170px; } .mini--search > :nth-child(n+3) { display: none; } #pat .panel { --p-h: 220px; } .card h3 > a { display: inline-flex; align-items: center; min-height: 44px; } .mini > :nth-child(n+4) { display: none; } .mini--riasec > :nth-child(n+4), .mini--search > :nth-child(n+4) { display: none; } }
.free-facts { list-style: none; margin: var(--s-7) 0 0; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--s-5); max-width: 62rem; }
.free-facts li { padding-top: var(--s-4); border-top: 1px solid rgb(10 10 10 / .14); font-size: 18px; line-height: 1.5; }
.free-facts b { display: block; font: 500 32px/1.1 var(--font-mono); letter-spacing: -.02em; color: #1f6b3a; }
@media (max-width: 639px) { .free-facts { grid-template-columns: 1fr; gap: var(--s-4); } }
.mini { position: absolute; inset: 24px 24px auto 24px; display: grid; gap: 8px; font-size: 14px; color: #0a0a0a; }
.mini__label { margin: 0 0 4px; color: #404040; font-size: 13px; }
.mini--riasec div { display: grid; grid-template-columns: 20px 120px 1fr; align-items: center; gap: 10px; }
.mini--riasec b { font: 500 14px/1 var(--font-mono); } .mini--riasec span { color: #404040; font-size: 13px; }
.mini--riasec i { display: block; height: 10px; border-radius: 99px; background: #fff; overflow: hidden; position: relative; }
.mini--riasec i::after { content: ""; position: absolute; inset: 0 auto 0 0; width: var(--w); background: #1f6b3a; border-radius: 99px; }
.mini__q { height: 40px; border-radius: 10px; background: #fff; border: 1px solid rgb(10 10 10 / .12); display: flex; align-items: center; padding: 0 12px; color: #5e5e5e; }
.mini__r, .mini__d, .mini__g, .mini__s { display: grid; gap: 2px; padding: 10px 12px; border-radius: 10px; background: #fff; }
.mini__r b, .mini__s b { font-weight: 500; } .mini__r span { color: #404040; font-size: 13px; }
.mini__d { grid-template-columns: 112px 1fr; align-items: baseline; } .mini__d time { font: 500 13px/1.3 var(--font-mono); color: #1f6b3a; }
.mini__g { grid-template-columns: 1fr auto; align-items: baseline; } .mini__g b { font: 500 15px/1 var(--font-mono); }
.mini__s span { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; } .mini__s i { font-style: normal; font-size: 12.5px; padding: 3px 8px; border-radius: 99px; background: #eef5f0; color: #1f6b3a; }
.mini--score { inset: 32px 24px auto 24px; } .mini__big { font: 500 38px/1 var(--font-mono); letter-spacing: -.03em; color: #1f6b3a; } .mini--score span { color: #404040; }
.mini--share { inset: 24px; place-items: center; }
.share { display: grid; gap: 6px; width: min(280px, 100%); padding: 20px; border-radius: 16px; background: #0a0a0a; color: #fff; }
.share__brand { font-weight: 500; color: #86efac; } .share__spec { color: #bdbdbd; font-size: 13px; }
.share__score { font: 500 38px/1 var(--font-mono); letter-spacing: -.03em; } .share__of { color: #9e9e9e; font-size: 13px; }
.menu-mini { position: absolute; inset: 16px; display: flex; flex-wrap: wrap; align-content: flex-start; gap: 6px; }
.menu-mini span { padding: 4px 10px; border-radius: 99px; background: #fff; font-size: 13px; }
.footer__name { font-size: 48px; }
@media (max-width: 639px) { .footer__name { font-size: 30px; } }
`;
