import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { defaultShell } from '../src/terminal.js';

describe('defaultShell', () => {
  it('prefers SHELL when set', () => {
    assert.equal(defaultShell({ SHELL: '/bin/zsh' }, 'win32'), '/bin/zsh');
  });
  it('uses COMSPEC on Windows, then powershell', () => {
    assert.equal(
      defaultShell({ COMSPEC: 'C:\\Windows\\system32\\cmd.exe' }, 'win32'),
      'C:\\Windows\\system32\\cmd.exe',
    );
    assert.equal(defaultShell({}, 'win32'), 'powershell.exe');
  });
  it('falls back to bash elsewhere', () => {
    assert.equal(defaultShell({}, 'linux'), 'bash');
  });
});
