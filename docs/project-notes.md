# Proje notları

Bu proje Express ile öğrenci CRUD işlemleri, kullanıcı kaydı/girişi, oturum yenileme ve e-posta ile parola sıfırlama sunar. Kalıcı veriler Mongoose üzerinden MongoDB'ye yazılır. Açıklamalar mevcut koddan ve ayarlardan çıkarılmıştır; burada ortam değişkenlerinin gerçek değerleri bulunmaz.

## 1. Klasör ve dosya düzeni

```text
src/
  index.js                     Başlatma: veritabanını bekle, sunucuyu aç
  server.js                    Express, ortak middleware ve HTTP dinleme
  constants/index.js           Roller, süreler, sıralama ve SMTP anahtarları
  db/
    initMongoDB.js             MongoDB bağlantısı
    models/user.js            Kullanıcı, parola hash'i, rol ve JSON dönüşümü
    models/session.js         Kullanıcıya bağlı tokenlar ve geçerlilik süreleri
    models/student.js         Öğrenci alanları ve parentId ilişkisi
  routers/
    index.js                  /students ve /auth yönlendirmeleri
    auth.js                   Kayıt, giriş, çıkış, yenileme ve parola sıfırlama
    student.js                Öğrenci rotaları ve middleware sırası
  controllers/
    auth.js                   Auth isteklerini service'e aktarır, cookie/JSON yazar
    student.js                Öğrenci isteklerini ayrıştırır, HTTP yanıtı üretir
  services/
    auth.js                   Hash, oturum, JWT ve sıfırlama e-postası işlemleri
    students.js               Öğrenci sorguları, filtre, sıralama ve sayfalama
  middlewares/
    authenticate.js           Bearer token, süre ve kullanıcı kontrolü
    checkRoles.js             Rol ve veli-öğrenci ilişkisi kontrolü
    isValidId.js              URL'deki studentId biçimi kontrolü
    validateBody.js           Joi ile istek gövdesi kontrolü
    notFoundHandler.js        Eşleşmeyen rotaya 404
    errorHandler.js           Merkezi hata yanıtı
  validation/
    auth.js                   Auth gövde şemaları
    student.js                Oluşturma/PUT ve PATCH gövde şemaları
  utils/
    env.js                    Ortam değişkeni, varsayılan değer ve eksik ayar kontrolü
    ctrlWrapper.js            Controller hatalarını next(err) ile aktarır
    parsePaginationParams.js  Sayfa ve sayfa boyutunu ayrıştırır
    parseSortParams.js        Sıralama alanını ve yönünü sınırlar
    parseFilterParams.js      Yaş, not ve cinsiyet filtrelerini ayrıştırır
    calculatePaginationData.js Toplam sayfa ve gezinme bilgilerini hesaplar
    sendMail.js               Nodemailer SMTP taşıyıcısı ve gönderim
  templates/reset-password-email.html  Handlebars e-posta şablonu
client/
  index.html                  Tarayıcıdaki CORS deneme sayfası
  app.js                      Örnek fetch isteği
docs/project-notes.md          Bu açıklamalar
```

Kökte `package.json` paket ve komut tanımlarını, `package-lock.json` çözümlenmiş bağımlılık ağacını tutar. `node_modules/` kurulmuş paketlerdir. `.env` yerel ayarları ve gizli bilgileri, `.env.example` örnek ortam dosyasını barındırır. `.gitignore`, `.env` ve `node_modules/` yollarını dışlar. `eslint.config.js` kod kontrolünü, `.prettierrc` biçimlendirmeyi, `.editorconfig` UTF-8/LF ve iki boşluk girintisi gibi editör tercihlerini tanımlar. `readme.md` inceleme sırasında boştur.

`client/app.js` şu anda `POST /user` isteği gönderir; sunucuda bu rota tanımlı değildir. Express bu istemci klasörünü statik olarak sunmaz. Bu dosyalar güncel auth/öğrenci akışının tamamını uygulayan bir arayüz değildir.

## 2. package.json alanları

