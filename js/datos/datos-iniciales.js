/* Datos ficticios compartidos del mock de TableFamily. */
export const VERSION_DATOS = 1;
export const PRODUCTOS_INICIALES = [
    {
        "id": "uno",
        "nombre": "UNO",
        "categoria": "cartas",
        "descripcion": "Combina colores o números para descartar tus cartas. Usa las cartas especiales y recuerda decir UNO cuando te quede una.",
        "imagen": "img/juego-uno.png",
        "precio": 10000,
        "descuento": 20,
        "stock": 10,
        "activo": true
    },
    {
        "id": "baraja",
        "nombre": "Baraja española",
        "categoria": "cartas",
        "descripcion": "Comparte juegos tradicionales como la brisca o la escoba. Una baraja para disfrutar distintas partidas con familiares y amigos.",
        "imagen": "img/juego-baraja.png",
        "precio": 5990,
        "descuento": 0,
        "stock": 10,
        "activo": true
    },
    {
        "id": "sushi",
        "nombre": "Sushi Go!",
        "categoria": "cartas",
        "descripcion": "Elige una carta y pasa las demás. Reúne combinaciones de platos de sushi para sumar puntos durante la partida.",
        "imagen": "img/juego-sushi-go.png",
        "precio": 20000,
        "descuento": 25,
        "stock": 10,
        "activo": true
    },
    {
        "id": "pandemic",
        "nombre": "Pandemic",
        "categoria": "cooperativos",
        "descripcion": "Formen un equipo para combatir enfermedades alrededor del mundo. Coordinen sus acciones y encuentren las curas antes de que sea tarde.",
        "imagen": "img/juego-pandemic.png",
        "precio": 40000,
        "descuento": 20,
        "stock": 10,
        "activo": true
    },
    {
        "id": "isla",
        "nombre": "La Isla Prohibida",
        "categoria": "cooperativos",
        "descripcion": "Exploren una isla que comienza a hundirse. Recuperen sus tesoros y ayúdense para escapar juntos antes de que desaparezca.",
        "imagen": "img/juego-isla-prohibida.png",
        "precio": 24990,
        "descuento": 0,
        "stock": 10,
        "activo": true
    },
    {
        "id": "hanabi",
        "nombre": "Hanabi",
        "categoria": "cooperativos",
        "descripcion": "Preparen un espectáculo de fuegos artificiales dando pistas a sus compañeros. Cada jugador ve las cartas de los demás, pero no las propias.",
        "imagen": "img/juego-hanabi.png",
        "precio": 20000,
        "descuento": 25,
        "stock": 10,
        "activo": true
    },
    {
        "id": "catan",
        "nombre": "Catan",
        "categoria": "estrategia",
        "descripcion": "Construye poblados, consigue recursos e intercambia con otros jugadores para expandir tu territorio.",
        "imagen": "img/juego-catan.png",
        "precio": 40000,
        "descuento": 20,
        "stock": 10,
        "activo": true
    },
    {
        "id": "ajedrez",
        "nombre": "Ajedrez",
        "categoria": "estrategia",
        "descripcion": "Anticipa los movimientos de tu rival, protege a tu rey y prepara la jugada que te permita alcanzar el jaque mate.",
        "imagen": "img/juego-ajedrez.png",
        "precio": 24990,
        "descuento": 0,
        "stock": 10,
        "activo": true
    },
    {
        "id": "risk",
        "nombre": "Risk",
        "categoria": "estrategia",
        "descripcion": "Organiza tus tropas, defiende tus territorios y planifica tus avances para conquistar el mapa.",
        "imagen": "img/juego-risk.png",
        "precio": 50000,
        "descuento": 25,
        "stock": 10,
        "activo": true
    },
    {
        "id": "monopoly",
        "nombre": "Monopoly",
        "categoria": "familiares",
        "descripcion": "Compra propiedades, negocia con los demás jugadores y administra tu dinero mientras recorres el tablero.",
        "imagen": "img/juego-monopoly.png",
        "precio": 30000,
        "descuento": 20,
        "stock": 10,
        "activo": true
    },
    {
        "id": "jenga",
        "nombre": "Jenga",
        "categoria": "familiares",
        "descripcion": "Retira un bloque y colócalo en la parte superior de la torre. Pon a prueba tu pulso y evita que se derrumbe.",
        "imagen": "img/juego-jenga.png",
        "precio": 18990,
        "descuento": 0,
        "stock": 10,
        "activo": true
    },
    {
        "id": "dobble",
        "nombre": "Dobble",
        "categoria": "familiares",
        "descripcion": "Observa las cartas y encuentra el símbolo que tienen en común antes que los demás. Un desafío de atención y rapidez.",
        "imagen": "img/juego-dobble.png",
        "precio": 20000,
        "descuento": 25,
        "stock": 10,
        "activo": true
    }
];
export const USUARIOS_INICIALES = [
    {
        "id": "usuario-cliente-demo",
        "nombre": "Cliente de prueba",
        "usuario": "cliente",
        "correo": "cliente@example.com",
        "nacimiento": "2000-01-15",
        "direccion": "",
        "rol": "cliente",
        "activo": true,
        "claveHash": "34e422278ea745b5d87ba6592f0ea3fe32a2eb7593f5960ac72d7094fb121f3d"
    },
    {
        "id": "usuario-admin-demo",
        "nombre": "Administrador de prueba",
        "usuario": "admin",
        "correo": "admin@example.com",
        "nacimiento": "1990-05-20",
        "direccion": "",
        "rol": "administrador",
        "activo": true,
        "claveHash": "3b612c75a7b5048a435fb6ec81e52ff92d6d795a8b5a9c17070f6a63c97a53b2"
    }
];
