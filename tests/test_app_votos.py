"""Pruebas de punta a punta: ejecutan el menú real de app_votos.py con entradas simuladas.

app_votos.py arranca el menú al importarse, así que se prueba como lo usaría una
persona: lanzando el programa y escribiéndole las opciones por la entrada estándar.
"""
import pathlib
import subprocess
import sys
import unittest

RAIZ = pathlib.Path(__file__).resolve().parent.parent
APP = RAIZ / "app_votos.py"


def ejecutar(*lineas):
    """Ejecuta la app con las líneas dadas como entrada y devuelve el proceso terminado."""
    entrada = "\n".join(lineas) + "\n"
    return subprocess.run(
        [sys.executable, str(APP)],
        input=entrada,
        capture_output=True,
        text=True,
        cwd=RAIZ,
        timeout=10,
    )


class TestMenu(unittest.TestCase):
    def test_salir(self):
        r = ejecutar("3")
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn("Menu Principal Votaciones", r.stdout)

    def test_opcion_invalida(self):
        r = ejecutar("9", "3")
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn("Opción inválida", r.stdout)


class TestCandidatosEnApp(unittest.TestCase):
    def test_registrar_y_consultar_candidato(self):
        r = ejecutar(
            "1", "1", "10", "Ana", "Más parques", "Verde",  # registrar
            "1", "2", "10",                                  # consultar
            "3",
        )
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn("Candidato registrado con éxito", r.stdout)
        self.assertIn("Más parques", r.stdout)

    # BUG conocido: en fnt_consultar_candidato el `else` está dentro del for, así que
    # imprime "Candidato no encontrado" por cada candidato que no coincide, aunque
    # el buscado sí exista más adelante en la lista.
    @unittest.expectedFailure
    def test_consultar_segundo_candidato_no_dice_no_encontrado(self):
        r = ejecutar(
            "1", "1", "10", "Ana", "Más parques", "Verde",
            "1", "1", "20", "Beto", "Más buses", "Azul",
            "1", "2", "20",
            "3",
        )
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn("Más buses", r.stdout)
        self.assertNotIn("Candidato no encontrado", r.stdout)


class TestVotantesEnApp(unittest.TestCase):
    def test_registrar_votante(self):
        r = ejecutar("2", "1", "1", "Luis", "Bogotá", "0", "Mesa 3", "luis@ejemplo.com", "3")
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn("Votante registrado con éxito", r.stdout)

    # BUG conocido: consultar un votante registrado hace fallar el programa con
    # AttributeError, porque Votantes no tiene getEmail().
    @unittest.expectedFailure
    def test_registrar_y_consultar_votante(self):
        r = ejecutar(
            "2", "1", "1", "Luis", "Bogotá", "0", "Mesa 3", "luis@ejemplo.com",
            "2", "2", "1",
            "3",
        )
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn("luis@ejemplo.com", r.stdout)


if __name__ == "__main__":
    unittest.main()