| Alan | Bu projedeki anlamı |
| --- | --- |
| `name` | npm paket/proje adı: `node-express-practice`. |
| `version` | Projenin sürümü: `1.0.0`. Node sürümünü belirtmez. |
| `description` | Projenin kısa açıklaması. |
| `keywords` | Paketi sınıflandıran arama etiketleri. |
| `license` | Beyan edilen lisans: ISC. |
| `author` | Paket yazarının metaverisi. Uygulama kimlik doğrulamasıyla ilgili değildir. |
| `type` | `module`: `.js` dosyalarında ES module `import`/`export` kullanılır. |
| `main` | Paket giriş alanı `index.js` olarak tanımlıdır; kökte böyle bir dosya yoktur. Uygulamayı script'ler `src/index.js` ile başlatır. |
| `scripts` | `npm run ...` ile çalıştırılacak komutlar. |
| `dependencies` | Uygulamanın çalışma sırasında kullandığı paketler. |
| `devDependencies` | Geliştirme/kontrol araçları; bu projede pino-pretty sunucu tarafından da kullanılır. |

Sürüm ifadelerindeki `^`, belirtilen temel sürümden başlayan uyumlu güncellemelere izin verir; kurulumda çözümlenen sürümler kilit dosyasında tutulur.

## 3. npm script'leri

| Script | Komut | Görevi |
| --- | --- | --- |
| `dev` | `nodemon src/index.js` | Uygulamayı başlatır; izlenen dosyalar değiştiğinde yeniden başlatır. |
| `start` | `node src/index.js` | Uygulamayı bir kez başlatır; otomatik yeniden yükleme yapmaz. |
| `lint` | `eslint` | ESLint yapılandırmasıyla kodu denetler; `--fix` olmadığı için düzeltme yazmaz. |
| `format` | `prettier . --write` | Projedeki desteklenen dosyaların biçimini diske yazar; yalnızca kontrol komutu değildir. |

Test script'i tanımlı değildir. Bu belgeleme çalışmasında geniş biçim değişiklikleri yaratmamak için `format` çalıştırılmadı. PowerShell `npm.ps1` çalıştırmayı engellediği için lint aynı npm komutunun `npm.cmd run lint` biçimiyle çalıştırıldı.

## 4. Paketlerin kodda doğrulanan görevleri

### dependencies

| Paket | Kullanıldığı yer | Görevi ve gerekliliği |
| --- | --- | --- |
| `bcrypt` | `services/auth.js` | Kayıt/sıfırlamada parolayı hash'ler; girişte `compare` ile doğrular. Düz parolanın saklanmasını önler. |
| `cookie-parser` | `server.js` | Cookie başlığını `req.cookies` haline getirir; auth controller çıkış/yenilemede okur. |
| `cors` | `server.js` | Yapılandırılmış istemci origin'i için CORS yanıt başlıklarını üretir. Kimlik doğrulama yerine geçmez. |
| `dotenv` | `utils/env.js` | `.env` ayarlarını `process.env` içine yükler. |
| `express` | `server.js`, `routers/*.js` | HTTP sunucusu, Router, middleware zinciri, JSON gövde okuma ve yanıt API'sini sağlar. |
| `handlebars` | `services/auth.js`, e-posta şablonu | HTML şablonundaki `name` ve `link` yerlerini doldurur. |
| `http-errors` | Service, controller ve middleware dosyaları | Durum kodlu hatalar üretir; `errorHandler` bunları `HttpError` ile ayırt eder. |
| `joi` | `validation/*.js`, `middlewares/validateBody.js` | Gövde alanlarının türünü, zorunluluğunu ve sınırlarını kontrol eder. |
| `jsonwebtoken` | `services/auth.js` | Sadece parola sıfırlama JWT'sini imzalar ve doğrular; oturum access/refresh tokenlarını üretmez. |
| `mongoose` | `db/`, `middlewares/isValidId.js` | MongoDB bağlantısı, şemalar, modeller, CRUD sorguları ve ObjectId biçim kontrolü sağlar. |
| `nodemailer` | `utils/sendMail.js` | SMTP üzerinden sıfırlama e-postasını gönderir. |
| `pino-http` | `server.js` | HTTP istek/yanıt günlüklerini üretir; hassas başlıklar `redact` ile gizlenir. |

### devDependencies

