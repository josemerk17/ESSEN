# ESSEN — The Art of Fragrance

Sitio estático responsive de demostración para un catálogo de fragancias.

## Ejecutar

Abre la carpeta en VS Code y ejecuta `index.html` con **Live Server**. El catálogo y el carrito leen `assets/data/productos.json` con `fetch()`, por lo que el sitio debe servirse por HTTP local; abrirlo con `file://` bloquea la carga del JSON.

## Funcionalidades

- Catálogo generado desde el JSON y búsqueda por nombre, marca, categoría o descripción, sin distinguir mayúsculas ni acentos.
- Menú y buscador interactivos en portada y ficha de producto.
- Tarjetas con precio, nombre y botón de compra. Los enlaces de detalle están separados de los botones para evitar controles interactivos anidados.
- Botón de Bleu de Chanel conectado al carrito mediante su ID de producto.
- Carrito con contador, cantidades, eliminación individual, vaciado con confirmación SweetAlert2 y persistencia en `localStorage`.
- Control de stock de demostración definido por producto en `stock`; limita cantidades y descuenta existencias al confirmar una compra.
- Compra simulada con resumen y validación de nombre, correo, teléfono de 10 dígitos, dirección, ciudad y código postal de 5 dígitos. No procesa pagos ni envía pedidos a un servidor. Los datos personales del formulario no se guardan.
- SweetAlert2 se carga desde jsDelivr y necesita conexión a internet para mostrar alertas.

## Archivos

- `assets/data/productos.json`: nombre, categoría, precio, imagen y stock de cada producto.
- `assets/js/main.js`: menú, carga del catálogo y búsqueda.
- `assets/js/cart.js`: carrito, almacenamiento local y stock.
- `assets/js/checkout.js`: validación y proceso de compra simulado.
- `assets/css/styles.css`: diseño e interacciones responsive.

Para añadir una fragancia, agrega un objeto con `id`, `nombre`, `marca`, `categoria`, `descripcion`, `precio`, `stock`, `imagen` y `url`. Para reiniciar el ejemplo, borra las claves `essen-cart`, `essen-sold-stock` y `essen-last-order` en el almacenamiento local del navegador.
