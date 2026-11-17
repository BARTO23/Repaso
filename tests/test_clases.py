"""Pruebas de las clases de datos (candidatos, votantes, votos)."""
import unittest

import cls_candidatos
import cls_votantes
import cls_votos


class TestCandidatos(unittest.TestCase):
    def test_guarda_los_datos_del_constructor(self):
        c = cls_candidatos.candidatos("10", "Ana", "Más parques", "Verde")
        self.assertEqual(c.getNumero(), "10")
        self.assertEqual(c.getNombre(), "Ana")
        self.assertEqual(c.getPropuesta(), "Más parques")
        self.assertEqual(c.getPartido(), "Verde")

    def test_setters_actualizan_los_datos(self):
        c = cls_candidatos.candidatos("10", "Ana", "Más parques", "Verde")
        c.setNombre("Ana María")
        c.setPartido("Azul")
        self.assertEqual(c.getNombre(), "Ana María")
        self.assertEqual(c.getPartido(), "Azul")


class TestVotantes(unittest.TestCase):
    def nuevo(self):
        return cls_votantes.Votantes("1", "Luis", "Bogotá", 0, "Mesa 3", "luis@ejemplo.com")

    def test_guarda_los_datos_del_constructor(self):
        v = self.nuevo()
        self.assertEqual(v.getId(), "1")
        self.assertEqual(v.getNombre(), "Luis")
        self.assertEqual(v.getCiudad(), "Bogotá")
        self.assertEqual(v.getPuestoVotaciones(), "Mesa 3")

    def test_set_estado(self):
        v = self.nuevo()
        v.setEstado(1)
        self.assertEqual(v.getEstado(), 1)

    # BUG conocido: el constructor recibe `email` pero no lo guarda y no existe
    # getEmail(), aunque app_votos.py lo usa al consultar un votante.
    @unittest.expectedFailure
    def test_guarda_el_email(self):
        v = self.nuevo()
        self.assertEqual(v.getEmail(), "luis@ejemplo.com")


class TestVotos(unittest.TestCase):
    def test_guarda_los_datos_del_constructor(self):
        voto = cls_votos.Votos("10", "1", "2026-11-17", 1)
        self.assertEqual(voto.getNumeroCandidato(), "10")
        self.assertEqual(voto.getIdVotante(), "1")
        self.assertEqual(voto.getFecha(), "2026-11-17")


if __name__ == "__main__":
    unittest.main()
