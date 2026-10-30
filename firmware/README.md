# Guía de Conexión y Hardware para ESP32

Esta guía explica a los estudiantes cómo conectar los sensores de **Luz (LDR)** y **Proximidad (HC-SR04)** al ESP32, y cómo se comunican mediante HTTP con el servidor Next.js corriendo en Dokploy.

---

## 1. Componentes Necesarios
- 1x Tarjeta de desarrollo **ESP32** (30 pines o 38 pines).
- 1x Sensor ultrasónico **HC-SR04** (o HC-SR04P compatible con 3.3V).
- 1x Fotorresistencia **LDR** de 5mm.
- 1x Resistencia de **10kΩ** (para divisor de tensión del LDR).
- 2x Resistencias (1kΩ y 2kΩ) si se usa divisor para el pin Echo del HC-SR04 de 5V.
- 1x Protoboard y cables jumper.
- Cable micro-USB / USB-C para flashear el ESP32.

---

## 2. Diagrama de Pines (Pinout)

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

### Detalle de Conexión del LDR (Sensor de Luz):
1. Una pata del **LDR** a **3V3**.
2. La otra pata del **LDR** al pin **GPIO 34** del ESP32.
3. Desde ese mismo punto (GPIO 34), una resistencia de **10kΩ** a **GND** (Divisor de tensión pull-down).

> **Nota Didáctica para la Clase:**
> El ESP32 cuenta con dos convertidores analógico-digitales: **ADC1** y **ADC2**.
> Mientras el radio **WiFi** está transmitiendo datos, el **ADC2 queda deshabilitado**. Por este motivo, los sensores analógicos siempre deben conectarse a pines del **ADC1** (GPIOs 32, 33, 34, 35, 36 o 39).

---

### Detalle de Conexión del HC-SR04 (Sensor de Proximidad):
1. **VCC** a **VIN** (5V) del ESP32.
2. **GND** a **GND** del ESP32.
3. **Trig** al pin **GPIO 5** del ESP32.
4. **Echo** al pin **GPIO 18** del ESP32 (si tu HC-SR04 es de 5V puro, coloca un divisor simple de 1kΩ y 2kΩ para proteger el pin de 3.3V).

---

## 3. Preparación en Arduino IDE
1. Abrir **Arduino IDE**.
2. Ir a **Herramientas > Placa > ESP32 Arduino** y seleccionar tu modelo (ej. *ESP32 Dev Module*).
3. Modificar en `esp32_sensors_http.ino`:
   - `WIFI_SSID` = "Tu red WiFi"
   - `WIFI_PASSWORD` = "Tu contraseña WiFi"
   - `SERVER_BASE_URL` = "http://IP_DE_TU_SERVIDOR:3000"
4. Conectar el ESP32, seleccionar el puerto COM correspondiente y presionar **Subir (Upload)**.
5. Abrir el **Monitor Serie** a **115200 baudios** para ver el flujo HTTP en vivo.
