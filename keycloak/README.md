# Acceso a SIREPP con Keycloak

## Funciones implementadas

- Inicio y cierre de sesión con Keycloak. El frontend verifica la habilitación antes de mostrar el menú y envía el token de acceso a la API.
- La API valida la firma, el emisor, la audiencia y la expiración del token. Busca al funcionario por keycloakSub y comprueba que tanto su cuenta como su unidad estén activas.
- Segundo factor con una aplicación autenticadora. El primer acceso solicita vincular el autenticador por QR si aún no está registrado.
- Verificación de correo, nombre y apellido cuando faltan datos del perfil.
- Recuperación de contraseña por correo. El enlace temporal inicia un flujo que comprueba el autenticador existente antes de permitir el cambio.
- Tema de acceso y correo de recuperación en español.
- Alta de funcionarios por invitación desde Administración, con correo único, configuración del autenticador y primera contraseña.
- Bloqueo temporal por intentos fallidos y aviso al correo verificado.

## Variables de entorno

| Servicio | Variable | Valor para la prueba local |
| --- | --- | --- |
| Front | VITE_API_URL | http://localhost:3000 |
| Front | VITE_KEYCLOAK_URL | http://localhost:8080 |
| Front | VITE_KEYCLOAK_REALM | sirepp |
| Front | VITE_KEYCLOAK_CLIENT_ID | sirepp-web |
| Back | KEYCLOAK_ISSUER | http://localhost:8080/realms/sirepp |
| Back | KEYCLOAK_AUDIENCE | sirepp-api |
| Back | KEYCLOAK_ADMIN_CLIENT_ID | sirepp-api-admin |
| Back | KEYCLOAK_ADMIN_CLIENT_SECRET | Secreto del cliente de servicio |
| Back | KEYCLOAK_INVITATION_REDIRECT_URI | http://localhost:5174/ |

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

### Alta por invitación

En **Realm settings → Login**, desactiva **Duplicate emails**. Antes de desplegar el Back, comprueba si existen duplicados y resuélvelos antes de ejecutar `prisma migrate deploy` en la base de destino.

```sql
SELECT lower(btrim(email)) AS correo, count(*)
FROM usuario
GROUP BY 1
HAVING count(*) > 1;
```

En **Clients → Create client**, crea el cliente OpenID Connect `sirepp-api-admin`. Activa **Client authentication** y **Service account roles**. Desactiva **Standard flow** y **Direct access grants**. En **Service accounts roles**, asigna `realm-management → manage-users`. Guarda el secreto de **Credentials** como `KEYCLOAK_ADMIN_CLIENT_SECRET` en el servicio del Back en Railway.

El administrador crea al funcionario con una unidad activa desde Administración. SIREPP guarda el ID real de Keycloak en `keycloakSub`. Keycloak envía con el SMTP del realm un enlace válido durante una hora. El trabajador confirma su correo, configura su autenticador y define su contraseña. Si el correo falla o vence, usa **Reenviar invitación** mientras la cuenta siga pendiente de definir contraseña. Para cuentas existentes, vincula el ID de Keycloak al registro correspondiente y verifica que el funcionario y su unidad estén activos.

