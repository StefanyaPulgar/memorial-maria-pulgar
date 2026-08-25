#!/usr/bin/env node
/*
 * Escanea media/fotos, media/audios y media/videos y actualiza
 * data/contenido.json automáticamente:
 *   - Los archivos nuevos se agregan con un título/etiqueta generado
 *     desde el nombre del archivo (editable después a mano).
 *   - Los archivos que ya estaban en el JSON conservan el título,
 *     etiqueta, tamaño y duración que ya les hayas puesto.
 *   - Los archivos que ya no existen en la carpeta se eliminan del JSON.
 *   - El archivo marcado como "audioPrincipal" en contenido.json (el
 *     mensaje destacado del hero) se excluye de la lista normal de audios,
 *     aunque viva en la misma carpeta media/audios.
 *   - El archivo marcado como "retrato" en contenido.json se excluye de
 *     la galería de momentos, aunque viva en la misma carpeta media/fotos.
 *
 * Uso: node generar-contenido.js
 * (Solo requiere Node.js, sin instalar nada más.)
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const DATA_PATH = path.join(ROOT, "data", "contenido.json");

const CARPETAS = {
  fotos: { dir: path.join(ROOT, "media", "fotos"), ext: [".jpg", ".jpeg", ".png", ".webp", ".gif"] },
  audios: { dir: path.join(ROOT, "media", "audios"), ext: [".mp3", ".wav", ".m4a", ".ogg", ".opus"] },
  videos: { dir: path.join(ROOT, "media", "videos"), ext: [".mp4", ".webm", ".mov", ".m4v"] },
};

const TAMANOS = ["normal", "tall", "wide", "normal", "tall"];

function listarArchivos(dir, extensiones) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((nombre) => extensiones.includes(path.extname(nombre).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
}

function tituloDesdeArchivo(nombre) {
  const base = nombre.slice(0, -path.extname(nombre).length);
  const limpio = base.replace(/[-_]+/g, " ").trim();
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
}

function relPosix(...parts) {
  return path.join(...parts).split(path.sep).join("/");
}

function fusionarLista(existentes, archivos, carpeta, construirNuevo, nuevosOut) {
  const existentesPorSrc = new Map();
  (existentes || []).forEach((item) => existentesPorSrc.set(item.src, item));

  return archivos.map((nombre, index) => {
    const src = relPosix("media", carpeta, nombre);
    if (existentesPorSrc.has(src)) {
      return existentesPorSrc.get(src);
    }
    nuevosOut.push(nombre);
    return construirNuevo(nombre, src, index);
  });
}

function main() {
  const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));

  const srcRetrato = data.persona && data.persona.retrato;
  const archivosFotos = listarArchivos(CARPETAS.fotos.dir, CARPETAS.fotos.ext).filter(
    (nombre) => relPosix("media", "fotos", nombre) !== srcRetrato
  );
  const srcPrincipal = data.audioPrincipal && data.audioPrincipal.src;
  const archivosAudios = listarArchivos(CARPETAS.audios.dir, CARPETAS.audios.ext).filter(
    (nombre) => relPosix("media", "audios", nombre) !== srcPrincipal
  );
  const archivosVideos = listarArchivos(CARPETAS.videos.dir, CARPETAS.videos.ext);

  const nuevasFotos = [];
  const nuevosAudios = [];
  const nuevosVideos = [];

  data.momentos = fusionarLista(
    data.momentos,
    archivosFotos,
    "fotos",
    (nombre, src, index) => ({
      src,
      alt: tituloDesdeArchivo(nombre),
      label: tituloDesdeArchivo(nombre),
      tamano: TAMANOS[index % TAMANOS.length],
    }),
    nuevasFotos
  );

  data.audios = fusionarLista(
    data.audios,
    archivosAudios,
    "audios",
    (nombre, src) => ({ src, titulo: tituloDesdeArchivo(nombre), duracion: "" }),
    nuevosAudios
  );

  data.videos = fusionarLista(
    data.videos,
    archivosVideos,
    "videos",
    (nombre, src) => ({ src, titulo: tituloDesdeArchivo(nombre), duracion: "" }),
    nuevosVideos
  );

  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + "\n", "utf8");

  console.log("data/contenido.json actualizado.");
  console.log(`Fotos: ${archivosFotos.length} (${nuevasFotos.length} nuevas)`);
  console.log(`Audios: ${archivosAudios.length} (${nuevosAudios.length} nuevos)`);
  console.log(`Videos: ${archivosVideos.length} (${nuevosVideos.length} nuevos)`);

  if (nuevosAudios.length || nuevosVideos.length) {
    console.log("\nFalta poner la duración a mano en data/contenido.json para:");
    [...nuevosAudios, ...nuevosVideos].forEach((n) => console.log("  - " + n));
  }
  if (nuevasFotos.length) {
    console.log("\nRevisa/ajusta la etiqueta, el alt y el tamaño (normal/tall/wide) de:");
    nuevasFotos.forEach((n) => console.log("  - " + n));
  }
  console.log(
    "\nNota: si renombras un archivo ya existente, se trata como uno nuevo " +
      "y pierde el título/etiqueta que le habías puesto."
  );
}

main();
