import type { Agent, Command } from './agents'
import { AGENTS } from './agents'
import type { Runner } from './runner'
import { exclude } from './utils'

export class UnsupportedCommand extends Error {
  constructor({ agent, command }: { agent: Agent; command: Command }) {
    super(`Command "${command}" is not support by agent "${agent}"`)
  }
}

export function getCommand(agent: Agent, command: Command, args: string[] = []) {
  if (!(agent in AGENTS))
    throw new Error(`Unsupported agent "${agent}"`)

  const c = AGENTS[agent][command]

  if (typeof c === 'function')
    return c(args)

  if (!c)
    throw new UnsupportedCommand({ agent, command })

  return c.replace('{0}', args.join(' ').trim())
}

export const parseNi = <Runner>((agent, args, ctx) => {
  if (args.includes('-g'))
    return getCommand(agent, 'global', exclude(args, '-g'))

  if (args.includes('--frozen-if-present')) {
    args = exclude(args, '--frozen-if-present')
    return getCommand(agent, ctx?.hasLock ? 'frozen' : 'install', args)
  }

  if (args.includes('--frozen'))
    return getCommand(agent, 'frozen', exclude(args, '--frozen'))

  if (args.length === 0 || args.every(i => i.startsWith('-')))
    return getCommand(agent, 'install', args)

  return getCommand(agent, 'add', args)
})
