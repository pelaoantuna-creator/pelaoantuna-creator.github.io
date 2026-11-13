# EF Adaptada — app web pública (GitHub Pages)

Este repositorio ES la app que el docente tiene instalada en su iPad
(https://pelaoantuna-creator.github.io, «Añadir a pantalla de inicio»).
Todo lo que se sube aquí es PÚBLICO.

## Privacidad (obligatorio)
- Nunca subas datos del alumnado: nombres reales, fotos, sesiones, boletines ni copias `.json`.
  Los datos viven solo en el iPad (IndexedDB) y en las copias privadas del docente.
- La versión pública no identifica al centro ni a la entidad (sin logo ni nombres).
  `_herramientas/actualizar.py` los quita y se detiene si queda algún resto.
  No escribas esos nombres en ningún archivo de este repositorio, tampoco en mensajes de commit.
- Antes de cada commit, comprueba que no haya imágenes `data:image/jpeg` nuevas que puedan ser
  fotos de personas. Las únicas permitidas son los pictos de animales del juego.

## Actualizar la app
Opción A (habitual): el docente mejora el artefacto en claude.ai y pide «actualiza la app».
1. Lee el artefacto con la herramienta Artifact (`action: read`; el enlace te lo da el docente).
2. `python3 -I _herramientas/actualizar.py RUTA_DEL_HTML_GUARDADO` regenera `index.html`
   y sube en +1 la versión de caché de `sw.js`, para que el iPad descargue la novedad.
3. Commit y push a `main`. GitHub Pages lo publica en 1–2 minutos.
4. Dile al docente que cierre la app del todo y la vuelva a abrir con conexión.

Opción B: cambios directos. Edita `index.html` o `native.js` aquí y sube a mano en +1
la versión `ef-adaptada-vN` de `sw.js`. Avisa al docente de que el artefacto de claude.ai
no tendrá esos cambios.

## Piezas
- `index.html`: la app (generada desde el artefacto).
- `native.js`: sustituye el runtime de claude.ai con una base de datos local IndexedDB
  (`window.claude.use('db')`), descargas con la hoja de compartir de iOS y los botones
  «Copia de seguridad» / «Importar copia».
  No cambies el nombre de la base `ef-adaptada` ni el del almacén `docs`: el iPad perdería sus datos.
- `sw.js`: funcionamiento sin conexión (red primero; caché si no hay red).
- Fuentes locales (licencia OFL), iconos y `manifest.webmanifest`.
