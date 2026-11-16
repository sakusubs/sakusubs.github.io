// 1. Mode Gelap & Terang (+ Sinkron Tema Komentar Giscus)
function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute("data-theme") || "light";
  const next = current === "light" ? "dark" : "light";
  html.setAttribute("data-theme", next);
  localStorage.setItem("sakura_theme", next);

  const giscusFrame = document.querySelector("iframe.giscus-frame");
  if (giscusFrame && giscusFrame.contentWindow) {
    const giscusTheme = next === "dark" ? "dark_dimmed" : "light";
    giscusFrame.contentWindow.postMessage(
      { giscus: { setConfig: { theme: giscusTheme } } },
      "https://giscus.app"
    );
  }
}

// 2. Klik Tombol Search di Header -> Buka Menu Kiri & Fokus Kolom Cari
function toggleHeaderSearch() {
  openDrawer();
  const drawerInput = document.querySelector(".drawer-search-form input");
  if (drawerInput) {
    setTimeout(() => drawerInput.focus(), 180);
  }
}

// 3. Mode Tampilan Grid & List (Dengan Label Dinamis)
function setViewMode(mode) {
  const container = document.getElementById("post-container");
  const label = document.getElementById("view-mode-label");
  const iconGrid = document.getElementById("icon-mode-grid");
  const iconList = document.getElementById("icon-mode-list");

  if (!container) return;

  if (mode === "list") {
    container.classList.remove("view-grid");
    container.classList.add("view-list");
    if (label) label.textContent = "List";
    if (iconGrid) iconGrid.style.display = "none";
    if (iconList) iconList.style.display = "inline-block";
  } else {
    container.classList.remove("view-list");
    container.classList.add("view-grid");
    if (label) label.textContent = "Grid";
    if (iconGrid) iconGrid.style.display = "inline-block";
    if (iconList) iconList.style.display = "none";
  }

  localStorage.setItem("sakura_view", mode);
}

function toggleViewMode() {
  const current = localStorage.getItem("sakura_view") || "grid";
  setViewMode(current === "grid" ? "list" : "grid");
}

// 4. Filter + Tombol "Muat Lebih Banyak →" -> Navigasi Halaman Bernomor
const POSTS_PER_PAGE = 8; // 4 baris x 2 kolom di HP
let filteredCards = [];
let currentPage = 1;
let paginationUnlocked = false;

function initPostsAndPagination() {
  const container = document.getElementById("post-container");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const cat = (params.get("category") || "").trim();
  const tag = (params.get("tag") || "").trim();
  const q = (params.get("q") || "").trim();

  const allCards = Array.from(container.querySelectorAll(".unified-card"));

  if (cat || tag || q) {
    const heroSection = document.getElementById("hero-update-section");
    if (heroSection) heroSection.style.display = "none";

    const titleEl = document.getElementById("release-title");
    if (titleEl) {
      if (cat) titleEl.textContent = `› ${cat.toUpperCase()} »`;
      else if (tag) titleEl.textContent = `› TAG #${tag.toUpperCase()} »`;
      else if (q) titleEl.textContent = `› HASIL "${q.toUpperCase()}" »`;
    }

    const resetPill = document.getElementById("js-reset-pill");
    if (resetPill) resetPill.style.display = "inline-block";

    filteredCards = allCards.filter((card) => {
      const cardCat = card.getAttribute("data-category") || "";
      const cardTags = (card.getAttribute("data-tags") || "").split(",");
      const cardText = card.textContent.toLowerCase();

      const matchCat = !cat || cardCat === cat.toLowerCase();
      const matchTag = !tag || cardTags.includes(tag.toLowerCase());
      const matchQ = !q || cardText.includes(q.toLowerCase());
      return matchCat && matchTag && matchQ;
    });
  } else {
    filteredCards = allCards;
  }

  allCards.forEach((card) => {
    card.style.display = "none";
  });

  currentPage = 1;
  paginationUnlocked = false;
  renderCurrentPage(false);
}

function unlockPagination() {
  const totalPages = Math.ceil(filteredCards.length / POSTS_PER_PAGE);
  paginationUnlocked = true;
  currentPage = totalPages >= 2 ? 2 : 1;
  renderCurrentPage(true);
}

