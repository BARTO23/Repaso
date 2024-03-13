#Contructor votantes

class Votantes:
  def __init__(self, id, nombre, ciudad, estado, puesto_votaciones, email):
    self.id = id
    self.nombre = nombre
    self.ciudad = ciudad
    self.estado = 0
    self.puesto_votaciones = puesto_votaciones
    
  #Getters
  def getId(self):
    return self.id
  
  def getNombre(self):
    return self.nombre
  
  def getCiudad(self):
    return self.ciudad
  
  def getEstado(self):
    return self.estado
  
  def getPuestoVotaciones(self):
    return self.puesto_votaciones
  
  #Setters
  def setId(self, id):
    self.id = id
    
  def setNombre(self, nombre):
    self.nombre = nombre
    
  def setCiudad(self, ciudad):
    self.ciudad = ciudad
    
  def setEstado(self, estado):
    self.estado = estado  
  
  def setPuestoVotaciones(self, puesto_votaciones):
    self.puesto_votaciones = puesto_votaciones
