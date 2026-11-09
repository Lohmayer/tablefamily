# Guion de presentación — TableFamily, Semana 3

Duración orientativa: 10 a 12 minutos, incluyendo navegación. Las indicaciones entre corchetes son acciones en pantalla; no es necesario leerlas.

## 1. Presentación e inicio

[Abre el proyecto con Live Server y muestra Inicio.]

Hola, profesor. Mi nombre es Andrés Price y en este video presentaré TableFamily, mi proyecto de tienda de juegos de mesa para la primera evaluación sumativa de Desarrollo Full Stack II.

El proyecto utiliza HTML, CSS, JavaScript y Bootstrap 5. De acuerdo con el alcance confirmado para esta entrega, las cuentas, los productos y las compras funcionan de manera simulada, sin backend ni base de datos real.

[Muestra el logo, el menú y las categorías. Ingresa a una categoría.]

Desde Inicio podemos explorar las categorías Estrategia, Familiares, Cartas y Cooperativos. Cada juego presenta su imagen, descripción, precio y disponibilidad. Cuando corresponde, también se muestra su descuento y precio final.

El encabezado y el pie de página se reutilizan como componentes compartidos. La navegación entre categorías incorpora la animación que trabajé desde las entregas anteriores.

## 2. Registro y validaciones

[Abre Iniciar sesión y selecciona Abrir cuenta.]

El formulario de registro solicita nombre completo, nombre de usuario, correo, contraseña, confirmación y fecha de nacimiento. La dirección de despacho es opcional.

El botón Validar registro permanece desactivado mientras no se cumplan todos los requisitos.

[Escribe un correo incorrecto. Luego corrígelo. En contraseña escribe primero abc y después Partida123.]

La contraseña debe tener entre seis y dieciocho caracteres, al menos una mayúscula, una minúscula y un número. Los indicadores cambian a medida que se cumple cada regla.

[Escribe una confirmación distinta y después hazla coincidir. Selecciona primero una fecha que no cumpla la edad mínima y después una válida.]

La confirmación debe coincidir con la contraseña y la persona debe tener al menos trece años cumplidos. La validación considera el mes y el día del cumpleaños.

[Completa los demás campos con datos ficticios y un usuario y correo que todavía no existan. Envía el registro.]

Cuando todos los datos son válidos, se puede crear la cuenta simulada. También se comprueba que el nombre de usuario y el correo no estén registrados.

## 3. Recuperación e inicio de sesión

[Abre Recuperar contraseña. Prueba un correo incorrecto y luego uno con formato válido. Envía.]

La recuperación valida el correo y devuelve un mensaje por pantalla. No se envían correos reales, tal como se definió para esta entrega.

[Regresa al login. Ingresa un usuario inexistente y una contraseña. Envía.]

En el inicio de sesión, completar un campo no significa que las credenciales sean correctas. Por eso no se muestra un ticket verde solo por escribir. Si el acceso falla, el mensaje de usuario o contraseña incorrectos aparece en rojo.

[Inicia sesión con una cuenta de cliente existente. En tu copia puede ser Price; usa su contraseña correspondiente.]

Ahora ingreso con una cuenta válida de cliente. El sitio muestra las opciones correspondientes a este rol.

## 4. Perfil, carrito y compra simulada

[En Mi cuenta, modifica un dato del perfil y guarda.]

El cliente puede actualizar su perfil. Los cambios se validan y se guardan en los datos locales de la demostración.

[Entra a una categoría y agrega dos juegos. Abre el carrito.]

El carrito permite agregar juegos, modificar cantidades y quitar productos. Los totales se recalculan con los precios y descuentos vigentes, y la cantidad está limitada por el stock disponible.

[Modifica una cantidad y quita una línea. Conserva al menos un juego para comprar.]

Agregar un juego al carrito no descuenta existencias. El stock se actualiza cuando se confirma la compra.

[Abre la confirmación. Muestra los métodos simulados y las opciones de entrega. Si eliges despacho, completa la dirección. Acepta la simulación y confirma.]

La confirmación valida los datos de entrega y el reconocimiento de que se trata de una compra simulada. No se solicitan datos bancarios reales ni se realizan cobros.

Al confirmar, se registra el pedido, se descuenta el stock y se vacía el carrito de esa cuenta.

