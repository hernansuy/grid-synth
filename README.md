# Grid Synth

Sintetizador musical interactivo para navegador con secuenciador, patches, mezclador, efectos, órgano polifónico y sampler WAV compatible con MIDI.

![Vista principal de Grid Synth](assets/grid-synth-overview.png)

## Presentación

Grid Synth combina una estación de síntesis modular con una interfaz clara inspirada en hardware musical. Permite construir patrones, mezclar cinco capas independientes, modificar el carácter del sonido, tocar un órgano polifónico y cargar muestras WAV cromáticamente desde un teclado o controlador MIDI.

La aplicación funciona completamente en el navegador mediante Web Audio API. Los patches, ajustes y tomas se guardan localmente.

## Sobre el proyecto

Grid Synth es uno de los primeros proyectos que comparto aquí. Lo desarrollo como hobby y como espacio de experimentación, por lo que puede contener errores y todavía tiene mucho margen de mejora.

La idea inicial nació del deseo de crear una experiencia musical y visual inspirada en el universo digital de *Tron*.

## Funciones

- Sintetizador de cinco capas: arpegio, bajo, cuerdas, staccato y brass.
- Secuenciador de 16 pasos y arreglos multipista.
- Presets editables, controles de sonido y efectos.
- Preset armónico inspirado en la estructura de *Veridis Quo*.
- Banco polifónico con 19 instrumentos: órganos, pianos acústicos, pianos eléctricos y timbres híbridos.
- Teclado desplazable por cinco zonas, desde C1–C3 hasta C5–C7.
- Interpretación mediante ratón o teclado físico.
- Grabación de tomas, reproducción en loop y cuantización.
- Montaje de tomas del órgano dentro del arreglo principal.
- Sampler WAV polifónico con root key, zonas de teclado y multisampling.
- Envolvente ADSR independiente por voz, velocity MIDI y pitch bend.
- Loop de sustain con crossfade configurable para evitar clicks.
- Teclado de prueba integrado y conexión MIDI mediante Web MIDI API.
- Arquitectura del sampler preparada para filtros, LFO, chorus y reverb.
- Persistencia local mediante `localStorage`.

## Órgano y grabación

![Órgano polifónico y grabador de tomas](assets/grid-synth-organ.png)

La expansión ORGAN incluye 19 registros —desde órganos clásicos y drawbars hasta pianos acústicos, pianos eléctricos, pianos metálicos y voces híbridas—, dos octavas visibles y cinco zonas de interpretación. El grabador conserva nota, duración y timing; las tomas pueden reproducirse en loop, cuantizarse y añadirse al arreglo principal.

## Sampler WAV / MIDI

La pestaña SAMPLER permite cargar archivos WAV y crear zonas independientes. Cada zona puede definir:

- Muestra y nota raíz MIDI, por ejemplo `organ_C3.wav` en `C3 / MIDI 60`.
- Rango de teclas, por ejemplo `C2–B3`.
- Loop de sustain, inicio, final y crossfade en milisegundos.
- Selección automática de la zona cuya root key esté más cerca de la nota tocada.

La configuración de ejemplo usa `organ_C3.wav`, root key `C3 / MIDI 60`, rango `C2–B3`, loop activado y ADSR `10 ms / 200 ms / 85% / 500 ms`. El navegador necesita una interacción inicial para activar el audio. Para usar un controlador físico, abre la aplicación por HTTPS —GitHub Pages ya cumple este requisito— y pulsa `CONNECT MIDI`.

El motor está implementado en `sampler.js` con las clases `Sample`, `SampleZone`, `ADSR`, `SamplerVoice`, `SamplerEngine` y `MidiHandler`. La interpolación inicial usa el `playbackRate` nativo del navegador, que realiza interpolación de reproducción; la propiedad `interpolation` queda preparada para futuras estrategias lineales, cúbicas o sinc.

## Ejecutar localmente

La aplicación no requiere compilación ni dependencias.

```bash
python -m http.server 4173
```

Después abre `http://127.0.0.1:4173/`.

También se puede abrir `index.html` directamente, aunque un servidor local ofrece un comportamiento más consistente entre navegadores.

## Controles del órgano

- Fila inferior: `Z S X D C V G B H N J M`
- Fila superior: `Q 2 W 3 E R 5 T 6 Y 7 U I`
- `RECORD`: inicia o detiene una toma.
- `PLAY TAKE`: reproduce la toma actual.
- `ADD TO ARRANGEMENT`: convierte la toma en un clip del secuenciador.

## Tecnología

HTML, CSS, JavaScript y Web Audio API. No utiliza frameworks ni servicios externos durante la ejecución.

## Compatibilidad

Requiere un navegador moderno compatible con Web Audio API. El audio se activa después de la primera interacción del usuario, siguiendo las políticas habituales de reproducción de los navegadores.

