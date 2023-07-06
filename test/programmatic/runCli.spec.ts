import path from 'node:path'
import { tmpdir } from 'node:os'
import fs from 'fs-extra'
import { type SpyInstance } from 'vitest'
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'
import type { Runner } from '../../src'
import { AGENTS, parseNi, runCli } from '../../src'

let basicLog: SpyInstance, errorLog: SpyInstance, warnLog: SpyInstance, infoLog: SpyInstance

function runCliTest(fixtureName: string, agent: string, runner: Runner, args: string[]) {
  return async () => {
    const cwd = await fs.mkdtemp(path.join(tmpdir(), 'ni-'))
    const fixture = path.join(__dirname, '..', 'fixtures', fixtureName, agent)
    await fs.copy(fixture, cwd)

    await runCli(async (agent, _, ctx) => {
      return runner(agent, args, ctx)
    }, {
      programmatic: true,
      cwd,
    }).catch((e) => {
      if (e.command)
        expect(e.command).toMatchSnapshot()
      else
        expect(e.message).toMatchSnapshot()
    })
  }
}

beforeAll(() => {
  basicLog = vi.spyOn(console, 'log')
  warnLog = vi.spyOn(console, 'warn')
  errorLog = vi.spyOn(console, 'error')
  infoLog = vi.spyOn(console, 'info')

  vi.mock('execa', async (importOriginal) => {
    const mod = await importOriginal() as any
    return {
      ...mod,
      execaCommand: (cmd: string) => {
        // break execution flow for easier snapshotting
        // eslint-disable-next-line no-throw-literal
        throw { command: cmd }
      },
    }
  })
})

afterAll(() => {
  vi.resetAllMocks()
})

const agents = [...Object.keys(AGENTS), 'unknown']
const fixtures = ['lockfile', 'packager']

// matrix testing of: fixtures x agents x commands
fixtures.forEach(fixture => describe(fixture, () => agents.forEach(agent => describe(agent, () => {
/** ni */
  test('ni', runCliTest(fixture, agent, parseNi, []))
  test('ni foo', runCliTest(fixture, agent, parseNi, ['foo']))
  test('ni foo -D', runCliTest(fixture, agent, parseNi, ['foo', '-D']))
  test('ni --frozen', runCliTest(fixture, agent, parseNi, ['--frozen']))
  test('ni -g foo', runCliTest(fixture, agent, parseNi, ['-g', 'foo']))

  test('no logs', () => {
    expect(basicLog).not.toHaveBeenCalled()
    expect(warnLog).not.toHaveBeenCalled()
    expect(errorLog).not.toHaveBeenCalled()
    expect(infoLog).not.toHaveBeenCalled()
  })
}))))
