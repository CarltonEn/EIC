jest.mock('nodemailer', () => {
  return {
    createTransport: jest.fn(() => ({
      sendMail: jest.fn().mockResolvedValue({ messageId: 'mocked-id' }),
    })),
  };
});

const nodemailer = require('nodemailer');
const request = require('supertest');
const { app, initDb, sendNotification } = require('./server');

async function createAuthedUser() {
  const email = `tester-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Test User', email, password: 'password123' });
  if (res.status !== 201) {
    throw new Error(`Unable to create test user: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return { token: res.body.token, user: res.body.user };
}

describe('sendNotification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.DISABLE_EMAIL;
  });

  it('sends an email and resolves with no error', async () => {
    await expect(sendNotification('Subject', '<p>Body</p>')).resolves.toBeUndefined();
    const transport = nodemailer.createTransport.mock.results[0].value;
    expect(transport.sendMail).toHaveBeenCalledWith(expect.objectContaining({
      subject: 'Subject',
      html: '<p>Body</p>',
    }));
  });

  it('does not send email when DISABLE_EMAIL=true', async () => {
    process.env.DISABLE_EMAIL = 'true';
    await expect(sendNotification('Stop', '<p>Skip</p>')).resolves.toBeUndefined();
    expect(nodemailer.createTransport).not.toHaveBeenCalled();
  });
});

describe('API endpoints', () => {
  beforeAll(async () => {
    process.env.DISABLE_EMAIL = 'true';
    delete process.env.ANTHROPIC_API_KEY;
    await initDb();
  });

  it('responds to Twilio webhook', async () => {
    const res = await request(app)
      .post('/api/twilio/sms-webhook')
      .type('form')
      .send({ From: '+1234567890', To: '+15551234567', Body: 'Test SMS' });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/xml/);
    expect(res.text).toContain('Thanks for your message');
  });

  it('blocks unauthenticated admin request', async () => {
    const res = await request(app).get('/api/admin/demo-requests');
    expect(res.status).toBe(401);
  });

  it('returns launch health status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      status: 'ok',
      app: 'EIC Enterprise',
      database: 'ready',
    }));
    expect(res.body.stripe).toEqual(expect.objectContaining({
      configured: expect.any(Boolean),
    }));
    expect(res.body.integrations).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'mtn_momo', serverOnly: true }),
      expect.objectContaining({ id: 'ura_efris', serverOnly: true }),
      expect.objectContaining({ id: 'aria', serverOnly: true }),
    ]));
  });

  it('reports sanitized integration statuses and payment methods', async () => {
    const status = await request(app).get('/api/integrations/status');
    expect(status.status).toBe(200);
    expect(status.body.providers).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'mtn_momo',
        mode: expect.any(String),
        missingRequired: expect.any(Array),
      }),
    ]));
    expect(JSON.stringify(status.body)).not.toContain('32046608770');

    const methods = await request(app).get('/api/payments/methods');
    expect(methods.status).toBe(200);
    expect(methods.body).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'mtn_momo', available: true }),
      expect.objectContaining({ id: 'flutterwave', available: true }),
    ]));
  });

  it('validates provider-neutral payment initiation', async () => {
    const { token } = await createAuthedUser();
    const invalid = await request(app)
      .post('/api/payments/initiate')
      .set('Authorization', `Bearer ${token}`)
      .send({ provider: 'mtn_momo', amount: 0, currency: 'UGX' });
    expect(invalid.status).toBe(400);

    const created = await request(app)
      .post('/api/payments/initiate')
      .set('Authorization', `Bearer ${token}`)
      .send({ provider: 'mtn_momo', amount: 25000, currency: 'UGX', description: 'Mock MoMo collection' });
    expect([200, 201, 202]).toContain(created.status);
    expect(created.body.payment).toEqual(expect.objectContaining({
      provider: 'mtn_momo',
      currency: 'ugx',
      settlementStatus: expect.any(String),
    }));

    const fetched = await request(app)
      .get(`/api/payments/${created.body.payment.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.provider).toBe('mtn_momo');
  });

  it('records provider webhook events without exposing secrets', async () => {
    const res = await request(app)
      .post('/api/payments/webhooks/mtn_momo')
      .set('x-eic-signature', 'test-signature')
      .send({ id: 'evt-test', type: 'collection.completed', reference: 'MTN-TEST', status: 'succeeded' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      received: true,
      provider: 'mtn_momo',
      signature: 'present',
    }));
  });

  it('queues EFRIS submission through the adapter fallback', async () => {
    const { token } = await createAuthedUser();
    const invoice = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${token}`)
      .send({ client_name: 'Launch Client Ltd', amount: 100000, currency: 'UGX' });
    expect(invoice.status).toBe(201);

    const submit = await request(app)
      .post(`/api/invoices/${invoice.body.id}/efris-submit`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect([200, 202]).toContain(submit.status);
    expect(submit.body.invoice).toEqual(expect.objectContaining({
      efris_reference: expect.any(String),
      efris_provider_status: expect.any(String),
    }));
  });

  it('returns ARIA local intelligence when Anthropic is not configured', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const { token } = await createAuthedUser();
    const res = await request(app)
      .post('/api/aria/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ messages: [{ role: 'user', content: 'Show EFRIS status' }] });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      mode: 'local',
      degraded: true,
      reply: expect.stringContaining('EFRIS'),
    }));
  });
});
