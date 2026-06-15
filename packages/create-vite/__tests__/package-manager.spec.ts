import { describe, expect, it } from 'vitest'
import {
  getFullCustomCommand,
  getInstallCommand,
  getRunCommand,
  isValidPackageManager,
  pkgFromUserAgent,
  VALID_PACKAGE_MANAGERS,
  type PkgInfo,
} from '../src/index.ts'

describe('VALID_PACKAGE_MANAGERS', () => {
  it('includes npm, pnpm, yarn, bun, deno', () => {
    expect(VALID_PACKAGE_MANAGERS).toContain('npm')
    expect(VALID_PACKAGE_MANAGERS).toContain('pnpm')
    expect(VALID_PACKAGE_MANAGERS).toContain('yarn')
    expect(VALID_PACKAGE_MANAGERS).toContain('bun')
    expect(VALID_PACKAGE_MANAGERS).toContain('deno')
  })
})

describe('isValidPackageManager', () => {
  it.each(['npm', 'pnpm', 'yarn', 'bun', 'deno'])(
    'returns true for valid package manager: %s',
    (pm) => {
      expect(isValidPackageManager(pm)).toBe(true)
    },
  )

  it.each(['NPM', 'Pnpm', 'YARN', '', 'cargo', 'pip', 'npm '])('returns false for invalid package manager: %s', (pm) => {
    expect(isValidPackageManager(pm)).toBe(false)
  })
})

describe('pkgFromUserAgent', () => {
  it('parses npm user agent', () => {
    expect(pkgFromUserAgent('npm/10.2.4 node/v20.11.0 linux x64')).toEqual({
      name: 'npm',
      version: '10.2.4',
    })
  })

  it('parses pnpm user agent', () => {
    expect(pkgFromUserAgent('pnpm/9.1.0 npm/? node/v20.11.0 linux x64')).toEqual({
      name: 'pnpm',
      version: '9.1.0',
    })
  })

  it('parses yarn 1.x user agent', () => {
    expect(pkgFromUserAgent('yarn/1.22.21 npm/? node/v20.11.0 linux x64')).toEqual({
      name: 'yarn',
      version: '1.22.21',
    })
  })

  it('parses yarn 4.x user agent', () => {
    expect(pkgFromUserAgent('yarn/4.1.0 npm/? node/v20.11.0 linux x64')).toEqual({
      name: 'yarn',
      version: '4.1.0',
    })
  })

  it('parses bun user agent', () => {
    expect(pkgFromUserAgent('bun/1.0.25 npm/? node/v20.11.0 linux x64')).toEqual({
      name: 'bun',
      version: '1.0.25',
    })
  })

  it('returns undefined for undefined user agent', () => {
    expect(pkgFromUserAgent(undefined)).toBeUndefined()
  })
})

describe('getInstallCommand', () => {
  it('returns [npm, install] for npm', () => {
    expect(getInstallCommand('npm')).toEqual(['npm', 'install'])
  })

  it('returns [pnpm, install] for pnpm', () => {
    expect(getInstallCommand('pnpm')).toEqual(['pnpm', 'install'])
  })

  it('returns [yarn] for yarn (no install subcommand)', () => {
    expect(getInstallCommand('yarn')).toEqual(['yarn'])
  })

  it('returns [bun, install] for bun', () => {
    expect(getInstallCommand('bun')).toEqual(['bun', 'install'])
  })

  it('returns [deno, install] for deno', () => {
    expect(getInstallCommand('deno')).toEqual(['deno', 'install'])
  })
})

describe('getRunCommand', () => {
  it('returns [npm, run, dev] for npm', () => {
    expect(getRunCommand('npm', 'dev')).toEqual(['npm', 'run', 'dev'])
  })

  it('returns [pnpm, dev] for pnpm', () => {
    expect(getRunCommand('pnpm', 'dev')).toEqual(['pnpm', 'dev'])
  })

  it('returns [yarn, dev] for yarn', () => {
    expect(getRunCommand('yarn', 'dev')).toEqual(['yarn', 'dev'])
  })

  it('returns [bun, dev] for bun', () => {
    expect(getRunCommand('bun', 'dev')).toEqual(['bun', 'dev'])
  })

  it('returns [deno, task, dev] for deno', () => {
    expect(getRunCommand('deno', 'dev')).toEqual(['deno', 'task', 'dev'])
  })

  it('defaults to [agent, run, script] for unknown agents', () => {
    expect(getRunCommand('custom-pm', 'build')).toEqual([
      'custom-pm',
      'run',
      'build',
    ])
  })
})

