## Inicio rápido

Clona el repositorio:

```bash
git clone https://github.com/JuManoel/dev-backendUI-uc.git
cd dev-backendUI-uc
```

Instala dependencias (si no están instaladas):

```bash
npm install
```

Comandos útiles:

- Ejecutar lint y aplicar fixes automáticos:

```bash
npm run lint -- --fix
```

- Compilar la aplicación (build):

```bash
npm run build
```

- Levantar entorno de desarrollo (HMR):

```bash
npm run dev
```

> Nota: algunos `package.json` definen `dev` como script; si tu proyecto usa otro nombre, sustituye `dev` por el script correspondiente.

## Estándares de código

- **Idioma:** Todo el código fuente en inglés; los comentarios pueden estar en español.
- **Responsabilidad única:** Cada clase o módulo debe tener una única responsabilidad clara.
- **Arquitectura:** Aplicar Hexagonal/Clean Architecture cuando sea posible. Si es demasiado complejo, aplicar MVC u otra arquitectura indicada por el profesor.
- **Convenciones de nombres:**
  - Clases: PascalCase (ej.: `UserService`).
  - Variables y métodos: camelCase en JavaScript/TypeScript/Java/C# (ej.: `getUser`, `userName`).
  - Python: snake_case (ej.: `get_user`).

## Estándares de GitHub / flujo de ramas

- Ramas para nuevas features o historias de usuario (HU):
  - Formato: `feat/XXX/yyy` donde `XXX` es la feature principal (ej.: `auth`) y `yyy` el submódulo (ej.: `google`).
  - Ejemplo: `feat/auth/google`.
- Ramas para arreglos (fix):
  - Formato: `fix/XXX/yyy`.
  - Ejemplo: `fix/ui/button-alignment`.
- Ramas principales:
  - `main`: código estable, funcional y probado.
  - `dev`: rama de integración para trabajo en curso y pruebas.
- Reglas de colaboración:
  - Nunca hacer merge directamente a `main` desde tu rama. Crear un Pull Request (PR) y apuntarlo a `dev` para revisión por el equipo.
  - Antes de pushear tus cambios, siempre hacer `git pull origin main` (o `git pull --rebase origin main`) y resolver conflictos localmente.

## Buenas prácticas adicionales

- Documenta las decisions importantes en `docs/` o en el PR.
- Escribe tests para casos de uso críticos.
- Centraliza las reglas de estilo (ESLint, Prettier) y haz que todos las respeten.
- Mantén commits pequeños y atómicos con mensajes claros (imperativo, en inglés preferiblemente, ej.: "Add Google auth flow").