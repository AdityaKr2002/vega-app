import {beforeEach, describe, expect, it, jest} from '@jest/globals';

jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: {
    MD5: 'MD5',
    SHA1: 'SHA-1',
    SHA256: 'SHA-256',
    SHA384: 'SHA-384',
    SHA512: 'SHA-512',
  },
}));

jest.mock('../src/lib/providers/getBaseUrl', () => ({
  getBaseUrl: jest.fn(),
}));

jest.mock('../src/lib/services/wafResolver', () => ({
  openWebView: jest.fn(),
}));

jest.mock('../src/lib/sandbox/providerFetch', () => ({
  providerFetch: jest.fn(),
}));

const mockStorageMap = new Map<string, string>();

jest.mock('react-native-mmkv-storage', () => ({
  MMKVLoader: class {
    private instanceId = 'default';

    withInstanceID(instanceId: string) {
      this.instanceId = instanceId;
      return this;
    }

    initialize() {
      return {
        clearStore: () => mockStorageMap.clear(),
        getString: (key: string) => mockStorageMap.get(key),
        setString: (key: string, value: string) => mockStorageMap.set(key, value),
        removeItem: (key: string) => mockStorageMap.delete(key),
        getBool: jest.fn(),
        getInt: jest.fn(),
        setBool: jest.fn(),
        setInt: jest.fn(),
        indexer: {
          getKeys: async () => Array.from(mockStorageMap.keys()),
        },
      };
    }
  },
}));

import {handleProviderRpc} from '../src/lib/sandbox/providerRpc';
import {openWebView} from '../src/lib/services/wafResolver';

const mockOpenWebView = jest.mocked(openWebView);

describe('providerRpc openWebView', () => {
  beforeEach(() => {
    mockOpenWebView.mockReset();
    mockStorageMap.clear();
  });

  it('returns cookies scoped to a validated third-party challenge URL', async () => {
    const result = {
      data: '<html></html>',
      cookies: 'cf_clearance=mobile-token',
      cookieMap: {cf_clearance: 'mobile-token'},
      userAgent: 'Vega Test',
      url: 'https://drive.example.com',
    };
    mockOpenWebView.mockResolvedValue(result);

    await expect(
      handleProviderRpc('uhd', 'openWebView', {
        url: result.url,
        options: {waitForCookie: 'cf_clearance'},
      }),
    ).resolves.toEqual({...result, cookie: result.cookies});
    expect(mockOpenWebView).toHaveBeenCalledWith(`${result.url}/`, {
      waitForCookie: 'cf_clearance',
    });
  });
});

describe('providerRpc KV store operations', () => {
  beforeEach(() => {
    mockStorageMap.clear();
  });

  it('sets and gets KV entries properly', async () => {
    await handleProviderRpc('uhd', 'kvSet', {
      key: 'auth_session',
      value: {token: 'abc123xyz', expires: 999999},
    });

    const stored = await handleProviderRpc('uhd', 'kvGet', {
      key: 'auth_session',
    });
    expect(stored).toEqual({token: 'abc123xyz', expires: 999999});
  });

  it('returns undefined for non-existent key', async () => {
    const stored = await handleProviderRpc('uhd', 'kvGet', {
      key: 'non_existent',
    });
    expect(stored).toBeUndefined();
  });

  it('deletes KV entries and lists keys', async () => {
    await handleProviderRpc('uhd', 'kvSet', {key: 'key1', value: 'val1'});
    await handleProviderRpc('uhd', 'kvSet', {key: 'key2', value: 'val2'});

    const keys = await handleProviderRpc('uhd', 'kvKeys', {});
    expect(keys).toEqual(['key1', 'key2']);

    const deleted = await handleProviderRpc('uhd', 'kvDelete', {key: 'key1'});
    expect(deleted).toBe(true);

    const remainingKeys = await handleProviderRpc('uhd', 'kvKeys', {});
    expect(remainingKeys).toEqual(['key2']);
  });

  it('clears all KV entries', async () => {
    await handleProviderRpc('uhd', 'kvSet', {key: 'k1', value: 1});
    await handleProviderRpc('uhd', 'kvSet', {key: 'k2', value: 2});

    await handleProviderRpc('uhd', 'kvClear', {});
    const keys = await handleProviderRpc('uhd', 'kvKeys', {});
    expect(keys).toEqual([]);
  });

  it('rejects invalid keys', async () => {
    await expect(
      handleProviderRpc('uhd', 'kvSet', {key: '', value: 'test'}),
    ).rejects.toThrow('Invalid KV key');

    await expect(
      handleProviderRpc('uhd', 'kvGet', {key: '   '}),
    ).rejects.toThrow('Invalid KV key');
  });
});
