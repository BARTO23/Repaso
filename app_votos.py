import cls_candidatos as candidatos_modulo
import cls_votantes as votantes_modulo

lista_candidatos = []
lista_votantes = []


def fnt_consultar_votante():
    id = input("Ingrese el id del votante: ")
    for votante in lista_votantes:
        if votante.getId() == id:
            print("-------------------------------------------------------------")
            print("|" +"Id: ", votante.getId())
            print("|" +"Nombre: ", votante.getNombre())
            print("|" +"Ciudad: ", votante.getCiudad())
            print("|" +"Estado: ", votante.getEstado())
            print("|" +"Puesto de votaciones: ", votante.getPuestoVotaciones())
            print("|" +"Email: ", votante.getEmail())
            print("-------------------------------------------------------------"+"\n")
            break
        else:
            print("Votante no encontrado")
def fnt_votantes():
    print("-------------------------------------------------------------")
    print("Votantes")
    print("1. Registrar Votante")
    print("2. Consultar Votante")
    opcion = input("Ingrese una opción: ")
    if opcion == "1":
        id = input("Ingrese el id del votante: ")
        nombre = input("Ingrese el nombre del votante: ")
        ciudad = input("Ingrese la ciudad del votante: ")
        estado = input("Ingrese el estado del votante: ")
        puesto_votaciones = input("Ingrese el puesto de votaciones del votante: ")
        email = input("Ingrese el email del votante: ")
        votante = votantes_modulo.Votantes(id, nombre, ciudad, estado, puesto_votaciones, email)
        lista_votantes.append(votante)
        print("Votante registrado con éxito")
        print("-------------------------------------------------------------")
    elif opcion == "2":
        fnt_consultar_votante()
    else:
        print("Opción inválida")
def fnt_consultar_candidato():
    numero = input("Ingrese el número del candidato: ")
    for candidato in lista_candidatos:
        if candidato.getNumero() == numero:
            print("-------------------------------------------------------------")
            print("|" +"Número: ", candidato.getNumero())
            print("|" +"Nombre: ", candidato.getNombre())
            print("|" +"Propuesta: ", candidato.getPropuesta())
            print("|" +"Partido: ", candidato.getPartido())
            print("-------------------------------------------------------------"+"\n")
            break
        else:
            print("Candidato no encontrado")
def fnt_candidatos():
    print("-------------------------------------------------------------")
    print("Candidatos")
    print("1. Registrar Candidato")
    print("2. Consultar Candito")
    opcion2 = input("Ingrese una opción: ")
    
    if opcion2 == "1":
        numero = input("Ingrese el número del candidato: ")
        nombre = input("Ingrese el nombre del candidato: ")
        propuesta = input("Ingrese la propuesta del candidato: ")
        partido = input("Ingrese el partido del candidato: ")
        candidato = candidatos_modulo.candidatos(numero, nombre, propuesta, partido)
        lista_candidatos.append(candidato)
        print("Candidato registrado con éxito")
        print("-------------------------------------------------------------")
    elif opcion2 == "2":
        fnt_consultar_candidato()

while True:
    print("Menu Principal Votaciones")
    print("1. Candidatos")
    print("2. Votantes")
    print("3. Salir")
    opcion = input("Ingrese una opción: ")
    if opcion == "1":
        fnt_candidatos()
    elif opcion == "2":
        fnt_votantes()
    elif opcion == "3":
        break
    else:
        print("Opción inválida")
