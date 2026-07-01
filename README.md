# EasyNews 📰

Portada con las **últimas noticias en español** de medios de todo el mundo.
Un scraper recorre los feeds RSS de una lista de medios, genera un archivo
estático (`data/news.json`) y una SPA lo muestra en una grilla de tarjetas en
las que puedes hacer clic para leer la nota en su sitio original.

- **Sin servidor**: la app es HTML/CSS/JS puro, ideal para **GitHub Pages**.
- **Se actualiza sola**: un GitHub Action programado corre el scraper cada hora
  y vuelve a publicar los datos.
- **Filtros** por país y **búsqueda** por titular/medio.

## Estructura

```
easynews/
├── index.html                     SPA (grilla de noticias)
├── css/style.css
├── js/app.js
├── data/news.json                 datos generados por el scraper
├── scraper/
│   ├── sources.mjs                lista de medios + feeds RSS
│   ├── scrape.mjs                 el scraper
│   └── package.json
└── .github/workflows/update-news.yml
```

## Uso local

Genera los datos y levanta un servidor estático:

```bash
# 1. Generar data/news.json
cd scraper
npm install
node scrape.mjs
cd ..

# 2. Servir la SPA (elige uno)
python3 -m http.server 8000
# o:  npx serve .
```

Abre <http://localhost:8000>. (Ábrelo por HTTP, no con `file://`, para que
`fetch` pueda cargar el JSON.)

## Desplegar en GitHub Pages

1. Sube el repo a GitHub.
2. **Settings → Pages → Build and deployment → Source: _Deploy from a branch_**,
   rama `main`, carpeta `/ (root)`. Guarda.
3. **Settings → Actions → General → Workflow permissions**: marca
   **Read and write permissions** (para que el Action pueda commitear el JSON).
4. Ve a la pestaña **Actions**, abre _"Actualizar noticias"_ y pulsa
   **Run workflow** para la primera corrida (luego se ejecuta solo cada hora).

Tu sitio quedará en `https://<usuario>.github.io/<repo>/`.

## Agregar o quitar medios

Edita [`scraper/sources.mjs`](scraper/sources.mjs) y añade un objeto:

```js
{ id: 'nuevo',  name: 'Nuevo Medio',  country: 'MX',  countryLabel: 'México',
  url: 'https://ejemplo.com/rss' }
```

El scraper es tolerante a fallos: si un feed no responde, se omite en esa
corrida (aparece una `✗` en el log) y el resto de medios sigue funcionando.

## Medios incluidos

España (El País, El Mundo, La Vanguardia, 20minutos, ABC, RTVE) · Internacional
(BBC Mundo, DW, France 24, Euronews) · Argentina (Infobae, Clarín, La Nación) ·
México (La Jornada, Expansión) · Chile (La Tercera) · Colombia (El Tiempo) ·
Perú (El Comercio) · Venezuela (El Nacional).

> El contenido pertenece a cada medio. EasyNews solo agrega titulares vía RSS y
> enlaza a la nota original.
