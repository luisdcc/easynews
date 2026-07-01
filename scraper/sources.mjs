// Lista curada de medios en español con feeds RSS verificados.
//
// Para AGREGAR un medio: añade un objeto { id, name, country, countryLabel, url }.
//   - id:           identificador único, en minúsculas y sin espacios.
//   - name:         nombre visible del medio.
//   - country:      código corto (se usa para los filtros). Usa "INT" para internacionales.
//   - countryLabel: nombre del país/región que se muestra en el filtro.
//   - url:          URL del feed RSS/Atom.
//
// El scraper es tolerante a fallos: si un feed no responde, simplemente se omite
// en esa corrida (verás una ✗ en el log) y el resto de medios sigue funcionando.

export const sources = [
  // España
  { id: 'elpais',       name: 'El País',            country: 'ES',  countryLabel: 'España',        url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada' },
  { id: 'elmundo',      name: 'El Mundo',           country: 'ES',  countryLabel: 'España',        url: 'https://e00-elmundo.uecdn.es/elmundo/rss/portada.xml' },
  { id: 'lavanguardia', name: 'La Vanguardia',      country: 'ES',  countryLabel: 'España',        url: 'https://www.lavanguardia.com/rss/home.xml' },
  { id: '20minutos',    name: '20minutos',          country: 'ES',  countryLabel: 'España',        url: 'https://www.20minutos.es/rss/' },
  { id: 'abc',          name: 'ABC',                country: 'ES',  countryLabel: 'España',        url: 'https://www.abc.es/rss/2.0/portada/' },
  { id: 'rtve',         name: 'RTVE',               country: 'ES',  countryLabel: 'España',        url: 'https://api2.rtve.es/rss/temas_noticias.xml' },

  // Internacional (medios globales en español)
  { id: 'bbcmundo',     name: 'BBC Mundo',          country: 'INT', countryLabel: 'Internacional', url: 'https://feeds.bbci.co.uk/mundo/rss.xml' },
  { id: 'dw',           name: 'DW Español',         country: 'INT', countryLabel: 'Internacional', url: 'https://rss.dw.com/rdf/rss-sp-all' },
  { id: 'france24',     name: 'France 24 Español',  country: 'INT', countryLabel: 'Internacional', url: 'https://www.france24.com/es/rss' },
  { id: 'euronews',     name: 'Euronews Español',   country: 'INT', countryLabel: 'Internacional', url: 'https://es.euronews.com/rss' },

  // Argentina
  { id: 'infobae',      name: 'Infobae',            country: 'AR',  countryLabel: 'Argentina',     url: 'https://www.infobae.com/arc/outboundfeeds/rss/?outputType=xml' },
  { id: 'clarin',       name: 'Clarín',             country: 'AR',  countryLabel: 'Argentina',     url: 'https://www.clarin.com/rss/lo-ultimo/' },
  { id: 'lanacion',     name: 'La Nación',          country: 'AR',  countryLabel: 'Argentina',     url: 'https://www.lanacion.com.ar/arc/outboundfeeds/rss/?outputType=xml' },

  // México
  { id: 'lajornada',    name: 'La Jornada',         country: 'MX',  countryLabel: 'México',        url: 'https://www.jornada.com.mx/rss/edicion.xml' },
  { id: 'expansion',    name: 'Expansión',          country: 'MX',  countryLabel: 'México',        url: 'https://expansion.mx/rss' },

  // Chile
  { id: 'latercera',    name: 'La Tercera',         country: 'CL',  countryLabel: 'Chile',         url: 'https://www.latercera.com/arcio/rss/' },

  // Colombia
  { id: 'eltiempo',     name: 'El Tiempo',          country: 'CO',  countryLabel: 'Colombia',      url: 'https://www.eltiempo.com/rss/colombia.xml' },

  // Perú
  { id: 'elcomercio',   name: 'El Comercio',        country: 'PE',  countryLabel: 'Perú',          url: 'https://elcomercio.pe/arc/outboundfeeds/rss/?outputType=xml' },

  // Venezuela
  { id: 'elnacional',   name: 'El Nacional',        country: 'VE',  countryLabel: 'Venezuela',     url: 'https://www.elnacional.com/feed/' },
];
