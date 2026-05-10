# InkRush — Plugin WordPress

## Instalación vía GitHub Deployer

El repositorio raíz **ES** el plugin de WordPress. Configura tu deployer así:

| Ajuste | Valor |
|--------|-------|
| Repositorio | `jessica-mad/App-painting` |
| Rama | `claude/inkrush-app-prototype-bV1Bx` |
| Carpeta destino | `/wp-content/plugins/inkrush-app/` |

Una vez desplegado, ve a **WordPress → Plugins** y activa **InkRush App**.

## Shortcode

```
[inkrush_app]
```

## Panel admin: WordPress → InkRush 🎨

- **Configuración** — temporada activa, intentos diarios
- **Variables** — CRUD con rareza (Común/Raro/Épico/Legendario) y temporada
- **Usuarios** — progresión de niveles configurable

---
<!-- Información de desarrollo React + Vite -->

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
