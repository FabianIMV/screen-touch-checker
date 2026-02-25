# 🍏 Guía de Publicación en App Store

Esta guía describe los pasos necesarios para compilar y publicar **Touch Diagnostics** en la Apple App Store usando EAS (Expo Application Services).

## 1. Requisitos Previos
- Cuenta de Desarrollador de Apple activa (Apple Developer Program).
- Haber iniciado sesión en EAS CLI (`npx eas-cli login`).
- El proyecto debe estar vinculado a EAS (`eas.json` configurado).

## 2. Configuración del App.json
Asegúrate de que el archivo `app.json` tenga la información correcta para producción:
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.tuempresa.touchdiagnostics",
      "buildNumber": "1.0.0",
      "infoPlist": {
        "NSCameraUsageDescription": "Not used",
        "UIRequiresFullScreen": true
      }
    }
  }
}
```

## 3. Generar Credenciales
Ejecuta el siguiente comando para que EAS gestione los certificados y perfiles de aprovisionamiento automáticamente:
```bash
eas credentials
```
Sigue las instrucciones en pantalla e inicia sesión con tu Apple ID.

## 4. Compilar para Producción
Para generar el archivo `.ipa` (o enviarlo directamente a TestFlight/App Store Connect):
```bash
eas build --platform ios --profile production
```

## 5. Enviar a App Store Connect
Una vez que la compilación termine exitosamente, puedes enviarla a Apple:
```bash
eas submit -p ios
```

## 6. Revisión en App Store Connect
1. Ve a [App Store Connect](https://appstoreconnect.apple.com/).
2. Selecciona tu aplicación.
3. Añade capturas de pantalla, descripción, palabras clave y URL de soporte.
4. Selecciona la compilación que acabas de subir.
5. Envía para revisión (Submit for Review).

## Notas Importantes
- **Privacidad:** Apple es estricto con los permisos. Si añades alguna librería que use cámara, micrófono o ubicación, debes justificarlo en el `infoPlist`.
- **Iconos:** Asegúrate de que `icon.png` y `splash-icon.png` cumplan con las resoluciones requeridas por Apple (sin transparencias para el icono de iOS).
