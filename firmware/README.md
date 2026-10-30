# Firmware ESP32 para el Laboratorio HTTP (Aulas y Salas)

Este directorio contiene los bocetos (sketches) de Arduino listos para compilar y flashear en las tarjetas ESP32 de los estudiantes.

---

## 📂 Proyectos Disponibles

### 1. `esp32_dht11_student/` (Aula DHT11 - Monitoreo Climático)
- **Sensor**: DHT11 (Temperatura y Humedad).
- **Pin de Datos**: `GPIO 4`.
- **Ruta del Servidor**: `POST /api/dht11`.
- **Librería**: "DHT sensor library" por Adafruit.
- **Función**: Envía lecturas de temperatura y humedad en vivo para mostrar a cada estudiante en la pantalla del aula.

### 2. `esp32_potentiometer_student/` (Sala Virtual - Control de Iluminación Colectiva)
- **Sensor**: Potenciómetro rotativo miniatura (10kΩ recomendado).
- **Pin Analógico**: `GPIO 34` (Bloque ADC1).
- **Ruta del Servidor**: `POST /api/dimmer`.
- **Librería**: Ninguna externa requerida (usa `WiFi.h` y `HTTPClient.h` nativas del ESP32).
- **Función**: Al girar la perilla analógica, cada alumno regula la intensidad de su lámpara individual y contribuye al nivel general de iluminación de la sala falsa.

---

## 🔌 Conexión del Potenciómetro Rotativo (Sala Virtual)

```
        +---------------------------------------------+
        |                  ESP32                      |
        |                                             |
        |  [GPIO 34] <--- Pin 2 (Wiper central Pot)   |
        |                                             |
        |  [3V3]     ---> Pin 1 del potenciómetro     |
        |  [GND]     ---> Pin 3 del potenciómetro     |
        |                                             |
        |  [GPIO 2]  ---> LED azul de actividad       |
        +---------------------------------------------+
```

### 🧠 Lección Pedagógica para los Estudiantes (ADC1 vs ADC2):
> El ESP32 cuenta con dos convertidores analógico-digitales: **ADC1** y **ADC2**.
> Mientras el radio **Wi-Fi** está transmitiendo datos, el **ADC2 queda deshabilitado**.
> Por este motivo, cualquier potenciómetro o sensor analógico con Wi-Fi SIEMPRE debe conectarse a pines del **ADC1** (`GPIO 32, 33, 34, 35, 36 o 39`).

---

## 🚀 Pasos para los Estudiantes en Arduino IDE
1. Abrir **Arduino IDE**.
2. Ir a **Archivo > Abrir** y seleccionar:
   - `firmware/esp32_dht11_student/esp32_dht11_student.ino` (para la clase de Clima/DHT11), o
   - `firmware/esp32_potentiometer_student/esp32_potentiometer_student.ino` (para la clase de Iluminación/Sala Virtual).
3. Cambiar en la parte superior del código:
   ```cpp
   const char* STUDENT_ID   = "208420915";       // Tu carné o ID
   const char* STUDENT_NAME = "Brandon Zarate";  // Tu nombre
   const char* DESK_NUMBER  = "Mesa 1";          // Tu mesa

   const char* WIFI_SSID     = "RedDelAula";
   const char* WIFI_PASSWORD = "PasswordAula";
   const char* SERVER_BASE_URL = "http://192.168.100.2:3000";
   ```
4. Conectar el ESP32 por USB y presionar **Subir (Upload)**.
5. Abrir el **Monitor Serie** a **115200 baudios** para ver los requests HTTP en tiempo real.
