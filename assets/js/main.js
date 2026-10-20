// =========================================================
// ESSEN — interacciones del sitio
// =========================================================

(() => {
  // 1. Referencias a elementos del HTML
  const searchToggle = document.querySelector('.search-icon');
  const menuToggle = document.querySelector('.menu-icon');
  const searchPanel = document.querySelector('#site-search');
  const menuPanel = document.querySelector('#site-menu');
  const searchInput = document.querySelector('#search-input');
  const searchFeedback = document.querySelector('.search-feedback');
  const productGrid = document.querySelector('#product-grid');
  const searchResults = document.querySelector('#search-results');

  // La página debe incluir ambos botones y sus paneles para activar el header.
  if (!searchToggle || !menuToggle || !searchPanel || !menuPanel) return;

  // 2. Función compartida para abrir y cerrar paneles
  function setPanelState(button, panel, isOpen) {
    panel.hidden = !isOpen;
    button.setAttribute('aria-expanded', String(isOpen));
  }

  // 3. Botón de búsqueda
  searchToggle.addEventListener('click', () => {
    const shouldOpen = searchPanel.hidden;
    setPanelState(menuToggle, menuPanel, false);
    setPanelState(searchToggle, searchPanel, shouldOpen);

    if (shouldOpen) {
      if (searchInput) searchInput.value = '';
      renderSearchResults('');
      updateSearchFeedback('', products.length);
      searchInput?.focus();
    } else {
      renderSearchResults('');
      updateSearchFeedback('', 0);
    }
  });

  // Cerrar búsqueda desde el botón dentro del panel.
  searchPanel.querySelector('.search-close')?.addEventListener('click', () => {
    setPanelState(searchToggle, searchPanel, false);
    searchToggle.focus();
  });

  // 4. Botón y enlaces del menú
  menuToggle.addEventListener('click', () => {
    const shouldOpen = menuPanel.hidden;
    setPanelState(searchToggle, searchPanel, false);
    setPanelState(menuToggle, menuPanel, shouldOpen);
  });

  menuPanel.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => setPanelState(menuToggle, menuPanel, false));
  });

  // 5. Cargar datos de productos desde el archivo JSON
  let products = [];

  // Normaliza acentos y mayúsculas para que la búsqueda sea más flexible.
  function normalizeText(value) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('es');
  }

  // Crea una tarjeta de producto reutilizable.
  function createProductCard(product) {
    const link = document.createElement('a');
    link.className = 'product-image';
    link.href = product.url;
    link.dataset.search = `${product.nombre} ${product.marca} ${product.categoria}`;

    const image = document.createElement('img');
    image.src = product.imagen;
    image.alt = product.nombre;
    image.loading = 'lazy';

    const name = document.createElement('span');
    name.className = 'product-name';
    name.textContent = product.nombre;

    link.append(image, name);
    return link;
  }

  // 6. Dibujar todas las tarjetas del catálogo principal.
  function renderProductGrid() {
    if (productGrid) productGrid.replaceChildren(...products.map(createProductCard));
  }

  // Filtra las sugerencias dentro del panel del buscador.
  function renderSearchResults(query = '') {
    const searchTerms = normalizeText(query).trim().split(/\s+/).filter(Boolean);
    const matchingProducts = products.filter(product => {
      const productText = normalizeText(
        `${product.nombre} ${product.marca} ${product.categoria} ${product.descripcion}`
      );
      return searchTerms.every(term => productText.includes(term));
    });

    if (searchResults) searchResults.replaceChildren(...matchingProducts.map(createProductCard));
    return matchingProducts.length;
  }

  // Mantiene el estado de las sugerencias y el mensaje bajo el campo.
  function updateSearchFeedback(query, resultCount) {
    if (!searchFeedback) return;
    if (!query) {
      searchFeedback.textContent = products.length ? 'Productos disponibles' : '';
    } else if (resultCount) {
      searchFeedback.textContent = `${resultCount} resultado${resultCount === 1 ? '' : 's'}`;
    } else {
      searchFeedback.textContent = 'No encontramos fragancias con ese nombre.';
    }
  }

  // Solo las páginas con cuadrícula necesitan leer el catálogo.
  if (productGrid) {
    fetch('assets/data/productos.json')
      .then(response => {
        if (!response.ok) throw new Error('No se pudo cargar el catálogo.');
        return response.json();
      })
      .then(data => {
        if (!Array.isArray(data)) throw new Error('El JSON debe contener una lista de productos.');
        products = data;
        renderProductGrid();
        renderSearchResults(searchInput?.value || '');
        if (!searchPanel.hidden) updateSearchFeedback(searchInput?.value.trim() || '', products.length);
      })
      .catch(error => {
        console.error('Error al cargar assets/data/productos.json:', error);

        const message = document.createElement('p');
        message.className = 'catalog-message';
        message.textContent = location.protocol === 'file:'
          ? 'Para ver las fragancias, abre el proyecto con Live Server desde VS Code.'
          : 'No se pudo cargar el catálogo. Revisa assets/data/productos.json e inténtalo de nuevo.';

        productGrid?.replaceChildren(message);
        searchResults?.replaceChildren();
        if (searchFeedback) searchFeedback.textContent = message.textContent;
      });
  }

  // 7. Buscar mientras se escribe y actualizar el mensaje de resultados.
  searchInput?.addEventListener('input', () => {
    const query = searchInput.value.trim();
    const resultCount = renderSearchResults(query);
    updateSearchFeedback(query, resultCount);
  });

  // 8. Cerrar los paneles con Escape o al hacer clic fuera de ellos.
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    setPanelState(searchToggle, searchPanel, false);
    setPanelState(menuToggle, menuPanel, false);
  });

  document.addEventListener('click', event => {
    if (!searchPanel.hidden && !searchPanel.contains(event.target) && !searchToggle.contains(event.target)) {
      setPanelState(searchToggle, searchPanel, false);
    }

    if (!menuPanel.hidden && !menuPanel.contains(event.target) && !menuToggle.contains(event.target)) {
      setPanelState(menuToggle, menuPanel, false);
    }
  });
})();
