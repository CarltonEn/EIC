const PLACEHOLDER_MARKERS = [
  'change_this',
  'replace_me',
  'your_',
  'example',
  'placeholder',
  'xxxx',
  'test_key',
];

const PROVIDERS = [
  {
    id: 'stripe',
    label: 'Stripe Checkout',
    category: 'payments',
    required: ['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY'],
    recommended: ['STRIPE_WEBHOOK_SECRET'],
    mockable: false,
    paymentMethod: {
      label: 'Card via Stripe',
      description: 'Hosted Checkout with signed webhook reconciliation.',
      currencies: ['usd', 'ugx', 'kes', 'tzs', 'eur', 'gbp'],
      settlement: 'Stripe balance, then configured payout account',
      livePath: true,
    },
  },
  {
    id: 'mtn_momo',
    label: 'MTN MoMo',
    category: 'payments',
    required: ['MTN_MOMO_SUBSCRIPTION_KEY', 'MTN_MOMO_API_USER', 'MTN_MOMO_API_KEY'],
    recommended: ['MTN_MOMO_ENV'],
    mockable: true,
    paymentMethod: {
      label: 'MTN MoMo',
      description: 'Adapter-ready mobile money collection for Uganda.',
      currencies: ['ugx'],
      settlement: 'Centenary settlement adapter',
    },
  },
  {
    id: 'airtel_money',
    label: 'Airtel Money',
    category: 'payments',
    required: ['AIRTEL_CLIENT_ID', 'AIRTEL_CLIENT_SECRET'],
    recommended: ['AIRTEL_ENV'],
    mockable: true,
    paymentMethod: {
      label: 'Airtel Money',
      description: 'Adapter-ready Airtel collection and disbursement.',
      currencies: ['ugx', 'tzs'],
      settlement: 'Centenary settlement adapter',
    },
  },
  {
    id: 'mpesa',
    label: 'M-Pesa',
    category: 'payments',
    required: ['MPESA_CONSUMER_KEY', 'MPESA_CONSUMER_SECRET'],
    recommended: ['MPESA_ENV', 'MPESA_SHORTCODE'],
    mockable: true,
    paymentMethod: {
      label: 'M-Pesa',
      description: 'Adapter-ready Safaricom collection path.',
      currencies: ['kes'],
      settlement: 'Centenary settlement adapter',
    },
  },
  {
    id: 'flutterwave',
    label: 'Flutterwave',
    category: 'payments',
    required: ['FLUTTERWAVE_SECRET_KEY', 'FLUTTERWAVE_PUBLIC_KEY'],
    recommended: ['FLUTTERWAVE_WEBHOOK_SECRET'],
    mockable: true,
    paymentMethod: {
      label: 'Flutterwave',
      description: 'Pan-African cards, mobile money, and bank transfer adapter.',
      currencies: ['ugx', 'kes', 'tzs', 'usd'],
      settlement: 'Centenary settlement adapter',
    },
  },
  {
    id: 'centenary_settlement',
    label: 'Centenary Settlement',
    category: 'banking',
    required: ['CENTENARY_ACCOUNT', 'CENTENARY_NAME', 'CENTENARY_BANK'],
    recommended: ['CENTENARY_BRANCH', 'CENTENARY_CURRENCY'],
    mockable: true,
  },
  {
    id: 'ura_efris',
    label: 'URA EFRIS',
    category: 'tax',
    required: ['URA_EFRIS_API_URL', 'URA_EFRIS_TIN', 'URA_EFRIS_DEVICE_NO', 'URA_EFRIS_PRIVATE_KEY'],
    recommended: ['URA_EFRIS_ENV'],
    mockable: true,
  },
  {
    id: 'aria',
    label: 'ARIA AI',
    category: 'ai',
    required: ['ANTHROPIC_API_KEY'],
    recommended: ['ANTHROPIC_MODEL'],
    mockable: true,
  },
];

function isConfiguredValue(value) {
  if (!value) return false;
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return false;
  return !PLACEHOLDER_MARKERS.some(marker => normalized.includes(marker));
}

function mockProvidersEnabled() {
  return process.env.EIC_MOCK_PROVIDERS !== 'false';
}

function readMode(provider) {
  if (provider.id === 'stripe') {
    const secret = process.env.STRIPE_SECRET_KEY || '';
    if (secret.startsWith('sk_live_')) return 'live';
    if (secret.startsWith('sk_test_')) return 'test';
    return 'configured';
  }

  const explicit = {
    mtn_momo: process.env.MTN_MOMO_ENV,
    airtel_money: process.env.AIRTEL_ENV,
    mpesa: process.env.MPESA_ENV,
    flutterwave: process.env.FLUTTERWAVE_ENV,
    ura_efris: process.env.URA_EFRIS_ENV,
    aria: process.env.ANTHROPIC_MODEL ? 'configured' : undefined,
  }[provider.id];

  return explicit || 'configured';
}

function getIntegrationStatuses() {
  const mockEnabled = mockProvidersEnabled();
  return PROVIDERS.map(provider => {
    const missingRequired = provider.required.filter(name => !isConfiguredValue(process.env[name]));
    const missingRecommended = provider.recommended.filter(name => !isConfiguredValue(process.env[name]));
    const configured = missingRequired.length === 0;
    const available = configured || (provider.mockable && mockEnabled);
    const mode = configured ? readMode(provider) : available ? 'mock' : 'missing';

    return {
      id: provider.id,
      label: provider.label,
      category: provider.category,
      configured,
      available,
      mode,
      missingRequired,
      missingRecommended,
      serverOnly: true,
      message: configured
        ? `${provider.label} is configured server-side.`
        : available
          ? `${provider.label} is using the mock adapter until server credentials are supplied.`
          : `${provider.label} is unavailable because required server credentials are missing.`,
    };
  });
}

function getProviderStatus(id) {
  return getIntegrationStatuses().find(provider => provider.id === id) || null;
}

function getPaymentMethods() {
  const statuses = getIntegrationStatuses();
  const byId = new Map(statuses.map(status => [status.id, status]));
  return PROVIDERS
    .filter(provider => provider.paymentMethod)
    .map(provider => {
      const status = byId.get(provider.id);
      return {
        id: provider.id,
        ...provider.paymentMethod,
        configured: status.configured,
        available: status.available,
        mode: status.mode,
        message: status.message,
      };
    });
}

module.exports = {
  PROVIDERS,
  getIntegrationStatuses,
  getPaymentMethods,
  getProviderStatus,
  isConfiguredValue,
  mockProvidersEnabled,
};