describe('getFullCustomCommand', () => {
  describe('npm create commands', () => {
    const cmd = 'npm create vue@latest TARGET_DIR'

    it('keeps npm create for npm', () => {
      expect(getFullCustomCommand(cmd, { name: 'npm', version: '10.0.0' })).toBe(
        'npm create vue@latest TARGET_DIR',
      )
    })

    it('converts to pnpm create', () => {
      expect(
        getFullCustomCommand(cmd, { name: 'pnpm', version: '9.0.0' }),
      ).toBe('pnpm create vue@latest TARGET_DIR')
    })

    it('converts to yarn create (modern yarn)', () => {
      expect(
        getFullCustomCommand(cmd, { name: 'yarn', version: '4.0.0' }),
      ).toBe('yarn create vue@latest TARGET_DIR')
    })

    it('converts to yarn create and strips @latest for yarn 1.x', () => {
      expect(
        getFullCustomCommand(cmd, { name: 'yarn', version: '1.22.21' }),
      ).toBe('yarn create vue TARGET_DIR')
    })

    it('converts to bun x create- for bun', () => {
      expect(getFullCustomCommand(cmd, { name: 'bun', version: '1.0.0' })).toBe(
        'bun x create-vue@latest TARGET_DIR',
      )
    })

    it('converts to deno run -A npm:create- for deno', () => {
      expect(
        getFullCustomCommand(cmd, { name: 'deno', version: '1.40.0' }),
      ).toBe('deno run -A npm:create-vue@latest TARGET_DIR')
    })

    it('defaults to npm when pkgInfo is undefined', () => {
      expect(getFullCustomCommand(cmd, undefined)).toBe(
        'npm create vue@latest TARGET_DIR',
      )
    })

    it('handles explicit pkgManager with empty version (modern yarn assumed)', () => {
      expect(getFullCustomCommand(cmd, { name: 'yarn', version: '' })).toBe(
        'yarn create vue@latest TARGET_DIR',
      )
    })
  })

  describe('npm create -- commands (with -- separator)', () => {
    const cmd = 'npm create -- vike@latest --vue TARGET_DIR'

    it('preserves -- for npm', () => {
      expect(getFullCustomCommand(cmd, { name: 'npm', version: '10.0.0' })).toBe(
        'npm create -- vike@latest --vue TARGET_DIR',
      )
    })

    it('drops -- for pnpm (pnpm does not support --)', () => {
      expect(
        getFullCustomCommand(cmd, { name: 'pnpm', version: '9.0.0' }),
      ).toBe('pnpm create vike@latest --vue TARGET_DIR')
    })

    it('preserves -- for yarn (modern)', () => {
      expect(
        getFullCustomCommand(cmd, { name: 'yarn', version: '4.0.0' }),
      ).toBe('yarn create -- vike@latest --vue TARGET_DIR')
    })
  })

  describe('npm exec commands', () => {
    const cmd = 'npm exec nuxi init TARGET_DIR'

    it('keeps npm exec for npm', () => {
      expect(getFullCustomCommand(cmd, { name: 'npm', version: '10.0.0' })).toBe(
        'npm exec nuxi init TARGET_DIR',
      )
    })

    it('converts to pnpm dlx', () => {
      expect(
        getFullCustomCommand(cmd, { name: 'pnpm', version: '9.0.0' }),
      ).toBe('pnpm dlx nuxi init TARGET_DIR')
    })

    it('converts to yarn dlx (modern yarn)', () => {
      expect(
        getFullCustomCommand(cmd, { name: 'yarn', version: '4.0.0' }),
      ).toBe('yarn dlx nuxi init TARGET_DIR')
    })

    it('keeps npm exec for yarn 1.x (no dlx support)', () => {
      expect(
        getFullCustomCommand(cmd, { name: 'yarn', version: '1.22.21' }),
      ).toBe('npm exec nuxi init TARGET_DIR')
    })

    it('converts to bun x', () => {
      expect(getFullCustomCommand(cmd, { name: 'bun', version: '1.0.0' })).toBe(
        'bun x nuxi init TARGET_DIR',
      )
    })

    it('converts to deno run -A npm:', () => {
      expect(
        getFullCustomCommand(cmd, { name: 'deno', version: '1.40.0' }),
      ).toBe('deno run -A npm:nuxi init TARGET_DIR')
    })
  })

  describe('npm exec -- commands (with -- separator)', () => {
    const cmd = 'npm exec -- @tanstack/cli@latest create TARGET_DIR --framework react --interactive'

    it('preserves -- for npm', () => {
      expect(getFullCustomCommand(cmd, { name: 'npm', version: '10.0.0' })).toBe(
        'npm exec -- @tanstack/cli@latest create TARGET_DIR --framework react --interactive',
      )
    })

    it('drops -- for pnpm dlx', () => {
      expect(
        getFullCustomCommand(cmd, { name: 'pnpm', version: '9.0.0' }),
      ).toBe(
        'pnpm dlx @tanstack/cli@latest create TARGET_DIR --framework react --interactive',
      )
    })
  })

  describe('explicit --package-manager override (empty version)', () => {
    it('treats explicit pnpm override correctly for create commands', () => {
      const cmd = 'npm create vue@latest TARGET_DIR'
      const explicitPnpm: PkgInfo = { name: 'pnpm', version: '' }
      expect(getFullCustomCommand(cmd, explicitPnpm)).toBe(
        'pnpm create vue@latest TARGET_DIR',
      )
    })

    it('treats explicit bun override correctly for exec commands', () => {
      const cmd = 'npm exec nuxi init TARGET_DIR'
      const explicitBun: PkgInfo = { name: 'bun', version: '' }
      expect(getFullCustomCommand(cmd, explicitBun)).toBe(
        'bun x nuxi init TARGET_DIR',
      )
    })

    it('treats explicit deno override correctly for create commands', () => {
      const cmd = 'npm create vue@latest TARGET_DIR'
      const explicitDeno: PkgInfo = { name: 'deno', version: '' }
      expect(getFullCustomCommand(cmd, explicitDeno)).toBe(
        'deno run -A npm:create-vue@latest TARGET_DIR',
      )
    })

    it('treats explicit yarn override as modern yarn (not 1.x)', () => {
      const cmd = 'npm exec nuxi init TARGET_DIR'
      const explicitYarn: PkgInfo = { name: 'yarn', version: '' }
      expect(getFullCustomCommand(cmd, explicitYarn)).toBe(
        'yarn dlx nuxi init TARGET_DIR',
      )
    })
  })
})
