This file is a merged representation of the entire codebase, combined into a single document by Repomix.

# File Summary

## Purpose
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
```
.github/
  workflows/
    ci.yml
src/
  __tests__/
    keyboard/
      provider.test.tsx
    screen/
      hook.test.tsx
      provider.test.tsx
      registry.test.ts
    integration.test.tsx
  components/
    select/
      SelectInput.tsx
      types.ts
  keyboard/
    context.ts
    hook.ts
    index.ts
    provider.tsx
    README.md
    types.ts
  projectTest/
    test_globalKey.tsx
    test.tsx
  screen/
    context.ts
    current-screen.tsx
    hook.ts
    index.ts
    provider.tsx
    README.md
    registry.ts
    types.ts
  index.ts
.gitignore
LICENSE
package.json
README.md
repomix.config.json
tsconfig.json
vitest.config.ts
```

# Files

## File: src/components/select/SelectInput.tsx
````typescript

````

## File: src/components/select/types.ts
````typescript
/**
 * The SelectInput component is required to pass in a type interface that must be included to act as a constraint
 */
export interface Item<T> {
  /**
   * Something that is used to show the user
   */
  label: string;
  /**
   * What is the actual value of the selected item
   */
  value: T;
}

export interface SelectInputProps<T> {
  /**
   * Array to be passed in for UI display, etc.
   */
  items: Item<T>[];
  /**
   * What happens when the user presses Enter
   * Accepts a parameter that represents the currently selected item
   */
  onSelect: (item: Item<T>) => void;
}
````

## File: src/__tests__/screen/hook.test.tsx
````typescript
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React, { ReactNode } from 'react';
import { ScreenSystemContext, ScreenSystemContextValue } from '../../screen/context';
import { useScreenSystem } from '../../screen/hook';

function TestConsumer({ onValue }: { onValue: (v: ScreenSystemContextValue) => void }) {
  const value = useScreenSystem();
  onValue(value);
  return React.createElement('text', null, 'consumer');
}

describe('useScreenSystem', () => {
  it('在 Provider 内部可以正常获取 context 值', () => {
    let captured: ScreenSystemContextValue | undefined;

    const mockValue: ScreenSystemContextValue = {
      currentScreen: React.createElement('text', null, 'hello'),
      skip: () => {},
    };

    render(
      React.createElement(
        ScreenSystemContext.Provider,
        { value: mockValue },
        React.createElement(TestConsumer, {
          onValue: (v: ScreenSystemContextValue) => {
            captured = v;
          },
        }),
      ),
    );

    expect(captured).toBe(mockValue);
    expect(captured?.currentScreen).toBe(mockValue.currentScreen);
  });

  it('在 Provider 外部调用会抛错', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(React.createElement(TestConsumer, { onValue: () => {} }));
    }).toThrow('[Ink-Component] useScreenSystem()');

    consoleError.mockRestore();
  });
});
````

## File: src/__tests__/integration.test.tsx
````typescript
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
} from 'vitest';
import {
  render,
  act,
} from '@testing-library/react';
import React, {
  useEffect,
} from 'react';
import type {
  Key,
} from 'ink';

import { CurrentScreen } from '../screen/current-screen.js';
import {
  registerComponent,
  clearRegistry,
} from '../screen/registry.js';
import {
  ScenarioManagementProvider,
} from '../screen/provider.js';
import {
  useScreenSystem,
} from '../screen/hook.js';
import {
  KeyboardProvider,
} from '../keyboard/provider.js';
import {
  useKeyboard,
} from '../keyboard/hook.js';

// Mock useInput from ink — same pattern as existing unit tests.
// Captures the handler so we can simulate key presses without a real terminal.

let capturedInputHandler: ((input: string, key: Key) => void) | null = null;

vi.mock('ink', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ink')>();
  return {
    ...actual,
    useInput: (handler: (input: string, key: Key) => void) => {
      capturedInputHandler = handler;
    },
  };
});

function defaultKey(): Key {
  return {
    upArrow: false, downArrow: false, leftArrow: false, rightArrow: false,
    return: false, escape: false, backspace: false, delete: false,
    tab: false, pageDown: false, pageUp: false,
    home: false, end: false,
    ctrl: false, shift: false, meta: false,
  };
}

function pressKey(input: string, overrides: Partial<Key> = {}) {
  if (!capturedInputHandler) {
    throw new Error('useInput handler not captured');
  }
  capturedInputHandler(input, { ...defaultKey(), ...overrides } as Key);
}

// Test components.
// Each component binds keys and declares navigation behavior in useEffect.
// Spies are injected via props so tests can observe handler calls.

interface MenuProps {
  onMenuE?: () => void;
  onMenuQ?: () => void;
  gameEscapeSpy?: () => void;
}

function Menu({ onMenuE, onMenuQ, gameEscapeSpy }: MenuProps) {
  const { skip, gotoScreen } = useScreenSystem();
  const { boundKeyboard } = useKeyboard();

  useEffect(() => {
    boundKeyboard(['s'], () => skip(Game, { onEscape: gameEscapeSpy }));
    boundKeyboard(['e'], () => onMenuE?.());
    boundKeyboard(['q'], () => onMenuQ?.());
    boundKeyboard(['x'], () => gotoScreen(Settings, {}));
  }, []);
  return React.createElement('div', null, 'Menu');
}
Menu.displayName = 'Menu';

interface GameProps {
  onEscape?: () => void;
}

function Game({ onEscape }: GameProps) {
  const { back, skip, overlay: ov } = useScreenSystem();
  const { boundKeyboard, blockedKey, stop } = useKeyboard();

  useEffect(() => {
    blockedKey(['e']);
    stop(['q']);
    boundKeyboard(['b'], () => back());
    boundKeyboard(['i'], () => skip(Inventory, {}));
    boundKeyboard(['o'], () => ov(PauseOverlay, {}));
    // For scenario 5: Game binds escape, but overlay's escape should win.
    boundKeyboard(['escape'], () => onEscape?.());
  }, []);
  return React.createElement('div', null, 'Game');
}
Game.displayName = 'Game';

function Inventory() {
  const { back } = useScreenSystem();
  const { boundKeyboard } = useKeyboard();

  useEffect(() => {
    boundKeyboard(['b'], () => back());
  }, []);
  return React.createElement('div', null, 'Inventory');
}
Inventory.displayName = 'Inventory';

function PauseOverlay() {
  const { closeOverlay } = useScreenSystem();
  const { boundKeyboard } = useKeyboard();

  useEffect(() => {
    boundKeyboard(['escape'], () => closeOverlay());
  }, []);
  return React.createElement('div', null, 'PauseOverlay');
}
PauseOverlay.displayName = 'PauseOverlay';

function Settings() {
  const { back } = useScreenSystem();
  const { boundKeyboard } = useKeyboard();

  useEffect(() => {
    boundKeyboard(['b'], () => back());
    boundKeyboard(['1'], () => {}, { focusId: 'name-input' });
    boundKeyboard(['2'], () => {}, { focusId: 'difficulty-select' });
  }, []);
  return React.createElement('div', null, 'Settings');
}
Settings.displayName = 'Settings';

// Render helper — mounts both providers and captures hook APIs via refs.
// CurrentScreen is rendered so that screen component effects actually run.

function renderSystem(
  defaultScreen: React.ComponentType<any>,
  defaultParams?: Record<string, unknown>,
) {
  const screenRef: { current: ReturnType<typeof useScreenSystem> | null } = { current: null };
  const keyboardRef: { current: ReturnType<typeof useKeyboard> | null } = { current: null };

  function Spy() {
    const sc = useScreenSystem();
    const kb = useKeyboard();
    screenRef.current = sc;
    keyboardRef.current = kb;
    useEffect(() => {
      screenRef.current = sc;
      keyboardRef.current = kb;
    }, [sc, kb]);
    return React.createElement(CurrentScreen);
  }

  render(
    React.createElement(
      ScenarioManagementProvider,
      { defaultScreen, defaultParams },
      React.createElement(KeyboardProvider, null, React.createElement(Spy)),
    ),
  );

  return {
    getScreen: () => screenRef.current,
    getKeyboard: () => keyboardRef.current,
  };
}

beforeEach(() => {
  clearRegistry();
  capturedInputHandler = null;

  registerComponent(Menu, {});
  registerComponent(Game, {}, { parent: Menu });
  registerComponent(Inventory, {}, { parent: Game });
  registerComponent(Settings, {}, { parent: Menu });
  registerComponent(PauseOverlay, {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('场景 1：基础全流程 — 按键驱动 skip / back', () => {
  it('Menu → Game → Menu', () => {
    const { getScreen } = renderSystem(Menu);

    expect(getScreen()!.currentPath).toEqual([Menu]);

    act(() => pressKey('s', {}));
    expect(getScreen()!.currentPath).toEqual([Menu, Game]);

    act(() => pressKey('b', {}));
    expect(getScreen()!.currentPath).toEqual([Menu]);
  });

  it('Menu → Game → Inventory → Game', () => {
    const { getScreen } = renderSystem(Menu);

    act(() => pressKey('s', {}));
    act(() => pressKey('i', {}));
    expect(getScreen()!.currentPath).toEqual([Menu, Game, Inventory]);

    act(() => pressKey('b', {}));
    expect(getScreen()!.currentPath).toEqual([Menu, Game]);
  });
});

describe('场景 2：责任链冒泡 — 栈顶无绑定则下层处理', () => {
  it('Inventory 和 Game 未绑 e，Menu 的 e 触发', () => {
    const menuE = vi.fn();
    const { getScreen } = renderSystem(Menu, { onMenuE: menuE });

    act(() => pressKey('s', {}));
    act(() => pressKey('i', {}));
    expect(getScreen()!.currentPath).toEqual([Menu, Game, Inventory]);

    act(() => pressKey('e', {}));
    expect(menuE).toHaveBeenCalledTimes(1);
  });
});

describe('场景 3：blockedKey 穿透', () => {
  it('Game blockedKey e，Menu 的 e 仍触发', () => {
    const menuE = vi.fn();
    const { getScreen } = renderSystem(Menu, { onMenuE: menuE });

    act(() => pressKey('s', {}));
    expect(getScreen()!.currentPath).toEqual([Menu, Game]);

    act(() => pressKey('e', {}));
    expect(menuE).toHaveBeenCalledTimes(1);
  });
});

describe('场景 4：stop 阻断 — q 被 Game 拦截', () => {
  it('Game stop q，Menu 的 q 不触发', () => {
    const menuQ = vi.fn();
    const { getScreen } = renderSystem(Menu, { onMenuQ: menuQ });

    act(() => pressKey('s', {}));
    expect(getScreen()!.currentPath).toEqual([Menu, Game]);

    act(() => pressKey('q', {}));
    expect(menuQ).not.toHaveBeenCalled();
  });
});

describe('场景 5：Overlay 优先级 — overlay 的 escape 优先于屏幕', () => {
  it('overlay 打开时按 Escape，overlay 关闭，Game 的 escape 不触发', () => {
    const gameEscapeSpy = vi.fn();
    const { getScreen } = renderSystem(Menu, { gameEscapeSpy });

    act(() => pressKey('s', {}));
    expect(getScreen()!.currentPath).toEqual([Menu, Game]);

    act(() => pressKey('o', {}));
    expect(getScreen()!.currentOverlay).not.toBeNull();
    expect(getScreen()!.currentPath).toEqual([Menu, Game]);

    act(() => pressKey('', { escape: true }));

    expect(getScreen()!.currentOverlay).toBeNull();
    expect(gameEscapeSpy).not.toHaveBeenCalled();
  });

  it('overlay 关闭后，Game 的 escape 正常工作', () => {
    const gameEscapeSpy = vi.fn();
    const { getScreen } = renderSystem(Menu, { gameEscapeSpy });

    act(() => pressKey('s', {}));

    act(() => getScreen()!.overlay(PauseOverlay, {}));
    expect(getScreen()!.currentOverlay).not.toBeNull();

    act(() => getScreen()!.closeOverlay());
    expect(getScreen()!.currentOverlay).toBeNull();

    act(() => pressKey('', { escape: true }));
    expect(gameEscapeSpy).toHaveBeenCalledTimes(1);
  });
});

describe('场景 6：GlobalKeys — cover 字段', () => {
  it('cover: false 时 boundKeyboard 抛错', () => {
    const { getKeyboard } = renderSystem(Menu);

    getKeyboard()!.globalKeys([
      { key: 'z', operate: () => {}, cover: false },
    ]);

    expect(() => {
      getKeyboard()!.boundKeyboard(['z'], () => {});
    }).toThrow('cover: false');
  });

  it('cover: true 时屏幕可以覆盖全局键，全局键不触发', () => {
    const globalFn = vi.fn();
    const screenFn = vi.fn();
    const { getKeyboard } = renderSystem(Menu);

    getKeyboard()!.globalKeys([
      { key: 'z', operate: globalFn, cover: true },
    ]);
    getKeyboard()!.boundKeyboard(['z'], screenFn);

    act(() => pressKey('z', {}));
    expect(screenFn).toHaveBeenCalledTimes(1);
    expect(globalFn).not.toHaveBeenCalled();
  });
});

describe('场景 7：Focus — Tab 切换 focus target', () => {
  it('Tab 正向循环', () => {
    const { getScreen, getKeyboard } = renderSystem(Menu);

    act(() => getScreen()!.gotoScreen(Settings, {}));
    expect(getScreen()!.currentPath).toEqual([Menu, Settings]);

    expect(getKeyboard()!.focusCurrent()).toBe('name-input');

    act(() => pressKey('', { tab: true }));
    expect(getKeyboard()!.focusCurrent()).toBe('difficulty-select');

    act(() => pressKey('', { tab: true }));
    expect(getKeyboard()!.focusCurrent()).toBe('name-input');
  });

  it('Shift+Tab 逆向', () => {
    const { getScreen, getKeyboard } = renderSystem(Menu);

    act(() => getScreen()!.gotoScreen(Settings, {}));

    expect(getKeyboard()!.focusCurrent()).toBe('name-input');

    act(() => pressKey('', { tab: true, shift: true }));
    expect(getKeyboard()!.focusCurrent()).toBe('difficulty-select');
  });

  it('focusSet 直接切换', () => {
    const { getScreen, getKeyboard } = renderSystem(Menu);

    act(() => getScreen()!.gotoScreen(Settings, {}));

    getKeyboard()!.focusSet('difficulty-select');
    expect(getKeyboard()!.focusCurrent()).toBe('difficulty-select');
  });
});
````

## File: src/projectTest/test_globalKey.tsx
````typescript
import React, { useEffect } from 'react';
import { render, Box, Text } from 'ink';
import {
  registerComponent,
  ScenarioManagementProvider,
  CurrentScreen,
  useScreenSystem,
  useKeyboard,
  KeyboardProvider,
} from '../index.js';

function Menu() {
  const { skip } = useScreenSystem();
  const { boundKeyboard } = useKeyboard();

  useEffect(() => {
    boundKeyboard(['s'], () => skip(Settings, {}));
    boundKeyboard(['g'], () => skip(Game, {}));
  }, []);

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>┌─ Main Menu ──────────────────────────────┐</Text>
      <Text>│  [S] Settings    [G] Start Game           │</Text>
      <Text>│  [E] Global e (cover: true)               │</Text>
      <Text>│  [X] Global x (affectOverlay: true)        │</Text>
      <Text>│  [Q] Quit (cover: false)                   │</Text>
      <Text>└───────────────────────────────────────────┘</Text>
    </Box>
  );
}
registerComponent(Menu, {});

function Settings() {
  const { back } = useScreenSystem();
  const { boundKeyboard } = useKeyboard();

  useEffect(() => {
    boundKeyboard(['backspace'], () => back());
    boundKeyboard(['e'], () => console.log('[Settings] e 被覆盖'));
  }, []);

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>┌─ Settings ───────────────────────────────┐</Text>
      <Text>│  [Backspace] Back                         │</Text>
      <Text>│  [E] 覆盖全局 e (cover: true 允许)         │</Text>
      <Text>│  [N] 全局 n (仅 Settings 可用)             │</Text>
      <Text>│  [Q] 全局退出 (cover: false)               │</Text>
      <Text>└───────────────────────────────────────────┘</Text>
    </Box>
  );
}
registerComponent(Settings, {}, { parent: Menu });

function Game() {
  const { back, skip, overlay: ov } = useScreenSystem();
  const { boundKeyboard, stop } = useKeyboard();

  useEffect(() => {
    const unbindStop = stop(['q']);
    boundKeyboard(['b'], () => back());
    boundKeyboard(['o'], () => ov(PauseOverlay, { msg: 'Game paused' }));
    boundKeyboard(['i'], () => skip(Inventory, {}));
    return () => unbindStop();
  }, []);

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>┌─ Game ───────────────────────────────────┐</Text>
      <Text>│  [B] Back   [I] Inventory   [O] Pause    │</Text>
      <Text>│  [E] 全局 e (未覆盖，冒泡到全局)          │</Text>
      <Text>│  [M] 全局 m (category: *)                 │</Text>
      <Text>│  [Q] stop 阻断                             │</Text>
      <Text>└───────────────────────────────────────────┘</Text>
    </Box>
  );
}
registerComponent(Game, {}, { parent: Menu });

function Inventory() {
  const { back } = useScreenSystem();
  const { boundKeyboard, stop } = useKeyboard();

  useEffect(() => {
    stop(['q']);
    boundKeyboard(['b'], () => back());
  }, []);

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>┌─ Inventory ──────────────────────────────┐</Text>
      <Text>│  [B] Back to Game                         │</Text>
      <Text>│  [U] 全局 u (category: [] 永不触发)       │</Text>
      <Text>└───────────────────────────────────────────┘</Text>
    </Box>
  );
}
registerComponent(Inventory, {}, { parent: Game });

function PauseOverlay({ msg }: { msg: string }) {
  const { closeOverlay } = useScreenSystem();
  const { boundKeyboard } = useKeyboard();

  useEffect(() => {
    boundKeyboard(['escape'], () => closeOverlay());
    boundKeyboard(['x'], () =>
      console.log('[Overlay] x 已被 affectOverlay 全局键抢先'),
    );
  }, []);

  return (
    <Box flexDirection="column" borderStyle="double" padding={1}>
      <Text bold>╔══════════════════════════════════════════╗</Text>
      <Text>║  🔔 {msg.padEnd(36)}║</Text>
      <Text>║  [Esc] Close                             ║</Text>
      <Text>║  [E] 全局 e (affectOverlay: false)       ║</Text>
      <Text>║      在 overlay 之后触发                 ║</Text>
      <Text>║  [X] 全局 x (affectOverlay: true)        ║</Text>
      <Text>║      在 overlay 之前触发                 ║</Text>
      <Text>╚══════════════════════════════════════════╝</Text>
    </Box>
  );
}
registerComponent(PauseOverlay, { msg: '' });

function App() {
  const { globalKeys } = useKeyboard();

  useEffect(() => {
    globalKeys([
      {
        key: 'e',
        operate: () => console.log('[Global] e 键触发'),
        cover: true,
      },
      {
        key: 'q',
        operate: () => process.exit(),
        cover: false,
      },
      {
        key: 'x',
        operate: () => console.log('[Global] x 键触发 (affectOverlay: true)'),
        cover: true,
        affectOverlay: true,
      },
      {
        key: 'n',
        operate: () => console.log('[Global] n 键触发 (仅 Settings)'),
        category: [Settings],
      },
      {
        key: 'm',
        operate: () => console.log('[Global] m 键触发 (全屏 *)'),
        category: '*',
      },
      {
        key: 'u',
        operate: () => console.log('[Global] u 键触发 (永不，category: [])'),
        category: [],
      },
    ]);
  }, []);

  return <CurrentScreen />;
}

