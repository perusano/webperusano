# Perú Sano SRL — Landing Page Oficial (`www.perusanoapp.com`)

Landing page estática de alta conversión para **EMPRESA PRESTADORA DE SERVICIOS SANITARIOS Y AMBIENTALES DEL PERU S.R.L. (Perú Sano SRL)**, lista para desplegar en **GitHub Pages**.

## Estructura del Proyecto

```text
├── CNAME                 # Dominio personalizado para GitHub Pages (www.perusanoapp.com)
├── index.html            # Estructura principal, paleta (crema/verde/rojo), Schema.org y embudo de 3 pasos
├── css/
│   └── styles.css        # Animaciones (@keyframes pulse-green, pulse-red) y estilos base modulares
├── js/
│   └── funnel.js         # Controlador del embudo de 3 pasos y envío AJAX vía FormSubmit
├── assets/
│   └── img/
│       └── hero-desinfeccion.jpg  # Fotografía operativa principal
└── README.md             # Guía de activación de correo y configuración DNS
```

---

## 1. Activación del Correo (FormSubmit — Sin Backend)

Toda conexión y solicitud se realiza a través del formulario web, enviando los datos por AJAX directamente a:
`https://formsubmit.co/ajax/serviciosanitariosdelperu@gmail.com`

**Pasos de activación única:**
1. Despliegue el sitio en GitHub Pages (o ábralo desde un servidor HTTP/HTTPS).
2. Envíe una solicitud de prueba desde el embudo de 3 pasos.
3. Revise la bandeja de entrada (y carpeta de Spam) de **`serviciosanitariosdelperu@gmail.com`**.
4. Abra el correo de **FormSubmit** y haga clic en **"Activate Form"**.
5. A partir de ese momento, todas las solicitudes llegarán automáticamente con el asunto:
   `URGENTE: Solicitud Certificado SENASA - Placa [PLACA]`.

> **Nota sobre Imágenes:**
> - La fotografía operativa ya está guardada en `assets/img/hero-desinfeccion.jpg`.
> - Si deseas usar un logotipo propio en imagen, colócalo en `assets/img/logo-perusano.webp` (mientras no exista, se muestra el emblema vectorial de Perú Sano SRL).

---

## 2. Configuración DNS para GitHub Pages (`www.perusanoapp.com`)

En el panel DNS de su proveedor de dominio (`perusanoapp.com`), configure los siguientes registros:

### Registros `A` (para el dominio raíz `perusanoapp.com` / `@`)
Apunte el host `@` a las 4 direcciones IP oficiales de GitHub Pages:

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
3. En **Custom domain**, verifique que aparezca `www.perusanoapp.com` (leído automáticamente desde el archivo `CNAME`).
4. Una vez propagado el DNS, marque la casilla **Enforce HTTPS**.
