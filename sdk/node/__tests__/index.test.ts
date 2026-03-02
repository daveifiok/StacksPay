import SBTCGateway from '../src/index';

describe('SBTCGateway SDK', () => {
  let client: SBTCGateway;

  beforeEach(() => {
    client = new SBTCGateway('sk_test_dummy_key');
  });

  describe('Initialization', () => {
    it('should initialize with API key', () => {
      expect(client).toBeInstanceOf(SBTCGateway);
    });

    it('should have payments API', () => {
      expect(client.payments).toBeDefined();
    });

    it('should have merchant API', () => {
      expect(client.merchant).toBeDefined();
    });

    it('should have webhooks API', () => {
      expect(client.webhooks).toBeDefined();
    });

    it('should have API keys API', () => {
      expect(client.apiKeys).toBeDefined();
    });

    it('should have webhook utils', () => {
      expect(client.webhookUtils).toBeDefined();
    });
  });

  describe('Configuration', () => {
    it('should use default base URL', () => {
      const defaultClient = new SBTCGateway('sk_test_key');
      expect(defaultClient).toBeDefined();
    });

    it('should accept custom base URL', () => {
      const customClient = new SBTCGateway('sk_test_key', {
        baseURL: 'https://custom.api.com'
      });
      expect(customClient).toBeDefined();
    });

    it('should accept custom timeout and retries', () => {
      const customClient = new SBTCGateway('sk_test_key', {
        timeout: 60000,
        retries: 5
      });
      expect(customClient).toBeDefined();
    });
  });
});