function goToPage(page) {
  const totalPages = Math.ceil(filteredCards.length / POSTS_PER_PAGE);
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderCurrentPage(true);
}

function renderCurrentPage(shouldScroll) {
  const container = document.getElementById("post-container");
  const loadMoreWrap = document.getElementById("load-more-wrap");
  const paginationNav = document.getElementById("pagination-nav");
  const emptyState = document.getElementById("js-empty-state");

  if (!container) return;

  const allCards = Array.from(container.querySelectorAll(".unified-card"));
  allCards.forEach((card) => {
    card.style.display = "none";
  });

  const totalItems = filteredCards.length;
  if (emptyState) {
    emptyState.style.display = totalItems === 0 ? "block" : "none";
  }

  const totalPages = Math.ceil(totalItems / POSTS_PER_PAGE);
  const start = (currentPage - 1) * POSTS_PER_PAGE;
  const end = start + POSTS_PER_PAGE;

  filteredCards.slice(start, end).forEach((card) => {
    card.style.display = "";
  });

  if (totalPages <= 1) {
    if (loadMoreWrap) loadMoreWrap.style.display = "none";
    if (paginationNav) paginationNav.style.display = "none";
  } else if (!paginationUnlocked) {
    if (loadMoreWrap) loadMoreWrap.style.display = "block";
    if (paginationNav) paginationNav.style.display = "none";
  } else {
    if (loadMoreWrap) loadMoreWrap.style.display = "none";
    if (paginationNav) {
      paginationNav.style.display = "flex";
      renderPaginationControls(paginationNav, totalPages);
    }
  }

  if (shouldScroll) {
    const toolbar = document.getElementById("release-toolbar");
    if (toolbar) {
      const y = toolbar.getBoundingClientRect().top + window.scrollY - 76;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    }
  }
}

function renderPaginationControls(navEl, totalPages) {
  navEl.innerHTML = "";

  const prevBtn = document.createElement("button");
  prevBtn.type = "button";
  prevBtn.className = "page-btn";
  prevBtn.innerHTML = "&lsaquo;";
  prevBtn.disabled = currentPage === 1;
  prevBtn.setAttribute("aria-label", "Halaman Sebelumnya");
  prevBtn.onclick = () => goToPage(currentPage - 1);
  navEl.appendChild(prevBtn);

  const pages = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else if (currentPage <= 3) {
    pages.push(1, 2, 3, "...", totalPages);
  } else if (currentPage >= totalPages - 2) {
    pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
  } else {
    pages.push(1, "...", currentPage, "...", totalPages);
  }

  pages.forEach((item) => {
    if (item === "...") {
      const span = document.createElement("span");
      span.className = "page-ellipsis";
      span.textContent = "...";
      navEl.appendChild(span);
    } else {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `page-btn ${item === currentPage ? "active" : ""}`;
      btn.textContent = item;
      btn.onclick = () => goToPage(item);
      navEl.appendChild(btn);
    }
  });

  const nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.className = "page-btn";
  nextBtn.innerHTML = "&rsaquo;";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.setAttribute("aria-label", "Halaman Berikutnya");
  nextBtn.onclick = () => goToPage(currentPage + 1);
  navEl.appendChild(nextBtn);
}

// 5. Slideshow Update Terbaru (Max 3 Slide + Swipe Mobile)
let currentSlideIndex = 0;
let slideTimer = null;
let isSwiping = false;

function showSlide(index) {
  const slides = document.querySelectorAll(".hero-slide");
  const dots = document.querySelectorAll(".hero-dot");
  const tickerLink = document.getElementById("ticker-link");

  if (!slides.length) return;

  if (index >= slides.length) currentSlideIndex = 0;
  else if (index < 0) currentSlideIndex = slides.length - 1;
  else currentSlideIndex = index;

  slides.forEach((slide, i) => {
    slide.classList.toggle("active", i === currentSlideIndex);
  });

  dots.forEach((dot, i) => {
    dot.classList.toggle("active", i === currentSlideIndex);
  });

  const activeSlide = slides[currentSlideIndex];
  if (tickerLink && activeSlide) {
    tickerLink.textContent = activeSlide.getAttribute("data-title") || "";
    tickerLink.href = activeSlide.getAttribute("data-url") || "#";
  }
}

