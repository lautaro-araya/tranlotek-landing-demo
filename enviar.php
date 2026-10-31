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

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    responder(405, ['ok' => false, 'error' => 'method']);
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

// Mismas reglas que el formulario (assets/js/main.js)
$errores = [];
if (!preg_match("/^\p{L}[\p{L}\s'.-]*$/u", $nombre) || preg_match_all('/\p{L}/u', $nombre) < 2) $errores[] = 'nombre';
if (mb_strlen($empresa) < 2 || !preg_match('/\p{L}/u', $empresa)) $errores[] = 'empresa';
// Teléfono chileno: 9 dígitos, con o sin el 56 adelante
$digitos = preg_replace('/\D/', '', $telefono) ?? '';
if (strlen($digitos) === 11 && substr($digitos, 0, 2) === '56') $digitos = substr($digitos, 2);
if (preg_match('/[^\d\s+()-]/', $telefono) || !preg_match('/^[2-9]\d{8}$/', $digitos)) $errores[] = 'telefono';
if ($correo !== '' && (!filter_var($correo, FILTER_VALIDATE_EMAIL) || !preg_match('/\.[A-Za-z]{2,}$/', $correo))) $errores[] = 'correo';

if ($errores) {
    responder(422, ['ok' => false, 'error' => 'validacion', 'campos' => $errores]);
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
$enviado = mail(DESTINO, '=?UTF-8?B?' . base64_encode($asunto) . '?=', $cuerpo, implode("\r\n", $cabeceras), '-f' . REMITENTE);

if (!$enviado) {
    responder(500, ['ok' => false, 'error' => 'mail']);
}

responder(200, ['ok' => true]);
