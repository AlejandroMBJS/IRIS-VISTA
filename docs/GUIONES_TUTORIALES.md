# IRIS VISTA - Guiones para Tutoriales en Video

## Estructura de Videos Recomendada
- **Duración:** 1-3 minutos por video
- **Resolución:** 1920x1080
- **Formato:** MP4

---

## VIDEO 1: Registro de Usuario Nuevo
**Duración estimada:** 1 min
**Rol:** Usuario nuevo

### Pasos a mostrar:
1. Abrir la página de login (`/login`)
2. Click en "Register" / "Registrarse"
3. Llenar formulario:
   - Número de empleado
   - Nombre completo
   - Email corporativo
   - Contraseña
4. Click en "Register"
5. Mostrar mensaje de "Pending approval"
6. **Narración:** "Tu cuenta será revisada por un administrador"

---

## VIDEO 2: Login y Navegación Básica
**Duración estimada:** 1.5 min
**Rol:** Empleado

### Pasos a mostrar:
1. Ingresar credenciales en `/login`
2. Click "Sign In"
3. Mostrar el Dashboard
4. Recorrer el menú lateral:
   - Dashboard
   - New Request (Nueva Solicitud)
   - My Requests (Mis Solicitudes)
5. Mostrar el selector de idioma (EN/中文/ES)
6. Mostrar el menú de usuario (perfil, logout)

---

## VIDEO 3: Crear Solicitud de Compra (Producto Externo)
**Duración estimada:** 2.5 min
**Rol:** Empleado

### Pasos a mostrar:
1. Ir a "New Request" / "Nueva Solicitud"
2. **Opción A - URL externa:**
   - Pegar URL de Amazon México
   - Esperar extracción automática de datos
   - Mostrar: imagen, título, precio extraídos
3. Ajustar cantidad con botones -/+
4. Click "Add to Cart" / "Agregar al Carrito"
5. Repetir con otro producto (opcional)
6. Revisar carrito en la parte inferior
7. Escribir justificación
8. Seleccionar urgencia (Normal/Urgente)
9. Click "Submit Request" / "Enviar Solicitud"
10. Mostrar confirmación

---

## VIDEO 4: Crear Solicitud desde Catálogo Interno
**Duración estimada:** 2 min
**Rol:** Empleado

### Pasos a mostrar:
1. Ir a "New Request"
2. Click "Select from Catalog" / "Seleccionar del Catálogo"
3. Navegar categorías o usar búsqueda
4. Seleccionar cantidad con botones -/+
5. Seleccionar varios productos
6. Click "Add Selected" / "Agregar Seleccionados"
7. Revisar carrito
8. Completar justificación
9. Enviar solicitud

---

## VIDEO 5: Ver Mis Solicitudes y Progreso
**Duración estimada:** 1.5 min
**Rol:** Empleado

### Pasos a mostrar:
1. Ir a "My Requests" / "Mis Solicitudes"
2. Mostrar tarjetas de estadísticas (Pending, Approved, etc.)
3. Usar filtros por estado
4. Usar filtro de fecha
5. Click en una solicitud para ver detalles
6. Mostrar:
   - Productos de la solicitud
   - Estado de cada item
   - Barra de progreso de compra (si está aprobada)
   - Historial de la solicitud
7. Cerrar modal

---

## VIDEO 6: Aprobar Solicitudes (General Manager)
**Duración estimada:** 2.5 min
**Rol:** General Manager

### Pasos a mostrar:
1. Login como GM
2. Ir a "Approvals" / "Aprobaciones"
3. Mostrar estadísticas de aprobaciones pendientes
4. Revisar lista de solicitudes pendientes
5. Click en una solicitud para ver detalles:
   - Productos solicitados
   - Justificación
   - Información del solicitante
6. **Aprobar:**
   - Click "Approve"
   - Agregar nota (opcional)
   - Confirmar
7. **Rechazar:**
   - Click "Reject"
   - Escribir motivo de rechazo (obligatorio)
   - Confirmar
8. **Solicitar información:**
   - Click "Request Info"
   - Escribir qué información necesita
   - Confirmar
9. Mostrar que el solicitante recibirá notificación

---

## VIDEO 7: Generar Resumen con IA (General Manager)
**Duración estimada:** 1 min
**Rol:** General Manager

### Pasos a mostrar:
1. En la página de Approvals
2. Seleccionar una solicitud con múltiples productos
3. Click en "Generate AI Summary" / "Generar Resumen IA"
4. Esperar generación
5. Mostrar el resumen generado
6. Explicar que ayuda a tomar decisiones más rápido

---

## VIDEO 8: Gestión de Órdenes Aprobadas (Admin/Purchase)
**Duración estimada:** 3 min
**Rol:** Admin o Purchase Admin

