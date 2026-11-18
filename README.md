# Perú Sano SRL — Landing Page Oficial (`www.perusanoapp.com`)

Landing page estática de alta conversión para **EMPRESA PRESTADORA DE SERVICIOS SANITARIOS Y AMBIENTALES DEL PERU S.R.L. (Perú Sano SRL)**, lista para desplegar en **GitHub Pages**.

## Estructura del Proyecto

```text
├── CNAME                          # Dominio personalizado para GitHub Pages (www.perusanoapp.com)
├── index.html                     # Estructura principal, paleta (crema/verde/rojo), Schema.org y embudo de 3 pasos
├── css/
│   └── styles.css                 # Animaciones (@keyframes pulse-green, pulse-red) y estilos base modulares
├── js/
│   └── funnel.js                  # Controlador del embudo de 3 pasos y envío directo vía Google Apps Script
├── scripts/
│   └── google-apps-script.gs      # Receptor directo en Gmail (serviciosanitariosdelperu@gmail.com) con plantilla HTML
├── assets/
│   ├── senasa.png                 # Logo oficial SENASA
│   └── img/
│       └── hero-desinfeccion.jpg  # Fotografía operativa principal
└── README.md                      # Guía de activación de correo directo y configuración DNS
```

---

## 1. Activación del Envío Directo desde Gmail (Sin FormSubmit)

Para que las solicitudes lleguen al instante (1–2 segundos) con formato HTML corporativo directamente desde **`serviciosanitariosdelperu@gmail.com`** y sin depender de servicios externos lentos:

1. Inicia sesión en Google con la cuenta **`serviciosanitariosdelperu@gmail.com`**.
2. Entra a [https://script.google.com](https://script.google.com) y haz clic en **Nuevo proyecto**.
3. Borra el contenido por defecto y pega todo el código de [`scripts/google-apps-script.gs`](scripts/google-apps-script.gs).
4. Guarda el proyecto (Ctrl + S) con el nombre `PeruSano-Receptor`.
5. Haz clic en **Implementar → Nueva implementación**:
   - **Tipo:** `Aplicación web`
   - **Ejecutar como:** `Yo (serviciosanitariosdelperu@gmail.com)`
   - **Quién tiene acceso:** `Cualquier usuario`
6. Autoriza los permisos de correo cuando Google lo solicite y copia la **URL de la aplicación web** (termina en `/exec`).
7. Pega esa URL en la constante `GOOGLE_SCRIPT_URL` al inicio de [`js/funnel.js`](js/funnel.js).

> **Ventajas frente a FormSubmit:**
> - Envío directo desde los servidores de Google (~1 segundo).
> - Funciona incluso si pruebas el sitio en local o desde GitHub Pages sin preflight CORS.
> - Plantilla HTML profesional con código de orden (`PS-2026-XXXX`), codificación UTF-8 limpia y trazabilidad completa.

### Organizar solicitudes en una carpeta (Etiqueta) en Gmail
Para que cada solicitud entre automáticamente a una carpeta dedicada (ej. `Solicitudes SENASA`):
1. En Gmail (`serviciosanitariosdelperu@gmail.com`), abre **Configuración (⚙️) → Ver toda la configuración → Filtros y direcciones bloqueadas → Crear un filtro**.
2. En el campo **Asunto**, escribe: `Solicitud Certificado SENASA` y pulsa **Crear filtro**.
3. Marca **Aplicar la etiqueta** → selecciona o crea `Solicitudes SENASA` y marca **No marcar nunca como spam** (opcional: **Omitir Recibidos** si deseas que vaya solo a esa carpeta).
4. Pulsa **Crear filtro**.

---

## 2. Configuración DNS para GitHub Pages (`www.perusanoapp.com`)

En el panel DNS de su proveedor de dominio (`perusanoapp.com`), configure los siguientes registros:

### Registros `A` (para el dominio raíz `perusanoapp.com` / `@`)
| Tipo | Host | Valor / Apunta a | TTL |
| :--- | :--- | :--- | :--- |
| `A` | `@` | `185.199.108.153` | Automático / 3600 |
| `A` | `@` | `185.199.109.153` | Automático / 3600 |
| `A` | `@` | `185.199.110.153` | Automático / 3600 |
| `A` | `@` | `185.199.111.153` | Automático / 3600 |

### Registro `CNAME` (para el subdominio `www`)
| Tipo | Host | Valor / Apunta a | TTL |
| :--- | :--- | :--- | :--- |
| `CNAME` | `www` | `<tu-usuario-o-org>.github.io` | Automático / 3600 |

### Activación en GitHub
1. Suba el repositorio a GitHub y vaya a **Settings → Pages**.
2. En **Build and deployment**, seleccione la rama principal (`main`) y carpeta `/ (root)`.
3. En **Custom domain**, verifique que aparezca `www.perusanoapp.com` (leído automáticamente desde `CNAME`).
4. Una vez propagado el DNS, marque **Enforce HTTPS**.
