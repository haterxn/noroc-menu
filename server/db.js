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

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    date TEXT NOT NULL,
    guests INTEGER,
    event_type TEXT,
    hall TEXT,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'new'
  );
`);

// Migrate: add event_type column if missing
try {
  db.prepare("SELECT event_type FROM bookings LIMIT 1").get();
} catch {
  db.exec("ALTER TABLE bookings ADD COLUMN event_type TEXT");
}

// Create default admin if none exists
const adminExists = db.prepare('SELECT COUNT(*) as count FROM admin').get();
if (adminExists.count === 0) {
  const hash = bcrypt.hashSync('noroc2024', 10);
  db.prepare('INSERT INTO admin (username, password) VALUES (?, ?)').run('admin', hash);
}

// Seed Noroc menu if empty
const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get();
if (catCount.count === 0) {
  const insertCat = db.prepare('INSERT INTO categories (name, name_ru, sort_order) VALUES (?, ?, ?)');
  const insertItem = db.prepare('INSERT INTO menu_items (category_id, name, name_ru, description, description_ru, price, weight, image, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');

  const cats = [
    { name: 'Aperitive Reci', name_ru: 'Холодные закуски', items: [
      { name: 'Platou de brânzeturi', name_ru: 'Сырная тарелка', desc: 'Selecție de brânzeturi moldovenești', desc_ru: 'Ассорти молдавских сыров', price: 185, weight: '300g', img: null },
      { name: 'Platou de mezeluri', name_ru: 'Мясная тарелка', desc: 'Mezeluri tradiționale', desc_ru: 'Традиционные мясные деликатесы', price: 195, weight: '350g', img: 'DSCF3769.webp' },
      { name: 'Bruschete cu roșii', name_ru: 'Брускетта с томатами', desc: 'Pâine prăjită cu roșii și busuioc', desc_ru: 'Поджаренный хлеб с томатами и базиликом', price: 95, weight: '200g', img: null },
      { name: 'Rulouri de legume', name_ru: 'Овощные рулеты', desc: 'Vinete, ardei și dovlecei cu umpluturi', desc_ru: 'Баклажаны, перцы и цуккини с начинками', price: 120, weight: '250g', img: 'DSCF3766.webp' },
      { name: 'Ruladă cu spanac și somon', name_ru: 'Рулет со шпинатом и лососем', desc: 'Ruladă verde cu somon afumat și cream cheese', desc_ru: 'Зелёный рулет с копчёным лососем и крем-чизом', price: 165, weight: '200g', img: 'DSCF3781.webp' },
      { name: 'Platou de pește', name_ru: 'Рыбная тарелка', desc: 'Somon afumat, piept de pui, lămâie, măsline', desc_ru: 'Копчёный лосось, куриная грудка, лимон, оливки', price: 195, weight: '300g', img: 'DSCF3771.webp' },
    ]},
    { name: 'Salate', name_ru: 'Салаты', items: [
      { name: 'Salată Caesar', name_ru: 'Салат Цезарь', desc: 'Cu pui la grătar și parmezan', desc_ru: 'С куриной грудкой гриль и пармезаном', price: 145, weight: '250g', img: 'DSCF9541.webp' },
      { name: 'Salată grecească', name_ru: 'Греческий салат', desc: 'Legume proaspete cu brânză feta', desc_ru: 'Свежие овощи с сыром фета', price: 125, weight: '280g', img: 'DSCF9594.webp' },
      { name: 'Salată cu ton', name_ru: 'Салат с тунцом', desc: 'Ton, ouă, legume proaspete', desc_ru: 'Тунец, яйца, свежие овощи', price: 155, weight: '260g', img: null },
      { name: 'Salată caldă cu pui', name_ru: 'Тёплый салат с курицей', desc: 'Pui glazurat, feta, quinoa, semințe de susan', desc_ru: 'Глазированная курица, фета, киноа, кунжут', price: 138, weight: '280g', img: 'DSCF9523.webp' },
      { name: 'Salată cu ciuperci', name_ru: 'Салат с грибами', desc: 'Ciuperci sote, roșii cherry, balsamico', desc_ru: 'Грибы соте, черри, бальзамик', price: 115, weight: '250g', img: 'DSCF9568.webp' },
      { name: 'Salată țărănească', name_ru: 'Деревенский салат', desc: 'Roșii, castraveți, ceapă, smântână', desc_ru: 'Помидоры, огурцы, лук, сметана', price: 85, weight: '300g', img: 'DSCF9582.webp' },
    ]},
    { name: 'Supe', name_ru: 'Супы', items: [
      { name: 'Zeamă de pui', name_ru: 'Зама', desc: 'Supă tradițională moldovenească', desc_ru: 'Традиционный молдавский суп', price: 85, weight: '350ml', img: 'DSCF9496.webp' },
      { name: 'Ciorbă de legume', name_ru: 'Овощной суп', desc: 'Ciorbă din legume proaspete', desc_ru: 'Суп из свежих овощей', price: 75, weight: '350ml', img: 'DSCF9486.webp' },
      { name: 'Borș roșu', name_ru: 'Красный борщ', desc: 'Borș tradițional cu smântână', desc_ru: 'Традиционный борщ со сметаной', price: 80, weight: '350ml', img: 'DSCF9501.webp' },
    ]},
    { name: 'Feluri principale', name_ru: 'Основные блюда', items: [
      { name: 'Steak de vită', name_ru: 'Стейк из говядины', desc: 'Fript la perfecție cu cartofi copți și rucola', desc_ru: 'Идеально прожаренный с печёным картофелем и руколой', price: 285, weight: '300g', img: 'DSCF3845.webp' },
      { name: 'Piept de rață', name_ru: 'Утиная грудка', desc: 'Cu sos de portocale', desc_ru: 'С апельсиновым соусом', price: 265, weight: '280g', img: null },
      { name: 'Somon la grătar', name_ru: 'Лосось на гриле', desc: 'Cu legume și sos de lămâie', desc_ru: 'С овощами и лимонным соусом', price: 245, weight: '250g', img: null },
      { name: 'Cordon Bleu', name_ru: 'Кордон Блю', desc: 'Cotlet de porc umplut cu șuncă și cașcaval', desc_ru: 'Свиная отбивная с ветчиной и сыром', price: 175, weight: '300g', img: 'DSCF3885.webp' },
      { name: 'Spaghete Bolognese', name_ru: 'Спагетти Болоньезе', desc: 'Paste cu sos de carne și parmezan', desc_ru: 'Паста с мясным соусом и пармезаном', price: 105, weight: '350g', img: 'DSCF3850.webp' },
    ]},
    { name: 'Bucătăria Moldovenească', name_ru: 'Молдавская кухня', items: [
      { name: 'Sarmale', name_ru: 'Сарамале', desc: 'Sarmale tradiționale cu smântână', desc_ru: 'Традиционные голубцы со сметаной', price: 95, weight: '300g', img: 'DSCF3811.webp' },
      { name: 'Mămăligă cu carne', name_ru: 'Мамалыга с мясом', desc: 'Mămăligă cu carne de pui, smântână și brânză', desc_ru: 'Мамалыга с курицей, сметаной и брынзой', price: 110, weight: '400g', img: 'DSCF3869.webp' },
      { name: 'Varză cu carne', name_ru: 'Капуста с мясом', desc: 'Varză călită cu carne și bile de mămăligă', desc_ru: 'Тушёная капуста с мясом и шариками из мамалыги', price: 95, weight: '350g', img: 'DSCF3877.webp' },
      { name: 'Vinete coapte', name_ru: 'Печёные баклажаны', desc: 'Cu nuci, roșii și brânză', desc_ru: 'С орехами, помидорами и сыром', price: 78, weight: '250g', img: 'DSCF3775.webp' },
    ]},
    { name: 'Grătar', name_ru: 'Гриль', items: [
      { name: 'Platou la grătar', name_ru: 'Плато гриль', desc: 'Mici, coaste, frigărui, legume, cartofi', desc_ru: 'Мичи, рёбрышки, шашлык, овощи, картофель', price: 350, weight: '1000g', img: 'DSCF3831.webp' },
      { name: 'Frigărui de pui', name_ru: 'Куриный шашлык', desc: 'Marinate în condimente speciale', desc_ru: 'Маринованный в специальных специях', price: 145, weight: '250g', img: null },
      { name: 'Mici', name_ru: 'Мичи', desc: 'Mici tradiționale la grătar', desc_ru: 'Традиционные мичи на гриле', price: 125, weight: '300g', img: null },
      { name: 'Coaste de porc', name_ru: 'Свиные рёбрышки', desc: 'Glazurate cu miere', desc_ru: 'Глазированные мёдом', price: 195, weight: '400g', img: null },
    ]},
    { name: 'Garnituri', name_ru: 'Гарниры', items: [
      { name: 'Cartofi prăjiți', name_ru: 'Картофель фри', desc: 'Cartofi crocanti', desc_ru: 'Хрустящий картофель', price: 55, weight: '200g', img: null },
      { name: 'Orez cu legume', name_ru: 'Рис с овощами', desc: 'Orez parfumat cu legume', desc_ru: 'Ароматный рис с овощами', price: 65, weight: '200g', img: null },
      { name: 'Legume la grătar', name_ru: 'Овощи гриль', desc: 'Mix de legume de sezon cu brânză', desc_ru: 'Микс из сезонных овощей с сыром', price: 75, weight: '250g', img: 'DSCF3892.webp' },
    ]},
    { name: 'Deserturi', name_ru: 'Десерты', items: [
      { name: 'Napoleon', name_ru: 'Наполеон', desc: 'Foi fragede cu cremă de vanilie', desc_ru: 'Хрустящие слои с ванильным кремом', price: 85, weight: '150g', img: 'DSCF9613.webp' },
      { name: 'Fondant de ciocolată', name_ru: 'Шоколадный фондан', desc: 'Cu înghețată de vanilie', desc_ru: 'С ванильным мороженым', price: 95, weight: '180g', img: 'DSCF9605.webp' },
      { name: 'Papanași', name_ru: 'Папанаши', desc: 'Gogoși prăjite cu gem și smântână', desc_ru: 'Жареные пончики с джемом и сметаной', price: 80, weight: '200g', img: 'DSCF9618.webp' },
      { name: 'Cheesecake', name_ru: 'Чизкейк', desc: 'Cheesecake cu bază de brownie', desc_ru: 'Чизкейк на основе брауни', price: 90, weight: '180g', img: 'DSCF9627.webp' },
      { name: 'Ruladă cu vișine', name_ru: 'Рулет с вишней', desc: 'Tort piramidal cu vișine și ciocolată', desc_ru: 'Пирамидальный торт с вишней и шоколадом', price: 88, weight: '150g', img: 'DSCF9602.webp' },
      { name: 'Panna Cotta', name_ru: 'Панна Котта', desc: 'Cu sos de fructe de pădure', desc_ru: 'С соусом из лесных ягод', price: 90, weight: '150g', img: null },
    ]},
    { name: 'Băuturi', name_ru: 'Напитки', items: [
      { name: 'Apă minerală', name_ru: 'Минеральная вода', desc: 'Naturală sau carbogazoasă', desc_ru: 'Негазированная или газированная', price: 35, weight: '500ml', img: null },
      { name: 'Limonadă de casă', name_ru: 'Домашний лимонад', desc: 'Limonadă proaspătă', desc_ru: 'Свежий лимонад', price: 55, weight: '300ml', img: null },
      { name: 'Vin roșu de casă', name_ru: 'Домашнее красное вино', desc: 'Vin moldovenesc tradițional', desc_ru: 'Традиционное молдавское вино', price: 65, weight: '200ml', img: null },
      { name: 'Vin alb de casă', name_ru: 'Домашнее белое вино', desc: 'Vin moldovenesc tradițional', desc_ru: 'Традиционное молдавское вино', price: 65, weight: '200ml', img: null },
    ]},
  ];

  cats.forEach((cat, ci) => {
    const result = insertCat.run(cat.name, cat.name_ru, ci);
    const catId = result.lastInsertRowid;
    cat.items.forEach((item, ii) => {
      insertItem.run(catId, item.name, item.name_ru, item.desc, item.desc_ru, item.price, item.weight, item.img, ii);
    });
  });
}

export default db;