[Abre Mis compras y despliega el detalle del pedido.]

El historial muestra las compras asociadas al cliente. El detalle conserva los productos, cantidades y precios del momento de la compra, aunque después cambie el catálogo.

## 5. Administración de productos e inventario

[Cierra sesión e ingresa con admin y Admin123.]

El administrador accede a un panel diferente, desde el que puede gestionar productos, inventario y clientes, y consultar los pedidos registrados.

[Abre Agregar juego. Completa los datos con un nombre nuevo.]

Para agregar un juego se solicitan nombre, categoría, descripción, precio, descuento, stock e imagen. Los formularios comprueban los campos obligatorios y los valores numéricos permitidos.

[Pulsa Subir foto desde mi computador. Selecciona una imagen PNG, JPG o WebP de hasta 5 MB y muestra la vista previa. Guarda el juego.]

Además de elegir una imagen existente, puedo seleccionar una foto desde mi computador. Se procesa para reducir su tamaño y se guarda con el producto en los datos locales de esta simulación.

[Edita el juego y modifica precio, descuento o stock. Guarda. Luego muestra el juego en su categoría y regresa al panel.]

El catálogo y la administración utilizan los mismos productos. Por eso los cambios guardados se reflejan en la tienda.

[Muestra Retirar y su confirmación. Retira el juego y después vuelve a publicarlo.]

Retirar un juego lo oculta del catálogo y conserva sus datos para poder publicarlo nuevamente.

## 6. Gestión de usuarios y pedidos

[En Usuarios, abre Editar en una cuenta de cliente. Prueba un correo inválido, corrígelo y guarda.]

La gestión de usuarios permite editar los datos de clientes con las mismas validaciones del perfil. También evita repetir nombres de usuario o correos de otras cuentas.

[Desactiva una cuenta de prueba y confirma. Después vuelve a activarla.]

El cambio de estado requiere confirmación. Una cuenta inactiva no puede iniciar sesión. Al reactivarla se conservan sus datos, contraseña y compras. Desde esta gestión no se cambian roles ni se desactivan cuentas de administrador.

[En Pedidos de la tienda, muestra el pedido creado durante el video y abre su detalle.]

Los pedidos que registra el cliente también están disponibles para su consulta desde el panel del administrador.

## 7. Responsividad y explicación del código

[Activa el modo responsivo del navegador. Revisa Inicio, una categoría, el modal y el carrito en anchos de computador, tablet y celular.]

Bootstrap 5 está integrado en todas las páginas. Utilizo su grilla y utilidades para distribuir el contenido según el ancho disponible, además de sus formularios, botones y modales. El CSS propio conserva los colores y la identidad visual de TableFamily.

[En VS Code, muestra componentes, css y js.]

El proyecto está separado por responsabilidades. En componentes están el encabezado y el footer compartidos. Los estilos están organizados en archivos CSS según su función.

Dentro de JavaScript, datos contiene la información ficticia inicial; servicios contiene las operaciones de sesión, usuarios, productos, carrito y pedidos; validaciones reúne las reglas de los formularios; y vistas controla la interacción y los cambios en pantalla.

[Muestra validarRegistro y requisitosClave en js/validaciones/formularios.js. Luego mostrarErrores en js/vistas/formularios.js.]

Aquí se aprecia la separación entre comprobar los datos y representar sus errores en la interfaz.

[Muestra confirmarCompra en js/servicios/pedidos.js.]

La confirmación vuelve a revisar precios, cantidades y stock antes de registrar el pedido. Además, identifica la operación para evitar duplicar una compra al repetir el envío.

Los datos de la demostración se guardan en localStorage y la sesión se identifica mediante sessionStorage. Estos controles simulan el comportamiento solicitado; cuando se incorpore un backend, la autenticación, los permisos y las operaciones deberán comprobarse en el servidor.

## 8. Versionamiento y cierre

[Muestra el repositorio GitHub y el tablero Trello con su estado real actualizado para la entrega.]

En GitHub está el código del proyecto y su historial de cambios. En Trello se encuentra la organización de las tareas y el registro de las dificultades trabajadas.

Con esta demostración presento el recorrido del cliente y del administrador, el registro y sus validaciones, la recuperación simulada, el perfil, el carrito, las compras, el historial y la gestión de productos y usuarios.

Muchas gracias.
