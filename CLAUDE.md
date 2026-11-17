# CLAUDE.md — Repaso (app de votaciones en Python)

Instrucciones para cualquier agente de IA (Claude Code, Cursor, etc.) que trabaje en este repo.
Basado en el protocolo "coworker agent" de Lauren Tan: el agente trabaja como un compañero
con un encargo claro, permisos explícitos y evidencia de lo que hizo.

## El proyecto

- `app_votos.py`: menú de consola (candidatos y votantes). Se ejecuta con `python3 app_votos.py`.
  El bucle del menú está a nivel de módulo, así que **importarlo arranca el menú**.
- `cls_candidatos.py`, `cls_votantes.py`, `cls_votos.py`: clases de datos con getters/setters.
- `mostrar_consola.py`: utilidad `print_box` (imprime un ejemplo al importarse).
- `tests/`: pruebas con `unittest` (sin dependencias externas).

Ejecutar las pruebas:

```bash
python3 -m unittest discover -s tests -v
```

## 1. El encargo: antes de empezar

Una conversación no es una especificación completa. Antes de tocar código, deja claro:

- **Objetivo**: qué hay que lograr.
- **Terminado cuando**: un resultado *observable* (un comando, una salida, un test).
- **Puedes editar**: qué archivos o carpetas.
- **Detente si**: el límite o bloqueo que obliga a parar.

Si falta alguno y cambia lo que deberías hacer, pregunta.

## 2. Permisos: hacer, preguntar o escalar

Entender lo que se pide **no** es permiso para hacerlo. Para cada acción:

- **Hazlo** si está dentro del encargo y de los archivos permitidos.
- **Pregunta** si el objetivo es ambiguo, hay instrucciones que chocan o falta contexto.
- **Escala (no lo hagas sin aprobación)** si implica: borrar datos o archivos ajenos a la tarea,
  cambiar la estructura del proyecto, agregar dependencias, hacer push/merge, o un rediseño
  que nadie pidió.

Que los tests pasen **no** es aprobación para fusionar o publicar.

## 3. Forma de trabajar

1. **Línea base**: anota el commit actual y reproduce el problema *antes* de corregirlo.
2. **Lee** el código relevante y sigue el flujo de datos. Separa lo observado de lo que supones.
3. **Un cambio coherente** a la vez, siguiendo el estilo existente (español, `fnt_*`, getters/setters).
4. **Ejecuta la app de verdad** y repite el caso del usuario (por ejemplo, con
   `printf '2\n1\n...' | python3 app_votos.py`). No basta con "debería funcionar".
5. Si algo falla: diagnostica → corrige → vuelve a probar.
6. Si falta algo (herramienta, acceso, dato): dilo con precisión y propón el siguiente paso.
7. No toques cambios ajenos a la tarea. Limpia solo lo que tú creaste.

## 4. Evidencia

Cada afirmación lleva su prueba:

| Afirmación | Prueba |
|---|---|
| "corre" | salida de `python3 app_votos.py` con la entrada usada |
| "funciona" | el caso del usuario ejecutado y su salida observada |
| "no rompí nada" | `python3 -m unittest discover -s tests -v` |

Una prueba solo demuestra lo que realmente revisa. Si cambias el código, vuelve a correr las
pruebas afectadas.

## 5. Memoria del repo

Si una corrección se repite, conviértela en un **test** en `tests/`, no en un recordatorio.
Los errores conocidos están marcados con `@unittest.expectedFailure` y el comentario `BUG conocido`:
al corregir uno, quita el decorador para que el test quede como protección.

No copies código de `tempCodeRunnerFile.py` ni de archivos temporales: no son convenciones del proyecto.

## 6. Entrega

Termina siempre con:

- **Cambio**: qué archivos tocaste y por qué (resumen corto).
- **Pruebas**: cada una con su comando y resultado: `PASS`, `FAIL` o `NOT_RUN` (y por qué).
- **Límites**: lo que no cubriste, dudas y bloqueos.
- **Decisiones pendientes**: lo que debe decidir una persona.
- **Siguiente paso**: quién hace qué.
