const hero = document.querySelector(".hero");

if (hero) {
  const slides = Array.from(hero.querySelectorAll(".hero__slide"));
  const indicators = Array.from(hero.querySelectorAll(".hero__indicator"));
  const currentCounter = hero.querySelector(".hero__counter-current");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const intervalDuration = 9000;
  let activeIndex = 0;
  let intervalId;

  const showSlide = (index) => {
    activeIndex = (index + slides.length) % slides.length;

    slides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === activeIndex;
      slide.classList.toggle("hero__slide--active", isActive);
      slide.setAttribute("aria-hidden", String(!isActive));
      indicators[slideIndex].classList.toggle(
        "hero__indicator--active",
        isActive,
      );

      if (isActive) {
        indicators[slideIndex].setAttribute("aria-current", "true");
      } else {
        indicators[slideIndex].removeAttribute("aria-current");
      }
    });

    currentCounter.textContent = String(activeIndex + 1).padStart(2, "0");
  };

  const stopAutoplay = () => {
    window.clearInterval(intervalId);
    intervalId = undefined;
  };

  const startAutoplay = () => {
    stopAutoplay();

    if (
      !reducedMotion.matches &&
      !document.hidden &&
      !hero.matches(":hover") &&
      !hero.contains(document.activeElement)
    ) {
      intervalId = window.setInterval(
        () => showSlide(activeIndex + 1),
        intervalDuration,
      );
    }
  };

  hero
    .querySelectorAll("[data-carousel-direction]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        showSlide(activeIndex + Number(button.dataset.carouselDirection));
        startAutoplay();
      });
    });

  indicators.forEach((indicator, index) => {
    indicator.addEventListener("click", () => {
      showSlide(index);
      startAutoplay();
    });
  });

  hero.addEventListener("mouseenter", stopAutoplay);
  hero.addEventListener("mouseleave", startAutoplay);
  hero.addEventListener("focusin", stopAutoplay);
  hero.addEventListener("focusout", (event) => {
    if (!hero.contains(event.relatedTarget) && !hero.matches(":hover")) {
      startAutoplay();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopAutoplay();
    } else {
      startAutoplay();
    }
  });

  reducedMotion.addEventListener("change", startAutoplay);
  startAutoplay();
}

const vehicleCards = Array.from(document.querySelectorAll(".vehicle-card"));
const vehicleModal = document.querySelector(".vehicle-modal");

if (vehicleModal instanceof HTMLDialogElement) {
  const modalImage = vehicleModal.querySelector("[data-modal-image]");
  const modalBrand = vehicleModal.querySelector("[data-modal-brand]");
  const modalTitle = vehicleModal.querySelector("#vehicle-modal-title");
  const modalPrice = vehicleModal.querySelector("[data-modal-price]");
  const closeButton = vehicleModal.querySelector("[data-modal-close]");

  const openVehicleDetails = (card) => {
    const image = card.querySelector(".vehicle-card__image");
    const brand = card.querySelector(".vehicle-card__brand");
    const model = card.querySelector(".vehicle-card__model");
    const price = card.querySelector(".vehicle-card__price strong");

    if (!image || !brand || !model || !price) {
      return;
    }

    modalImage.src = image.src;
    modalImage.alt = image.alt;
    modalBrand.textContent = brand.textContent;
    modalTitle.textContent = model.textContent;
    modalPrice.textContent = price.textContent;
    vehicleModal.showModal();
    closeButton.focus();
  };

  vehicleCards.forEach((card) => {
    card.addEventListener("click", () => openVehicleDetails(card));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openVehicleDetails(card);
      }
    });
  });

  closeButton.addEventListener("click", () => vehicleModal.close());
  vehicleModal.addEventListener("click", (event) => {
    if (event.target === vehicleModal) {
      vehicleModal.close();
    }
  });
}

const filterForm = document.querySelector("[data-catalog-filters]");