render(
  <ScenarioManagementProvider defaultScreen={Menu}>
    <KeyboardProvider>
      <App />
    </KeyboardProvider>
  </ScenarioManagementProvider>,
);
````

## File: src/projectTest/test.tsx
````typescript
import React, { useEffect } from 'react';
import { render, Box, Text } from 'ink';
import {
  registerComponent,
  ScenarioManagementProvider,
  CurrentScreen,
  useScreenSystem,
  useKeyboard,
  KeyboardProvider,
} from '../index.js';

// ══ 注册 ══

function Menu() {
  const { skip } = useScreenSystem();
  const { boundKeyboard } = useKeyboard();
  useEffect(() => {
    boundKeyboard(['s'], () => skip(Game, {}));
    boundKeyboard(['q'], () => skip(QuitConfirm, {}));
  }, []);
  return (
    <Box flexDirection="column">
      <Text>主菜单</Text>
      <Text>[S] 开始游戏  [Q] 退出</Text>
    </Box>
  );
}
registerComponent(Menu, {});

function Game() {
  const { back, skip, overlay: ov } = useScreenSystem();
  const { boundKeyboard, stop } = useKeyboard();
  useEffect(() => {
    const unbindStop = stop(['q']);       // 阻断 q 冒泡到 Menu
    boundKeyboard(['b'], () => back());
    boundKeyboard(['o'], () => ov(Notice, { msg: '暂停中' }));
    boundKeyboard(['i'], () => skip(Inventory, {}));
    return () => unbindStop();
  }, []);
  return (
    <Box flexDirection="column">
      <Text>游戏中（q 键已阻断，不会误退出）</Text>
      <Text>[B] 返回  [I] 背包  [O] 暂停浮层</Text>
    </Box>
  );
}
registerComponent(Game, {}, { parent: Menu });

function Inventory() {
  const { back } = useScreenSystem();
  const { boundKeyboard, stop } = useKeyboard();
  useEffect(() => {
    stop(['q']);
    boundKeyboard(['b'], () => back());
  }, []);
  return (
    <Box flexDirection="column">
      <Text>背包（q 键阻断）</Text>
      <Text>[B] 返回</Text>
    </Box>
  );
}
registerComponent(Inventory, {}, { parent: Game });

function Notice({ msg }: { msg: string }) {
  const { closeOverlay } = useScreenSystem();
  const { boundKeyboard } = useKeyboard();
  useEffect(() => {
    boundKeyboard(['escape'], () => closeOverlay());
  }, []);
  return (
    <Box flexDirection="column" borderStyle="single">
      <Text>🔔 {msg}</Text>
      <Text>按 Esc 关闭</Text>
    </Box>
  );
}
registerComponent(Notice, { msg: '' });

function QuitConfirm() {
  return (
    <Box flexDirection="column">
      <Text>真的要退出吗？（此处仅示意，按 B 回菜单）</Text>
      <Text>[B] 返回</Text>
    </Box>
  );
}
registerComponent(QuitConfirm, {}, { parent: Menu });

function App() {
  return (
    <KeyboardProvider>
      <CurrentScreen />
    </KeyboardProvider>
  );
}

render(
  <ScenarioManagementProvider defaultScreen={Menu}>
    <App />
  </ScenarioManagementProvider>,
);
````

## File: repomix.config.json
````json
{
  "$schema": "https://repomix.com/schemas/latest/schema.json",
  "input": {
    "maxFileSize": 52428800
  },
  "output": {
    "filePath": "repomix-output.md",
    "style": "markdown",
    "parsableStyle": false,
    "fileSummary": true,
    "directoryStructure": true,
    "files": true,
    "removeComments": false,
    "removeEmptyLines": false,
    "compress": false,
    "topFilesLength": 5,
    "showLineNumbers": false,
    "truncateBase64": false,
    "copyToClipboard": false,
    "includeFullDirectoryStructure": false,
    "tokenCountTree": false,
    "git": {
      "sortByChanges": true,
      "sortByChangesMaxCommits": 100,
      "includeDiffs": false,
      "includeLogs": false,
      "includeLogsCount": 50
    }
  },
  "include": [],
  "ignore": {
    "useGitignore": true,
    "useDotIgnore": true,
    "useDefaultPatterns": true,
    "customPatterns": []
  },
  "security": {
    "enableSecurityCheck": true
  },
  "tokenCount": {
    "encoding": "o200k_base"
  }
}
````

## File: tsconfig.json
````json
{
  "compilerOptions": {
    "declaration": true,
    "target": "ES2022",
    "module": "Node16",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "sourceMap": false,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "moduleResolution": "Node16",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "emitDecoratorMetadata": false,
    "experimentalDecorators": false,
    "jsx": "react",
    "types": ["node"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "src/__tests__"]
}
````

## File: vitest.config.ts
````typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/__tests__/**/*.test.{ts,tsx}'],
    globals: true,
  },
});
````

## File: src/__tests__/keyboard/provider.test.tsx
````typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import React, { useRef, useEffect } from 'react';
import { registerComponent, clearRegistry } from '../../screen/registry.js';
import { ScenarioManagementProvider } from '../../screen/provider.js';
import { useScreenSystem } from '../../screen/hook.js';
import { KeyboardProvider } from '../../keyboard/provider.js';
import { useKeyboard, useFocusState } from '../../keyboard/hook.js';
import type { Key } from 'ink';

let capturedInputHandler: ((input: string, key: Key) => void) | null = null;

vi.mock('ink', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ink')>();
  return {
    ...actual,
    useInput: (handler: (input: string, key: Key) => void) => {
      capturedInputHandler = handler;
    },
  };
});

function pressKey(input: string, key: Partial<Key>) {
  if (!capturedInputHandler) throw new Error('useInput handler not captured');
  capturedInputHandler(input, {
    upArrow: false, downArrow: false, leftArrow: false, rightArrow: false,
    return: false, escape: false, backspace: false, delete: false,
    tab: false, space: false, pageDown: false, pageUp: false,
    home: false, end: false, insert: false,
    ctrl: false, shift: false, meta: false, numLock: false,
    ...key,
  } as Key);
}

function Menu({ }: {}) {
  return React.createElement('div', null, 'Menu');
}
Menu.displayName = 'Menu';

function GameLevel({ level }: { level: number }) {
  return React.createElement('div', null, String(level));
}
GameLevel.displayName = 'GameLevel';

function Combat({ enemy }: { enemy: string }) {
  return React.createElement('div', null, enemy);
}
Combat.displayName = 'Combat';

function Notification({ message }: { message: string }) {
  return React.createElement('div', null, message);
}
Notification.displayName = 'Notification';

beforeEach(() => {
  clearRegistry();
  capturedInputHandler = null;
  registerComponent(Menu, {});
  registerComponent(GameLevel, { level: 1 }, { parent: Menu });
  registerComponent(Combat, { enemy: 'goblin' }, { parent: GameLevel });
  registerComponent(Notification, { message: '' });
});

afterEach(() => {
  vi.restoreAllMocks();
});

function renderKeyboardTree(
  defaultScreen: React.ComponentType<any>,
): {
  getKeyboard: () => ReturnType<typeof useKeyboard> | null;
  getScreen: () => ReturnType<typeof useScreenSystem> | null;
} {
  const kbRef: { current: ReturnType<typeof useKeyboard> | null } = { current: null };
  const scRef: { current: ReturnType<typeof useScreenSystem> | null } = { current: null };

  function Spy() {
    const kb = useKeyboard();
    const sc = useScreenSystem();
    kbRef.current = kb;
    scRef.current = sc;
    useEffect(() => {
      kbRef.current = kb;
      scRef.current = sc;
    }, [kb, sc]);
    return React.createElement('div', null);
  }

  render(
    React.createElement(
      ScenarioManagementProvider,
      { defaultScreen },
      React.createElement(KeyboardProvider, null, React.createElement(Spy)),
    ),
  );

  return {
    getKeyboard: () => kbRef.current,
    getScreen: () => scRef.current,
  };
}

function renderWithFocusConsumer(
  defaultScreen: React.ComponentType<any>,
  focusId: string,
): {
  getFocused: () => boolean;
  getKeyboard: () => ReturnType<typeof useKeyboard> | null;
} {
  const focusedRef: { current: boolean } = { current: false };
  const kbRef: { current: ReturnType<typeof useKeyboard> | null } = { current: null };

  function Consumer() {
    const kb = useKeyboard();
    const focused = useFocusState(focusId);
    kbRef.current = kb;
    focusedRef.current = focused;
    useEffect(() => {
      focusedRef.current = focused;
    }, [focused]);
    return React.createElement('div', null, focused ? 'yes' : 'no');
  }

  render(
    React.createElement(
      ScenarioManagementProvider,
      { defaultScreen },
      React.createElement(KeyboardProvider, null, React.createElement(Consumer)),
    ),
  );

  return {
    getFocused: () => focusedRef.current,
    getKeyboard: () => kbRef.current,
  };
}

describe('按键名标准化', () => {
  it('useInput 在 KeyboardProvider 挂载后被捕获', () => {
    renderKeyboardTree(Menu);
    expect(capturedInputHandler).not.toBeNull();
  });

  it('ctrl+s 会被捕获为 ctrl+s', () => {
    const cb = vi.fn();
    const { getKeyboard } = renderKeyboardTree(Menu);
    getKeyboard()!.boundKeyboard(['ctrl+s'], cb);
    pressKey('s', { ctrl: true });
    expect(cb).toHaveBeenCalledWith('s', expect.objectContaining({ ctrl: true }));
  });

  it('return 键被正确识别', () => {
    const cb = vi.fn();
    const { getKeyboard } = renderKeyboardTree(Menu);
    getKeyboard()!.boundKeyboard(['return'], cb);
    pressKey('', { return: true });
    expect(cb).toHaveBeenCalled();
  });

  it('escape 键被正确识别', () => {
    const cb = vi.fn();
    const { getKeyboard } = renderKeyboardTree(Menu);
    getKeyboard()!.boundKeyboard(['escape'], cb);
    pressKey('', { escape: true });
    expect(cb).toHaveBeenCalled();
  });

  it('shift+tab 被正确识别（不作为焦点导航，因为无 focusTargets）', () => {
    const cb = vi.fn();
    const { getKeyboard } = renderKeyboardTree(Menu);
    getKeyboard()!.boundKeyboard(['shift+tab'], cb);
    pressKey('', { tab: true, shift: true });
    expect(cb).toHaveBeenCalled();
  });
});

describe('boundKeyboard（屏幕级，无 focusId）', () => {
  it('绑定单键回调，按键时触发', () => {
    const cb = vi.fn();
    const { getKeyboard } = renderKeyboardTree(Menu);
    getKeyboard()!.boundKeyboard(['s'], cb);
    pressKey('s', {});
    expect(cb).toHaveBeenCalledWith('s', expect.any(Object));
  });

  it('多键绑定同一回调', () => {
    const cb = vi.fn();
    const { getKeyboard } = renderKeyboardTree(Menu);
    getKeyboard()!.boundKeyboard(['a', 'b', 'c'], cb);
    pressKey('a', {}); expect(cb).toHaveBeenCalledTimes(1);
    pressKey('b', {}); expect(cb).toHaveBeenCalledTimes(2);
    pressKey('c', {}); expect(cb).toHaveBeenCalledTimes(3);
  });

  it('返回的解绑函数可取消绑定', () => {
    const cb = vi.fn();
    const { getKeyboard } = renderKeyboardTree(Menu);
    const unbind = getKeyboard()!.boundKeyboard(['x'], cb);
    unbind();
    pressKey('x', {});
    expect(cb).not.toHaveBeenCalled();
  });
});

describe('责任链冒泡（栈顶 → 栈底）', () => {
  it('栈顶处理了，底层不触发', () => {
    const menuCb = vi.fn();
    const combatCb = vi.fn();
    const { getKeyboard, getScreen } = renderKeyboardTree(Menu);
    getKeyboard()!.boundKeyboard(['e'], menuCb);
    act(() => getScreen()!.skip(GameLevel, { level: 1 }));
    act(() => getScreen()!.skip(Combat, { enemy: 'goblin' }));
    getKeyboard()!.boundKeyboard(['e'], combatCb);
    pressKey('e', {});
    expect(combatCb).toHaveBeenCalledTimes(1);
    expect(menuCb).not.toHaveBeenCalled();
  });

  it('栈顶未处理，冒泡到下层', () => {
    const menuCb = vi.fn();
    const { getKeyboard, getScreen } = renderKeyboardTree(Menu);
    getKeyboard()!.boundKeyboard(['e'], menuCb);
    act(() => getScreen()!.skip(GameLevel, { level: 1 }));
    act(() => getScreen()!.skip(Combat, { enemy: 'goblin' }));
    pressKey('e', {});
    expect(menuCb).toHaveBeenCalledTimes(1);
  });

  it('所有层都未处理则丢弃', () => {
    const { getKeyboard, getScreen } = renderKeyboardTree(Menu);
    act(() => getScreen()!.skip(GameLevel, { level: 1 }));
    expect(() => pressKey('z', {})).not.toThrow();
  });
});

describe('blockedKey（屏幕级，无 focusId）', () => {
  it('屏蔽的键在本层穿透，下层可处理', () => {
    const menuCb = vi.fn();
    const { getKeyboard, getScreen } = renderKeyboardTree(Menu);
    getKeyboard()!.boundKeyboard(['e'], menuCb);
    act(() => getScreen()!.skip(GameLevel, { level: 1 }));
    act(() => getScreen()!.skip(Combat, { enemy: 'goblin' }));
    getKeyboard()!.blockedKey(['e']);
    pressKey('e', {});
    expect(menuCb).toHaveBeenCalledTimes(1);
  });

  it('blockedKey 不影响其他键', () => {
    const cb = vi.fn();
    const { getKeyboard, getScreen } = renderKeyboardTree(Menu);
    act(() => getScreen()!.skip(GameLevel, { level: 1 }));
    act(() => getScreen()!.skip(Combat, { enemy: 'goblin' }));
    getKeyboard()!.blockedKey(['e']);
    getKeyboard()!.boundKeyboard(['s'], cb);
    pressKey('s', {});
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('blockedKey 只对本层生效', () => {
    const menuCb = vi.fn();
    const gameCb = vi.fn();
    const { getKeyboard, getScreen } = renderKeyboardTree(Menu);
    getKeyboard()!.boundKeyboard(['e'], menuCb);
    act(() => getScreen()!.skip(GameLevel, { level: 1 }));
    getKeyboard()!.boundKeyboard(['e'], gameCb);
    act(() => getScreen()!.skip(Combat, { enemy: 'goblin' }));
    pressKey('e', {});
    expect(gameCb).toHaveBeenCalledTimes(1);
    expect(menuCb).not.toHaveBeenCalled();
  });
});

describe('onlyThis', () => {
  it('onlyThis=true 只在栈顶且无 overlay 时激活', () => {
    const combatCb = vi.fn();
    const { getKeyboard, getScreen } = renderKeyboardTree(Menu);
    act(() => getScreen()!.skip(GameLevel, { level: 1 }));
    act(() => getScreen()!.skip(Combat, { enemy: 'goblin' }));
    getKeyboard()!.boundKeyboard(['a'], combatCb, { onlyThis: true });
    pressKey('a', {});
    expect(combatCb).toHaveBeenCalledTimes(1);
    act(() => getScreen()!.overlay(Notification, { message: 'test' }));
    combatCb.mockClear();
    pressKey('a', {});
    expect(combatCb).not.toHaveBeenCalled();
  });
});

describe('Overlay 优先级', () => {
  it('overlay 的绑定优先于屏幕栈', () => {
    const screenCb = vi.fn();
    const overlayCb = vi.fn();
    const { getKeyboard, getScreen } = renderKeyboardTree(Menu);
    act(() => getScreen()!.overlay(Notification, { message: 'test' }));
    getKeyboard()!.boundKeyboard(['escape'], overlayCb);
    getKeyboard()!.boundKeyboard(['escape'], screenCb);
    pressKey('', { escape: true });
    expect(overlayCb).toHaveBeenCalledTimes(1);
    expect(screenCb).not.toHaveBeenCalled();
  });

  it('overlay 未处理时冒泡到屏幕栈', () => {
    const menuCb = vi.fn();
    const { getKeyboard, getScreen } = renderKeyboardTree(Menu);
    getKeyboard()!.boundKeyboard(['e'], menuCb);
    act(() => getScreen()!.overlay(Notification, { message: 'test' }));
    pressKey('e', {});
    expect(menuCb).toHaveBeenCalledTimes(1);
  });
});

describe('层生命周期', () => {
  it('离开路径后层被清理，绑定不再生效', () => {
    const combatCb = vi.fn();
    const { getKeyboard, getScreen } = renderKeyboardTree(Menu);
    act(() => getScreen()!.skip(GameLevel, { level: 1 }));
    act(() => getScreen()!.skip(Combat, { enemy: 'goblin' }));
    getKeyboard()!.boundKeyboard(['a'], combatCb);
    act(() => getScreen()!.back());
    combatCb.mockClear();
    pressKey('a', {});
    expect(combatCb).not.toHaveBeenCalled();
  });
});

describe('修饰键组合', () => {
  it('ctrl+字符被正确匹配', () => {
    const cb = vi.fn();
    const { getKeyboard } = renderKeyboardTree(Menu);
    getKeyboard()!.boundKeyboard(['ctrl+d'], cb);
    pressKey('d', { ctrl: true });
    expect(cb).toHaveBeenCalled();
  });

  it('meta+字符被正确匹配', () => {
    const cb = vi.fn();
    const { getKeyboard } = renderKeyboardTree(Menu);
    getKeyboard()!.boundKeyboard(['meta+f'], cb);
    pressKey('f', { meta: true });
    expect(cb).toHaveBeenCalled();
  });
});

describe('boundKeyboard 带 focusId', () => {
  it('focusId 绑定优先于同层屏幕级绑定', () => {
    const screenCb = vi.fn();
    const focusCb = vi.fn();
    const { getKeyboard } = renderKeyboardTree(Menu);

    getKeyboard()!.boundKeyboard(['a'], screenCb);
    getKeyboard()!.boundKeyboard(['a'], focusCb, { focusId: 'input1' });

    pressKey('a', {});
    expect(focusCb).toHaveBeenCalledTimes(1);
    expect(screenCb).not.toHaveBeenCalled();
  });

  it('多个 focusId 注册，只有当前聚焦的收到事件', () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const { getKeyboard } = renderKeyboardTree(Menu);

    getKeyboard()!.boundKeyboard(['a'], cb1, { focusId: 'input1' });
    getKeyboard()!.boundKeyboard(['a'], cb2, { focusId: 'input2' });

    // input1 是第一个注册的，自动激活
    pressKey('a', {});
    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).not.toHaveBeenCalled();

    // 切换到 input2
    getKeyboard()!.focusSet('input2');
    cb1.mockClear();
    pressKey('a', {});
    expect(cb2).toHaveBeenCalledTimes(1);
    expect(cb1).not.toHaveBeenCalled();
  });

  it('focusId 绑定的解绑函数正常工作', () => {
    const cb = vi.fn();
    const { getKeyboard } = renderKeyboardTree(Menu);

    const unbind = getKeyboard()!.boundKeyboard(['x'], cb, { focusId: 'inp' });
    unbind();
    pressKey('x', {});
    expect(cb).not.toHaveBeenCalled();
  });

  it('focusId 绑定受 globalKeys cover: false 约束', () => {
    const { getKeyboard } = renderKeyboardTree(Menu);
    getKeyboard()!.globalKeys([
      { key: 'q', operate: () => {}, cover: false },
    ]);

    expect(() =>
      getKeyboard()!.boundKeyboard(['q'], () => {}, { focusId: 'inp' }),
    ).toThrow('cover: false');
  });
});

