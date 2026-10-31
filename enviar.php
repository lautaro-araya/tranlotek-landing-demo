<?php
// Recibe la ficha de contacto y la envía por correo al equipo comercial.
// Requiere PHP con mail() habilitado (incluido en cPanel de HostingPlus).

declare(strict_types=1);

date_default_timezone_set('America/Santiago');

// Casilla que recibe las solicitudes del formulario
// REMITENTE debe ser una casilla creada en cPanel con el mismo dominio, o el correo puede caer en spam.
const DESTINO = 'formulario@tranlotek.com';
const REMITENTE = 'no-responder@tranlotek.com';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function responder(int $code, array $data): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// Cada error responde con un código ('error'), un mensaje legible ('mensaje') y, si lo hay,
// el detalle técnico del servidor ('detalle'), para saber exactamente qué falló.
function fallar(int $code, string $error, string $mensaje, string $detalle = ''): void {
    $data = ['ok' => false, 'error' => $error, 'mensaje' => $mensaje];
    if ($detalle !== '') $data['detalle'] = $detalle;
    responder($code, $data);
}

// Los avisos de PHP no se imprimen (romperían el JSON); un error fatal se informa como JSON.
ini_set('display_errors', '0');
ini_set('html_errors', '0');
register_shutdown_function(function (): void {
    $e = error_get_last();
    if ($e && in_array($e['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
        fallar(500, 'php', 'Error interno del servidor (PHP).', $e['message'] . ' (línea ' . $e['line'] . ')');
    }
});

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    fallar(405, 'metodo', 'Este archivo solo recibe envíos del formulario (POST).', 'Método recibido: ' . ($_SERVER['REQUEST_METHOD'] ?? 'desconocido'));
}
if (!extension_loaded('mbstring')) {
    fallar(500, 'mbstring', 'Falta la extensión mbstring de PHP.', 'Actívala en cPanel > Seleccionar versión de PHP > Extensiones.');
}
if (!function_exists('mail')) {
    fallar(500, 'mail_deshabilitado', 'La función mail() de PHP está deshabilitada en el hosting.', 'Pide a HostingPlus que la habilite o usa envío por SMTP.');
}

// Trampa anti-spam: los humanos no ven este campo.
if (!empty($_POST['web'])) {
    responder(200, ['ok' => true]);
}

function campo(string $nombre, int $max): string {
    $valor = trim((string)($_POST[$nombre] ?? ''));
    $valor = preg_replace('/[\r\n\t]+/', ' ', $valor) ?? '';
    return mb_substr($valor, 0, $max);
}

$nombre     = campo('nombre', 80);
$empresa    = campo('empresa', 100);
$telefono   = campo('telefono', 20);
$correo     = campo('correo', 120);
$origen     = campo('origen', 40);

// Mismas reglas y mensajes que el formulario (assets/js/main.js)
$errores = [];
if ($nombre === '' || preg_match_all('/\p{L}/u', $nombre) < 2) $errores['nombre'] = 'Ingresa tu nombre.';
elseif (!preg_match("/^\p{L}[\p{L}\s'.-]*$/u", $nombre)) $errores['nombre'] = 'Usa solo letras en tu nombre, sin números ni símbolos.';
if (mb_strlen($empresa) < 2) $errores['empresa'] = 'Indica el nombre de tu empresa.';
elseif (!preg_match('/\p{L}/u', $empresa)) $errores['empresa'] = 'El nombre de la empresa debe tener letras.';
// Teléfono chileno: 9 dígitos, con o sin el 56 adelante
$digitos = preg_replace('/\D/', '', $telefono) ?? '';
if (strlen($digitos) === 11 && substr($digitos, 0, 2) === '56') $digitos = substr($digitos, 2);
if ($digitos === '') $errores['telefono'] = 'Ingresa un teléfono de contacto.';
elseif (preg_match('/[^\d\s+()-]/', $telefono)) $errores['telefono'] = 'Usa solo números en el teléfono.';
elseif (!preg_match('/^[2-9]\d{8}$/', $digitos)) $errores['telefono'] = 'Ingresa un teléfono chileno de 9 dígitos, por ejemplo +56 9 1234 5678.';
if ($correo !== '' && (!filter_var($correo, FILTER_VALIDATE_EMAIL) || !preg_match('/\.[A-Za-z]{2,}$/', $correo))) $errores['correo'] = 'Revisa el correo, por ejemplo nombre@empresa.cl.';

if ($errores) {
    responder(422, ['ok' => false, 'error' => 'validacion', 'mensaje' => 'Hay datos por corregir: ' . implode(', ', array_keys($errores)) . '.', 'campos' => $errores]);
}

$asunto = 'Solicitud de reunión comercial · ' . $empresa;
$cuerpo = implode("\n", [
    'Nueva solicitud de reunión comercial desde tranlotek.com',
    '',
    'Nombre:     ' . $nombre,
    'Empresa:    ' . $empresa,
    'Teléfono:   ' . $telefono,
    'Correo:     ' . ($correo !== '' ? $correo : '(no indicado)'),
    'Origen:     ' . $origen,
    'Fecha:      ' . date('d-m-Y H:i'),
]);

$cabeceras = [
    'From: TRANLOTEK Web <' . REMITENTE . '>',
    'Sender: ' . REMITENTE,
    'Content-Type: text/plain; charset=UTF-8',
];
if ($correo !== '') {
    $cabeceras[] = 'Reply-To: ' . $correo;
}

// -f fija el remitente real del envío (Return-Path); sin esto el servidor usa la cuenta de cPanel
// (usuario@servidor.hostingplus.cl) en vez de REMITENTE.
error_clear_last();
$enviado = mail(DESTINO, '=?UTF-8?B?' . base64_encode($asunto) . '?=', $cuerpo, implode("\r\n", $cabeceras), '-f' . REMITENTE);

if (!$enviado) {
    $e = error_get_last();
    fallar(500, 'mail', 'El servidor no pudo enviar el correo a ' . DESTINO . ' desde ' . REMITENTE . '.',
        $e['message'] ?? 'mail() devolvió false sin detalle: revisa que exista la casilla ' . REMITENTE . ' y el registro de correo del hosting.');
}

responder(200, ['ok' => true]);
