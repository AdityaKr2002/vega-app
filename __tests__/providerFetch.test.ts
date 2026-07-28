import {beforeEach, describe, expect, it, jest} from '@jest/globals';

jest.mock('axios', () => ({
  __esModule: true,
  default: {request: jest.fn()},
}));

jest.mock('../src/lib/services/cookieManager', () => ({
  buildCookieString: (cookies: Record<string, string>) =>
    Object.entries(cookies)
      .map(([name, value]) => `${name}=${value}`)
      .join('; '),
  getCookies: jest.fn(),
}));

jest.mock('../src/lib/sandbox/rateLimiter', () => ({
  providerRateLimiter: {
    acquire: jest.fn(async () => jest.fn()),
  },
}));

import axios from 'axios';
import {getCookies} from '../src/lib/services/cookieManager';
import {providerFetch} from '../src/lib/sandbox/providerFetch';

const mockAxiosRequest = jest.mocked(axios.request);
const mockGetCookies = jest.mocked(getCookies);

const emptyRequest = {
  method: 'POST',
  headers: [] as Array<[string, string]>,
  body: {kind: 'none' as const},
};

describe('providerFetch cookies', () => {
  beforeEach(() => {
    mockAxiosRequest.mockReset();
    mockGetCookies.mockReset();
    mockAxiosRequest.mockResolvedValue({
      status: 200,
      statusText: 'OK',
      headers: {},
      data: new Uint8Array(0),
      request: {responseURL: 'https://drive.example.com/form'},
    });
  });

  it('injects cookies scoped to the request URL', async () => {
    mockGetCookies.mockResolvedValue({session: 'mobile-token'});

    await providerFetch('https://drive.example.com/form', emptyRequest);

    expect(mockGetCookies).toHaveBeenCalledWith(
      'https://drive.example.com/form',
    );
    expect(mockAxiosRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({Cookie: 'session=mobile-token'}),
      }),
    );
  });

  it('does not replace a provider supplied cookie header', async () => {
    mockGetCookies.mockResolvedValue({session: 'native-token'});

    await providerFetch('https://drive.example.com/form', {
      ...emptyRequest,
      headers: [['cookie', 'session=provider-token']],
    });

    expect(mockAxiosRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          cookie: 'session=provider-token',
        }),
      }),
    );
  });
});
