import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-base-200 pt-28 pb-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-base-100 rounded-[3rem] shadow-2xl p-8 md:p-16 animate-in fade-in duration-500">
          <h1 className="text-4xl font-black mb-8 text-secondary">Политика за поверителност</h1>
          
          <div className="prose prose-lg max-w-none space-y-6 text-base-content/80">
            <section>
              <h2 className="text-2xl font-bold text-base-content">1. Какви лични данни се събират?</h2>
              <p>Ние събираме и обработваме следните лични данни:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Име и имейл адрес при регистрация.</li>
                <li>История на отговорите в кариерния съветник и бал калкулатора.</li>
                <li>IP адрес и технически данни при посещение на Платформата.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-base-content">2. Цели на обработката</h2>
              <p>Вашите данни се обработват единствено с цел:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Осигуряване на достъп до персонализираните резултати.</li>
                <li>Извършване на кариерни анализи и калкулации.</li>
                <li>Подобряване на функционалността на Платформата.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-base-content">3. Срокове на съхранение</h2>
              <p>Личните данни се съхраняват докато потребителят има активен акаунт. При изтриване на акаунта, данните се анонимизират за статистически цели или се изтриват напълно в срок от 30 дни.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-base-content">4. Бисквитки (Cookies)</h2>
              <p>Платформата използва функционални бисквитки за поддържане на сесията и localStorage за съхраняване на предпочитания и междинни резултати от тестовете.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-base-content">5. Трети страни</h2>
              <p>Данните ви не се предоставят на трети страни с комерсиална цел. Използваме Supabase за защитено съхранение на информацията в съответствие с техните стандарти за сигурност.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-base-content">6. Вашите права по GDPR</h2>
              <p>Имате право на достъп, коригиране, изтриване и преносимост на вашите данни. За упражняване на тези права можете да се свържете с нас на посочения в Платформата контакт.</p>
            </section>

            <div className="divider"></div>
            <p className="text-sm italic">Последна актуализация: 26 март 2026 г.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