describe('blockedKey 带 focusId', () => {
  it('focus 级 blockedKey 穿透 focus target 绑定，冒泡到屏幕级', () => {
    const screenCb = vi.fn();
    const { getKeyboard } = renderKeyboardTree(Menu);

    getKeyboard()!.boundKeyboard(['e'], () => {}, { focusId: 'inp1' });
    getKeyboard()!.blockedKey(['e'], { focusId: 'inp1' });
    getKeyboard()!.boundKeyboard(['e'], screenCb);

    pressKey('e', {});
    expect(screenCb).toHaveBeenCalledTimes(1);
  });

  it('focus 级 blockedKey 不影响其他键', () => {
    const cb = vi.fn();
    const { getKeyboard } = renderKeyboardTree(Menu);

    getKeyboard()!.blockedKey(['e'], { focusId: 'inp1' });
    getKeyboard()!.boundKeyboard(['s'], cb, { focusId: 'inp1' });

    pressKey('s', {});
    expect(cb).toHaveBeenCalledTimes(1);
  });
});

describe('stop 带 focusId', () => {
  it('focus 级 stop 阻止按键向屏幕级冒泡', () => {
    const screenCb = vi.fn();
    const { getKeyboard } = renderKeyboardTree(Menu);

    getKeyboard()!.boundKeyboard(['e'], screenCb);
    getKeyboard()!.stop(['e'], { focusId: 'inp1' });

    pressKey('e', {});
    expect(screenCb).not.toHaveBeenCalled();
  });

  it('focus 级 stop 解绑后可恢复传播', () => {
    const screenCb = vi.fn();
    const { getKeyboard } = renderKeyboardTree(Menu);

    getKeyboard()!.boundKeyboard(['e'], screenCb);
    const unstop = getKeyboard()!.stop(['e'], { focusId: 'inp1' });

    pressKey('e', {});
    expect(screenCb).not.toHaveBeenCalled();

    unstop();
    pressKey('e', {});
    expect(screenCb).toHaveBeenCalledTimes(1);
  });

  it('focus 级 stop 仅对当前 focus target 生效，不影响其他 focus', () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const { getKeyboard } = renderKeyboardTree(Menu);

    getKeyboard()!.boundKeyboard(['x'], cb1, { focusId: 'inp1' });
    getKeyboard()!.boundKeyboard(['x'], cb2, { focusId: 'inp2' });
    getKeyboard()!.stop(['x'], { focusId: 'inp2' });

    pressKey('x', {});
    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).not.toHaveBeenCalled();

    getKeyboard()!.focusSet('inp2');
    cb1.mockClear();
    pressKey('x', {});
    expect(cb2).toHaveBeenCalledTimes(1);
  });
});

describe('focusSet / focusNext / focusPrev / focusCurrent', () => {
  it('focusSet 切换到指定 focusId', () => {
    const { getKeyboard } = renderKeyboardTree(Menu);
    getKeyboard()!.boundKeyboard(['a'], () => {}, { focusId: 'one' });
    getKeyboard()!.boundKeyboard(['b'], () => {}, { focusId: 'two' });

    expect(getKeyboard()!.focusCurrent()).toBe('one');
    getKeyboard()!.focusSet('two');
    expect(getKeyboard()!.focusCurrent()).toBe('two');
  });

  it('focusSet 对不存在的 focusId 无操作', () => {
    const { getKeyboard } = renderKeyboardTree(Menu);
    getKeyboard()!.boundKeyboard(['a'], () => {}, { focusId: 'one' });
    getKeyboard()!.focusSet('nonexistent');
    expect(getKeyboard()!.focusCurrent()).toBe('one');
  });

  it('focusNext 按注册顺序轮转', () => {
    const { getKeyboard } = renderKeyboardTree(Menu);
    getKeyboard()!.boundKeyboard(['a'], () => {}, { focusId: 'one' });
    getKeyboard()!.boundKeyboard(['b'], () => {}, { focusId: 'two' });
    getKeyboard()!.boundKeyboard(['c'], () => {}, { focusId: 'three' });

    expect(getKeyboard()!.focusCurrent()).toBe('one');
    getKeyboard()!.focusNext();
    expect(getKeyboard()!.focusCurrent()).toBe('two');
    getKeyboard()!.focusNext();
    expect(getKeyboard()!.focusCurrent()).toBe('three');
    getKeyboard()!.focusNext();
    expect(getKeyboard()!.focusCurrent()).toBe('one');
  });

  it('focusPrev 逆向轮转', () => {
    const { getKeyboard } = renderKeyboardTree(Menu);
    getKeyboard()!.boundKeyboard(['a'], () => {}, { focusId: 'one' });
    getKeyboard()!.boundKeyboard(['b'], () => {}, { focusId: 'two' });
    getKeyboard()!.boundKeyboard(['c'], () => {}, { focusId: 'three' });

    expect(getKeyboard()!.focusCurrent()).toBe('one');
    getKeyboard()!.focusPrev();
    expect(getKeyboard()!.focusCurrent()).toBe('three');
    getKeyboard()!.focusPrev();
    expect(getKeyboard()!.focusCurrent()).toBe('two');
  });

  it('focusCurrent 无焦点目标时返回 null', () => {
    const { getKeyboard } = renderKeyboardTree(Menu);
    expect(getKeyboard()!.focusCurrent()).toBeNull();
  });
});

describe('focusUnregister', () => {
  it('注销后 focusId 被移除', () => {
    const { getKeyboard } = renderKeyboardTree(Menu);
    getKeyboard()!.boundKeyboard(['a'], () => {}, { focusId: 'one' });
    getKeyboard()!.boundKeyboard(['b'], () => {}, { focusId: 'two' });

    getKeyboard()!.focusUnregister('one');
    expect(getKeyboard()!.focusCurrent()).toBe('two');
  });

  it('注销当前聚焦的 target 后自动切换到下一个', () => {
    const { getKeyboard } = renderKeyboardTree(Menu);
    getKeyboard()!.boundKeyboard(['a'], () => {}, { focusId: 'one' });
    getKeyboard()!.boundKeyboard(['b'], () => {}, { focusId: 'two' });

    getKeyboard()!.focusUnregister('one');
    expect(getKeyboard()!.focusCurrent()).toBe('two');
  });

  it('注销最后一个 focus target 后 currentFocusId 为 null', () => {
    const { getKeyboard } = renderKeyboardTree(Menu);
    getKeyboard()!.boundKeyboard(['a'], () => {}, { focusId: 'one' });
    getKeyboard()!.focusUnregister('one');
    expect(getKeyboard()!.focusCurrent()).toBeNull();
  });

  it('注销后该 focusId 的绑定不再响应', () => {
    const cb = vi.fn();
    const { getKeyboard } = renderKeyboardTree(Menu);
    getKeyboard()!.boundKeyboard(['a'], cb, { focusId: 'one' });
    getKeyboard()!.boundKeyboard(['b'], () => {}, { focusId: 'two' });

    getKeyboard()!.focusUnregister('one');
    pressKey('a', {});
    expect(cb).not.toHaveBeenCalled();
  });
});

describe('subscribeFocus / useFocusState', () => {
  it('useFocusState 在 focusId 激活时返回 true', () => {
    const result = renderWithFocusConsumer(Menu, 'inp1');
    expect(result.getFocused()).toBe(false);

    act(() => {
      result.getKeyboard()!.boundKeyboard(['a'], () => {}, { focusId: 'inp1' });
    });

    expect(result.getFocused()).toBe(true);
  });

  it('useFocusState 在焦点切换后更新', () => {
    const result = renderWithFocusConsumer(Menu, 'inp2');

    act(() => {
      result.getKeyboard()!.boundKeyboard(['a'], () => {}, { focusId: 'inp1' });
      result.getKeyboard()!.boundKeyboard(['b'], () => {}, { focusId: 'inp2' });
    });

    expect(result.getFocused()).toBe(false);

    act(() => {
      result.getKeyboard()!.focusSet('inp2');
    });

    expect(result.getFocused()).toBe(true);
  });

  it('useFocusState 在焦点注销后更新', () => {
    const result = renderWithFocusConsumer(Menu, 'inp1');

    act(() => {
      result.getKeyboard()!.boundKeyboard(['a'], () => {}, { focusId: 'inp1' });
      result.getKeyboard()!.boundKeyboard(['b'], () => {}, { focusId: 'inp2' });
    });

    expect(result.getFocused()).toBe(true);

    act(() => {
      result.getKeyboard()!.focusUnregister('inp1');
    });

    expect(result.getFocused()).toBe(false);
  });
});

describe('内置 Tab 焦点导航', () => {
  it('Tab 键自动切换到下一个 focus target', () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const { getKeyboard } = renderKeyboardTree(Menu);

    getKeyboard()!.boundKeyboard(['return'], cb1, { focusId: 'one' });
    getKeyboard()!.boundKeyboard(['return'], cb2, { focusId: 'two' });

    pressKey('', { return: true });
    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).not.toHaveBeenCalled();

    pressKey('', { tab: true });
    cb1.mockClear();
    pressKey('', { return: true });
    expect(cb2).toHaveBeenCalledTimes(1);
    expect(cb1).not.toHaveBeenCalled();
  });

  it('Shift+Tab 逆序切换', () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const { getKeyboard } = renderKeyboardTree(Menu);

    getKeyboard()!.boundKeyboard(['return'], cb1, { focusId: 'one' });
    getKeyboard()!.boundKeyboard(['return'], cb2, { focusId: 'two' });

    pressKey('', { tab: true, shift: true });
    pressKey('', { return: true });
    expect(cb2).toHaveBeenCalledTimes(1);
    expect(cb1).not.toHaveBeenCalled();
  });

  it('Tab 在无 focus target 时不消费事件，屏幕级 tab 绑定仍可工作', () => {
    const cb = vi.fn();
    const { getKeyboard } = renderKeyboardTree(Menu);

    getKeyboard()!.boundKeyboard(['tab'], cb);
    pressKey('', { tab: true });
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('Tab 在有 focus target 时不冒泡到屏幕级', () => {
    const screenCb = vi.fn();
    const { getKeyboard } = renderKeyboardTree(Menu);

    getKeyboard()!.boundKeyboard(['tab'], screenCb);
    getKeyboard()!.boundKeyboard(['a'], () => {}, { focusId: 'one' });
    getKeyboard()!.boundKeyboard(['b'], () => {}, { focusId: 'two' });

    pressKey('', { tab: true });
    expect(screenCb).not.toHaveBeenCalled();
  });
});

describe('焦点层内的 onlyThis', () => {
  it('focus 级绑定使用 onlyThis 时，有 overlay 则跳过', () => {
    const cb = vi.fn();
    const { getKeyboard, getScreen } = renderKeyboardTree(Menu);

    getKeyboard()!.boundKeyboard(['a'], cb, { focusId: 'inp', onlyThis: true });

    pressKey('a', {});
    expect(cb).toHaveBeenCalledTimes(1);

    act(() => getScreen()!.overlay(Notification, { message: 'test' }));
    cb.mockClear();
    pressKey('a', {});
    expect(cb).not.toHaveBeenCalled();
  });
});

describe('overlay 内部的焦点系统', () => {
  it('overlay 内的 Tab 切换 overlay 内部焦点，不影响屏幕栈焦点', () => {
    const overlayCb1 = vi.fn();
    const overlayCb2 = vi.fn();
    const { getKeyboard, getScreen } = renderKeyboardTree(Menu);

    act(() => getScreen()!.overlay(Notification, { message: 'test' }));

    getKeyboard()!.boundKeyboard(['return'], overlayCb1, { focusId: 'over1' });
    getKeyboard()!.boundKeyboard(['return'], overlayCb2, { focusId: 'over2' });

    pressKey('', { return: true });
    expect(overlayCb1).toHaveBeenCalledTimes(1);

    pressKey('', { tab: true });
    overlayCb1.mockClear();
    pressKey('', { return: true });
    expect(overlayCb2).toHaveBeenCalledTimes(1);
  });
});

describe('焦点与屏幕级 stop 的交互', () => {
  it('focus 级绑定触发后，屏幕级 stop 不影响它', () => {
    const focusCb = vi.fn();
    const { getKeyboard } = renderKeyboardTree(Menu);

    getKeyboard()!.boundKeyboard(['a'], focusCb, { focusId: 'inp' });
    getKeyboard()!.stop(['a']);

    pressKey('a', {});
    expect(focusCb).toHaveBeenCalledTimes(1);
  });
});

describe('屏幕切换后焦点重置', () => {
  it('skip 到新屏幕后，新屏幕的焦点从第一个注册的开始', () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const { getKeyboard, getScreen } = renderKeyboardTree(Menu);

    act(() => getScreen()!.skip(GameLevel, { level: 1 }));

    getKeyboard()!.boundKeyboard(['a'], cb1, { focusId: 'g1' });
    getKeyboard()!.boundKeyboard(['a'], cb2, { focusId: 'g2' });

    expect(getKeyboard()!.focusCurrent()).toBe('g1');
    pressKey('a', {});
    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).not.toHaveBeenCalled();
  });
});
````

## File: src/__tests__/screen/provider.test.tsx
````typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import React, { useRef, useEffect, ReactNode } from 'react';
import {
  registerComponent,
  clearRegistry,
} from '../../screen/registry.js';
import {
  ScenarioManagementProvider,
  skip,
  back,
  gotoScreen,
  overlay,
  closeOverlay,
} from '../../screen/provider.js';
import { useScreenSystem } from '../../screen/hook.js';
import { CurrentScreen } from '../../screen/current-screen.js';

// ── 测试用组件 ────────────────────────────────────────────

function Menu({ }: {}) {
  return React.createElement('div', null, 'Menu');
}
Menu.displayName = 'Menu';

function Settings({ theme }: { theme: string }) {
  return React.createElement('div', null, theme);
}
Settings.displayName = 'Settings';

function GameLevel({ level }: { level: number }) {
  return React.createElement('div', null, String(level));
}
GameLevel.displayName = 'GameLevel';

function Combat({ enemy }: { enemy: string }) {
  return React.createElement('div', null, enemy);
}
Combat.displayName = 'Combat';

function Inventory({ items }: { items: string[] }) {
  return React.createElement('div', null, String(items?.length ?? 0));
}
Inventory.displayName = 'Inventory';

function Notification({ message }: { message: string }) {
  return React.createElement('div', null, message);
}
Notification.displayName = 'Notification';

// ── 捕获消费者（用 useEffect 保证 commit 后更新）───────────

interface CapturedScreenSystem {
  currentScreen: ReactNode;
  currentOverlay: ReactNode | null;
  currentPath: React.ComponentType<any>[];
  skip: (comp: any, params: any, opts?: any) => void;
  back: () => void;
  gotoScreen: (comp: any, params: any) => void;
  overlay: (comp: any, params: any) => void;
  closeOverlay: () => void;
}

function CaptureConsumer({
  onCapture,
}: {
  onCapture: (v: CapturedScreenSystem) => void;
}) {
  const ctx = useScreenSystem();
  const ref = useRef(onCapture);
  ref.current = onCapture;

  useEffect(() => {
    ref.current(ctx);
  }, [ctx]);

  return React.createElement('div', null, 'capture');
}

// ── Setup ─────────────────────────────────────────────────

