import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('compraventa: bloqueo, revisión de versión, identificación, cobro y entrega', async ({ page }) => {
  await page.goto('/expedientes/2026-0048/actuacion');
  await expect(page.getByRole('button', { name: 'Simular actuación notarial' })).toBeDisabled();
  await page.getByRole('link', { name: 'Requisitos', exact: true }).click();
  await page.getByRole('checkbox', { name: /Representación aplicable/ }).check();
  await page.getByRole('link', { name: 'Documento', exact: true }).click();
  await page.getByRole('button', { name: 'Marcar versión revisada' }).click();
  await page.getByRole('button', { name: 'Crear nueva versión demo' }).click();
  await expect(page.getByText('Revisión pendiente', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Marcar versión revisada' }).click();
  await page.getByRole('link', { name: 'Identificación', exact: true }).click();
  const result = page.getByLabel('Resultado de prueba');
  await result.selectOption('No coincidencia');
  await page.getByRole('button', { name: 'Aplicar resultado demo' }).first().click();
  await page.getByRole('link', { name: 'Actuación', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Simular actuación notarial' })).toBeDisabled();
  await page.getByRole('link', { name: 'Identificación', exact: true }).click();
  await page.getByRole('button', { name: 'Aplicar resultado demo' }).first().click();
  await page.getByRole('button', { name: 'Aplicar resultado demo' }).nth(1).click();
  await page.getByRole('link', { name: 'Actuación', exact: true }).click();
  await page.getByRole('button', { name: 'Simular actuación notarial' }).click();
  await expect(page.getByRole('heading', { name: 'Actuación simulada registrada' })).toBeVisible();
  await page.getByRole('link', { name: 'Entrega', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Registrar entrega demo' })).toBeDisabled();
  await page.getByRole('link', { name: 'Cobros', exact: true }).click();
  await page.getByLabel('Importe en soles').fill('750.01');
  await page.getByRole('button', { name: 'Registrar cobro demo', exact: true }).click();
  await expect(page.locator('#payment-error')).toContainText('no superar el saldo');
  await page.getByLabel('Importe en soles').fill('750');
  await page.getByRole('button', { name: 'Registrar cobro demo', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Saldo cancelado en demo' })).toBeDisabled();
  await page.getByRole('link', { name: 'Entrega', exact: true }).click();
  await page.getByRole('button', { name: 'Registrar entrega demo' }).click();
  await expect(page.getByRole('heading', { name: 'Entrega demo completada' })).toBeVisible();
});
test('certificación y carta usan requisitos distintos; creación y diligencias', async ({ page }) => {
  await page.goto('/expedientes/nuevo');
  await page.getByRole('radio', { name: /Certificación de firmas/ }).check();
  await page.getByLabel('Nombre ficticio del solicitante').fill('Sofía Ficticia');
  await page.getByLabel('Asunto del expediente').fill('Certificación de contrato de prueba');
  await page.getByRole('button', { name: 'Crear expediente' }).click();
  await page.getByRole('link', { name: 'Requisitos', exact: true }).click();
  await expect(page.getByRole('checkbox')).toHaveCount(2);
  await expect(page.getByRole('checkbox', { name: /Minuta/ })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Diligencia', exact: true })).toHaveCount(0);
  await page.getByText('Más', { exact: true }).click();
  await page.getByRole('link', { name: 'Diligencias', exact: true }).click();
  await page.getByRole('link', { name: /2026-0046/ }).click();
  await page.getByLabel('Observación ficticia').fill('Intento ficticio sin respuesta; sin datos reales.');
  await page.getByRole('button', { name: 'Registrar intento demo' }).click();
  await expect(page.getByText('Intento 1: Sin respuesta')).toBeVisible();
  await page.getByRole('combobox', { name: 'Resultado', exact: true }).selectOption('Entregada');
  await page.getByLabel('Observación ficticia').fill('Segundo intento de demostración.');
  await page.getByRole('button', { name: 'Registrar intento demo' }).click();
  await expect(page.getByText('Intento 1: Sin respuesta')).toBeVisible();
  await expect(page.getByText('Intento 2: Entregada')).toBeVisible();
});
test('búsqueda, filtros, páginas, tablero y diálogo por teclado', async ({ page }) => {
  await page.goto('/expedientes');
  await page.getByLabel('Buscar en expedientes').fill('no-existe-demo');
  await expect(page.getByRole('heading', { name: 'No hay expedientes con estos filtros' })).toBeVisible();
  await page.getByRole('button', { name: 'Limpiar filtros' }).click();
  await page.getByRole('button', { name: 'Página siguiente' }).click();
  await expect(page.getByRole('link', { name: /Abrir expediente 2026-0042/ })).toBeVisible();
  await page.getByRole('button', { name: 'Tablero', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Listo para entrega/ })).toBeVisible();
  await page.keyboard.press('Control+k');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Kardex, persona o acto').fill('Valeria');
  await expect(dialog.getByRole('link')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
});
test('acceso y segundo factor explícitamente simulados', async ({ page }) => {
  await page.goto('/acceso');
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Verificación en dos pasos' })).toBeVisible();
  await page.getByRole('link', { name: 'Continuar demostración' }).click();
  await expect(page.getByRole('heading', { name: 'Tu jornada, en orden.' })).toBeVisible();
});
test('login comparte estética ElDial en escritorio y móvil', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const [width, height] of [[1440, 1000], [390, 844]]) {
    await page.setViewportSize({ width, height });
    await page.goto('/acceso');
    await page.evaluate(() => document.fonts.ready);
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(result.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target).join(',')}`)).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByLabel('Usuario', { exact: true })).toHaveValue('asistente.demo');
    await page.getByRole('button', { name: 'Mostrar contraseña de ejemplo' }).click();
    await expect(page.getByLabel('Contraseña', { exact: true })).toHaveAttribute('type', 'text');
    await page.screenshot({ path: `docs/evidence/fase-1-login-${width}.png`, fullPage: true });
  }
});
test('sin errores del navegador en las vistas principales', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  const routes = ['/inicio', '/expedientes', '/expedientes/nuevo', '/expedientes/2026-0048', '/expedientes/2026-0048/documento', '/personas', '/documentos', '/caja', '/diligencias', '/agenda', '/cumplimiento/plaft', '/cumplimiento/privacidad', '/configuracion', '/acceso'];
  for (const route of routes) { const response = await page.goto(route); expect(response?.status()).toBe(200); await expect(page.locator('h1')).toBeVisible(); }
  expect(errors).toEqual([]);
});
for (const [width, height] of [[1366,768], [1280,1024], [1024,768], [390,844], [375,812], [844,390], [683,768]]) {
  test(`disposición y contraste inicial ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({width, height});
    await page.goto('/inicio');
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const results = await new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(results.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target).join(',')}`)).toEqual([]);
    if (width === 390) await page.screenshot({ path: 'docs/evidence/fase-1-movil.png', fullPage: true });
    if (width === 1366) await page.screenshot({ path: 'docs/evidence/fase-1-escritorio.png', fullPage: true });
  });
}
test('tema oscuro, movimiento reducido, menú móvil y formulario accesible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/inicio');
  await page.getByRole('button', { name: 'Activar tema oscuro' }).click();
  let result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(result.violations.map(v => v.id)).toEqual([]);
  await page.getByRole('button', { name: 'Abrir navegación' }).click();
  await page.getByRole('link', { name: 'Expedientes', exact: false }).first().click();
  await page.getByRole('link', { name: 'Nuevo expediente' }).click();
  result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(result.violations.map(v => v.id)).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'docs/evidence/fase-1-nuevo-oscuro.png', fullPage: true });
});
