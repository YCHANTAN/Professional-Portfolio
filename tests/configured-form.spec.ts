import { test, expect } from '@playwright/test';
test('sending locks fields and mocked success resets the form', async ({ page }) => {
  await page.route('https://api.web3forms.com/submit', async route => {
    await new Promise(resolve => setTimeout(resolve, 700));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
  });
  await page.goto('/');
  await page.getByLabel('Your name').fill('Recruiter');
  await page.getByLabel('Your email').fill('recruiter@example.com');
  await page.getByLabel('What do you have in mind?').fill('An internship opportunity.');
  await page.getByRole('button', { name: 'Send Message', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Sending…' })).toBeDisabled();
  await expect(page.locator('.form-actions .icon-spinner')).toBeVisible();
  await expect(page.getByLabel('What do you have in mind?')).toBeDisabled();
  await expect(page.getByLabel('Your name')).toBeDisabled();
  await expect(page.locator('.form-status')).toContainText('Message sent successfully');
  await expect(page.getByLabel('What do you have in mind?')).toHaveValue('');
  await expect(page.getByLabel('What do you have in mind?')).toBeEnabled();
  const sent = page.getByRole('button', { name: 'Sent', exact: true });
  await expect(sent).toHaveClass(/button-sent/);
  await expect(sent.locator('svg')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Send Message', exact: true })).toBeVisible({ timeout: 5000 });
});
test('delivery failure preserves text for retry', async ({ page }) => {
  await page.route('https://api.web3forms.com/submit', route => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ success: false }) }));
  await page.goto('/');
  await page.getByLabel('Your name').fill('Recruiter');
  await page.getByLabel('Your email').fill('recruiter@example.com');
  await page.getByRole('radio', { name: 'A project', exact: true }).check();
  await page.getByLabel('What do you have in mind?').fill('Please preserve this message.');
  await page.getByRole('button', { name: 'Send Message', exact: true }).click();
  await expect(page.locator('.form-status')).toContainText('could not be confirmed');
  await expect(page.getByLabel('What do you have in mind?')).toHaveValue('Please preserve this message.');
  await expect(page.getByRole('radio', { name: 'A project', exact: true })).toBeChecked();
  await expect(page.getByRole('button', { name: 'Send Message', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Sent', exact: true })).toHaveCount(0);
});

test('direct submission sends the expected payload once and animates a confirmed success', async ({ page }) => {
  let requests = 0;
  let payload: Record<string, unknown> = {};
  await page.route('https://api.web3forms.com/submit', async route => {
    requests++;
    payload = route.request().postDataJSON();
    await new Promise(resolve => setTimeout(resolve, 800));
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
  });
  await page.goto('/');
  await page.getByLabel('Your name').fill('Recruiter');
  await page.getByLabel('Your email').fill('recruiter@example.com');
  await page.getByRole('radio', { name: 'An internship', exact: true }).check();
  await page.getByLabel('What do you have in mind?').fill('Please send directly to Gmail.');
  await page.getByRole('button', { name: 'Send Message', exact: true }).click();
  await page.locator('.contact-form').evaluate(form => { form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
  await expect(page.getByRole('button', { name: 'Sending…' })).toBeDisabled();
  await expect(page.getByRole('radio', { name: 'An internship', exact: true })).toBeDisabled();
  await expect(page.locator('.send-button-content .icon-spinner')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sent', exact: true })).toHaveClass(/button-sent/);
  expect(requests).toBe(1);
  expect(payload).toMatchObject({ access_key: 'test-only-not-a-real-key', name: 'Recruiter', email: 'recruiter@example.com', message: 'Please send directly to Gmail.', subject: 'New Portfolio Contact Form Submission', from_name: "Christian's Portfolio", inquiry_type: 'An internship', botcheck: false });
  await expect(page.getByRole('radio', { name: 'An internship', exact: true })).not.toBeChecked();
  await expect(page.getByRole('link', { name: /Open draft/ })).toHaveCount(0);
  await page.waitForTimeout(250);
  await page.screenshot({ path: 'test-results/direct-contact-success.png' });
});

test('HTTP OK without confirmed success must not show Sent', async ({ page }) => {
  await page.route('https://api.web3forms.com/submit', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":false}' }));
  await page.goto('/');
  await page.getByLabel('Your name').fill('Recruiter');
  await page.getByLabel('Your email').fill('recruiter@example.com');
  await page.getByLabel('What do you have in mind?').fill('Keep this if rejected.');
  await page.getByRole('button', { name: 'Send Message', exact: true }).click();
  await expect(page.locator('.form-status')).toContainText('could not be confirmed');
  await expect(page.getByRole('button', { name: 'Sent', exact: true })).toHaveCount(0);
  await expect(page.getByLabel('What do you have in mind?')).toHaveValue('Keep this if rejected.');
});
