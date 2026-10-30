# ESP32 HTTP Lab - Arquitectura Web e IoT con Dokploy & Next.js

Plataforma educativa interactiva diseñada para explicar y demostrar a estudiantes cómo funciona el protocolo **HTTP (Hypertext Transfer Protocol)**, la arquitectura **Cliente-Servidor**, las **APIs REST** y el intercambio de telemetría bidireccional entre microcontroladores embebidos (**ESP32**) y servidores web modernos desplegados con **Dokploy**.

---

## 🚀 Características Principales

1. **Monitor de Sensores en Vivo (`/dashboard`):**
   - Visualización en tiempo real de telemetría: Sensor de **Luz (LDR)** en Lux y **Proximidad (HC-SR04)** en cm.
   - Indicadores visuales, barras de distancia ultrasónica, niveles lumínicos y alertas automáticas.
   - Historial en vivo de paquetes recibidos desde el ESP32.

2. **Simulador de Señales HTTP POST (`/simulator`):**
   - Permite a los estudiantes enviar lecturas de sensores simuladas mediante peticiones reales `POST /api/sensors`.
   - Controles interactivos tipo slider para ajustar luminosidad y distancia.
   - Inspección simultánea del paquete de solicitud (`Request Headers`, `Payload JSON`) y la respuesta del servidor (`HTTP 201 Created`).
   - Modo de transmisión continua cíclica (3 segundos).

3. **Control Bidireccional de Actuadores (`/control`):**
   - Enciende o apaga remotamente el LED integrado del ESP32 (GPIO 2).
   - Modos de operación: **Automático** (evaluado por reglas del servidor en base a umbrales de luz y proximidad) o **Manual**.
   - Demuestra el patrón IoT de *piggybacking*: el ESP32 recibe órdenes del actuador dentro del cuerpo de la respuesta HTTP de su propio POST.

4. **Inspector de Tráfico HTTP en Vivo (`/inspector`):**
   - Visor de auditoría tipo Wireshark/Swagger para la clase.
   - Registro de métodos (`GET`, `POST`), rutas, IPs de clientes en la red local, latencias en milisegundos, cabeceras y payloads.

5. **Guía Didáctica y Firmware ESP32 (`/guide`):**
   - Código Arduino C++ (`.ino`) completo, listo para copiar y compilar en Arduino IDE o PlatformIO.
   - Diagrama de conexión y esquemático de pines.
   - Explicación de cabeceras, códigos de estado HTTP (`200 OK`, `201 Created`, `400 Bad Request`, `422 Unprocessable`).

---

## 📡 Endpoints de la API REST

| Método | Ruta | Descripción | Payload / Parámetros |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/sensors` | Recibe telemetría de luz y proximidad del ESP32 o simulador. Devuelve estado de actuadores. | `{"deviceId":"esp32-1","light":450,"proximity":18.5}` |
| `GET` | `/api/sensors` | Consulta la última lectura registrada y el historial de paquetes. | `?limit=30` |
| `GET` | `/api/actuators` | Consulta el estado actual del LED (GPIO 2) y umbrales de alerta. | Ninguno |
| `POST` | `/api/actuators` | Cambia el estado del actuador o umbrales desde la interfaz web. | `{"led":true,"ledMode":"manual"}` |
| `GET` | `/api/logs` | Lista de solicitudes HTTP procesadas para el inspector didáctico. | `?limit=50` |
| `DELETE` | `/api/logs` | Limpia los registros de auditoría para una nueva sesión de clase. | Ninguno |
| `GET` | `/api/health` | Verificación de salud para Dokploy / Docker container. | Ninguno |

---

## 🛠️ Despliegue con Dokploy en Red Local (LAN)

Dokploy ejecuta el proyecto dentro de un contenedor Docker multi-stage optimizado (basado en el patrón de `MotorScopeCR_Web`).

### Paso 1: Conectar todo a la misma red WiFi
Asegúrate de que:
- La máquina/servidor donde corre Dokploy esté conectada al router local.
- Los ESP32 de los alumnos estén conectados al mismo SSID WiFi (banda **2.4 GHz**).

### Paso 2: Identificar la IP local del servidor
En la terminal del servidor Dokploy:
```bash
hostname -I || ip a
```
Anota la dirección IP local (ejemplo: `192.168.1.100`).

### Paso 3: Configurar la aplicación en Dokploy
1. Ve al panel web de Dokploy y selecciona **New Application**.
2. Fuente: **Git Repository** (o sube este directorio).
3. Build Type: **Dockerfile** (el `Dockerfile` multi-stage ya está configurado con `node:20-alpine` y puerto 3000).
4. Configuración de puertos: Mapea el puerto `3000:3000` del host.
5. Presiona **Deploy**.

### Paso 4: Configurar el ESP32
En el archivo `firmware/esp32_sensors_http.ino`:
```cpp
const char* WIFI_SSID     = "NOMBRE_DE_TU_WIFI";
const char* WIFI_PASSWORD = "PASSWORD_DE_TU_WIFI";
const char* SERVER_BASE_URL = "http://192.168.1.100:3000"; // IP local del servidor Dokploy
```

---

## 💻 Ejecución Local de Desarrollo

Si deseas probar el proyecto directamente en tu entorno local antes de Dokploy:

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo en puerto 3000
npm run dev

# 3. Abrir en el navegador
# http://localhost:3000
```

Para probar con Docker Compose localmente:
```bash
docker compose up --build
```

---

## 🔌 Conexión de Hardware ESP32

```
       +---------------------------------------------+
       |                  ESP32                      |
       |                                             |
       |  [GPIO 34] <--- Divisor LDR (Señal analógica)|
       |                                             |
       |  [GPIO 5]  ---> HC-SR04 Trigger             |
       |  [GPIO 18] <--- HC-SR04 Echo (3.3V)         |
       |                                             |
       |  [GPIO 2]  ---> LED integrado en placa       |
       |                                             |
       |  [3V3]     ---> VCC del LDR                 |
       |  [GND]     ---> Tierra común (GND)          |
       |  [VIN/5V]  ---> VCC del HC-SR04             |
       +---------------------------------------------+
```

> **Nota para los estudiantes:** El ESP32 deshabilita el convertidor ADC2 cuando el WiFi está activo. Por esta razón, el sensor analógico LDR siempre debe conectarse a un pin del **ADC1** (GPIO 34).
