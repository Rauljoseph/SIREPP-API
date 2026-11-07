# Acceso a SIREPP con Keycloak

## Funciones implementadas

- Inicio y cierre de sesión con Keycloak. El frontend verifica la habilitación antes de mostrar el menú y envía el token de acceso a la API.
- La API valida la firma, el emisor, la audiencia y la expiración del token. Busca al funcionario por keycloakSub y comprueba que tanto su cuenta como su unidad estén activas.
- Segundo factor con una aplicación autenticadora. El primer acceso solicita vincular el autenticador por QR si aún no está registrado.
- Verificación de correo, nombre y apellido cuando faltan datos del perfil.
- Recuperación de contraseña por correo. El enlace temporal inicia un flujo que comprueba el autenticador existente antes de permitir el cambio.
- Tema de acceso y correo de recuperación en español.

## Variables de entorno

| Servicio | Variable | Valor para la prueba local |
| --- | --- | --- |
| Front | VITE_API_URL | http://localhost:3001 |
| Front | VITE_KEYCLOAK_URL | http://localhost:8080 |
| Front | VITE_KEYCLOAK_REALM | sirepp |
| Front | VITE_KEYCLOAK_CLIENT_ID | sirepp-web |
| Back | KEYCLOAK_ISSUER | http://localhost:8080/realms/sirepp |
| Back | KEYCLOAK_AUDIENCE | sirepp-api |

En el entorno publicado, usa las URLs HTTPS del Front, la API y Keycloak. VITE_API_URL se configura sin el sufijo /api porque el frontend lo agrega. KEYCLOAK_ISSUER debe coincidir con el emisor de los tokens. Configura DATABASE_URL y una ENCRYPTION_KEY persistente en Back mediante las variables del servicio.

## Configuración en Keycloak

### Realm y cliente

| Ajuste | Valor |
| --- | --- |
| Realm | sirepp |
| Nombre visible del realm | SIREPP |
| Registro público | Desactivado |
| Tipo de cliente | OpenID Connect |
| Client ID | sirepp-web |
| Standard flow y PKCE | Activado, S256 |
| Client authentication y Direct access grants | Desactivados |
| Home URL | URL del Front, por ejemplo http://localhost:5174/ |
| Valid redirect URIs y Valid post logout redirect URIs | URL del Front con las rutas permitidas, por ejemplo http://localhost:5174/* |
| Web origins | Origen del Front, por ejemplo http://localhost:5174 |

En el client scope dedicado de sirepp-web, agrega un mapper **Audience**. Usa sirepp-api en **Included Custom Audience** y activa **Add to access token**. En **Realm settings → Localization**, habilita español y selecciónalo como idioma predeterminado. Copia [el tema sirepp](themes/sirepp) al directorio de temas de Keycloak y selecciónalo como **Login theme** del cliente y **Email theme** del realm.

### Inicio de sesión y perfil

Copia el flujo **Browser** y asigna la copia a sirepp-web en **Authentication flow overrides → Browser Flow**. En **Forms**, deja **Username Password Form** como **Required**, seguido del subflujo de segundo factor como **Required**. En ese subflujo, deja **OTP Form** como **Required** y desactiva **Condition - user configured** y **Condition - credential**.

En **Authentication → Required actions**, habilita **Configure OTP** y deja **Verify Profile** habilitado y predeterminado. En **Realm settings → User profile**, configura correo, nombre y apellido como obligatorios para el usuario.

Para dar de alta a un funcionario, crea su cuenta en el realm, asigna una contraseña inicial y registra un correo accesible. Vincula el ID de Keycloak con keycloakSub en la tabla usuario de SIREPP. El registro debe tener servicioActivo habilitado y pertenecer a una unidad activa.

### Correo y recuperación de contraseña

En **Realm settings → Email**, configura el remitente, el host SMTP, el puerto y la autenticación del proveedor. Para la prueba con Gmail usamos smtp.gmail.com, puerto 587, STARTTLS activado, SSL desactivado y autenticación con el correo remitente y su contraseña de aplicación. Guarda la credencial en Keycloak.

Crea y asigna un flujo **Reset credentials** con este orden:

1. **Choose User** y **Send Reset Email**, ambos **Required**.
2. Subflujo **Conditional** con **Condition - user configured** y **OTP Form** como **Required** para validar el autenticador existente.
3. Subflujo **Conditional** con **Condition - sub-flow executed**. Selecciona el subflujo anterior y el resultado **not-executed**. Añade **Deny Access** como **Required** para derivar al administrador si falta el autenticador.
4. **Reset Password** como **Required**. Deja fuera **Reset OTP** y habilita **Forgot password** en el realm.

En **Localization → Realm overrides**, configura en español la clave **emailSentMessage** con este texto:

> Si tu cuenta tiene un correo electrónico registrado, recibirás un enlace para restablecer tu contraseña. Si no tienes un correo asociado o no puedes acceder a él, contacta al administrador de SIREPP.