if (filterForm instanceof HTMLFormElement) {
  const filterFields = Array.from(
    filterForm.querySelectorAll("select[data-filter]"),
  );
  const filters = new Map(
    filterFields.map((field) => [field.dataset.filter, field]),
  );
  const emptyMessage = document.querySelector("[data-catalog-empty]");
  const defaultLabels = {
    brand: "Todas las marcas",
    model: "Todos los modelos",
    year: "Todos los años",
    condition: "Todas las condiciones",
    type: "Todos los tipos",
  };

  const getCardValue = (card, filterName) => {
    if (filterName === "brand" || filterName === "model") {
      const selector = filterName === "brand"
        ? ".vehicle-card__brand"
        : ".vehicle-card__model";
      return card.querySelector(selector)?.textContent.trim() ?? "";
    }

    return card.dataset[filterName] ?? "";
  };

  const setOptions = (field, values, label, selectedValue = "") => {
    field.replaceChildren(new Option(label, ""));

    if (values.length === 0) {
      const unavailableOption = new Option("Sin datos disponibles", "");
      unavailableOption.disabled = true;
      field.add(unavailableOption);
      return;
    }

    values.forEach((value) => {
      field.add(new Option(value, value));
    });

    field.value = values.includes(selectedValue) ? selectedValue : "";
  };

  const updateModelOptions = () => {
    const brand = filters.get("brand").value;
    const models = vehicleCards
      .filter((card) => !brand || getCardValue(card, "brand") === brand)
      .map((card) => getCardValue(card, "model"));
    const uniqueModels = [...new Set(models)].sort((a, b) =>
      a.localeCompare(b),
    );
    const modelField = filters.get("model");

    setOptions(
      modelField,
      uniqueModels,
      defaultLabels.model,
      modelField.value,
    );
  };

  const updateResults = () => {
    const selectedFilters = Object.fromEntries(
      filterFields.map((field) => [field.dataset.filter, field.value]),
    );
    let visibleCount = 0;

    vehicleCards.forEach((card) => {
      const isVisible = filterFields.every((field) => {
        const selectedValue = selectedFilters[field.dataset.filter];
        return (
          !selectedValue ||
          getCardValue(card, field.dataset.filter) === selectedValue
        );
      });

      card.hidden = !isVisible;
      visibleCount += Number(isVisible);
    });

    emptyMessage.hidden = visibleCount > 0;
  };

  filterFields.forEach((field) => {
    const filterName = field.dataset.filter;

    if (filterName === "brand" || filterName === "model") {
      const values = [
        ...new Set(vehicleCards.map((card) => getCardValue(card, filterName))),
      ].sort((a, b) => a.localeCompare(b));
      setOptions(field, values, defaultLabels[filterName]);
    } else {
      const values = [
        ...new Set(
          vehicleCards
            .map((card) => getCardValue(card, filterName))
            .filter(Boolean),
        ),
      ].sort((a, b) => a.localeCompare(b));
      setOptions(field, values, defaultLabels[filterName]);
    }

    field.addEventListener("change", () => {
      if (filterName === "brand") {
        updateModelOptions();
      }

      updateResults();
    });
  });

  filterForm.addEventListener("submit", (event) => event.preventDefault());
  updateModelOptions();
}

const backToTop = document.querySelector(".back-to-top");
const heroSection = document.querySelector("#inicio");

if (backToTop && heroSection) {
  const setBackToTopVisible = (isVisible) => {
    backToTop.classList.toggle("back-to-top--visible", isVisible);
    backToTop.setAttribute("aria-hidden", String(!isVisible));

    if (isVisible) {
      backToTop.removeAttribute("tabindex");
    } else {
      backToTop.setAttribute("tabindex", "-1");
    }
  };

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(([entry]) => {
      setBackToTopVisible(!entry.isIntersecting);
    });
    observer.observe(heroSection);
  } else {
    const updateBackToTop = () => {
      setBackToTopVisible(heroSection.getBoundingClientRect().bottom <= 0);
    };

    window.addEventListener("scroll", updateBackToTop, { passive: true });
    updateBackToTop();
  }
}

const menuToggle = document.querySelector(".nav-toggle");
const mainNav = document.querySelector("#main-nav");

const loginModal = document.querySelector(".login-modal");
const loginOpen = document.querySelector("[data-login-open]");
const loginClose = document.querySelector("[data-login-close]");
const loginForm = document.querySelector("[data-login-form]");

if (
  loginModal instanceof HTMLDialogElement &&
  loginOpen instanceof HTMLAnchorElement &&
  loginClose instanceof HTMLButtonElement
) {
  const closeLogin = () => {
    if (loginModal.open) {
      loginModal.close();
    }
  };

  loginOpen.addEventListener("click", (event) => {
    event.preventDefault();
    loginModal.showModal();
  });

  loginClose.addEventListener("click", closeLogin);

  loginModal.addEventListener("click", (event) => {
    if (event.target === loginModal) {
      closeLogin();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeLogin();
    }
  });
}

if (loginForm instanceof HTMLFormElement) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    window.location.assign(
      "file:///C:/Users/EDTecnica/Desktop/New%20folder%20(3)/src/views/dashboard.html",
    );
  });
}

if (menuToggle && mainNav) {
  const setMenuOpen = (isOpen) => {
    mainNav.classList.toggle("main-nav--open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
    menuToggle.title = isOpen ? "Cerrar menú" : "Abrir menú";
  };

  menuToggle.addEventListener("click", () => {
    setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
  });

  mainNav.querySelectorAll("a").forEach((navLink) => {
    navLink.addEventListener("click", () => setMenuOpen(false));
  });

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      menuToggle.getAttribute("aria-expanded") === "true"
    ) {
      setMenuOpen(false);
      menuToggle.focus();
    }
  });

  window.matchMedia("(min-width: 701px)").addEventListener("change", (event) => {
    if (event.matches) {
      setMenuOpen(false);
    }
  });
}