### Pasos a mostrar:
1. Login como Admin
2. Ir a "Admin" > "Orders" / "Órdenes"
3. Mostrar filtros (All, Amazon Cart, Pending, Purchased, etc.)
4. **Marcar item como comprado:**
   - Expandir una orden
   - Click en checkmark de un producto individual
   - Confirmar en modal
   - Mostrar que la barra de progreso se actualiza
5. **Marcar todos como comprados:**
   - Click "Mark All Purchased"
   - Confirmar en modal
6. **Marcar orden completa como comprada:**
   - Click "Mark Purchased"
   - Ingresar número de orden
   - Agregar notas (opcional)
   - Confirmar
7. **Marcar como entregada:**
   - En una orden ya comprada
   - Click "Mark Delivered"
   - Agregar notas de entrega
   - Confirmar
8. Mostrar notas internas (editar)

---

## VIDEO 9: Gestión de Inventario
**Duración estimada:** 2 min
**Rol:** Admin o Supply Chain Manager

### Pasos a mostrar:
1. Ir a "Inventory" / "Inventario"
2. Mostrar lista de productos
3. Usar búsqueda
4. Filtrar por categoría
5. **Crear producto:**
   - Click "Add Product"
   - Llenar formulario (SKU, nombre, precio, stock, etc.)
   - Subir imagen
   - Guardar
6. **Editar producto:**
   - Click en un producto
   - Modificar datos
   - Guardar
7. **Ajustar stock:**
   - Usar botones de ajuste rápido
8. Importación masiva (mencionar)

---

## VIDEO 10: Gestión de Usuarios (Admin)
**Duración estimada:** 2 min
**Rol:** Admin

### Pasos a mostrar:
1. Ir a "Admin" > "Users"
2. Mostrar lista de usuarios
3. **Aprobar usuario pendiente:**
   - Ver usuarios pendientes
   - Click en usuario
   - Asignar rol
   - Asignar departamento/centro de costos
   - Aprobar
4. **Crear usuario manualmente:**
   - Click "Add User"
   - Llenar formulario
   - Guardar
5. **Editar usuario:**
   - Cambiar rol
   - Activar/Desactivar
6. Importación masiva (mencionar)

---

## VIDEO 11: Configuración del Sistema (Admin)
**Duración estimada:** 2 min
**Rol:** Admin

### Pasos a mostrar:
1. Ir a "Admin" > "Settings" o "Purchase Config"
2. **Configuración de compras:**
   - Aprobador por defecto
   - Niveles de aprobación por monto
   - Campos personalizados
3. **Configuración de notificaciones:**
   - Qué eventos envían email
   - A quién notificar
4. **Configuración de email:**
   - Servidor SMTP
   - Probar envío
5. Guardar cambios

---

## VIDEO 12: Flujo Completo (Demo End-to-End)
**Duración estimada:** 4-5 min
**Roles:** Empleado → GM → Admin

### Pasos a mostrar:
1. **Empleado crea solicitud:**
   - Login como empleado
   - Crear solicitud con 2-3 productos
   - Enviar
2. **GM aprueba:**
   - Login como GM
   - Ver notificación/solicitud pendiente
   - Revisar y aprobar
3. **Admin procesa:**
   - Login como Admin
   - Ver orden aprobada
   - Marcar productos como comprados uno por uno
   - Marcar orden como comprada
4. **Empleado ve progreso:**
   - Login como empleado
   - Ver que su solicitud muestra progreso
   - Ver items marcados como comprados
5. **Admin marca entregado:**
   - Marcar como entregado
6. **Empleado ve completado:**
   - Estado final: Delivered

---

## Consejos para Grabar

### Antes de grabar:
- [ ] Limpiar datos de prueba o usar datos de demo
- [ ] Preparar usuarios de cada rol
- [ ] Cerrar notificaciones del sistema
- [ ] Usar pantalla completa del navegador (F11)
- [ ] Seleccionar idioma apropiado

### Durante la grabación:
- [ ] Mover el mouse lentamente
- [ ] Pausar 1-2 segundos después de cada click
- [ ] No hacer clicks innecesarios
- [ ] Si te equivocas, pausa y continúa (editar después)

### Después de grabar:
- [ ] Revisar el video
- [ ] Recortar inicio y final
- [ ] Agregar subtítulos si es necesario
- [ ] Nombrar archivo descriptivamente (ej: `01_registro_usuario.mp4`)

---

## Orden Sugerido de Grabación

1. VIDEO 2: Login (base para todo)
2. VIDEO 1: Registro
3. VIDEO 3: Crear solicitud externa
4. VIDEO 4: Crear solicitud catálogo
5. VIDEO 5: Ver mis solicitudes
6. VIDEO 6: Aprobar solicitudes
7. VIDEO 8: Gestión de órdenes
8. VIDEO 9: Inventario
9. VIDEO 10: Usuarios
10. VIDEO 11: Configuración
11. VIDEO 7: IA Summary
12. VIDEO 12: Demo completa (al final cuando domines todo)
