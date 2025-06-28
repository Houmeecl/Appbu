# Guía de Instalación VecinoXpress

## 📱 1. Instalación en Terminal POS Android

### Requisitos del Dispositivo
- Android 7.0 o superior
- 2GB RAM mínimo
- Cámara frontal
- GPS activo
- Conexión a internet (WiFi o datos móviles)

### Pasos de Instalación

#### 1.1 Habilitar Fuentes Desconocidas
1. Ir a **Configuración** → **Seguridad**
2. Activar **"Fuentes desconocidas"** o **"Instalar apps desconocidas"**
3. Aceptar advertencia de seguridad

#### 1.2 Descargar e Instalar APK
1. Abrir navegador Chrome en el dispositivo
2. Ir a: `https://vecinoxpress.cl/download/pos`
3. Descargar `VecinoXpress_POS_v1.0.apk`
4. Abrir archivo descargado desde notificaciones
5. Tocar **"Instalar"**
6. Esperar instalación completa

#### 1.3 Configuración Inicial
1. Abrir app **VecinoXpress POS**
2. Ingresar credenciales del terminal:
   - **Terminal ID**: (proporcionado por admin)
   - **Access Key**: (clave única del terminal)
3. Permitir permisos solicitados:
   - ✅ Cámara (obligatorio)
   - ✅ Ubicación (obligatorio)
   - ✅ Almacenamiento
   - ✅ Internet

#### 1.4 Verificación
1. La app mostrará **"Terminal Activo"**
2. Verificar indicador GPS activo
3. Probar cámara con botón de prueba
4. Terminal listo para operar

### Modo Rural (Offline)
1. En la app, ir a **Configuración** → **Modo Rural**
2. Activar **"Trabajo sin conexión"**
3. Los documentos se guardarán localmente
4. Se sincronizarán automáticamente al recuperar señal

---

## 💻 2. Instalación Panel Certificador (Tablet)

### Requisitos de la Tablet
- Android 8.0+ o iPad iOS 12+
- Pantalla 10" mínimo (recomendado)
- Orientación horizontal
- Navegador Chrome/Safari actualizado
- Conexión WiFi estable

### Instalación Web App

#### 2.1 Acceso Inicial
1. Abrir Chrome/Safari
2. Navegar a: `https://notarypro.cl/certificador`
3. Ingresar con credenciales:
   - **Usuario**: CERT001
   - **Clave**: cert123

#### 2.2 Instalar como App (Android)
1. En Chrome, tocar menú **⋮** (3 puntos)
2. Seleccionar **"Agregar a pantalla de inicio"**
3. Nombrar: **"NotaryPro Certificador"**
4. Tocar **"Agregar"**
5. Aparecerá ícono en pantalla principal

#### 2.3 Instalar como App (iPad)
1. En Safari, tocar botón **Compartir** ⬆️
2. Seleccionar **"Añadir a pantalla de inicio"**
3. Nombrar: **"NotaryPro Certificador"**
4. Tocar **"Añadir"**

#### 2.4 Configuración eToken USB
1. Conectar eToken SafeNet 5110 al puerto USB
2. En la app, ir a **Configuración** → **eToken**
3. Ingresar PIN del token
4. Verificar luz verde en dispositivo
5. Token listo para firmas FEA

### Modo Atención Híbrida
1. En panel certificador, activar pestaña **"Videollamadas"**
2. Permitir permisos de cámara y micrófono
3. Sistema mostrará cola de clientes remotos
4. Click en **"Iniciar Videollamada"** para atender

---

## 🖥️ 3. Instalación Panel Administrador

### Acceso Web
1. Navegador Chrome/Edge/Firefox
2. Ir a: `https://vecinoxpress.cl/admin`
3. Credenciales:
   - **Usuario**: admin001
   - **Clave**: 123456

### Funciones Disponibles
- Gestión de usuarios
- Registro de terminales POS
- Monitoreo en tiempo real
- Reportes y estadísticas

---

## 👨‍💼 4. Instalación Panel Supervisor

### Acceso Web
1. Navegador moderno
2. Ir a: `https://vecinoxpress.cl/supervisor`
3. Credenciales:
   - **Usuario**: SUP001
   - **Clave**: super456

### Funciones
- Subir plantillas de documentos
- Gestionar precios
- Supervisar operaciones

---

## 🔧 Solución de Problemas

### Terminal POS no conecta
1. Verificar conexión internet
2. Revisar GPS activado
3. Confirmar Terminal ID correcto
4. Reiniciar app

### eToken no reconocido
1. Desconectar y reconectar USB
2. Verificar drivers instalados
3. Probar otro puerto USB
4. Reiniciar navegador

### Videollamadas con problemas
1. Verificar permisos cámara/micrófono
2. Cerrar otras apps que usen cámara
3. Mejorar conexión WiFi
4. Usar auriculares para mejor audio

---

## 📞 Soporte Técnico

### Horario de Atención
Lunes a Viernes: 8:00 - 20:00
Sábados: 9:00 - 14:00

### Contacto
- WhatsApp: +56 9 1234 5678
- Email: soporte@vecinoxpress.cl
- Chat en vivo: En la app

### Información para Soporte
Al contactar, tener listo:
- Terminal ID
- Tipo de dispositivo
- Versión de Android/iOS
- Descripción del problema
- Captura de pantalla si aplica

---

## 🔐 Seguridad

### Recomendaciones
1. No compartir credenciales
2. Cerrar sesión al terminar
3. Actualizar app cuando se notifique
4. Usar WiFi seguro (con contraseña)
5. No instalar apps no autorizadas en terminal POS

### Respaldo de Datos
- Modo rural guarda localmente hasta 7 días
- Sincronización automática cada 30 minutos con conexión
- Backup diario en servidores seguros

---

## 📋 Checklist Post-Instalación

### Terminal POS ✓
- [ ] App instalada y abierta
- [ ] Credenciales ingresadas
- [ ] GPS funcionando
- [ ] Cámara probada
- [ ] Primer documento de prueba creado

### Panel Certificador ✓
- [ ] Acceso web funcionando
- [ ] eToken conectado y reconocido
- [ ] Vista de documentos pendientes
- [ ] Firma de prueba realizada

### Verificación Final ✓
- [ ] Comunicación POS ↔ Certificador
- [ ] Documentos aparecen en panel
- [ ] Notificaciones funcionando
- [ ] Modo rural activable

---

*Versión 1.0 - Enero 2025*
*VecinoXpress - Documentos legales al alcance de todos*