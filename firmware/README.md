# Firmware ESP32 para el Laboratorio HTTP (Aulas y Salas)

Este directorio contiene los bocetos (sketches) de Arduino listos para compilar y flashear en las tarjetas ESP32 de los estudiantes.

---

## 📂 Proyectos Disponibles

### 1. `esp32_dht11_student/` (Aula DHT11 - Monitoreo Climático)
- **Sensor**: DHT11 (Temperatura y Humedad).
- **Pin de Datos**: `GPIO 4`.
- **Ruta del Servidor**: `POST /api/dht11`.
- **Librería**: "DHT sensor library" por Adafruit.
- **Función**: Envía lecturas de temperatura y humedad en vivo para proyectar a cada estudiante en la pantalla del aula.

### 2. `esp32_potentiometer_student/` (Sala Virtual - Control de Iluminación Colectiva)
- **Sensor**: Potenciómetro rotativo miniatura (10kΩ recomendado).
- **Pin Analógico**: `GPIO 34` (Bloque ADC1).
- **Ruta del Servidor**: `POST /api/dimmer`.
- **Librería**: Ninguna externa requerida (usa `WiFi.h` y `HTTPClient.h` nativas del ESP32).
- **Función**: Al girar la perilla analógica, cada alumno regula la intensidad de su lámpara individual y contribuye al nivel general de iluminación de la sala falsa.

### 3. `esp32_hysr05_student/` (Radar Táctico - Sensor Ultrasónico de Proximidad)
- **Sensor**: HY-SR05 (o HC-SR04).
- **Pines**: `TRIG -> GPIO 5`, `ECHO -> GPIO 18`.
- **Ruta del Servidor**: `POST /api/proximity`.
- **Librería**: Ninguna externa requerida.
- **Función**: Mide el tiempo de vuelo (ToF) de ondas a 40 kHz para calcular la distancia a obstáculos y ubica a cada estudiante en el radar interactivo colectivo.

---

## 🔌 Conexión de Hardware

### A) Potenciómetro Rotativo (Sala Virtual)
```
        +---------------------------------------------+
        |                  ESP32                      |
        |                                             |
        |  [GPIO 34] <--- Pin 2 (Wiper central Pot)   |
        |  [3V3]     ---> Pin 1 del potenciómetro     |
        |  [GND]     ---> Pin 3 del potenciómetro     |
        |  [GPIO 2]  ---> LED azul de actividad       |
        +---------------------------------------------+
```

### B) Sensor Ultrasónico HY-SR05 / HC-SR04 (Radar)
```
        +---------------------------------------------+
        |                  ESP32                      |
        |                                             |
        |  [GPIO 5]  ---> Pin TRIG (Disparo 10µs)     |
        |  [GPIO 18] <--- Pin ECHO (Pulso de retorno) |
        |  [5V/VIN]  ---> Pin VCC del HY-SR05         |
        |  [GND]     ---> Pin GND común               |
        |  [GPIO 2]  ---> LED azul de actividad       |
        +---------------------------------------------+
```

---

## 🚀 Pasos para los Estudiantes en Arduino IDE
1. Abrir **Arduino IDE**.
2. Ir a **Archivo > Abrir** y seleccionar el sketch correspondiente:
   - `firmware/esp32_dht11_student/esp32_dht11_student.ino` (Clase Clima DHT11).
   - `firmware/esp32_potentiometer_student/esp32_potentiometer_student.ino` (Clase Iluminación / Dimmer).
   - `firmware/esp32_hysr05_student/esp32_hysr05_student.ino` (Clase Radar de Proximidad HY-SR05).
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
