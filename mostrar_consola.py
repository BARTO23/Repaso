def print_box(message):
    message_length = len(message)
    box_width = message_length + 4
    
    # Imprimir borde superior
    print("╔" + "═" * box_width + "╗")
    
    # Imprimir mensaje con borde lateral
    print("║ " + message + " ║")
    
    # Imprimir borde inferior
    print("╚" + "═" * box_width + "╝")

# Ejemplo de uso
print_box("Información importante \n 1. Nombre: Juan")

