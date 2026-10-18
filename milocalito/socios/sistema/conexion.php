<?php
declare(strict_types=1);

/*
 * Mi Localito — conexión PDO a MySQL.
 * Compatible con el paquete de control de inactividad de 10 minutos.
 * El control de sesión se integra en los archivos protegidos; esta conexión
 * no necesita incluir control_sesion.php ni los componentes visuales.
 */

$host = '127.0.0.1';
$dbname = 'u253550057_milocalito';
$username = 'u253550057_mladmin';
$password = 'Ingenier0369';

try {
    $pdo = new PDO(
        "mysql:host={$host};dbname={$dbname};charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $e) {
    error_log('Error de conexión de Mi Localito: ' . $e->getMessage());
    http_response_code(500);
    exit('No fue posible conectar con el sistema. Intenta más tarde.');
}
