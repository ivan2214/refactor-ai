# Refactor AI

## Descripción del Proyecto

Refactor AI es una herramienta de inteligencia artificial diseñada para ayudar a desarrolladores a refactorizar y mejorar su código de manera eficiente. Utiliza modelos avanzados de IA para analizar código existente y sugerir mejoras en estructura, optimización y estilo, siguiendo las mejores prácticas de desarrollo.

## Tecnologías Principales

- **Framework:** Next.js (React)
- **Lenguajes:** TypeScript, JavaScript
- **IA:** Google Gemini (a través de @ai-sdk/google)
- **UI:** Tailwind CSS, Radix UI
- **Estado:** React Hooks
- **Notificaciones:** Sonner
- **Editor de Código:** React Simple Code Editor
- **Markdown:** React Markdown
- **Temas:** Next Themes

## Cómo Usar el Proyecto

### Requisitos Previos

- Node.js v18 o superior
- npm o yarn
- Cuenta de Google Cloud (para usar Gemini)

### Instalación

1. Clona el repositorio:

   ```bash
   git clone https://github.com/tuusuario/refactor-ai.git
   ```

2. Instala las dependencias:

   ```bash
   npm install
   ```

3. Configura las variables de entorno:
   Crea un archivo `.env` en la raíz del proyecto con:
   ```
   GOOGLE_API_KEY=tu_clave_api_de_google
   ```

### Ejecución

1. Inicia el servidor de desarrollo:

   ```bash
   npm run dev
   ```

2. Accede a la aplicación en tu navegador:
   ```
   http://localhost:3000
   ```

### Uso Básico

1. Ingresa tu código en el editor principal
2. Haz clic en "Refactor Code"
3. Revisa las sugerencias de refactorización
4. Explora los archivos generados en el panel lateral
5. Copia el código refactorizado al portapapeles

## Contribución

Si deseas contribuir al proyecto, sigue estos pasos:

1. Haz un fork del repositorio
2. Crea una nueva rama (`git checkout -b feature/nueva-funcionalidad`)
3. Realiza tus cambios y haz commit (`git commit -m 'Añade nueva funcionalidad'`)
4. Haz push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la licencia MIT. Para más detalles, consulta el archivo LICENSE.
