<?php
// Recibe la ficha de contacto y la envía por correo al equipo comercial.
// Requiere PHP con mail() habilitado (incluido en Hostinger).

declare(strict_types=1);

// REEMPLAZAR: correo de ventas provisorio
const DESTINO = 'ventas@tranlotek.com';
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
$referencia = campo('referencia', 24);
$origen     = campo('origen', 40);

$errores = [];
if (mb_strlen($nombre) < 2)  $errores[] = 'nombre';
if (mb_strlen($empresa) < 2) $errores[] = 'empresa';
$digitos = preg_replace('/\D/', '', $telefono) ?? '';
if (strlen($digitos) < 8 || strlen($digitos) > 12) $errores[] = 'telefono';
if ($correo !== '' && !filter_var($correo, FILTER_VALIDATE_EMAIL)) $errores[] = 'correo';
if (!preg_match('/^TLK-\d{6}-\d{4}$/', $referencia)) $referencia = 'sin referencia';

if ($errores) {
    responder(422, ['ok' => false, 'error' => 'validacion', 'campos' => $errores]);
}

$asunto = 'Solicitud de reunión comercial · ' . $empresa . ' · ' . $referencia;
$cuerpo = implode("\n", [
    'Nueva solicitud de reunión comercial desde tranlotek.com',
    '',
    'Referencia: ' . $referencia,
    'Nombre:     ' . $nombre,
    'Empresa:    ' . $empresa,
    'Teléfono:   ' . $telefono,
    'Correo:     ' . ($correo !== '' ? $correo : '(no indicado)'),
    'Origen:     ' . $origen,
    'Fecha:      ' . date('d-m-Y H:i'),
]);

$cabeceras = [
    'From: TRANLOTEK Web <' . REMITENTE . '>',
    'Content-Type: text/plain; charset=UTF-8',
];
if ($correo !== '') {
    $cabeceras[] = 'Reply-To: ' . $correo;
}

$enviado = mail(DESTINO, '=?UTF-8?B?' . base64_encode($asunto) . '?=', $cuerpo, implode("\r\n", $cabeceras));

if (!$enviado) {
    responder(500, ['ok' => false, 'error' => 'mail']);
}

responder(200, ['ok' => true, 'referencia' => $referencia]);