| Paket | Kullanıldığı yer | Görevi ve gerekliliği |
| --- | --- | --- |
| `@eslint/js` | `eslint.config.js` | `js/recommended` temel JavaScript lint kurallarını sağlar. |
| `eslint` | `lint` script'i ve `eslint.config.js` | Kuralları çalıştırır; yapılandırmada `defineConfig` sağlar. |
| `globals` | `eslint.config.js` | `globals.node` ile Node ortamının yerleşik isimlerini ESLint'e tanıtır. |
| `nodemon` | `dev` script'i | Geliştirmede dosya değişince Node sürecini yeniden başlatır. |
| `pino-pretty` | `server.js` içindeki `transport.target` | Pino günlüklerini okunabilir biçime çevirir. Sunucuda koşulsuz seçildiğinden devDependencies kurulmadan başlatma bu paketi bulamayabilir. |
| `prettier` | `format` script'i, `.prettierrc` | Kod biçimlendirmesini otomatik uygular. |

`node:crypto`, `node:path` ve `node:fs/promises` Node'un yerleşik modülleridir; ayrı npm bağımlılığı değillerdir. Sırasıyla rastgele token üretimi, şablon yolu oluşturma ve şablon okuma için kullanılırlar.

## 5. Başlatma ve middleware sırası

`src/index.js → initMongoDB() → startServer()`

Modüller yüklenirken `env.js` dotenv'i, `sendMail.js` SMTP taşıyıcısını hazırlar. Bu nedenle eksik SMTP ayarları daha istek gelmeden hata oluşturabilir. `bootstrap` MongoDB bağlantısını bekler; bağlantı başarısızsa sunucuyu başlatmaz.

`server.js` içindeki sıra:

1. `pinoHttp`: istek/yanıt günlüğü; cookie, Authorization ve Set-Cookie başlıklarını gizler.
2. `cors`: tanımlı origin için CORS başlıkları.
3. `express.json`: JSON gövdesini `req.body` içine alır.
4. `cookieParser`: cookie'leri `req.cookies` içine alır.
5. `GET /`: API durum mesajı; diğer istekler ana router'a ilerler.
6. Ana router: `/students` ve `/auth` alt router'ları.
7. `notFoundHandler`: yanıtlanmamış normal isteğe 404.
8. `errorHandler`: `next(err)` ile gelen veya Express'in yakaladığı hataya HTTP yanıtı.

`next()` sonraki middleware'e geçer; `next(err)` normal zinciri atlayıp hata işleyicisine gider. `ctrlWrapper` controller'ın attığı/reddettiği hatayı yakalar; veri doğrulama görevi yoktur. Express 5 async middleware'den reddedilen Promise'ları da hata zincirine aktarır.

## 6. Önemli istek akışları

### Öğrenci işlemleri

`server → routers/index → routers/student → authenticate → checkRoles → varsa isValidId → varsa validateBody → ctrlWrapper(controller) → services/students → db/models/student → controller JSON`

| Yöntem ve yol | authenticate sonrası sıra | Başarılı sonuç |
| --- | --- | --- |
| `GET /students` | Öğretmen rolü → liste controller'ı | Filtreli/sıralı/sayfalı liste, 200 |
| `GET /students/:studentId` | Öğretmen veya ilgili veli → ID kontrolü → controller | Tek öğrenci, 200 |
| `POST /students` | Öğretmen → oluşturma şeması → controller | Yeni öğrenci, 201 |
| `DELETE /students/:studentId` | Öğretmen → ID kontrolü → controller | Gövdesiz 204 |
| `PUT /students/:studentId` | Öğretmen → ID → oluşturma şeması → controller | Upsert: yeni kayıt 201, güncelleme 200 |
| `PATCH /students/:studentId` | Öğretmen veya ilgili veli → ID → güncelleme şeması → controller | Güncel öğrenci, 200 |

Liste controller'ı query'yi `parsePaginationParams`, `parseSortParams` ve `parseFilterParams` ile ayrıştırır. Service aynı filtrelerle toplam kayıt sayısını ve sayfa verisini `Promise.all` ile alır; `calculatePaginationData` gezinme bilgisini ekler. Geçersiz filtreler atlanır, geçersiz sayfa/sıralama parametrelerinde varsayılanlar kullanılır.

### Kayıt, giriş ve oturum

`POST /auth/register → validateBody(registerUserSchema) → registerUserController → registerUser → UsersCollection`

Service e-posta tekrarını kontrol eder, `bcrypt.hash(password, 10)` ile hash saklar. Modelin `toJSON` metodu parola alanını HTTP yanıtından çıkarır. Kayıt şeması rol kabul etmez; model varsayılan olarak veli rolü verir.

`POST /auth/login → validateBody(loginUserSchema) → loginUserController → loginUser → UsersCollection + SessionsCollection → setupSession`

