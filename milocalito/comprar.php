<?php
declare(strict_types=1);
/* Formulario público de compra Mi Localito. Instalar junto a iniciar_compra.php. */
$codes = ['XPRESS','PRO','CUSTOM','LANDING','AGENDA','ELITE'];
$system = strtoupper(trim((string)($_GET['sistema'] ?? $_POST['system_code'] ?? '')));
$socioId = filter_var($_GET['socio_id'] ?? $_POST['socio_id'] ?? null, FILTER_VALIDATE_INT);
if (!in_array($system, $codes, true) || !$socioId) {
    http_response_code(400);
    exit('Enlace de compra incompleto. Regresa a la página del socio y selecciona el sistema nuevamente.');
}
$names = ['XPRESS'=>'Sistema Xpress','PRO'=>'Sistema Pro','CUSTOM'=>'Sistema Custom','LANDING'=>'Sistema Landing','AGENDA'=>'Sistema Agenda','ELITE'=>'Sistema Élite'];
$prices = ['XPRESS'=>'$3,999 MXN','PRO'=>'$6,999 MXN','CUSTOM'=>'$9,999 MXN','LANDING'=>'$3,999 MXN','AGENDA'=>'$6,999 MXN','ELITE'=>'$9,999 MXN'];
$deposits = ['XPRESS'=>'$1,999.50 MXN','PRO'=>'$3,499.50 MXN','CUSTOM'=>'$4,999.50 MXN','LANDING'=>'$1,999.50 MXN','AGENDA'=>'$3,499.50 MXN','ELITE'=>'$4,999.50 MXN'];
function h(string $v): string { return htmlspecialchars($v, ENT_QUOTES, 'UTF-8'); }
?>
<!doctype html>
<html lang="es-MX"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Iniciar compra | Mi Localito</title>
<style>
:root{--green:#00a83b;--dark:#102117;--muted:#657268;--line:#dce6de}*{box-sizing:border-box}body{margin:0;background:#f3f7f4;color:#17231a;font-family:Arial,Helvetica,sans-serif}.wrap{max-width:620px;margin:35px auto;padding:16px}.brand{font-weight:900;color:var(--green);letter-spacing:.04em}.card{background:white;border:1px solid var(--line);border-radius:18px;padding:26px;box-shadow:0 12px 40px #122b1710}.eyebrow{color:var(--green);font-weight:800;font-size:12px;letter-spacing:.12em}h1{font-size:28px;margin:10px 0}p{line-height:1.5;color:var(--muted)}.price{background:#f0faf3;border:1px solid #d0efda;border-radius:12px;padding:14px;margin:20px 0}.price strong{display:block;color:#0b772d;font-size:23px;margin-top:4px}label{display:block;font-size:13px;font-weight:700;margin:14px 0 6px}input{width:100%;padding:13px;border:1px solid #cbd8ce;border-radius:9px;font:inherit}button{width:100%;border:0;border-radius:10px;background:var(--green);color:#fff;font-weight:800;padding:15px;margin-top:20px;font-size:15px;cursor:pointer}.fine{font-size:12px}.secure{font-size:12px;text-align:center;margin-top:15px}@media(max-width:480px){.wrap{margin:12px auto}.card{padding:20px}h1{font-size:24px}}
</style></head><body><main class="wrap"><div class="brand">MI LOCALITO</div><section class="card"><span class="eyebrow">INICIAR TU PROYECTO</span><h1><?=h($names[$system])?></h1><p>Completa tus datos para registrar tu solicitud y continuar al enlace de anticipo de Mercado Pago.</p><div class="price">Precio total del sistema<strong><?=h($prices[$system])?></strong><p style="margin:6px 0 0">Anticipo inicial del 50%: <b><?=h($deposits[$system])?></b></p></div>
<form method="post" action="socios/sistema/iniciar_compra.php">
<input type="hidden" name="system_code" value="<?=h($system)?>"><input type="hidden" name="socio_id" value="<?=(int)$socioId?>">
<label for="customer_name">Nombre completo *</label><input id="customer_name" name="customer_name" maxlength="150" autocomplete="name" required>
<label for="customer_phone">WhatsApp / teléfono *</label><input id="customer_phone" name="customer_phone" maxlength="30" type="tel" autocomplete="tel" required>
<label for="customer_email">Correo electrónico (opcional)</label><input id="customer_email" name="customer_email" maxlength="190" type="email" autocomplete="email">
<p class="fine">Al continuar, se registrará tu solicitud con el anticipo pendiente y se abrirá Mercado Pago. Tu pago no se considera confirmado hasta verificarlo.</p><button type="submit">Continuar a Mercado Pago</button></form></section><p class="secure">Mi Localito · Sistemas digitales para negocios</p></main></body></html>