En las versiones de Keycloak que requieren el alcance `kc-admin-api`, agrégalo como **Default** en **Clients → cliente de servicio → Client scopes**. Este alcance permite presentar el token a la API administrativa y el rol `manage-users` autoriza las operaciones sobre usuarios. [Guía de actualización de Keycloak](https://www.keycloak.org/docs/26.8.2/upgrading/)

Configura `KEYCLOAK_INVITATION_REDIRECT_URI` con la URL del Front, por ejemplo `http://localhost:5174/` en local. Registra esa URL en **Valid redirect URIs** del cliente `sirepp-web` y selecciona el tema de login `sirepp` en ese cliente. Si el cliente usa otro ID, configura también `KEYCLOAK_INVITATION_CLIENT_ID`. La URL de retorno se incluye en cada invitación nueva.

En **Authentication → Required actions**, habilita **Verify Email**, **Configure OTP** y **Update Password**. Coloca **Configure OTP** antes de **Update Password**. La invitación verifica el correo y Keycloak ejecuta las acciones pendientes de la cuenta según su prioridad. Si el usuario ya completó el OTP o la contraseña por otra vía, la invitación no vuelve a agregar esa acción. Si el enlace ya no se acepta, reenvía la invitación para retomar los pasos pendientes.

En Railway, despliega Keycloak con el Dockerfile de `keycloak-deploy`. Ese Dockerfile carga el tema desde `keycloak-deploy/themes/sirepp`. En el realm, selecciona `sirepp` como tema de login de `sirepp-web` y prueba el SMTP de **Realm settings → Email** antes de enviar una invitación. Usa la URL HTTPS del Front de ese entorno como URL de retorno.

### Bloqueo por intentos fallidos

En **Realm settings → Security defenses → Brute force detection**, selecciona el bloqueo temporal y configura **Max Login Failures** en **5**, **Wait Increment** y **Max Wait** en **15 minutos**, y **Failure Reset Time** en **30 minutos**. Keycloak también puede bloquear antes si detecta intentos muy seguidos según la configuración de **Quick Login Check**.

Para avisar al trabajador, selecciona el tema de correo `sirepp` en **Realm settings → Themes** y agrega `email` a **Realm settings → Events → Event listeners**. La imagen de `keycloak-deploy` selecciona el evento `user_disabled_by_temporary_lockout` mediante `KC_SPI_EVENTS_LISTENER__EMAIL__INCLUDE_EVENTS`. En una instalación local, puedes aplicar el mismo ajuste con `spi-events-listener--email--include-events=user_disabled_by_temporary_lockout` en `keycloak.conf`. Este ajuste selecciona solo los avisos de bloqueo temporal para ese listener. El envío requiere SMTP configurado y un correo verificado en la cuenta. Prueba con una cuenta de prueba y comprueba que el correo llegue al bloquearse.

El bloqueo termina automáticamente. Si el trabajador olvidó la contraseña, usa el flujo normal de recuperación con su autenticador. Si requiere ayuda antes del vencimiento, soporte puede limpiar los fallos de esa cuenta desde Keycloak tras verificar su identidad.

Para comprobar el bloqueo, habilita **Realm settings → Events → User events settings → Save events** e incluye **User disabled by temporary lockout** entre los tipos guardados. Busca `USER_DISABLED_BY_TEMPORARY_LOCKOUT` en **Events → User events**.

### Correo y recuperación de contraseña

En **Realm settings → Email**, configura el remitente, el host SMTP, el puerto y la autenticación del proveedor. Para la prueba con Gmail usamos smtp.gmail.com, puerto 587, STARTTLS activado, SSL desactivado y autenticación con el correo remitente y su contraseña de aplicación. Guarda la credencial en Keycloak.

Crea y asigna un flujo **Reset credentials** con este orden:

1. **Choose User** y **Send Reset Email**, ambos **Required**.
2. Subflujo **Conditional** con **Condition - user configured** y **OTP Form** como **Required** para validar el autenticador existente.
3. Subflujo **Conditional** con **Condition - sub-flow executed**. Selecciona el subflujo anterior y el resultado **not-executed**. Añade **Deny Access** como **Required** para derivar al administrador si falta el autenticador.
4. **Reset Password** como **Required**. Deja fuera **Reset OTP** y habilita **Forgot password** en el realm.

En **Localization → Realm overrides**, configura en español la clave **emailSentMessage** con este texto:

> Si tu cuenta tiene un correo electrónico registrado, recibirás un enlace para restablecer tu contraseña. Si no tienes un correo asociado o no puedes acceder a él, contacta al administrador de SIREPP.

### Pruebas después del despliegue

1. Con un administrador, crea un funcionario de prueba. Confirma que un correo duplicado se rechaza y que el correo nuevo recibe la invitación. Abre el enlace, vincula el OTP, define la contraseña e inicia sesión con el rol asignado.
2. Comprueba que una cuenta con rol Guardia recibe HTTP 403 al llamar a las rutas de Administración y Auditoría, incluido el reenvío. Verifica que una cuenta administradora pueda consultar el resumen de Auditoría y administrar los funcionarios.
3. Con una cuenta de prueba y correo verificado, falla cinco veces con más de un segundo entre intentos. Comprueba el bloqueo y el correo de alerta. Vuelve a entrar con la contraseña correcta y el OTP al vencer los 15 minutos.
