#costructor candidatos
class candidatos:
  def __init__(self, numero, nombre, propuesta, partido):
    self.numero = numero
    self.nombre = nombre
    self.propuesta = propuesta
    self.partido = partido
    
  #Getters
  def getNumero(self):
    return self.numero
  
  def getNombre(self):
    return self.nombre
  
  def getPropuesta(self):
    return self.propuesta
  
  def getPartido(self):
    return self.partido
  
  #Setters
  def setNumero(self, numero):
    self.numero = numero
    
  def setNombre(self, nombre):
    self.nombre = nombre  
    
  def setPropuesta(self, propuesta):
    self.propuesta = propuesta
    
  def setPartido(self, partido):
    self.partido = partido
  