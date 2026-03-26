import React from 'react';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-base-200 pt-28 pb-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-base-100 rounded-[3rem] shadow-2xl p-8 md:p-16 animate-in fade-in duration-500">
          <h1 className="text-4xl font-black mb-8 text-primary">Условия за ползване</h1>
          
          <div className="prose prose-lg max-w-none space-y-6 text-base-content/80">
            <section>
              <h2 className="text-2xl font-bold text-base-content">1. Предмет</h2>
              <p>Настоящите Условия за ползване уреждат отношенията между УниПът („ние“, „платформата“) и потребителите на нашите услуги. Използвайки Платформата, вие се съгласявате с тези условия.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-base-content">2. Права и задължения на потребителите</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Потребителят има право да използва калкулаторите и ресурсите на Платформата за лични, некомерсиални цели.</li>
                <li>Потребителят се задължава да не подава невярна информация при попълване на тестовете и калкулаторите.</li>
                <li>Забранено е използването на автоматизирани системи (скриптове, роботи) за извличане на данни от Платформата.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-base-content">3. Интелектуална собственост</h2>
              <p>Всички материали, софтуерни кодове, алгоритми (включително RIASEC методологията и бал калкулаторите), дизайн и съдържание са собственост на УниПът или неговите лицензианти и са защитени от Закона за авторското право и сродните му права.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-base-content">4. Ограничаване на отговорността</h2>
              <p>УниПът предоставя информацията „във вида, в който е“. Въпреки че се стремим към максимална точност, не носим отговорност за грешки в балообразуването или промени в университетските изисквания, които не са отразени своевременно. Окончателните резултати винаги трябва да се проверяват в официалните страници на съответните ВУЗ.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-base-content">5. Прекратяване на акаунт</h2>
              <p>Запазваме си правото да прекратим достъпа на потребители, които нарушават настоящите условия или се опитват да компрометират сигурността на Платформата.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-base-content">6. Приложимо право</h2>
              <p>За всички неуредени въпроси се прилага българското законодателство. Споровете ще се решават от компетентните съдилища в гр. София.</p>
            </section>

            <div className="divider"></div>
            <p className="text-sm italic">Последна актуализация: 26 март 2026 г.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