`bcrypt.compare` doğrulamadan sonra eşleşen bir eski oturum silinir ve yeni oturum oluşturulur. Access token JSON'da, refresh token ve session ID cookie'de döner. Access token 15 dakika, refresh token bir gün geçerlidir. Bunlar `randomBytes` ile oluşturulan rastgele değerlerdir; JWT değildir. `authenticate` Bearer tokenı veritabanında arar ve süresini kontrol eder; kullanıcıyı `req.user` içine koyar.

`POST /auth/refresh → refreshUserSessionController → refreshUserSession → eski oturumu sil/yeni oturumu oluştur → yeni cookie + access token`

Yenilemede session ID ve refresh token birlikte eşleşmeli ve süre dolmamış olmalıdır. `POST /auth/logout` cookie'deki ID ile oturumu siler, cookie'leri temizler ve 204 döndürür. Auth router'ında genel `authenticate` middleware'i yoktur.

### E-posta ile parola sıfırlama

`POST /auth/request-reset-email → validateBody → requestResetEmailController → requestResetToken → UsersCollection → jwt.sign → HTML şablonu + Handlebars → sendEmail → SMTP`

JWT, kullanıcı ID'si (`sub`) ve e-posta içerir; `JWT_SECRET` ile imzalanır ve 15 dakika geçerlidir. İmzalı JWT şifrelenmiş veri değildir. `APP_DOMAIN` sıfırlama sayfasının temel adresidir. İncelenen `.env` dosyasında bu anahtar yoktur; dış ortamdan da sağlanmazsa e-posta bağlantısı oluşturulurken `env()` hata verir. Bu çalışma ayar eklemez/değiştirmez. Sunucuda sıfırlama sayfasını sunan bir GET rotası bulunmaz.

`POST /auth/reset-password → validateBody → resetPasswordController → resetPassword → jwt.verify → kullanıcı eşleşmesi → bcrypt.hash → UsersCollection.updateOne`

Body'de token ve yeni parola beklenir. JWT imzası ve süresi doğrulanır; e-posta ve ID aynı kullanıcıyla eşleşirse yeni hash yazılır.

## 7. Mevcut davranışın önemli ayrıntıları

- `checkRoles` içindeki başarılı `next()` çağrılarından sonra `return` yoktur; fonksiyon sondaki `next(403)` çağrısına da ulaşabilir. Yukarıdaki rol açıklamaları kontrol dallarını anlatır; bu mevcut akış kusuru düzeltilmemiştir.
- Rol kontrolü `isValidId` kontrolünden önce çalışır. Veli dalındaki öğrenci sorgusu ID biçim kontrolünden önce yapılabilir.
- `validateBody`, Joi'nin döndürdüğü dönüştürülmüş sonucu `req.body` içine atamaz; controller orijinal body'yi kullanır.
- Cookie'ler `httpOnly` ile istemci JavaScript'inden saklanır; `secure` ve `sameSite` açıkça ayarlanmamıştır. CORS yapılandırmasında `credentials` seçeneği yoktur.
- Oturum tokenları veritabanında açık metin saklanır. Süre alanları tek başına otomatik silme yapmaz; modelde TTL indeksi bulunmaz.
- Parola sıfırlama mevcut oturumları sonlandırmaz ve JWT'yi kullanıldı olarak işaretlemez; token süresi içinde tekrar kullanılabilir.
- `deleteOne` yalnızca bir eşleşen kaydı siler; giriş işlemi kullanıcının tüm oturumlarını temizlediğini garanti etmez.

## 8. Belgeleme doğrulaması

29 JavaScript dosyasının düzenleme öncesi ve sonrası sözdizimi ağaçları, yorum ve konum bilgileri hariç aynı bulundu. `.env` ayrıştırılmış anahtar/değerleri eşit; HTML şablonunda eklenen yorum çıkarılınca önceki içerik aynı. `package.json` değiştirilmedi ve JSON olarak ayrıştırıldı.

Lint düzenleme öncesinde `errorHandler.js` ve `notFoundHandler.js` içindeki kullanılmayan `next` parametreleri için iki `no-unused-vars` hatası bildiriyordu. İşleyişe müdahale etmemek için parametreler ve lint ayarları değiştirilmedi. Canlı MongoDB/SMTP çağrısı, e-posta gönderimi veya oturum değişikliği yapılmadı; davranışın korunması statik karşılaştırmayla doğrulandı.
