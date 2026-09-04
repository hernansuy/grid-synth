# Grid Synth

Sintetizador musical interactivo para navegador con secuenciador, patches, mezclador, efectos y un órgano polifónico grabable.

![Vista principal de Grid Synth](assets/grid-synth-overview.png)

## Presentación

Grid Synth combina una estación de síntesis modular con una interfaz clara inspirada en hardware musical. Permite construir patrones, mezclar cinco capas independientes, modificar el carácter del sonido y tocar un órgano polifónico sin instalar software adicional.

La aplicación funciona completamente en el navegador mediante Web Audio API. Los patches, ajustes y tomas se guardan localmente.

## Funciones

- Sintetizador de cinco capas: arpegio, bajo, cuerdas, staccato y brass.
- Secuenciador de 16 pasos y arreglos multipista.
- Presets editables, controles de sonido y efectos.
- Preset armónico inspirado en la estructura de *Veridis Quo*.
- Órgano polifónico con seis registros.
- Interpretación mediante ratón o teclado físico.
- Grabación de tomas, reproducción en loop y cuantización.
- Montaje de tomas del órgano dentro del arreglo principal.
- Persistencia local mediante `localStorage`.

## Órgano y grabación

![Órgano polifónico y grabador de tomas](assets/grid-synth-organ.png)

La expansión ORGAN incluye seis registros, dos octavas, interpretación polifónica y un grabador que conserva nota, duración y timing. Las tomas pueden reproducirse en loop, cuantizarse y añadirse al arreglo principal.

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

