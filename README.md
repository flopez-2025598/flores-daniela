# Flores Daniela — Regalo Virtual

Proyecto Angular standalone (Angular 22, con signals) que muestra una experiencia
móvil de "regalo virtual": una escena nocturna con luna, jardín de peonías y
hortensias amarillas, y una caja de regalo que al abrirse revela una carta.

## Estructura

- [angular.json](angular.json), [package.json](package.json), [tsconfig.json](tsconfig.json): configuración del proyecto Angular CLI.
- [src/index.html](src/index.html): plantilla HTML de la app (meta viewport, fuentes, `base href`).
- [src/main.ts](src/main.ts) y [src/app/app.config.ts](src/app/app.config.ts): arranque de la aplicación standalone.
- [src/app/app.ts](src/app/app.ts): componente raíz, solo renderiza `<app-virtual-gift />`.
- [src/app/components/virtual-gift/](src/app/components/virtual-gift/): el componente real de la experiencia
  (`virtual-gift.component.ts`, `.html`, `.scss`). **Este es el único componente que se usa** — cualquier otra
  copia suelta en el repo quedó eliminada para evitar confusiones.
- `index.html`, `main-*.js`, `styles-*.css`, `favicon.ico` en la raíz: **build de producción ya generado**,
  que es lo que sirve GitHub Pages directamente desde la rama `main`. No se edita a mano.

## Cómo editar el mensaje de la carta

Abre [src/app/components/virtual-gift/virtual-gift.component.ts](src/app/components/virtual-gift/virtual-gift.component.ts)
y busca la sección `CONTENIDO DE LA CARTA`:

```ts
readonly recipientName = 'Daniela';
readonly letterTitle = 'Para ti, Daniela';
readonly letterParagraphs: readonly string[] = [
  'Primer párrafo...',
  'Segundo párrafo...',
  'Tercer párrafo...',
];
readonly letterSignature = 'Con mucho cariño, Fares';
```

Edita esos valores (agrega o quita párrafos en el array `letterParagraphs` libremente) y vuelve a compilar
(ver abajo). No hace falta tocar el HTML ni el SCSS para cambiar el texto.

## Desarrollo local

```bash
npm install       # primera vez
npm start         # equivale a: ng serve  → http://localhost:4200
```

## Compilar y publicar en GitHub Pages

El sitio se sirve directamente desde los archivos en la **raíz** del repositorio (no hay Actions ni rama
`gh-pages`), así que después de cualquier cambio hay que regenerar esos archivos:

```bash
rm -rf dist
npx ng build --configuration production --base-href /flores-daniela/
cp dist/flores-daniela/browser/index.html ./index.html
cp dist/flores-daniela/browser/main-*.js ./
cp dist/flores-daniela/browser/styles-*.css ./
cp dist/flores-daniela/browser/favicon.ico ./favicon.ico
```

Borra a mano cualquier `main-*.js` / `styles-*.css` viejo que haya quedado de una build anterior antes de
copiar los nuevos (los nombres cambian porque llevan un hash de contenido), luego revisa `git status` y
comitea todo junto (fuente + build).
