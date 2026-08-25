(function () {
  "use strict";

  var ICON_PLAY =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  var ICON_PAUSE =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>';

  function el(tag, className, html) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined) node.innerHTML = html;
    return node;
  }

  function renderPersona(persona) {
    if (!persona) return;
    var nameEl = document.getElementById("hero-name");
    var datesEl = document.getElementById("hero-dates");
    var epitaphEl = document.getElementById("hero-epitaph");
    var portrait = document.getElementById("hero-portrait");

    if (persona.nombre) nameEl.textContent = persona.nombre;
    if (persona.fechaNacimiento || persona.fechaFallecimiento) {
      datesEl.textContent =
        (persona.fechaNacimiento || "") + " — " + (persona.fechaFallecimiento || "");
    }
    if (persona.epitafio) epitaphEl.textContent = '"' + persona.epitafio + '"';

    if (persona.retrato) {
      var img = document.createElement("img");
      img.src = persona.retrato;
      img.alt = persona.nombre || "Retrato";
      img.onerror = function () { img.remove(); };
      portrait.innerHTML = "";
      portrait.appendChild(img);
    }
  }

  function renderAudioPrincipal(audioPrincipal) {
    var wrap = document.getElementById("hero-audio");
    if (!audioPrincipal || !audioPrincipal.src) return;

    var button = document.getElementById("hero-audio-play");
    var titleEl = document.getElementById("hero-audio-title");
    var durationEl = document.getElementById("hero-audio-duration");
    var audio = document.getElementById("hero-audio-el");

    titleEl.textContent = audioPrincipal.titulo || "Su mensaje";
    durationEl.textContent = audioPrincipal.duracion || "";
    audio.src = audioPrincipal.src;
    wrap.hidden = false;

    button.addEventListener("click", function () {
      var isPlaying = !audio.paused;
      document.querySelectorAll("audio").forEach(function (a) {
        if (a !== audio) a.pause();
      });
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play().catch(function () {});
      }
    });

    audio.addEventListener("play", function () {
      button.innerHTML = ICON_PAUSE;
      button.setAttribute("aria-label", "Pausar " + (audioPrincipal.titulo || "mensaje"));
    });
    audio.addEventListener("pause", function () {
      button.innerHTML = ICON_PLAY;
      button.setAttribute("aria-label", "Reproducir " + (audioPrincipal.titulo || "mensaje"));
    });
    audio.addEventListener("ended", function () {
      button.innerHTML = ICON_PLAY;
    });
  }

  function renderHistoria(historia) {
    if (!historia) return;
    var eyebrow = document.getElementById("historia-eyebrow");
    var titulo = document.getElementById("historia-titulo");
    var contenedor = document.getElementById("historia-parrafos");

    if (historia.eyebrow) eyebrow.textContent = historia.eyebrow;
    if (historia.titulo) titulo.textContent = historia.titulo;

    contenedor.innerHTML = "";
    (historia.parrafos || []).forEach(function (texto) {
      contenedor.appendChild(el("p", null, texto));
    });
  }

  var GALLERY_PAGE_SIZE = 30; // grilla de 3x10
  var openLightbox = function () {};

  function renderGallery(momentos) {
    var items = momentos || [];
    var gallery = document.getElementById("gallery");
    gallery.innerHTML = "";
    initLightbox(items);

    var sentinel = el("div", "gallery__sentinel");
    gallery.appendChild(sentinel);

    var renderedCount = 0;

    function appendThumbnail(item, index) {
      var button = el("button", "gallery__item");
      button.type = "button";
      button.setAttribute("aria-label", "Ver foto ampliada" + (item.label ? ": " + item.label : ""));

      var media = el("div", "gallery__media");
      var img = document.createElement("img");
      img.src = item.src;
      img.alt = item.alt || "";
      img.loading = "lazy";
      img.onerror = function () { this.classList.add("is-fallback"); };
      media.appendChild(img);
      button.appendChild(media);

      if (item.label) {
        button.appendChild(el("span", "gallery__label", item.label));
      }

      button.addEventListener("click", function () { openLightbox(index); });
      gallery.insertBefore(button, sentinel);
    }

    function renderNextPage() {
      var end = Math.min(items.length, renderedCount + GALLERY_PAGE_SIZE);
      for (var i = renderedCount; i < end; i++) {
        appendThumbnail(items[i], i);
      }
      renderedCount = end;
      if (renderedCount >= items.length) {
        observer.disconnect();
        sentinel.remove();
      }
    }

    var observer = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) renderNextPage();
    }, { rootMargin: "600px" });

    renderNextPage();
    if (renderedCount < items.length) observer.observe(sentinel);
  }

  function initLightbox(items) {
    var lightbox = document.getElementById("lightbox");
    var imgEl = document.getElementById("lightbox-img");
    var captionEl = document.getElementById("lightbox-caption");
    var counterEl = document.getElementById("lightbox-counter");
    var closeBtn = document.getElementById("lightbox-close");
    var prevBtn = document.getElementById("lightbox-prev");
    var nextBtn = document.getElementById("lightbox-next");
    var currentIndex = 0;

    function show(index) {
      currentIndex = (index + items.length) % items.length;
      var item = items[currentIndex];
      imgEl.src = item.src;
      imgEl.alt = item.alt || "";
      captionEl.textContent = item.label || "";
      counterEl.textContent = (currentIndex + 1) + " / " + items.length;
    }

    function open(index) {
      if (!items.length) return;
      show(index);
      lightbox.hidden = false;
      closeBtn.focus();
    }

    function close() {
      lightbox.hidden = true;
      imgEl.src = "";
    }

    closeBtn.addEventListener("click", close);
    prevBtn.addEventListener("click", function () { show(currentIndex - 1); });
    nextBtn.addEventListener("click", function () { show(currentIndex + 1); });
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) close();
    });
    document.addEventListener("keydown", function (e) {
      if (lightbox.hidden) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(currentIndex - 1);
      if (e.key === "ArrowRight") show(currentIndex + 1);
    });

    openLightbox = open;
  }

  function randomWaveform() {
    var bars = "";
    for (var i = 0; i < 9; i++) {
      var h = 5 + Math.round(Math.random() * 17);
      bars += '<span style="height:' + h + 'px"></span>';
    }
    return bars;
  }

  function renderAudios(audios) {
    var list = document.getElementById("audio-list");
    list.innerHTML = "";

    (audios || []).forEach(function (item, index) {
      var li = el("li", "thread-item");
      li.appendChild(el("span", "thread-item__dot"));

      var button = el("button", "thread-item__play", ICON_PLAY);
      button.type = "button";
      button.setAttribute("aria-label", "Reproducir " + (item.titulo || "audio"));
      li.appendChild(button);

      var body = el("div", "thread-item__body");
      var info = el("div", "thread-item__info");
      info.appendChild(el("p", "thread-item__title", item.titulo || ""));
      info.appendChild(el("p", "thread-item__duration", item.duracion || ""));
      body.appendChild(info);
      body.appendChild(el("div", "thread-item__waveform", randomWaveform()));
      li.appendChild(body);

      var audio = document.createElement("audio");
      audio.src = item.src;
      audio.preload = "none";
      li.appendChild(audio);

      button.addEventListener("click", function () {
        var isPlaying = !audio.paused;
        document.querySelectorAll("audio").forEach(function (a) {
          if (a !== audio) a.pause();
        });
        if (isPlaying) {
          audio.pause();
        } else {
          audio.play().catch(function () {});
        }
      });

      audio.addEventListener("play", function () {
        button.innerHTML = ICON_PAUSE;
        button.setAttribute("aria-label", "Pausar " + (item.titulo || "audio"));
      });
      audio.addEventListener("pause", function () {
        button.innerHTML = ICON_PLAY;
        button.setAttribute("aria-label", "Reproducir " + (item.titulo || "audio"));
      });
      audio.addEventListener("ended", function () {
        button.innerHTML = ICON_PLAY;
      });

      list.appendChild(li);
    });
  }

  function renderVideos(videos) {
    var list = document.getElementById("video-list");
    list.innerHTML = "";

    (videos || []).forEach(function (item) {
      var li = el("li", "thread-item");
      li.appendChild(el("span", "thread-item__dot"));

      var button = el("button", "thread-item__play", ICON_PLAY);
      button.type = "button";
      button.setAttribute("aria-label", "Reproducir " + (item.titulo || "video"));
      li.appendChild(button);

      var body = el("div", "thread-item__body");
      var info = el("div", "thread-item__info");
      info.appendChild(el("p", "thread-item__title", item.titulo || ""));
      info.appendChild(el("p", "thread-item__duration", item.duracion || ""));
      body.appendChild(info);
      li.appendChild(body);

      var mediaWrap = el("div", "thread-item__media");
      var video = document.createElement("video");
      video.src = item.src;
      video.controls = true;
      video.preload = "none";
      mediaWrap.appendChild(video);
      li.appendChild(mediaWrap);

      button.addEventListener("click", function () {
        var isOpen = mediaWrap.classList.contains("is-open");
        document.querySelectorAll(".thread-item__media.is-open").forEach(function (open) {
          open.classList.remove("is-open");
          var v = open.querySelector("video");
          if (v) v.pause();
        });
        if (!isOpen) {
          mediaWrap.classList.add("is-open");
          video.play().catch(function () {});
          button.innerHTML = ICON_PAUSE;
        } else {
          button.innerHTML = ICON_PLAY;
        }
      });

      video.addEventListener("play", function () { button.innerHTML = ICON_PAUSE; });
      video.addEventListener("pause", function () { button.innerHTML = ICON_PLAY; });
      video.addEventListener("ended", function () {
        button.innerHTML = ICON_PLAY;
        mediaWrap.classList.remove("is-open");
      });

      list.appendChild(li);
    });
  }

  function renderAporte(aporte) {
    if (!aporte) return;
    var titulo = document.getElementById("aporte-titulo");
    var texto = document.getElementById("aporte-texto");
    var btn = document.getElementById("aporte-btn");

    if (aporte.titulo) titulo.textContent = aporte.titulo;
    if (aporte.texto) texto.textContent = aporte.texto;
    if (aporte.textoBoton) btn.textContent = aporte.textoBoton;
    if (aporte.urlFormulario) btn.href = aporte.urlFormulario;
  }

  function renderFooter(footer) {
    var year = document.getElementById("footer-year");
    year.textContent = new Date().getFullYear();
    if (footer && footer.texto) {
      var footerEl = document.getElementById("footer-texto");
      footerEl.firstChild.textContent = footer.texto + " · ";
    }
  }

  fetch("data/contenido.json")
    .then(function (res) { return res.json(); })
    .then(function (data) {
      renderPersona(data.persona);
      renderAudioPrincipal(data.audioPrincipal);
      renderHistoria(data.historia);
      renderGallery(data.momentos);
      renderAudios(data.audios);
      renderVideos(data.videos);
      renderAporte(data.aporte);
      renderFooter(data.footer);
    })
    .catch(function (err) {
      console.error("No se pudo cargar data/contenido.json", err);
    });
})();
