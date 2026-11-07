# Configuración del acceso a SIREPP

SIREPP usa Keycloak para iniciar sesión y NestJS verifica que el token esté destinado a la API y que el funcionario y su unidad estén activos. Las cuentas se habilitan internamente. La aplicación no ofrece registro público.

## Entorno

Configura estas variables en el entorno de cada servicio. Los valores locales corresponden a la copia de integración. Usa las URLs HTTPS reales en un entorno compartido.

| Servicio | Variable | Ejemplo local |
| --- | --- | --- |
| Front | VITE_API_URL | http://localhost:3001 |
| Front | VITE_KEYCLOAK_URL | http://localhost:8080 |
| Front | VITE_KEYCLOAK_REALM | sirepp |
| Front | VITE_KEYCLOAK_CLIENT_ID | sirepp-web |
| Back | KEYCLOAK_ISSUER | http://localhost:8080/realms/sirepp |
| Back | KEYCLOAK_AUDIENCE | sirepp-api |

Back también requiere DATABASE_URL y una ENCRYPTION_KEY persistente. Guarda los secretos en el entorno del servicio. No los incluyas en Git ni en un archivo exportado de Keycloak.

## Realm y cliente

1. Crea el realm sirepp y usa SIREPP como nombre visible. Deja el registro público desactivado.
2. Crea el cliente OpenID Connect sirepp-web con Standard flow habilitado, PKCE S256 y Client authentication y Direct access grants deshabilitados.
3. Registra la URL del Front en Valid redirect URIs, Valid post logout redirect URIs y Web origins. En local usa http://localhost:5174/* para las dos listas de redirección y http://localhost:5174 para Web origins. Usa también la URL de la aplicación como Home URL para el botón de retorno después de recuperar la contraseña.
4. En el client scope dedicado de sirepp-web, agrega un mapper Audience. En Included Custom Audience pon sirepp-api. Inclúyelo en el access token.
5. En Authentication → Required actions, habilita Configure OTP y deja Verify Profile habilitado y predeterminado. En Realm settings → User profile, configura correo, nombre y apellido como requeridos para el usuario.

## Tema y segundo factor

Copia la carpeta [themes/sirepp](themes/sirepp) al directorio de temas de Keycloak. Selecciona sirepp como Login theme del cliente y como Email theme del realm. En Localization, habilita el español y configúralo como idioma predeterminado.

Copia el flujo Browser a un flujo propio y asígnalo solo a sirepp-web mediante Authentication flow overrides → Browser Flow. En la rama Forms, conserva Username Password Form como Required y colócalo antes del segundo factor. En esa rama, el subflujo de segundo factor y OTP Form deben quedar en Required. Desactiva las condiciones que omiten OTP cuando el usuario aún no tiene una credencial. Configure OTP permite vincular el autenticador con el QR en el primer acceso.

## Alta de funcionarios

1. Un administrador crea una cuenta individual en el realm sirepp y le asigna una contraseña inicial. Registra un correo que el funcionario pueda usar para recuperar el acceso.
2. Vincula la cuenta a un registro de la tabla usuario usando el ID de Keycloak como keycloakSub. Asigna una unidad activa y habilita servicioActivo.
3. El funcionario completa los datos pendientes y vincula su autenticador al entrar. El rol operativo se administra como parte del módulo de permisos del sistema.

## Recuperación de contraseña

Configura el servidor SMTP en Realm settings → Email. Usa Mailpit en pruebas locales o un remitente autorizado para la prueba de entrega real. Guarda la credencial SMTP solo en la configuración del servicio.

Antes de activar Forgot password, configura un flujo de Reset credentials con estos pasos, en orden:

1. Choose User y Send Reset Email, ambos Required.
2. Un subflujo Conditional con Condition - user configured y OTP Form en Required. Este paso debe comprobar el autenticador existente.
3. Un subflujo Conditional con Condition - sub-flow executed configurado para ejecutarse si el paso anterior no se ejecutó. Agrega Deny Access para derivar al administrador si el funcionario no tiene un autenticador vinculado.
4. Reset Password en Required. El flujo no debe incluir Reset OTP.

Asigna este flujo a Reset credentials y activa Forgot password. Conserva un procedimiento de recuperación asistida para pérdida del autenticador o del correo. No habilites el flujo en un entorno compartido hasta comprobar que el enlace no permite omitir el segundo factor.

En Localization → Realm overrides, la clave es de idioma es y el mensaje emailSentMessage debe decir:

> Si tu cuenta tiene un correo electrónico registrado, recibirás un enlace para restablecer tu contraseña. Si no tienes un correo asociado o no puedes acceder a él, contacta al administrador de SIREPP.

## Verificación antes de publicar

- Una cuenta activa vinculada puede entrar con contraseña y OTP. El primer acceso sin autenticador muestra el QR y el perfil incompleto solicita los datos faltantes.
- La API devuelve 401 sin token válido. Una cuenta sin vinculación o inactiva recibe 403. Cerrar sesión vuelve a pedir el login.
- La recuperación envía el enlace al correo de la cuenta, exige el OTP existente y permite entrar después con la contraseña nueva. Comprueba también el rechazo de un OTP incorrecto y de un enlace ya utilizado.
- Repite las pruebas desde la URL publicada. La autenticación no sustituye los permisos por rol de Administración y Auditoría. Comprueba esos permisos en la API antes de publicar dichos módulos.
