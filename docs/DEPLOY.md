**Requisitos**
- **Docker**: instalado y funcionando en la máquina (ver `docker --version`).

**Construir la imagen Docker**

Ejecuta este comando desde la carpeta raíz del proyecto (donde está el Dockerfile):

```bash
docker build -t dev-backendui-uc:latest .
```

Esto usa el `Dockerfile` multi-stage incluido en el proyecto: en la primera etapa construye la aplicación con Node (ejecuta `npm ci`, `npm run lint` y `npm run build`) y en la segunda etapa copia los artefactos a una imagen ligera de `nginx` que sirve los archivos estáticos en el puerto 80.

**Ejecutar el contenedor**

Ejecuta la imagen creada y publica el puerto 80 del contenedor en el host:

```bash
# Ejecutar en primer plano y mapear puerto 80 del contenedor al puerto 80 del host
docker run --rm -p 80:80 dev-backendui-uc:latest

# Ejecutar en segundo plano (detached) con nombre del contenedor
docker run -d --name dev-backendui -p 80:80 dev-backendui-uc:latest
```

Si tu puerto 80 ya está ocupado, mapea a otro puerto del host, por ejemplo 8080:

```bash
docker run --rm -p 8080:80 dev-backendui-uc:latest
```

Luego abre en el navegador `http://localhost/` (o `http://localhost:8080/` si usaste 8080).

**Archivo actualizado:** [docs/DEPLOY.md](docs/DEPLOY.md)
