import { expect, test } from 'vitest'
import { parseNi } from '../../src/commands'

const agent = 'npm'

function _(arg: string, expected: string, hasLock?: boolean) {
  return () => {
    expect(
      parseNi(agent, arg.split(' ').filter(Boolean), { hasLock }),
    ).toBe(
      expected,
    )
  }
}

test('empty', _('', 'npm i '))

test('single add', _('axios', 'npm i axios'))

test('multiple', _('eslint @types/node', 'npm i eslint @types/node'))

test('-D', _('eslint @types/node -D', 'npm i eslint @types/node -D'))

test('global', _('eslint -g', 'npm i -g eslint'))

test('frozen', _('--frozen', 'npm ci'))

test('frozen-if-present', _('--frozen-if-present', 'npm ci', true))
