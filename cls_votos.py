#Constructor de la clase Votos
class Votos:
    def __init__ (self, numero_candidato, id_votante, fecha, numero_votos):
        self.numero_candidato = numero_candidato
        self.id_votante = id_votante
        self.fecha = fecha
        
    #Getters
    def getNumeroCandidato(self):
        return self.numero_candidato
    
    def getIdVotante(self):
        return self.id_votante
    
    def getFecha(self):
        return self.fecha
      
    #Setters
    def setNumeroCandidato(self, numero_candidato):
        self.numero_candidato = numero_candidato
    
    def setIdVotante(self, id_votante):
        self.id_votante = id_votante
        
    def setFecha(self, fecha):
        self.fecha = fecha
        
      