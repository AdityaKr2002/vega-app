import {describe, expect, it} from '@jest/globals';
import {serializeBody} from '../src/lib/sandbox/runtime/runtimeSupport';

describe('sandbox runtime body serialization', () => {
  it('preserves string FormData fields for native reconstruction', async () => {
    const body = new FormData();
    body.append('token', 'abc123');
    body.append('action', 'download');

    await expect(serializeBody(body)).resolves.toEqual({
      kind: 'form-data',
      entries: [
        ['token', 'abc123'],
        ['action', 'download'],
      ],
    });
  });

  it('preserves URLSearchParams as urlencoded text', async () => {
    const body = new URLSearchParams({token: 'abc123', action: 'download'});

    await expect(serializeBody(body)).resolves.toEqual({
      kind: 'text',
      value: 'token=abc123&action=download',
    });
  });
});
