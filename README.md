# ESSEN — The Art of Fragrance

Sitio estático de demostración de una tienda de perfumes, creado con HTML semántico y CSS responsive.

## Estructura del proyecto

- `index.html`: página principal, catálogo, colecciones y suscripción.
- `producto.html`: detalle de Bleu de Chanel EDP y productos relacionados.
- `assets/css/styles.css`: estilos globales, componentes y ajustes responsive.
- `assets/js/main.js`: menú, carga del catálogo y búsqueda de productos.
- `assets/data/productos.json`: catálogo que consume el buscador.

## Cómo abrirlo

Abre la carpeta en VS Code y ejecuta `index.html` con Live Server. El JSON se carga con `fetch`, así que el sitio necesita servirse por HTTP local; abrir el HTML directamente con `file://` puede impedir la carga.

## Notas

Para añadir una fragancia, agrega un objeto a `assets/data/productos.json` con `id`, `nombre`, `marca`, `categoria`, `descripcion`, `precio`, `imagen` y `url`. La búsqueda encuentra coincidencias en nombre, marca, categoría y descripción, sin distinguir mayúsculas ni acentos. Los precios son ilustrativos.
