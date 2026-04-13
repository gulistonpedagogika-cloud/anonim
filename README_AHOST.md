# Ahost (cPanel) Deployment Guide

Ushbu loyihani Ahost hostingiga (cPanel) muvaffaqiyatli o'tkazish uchun quyidagi bosqichlarni bajaring:

## 1. Loyihani tayyorlash (Build)
AI Studio terminalida quyidagi buyruqni bering:
```bash
npm run build
```
Bu buyruq `dist` papkasini yaratadi. Ushbu papka ichida barcha tayyor frontend fayllari bo'ladi.

## 2. Fayllarni yuklash
Hostingizdagi fayl menejeri (File Manager) orqali quyidagi fayl va papkalarni yuklang:
- `dist/` (papka to'lig'icha)
- `server.ts` (yoki uni `app.js` deb nomlashingiz mumkin)
- `package.json`
- `.env` (sozlamalar bilan)

## 3. Node.js ilovasini sozlash (cPanel)
1. cPanel panelida **"Setup Node.js App"** bo'limiga kiring.
2. **"Create Application"** tugmasini bosing.
3. Sozlamalarni quyidagicha kiriting:
   - **Node.js version**: 18 yoki undan yuqori.
   - **Application mode**: Production.
   - **Application root**: Fayllar yuklangan papka (masalan: `public_html/survey`).
   - **Application URL**: Saytingiz manzili.
   - **Application startup file**: `server.ts` (yoki `app.js`).
4. **"Create"** tugmasini bosing.

## 4. Ma'lumotlar bazasini sozlash
1. cPanel'da MySQL ma'lumotlar bazasini yarating.
2. `.env` faylida quyidagi o'zgaruvchilarni to'g'ri kiriting:
   ```env
   DB_HOST=localhost
   DB_USER=sizning_useringiz
   DB_PASS=sizning_parolingiz
   DB_NAME=sizning_bazangiz
   NODE_ENV=production
   ```

## 5. Kutubxonalarni o'rnatish
Node.js sozlamalari sahifasida **"Run NPM Install"** tugmasini bosing. Bu barcha kerakli kutubxonalarni serverga o'rnatadi.

## 6. Ilovani ishga tushirish
**"Restart"** tugmasini bosing. Endi saytingiz Ahost'da ishlashi kerak.

---
**Eslatma:** Agar sizda `server.ts` faylini to'g'ridan-to'g'ri ishlatishda muammo bo'lsa, uni `app.js` deb nomlab, `import` o'rniga `require` ishlatishingiz yoki `package.json`da `"type": "module"` borligiga ishonch hosil qilishingiz kerak.