function nextSlide() {
  showSlide(currentSlideIndex + 1);
  restartSlideTimer();
}

function prevSlide() {
  showSlide(currentSlideIndex - 1);
  restartSlideTimer();
}

function goToSlide(index) {
  showSlide(index);
  restartSlideTimer();
}

function restartSlideTimer() {
  if (slideTimer) clearInterval(slideTimer);
  const slides = document.querySelectorAll(".hero-slide");
  if (slides.length > 1) {
    slideTimer = setInterval(() => {
      showSlide(currentSlideIndex + 1);
    }, 5000);
  }
}

function initSliderSwipe() {
  const slider = document.getElementById("hero-slider");
  if (!slider) return;

  let touchStartX = 0;
  let touchEndX = 0;

  slider.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].screenX;
    isSwiping = false;
  }, { passive: true });

  slider.addEventListener("touchend", (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchEndX - touchStartX;

    if (Math.abs(diff) > 40) {
      isSwiping = true;
      if (diff < 0) nextSlide();
      else prevSlide();
      setTimeout(() => { isSwiping = false; }, 250);
    }
  }, { passive: true });

  slider.querySelectorAll(".hero-slide").forEach((link) => {
    link.addEventListener("click", (e) => {
      if (isSwiping) e.preventDefault();
    });
  });
}

// 6. Slide Drawer Kategori dari Kiri
function openDrawer() {
  const drawer = document.getElementById("nav-drawer");
  const backdrop = document.getElementById("drawer-backdrop");
  if (drawer && backdrop) {
    drawer.classList.add("open");
    backdrop.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
}

function closeDrawer() {
  const drawer = document.getElementById("nav-drawer");
  const backdrop = document.getElementById("drawer-backdrop");
  if (drawer && backdrop) {
    drawer.classList.remove("open");
    backdrop.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
}

// 7. Tombol Top (Kembali ke Paling Atas)
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

window.addEventListener("scroll", () => {
  const topBtn = document.getElementById("btn-back-top");
  if (!topBtn) return;
  if (window.scrollY > 120) {
    topBtn.classList.add("visible");
  } else {
    topBtn.classList.remove("visible");
  }
});

// 8. Inisialisasi Saat Halaman Dimuat
document.addEventListener("DOMContentLoaded", () => {
  const savedView = localStorage.getItem("sakura_view") || "grid";
  setViewMode(savedView);
  initPostsAndPagination();
  restartSlideTimer();
  initSliderSwipe();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeDrawer();
    closeImgModal();
  }
});

// 9. Share Sosial Media & Copy Link
function shareTo(platform) {
  const url = encodeURIComponent(window.location.href);
  const title = encodeURIComponent(document.title);
  let shareUrl = "";

  if (platform === "whatsapp") {
    shareUrl = `https://api.whatsapp.com/send?text=${title}%20-%20${url}`;
  } else if (platform === "x") {
    shareUrl = `https://twitter.com/intent/tweet?text=${title}&url=${url}`;
  } else if (platform === "facebook") {
    shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
  }

  if (shareUrl) {
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  }
}

async function shareNative() {
  const shareData = {
    title: document.title,
    text: "Cek rilisan fansub Sakurazaka46 ini:",
    url: window.location.href
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch (err) {
      // Pengguna membatalkan share
    }
  } else {
    copyPostLink();
  }
}

function copyPostLink() {
  const feedback = document.getElementById("copy-feedback");
  navigator.clipboard.writeText(window.location.href).then(() => {
    if (feedback) {
      feedback.textContent = "Link berhasil disalin!";
      setTimeout(() => {
        feedback.textContent = "";
      }, 3000);
    }
  });
}

// 10. Zoom Cuplikan Gambar
function openImgModal(src) {
  const modal = document.getElementById("img-modal");
  const modalImg = document.getElementById("img-modal-content");
  if (modal && modalImg) {
    modalImg.src = src;
    modal.classList.add("open");
  }
}

function closeImgModal() {
  const modal = document.getElementById("img-modal");
  if (modal) {
    modal.classList.remove("open");
  }
}
