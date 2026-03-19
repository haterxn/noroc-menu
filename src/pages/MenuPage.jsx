import React, { useState, useEffect, useRef } from 'react';
import { getCategories, getItems, sendFeedback } from '../api';

export default function MenuPage() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [lang, setLang] = useState('ru');
  const sectionRefs = useRef({});

  // Feedback form
  const [fb, setFb] = useState({ name: '', phone: '', message: '' });
  const [fbSent, setFbSent] = useState(false);
  const [fbLoading, setFbLoading] = useState(false);

  useEffect(() => {
    Promise.all([getCategories(), getItems()]).then(([cats, itms]) => {
      setCategories(cats);
      setItems(itms);
      if (cats.length > 0) setActiveCategory(cats[0].id);
    });
  }, []);

  const scrollToCategory = (catId) => {
    setActiveCategory(catId);
    const el = sectionRefs.current[catId];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const t = (item, field) => {
    if (lang === 'ru' && item[field + '_ru']) return item[field + '_ru'];
    return item[field];
  };

  const handleFeedback = async (e) => {
    e.preventDefault();
    setFbLoading(true);
    try {
      await sendFeedback(fb);
      setFbSent(true);
      setFb({ name: '', phone: '', message: '' });
    } catch { /* ignore */ }
    setFbLoading(false);
  };

  // Group items by category
  const grouped = categories.map(cat => ({
    ...cat,
    items: items.filter(i => i.category_id === cat.id),
  }));

  return (
    <div className="menu-page">
      {/* Hero */}
      <header className="hero">
        <div className="lang-toggle">
          <button className={`lang-btn ${lang === 'ro' ? 'active' : ''}`} onClick={() => setLang('ro')}>RO</button>
          <button className={`lang-btn ${lang === 'ru' ? 'active' : ''}`} onClick={() => setLang('ru')}>RU</button>
        </div>
        <div className="hero-ornament">&#10043; &#10043; &#10043;</div>
        <h1>NOROC</h1>
        <p className="hero-subtitle">Restaurant &amp; Banquet Hall</p>
        <div className="hero-info">
          <span>str. Decebal 131, Bălți</span>
          <span>(+373) 688 21 888</span>
        </div>
      </header>

      {/* Category tabs */}
      {categories.length > 0 && (
        <nav className="category-tabs">
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`cat-tab ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => scrollToCategory(cat.id)}
            >
              {t(cat, 'name')}
            </button>
          ))}
        </nav>
      )}

      {/* Menu sections */}
      <main className="menu-content">
        {grouped.map(cat => (
          <section
            key={cat.id}
            className="menu-section"
            ref={el => (sectionRefs.current[cat.id] = el)}
          >
            <div className="section-header">
              <h2>{t(cat, 'name')}</h2>
              <div className="section-line" />
            </div>
            <div className="menu-items-grid">
              {cat.items.filter(i => i.available).map(item => (
                <div key={item.id} className="menu-item">
                  <div className="menu-item-image-wrap">
                    <div className="ratio-3-4">
                      {item.image ? (
                        <img src={`/uploads/${item.image}`} alt={t(item, 'name')} loading="lazy" />
                      ) : (
                        <div className="placeholder-icon">&#9827;</div>
                      )}
                    </div>
                  </div>
                  <div className="menu-item-info">
                    <div className="menu-item-top">
                      <span className="menu-item-name">{t(item, 'name')}</span>
                      <span className="menu-item-price">{item.price} MDL</span>
                    </div>
                    {(t(item, 'description')) && (
                      <p className="menu-item-desc">{t(item, 'description')}</p>
                    )}
                    {item.weight && (
                      <p className="menu-item-weight">{item.weight}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {cat.items.filter(i => i.available).length === 0 && (
              <div className="empty-state">
                <p>{lang === 'ru' ? 'Скоро здесь появятся блюда' : 'În curând vor apărea preparate'}</p>
              </div>
            )}
          </section>
        ))}
      </main>

      {/* Feedback */}
      <section className="feedback-section" id="feedback">
        <h2>{lang === 'ru' ? 'Свяжитесь с нами' : 'Contactați-ne'}</h2>
        <p>{lang === 'ru' ? 'Оставьте отзыв или забронируйте столик' : 'Lăsați un feedback sau rezervați o masă'}</p>

        {fbSent ? (
          <div className="feedback-success">
            {lang === 'ru' ? 'Спасибо! Мы свяжемся с вами в ближайшее время.' : 'Mulțumim! Vă vom contacta în curând.'}
          </div>
        ) : (
          <form className="feedback-form" onSubmit={handleFeedback}>
            <div className="feedback-row">
              <input
                className="form-input"
                placeholder={lang === 'ru' ? 'Ваше имя *' : 'Numele dvs. *'}
                value={fb.name}
                onChange={e => setFb({ ...fb, name: e.target.value })}
                required
              />
              <input
                className="form-input"
                placeholder={lang === 'ru' ? 'Телефон' : 'Telefon'}
                value={fb.phone}
                onChange={e => setFb({ ...fb, phone: e.target.value })}
              />
            </div>
            <textarea
              className="form-textarea"
              placeholder={lang === 'ru' ? 'Ваше сообщение *' : 'Mesajul dvs. *'}
              value={fb.message}
              onChange={e => setFb({ ...fb, message: e.target.value })}
              required
            />
            <button className="btn-primary" type="submit" disabled={fbLoading}>
              {fbLoading
                ? (lang === 'ru' ? 'Отправка...' : 'Se trimite...')
                : (lang === 'ru' ? 'Отправить' : 'Trimite')}
            </button>
          </form>
        )}
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-name">NOROC</div>
        <div className="footer-info">
          <span>str. Decebal 131, Bălți, Moldova</span>
          <a href="tel:+37368821888">(+373) 688 21 888</a>
          <a href="mailto:noroc@restaurantebalti.md">noroc@restaurantebalti.md</a>
        </div>
        <div className="footer-social">
          <a href="https://www.instagram.com/restaurant_noroc_balti/" target="_blank" rel="noopener">Instagram</a>
          <a href="https://www.facebook.com/" target="_blank" rel="noopener">Facebook</a>
        </div>
        <p className="footer-copy">&copy; 2024 Restaurant NOROC. {lang === 'ru' ? 'Все права защищены.' : 'Toate drepturile rezervate.'}</p>
      </footer>
    </div>
  );
}
