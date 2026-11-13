"""Genera index.html (version publica) a partir del HTML del artefacto de claude.ai.

Uso:  python3 -I _herramientas/actualizar.py RUTA_AL_HTML_DEL_ARTEFACTO

- Quita la identificacion del centro (logo, nombre) de la portada, cabecera,
  panel e informes, y comprueba que no quede ningun resto.
- Conecta native.js (datos locales, copias de seguridad) y las fuentes locales.
- Sube la version de cache de sw.js para que el iPad descargue la novedad.
"""
import hashlib
import os
import re
import sys

src = open(sys.argv[1], encoding="utf-8").read()
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

HEAD = """<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="EF Adaptada">
<meta name="theme-color" content="#0b1d44">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icon-180.png">
<link rel="stylesheet" href="fonts.css">
<script src="native.js"></script>
"""


def sub1(pattern, repl, s, flags=0, count_expected=1):
    s2, n = re.subn(pattern, repl, s, flags=flags)
    assert n == count_expected, f"patron no encontrado {n}x: {pattern[:60]}"
    return s2


# Google Fonts -> fuentes locales
src = sub1(r'<link rel="preconnect" href="https://fonts\.googleapis\.com">', "", src)
src = sub1(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com/css2[^"]*">', "", src)

# Textos de guardado: en el iPad todo queda en el dispositivo
for a, b in [("Clases guardadas en tu cuenta", "Guardado en este dispositivo"),
             ("No queda espacio en la cuenta. Quita fotos o pictogramas que no uses.",
              "No queda espacio en este dispositivo. Quita fotos o pictogramas que no uses."),
             ("No se ha podido guardar en tu cuenta: guardado en este dispositivo", "No se ha podido guardar")]:
    assert a in src, a
    src = src.replace(a, b)

# --- version publica: sin identificacion del centro ---
src = sub1(r'<img class="aspace" id="aspaceLogo" src="data:image/png;base64,[^"]+" alt="[^"]*">', "", src)
src = sub1(r'<span class="cee">[^<]*</span>', "", src)
src = sub1(r'(<h1>Educación Física Adaptada</h1>)<p>[^<]*</p>', r"\1", src)
src = sub1(r'<img class="hdrlogo" id="hdrLogo"[^>]*>', "", src)
src = sub1(r'<p>Educación Física Adaptada · [^<]*</p>', "<p>Educación Física Adaptada</p>", src)
src = sub1(r'(<p class="mu">)[^<$]*· (\$\{e\(c\.name\)\})', r"\1\2", src)
src = re.sub(r'placeholder="Ej\.: [A-Z]{2,4} \d[A-Z]"', 'placeholder="Ej.: Grupo A"', src)

# Comprobacion: ningun termino identificativo (se comparan huellas, no texto)
BAD = {"2f28062576a53bd1", "61e1107708f6d4cb", "ed1c1100f7299bfb"}
h = lambda t: hashlib.sha256(t.encode()).hexdigest()[:16]
toks = re.findall(r"\w+", src)
low = [t.lower() for t in toks]
grams = set(toks) | set(low) | {" ".join(low[i:i + 3]) for i in range(len(low) - 2)}
leak = [g for g in grams if h(g) in BAD]
assert not leak, "quedan terminos identificativos en la version publica"

src = src.replace("<html>", '<html lang="es">', 1)
assert "</head>" in src
src = src.replace("</head>", HEAD + "</head>", 1)
open(os.path.join(root, "index.html"), "w", encoding="utf-8").write(src)

swp = os.path.join(root, "sw.js")
sw = open(swp).read()
m = re.search(r"ef-adaptada-v(\d+)", sw)
sw = sw.replace(m.group(0), "ef-adaptada-v%d" % (int(m.group(1)) + 1))
open(swp, "w").write(sw)
print("index.html generado; cache v%d" % (int(m.group(1)) + 1))
