import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, '..', 'noroc.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_ru TEXT,
    image TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    name_ru TEXT,
    description TEXT,
    description_ru TEXT,
    price REAL NOT NULL,
    weight TEXT,
    image TEXT,
    available INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_read INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );
`);

// Create default admin if none exists
const adminExists = db.prepare('SELECT COUNT(*) as count FROM admin').get();
if (adminExists.count === 0) {
  const hash = bcrypt.hashSync('noroc2024', 10);
  db.prepare('INSERT INTO admin (username, password) VALUES (?, ?)').run('admin', hash);
}

// Seed demo categories if empty
const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get();
if (catCount.count === 0) {
  const insertCat = db.prepare('INSERT INTO categories (name, name_ru, sort_order) VALUES (?, ?, ?)');
  const insertItem = db.prepare('INSERT INTO menu_items (category_id, name, name_ru, description, description_ru, price, weight, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

  const cats = [
    { name: 'Aperitive', name_ru: 'Закуски', items: [
      { name: 'Platou de brânzeturi', name_ru: 'Сырная тарелка', desc: 'Selecție de brânzeturi moldovenești', desc_ru: 'Ассорти молдавских сыров', price: 185, weight: '300g' },
      { name: 'Platou de mezeluri', name_ru: 'Мясная тарелка', desc: 'Mezeluri tradiționale', desc_ru: 'Традиционные мясные деликатесы', price: 195, weight: '350g' },
      { name: 'Bruschete cu roșii', name_ru: 'Брускетта с томатами', desc: 'Pâine prăjită cu roșii și busuioc', desc_ru: 'Поджаренный хлеб с томатами и базиликом', price: 95, weight: '200g' },
    ]},
    { name: 'Salate', name_ru: 'Салаты', items: [
      { name: 'Salată Caesar', name_ru: 'Салат Цезарь', desc: 'Cu pui la grătar și parmezan', desc_ru: 'С куриной грудкой гриль и пармезаном', price: 145, weight: '250g' },
      { name: 'Salată grecească', name_ru: 'Греческий салат', desc: 'Legume proaspete cu brânză feta', desc_ru: 'Свежие овощи с сыром фета', price: 125, weight: '280g' },
      { name: 'Salată cu ton', name_ru: 'Салат с тунцом', desc: 'Ton, ouă, legume proaspete', desc_ru: 'Тунец, яйца, свежие овощи', price: 155, weight: '260g' },
    ]},
    { name: 'Supe', name_ru: 'Супы', items: [
      { name: 'Zeamă de pui', name_ru: 'Зама', desc: 'Supă tradițională moldovenească', desc_ru: 'Традиционный молдавский суп', price: 85, weight: '350ml' },
      { name: 'Ciorbă de legume', name_ru: 'Овощной суп', desc: 'Ciorbă din legume proaspete', desc_ru: 'Суп из свежих овощей', price: 75, weight: '350ml' },
    ]},
    { name: 'Feluri principale', name_ru: 'Основные блюда', items: [
      { name: 'Mușchi de vită', name_ru: 'Стейк из говядины', desc: 'Fript la perfecție cu sos de vin', desc_ru: 'Идеально прожаренный с винным соусом', price: 285, weight: '300g' },
      { name: 'Piept de rață', name_ru: 'Утиная грудка', desc: 'Cu sos de portocale', desc_ru: 'С апельсиновым соусом', price: 265, weight: '280g' },
      { name: 'Somon la grătar', name_ru: 'Лосось на гриле', desc: 'Cu legume și sos de lămâie', desc_ru: 'С овощами и лимонным соусом', price: 245, weight: '250g' },
      { name: 'Cotlet de porc', name_ru: 'Свиная отбивная', desc: 'Marinat în ierburi aromate', desc_ru: 'Маринованная в ароматных травах', price: 175, weight: '300g' },
    ]},
    { name: 'Grătar', name_ru: 'Гриль', items: [
      { name: 'Frigărui de pui', name_ru: 'Куриный шашлык', desc: 'Marinate în condimente speciale', desc_ru: 'Маринованный в специальных специях', price: 145, weight: '250g' },
      { name: 'Mici', name_ru: 'Мичи', desc: 'Mici tradiționale la grătar', desc_ru: 'Традиционные мичи на гриле', price: 125, weight: '300g' },
      { name: 'Coaste de porc', name_ru: 'Свиные рёбрышки', desc: 'Glazurate cu miere', desc_ru: 'Глазированные мёдом', price: 195, weight: '400g' },
    ]},
    { name: 'Garnituri', name_ru: 'Гарниры', items: [
      { name: 'Cartofi prăjiți', name_ru: 'Картофель фри', desc: 'Cartofi crocanti', desc_ru: 'Хрустящий картофель', price: 55, weight: '200g' },
      { name: 'Orez cu legume', name_ru: 'Рис с овощами', desc: 'Orez parfumat cu legume', desc_ru: 'Ароматный рис с овощами', price: 65, weight: '200g' },
      { name: 'Legume la grătar', name_ru: 'Овощи гриль', desc: 'Mix de legume de sezon', desc_ru: 'Микс из сезонных овощей', price: 75, weight: '250g' },
    ]},
    { name: 'Deserturi', name_ru: 'Десерты', items: [
      { name: 'Tiramisu', name_ru: 'Тирамису', desc: 'Rețeta clasică italiană', desc_ru: 'Классический итальянский рецепт', price: 95, weight: '150g' },
      { name: 'Plăcintă cu mere', name_ru: 'Яблочный пирог', desc: 'Cu înghețată de vanilie', desc_ru: 'С ванильным мороженым', price: 85, weight: '180g' },
      { name: 'Panna Cotta', name_ru: 'Панна Котта', desc: 'Cu sos de fructe de pădure', desc_ru: 'С соусом из лесных ягод', price: 90, weight: '150g' },
    ]},
    { name: 'Băuturi', name_ru: 'Напитки', items: [
      { name: 'Apă minerală', name_ru: 'Минеральная вода', desc: 'Naturală sau carbogazoasă', desc_ru: 'Негазированная или газированная', price: 35, weight: '500ml' },
      { name: 'Limonadă de casă', name_ru: 'Домашний лимонад', desc: 'Limonadă proaspătă', desc_ru: 'Свежий лимонад', price: 55, weight: '300ml' },
      { name: 'Vin roșu de casă', name_ru: 'Домашнее красное вино', desc: 'Vin moldovenesc tradițional', desc_ru: 'Традиционное молдавское вино', price: 65, weight: '200ml' },
      { name: 'Vin alb de casă', name_ru: 'Домашнее белое вино', desc: 'Vin moldovenesc tradițional', desc_ru: 'Традиционное молдавское вино', price: 65, weight: '200ml' },
    ]},
  ];

  cats.forEach((cat, ci) => {
    const result = insertCat.run(cat.name, cat.name_ru, ci);
    const catId = result.lastInsertRowid;
    cat.items.forEach((item, ii) => {
      insertItem.run(catId, item.name, item.name_ru, item.desc, item.desc_ru, item.price, item.weight, ii);
    });
  });
}

export default db;