beforeEach(() => {
  clearRegistry();
  registerComponent(Menu, {});
  registerComponent(Settings, { theme: 'dark' }, { parent: Menu });
  registerComponent(GameLevel, { level: 1 }, { parent: Menu });
  registerComponent(Combat, { enemy: 'goblin' }, { parent: GameLevel });
  registerComponent(Inventory, { items: [] }, { parent: GameLevel });
  registerComponent(Notification, { message: '' });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── 辅助：从 DOM 读取渲染内容 ─────────────────────────────

/** 直接渲染 CurrentScreen，从 DOM 检查当前屏幕文字 */
function renderAndGetText(
  defaultScreen: React.ComponentType<any>,
  defaultParams?: Record<string, unknown>,
): string | null {
  const { container } = render(
    React.createElement(
      ScenarioManagementProvider,
      { defaultScreen, defaultParams },
      React.createElement(CurrentScreen),
    ),
  );
  return container.textContent;
}

// ── 辅助：渲染并用 ref 持有 hook 返回值 ────────────────────

function renderWithRef(
  defaultScreen: React.ComponentType<any>,
  defaultParams?: Record<string, unknown>,
): {
  get: () => CapturedScreenSystem | null;
  container: HTMLElement;
} {
  const ref: { current: CapturedScreenSystem | null } = { current: null };

  function Spy() {
    const ctx = useScreenSystem();
    ref.current = ctx;
    // 用 useEffect 确保每次渲染后都能更新 ref
    useEffect(() => {
      ref.current = ctx;
    }, [ctx]);
    return React.createElement(CurrentScreen);
  }

  const { container } = render(
    React.createElement(
      ScenarioManagementProvider,
      { defaultScreen, defaultParams },
      React.createElement(Spy),
    ),
  );

  return { get: () => ref.current, container };
}

// ── 测试 ──────────────────────────────────────────────────

describe('ScenarioManagementProvider（默认屏幕）', () => {
  it('使用 defaultScreen 渲染初始屏幕', () => {
    const text = renderAndGetText(Menu);
    expect(text).toContain('Menu');
  });

  it('defaultParams 传递到组件', () => {
    // 用一个会渲染 props 的组件来验证
    function Echo({ value }: { value: string }) {
      return React.createElement('div', null, value);
    }
    Echo.displayName = 'Echo';
    registerComponent(Echo, { value: '' }, { parent: Menu });

    const { get } = renderWithRef(Menu);
    act(() => get()!.skip(Echo, {}));
    // 验证 defaultParams 被 merge 进了渲染的 props
    const el = get()!.currentScreen as React.ReactElement;
    expect(el.type).toBe(Echo);
    expect(el.props).toMatchObject({ value: '' });
  });

  it('未传 defaultParams 时使用注册模板', () => {
    const text = renderAndGetText(GameLevel);
    expect(text).toContain('1'); // GameLevel 模板 { level: 1 }
  });

  it('defaultScreen 未注册时抛错', () => {
    function Unregistered() {
      return React.createElement('div', null, 'x');
    }
    expect(() =>
      render(
        React.createElement(
          ScenarioManagementProvider,
          { defaultScreen: Unregistered as any },
          React.createElement('div', null),
        ),
      ),
    ).toThrow('未注册');
  });

  it('currentPath 初始为 [defaultScreen]', () => {
    const { get } = renderWithRef(Menu);
    expect(get()!.currentPath).toEqual([Menu]);
  });
});

describe('skip（沿树向下）', () => {
  it('skip 到子节点：路径增加，渲染更新', () => {
    const { get } = renderWithRef(Menu);

    act(() => {
      get()!.skip(GameLevel, { level: 2 });
    });

    const ctx = get()!;
    expect(ctx.currentPath).toEqual([Menu, GameLevel]);
    expect((ctx.currentScreen as React.ReactElement).type).toBe(GameLevel);
    expect((ctx.currentScreen as React.ReactElement).props).toMatchObject({ level: 2 });
  });

  it('skip 到孙子节点：路径继续加深', () => {
    const { get } = renderWithRef(Menu);

    act(() => {
      get()!.skip(GameLevel, { level: 1 });
    });
    act(() => {
      get()!.skip(Combat, { enemy: 'dragon' });
    });

    const ctx = get()!;
    expect(ctx.currentPath).toEqual([Menu, GameLevel, Combat]);
    expect((ctx.currentScreen as React.ReactElement).type).toBe(Combat);
    expect((ctx.currentScreen as React.ReactElement).props).toMatchObject({ enemy: 'dragon' });
  });

  it('skip 到非子节点抛错（严格沿树走）', () => {
    const { get } = renderWithRef(Menu);
    expect(() =>
      act(() => {
        get()!.skip(Combat, { enemy: 'x' });
      }),
    ).toThrow('不是');
  });
});

describe('back（沿树向上）', () => {
  it('从子节点返回父节点', () => {
    const { get } = renderWithRef(Menu);

    act(() => {
      get()!.skip(GameLevel, { level: 1 });
    });
    act(() => {
      get()!.back();
    });

    expect(get()!.currentPath).toEqual([Menu]);
    expect((get()!.currentScreen as React.ReactElement).type).toBe(Menu);
  });

  it('从孙子节点返回父节点', () => {
    const { get } = renderWithRef(Menu);

    act(() => get()!.skip(GameLevel, { level: 1 }));
    act(() => get()!.skip(Combat, { enemy: 'goblin' }));
    act(() => get()!.back());

    expect(get()!.currentPath).toEqual([Menu, GameLevel]);
    expect((get()!.currentScreen as React.ReactElement).type).toBe(GameLevel);
  });

  it('根节点调用 back 抛错', () => {
    const { get } = renderWithRef(Menu);
    expect(() => act(() => get()!.back())).toThrow('根节点');
  });

  it('模块级 back 行为一致', () => {
    const { get } = renderWithRef(Menu);
    act(() => get()!.skip(GameLevel, { level: 1 }));
    act(() => back());
    expect(get()!.currentPath).toEqual([Menu]);
  });
});

describe('gotoScreen（跨分支跳转）', () => {
  it('跨分支跳转：从 Combat 到 Settings', () => {
    const { get } = renderWithRef(Menu);

    act(() => get()!.skip(GameLevel, { level: 1 }));
    act(() => get()!.skip(Combat, { enemy: 'goblin' }));
    act(() => get()!.gotoScreen(Settings, { theme: 'light' }));

    expect(get()!.currentPath).toEqual([Menu, Settings]);
    expect((get()!.currentScreen as React.ReactElement).type).toBe(Settings);
    expect((get()!.currentScreen as React.ReactElement).props).toMatchObject({ theme: 'light' });
  });

  it('gotoScreen 到未注册组件抛错', () => {
    function Ghost() {
      return React.createElement('div', null);
    }
    const { get } = renderWithRef(Menu);
    expect(() =>
      act(() => {
        get()!.gotoScreen(Ghost as any, {});
      }),
    ).toThrow('未注册');
  });

  it('模块级 gotoScreen 行为一致', () => {
    const { get } = renderWithRef(Menu);
    act(() => get()!.skip(GameLevel, { level: 1 }));
    act(() => gotoScreen(Settings, { theme: 'solarized' }));
    expect(get()!.currentPath).toEqual([Menu, Settings]);
  });
});

describe('overlay（浮层）', () => {
  it('打开 overlay 不影响 currentPath', () => {
    const { get } = renderWithRef(Menu);
    const pathBefore = [...get()!.currentPath];

    act(() => get()!.overlay(Notification, { message: 'hello' }));

    const ctx = get()!;
    expect(ctx.currentPath).toEqual(pathBefore);
    expect(ctx.currentOverlay).not.toBeNull();
    expect((ctx.currentOverlay as React.ReactElement).type).toBe(Notification);
    expect((ctx.currentOverlay as React.ReactElement).props).toMatchObject({ message: 'hello' });
  });

  it('closeOverlay 关闭浮层', () => {
    const { get } = renderWithRef(Menu);
    act(() => get()!.overlay(Notification, { message: 'test' }));
    expect(get()!.currentOverlay).not.toBeNull();

    act(() => get()!.closeOverlay());
    expect(get()!.currentOverlay).toBeNull();
  });

  it('skip 时自动关闭 overlay', () => {
    const { get } = renderWithRef(Menu);
    act(() => get()!.overlay(Notification, { message: 'x' }));
    expect(get()!.currentOverlay).not.toBeNull();

    act(() => get()!.skip(GameLevel, { level: 1 }));
    expect(get()!.currentOverlay).toBeNull();
  });

  it('back 时自动关闭 overlay', () => {
    const { get } = renderWithRef(Menu);
    act(() => get()!.skip(GameLevel, { level: 1 }));
    act(() => get()!.overlay(Notification, { message: 'y' }));
    expect(get()!.currentOverlay).not.toBeNull();

    act(() => get()!.back());
    expect(get()!.currentOverlay).toBeNull();
  });

  it('gotoScreen 时自动关闭 overlay', () => {
    const { get } = renderWithRef(Menu);
    act(() => get()!.skip(GameLevel, { level: 1 }));
    act(() => get()!.overlay(Notification, { message: 'z' }));
    expect(get()!.currentOverlay).not.toBeNull();

    act(() => get()!.gotoScreen(Settings, { theme: 'dark' }));
    expect(get()!.currentOverlay).toBeNull();
  });

  it('模块级 overlay/closeOverlay 行为一致', () => {
    const { get } = renderWithRef(Menu);
    act(() => overlay(Notification, { message: 'mod' }));
    expect(get()!.currentOverlay).not.toBeNull();

    act(() => closeOverlay());
    expect(get()!.currentOverlay).toBeNull();
  });
});

describe('CurrentScreen 组件', () => {
  it('无 overlay 时只渲染栈顶屏幕', () => {
    const text = renderAndGetText(Menu);
    expect(text).toContain('Menu');
  });

  it('有 overlay 时同时渲染两层', () => {
    function TestOverlay() {
      const { overlay: ov } = useScreenSystem();
      useEffect(() => {
        ov(Notification, { message: 'popup!' });
      }, []);
      return React.createElement(CurrentScreen);
    }

    const { container } = render(
      React.createElement(
        ScenarioManagementProvider,
        { defaultScreen: Menu },
        React.createElement(TestOverlay),
      ),
    );
    expect(container.textContent).toContain('Menu');
    expect(container.textContent).toContain('popup!');
  });
});

describe('模块级函数错误处理', () => {
  it('Provider 未挂载时 skip 抛错', () => {
    expect(() => skip(Menu, {})).toThrow('Provider 尚未挂载');
  });
  it('Provider 未挂载时 back 抛错', () => {
    expect(() => back()).toThrow('Provider 尚未挂载');
  });
  it('Provider 未挂载时 gotoScreen 抛错', () => {
    expect(() => gotoScreen(Menu, {})).toThrow('Provider 尚未挂载');
  });
  it('Provider 未挂载时 overlay 抛错', () => {
    expect(() => overlay(Notification, { message: '' })).toThrow('Provider 尚未挂载');
  });
  it('Provider 未挂载时 closeOverlay 抛错', () => {
    expect(() => closeOverlay()).toThrow('Provider 尚未挂载');
  });
});
````

## File: src/__tests__/screen/registry.test.ts
````typescript
import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import {
  registerComponent,
  getTemplate,
  hasComponent,
  getParent,
  getChildren,
  isChildOf,
  getRoots,
  clearRegistry,
} from '../../screen/registry.js';

// ── 测试用组件 ────────────────────────────────────────────

function Menu({}: {}) {
  return React.createElement('div', null, 'Menu');
}
Menu.displayName = 'Menu';

function Settings({ theme }: { theme: string }) {
  return React.createElement('div', null, theme);
}
Settings.displayName = 'Settings';

function GameLevel({ level }: { level: number }) {
  return React.createElement('div', null, String(level));
}
GameLevel.displayName = 'GameLevel';

function Combat({ enemy }: { enemy: string }) {
  return React.createElement('div', null, enemy);
}
Combat.displayName = 'Combat';

function Inventory({ items }: { items: string[] }) {
  return React.createElement('div', null, String(items.length));
}
Inventory.displayName = 'Inventory';

// ── Setup ─────────────────────────────────────────────────

beforeEach(() => {
  clearRegistry();
});

// ── 基础注册 ──────────────────────────────────────────────

describe('registerComponent（基础）', () => {
  it('注册后 hasComponent 返回 true', () => {
    registerComponent(Menu, {});
    expect(hasComponent(Menu)).toBe(true);
  });

  it('注册后 getTemplate 返回模板参数', () => {
    registerComponent(Settings, { theme: 'dark' });
    expect(getTemplate(Settings)).toEqual({ theme: 'dark' });
  });

  it('重复注册抛错', () => {
    registerComponent(Menu, {});
    expect(() => registerComponent(Menu, {})).toThrow('已注册');
  });

  it('多个组件可分别注册', () => {
    registerComponent(Menu, {});
    registerComponent(Settings, { theme: 'dark' });
    expect(hasComponent(Menu)).toBe(true);
    expect(hasComponent(Settings)).toBe(true);
  });

  it('未注册组件 hasComponent 返回 false', () => {
    expect(hasComponent(Combat)).toBe(false);
  });

  it('未注册组件 getTemplate 返回 undefined', () => {
    expect(getTemplate(Combat)).toBeUndefined();
  });
});

// ── 树结构 ────────────────────────────────────────────────

describe('registerComponent（树结构）', () => {
  it('未传 parent 时为根节点', () => {
    registerComponent(Menu, {});
    expect(getParent(Menu)).toBeNull();
    expect(getRoots()).toContain(Menu);
  });

  it('注册时声明 parent 建立父子关系', () => {
    registerComponent(Menu, {});
    registerComponent(Settings, { theme: 'dark' }, { parent: Menu });
    expect(getParent(Settings)).toBe(Menu);
  });

  it('getChildren 返回所有子节点', () => {
    registerComponent(Menu, {});
    registerComponent(Settings, { theme: 'dark' }, { parent: Menu });
    registerComponent(GameLevel, { level: 1 }, { parent: Menu });
    const children = getChildren(Menu);
    expect(children).toContain(Settings);
    expect(children).toContain(GameLevel);
    expect(children).toHaveLength(2);
  });

  it('isChildOf 正确判断父子关系', () => {
    registerComponent(Menu, {});
    registerComponent(GameLevel, { level: 1 }, { parent: Menu });
    registerComponent(Combat, { enemy: 'goblin' }, { parent: GameLevel });

    expect(isChildOf(GameLevel, Menu)).toBe(true);
    expect(isChildOf(Combat, GameLevel)).toBe(true);
    expect(isChildOf(Combat, Menu)).toBe(false);
    expect(isChildOf(Settings, Menu)).toBe(false);
  });

  it('多层嵌套树结构正确', () => {
    // Menu → GameLevel → Combat
    registerComponent(Menu, {});
    registerComponent(GameLevel, { level: 1 }, { parent: Menu });
    registerComponent(Combat, { enemy: 'goblin' }, { parent: GameLevel });
    registerComponent(Inventory, { items: [] }, { parent: GameLevel });

    expect(getParent(Menu)).toBeNull();
    expect(getParent(GameLevel)).toBe(Menu);
    expect(getParent(Combat)).toBe(GameLevel);
    expect(getParent(Inventory)).toBe(GameLevel);

    const menuChildren = getChildren(Menu);
    expect(menuChildren).toHaveLength(1);
    expect(menuChildren).toContain(GameLevel);

    const gameChildren = getChildren(GameLevel);
    expect(gameChildren).toHaveLength(2);
    expect(gameChildren).toContain(Combat);
    expect(gameChildren).toContain(Inventory);

    expect(getChildren(Combat)).toHaveLength(0);
  });

  it('getRoots 返回所有根节点', () => {
    registerComponent(Menu, {});
    // 另一个不在树中的独立根节点
    function Standalone({}: {}) {
      return React.createElement('div', null);
    }
    Standalone.displayName = 'Standalone';
    registerComponent(Standalone, {});

    const roots = getRoots();
    expect(roots).toHaveLength(2);
    expect(roots).toContain(Menu);
    expect(roots).toContain(Standalone);
  });
});
````

## File: src/screen/context.ts
````typescript
import { createContext, ReactNode } from 'react';
import type {
  SkipFn,
  BackFn,
  GotoScreenFn,
  OverlayFn,
  CloseOverlayFn,
} from './types.js';

export interface ScreenSystemContextValue {
  /** 当前屏幕的已渲染元素（栈顶组件） */
  currentScreen: ReactNode;
  /** overlay 的已渲染元素（若有） */
  currentOverlay: ReactNode | null;
  /** 当前激活路径：从根到栈顶的组件数组 */
  currentPath: React.ComponentType<any>[];
  /** 沿树向下跳转（选分支） */
  skip: SkipFn;
  /** 沿树向上返回父节点 */
  back: BackFn;
  /** 跨分支跳转到任意已注册节点 */
  gotoScreen: GotoScreenFn;
  /** 打开浮层 */
  overlay: OverlayFn;
  /** 关闭浮层 */
  closeOverlay: CloseOverlayFn;
}

export const ScreenSystemContext =
  createContext<ScreenSystemContextValue | null>(null);
````

## File: src/screen/hook.ts
````typescript
import { useContext } from 'react';
import { ScreenSystemContext, ScreenSystemContextValue } from './context.js';

/**
 * Access the screen-management API from within a React component.
 *
 * Returns `{ currentScreen, currentOverlay, currentPath, skip, back,
 * gotoScreen, overlay, closeOverlay }`.
 *
 * Must be used inside a {@link ScenarioManagementProvider}.
 *
 * @throws If no provider is found in the component tree.
 */
export function useScreenSystem(): ScreenSystemContextValue {
  const ctx = useContext(ScreenSystemContext);
  if (!ctx) {
    throw new Error(
      '[Ink-Component] useScreenSystem() 必须在 <ScenarioManagementProvider> 内部使用。',
    );
  }
  return ctx;
}
````

## File: src/screen/index.ts
````typescript
export { registerComponent } from './registry.js';
export {
  ScenarioManagementProvider,
  skip,
  back,
  gotoScreen,
  overlay,
  closeOverlay,
} from './provider.js';
export type { ScenarioManagementProviderProps } from './provider.js';
export { useScreenSystem } from './hook.js';
export { CurrentScreen } from './current-screen.js';
export type {
  SkipOptions,
  SkipFn,
  BackFn,
  GotoScreenFn,
  OverlayFn,
  CloseOverlayFn,
  RegisterOptions,
} from './types.js';
````

## File: src/screen/types.ts
````typescript
import React from 'react';



export interface RegisterOptions {
  /** 父节点组件，不传则为根节点候选 */
  parent?: React.ComponentType<any>;
}



export interface SkipOptions {
  /** 仅更新属性，不重新挂载组件 */
  onlyAttribute?: boolean;
}



/** Provider 内部状态 */
export interface ScreenState {
  /** 从根到当前节点的完整路径 */
  path: React.ComponentType<any>[];
  /** 路径上每层的参数 */
  pathParams: Record<string, unknown>[];
  /** 当前 overlay（独立于树） */
  overlay: {
    component: React.ComponentType<any>;
    params: Record<string, unknown>;
  } | null;
  /** 自增计数器，用于 React key */
  counter: number;
}



export type ScreenActionType = 'skip' | 'back' | 'gotoScreen' | 'overlay' | 'closeOverlay';

export interface SkipAction {
  type: 'skip';
  component: React.ComponentType<any>;
  params: Record<string, unknown>;
  onlyAttribute: boolean;
}

export interface BackAction {
  type: 'back';
}

export interface GotoScreenAction {
  type: 'gotoScreen';
  component: React.ComponentType<any>;
  params: Record<string, unknown>;
}

export interface OverlayAction {
  type: 'overlay';
  component: React.ComponentType<any>;
  params: Record<string, unknown>;
}

export interface CloseOverlayAction {
  type: 'closeOverlay';
}

export type ScreenAction =
  | SkipAction
  | BackAction
  | GotoScreenAction
  | OverlayAction
  | CloseOverlayAction;



export type SkipFn = <C extends React.ComponentType<any>>(
  component: C,
  params: React.ComponentProps<C>,
  options?: SkipOptions,
) => void;

export type BackFn = () => void;

export type GotoScreenFn = <C extends React.ComponentType<any>>(
  component: C,
  params: React.ComponentProps<C>,
) => void;

export type OverlayFn = <C extends React.ComponentType<any>>(
  component: C,
  params: React.ComponentProps<C>,
) => void;

export type CloseOverlayFn = () => void;
````

## File: .gitignore
````
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Diagnostic reports (https://nodejs.org/api/report.html)
report.[0-9]*.[0-9]*.[0-9]*.[0-9]*.json

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Directory for instrumented libs generated by jscoverage/JSCover
lib-cov

# Coverage directory used by tools like istanbul
coverage
*.lcov

# nyc test coverage
.nyc_output

# Grunt intermediate storage (https://gruntjs.com/creating-plugins#storing-task-files)
.grunt

# Bower dependency directory (https://bower.io/)
bower_components

# node-waf configuration
.lock-wscript

# Compiled binary addons (https://nodejs.org/api/addons.html)
build/Release

# Dependency directories
node_modules/
jspm_packages/

# Snowpack dependency directory (https://snowpack.dev/)
web_modules/

# TypeScript cache
*.tsbuildinfo

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Optional stylelint cache
.stylelintcache

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variable files
.env
.env.*
!.env.example

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# Next.js build output
.next
out

# Nuxt.js build / generate output
.nuxt

dist/

# Gatsby files
.cache/
# Comment in the public line in if your project uses Gatsby and not Next.js
# https://nextjs.org/blog/next-9-1#public-directory-support
# public

# vuepress build output
.vuepress/dist

# vuepress v2.x temp and cache directory
.temp
.cache

# Sveltekit cache directory
.svelte-kit/

# vitepress build output
**/.vitepress/dist

# vitepress cache directory
**/.vitepress/cache

# Docusaurus cache and generated files
.docusaurus

# Serverless directories
.serverless/

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# Firebase cache directory
.firebase/

# TernJS port file
.tern-port

# Stores VSCode versions used for testing VSCode extensions
.vscode-test

# yarn v3
.pnp.*
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/sdks
!.yarn/versions

# Vite logs files
vite.config.js.timestamp-*
vite.config.ts.timestamp-*
vite.config.ts.timestamp-*


.npmrc
AI.md
````

## File: src/keyboard/index.ts
````typescript
export { KeyboardProvider } from "./provider.js";
export type { KeyboardProviderProps } from "./provider.js";
export { useKeyboard, useFocusState } from "./hook.js";
export type {
  KeyHandler,
  BoundKeyboardOptions,
  BlockedKeyOptions,
  StopOptions,
  BoundKeyEntry,
  ScreenKeyboardLayer,
  FocusTarget,
  GlobalKeyEntry,
} from "./types.js";
````

## File: src/keyboard/README.md
````markdown
# Keyboard System

ink-kit provides a **layered keyboard event system** built on top of the screen management tree. Instead of a single global `useInput` with messy `if-else` chains, you get **per-screen-layer** key bindings with transparent keys, propagation barriers, global shortcuts, and **within-screen focus management**.

---

## Quick Start

```tsx
import React, { useEffect } from 'react';
import { Box, Text, render } from 'ink';
import {
  registerComponent,
  ScenarioManagementProvider,
  CurrentScreen,
  useScreenSystem,
  KeyboardProvider,
  useKeyboard,
} from '@baigao_h/ink-kit';

function Menu() {
  const { skip } = useScreenSystem();
  const { boundKeyboard } = useKeyboard();

  useEffect(() => {
    boundKeyboard(['s'], () => skip(Game, { level: 1 }));
    boundKeyboard(['q'], () => process.exit());
  }, []);

  return (
    <Box flexDirection="column">
      <Text>Main Menu</Text>
      <Text>[S] Start Game  [Q] Quit</Text>
    </Box>
  );
}
registerComponent(Menu, {});

function Game({ level }: { level: number }) {
  const { back } = useScreenSystem();
  const { boundKeyboard } = useKeyboard();

  useEffect(() => {
    boundKeyboard(['b'], () => back());
  }, []);

  return (
    <Box>
      <Text>Level {level} — Press B to go back</Text>
    </Box>
  );
}
registerComponent(Game, { level: 1 }, { parent: Menu });

function App() {
  return (
    <KeyboardProvider>
      <CurrentScreen />
    </KeyboardProvider>
  );
}

render(
  <ScenarioManagementProvider defaultScreen={Menu}>
    <App />
  </ScenarioManagementProvider>,
);
```

---

## Important: Component Nesting Order

`KeyboardProvider` **must** be nested inside `ScenarioManagementProvider`, because it depends on the screen context to obtain the current screen stack.

```tsx
{/* Wrong: KeyboardProvider outside screen context */}
<KeyboardProvider>
  <ScenarioManagementProvider defaultScreen={Menu}>
    ...
  </ScenarioManagementProvider>
</KeyboardProvider>

{/* Correct: KeyboardProvider inside screen context */}
<ScenarioManagementProvider defaultScreen={Menu}>
  <KeyboardProvider>
    ...
  </KeyboardProvider>
</ScenarioManagementProvider>
```

The screen system can be used independently without `KeyboardProvider`; but the keyboard system requires the screen context.

---

## Concepts

### Layered Event Handling

Every screen in the tree has its own **keyboard layer**. When a key is pressed, the event travels through a priority chain:

```
Key pressed
  │
  ├─ ① Global keys (affectOverlay: true)
  │
  ├─ ② Active overlay layer
  │      ├─ Built-in Tab/Shift+Tab → switch focus within overlay
  │      ├─ Focus target (if active) → blockedKey → bindings → stop
  │      └─ Overlay layer bindings → blockedKey → bindings → stop
  │
  ├─ ③ Global keys (affectOverlay: false, default)
  │
  ├─ ④ Screen stack (top → bottom)
  │      For each layer (top to bottom):
  │        ├─ Built-in Tab/Shift+Tab (top layer only) → switch focus
  │        ├─ Focus target (top layer only, if active) → blockedKey → bindings → stop
  │        └─ Screen layer bindings → blockedKey → bindings → stop
  │
  └─ ⑤ Dropped (unhandled)
```

### Screen-Level vs Focus-Level

Before the focus system, all bindings within a screen shared the same bucket. Two `SelectInput` components on the same screen would both bind `up`/`down`/`return` and collide. The focus system splits each layer into two tiers:

- **Screen-level bindings**: the original `boundKeyboard` without `focusId`. Always active.
- **Focus targets**: named buckets created by passing `focusId` in `BoundKeyboardOptions`. Only the **currently active** target receives events.

Events always check the active focus target **first**, then fall through to screen-level bindings.

Multiple form controls on the same screen can each own a focus target. The built-in **Tab** key rotates between them automatically.

---

## API Reference

### `KeyboardProvider`

```tsx
<KeyboardProvider>
  {children}
</KeyboardProvider>
```

Root context provider for the keyboard system. Handles `useInput` from Ink and routes all key events through the layered priority chain.

Must be nested inside `<ScenarioManagementProvider>`.

---

### `useKeyboard`

```tsx
const {
  boundKeyboard,
  blockedKey,
  stop,
  globalKeys,
  focusSet,
  focusNext,
  focusPrev,
  focusCurrent,
  focusUnregister,
  subscribeFocus,
} = useKeyboard();
```

React hook returning the keyboard API.

Must be used inside `<KeyboardProvider>`, otherwise throws an error.

---

### `useFocusState`

```tsx
const isFocused = useFocusState(focusId: string): boolean;
```

A subscription-based hook that returns `true` when the given `focusId` is the currently active focus target on the current screen. Reactively re-renders on focus changes without causing the whole tree to update.

Used by focus-aware components (SelectInput, TextInput, etc.) to react to focus gain/loss.

---

### `boundKeyboard`

```tsx
boundKeyboard(keys, handler, options?): () => void;
```

Bind one or more keys to a handler. The binding is automatically associated with the top-of-stack component.

| Parameter | Type                            | Description                                      |
| --------- | ------------------------------- | ------------------------------------------------ |
| keys      | `string[]`                      | Key names to bind (e.g. `['s']`, `['ctrl+q', 'return']`) |
| handler   | `(input: string, key: Key) => void` | Callback matching Ink's `useInput` signature  |
| options   | `{ onlyThis?: boolean; focusId?: string }` | Optional behavior flags               |

Returns an unbind function.

**Key name format:**

| Example             | Key Pressed                        |
| ------------------- | ---------------------------------- |
| `'s'`               | `s` key                            |
| `'return'`          | Enter/Return                       |
| `'escape'`          | Escape                             |
| `'backspace'`       | Backspace                          |
| `'ctrl+s'`          | Ctrl + S                           |
| `'shift+tab'`       | Shift + Tab                        |
| `'meta+f'`          | Meta/Command + F                   |
| `'up'`              | Up arrow                           |
| `'down'`            | Down arrow                         |

**`onlyThis` option**

When `true`, the binding only activates when the owning screen is the top-of-stack and no overlay is open.

**`focusId` option**

When provided, the binding is stored on a named **focus target** instead of the screen-level bucket. Only the currently active focus target receives events. Focus targets are created on first use and automatically activated if no other target is currently active.

```tsx
boundKeyboard(['up'], handleUp, { focusId: 'theme-picker' });
boundKeyboard(['down'], handleDown, { focusId: 'theme-picker' });
boundKeyboard(['return'], handleSelect, { focusId: 'theme-picker' });
```

---

### `blockedKey`

```tsx
blockedKey(keys, options?): void;
```

Mark one or more keys as **transparent** on the current layer. When a transparent key reaches this layer, the layer's own bindings are skipped and the key propagates to layers below.

| Parameter | Type                 | Description                              |
| --------- | -------------------- | ---------------------------------------- |
| keys      | `string[]`           | Key names to make transparent            |
| options   | `{ focusId?: string }` | If provided, blocks only within that focus target |

Does not return an unbind function. Transparency is automatically cleaned up when the layer is destroyed.

---

### `stop`

```tsx
stop(keys, options?): () => void;
```

Prevent one or more keys from propagating to layers below. The stopped keys are consumed at this layer: the layer's own bindings are evaluated first, and if no binding matches, the key is blocked.

| Parameter | Type                 | Description                              |
| --------- | -------------------- | ---------------------------------------- |
| keys      | `string[]`           | Key names to stop                        |
| options   | `{ focusId?: string }` | If provided, stops within that focus target |

Returns an unstop function.

---

### `globalKeys`

```tsx
globalKeys(entries: GlobalKeyEntry[]): void;
```

Register **global key bindings** that fire independently of the screen stack. Calling this replaces any previously registered global keys.

#### `GlobalKeyEntry`

| Property      | Type                                      | Default        | Description |
| ------------- | ----------------------------------------- | -------------- | ----------- |
| `key`         | `string \| string[]`                      | —              | Key name(s) to match |
| `operate`     | `() => void`                              | —              | Callback invoked when the key is pressed |
| `cover`       | `boolean`                                 | `true`         | Whether screen components may override this key |
| `affectOverlay` | `boolean`                               | `false`        | Fire before (`true`) or after (`false`) the overlay layer |
| `category`    | `React.ComponentType[] \| '*' \| undefined` | `'*'`       | Whitelist of screens; `'*'` = all, `[]` = disabled |

---

### Focus Management APIs

These are available from `useKeyboard()` and operate on the **current screen's** focus targets.

#### `focusSet(focusId: string): void`

Activate a specific focus target by its id. No-op if the id does not exist.

#### `focusNext(): void`

Rotate to the next focus target in registration order. Equivalent to pressing Tab.

#### `focusPrev(): void`

Rotate to the previous focus target in registration order. Equivalent to pressing Shift+Tab.

#### `focusCurrent(): string | null`

Returns the currently active focus id, or `null` if none.

#### `focusUnregister(focusId: string): void`

Remove a focus target. If it was the active one, the next target (if any) is activated automatically. Components should call this in their `useEffect` cleanup.

#### `subscribeFocus(listener: () => void): () => void`

Subscribe to focus changes on the current screen. Returns an unsubscribe function. Used internally by `useFocusState`; you rarely need this directly.

---

## Built-in Tab Navigation

When a screen has one or more focus targets registered, the keyboard system intercepts `tab` and `shift+tab` at the top layer and rotates through targets in registration order.

- **Tab**: activate next focus target
- **Shift+Tab**: activate previous focus target

This is automatic — you do not need to bind Tab yourself. If a screen has no focus targets, Tab keys fall through to screen-level bindings as normal.

The same behavior applies to overlays with focus targets.

---

## Common Patterns

### Focus-aware Component

```tsx
function MySelectInput<T>(props: { focusId: string; items: Item<T>[]; onSelect: (item: Item<T>) => void }) {
  const isFocused = useFocusState(props.focusId);
  const { boundKeyboard, focusUnregister } = useKeyboard();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const fid = props.focusId;
    const u1 = boundKeyboard(['up'], () => setIndex(i => ...), { focusId: fid });
    const u2 = boundKeyboard(['down'], () => setIndex(i => ...), { focusId: fid });
    const u3 = boundKeyboard(['return'], () => props.onSelect(props.items[index]), { focusId: fid });
    return () => { u1(); u2(); u3(); focusUnregister(fid); };
  }, [props.focusId]);

  return (
    <Box flexDirection="column">
      {props.items.map((item, i) => (
        <Text key={String(item.value)} dimColor={!isFocused}>
          {isFocused && i === index ? '❯ ' : '  '}{item.label}
        </Text>
      ))}
    </Box>
  );
}
```

### Multiple Controls on One Screen

```tsx
function Settings() {
  return (
    <Box flexDirection="column">
      <Text bold>Settings</Text>

      <MySelectInput
        focusId="theme-picker"
        items={[{ label: 'Dark', value: 'dark' }, { label: 'Light', value: 'light' }]}
        onSelect={(item) => console.log('theme:', item.value)}
      />

      <MySelectInput
        focusId="difficulty-picker"
        items={[{ label: 'Easy', value: 'easy' }, { label: 'Hard', value: 'hard' }]}
        onSelect={(item) => console.log('difficulty:', item.value)}
      />

      <Text dimColor>Press Tab to switch focus</Text>
    </Box>
  );
}
```

### Programmatic Focus Control

```tsx
function Wizard() {
  const { focusSet, focusNext } = useKeyboard();

  useEffect(() => {
    boundKeyboard(['ctrl+n'], () => focusNext());
    boundKeyboard(['ctrl+1'], () => focusSet('step1'));
    boundKeyboard(['ctrl+2'], () => focusSet('step2'));
  }, []);

  // ...
}
```

### Global Keys with Focus

Global keys continue to work as before. Screen components can override them through either screen-level or focus-level bindings, as long as the global key has `cover: true`.

---

## Complete Event Chain

```
Key pressed
    │
    ├─ ① Global keys (affectOverlay: true)
    │      └─ matched → consume, stop
    │
    ├─ ② Active overlay layer
    │      ├─ Built-in Tab/Shift+Tab → switch focus within overlay
    │      ├─ Focus target (if active)
    │      │    ├─ blockedKey → skip bindings
    │      │    ├─ boundKeyboard matched? → consume, stop
    │      │    └─ stop keys matched? → consume, block
    │      ├─ Overlay layer bindings
    │      │    ├─ blockedKey → skip bindings
    │      │    ├─ boundKeyboard matched? → consume, stop
    │      │    └─ stop keys matched? → consume, block
    │      └─ (none matched) → continue
    │
    ├─ ③ Global keys (affectOverlay: false, default)
    │      └─ matched → consume, stop
    │
    ├─ ④ Screen stack (top → bottom)
    │      for each layer (top to bottom):
    │        ├─ Built-in Tab/Shift+Tab (top layer only) → switch focus
    │        ├─ Focus target (top layer only, if active)
    │        │    ├─ blockedKey → skip bindings
    │        │    ├─ boundKeyboard matched? → consume, stop
    │        │    └─ stop keys matched? → consume, block
    │        ├─ Screen layer bindings
    │        │    ├─ blockedKey → skip bindings
    │        │    ├─ boundKeyboard matched? → consume, stop
    │        │    └─ (top layer only) stop keys matched? → consume, block
    │        └─ (none matched) → continue to next layer
    │
    └─ ⑤ Dropped (no handler matched)
```

---

## Type Safety

All keyboard APIs provide full TypeScript type inference.

```tsx
// Key names are plain strings (no enum needed)
boundKeyboard(['ctrl+s'], handler);

// GlobalKeyEntry is fully typed
globalKeys([
  {
    key: 'e',
    operate: () => console.log('global e'),
    cover: true,
    affectOverlay: false,
    category: [Menu, Settings],
  },
]);

// Focus-aware components have full type safety on focusId
boundKeyboard(['up'], handleUp, { focusId: 'my-input' });
```

---

## Common Patterns

### Per-Screen Key Binding (Recommended)

Use `useEffect` to set up bindings when the screen mounts and clean them up on unmount.

```tsx
function Game() {
  const { back } = useScreenSystem();
  const { boundKeyboard, stop } = useKeyboard();

  useEffect(() => {
    const unbindB = boundKeyboard(['b'], () => back());
    const unstopQ = stop(['q']);
    return () => {
      unbindB();
      unstopQ();
    };
  }, []);

  return <Text>Playing...</Text>;
}
```

### Blocking Keys for Pass-Through

Let a specific key "pierce" through the current layer to reach a lower layer.

```tsx
function Combat() {
  const { boundKeyboard, blockedKey } = useKeyboard();

  useEffect(() => {
    blockedKey(['e']);
    boundKeyboard(['a'], () => attack());
  }, []);

  return <Text>Combat! Press A to attack.</Text>;
}
```

### Global Keys for Application-Wide Shortcuts

```tsx
function App() {
  const { globalKeys } = useKeyboard();

  useEffect(() => {
    globalKeys([
      {
        key: 'q',
        operate: () => process.exit(),
        cover: false,
      },
      {
        key: 'h',
        operate: () => showHelp(),
        cover: true,
        affectOverlay: true,
        category: '*',
      },
    ]);
  }, []);

  return <CurrentScreen />;
}
```

### Override a Global Key in a Specific Screen

```tsx
globalKeys([{ key: 'e', operate: () => exitGame(), cover: true }]);

function Settings() {
  const { boundKeyboard } = useKeyboard();
  useEffect(() => {
    boundKeyboard(['e'], () => console.log('Settings: e pressed'));
  }, []);
}
```

### Focus-Based Override with Global Keys

```tsx
globalKeys([{ key: 'e', operate: () => console.log('global e'), cover: true }]);

function SettingsForm() {
  const { boundKeyboard } = useKeyboard();
  useEffect(() => {
    // Override global 'e' only when this specific input is focused
    boundKeyboard(['e'], () => console.log('input: e'), {
      focusId: 'name-input',
    });
  }, []);
  // ...
}
```

---

## Common Errors

| Error Message | Cause |
| --- | --- |
| `[Ink-Trc] useKeyboard() 必须在 <KeyboardProvider> 内部使用。` | `useKeyboard` was called outside `<KeyboardProvider>` |
| `[Ink-Trc] boundKeyboard() 必须在屏幕组件内调用。当前无活跃屏幕。` | `boundKeyboard` was called when the screen stack is empty |
| `[Ink-Trc] stop() 必须在屏幕组件内调用。` | `stop` was called outside a screen component |
| `[Ink-Trc] blockedKey() 必须在屏幕组件内调用。` | `blockedKey` was called outside a screen component |
| `[Ink-Trc] 组件 "X" 尝试通过 boundKeyboard 绑定 "Y"，但该键已被 globalKeys 声明且 cover: false，不允许覆盖。` | A screen or focus target tried to bind a key with `cover: false` |
```
````

## File: src/screen/current-screen.tsx
````typescript
import React from 'react';
import { Box } from 'ink';
import { useScreenSystem } from './hook.js';

/**
 * Render the current screen and any active overlay.
 *
 * When no overlay is open only the top-of-stack screen is rendered.
 * When an overlay is open both the underlying screen and the overlay
 * are rendered together (overlay on top).
 */
export function CurrentScreen(): React.ReactNode {
  const { currentScreen, currentOverlay } = useScreenSystem();

  // 始终用 Box 包裹，避免 overlay 开关时返回元素类型变化
  // （组件 → Box）导致 React 卸载重挂 组件。组件 重挂载时
  // boundKeyboard 会路由到 overlay layer，导致 overlay 关闭键被屏蔽。
  // null 作为 React 子节点会被忽略，不渲染任何内容。
  return React.createElement(
    Box,
    { flexDirection: 'column', width: '100%', height: '100%' },
    currentScreen as React.ReactElement,
    currentOverlay as React.ReactElement,
  );
}
````

## File: src/screen/registry.ts
````typescript
import React from "react";
import type { RegisterOptions } from "./types.js";

/** 单条注册记录 */
interface RegistryEntry {
  /** 参数模板对象 */
  template: Record<string, unknown>;
  /** 父节点组件引用（null 表示根节点候选） */
  parent: React.ComponentType<any> | null;
  /** 子节点列表（由 registerComponent 自动维护） */
  children: Set<React.ComponentType<any>>;
}

/** 模块级注册表：组件 → 注册信息 */
const registry = new Map<React.ComponentType<any>, RegistryEntry>();

/**
 * Register a component as a screen in the navigation tree.
 *
 * @param component  The React component (used as the unique token).
 * @param template   Default props for the component.
 * @param options    Optional registration options (e.g. `parent` to attach
 *                   the component under an existing node in the tree).
 *
 * @throws If the component has already been registered.
 */
export function registerComponent<C extends React.ComponentType<any>>(
  component: C,
  template: React.ComponentProps<C>,
  options?: RegisterOptions,
): void {
  if (registry.has(component)) {
    throw new Error(
      `[Ink-Trc] 组件 "${component.displayName || component.name || "anonymous"}" 已注册，不能重复注册。`,
    );
  }

  registry.set(component, {
    template: template as Record<string, unknown>,
    parent: options?.parent ?? null,
    children: new Set(),
  });

  // 如果声明了父节点，将自己添加到父节点的 children 中
  if (options?.parent) {
    const parentEntry = registry.get(options.parent);
    if (parentEntry) {
      parentEntry.children.add(component);
    }
  }
}

/** 获取组件的模板参数 */
export function getTemplate(
  component: React.ComponentType<any>,
): Record<string, unknown> | undefined {
  return registry.get(component)?.template;
}

/** 获取组件的父节点 */
export function getParent(
  component: React.ComponentType<any>,
): React.ComponentType<any> | null | undefined {
  return registry.get(component)?.parent;
}

/** 获取组件的子节点列表 */
export function getChildren(
  component: React.ComponentType<any>,
): React.ComponentType<any>[] {
  const entry = registry.get(component);
  return entry ? Array.from(entry.children) : [];
}

/** 检查组件是否已注册 */
export function hasComponent(component: React.ComponentType<any>): boolean {
  return registry.has(component);
}

/** 获取所有根节点（parent 为 null 的组件） */
export function getRoots(): React.ComponentType<any>[] {
  const roots: React.ComponentType<any>[] = [];
  for (const [component, entry] of registry) {
    if (entry.parent === null) {
      roots.push(component);
    }
  }
  return roots;
}

/** 判断 child 是否是 parent 的直接子节点 */
export function isChildOf(
  child: React.ComponentType<any>,
  parent: React.ComponentType<any>,
): boolean {
  const entry = registry.get(child);
  return entry?.parent === parent;
}

/** 清除所有注册（仅供测试使用） */
export function clearRegistry(): void {
  registry.clear();
}
````

## File: LICENSE
````
MIT License

Copyright (c) 2026 BAIGAO

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
````

## File: src/keyboard/context.ts
````typescript
import { createContext } from "react";
import type {
  KeyHandler,
  BoundKeyboardOptions,
  BlockedKeyOptions,
  StopOptions,
  GlobalKeyEntry,
} from "./types.js";

/**
 * Value provided by {@link KeyboardProvider} via React context.
 */
export interface KeyboardContextValue {
  /**
   * Bind one or more keys to a handler on the current screen layer.
   *
   * When a `focusId` is provided, the binding is stored on a named focus
   * target instead of the screen-level bucket. Only the currently active
   * focus target receives events.
   *
   * @param keys     Key names to bind (e.g. `["s", "ctrl+q", "return"]`).
   * @param handler  Callback receiving the raw `input` and `key` from Ink.
   * @param options  Optional binding behavior (`onlyThis`, `focusId`).
   * @returns        An unbind function that removes this binding when called.
   */
  boundKeyboard: (
    keys: string[],
    handler: KeyHandler,
    options?: BoundKeyboardOptions,
  ) => () => void;

  /**
   * Mark one or more keys as "transparent" on the current layer.
   *
   * When a transparent key reaches this layer (or the named focus target),
   * the layer's own bindings are skipped and the key continues to propagate
   * to layers below.
   *
   * @param keys     Key names to make transparent.
   * @param options  If `focusId` is provided, marks transparent only
   *                 within that focus target.
   */
  penetration: (keys: string[], options?: BlockedKeyOptions) => void;

  /**
   * Prevent one or more keys from propagating to layers below.
   *
   * Stopped keys are consumed at this layer: local bindings are evaluated
   * first, and if no binding matches, the key is blocked from reaching
   * lower layers.
   *
   * @param keys     Key names to stop from propagating.
   * @param options  If `focusId` is provided, stops only within that
   *                 focus target.
   * @returns        An unstop function that removes the keys from the
   *                 stop list.
   */
  stop: (keys: string[], options?: StopOptions) => () => void;

  /**
   * Register global key bindings.
   *
   * Global keys fire independently of the screen stack (subject to
   * `category` whitelist and `affectOverlay` placement).
   *
   * Calling this replaces any previously registered global keys.
   *
   * @param entries  Array of global key definitions.
   */
  globalKeys: (entries: GlobalKeyEntry[]) => void;

  /**
   * Remove a focus target from the current screen layer.
   *
   * If the removed target was the currently active one, the next target
   * (in registration order) is activated automatically. If no targets
   * remain, `currentFocusId` becomes `null`.
   *
   * Components should call this in their `useEffect` cleanup alongside
   * unbinding their focus-level key bindings.
   *
   * @param focusId  The focus target id to remove.
   */
  focusUnregister: (focusId: string) => void;

  /**
   * Activate a specific focus target by its id.
   *
   * No-op if no focus target with the given id exists on the current
   * screen layer.
   *
   * @param focusId  The focus target id to activate.
   */
  focusSet: (focusId: string) => void;

  /**
   * Activate the next focus target in registration order.
   *
   * Equivalent to pressing Tab. Wraps around to the first target if
   * the last target is currently active.
   */
  focusNext: () => void;

  /**
   * Activate the previous focus target in registration order.
   *
   * Equivalent to pressing Shift+Tab. Wraps around to the last target
   * if the first target is currently active.
   */
  focusPrev: () => void;

  /**
   * Return the currently active focus target id on the current screen.
   *
   * @returns The active focus id, or `null` if no focus targets exist.
   */
  focusCurrent: () => string | null;

  /**
   * Subscribe to focus changes on the current screen layer.
   *
   * The listener is called whenever the active focus id changes (via
   * Tab, `focusSet`, `focusNext`, `focusPrev`, or `focusUnregister`).
   *
   * @param listener  Callback invoked on focus change.
   * @returns         An unsubscribe function.
   */
  subscribeFocus: (listener: () => void) => () => void;
}

/**
 * React context for the keyboard system.
 *
 * Accessed via {@link useKeyboard}. Must be provided by a
 * {@link KeyboardProvider} nested inside a
 * {@link ScenarioManagementProvider}.
 */
export const KeyboardContext = createContext<KeyboardContextValue | null>(null);
````

## File: src/keyboard/hook.ts
````typescript
import { useContext, useEffect, useState } from "react";
import { KeyboardContext, KeyboardContextValue } from "./context.js";

/**
 * Access the keyboard API from within a React component.
 *
 * Returns `{ boundKeyboard, blockedKey, stop, globalKeys }`.
 *
 * Must be used inside a {@link KeyboardProvider}.
 *
 * @throws If no provider is found in the component tree.
 */
export function useKeyboard(): KeyboardContextValue {
  const ctx = useContext(KeyboardContext);
  if (!ctx) {
    throw new Error(
      "[Ink-Trc] useKeyboard() 必须在 <KeyboardProvider> 内部使用。",
    );
  }
  return ctx;
}

export function useFocusState(focusId: string): boolean {
  const { focusCurrent, subscribeFocus } = useKeyboard();
  const [isFocused, setIsFocused] = useState<boolean>(
    () => focusCurrent() === focusId,
  );

  useEffect(() => {
    return subscribeFocus(() => {
      setIsFocused(focusCurrent() === focusId);
    });
  }, [focusId, focusCurrent, subscribeFocus]);

  return isFocused;
}
````

## File: src/screen/provider.tsx
````typescript
import React, { useReducer, useMemo, useEffect, ReactNode } from 'react';
import { ScreenSystemContext } from './context.js';
import {
  ScreenState,
  ScreenAction,
  SkipOptions,
  SkipFn,
  BackFn,
  GotoScreenFn,
  OverlayFn,
  CloseOverlayFn,
} from './types.js';
import {
  getTemplate,
  hasComponent,
  isChildOf,
  getParent,
} from './registry.js';



let _dispatch: React.Dispatch<ScreenAction> | null = null;

/**
 * Navigate down the tree to a direct child of the current screen.
 *
 * @param component  The target child component (must be a registered child
 *                   of the current screen).
 * @param params     Props to merge with the component's registered template.
 * @param options    Optional navigation options.
 *
 * @throws If the provider is not mounted or the target is not a child of
 *         the current screen.
 */
export function skip<C extends React.ComponentType<any>>(
  component: C,
  params: React.ComponentProps<C>,
  options?: SkipOptions,
): void {
  if (!_dispatch) {
    throw new Error(
      '[Ink-Trc] skip() 调用时 Provider 尚未挂载。请确保 <ScenarioManagementProvider> 已挂载到组件树。',
    );
  }
  if (!hasComponent(component)) {
    throw new Error(
      `[Ink-Trc] 组件 "${component.displayName || component.name || 'anonymous'}" 未注册。请先调用 registerComponent()。`,
    );
  }
  // 模块级 skip 不做编译时树校验，运行时 reducer 中校验
  _dispatch({
    type: 'skip',
    component,
    params: params as Record<string, unknown>,
    onlyAttribute: options?.onlyAttribute ?? false,
  });
}

/**
 * Navigate up the tree to the parent of the current screen.
 *
 * @throws If the provider is not mounted or the current screen is the root.
 */
export function back(): void {
  if (!_dispatch) {
    throw new Error(
      '[Ink-Trc] back() 调用时 Provider 尚未挂载。',
    );
  }
  _dispatch({ type: 'back' });
}

/**
 * Jump to any registered screen across branches of the tree.
 *
 * The path is rebuilt by finding the closest common ancestor between the
 * current screen and the target, then walking down from that ancestor.
 *
 * @param component  The target component (must be registered).
 * @param params     Props to merge with the component's registered template.
 *
 * @throws If the provider is not mounted or the component is not registered.
 */
export function gotoScreen<C extends React.ComponentType<any>>(
  component: C,
  params: React.ComponentProps<C>,
): void {
  if (!_dispatch) {
    throw new Error(
      '[Ink-Trc] gotoScreen() 调用时 Provider 尚未挂载。',
    );
  }
  if (!hasComponent(component)) {
    throw new Error(
      `[Ink-Trc] 组件 "${component.displayName || component.name || 'anonymous'}" 未注册。请先调用 registerComponent()。`,
    );
  }
  _dispatch({
    type: 'gotoScreen',
    component,
    params: params as Record<string, unknown>,
  });
}

/**
 * Open a floating overlay on top of the current screen stack.
 *
 * The overlay renders independently of the tree navigation. Only one overlay
 * may be active at a time. Opening a new overlay replaces the previous one.
 *
 * @param component  The overlay component (must be registered).
 * @param params     Props to merge with the component's registered template.
 *
 * @throws If the provider is not mounted or the component is not registered.
 */
export function overlay<C extends React.ComponentType<any>>(
  component: C,
  params: React.ComponentProps<C>,
): void {
  if (!_dispatch) {
    throw new Error(
      '[Ink-Trc] overlay() 调用时 Provider 尚未挂载。',
    );
  }
  if (!hasComponent(component)) {
    throw new Error(
      `[Ink-Trc] 组件 "${component.displayName || component.name || 'anonymous'}" 未注册。请先调用 registerComponent()。`,
    );
  }
  _dispatch({
    type: 'overlay',
    component,
    params: params as Record<string, unknown>,
  });
}

/**
 * Close the currently active overlay.
 *
 * @throws If the provider is not mounted.
 */
export function closeOverlay(): void {
  if (!_dispatch) {
    throw new Error(
      '[Ink-Trc] closeOverlay() 调用时 Provider 尚未挂载。',
    );
  }
  _dispatch({ type: 'closeOverlay' });
}



/**
 * 从树中查找共同祖先
 * 从 currentPath 栈底向上找到第一个在 targetAncestors 中的节点
 */
function findCommonAncestor(
  currentPath: React.ComponentType<any>[],
  target: React.ComponentType<any>,
): React.ComponentType<any> {
  // 收集目标及其所有祖先
  const targetAncestors = new Set<React.ComponentType<any>>();
  let node: React.ComponentType<any> | null | undefined = target;
  while (node) {
    targetAncestors.add(node);
    node = getParent(node);
  }

  // 从 path 底部向上查找第一个共同祖先
  for (let i = currentPath.length - 1; i >= 0; i--) {
    if (targetAncestors.has(currentPath[i])) {
      return currentPath[i];
    }
  }

  throw new Error(
    `[Ink-Trc] 无法找到共同祖先。目标组件可能不在同一棵树中。`,
  );
}

/**
 * 构建从祖先到目标节点的路径（不含祖先本身）
 */
function buildPathFrom(
  ancestor: React.ComponentType<any>,
  target: React.ComponentType<any>,
): React.ComponentType<any>[] {
  const path: React.ComponentType<any>[] = [];
  let node: React.ComponentType<any> | null | undefined = target;
  while (node && node !== ancestor) {
    path.push(node);
    node = getParent(node);
  }
  if (!node) {
    throw new Error(
      `[Ink-Trc] 目标组件不是祖先的后代。`,
    );
  }
  // 现在 path 是 [target, ..., ancestor.child]，反转得到 [ancestor.child, ..., target]
  path.reverse();
  return path;
}

function screenReducer(state: ScreenState, action: ScreenAction): ScreenState {
  switch (action.type) {

    case 'skip': {
      const current = state.path[state.path.length - 1];

      // 校验：目标组件必须是当前节点的子节点
      if (!isChildOf(action.component, current)) {
        throw new Error(
          `[Ink-Trc] "${action.component.displayName || action.component.name || 'anonymous'}" 不是 "${current.displayName || current.name || 'anonymous'}" 的子节点。请用 skip 沿树向下导航，或用 gotoScreen 跨分支跳转。`,
        );
      }

      const sameComponent = action.component === current;
      const counter = sameComponent && action.onlyAttribute
        ? state.counter
        : state.counter + 1;

      const template = getTemplate(action.component) ?? {};
      const mergedParams = { ...template, ...action.params };

      return {
        path: [...state.path, action.component],
        pathParams: [...state.pathParams, mergedParams],
        overlay: null,
        counter,
      };
    }

    case 'back': {
      if (state.path.length <= 1) {
        throw new Error(
          '[Ink-Trc] back() 失败：已在根节点，无法继续返回。',
        );
      }

      return {
        path: state.path.slice(0, -1),
        pathParams: state.pathParams.slice(0, -1),
        overlay: null,
        counter: state.counter + 1,
      };
    }

    case 'gotoScreen': {
      const commonAncestor = findCommonAncestor(state.path, action.component);
      const ancestorIndex = state.path.indexOf(commonAncestor);

      if (ancestorIndex === -1) {
        throw new Error(
          `[Ink-Trc] gotoScreen 失败：无法定位共同祖先。`,
        );
      }

      const suffix = buildPathFrom(commonAncestor, action.component);
      const newPath = [
        ...state.path.slice(0, ancestorIndex + 1),
        ...suffix,
      ];

      const template = getTemplate(action.component) ?? {};
      const mergedParams = { ...template, ...action.params };

      // 为新路径的每个新节点生成参数（使用模板兜底）
      const newPathParams = [
        ...state.pathParams.slice(0, ancestorIndex + 1),
        ...suffix.map((comp) => {
          const tpl = getTemplate(comp) ?? {};
          return comp === action.component ? mergedParams : tpl;
        }),
      ];

      return {
        path: newPath,
        pathParams: newPathParams,
        overlay: null,
        counter: state.counter + 1,
      };
    }

    case 'overlay': {
      const template = getTemplate(action.component) ?? {};
      const mergedParams = { ...template, ...action.params };

      return {
        ...state,
        overlay: {
          component: action.component,
          params: mergedParams,
        },
        counter: state.counter,
      };
    }

    case 'closeOverlay': {
      return {
        ...state,
        overlay: null,
        counter: state.counter,
      };
    }

    default:
      return state;
  }
}



export interface ScenarioManagementProviderProps {
  children: ReactNode;
  /** 默认屏幕组件（必填，需先 registerComponent） */
  defaultScreen: React.ComponentType<any>;
  /** 默认参数（可选，未传则使用注册时的模板参数） */
  defaultParams?: Record<string, unknown>;
}

/**
 * Screen-management context provider.
 *
 * Wraps the application and enables tree-based screen navigation, overlays,
 * and module-level navigation functions (`skip`, `back`, `gotoScreen`,
 * `overlay`, `closeOverlay`).
 *
 * @param defaultScreen  The root screen component (must be registered).
 * @param defaultParams  Optional initial props for the root screen.
 *
 * @throws If `defaultScreen` has not been registered via
 *         {@link registerComponent}.
 */
export function ScenarioManagementProvider({
  children,
  defaultScreen,
  defaultParams,
}: ScenarioManagementProviderProps) {
  if (!hasComponent(defaultScreen)) {
    throw new Error(
      `[Ink-Trc] defaultScreen "${defaultScreen.displayName || defaultScreen.name || 'anonymous'}" 未注册。请先调用 registerComponent()。`,
    );
  }

  const initialParams =
    defaultParams ?? getTemplate(defaultScreen) ?? {};

  const [state, dispatch] = useReducer(screenReducer, {
    path: [defaultScreen],
    pathParams: [initialParams],
    overlay: null,
    counter: 0,
  });

  // 注入模块级 dispatch
  useEffect(() => {
    _dispatch = dispatch;
    return () => {
      _dispatch = null;
    };
  }, []);

  // 当前栈顶组件 & 参数
  const topComponent = state.path[state.path.length - 1];
  const topParams = state.pathParams[state.pathParams.length - 1];

  // 渲染当前屏幕元素
  const currentScreen = useMemo(
    () =>
      React.createElement(topComponent, {
        ...topParams,
        key: state.counter,
      }),
    [topComponent, topParams, state.counter],
  );

  // 渲染 overlay 元素
  const currentOverlay = useMemo(
    () =>
      state.overlay
        ? React.createElement(state.overlay.component, {
          ...state.overlay.params,
          key: `overlay-${state.counter}`,
        })
        : null,
    [state.overlay, state.counter],
  );

  // Context 内的导航方法
  const skipInContext: SkipFn = useMemo(
    () => (component, params, options) => {
      if (!hasComponent(component)) {
        throw new Error(
          `[Ink-Trc] 组件 "${component.displayName || component.name || 'anonymous'}" 未注册。`,
        );
      }
      dispatch({
        type: 'skip',
        component,
        params: params as Record<string, unknown>,
        onlyAttribute: options?.onlyAttribute ?? false,
      });
    },
    [],
  );

  const backInContext: BackFn = useMemo(
    () => () => dispatch({ type: 'back' }),
    [],
  );

  const gotoScreenInContext: GotoScreenFn = useMemo(
    () => (component, params) => {
      if (!hasComponent(component)) {
        throw new Error(
          `[Ink-Trc] 组件 "${component.displayName || component.name || 'anonymous'}" 未注册。`,
        );
      }
      dispatch({
        type: 'gotoScreen',
        component,
        params: params as Record<string, unknown>,
      });
    },
    [],
  );

  const overlayInContext: OverlayFn = useMemo(
    () => (component, params) => {
      if (!hasComponent(component)) {
        throw new Error(
          `[Ink-Trc] 组件 "${component.displayName || component.name || 'anonymous'}" 未注册。`,
        );
      }
      dispatch({
        type: 'overlay',
        component,
        params: params as Record<string, unknown>,
      });
    },
    [],
  );

  const closeOverlayInContext: CloseOverlayFn = useMemo(
    () => () => dispatch({ type: 'closeOverlay' }),
    [],
  );

  const value = useMemo(
    () => ({
      currentScreen,
      currentOverlay,
      currentPath: state.path,
      skip: skipInContext,
      back: backInContext,
      gotoScreen: gotoScreenInContext,
      overlay: overlayInContext,
      closeOverlay: closeOverlayInContext,
    }),
    [
      currentScreen,
      currentOverlay,
      state.path,
      skipInContext,
      backInContext,
      gotoScreenInContext,
      overlayInContext,
      closeOverlayInContext,
    ],
  );

  return (
    <ScreenSystemContext.Provider value={value}>
      {children}
    </ScreenSystemContext.Provider>
  );
}
````

## File: src/screen/README.md
````markdown
# Screen Management System

`ink-kit` provides a tree-based screen navigation system with **tree walking**, **cross-branch jumping**, and **overlay** support, allowing you to manage terminal UI screens like pages.

---

## Quick Start

```tsx
import React from 'react';
import { Box, Text, render } from 'ink';
import {
  registerComponent,
  ScenarioManagementProvider,
  CurrentScreen,
  useScreenSystem,
} from '@baigao_h/ink-kit';

// 1. Register screen components
function Menu() {
  const { skip } = useScreenSystem();
  return (
    <Box flexDirection="column">
      <Text>Main Menu</Text>
      <Text>Press S to start</Text>
    </Box>
  );
}
registerComponent(Menu, {});

function Game({ level }: { level: number }) {
  const { back } = useScreenSystem();
  return (
    <Box>
      <Text>Level {level}</Text>
      <Text>Press B to go back</Text>
    </Box>
  );
}
registerComponent(Game, { level: 1 }, { parent: Menu });

// 2. Wrap with Provider, render CurrentScreen
function App() {
  return <CurrentScreen />;
}

render(
  <ScenarioManagementProvider defaultScreen={Menu}>
    <App />
  </ScenarioManagementProvider>,
);
```

---

## Concept: Screen Tree

Screens form a **tree** via the `parent` option of `registerComponent`:

```
Menu (root)
├── Settings
├── GameLevel
│   ├── Combat
│   └── Inventory
└── QuitConfirm
```

 Operation    | Description                                                      |
 ------------ | ---------------------------------------------------------------- |
 `skip`       | Walk down the tree to a direct child                             |
 `back`       | Walk up the tree to the parent                                  |
 `gotoScreen` | Jump across branches (finds the nearest common ancestor, rebuilds the path) |
 `overlay`    | Open a floating overlay independent of the tree (path unchanged) |

---

## API Reference

### `registerComponent`

```tsx
registerComponent(component, template, options?);
```

Register a component as a screen node.

 Parameter | Type                                    | Description                            |
 --------- | --------------------------------------- | -------------------------------------- |
 component | `React.ComponentType`                   | The component itself, used as unique token |
 template  | `React.ComponentProps<C>`               | Default props                          |
 options   | `{ parent?: React.ComponentType }` | Optional parent to build the tree      |

**Examples**

```tsx
registerComponent(Menu, {});                              // root node
registerComponent(Game, { level: 1 }, { parent: Menu });  // child of Menu
```

**Note**: A component cannot be registered more than once. Duplicate registration throws an error.

---

### `ScenarioManagementProvider`

```tsx
<ScenarioManagementProvider
  defaultScreen={Menu}
  defaultParams={{}}
>
  {children}
</ScenarioManagementProvider>
```

Root context provider wrapping the entire application.

 Prop          | Type                        | Required | Description                                |
 ------------- | --------------------------- | -------- | ------------------------------------------ |
 defaultScreen | `React.ComponentType`       | Yes      | Default screen (must be registered)         |
 defaultParams | `Record<string, unknown>`   | No       | Initial props; falls back to the registered template |

**Validation**: Throws if `defaultScreen` is not registered.

---

### `CurrentScreen`

```tsx
<CurrentScreen />
```

Renders the current top-of-stack screen and any active overlay.

- No overlay: renders only the stack-top component.
- With overlay: the screen renders underneath, the overlay on top (wrapped in `<Box>`).

---

### `useScreenSystem`

```tsx
const {
  currentScreen,   // ReactNode — the currently rendered screen element
  currentOverlay,  // ReactNode | null — the current overlay element
  currentPath,     // React.ComponentType[] — path from root to stack top
  skip,            // SkipFn
  back,            // BackFn
  gotoScreen,      // GotoScreenFn
  overlay,         // OverlayFn
  closeOverlay,    // CloseOverlayFn
} = useScreenSystem();
```

React hook returning the screen system API.

**Must be used inside `<ScenarioManagementProvider>`**, otherwise throws an error.

---

### `skip`

```tsx
skip(component, params, options?);
```

Navigate down the tree to a **direct child**.

 Parameter | Type                            | Description                                      |
 --------- | ------------------------------- | ------------------------------------------------ |
 component | `React.ComponentType`           | Target component (must be a direct child of the current screen) |
 params    | `React.ComponentProps<C>`       | Props passed to the component (merged with template) |

**Validation**: Throws if the target is not a direct child of the current screen.

---

### `back`

```tsx
back();
```

Navigate up the tree to the parent.

**Validation**: Throws if called at the root node.

---

### `gotoScreen`

```tsx
gotoScreen(component, params);
```

Jump to any registered screen, even across branches.

```tsx
// From Combat (Menu → GameLevel → Combat) jump directly to Settings (Menu → Settings)
gotoScreen(Settings, { theme: 'light' });
```

Automatically finds the nearest common ancestor and rebuilds the path.

**Validation**: Throws if the component is not registered.

---

### `overlay`

```tsx
overlay(component, params);
```

Open a floating overlay on top of the screen stack.

```tsx
overlay(PauseMenu, { message: 'Paused' });
```

- Only one overlay can be active at a time; a new overlay replaces the previous one.
- The overlay does **not** modify `currentPath`.
- Performing `skip` / `back` / `gotoScreen` **automatically closes** the overlay.

---

### `closeOverlay`

```tsx
closeOverlay();
```

Close the currently active overlay.

---

### Module-Level Functions

`skip`, `back`, `gotoScreen`, `overlay`, and `closeOverlay` can also be used as **module-level imports** without a React component context.

```tsx
import { skip, back, gotoScreen, overlay, closeOverlay } from '@baigao_h/ink-kit';

// Use anywhere in .ts/.tsx files
skip(Game, { level: 5 });
```

**Note**: Module-level functions require `<ScenarioManagementProvider>` to be mounted. Calling them before the provider is mounted throws an error.

---

## Type Safety

All navigation functions are type-safe — `skip`, `gotoScreen`, and `overlay` automatically infer prop types from your component:

```tsx
// Ok — type checks
skip(Game, { level: 1 });

// Type error: Game has no `title` prop
skip(Game, { title: 'hello' });
//   ^^^^^  TypeScript error
```

---

## Common Errors

 Error Message                                                | Cause                                         |
 ------------------------------------------------------------ | --------------------------------------------- |
 Component "xxx" is not registered. Please call registerComponent() first. | The component was not registered via `registerComponent` |
 "xxx" is not a child of "yyy".                               | `skip` target is not a direct child of the current screen |
 back() failed: already at root node, cannot go back.          | `back` was called at the root                 |
 skip() called before Provider was mounted.                    | Module-level function called before the provider was mounted |
````

## File: src/index.ts
````typescript
// ── Screen System ──────────────────────────────────────────
export {
  registerComponent,
  ScenarioManagementProvider,
  CurrentScreen,
  skip,
  back,
  gotoScreen,
  overlay,
  closeOverlay,
  useScreenSystem,
} from "./screen/index.js";

export type {
  SkipOptions,
  SkipFn,
  BackFn,
  GotoScreenFn,
  OverlayFn,
  CloseOverlayFn,
  RegisterOptions,
  ScenarioManagementProviderProps,
} from "./screen/index.js";

// ── Keyboard System ────────────────────────────────────────
export { KeyboardProvider, useKeyboard } from "./keyboard/index.js";

export type {
  KeyHandler,
  BoundKeyboardOptions,
  BoundKeyEntry,
  ScreenKeyboardLayer,
  KeyboardProviderProps,
} from "./keyboard/index.js";

export type {
  BlockedKeyOptions,
  StopOptions,
  FocusTarget,
} from "./keyboard/index.js";
export { useFocusState } from "./keyboard/index.js";
````

## File: src/keyboard/types.ts
````typescript
import type { Key } from "ink";

/**
 * Keyboard callback, matching Ink's `useInput` signature.
 *
 * @param input  The raw character string (empty for special keys).
 * @param key    The key descriptor (booleans for special keys, modifiers).
 */
export type KeyHandler = (input: string, key: Key) => void;

/**
 * Options for {@link KeyboardContextValue.boundKeyboard}.
 */
export interface BoundKeyboardOptions {
  onlyThis?: boolean;
  /**
   * When `true`, the binding only activates when the owning screen is the
   * top of the stack and no overlay is open. Otherwise the binding is
   * ignored and the key continues to bubble down * Associate this binding with a named focus target on the current screen.
   *
   * Focus targets receive events only when they are the active target on
   * their screen layer. Multiple focus targets on the same screen are
   * navigated via Tab / Shift+Tab or programmatic `focusSet` / `focusNext`.
   *
   * When omitted, the binding is stored at the screen level and always
   * evaluated after the active focus target (if any).
   */
  focusId?: string;
}

/**
 * A single key-binding entry stored on a screen layer or focus target.
 */
export interface BoundKeyEntry {
  /** Normalized key names to match. */
  keys: string[];
  /** Handler to invoke on match. */
  handler: KeyHandler;
  /** Whether this binding requires the owner to be stack top. */
  onlyThis: boolean;
  /** The screen component that owns this binding. */
  owner: React.ComponentType<any>;
}

/**
 * Keyboard state for a single named focus target on a screen layer.
 *
 * Focus targets allow multiple form controls on the same screen to have
 * independent key bindings. Only the currently active target receives
 * events; inactive targets are skipped.
 */
export interface FocusTarget {
  /** Registered key bindings (evaluation order). */
  bindings: BoundKeyEntry[];
  /** Keys marked as transparent on this target (pass-through). */
  blockedKeys: string[];
  /** Keys stopped on this target (propagation barrier). */
  stoppedKeys: string[];
}

/**
 * Per-layer keyboard state: bindings, transparent keys, stop keys,
 * and focus targets.
 */
export interface ScreenKeyboardLayer {
  /** Registered screen-level key bindings (evaluation order). */
  bindings: BoundKeyEntry[];
  /** Keys marked as transparent at the screen level (pass-through). */
  blockedKeys: string[];
  /** Keys stopped at the screen level (propagation barrier). */
  stoppedKeys: string[];
  /** Keys from globalKeys that this layer has overridden. */
  globalKeyOverrides: Set<string>;

  /** Named focus targets on this layer. */
  focusTargets: Map<string, FocusTarget>;
  /** Registration order of focus target ids. */
  focusOrder: string[];
  /** The currently active focus target id, or null. */
  currentFocusId: string | null;
}

/**
 * Options for {@link KeyboardContextValue.stop} when stopping keys
 * within a specific focus target.
 */
export interface StopOptions {
  /** If provided, stops only within the named focus target. */
  focusId?: string;
}

/**
 * Options for {@link KeyboardContextValue.blockedKey} when marking keys
 * as transparent within a specific focus target.
 */
export interface BlockedKeyOptions {
  /** If provided, blocks only within the named focus target. */
  focusId?: string;
}

/**
 * A single global key definition.
 *
 * Global keys fire regardless of the screen stack (subject to
 * `category` whitelist and `affectOverlay` placement).
 */
export interface GlobalKeyEntry {
  /**
   * Key name(s) to match.
   *
   * Supports single string or array. Uses the same normalized key-name
   * format as `boundKeyboard` (`"s"`, `"ctrl+q"`, `"return"`, etc.).
   */
  key: string | string[];

  /** Callback to invoke when the key is pressed. */
  operate: () => void;

  /**
   * Whether screen components are allowed to override this global key
   * via `boundKeyboard`. Defaults to `true`.
   *
   * When `false`, calling `boundKeyboard` with the same key while the
   * current screen is in the global key's `category` whitelist will
   * throw a runtime error.
   */
  cover?: boolean;

  /**
   * Whether this global key fires before the overlay layer.
   *
   * - `false` (default): Overlay → global key → screen stack
   * - `true`:            Global key → overlay → screen stack
   */
  affectOverlay?: boolean;

  /**
   * Whitelist of screen components that may use this global key.
   *
   * - `"*"` or omitted: all screens
   * - `[]`: no screens (effectively disabled)
   * - `[Menu, Game]`: only when the stack top is exactly Menu or Game
   */
  category?: React.ComponentType<any>[] | "*";
}
````

## File: .github/workflows/ci.yml
````yaml
name: CI

on:
  push:
    branches: [main]
    tags:
      - 'v*'
  pull_request:
    branches: [main]
  release:
    types: [published]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [22, 24]  
    steps:
      - uses: actions/checkout@v5   
      - uses: actions/setup-node@v5 
        with:
          node-version: ${{ matrix.node-version }}
          cache: npm
      - run: npm ci
      - run: npm run build
      - run: npm test

  release:
    needs: test
    if: github.ref_type == 'tag'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5   
      - uses: actions/setup-node@v5
        with:
          node-version: 22          
          registry-url: https://registry.npmjs.org
          cache: npm
      - run: npm ci
      - run: npm run build

      # 幂等检查：如果该版本已在 npm 上发布，则跳过
      - name: Check if version exists on npm
        id: check
        run: |
          PKG_NAME=$(node -p "require('./package.json').name")
          PKG_VERSION=$(node -p "require('./package.json').version")
          if npm view "${PKG_NAME}@${PKG_VERSION}" version 2>/dev/null; then
            echo "exists=true" >> "$GITHUB_OUTPUT"
            echo "版本 ${PKG_VERSION} 已存在，跳过发布"
          else
            echo "exists=false" >> "$GITHUB_OUTPUT"
            echo "版本 ${PKG_VERSION} 尚未发布，继续"
          fi

      - name: Publish to npm
        if: steps.check.outputs.exists != 'true'
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
````

## File: src/keyboard/provider.tsx
````typescript
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { useInput, Key } from 'ink';
import { KeyboardContext } from './context.js';
import {
  KeyHandler,
  BoundKeyboardOptions,
  BoundKeyEntry,
  ScreenKeyboardLayer,
  GlobalKeyEntry,
  BlockedKeyOptions,
  StopOptions,
} from './types.js';
import { useScreenSystem } from '../screen/hook.js';

let _currentPath: React.ComponentType<any>[] = [];
let _currentOverlayComponent: React.ComponentType<any> | null = null;
let _globalKeys: GlobalKeyEntry[] = [];
let _focusSubscribers = new Set<() => void>();


/**
 * Convert an Ink `(input, key)` event into a list of possible key-name
 * strings for matching.
 *
 * For special keys (return, escape, arrows, etc.) it produces the base
 * name plus any modifier-prefixed variants.  For character keys it
 * produces the raw character and modifier combinations.
 *
 * Examples:
 *   press('s', { ctrl: true })  →  ["s", "ctrl+s"]
 *   press('',  { escape: true }) → ["escape"]
 *   press('',  { return: true, shift: true }) → ["return", "shift+return"]
 */
function normalizeKeyNames(input: string, key: Key): string[] {
  const names: string[] = [];

  const specialMap: Array<[keyof Key, string]> = [
    ['return', 'return'],
    ['escape', 'escape'],
    ['backspace', 'backspace'],
    ['delete', 'delete'],
    ['upArrow', 'up'],
    ['downArrow', 'down'],
    ['leftArrow', 'left'],
    ['rightArrow', 'right'],
    ['tab', 'tab'],
    ['pageDown', 'pagedown'],
    ['pageUp', 'pageup'],
    ['home', 'home'],
    ['end', 'end'],
  ];

  for (const [kProp, kName] of specialMap) {
    if (key[kProp]) {
      names.push(kName);
      if (key.ctrl) names.push(`ctrl+${kName}`);
      if (key.shift) names.push(`shift+${kName}`);
      if (key.meta) names.push(`meta+${kName}`);
      return names;
    }
  }

  if (input) {
    names.push(input);
    if (key.ctrl) names.push(`ctrl+${input}`);
    if (key.shift) names.push(`shift+${input}`);
    if (key.meta) names.push(`meta+${input}`);
    if (key.ctrl && key.shift) names.push(`ctrl+shift+${input}`);
  }

  return names;
}


function notifyFocusChange() {
  _focusSubscribers.forEach(fn => fn());
}



function checkGlobalKey(
  entry: GlobalKeyEntry,
  eventNames: string[],
  topComponent: React.ComponentType<any> | null,
  layersRef: React.MutableRefObject<Map<React.ComponentType<any>, ScreenKeyboardLayer>>,
): boolean {
  const keyNames = Array.isArray(entry.key) ? entry.key : [entry.key];
  if (!keyNames.some((k) => eventNames.includes(k))) return false;
  if (!topComponent) return false;

  const cat = entry.category;
  if (cat === undefined || cat === '*') {
  } else if (Array.isArray(cat) && cat.length === 0) {
    return false;
  } else if (Array.isArray(cat)) {
    if (!cat.includes(topComponent)) return false;
  }

  const topLayer = layersRef.current.get(topComponent);
  if (topLayer) {
    if (keyNames.some((k) => topLayer.globalKeyOverrides.has(k))) return false;
  }

  return true;
}

export interface KeyboardProviderProps {
  children: ReactNode;
}

/**
 * Keyboard context provider for layered key handling.
 *
 * Manages per-screen-layer key bindings, transparent keys (`blockedKey`),
 * key-stop propagation barriers (`stop`), and global keys (`globalKeys`).
 * Handles the full event priority chain:
 *   1. Global keys with `affectOverlay: true`
 *   2. Active overlay layer
 *   3. Global keys with `affectOverlay: false` (default)
 *   4. Screen stack (top → bottom)
 *   5. Drop unhandled keys
 *
 * Must be nested inside a {@link ScenarioManagementProvider} so that the
 * current screen path is available for layer management.
 */
export function KeyboardProvider({ children }: KeyboardProviderProps) {
  const { currentPath, currentOverlay } = useScreenSystem();

  _currentPath = currentPath;

  _currentOverlayComponent = currentOverlay
    ? (currentOverlay as React.ReactElement).type as React.ComponentType<any>
    : null;

  const layersRef = useRef<
    Map<
      React.ComponentType<any>,
      ScreenKeyboardLayer
    >
  >(new Map());

  const prevPathRef = useRef<React.ComponentType<any>[]>([]);

  // 覆盖层是独立的
  const prevOverlayRef = useRef<React.ComponentType<any> | null>(null);


  useEffect(() => {
    const prev = prevPathRef.current;
    for (const comp of prev) {
      if (!currentPath.includes(comp)) {
        layersRef.current.delete(comp);
      }
    }
    prevPathRef.current = currentPath;
  }, [currentPath]);

  // Fix: 添加覆盖层的清理逻辑
  useEffect(() => {
    if (prevOverlayRef.current && !currentOverlay) {
      layersRef.current.delete(prevOverlayRef.current); 
    }
    prevOverlayRef.current = currentOverlay
      ? (currentOverlay as React.ReactElement).type as React.ComponentType<any>
      : null;
  }, [currentOverlay])

  const getLayer = useCallback(
    (owner: React.ComponentType<any>) => {
      let layer = layersRef.current.get(owner);
      if (!layer) {
        layer = {
          bindings: [],
          blockedKeys: [],
          stoppedKeys: [],
          globalKeyOverrides: new Set(),
          focusTargets: new Map(),
          focusOrder: [],
          currentFocusId: null,
        };
        layersRef.current.set(owner, layer);
      }
      return layer;
    },
    [],
  );

  /**
   * Bind keys on the current (top-of-stack) screen component.
   *
   * The owner is automatically set to the current top-of-stack component.
   * Returns an unbind function for cleanup.
   */
  const boundKeyboard = useCallback(
    (
      keys: string[],
      handler: KeyHandler,
      options?: BoundKeyboardOptions,
    ): (() => void) => {
      const path = _currentPath;
      if (path.length === 0) {
        throw new Error(
          '[Ink-Trc] boundKeyboard() 必须在屏幕组件内调用。当前无活跃屏幕。',
        );
      }
      const owner = _currentOverlayComponent || path[path.length - 1];
      const layer = getLayer(owner);


      if (options?.focusId) {
        const fid = options.focusId;
        let target = layer.focusTargets.get(fid);
        if (!target) {
          target = { bindings: [], blockedKeys: [], stoppedKeys: [] };
          layer.focusTargets.set(fid, target);
          layer.focusOrder.push(fid);
          // 第一个注册的焦点目标自动激活
          if (layer.currentFocusId === null) {
            layer.currentFocusId = fid;
            notifyFocusChange();
          }
        }


        for (const gk of _globalKeys) {
          const gkKeys = Array.isArray(gk.key) ? gk.key : [gk.key];
          const matchingKeys = gkKeys.filter((k) => keys.includes(k));
          if (matchingKeys.length === 0) continue;

          const cat = gk.category;
          let inCategory = false;
          if (cat === undefined || cat === '*') {
            inCategory = true;
          } else if (Array.isArray(cat)) {
            inCategory = cat.includes(owner);
          }
          if (!inCategory) continue;

          const cover = gk.cover ?? true;
          if (!cover) {
            throw new Error(
              `[Ink-Trc] 组件 "${owner.displayName || owner.name || 'anonymous'}" ` +
              `通过 focusId="${fid}" 尝试绑定了 "${matchingKeys[0]}"，` +
              `但该键已被 globalKeys 声明且 cover: false，不允许覆盖。`,
            );
          }

          for (const k of matchingKeys) {
            layer.globalKeyOverrides.add(k);
          }


        }

        const entry: BoundKeyEntry = {
          keys,
          handler,
          onlyThis: options?.onlyThis ?? false,
          owner,
        };
        target.bindings.push(entry);

        return () => {
          const idx = target!.bindings.indexOf(entry);
          if (idx !== -1) target!.bindings.splice(idx, 1);

          for (const k of entry.keys) {
            const stillBound =
              layer.bindings.some(b => b.keys.includes(k)) ||
              [...layer.focusTargets.values()].some(ft =>
                ft.bindings.some(b => b.keys.includes(k))
              );
            if (!stillBound) {
              layer.globalKeyOverrides.delete(k);
            }
          }
        };


      }


      // 为了向后兼容所以这里保持原有逻辑也就是没加焦点之前的逻辑
      for (const gk of _globalKeys) {
        const gkKeys = Array.isArray(gk.key) ? gk.key : [gk.key];
        const matchingKeys = gkKeys.filter((k) => keys.includes(k));
        if (matchingKeys.length === 0) continue;

        const cat = gk.category;
        let inCategory = false;
        if (cat === undefined || cat === '*') {
          inCategory = true;
        } else if (Array.isArray(cat)) {
          inCategory = cat.includes(owner);
        }

        if (!inCategory) continue;

        const cover = gk.cover ?? true;
        if (!cover) {
          throw new Error(
            `[Ink-Trc] 组件 "${owner.displayName || owner.name || 'anonymous'}" 尝试通过 boundKeyboard 绑定 "${matchingKeys[0]}"，但该键已被 globalKeys 声明且 cover: false，不允许覆盖。`,
          );
        }

        for (const k of matchingKeys) {
          layer.globalKeyOverrides.add(k);
        }
      }

      const entry: BoundKeyEntry = {
        keys,
        handler,
        onlyThis: options?.onlyThis ?? false,
        owner,
      };

      layer.bindings.push(entry);

      return () => {
        const idx = layer.bindings.indexOf(entry);
        if (idx !== -1) {
          layer.bindings.splice(idx, 1);
        }

        // 检查是否需要把全局键给剔除
        for (const k of entry.keys) {
          const stillBound =
            layer.bindings.some(b => b.keys.includes(k)) ||
            [...layer.focusTargets.values()].some(ft =>
              ft.bindings.some(b => b.keys.includes(k))
            );
          if (!stillBound) {
            layer.globalKeyOverrides.delete(k);
          }
        }
      };
    },
    [getLayer],
  );

  /**
   * Mark keys as transparent on the current layer.
   *
   * When a transparent key reaches this layer, the layer's own bindings
   * are skipped and the key propagates to the next layer below.
   */
  const penetration = useCallback(
    (keys: string[], options?: BlockedKeyOptions) => {
      const path = _currentPath;
      if (path.length === 0) {
        throw new Error('[Ink-Trc] blockedKey() 必须在屏幕组件内调用。');
      }
      const owner = _currentOverlayComponent || path[path.length - 1];
      const layer = getLayer(owner);

      if (options?.focusId) {
        // Focus 级 blockedKey
        let target = layer.focusTargets.get(options.focusId);
        if (!target) {
          target = { bindings: [], blockedKeys: [], stoppedKeys: [] };
          layer.focusTargets.set(options.focusId, target);
          layer.focusOrder.push(options.focusId);
          if (layer.currentFocusId === null) {
            layer.currentFocusId = options.focusId;
            notifyFocusChange();
          }
        }
        for (const k of keys) {
          if (!target.blockedKeys.includes(k)) {
            target.blockedKeys.push(k);
          }
        }
      } else {
        // 向后兼容
        for (const k of keys) {
          if (!layer.blockedKeys.includes(k)) {
            layer.blockedKeys.push(k);
          }
        }
      }
    },
    [getLayer],
  );

  /**
   * Prevent keys from propagating beyond the current (top-of-stack) layer.
   *
   * The layer's own bindings are evaluated first — only if no binding
   * matches does the stop take effect, consuming the key so that lower
   * layers never see it. The returned unstop function removes the keys.
   */
  const stop = useCallback(
    (keys: string[], options?: StopOptions): (() => void) => {
      const path = _currentPath;
      if (path.length === 0) {
        throw new Error('[Ink-Trc] stop() 必须在屏幕组件内调用。');
      }
      const owner = _currentOverlayComponent || path[path.length - 1];
      const layer = getLayer(owner);

      if (options?.focusId) {
        // Focus 级 stop
        let target = layer.focusTargets.get(options.focusId);
        if (!target) {
          target = { bindings: [], blockedKeys: [], stoppedKeys: [] };
          layer.focusTargets.set(options.focusId, target);
          layer.focusOrder.push(options.focusId);
          if (layer.currentFocusId === null) {
            layer.currentFocusId = options.focusId;
            notifyFocusChange();
          }
        }
        const added: string[] = [];
        for (const k of keys) {
          if (!target.stoppedKeys.includes(k)) {
            target.stoppedKeys.push(k);
            added.push(k);
          }
        }
        return () => {
          for (const k of added) {
            const idx = target!.stoppedKeys.indexOf(k);
            if (idx !== -1) target!.stoppedKeys.splice(idx, 1);
          }
        };
      } else {
        // 之前的stop逻辑，为了向后兼容得以保留
        const added: string[] = [];
        for (const k of keys) {
          if (!layer.stoppedKeys.includes(k)) {
            layer.stoppedKeys.push(k);
            added.push(k);
          }
        }
        return () => {
          for (const k of added) {
            const idx = layer.stoppedKeys.indexOf(k);
            if (idx !== -1) layer.stoppedKeys.splice(idx, 1);
          }
        };
      }
    },
    [getLayer],
  );


  const subscribeFocus = useCallback((listener: () => void) => {
    _focusSubscribers.add(listener);
    return () => { _focusSubscribers.delete(listener); };
  }, []);

  const focusSet = useCallback(
    (focusId: string) => {
      const path = _currentPath;
      if (path.length === 0) return;
      const owner = _currentOverlayComponent || path[path.length - 1];
      const layer = layersRef.current.get(owner);
      if (!layer || !layer.focusTargets.has(focusId)) return;
      if (layer.currentFocusId !== focusId) {
        layer.currentFocusId = focusId;
        notifyFocusChange();
      }
    },
    [],
  );

  const focusNext = useCallback(() => {
    const path = _currentPath;
    if (path.length === 0) return;
    const owner = _currentOverlayComponent || path[path.length - 1];
    const layer = layersRef.current.get(owner);
    if (!layer || layer.focusOrder.length === 0) return;

    const current = layer.currentFocusId;
    let idx = current ? layer.focusOrder.indexOf(current) : -1;
    idx = (idx + 1) % layer.focusOrder.length;
    layer.currentFocusId = layer.focusOrder[idx];
    notifyFocusChange();
  }, []);

  const focusPrev = useCallback(() => {
    const path = _currentPath;
    if (path.length === 0) return;
    const owner = _currentOverlayComponent || path[path.length - 1];
    const layer = layersRef.current.get(owner);
    if (!layer || layer.focusOrder.length === 0) return;

    const current = layer.currentFocusId;
    let idx = current ? layer.focusOrder.indexOf(current) : -1;
    idx = idx <= 0 ? layer.focusOrder.length - 1 : idx - 1;
    layer.currentFocusId = layer.focusOrder[idx];
    notifyFocusChange();
  }, []);

  const focusCurrent = useCallback((): string | null => {
    const path = _currentPath;
    if (path.length === 0) return null;
    const owner = _currentOverlayComponent || path[path.length - 1];
    const layer = layersRef.current.get(owner);
    return layer?.currentFocusId ?? null;
  }, []);

  const focusUnregister = useCallback((focusId: string) => {
    const path = _currentPath;
    if (path.length === 0) return;
    const owner = _currentOverlayComponent || path[path.length - 1];
    const layer = layersRef.current.get(owner);
    if (!layer) return;

    const wasFocused = layer.currentFocusId === focusId;
    layer.focusTargets.delete(focusId);
    layer.focusOrder = layer.focusOrder.filter(id => id !== focusId);

    if (wasFocused) {
      layer.currentFocusId =
        layer.focusOrder.length > 0 ? layer.focusOrder[0] : null;
      notifyFocusChange();
    }
  }, []);

  /**
   * Register global key bindings.
   *
   * Global keys fire independently of the screen stack (subject to
   * `category` whitelist and `affectOverlay` placement).
   *
   * Calling this replaces any previously registered global keys.
   */
  const globalKeys = useCallback(
    (entries: GlobalKeyEntry[]) => {
      _globalKeys = entries;
    },
    [],
  );

  const value = useMemo(
    () => ({
      boundKeyboard,
      penetration,
      stop,
      globalKeys,
      focusSet,
      focusNext,
      focusPrev,
      focusCurrent,
      focusUnregister,
      subscribeFocus,
    }),
    [
      boundKeyboard,
      penetration,
      stop,
      globalKeys,
      focusSet,
      focusNext,
      focusPrev,
      focusCurrent,
      focusUnregister,
      subscribeFocus,
    ],
  );

  useInput((input, key) => {
    const eventNames = normalizeKeyNames(input, key);
    const path = _currentPath;
    const topComponent = path.length > 0 ? path[path.length - 1] : null;
    const overlayComp = _currentOverlayComponent;


    for (const entry of _globalKeys) {
      if (!entry.affectOverlay) continue;
      if (checkGlobalKey(entry, eventNames, topComponent, layersRef)) {
        entry.operate();
        return;
      }
    }


    if (overlayComp) {
      const overlayLayer = layersRef.current.get(overlayComp);
      if (overlayLayer) {
        // 内置tab导航
        if (
          eventNames.includes('tab') &&
          overlayLayer.focusOrder.length > 0
        ) {
          const shift = key.shift;
          const current = overlayLayer.currentFocusId;
          let idx = current ? overlayLayer.focusOrder.indexOf(current) : -1;
          if (shift) {
            idx = idx <= 0 ? overlayLayer.focusOrder.length - 1 : idx - 1;
          } else {
            idx = (idx + 1) % overlayLayer.focusOrder.length;
          }
          overlayLayer.currentFocusId = overlayLayer.focusOrder[idx];
          notifyFocusChange();
          return;
        }

        const blocked = overlayLayer.blockedKeys;
        const unblocked = eventNames.filter((n) => !blocked.includes(n));


        const focusId = overlayLayer.currentFocusId;
        if (focusId) {
          const ft = overlayLayer.focusTargets.get(focusId);
          if (ft) {
            const fBlocked = ft.blockedKeys;
            const fUnblocked = unblocked.filter((n) => !fBlocked.includes(n));

            if (fUnblocked.length > 0) {
              for (const binding of ft.bindings) {
                if (binding.keys.some((k) => fUnblocked.includes(k))) {
                  binding.handler(input, key);
                  return;
                }
              }
            }

            if (eventNames.some((n) => ft.stoppedKeys.includes(n))) {
              return;
            }
          }
        }


        if (unblocked.length > 0) {
          for (const binding of overlayLayer.bindings) {
            if (binding.keys.some((k) => unblocked.includes(k))) {
              binding.handler(input, key);
              return;
            }
          }
        }

        if (eventNames.some((n) => overlayLayer.stoppedKeys.includes(n))) {
          return;
        }
      }
    }


    for (const entry of _globalKeys) {
      if (entry.affectOverlay) continue;
      if (checkGlobalKey(entry, eventNames, topComponent, layersRef)) {
        entry.operate();
        return;
      }
    }


    for (let i = path.length - 1; i >= 0; i--) {
      const comp = path[i];
      const layer = layersRef.current.get(comp);
      if (!layer) continue;
      const isTop = i === path.length - 1;

      if (isTop) {
        // tab键就是导航
        if (
          eventNames.includes('tab') &&
          layer.focusOrder.length > 0
        ) {
          const shift = key.shift;
          const current = layer.currentFocusId;
          let idx = current ? layer.focusOrder.indexOf(current) : -1;
          if (shift) {
            idx = idx <= 0 ? layer.focusOrder.length - 1 : idx - 1;
          } else {
            idx = (idx + 1) % layer.focusOrder.length;
          }
          layer.currentFocusId = layer.focusOrder[idx];
          notifyFocusChange();
          return;
        }
      }

      const blocked = layer.blockedKeys;
      const unblocked = eventNames.filter((n) => !blocked.includes(n));

      if (isTop && layer.currentFocusId) {
        const ft = layer.focusTargets.get(layer.currentFocusId);
        if (ft) {
          const fBlocked = ft.blockedKeys;
          const fUnblocked = unblocked.filter((n) => !fBlocked.includes(n));

          if (fUnblocked.length > 0) {
            for (const binding of ft.bindings) {
              if (
                binding.onlyThis &&
                _currentOverlayComponent !== null
              )
                continue;

              if (binding.keys.some((k) => fUnblocked.includes(k))) {
                binding.handler(input, key);
                return;
              }
            }
          }

          if (eventNames.some((n) => ft.stoppedKeys.includes(n))) {
            return;
          }
        }
      }

      if (unblocked.length > 0) {
        for (const binding of layer.bindings) {
          if (
            binding.onlyThis &&
            (i !== path.length - 1 || _currentOverlayComponent !== null)
          )
            continue;

          if (binding.keys.some((k) => unblocked.includes(k))) {
            binding.handler(input, key);
            return;
          }
        }
      }

      if (isTop && eventNames.some((n) => layer.stoppedKeys.includes(n))) {
        return;
      }
    }
  });

  return (
    <KeyboardContext.Provider value={value}>
      {children}
    </KeyboardContext.Provider>
  );
}
````

## File: README.md
````markdown
## ink-kit

> Ready-to-use Ink components and tools for building terminal UI applications.

[![CI](https://github.com/BAIGAOa/ink-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/BAIGAOa/ink-trc/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@baigao_h/ink-kit.svg)](https://www.npmjs.com/package/@baigao_h/ink-kit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Install

```bash
npm install @baigao_h/ink-kit
```

### Requirements

| Dependency | Minimum Version |
| ---------- | --------------- |
| Node.js    | 20              |
| ink        | 5               |
| react      | 18              |

---

## Design Philosophy

ink-kit aims to make **screen management** and **keyboard event handling** in Ink applications composable, maintainable, and type-safe.

### Screen as Component

In ink-kit, **every React component is a "screen"**. Register them into a **screen tree** via `registerComponent`, then navigate the tree with `skip` / `back` / `gotoScreen`. This design makes screen navigation predictable and eliminates the chaos of hand-written conditional rendering (`if-else` / `switch`).

### Layered Keyboard Events

No more global `useInput` cluttered with `if-else` chains. ink-kit's keyboard system maintains **per-screen-layer** key bindings. Events bubble from **top to bottom** through the stack, with three key mechanisms:

- **Blocked Key (blockedKey)** — Let a key pass through the current layer to be handled below
- **Stop (stop)** — Prevent a key from propagating to layers below
- **Global Key (globalKeys)** — Shortcuts independent of the screen stack

### Module-Level Functions

Navigation functions (`skip`, `back`, `gotoScreen`, etc.) work both inside React components (via hooks) and as **module-level imports** in any `.ts` / `.tsx` file. This allows non-UI layers — game engines, state managers, etc. — to trigger screen transitions.

### Type Safety

Every API provides full TypeScript type inference. Functions like `skip`, `gotoScreen`, and `overlay` automatically infer parameter types from your component's props, catching errors at compile time.

---

## ⚠️ Important: Component Nesting Order

`KeyboardProvider` **must** be nested inside `ScenarioManagementProvider`, because it depends on the screen context to obtain the current screen stack.

```tsx
{/* ❌ Wrong: KeyboardProvider outside screen context */}
<KeyboardProvider>
  <ScenarioManagementProvider defaultScreen={Menu}>
    ...
  </ScenarioManagementProvider>
</KeyboardProvider>

{/* ✅ Correct: KeyboardProvider inside screen context */}
<ScenarioManagementProvider defaultScreen={Menu}>
  <KeyboardProvider>
    ...
  </KeyboardProvider>
</ScenarioManagementProvider>
```

> The screen system can be used independently without `KeyboardProvider`; but the keyboard system requires the screen context.

---

## Documentation

- **[Screen Management System](src/screen/README.md)** — `registerComponent`, `ScenarioManagementProvider`, `CurrentScreen`, `useScreenSystem`, `skip` / `back` / `gotoScreen` / `overlay` / `closeOverlay`
- **[Keyboard System](src/keyboard/README.md)** — `KeyboardProvider`, `useKeyboard`, `boundKeyboard`, `blockedKey`, `stop`, `globalKeys`

---

## Quick Overview

```tsx
import React, { useEffect } from 'react';
import { Box, Text, render } from 'ink';
import {
  registerComponent,
  ScenarioManagementProvider,
  CurrentScreen,
  useScreenSystem,
  KeyboardProvider,
  useKeyboard,
} from '@baigao_h/ink-kit';

// ── Register screens ──
function Menu() {
  const { skip } = useScreenSystem();
  const { boundKeyboard } = useKeyboard();
  useEffect(() => {
    boundKeyboard(['s'], () => skip(Game, { level: 1 }));
  }, []);
  return (
    <Box>
      <Text>Main Menu — Press S to start</Text>
    </Box>
  );
}
registerComponent(Menu, {});

function Game({ level }: { level: number }) {
  const { back } = useScreenSystem();
  const { boundKeyboard } = useKeyboard();
  useEffect(() => {
    boundKeyboard(['b'], () => back());
  }, []);
  return (
    <Box>
      <Text>Level {level} — Press B to go back</Text>
    </Box>
  );
}
registerComponent(Game, { level: 1 }, { parent: Menu });

// ── Wire up ──
function App() {
  return (
    <KeyboardProvider>
      <CurrentScreen />
    </KeyboardProvider>
  );
}

render(
  <ScenarioManagementProvider defaultScreen={Menu}>
    <App />
  </ScenarioManagementProvider>,
);
```

---
## More

Because this is a special custom lightweight library that cannot be adapted to most components that rely on useInput, more components will be deeply integrated into this system in the future.


## License

[MIT](LICENSE)
````

## File: package.json
````json
{
    "name": "@baigao_h/ink-kit",
    "version": "0.3.4",
    "description": "Ready-to-use Ink components and screen management system for building terminal UIs.",
    "type": "module",
    "main": "./dist/index.js",
    "types": "./dist/index.d.ts",
    "exports": {
        ".": {
            "types": "./dist/index.d.ts",
            "import": "./dist/index.js"
        }
    },
    "files": [
        "dist",
        "README.md",
        "LICENSE"
    ],
    "repository": {
        "type": "git",
        "url": "git+https://github.com/BAIGAOa/ink-router-kit.git"
    },
    "scripts": {
        "build": "tsc --locale zh-CN",
        "watch": "tsc --watch --locale zh-CN",
        "clean": "rm -rf dist",
        "test": "vitest run",
        "test:watch": "vitest"
    },
    "keywords": [
        "ink",
        "ink-component",
        "react",
        "tui",
        "cli",
        "terminal",
        "screen-management"
    ],
    "author": "BAIGAO",
    "license": "MIT",
    "engines": {
        "node": ">=22"
    },
    "peerDependencies": {
        "ink": ">=5",
        "react": ">=18"
    },
    "devDependencies": {
        "@testing-library/react": "^16.3.0",
        "@types/node": "^20.19.39",
        "@types/react": "^19.2.14",
        "ink": "^7.0.1",
        "jsdom": "^26.0.0",
        "react": "^19.2.4",
        "typescript": "^5.9.3",
        "vitest": "^4.1.5"
    },
    "bugs": {
        "url": "https://github.com/BAIGAOa/ink-router-kit/issues"
    },
    "homepage": "https://github.com/BAIGAOa/ink-router-kit#readme"
}
````
