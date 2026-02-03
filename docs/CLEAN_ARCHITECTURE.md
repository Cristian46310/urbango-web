**Arquitectura hexagonal (Frontend) — Guía práctica**

Objetivo
-------
Esta guía explica cómo organizar el frontend siguiendo una arquitectura hexagonal (ports & adapters). Está pensada para el proyecto actual y muestra qué va en cada carpeta y el flujo recomendado para añadir o cambiar funcionalidad.

Mapa de carpetas (resumen)
---------------------------
- `core/` — Lógica compartida (tipos, utils, constantes del dominio).
- `domain/entities/` — Entidades del dominio (modelos cercanos a casos de uso, no a la base de datos).
- `domain/ports/` — Interfaces (puertos) que describen contratos para repositorios, servicios externos y adaptadores.
- `app/` — Casos de uso (orquestación): funciones que ejecutan la lógica de negocio usando los `ports`.
- `infra/` o `infrastructure/repository/` — Adaptadores concretos (implementaciones de `ports`), por ejemplo llamadas HTTP, storage, mappers.
- `store/` — Estado global (Zustand o similar). Expone los casos de uso como acciones reutilizables y gestiona toasts/errores globales.
- `hooks/` — Hooks que consumen `store` y exponen una API simple a los componentes.
- `app/components/` — Componentes UI que consumen hooks.

Flujo de trabajo recomendado (pasos)
----------------------------------
1. Modelar la entidad
	- Crear la entidad en `domain/entities/`. Representa el concepto del dominio usado por los casos de uso.
	- Ejemplo: `domain/entities/User.ts` con solo los campos y métodos relacionados al caso de uso.

2. Definir los puertos (interfaces)
	- Añadir una interfaz en `domain/ports/` que describa las operaciones necesarias (p. ej. `IUserRepository`).
	- Mantén las interfaces orientadas a la intención (buscarUsuario, guardarUsuario), no a detalles técnicos.

3. Implementar los casos de uso
	- En `app/` crear funciones que orquesten la lógica (p. ej. `CreateUser`, `GetUserList`).
	- Los casos de uso reciben las interfaces como dependencias (inyección) y no conocen la implementación concreta.

4. Implementar adaptadores (infra)
	- En `infra/repository/` implementa las interfaces (`IUserRepository`) usando fetch/axios o adaptadores locales.
	- Mapear formatos de red a entidades del dominio (mappers) dentro del adaptador.

5. Exponer en `store/`
	- Crear stores que inyecten los casos de uso y expongan acciones/estado para la UI.
	- Colocar la lógica de toasts/errores globales en `store/` para facilitar la búsqueda y reuso.

6. Crear hooks de consumo
	- En `hooks/` crear hooks simples (p. ej. `useUsers()`) que usen el `store` y devuelvan sólo lo necesario a los componentes.

7. Consumir desde componentes
	- Los componentes UI usan únicamente los hooks. No conocen stores ni repositorios directamente.

Guía rápida: añadir una nueva funcionalidad
-----------------------------------------
1. Añade/actualiza la entidad en `domain/entities/`.
2. Define la interfaz necesaria en `domain/ports/`.
3. Implementa el caso de uso en `app/` (usa la interfaz).
4. Crea la implementación concreta en `infra/repository/`.
5. Añade la acción al `store/` (inyecta el caso de uso o la implementación si corresponde).
6. Crea un `hook` en `hooks/` que exponga la acción/estado.
7. Consume el hook desde el componente en `app/components/`.

Recomendaciones y buenas prácticas
---------------------------------
- Nombres: usa verbos para métodos (getUser, createUser) y sustantivos para entidades (`User`).
- Inyección de dependencias: evita imports directos de infra dentro de `app/` y `domain/` — inyecta las implementaciones en el `store` o en el bootstrap de la app.
- Mappers: centraliza la transformación entre DTOs y entidades dentro de `infra`.
- Tests: prueba los casos de uso en `app/` con mocks de las interfaces (puertos).
- Toats/Notificaciones: mantenlos en `store/` para facilitar su control y búsqueda.
- Validaciones: preferible en los casos de uso (app/) o en la entidad si es regla de dominio.

Ejemplo mínimo (esquema)
------------------------
// domain/ports/IUserRepository.ts
```ts
export interface IUserRepository {
  getById(id: string): Promise<User | null>
  create(payload: Partial<User>): Promise<User>
}
```

// app/CreateUser.ts
```ts
export function CreateUser(repo: IUserRepository) {
  return async function execute(payload: Partial<User>) {
	 // validaciones / reglas de negocio
	 const user = await repo.create(payload)
	 return user
  }
}
```

// infra/repository/HttpUserRepository.ts
```ts
class HttpUserRepository implements IUserRepository {
  async create(payload) { /* llamada HTTP y mapeo a User */ }
}
```

Notas finales
-------------
Esta guía busca ser práctica y directa: sigue el flujo de arriba para mantener las responsabilidades claras. Si quieres, puedo añadir un ejemplo real del proyecto (ej.: convertir un endpoint actual en caso de uso + adapter + hook) o validar una feature concreta siguiendo estos pasos.

---
Versión mejorada por GitHub Copilot — estructurada para seguir paso a paso.
