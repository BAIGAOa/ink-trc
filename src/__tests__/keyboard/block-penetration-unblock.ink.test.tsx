import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from 'ink-testing-library';
import React, { useEffect } from 'react';
import { Text } from 'ink';
import { registerComponent, clearRegistry } from '../../screen/registry.js';
import { ScenarioManagementProvider } from '../../screen/provider.js';
import { CurrentScreen } from '../../screen/current-screen.js';
import { KeyboardProvider, clearShortcutOperations } from '../../keyboard/provider.js';
import { useKeyboard } from '../../keyboard/hook.js';
import { useScreenSystem } from '../../screen/hook.js';


async function flush() {
  await new Promise((r) => setTimeout(r, 10));
}

async function press(
  stdin: { write: (data: string) => void },
  key: string,
) {
  stdin.write(key);
  await new Promise((r) => setTimeout(r, 10));
}



function renderKeyboardApi() {
  const kbRef: { current: ReturnType<typeof useKeyboard> | null } = {
    current: null,
  };

  function Host() {
    const kb = useKeyboard();
    useEffect(() => {
      kbRef.current = kb;
    }, [kb]);
    return <Text>API</Text>;
  }
  Host.displayName = 'ApiHost';

  clearRegistry();
  registerComponent(Host, {});

  const { stdin, unmount } = render(
    <ScenarioManagementProvider defaultScreen={Host}>
      <KeyboardProvider>
        <CurrentScreen />
      </KeyboardProvider>
    </ScenarioManagementProvider>,
  );

  return { stdin, unmount, kbRef };
}



function renderScreenStack() {
  let unblockFromGame!: () => void;
  let gameKb!: ReturnType<typeof useKeyboard>;

  const menuHandler = vi.fn();
  const gameHandler = vi.fn();

  function Menu() {
    const sc = useScreenSystem();
    const kb = useKeyboard();
    useEffect(() => {
      kb.boundKeyboard(['s'], () => sc.skip(Game, {}));
      kb.boundKeyboard(['e'], menuHandler);
    }, []);
    return <Text>Menu</Text>;
  }
  Menu.displayName = 'Menu';

  function Game() {
    const sc = useScreenSystem();
    const kb = useKeyboard();
    useEffect(() => {
      gameKb = kb;
      kb.boundKeyboard(['b'], () => sc.back());
      kb.boundKeyboard(['e'], gameHandler);
      unblockFromGame = kb.blockedKey(['e']);
    }, []);
    return <Text>Game</Text>;
  }
  Game.displayName = 'Game';

  clearRegistry();
  registerComponent(Menu, {});
  registerComponent(Game, {}, { parent: Menu });

  const { lastFrame, stdin, unmount } = render(
    <ScenarioManagementProvider defaultScreen={Menu}>
      <KeyboardProvider>
        <CurrentScreen />
      </KeyboardProvider>
    </ScenarioManagementProvider>,
  );

  return {
    lastFrame: () => lastFrame(),
    stdin,
    unmount,
    menuHandler,
    gameHandler,
    unblock: () => unblockFromGame(),
    gameKbRef: () => gameKb,
  };
}

beforeEach(() => {
  clearRegistry();
  clearShortcutOperations();
});

afterEach(() => {
  vi.restoreAllMocks();
});



describe('blockedKey 解绑函数', () => {
  

  it('返回一个函数，多次调用不抛错', async () => {
    const { kbRef } = renderKeyboardApi();
    await flush();

    const unblock = kbRef.current!.blockedKey(['x']);
    expect(typeof unblock).toBe('function');

    expect(() => unblock()).not.toThrow();
    expect(() => unblock()).not.toThrow(); // 幂等
  });

  

  it('屏幕级屏蔽时穿透到下层，解绑后本层拦截', async () => {
    const { stdin, menuHandler, gameHandler, unblock, lastFrame } =
      renderScreenStack();

    // 进入 Game
    await press(stdin, 's');
    expect(lastFrame()).toContain('Game');

    // blocked 状态：按 e → Game 的绑定被穿透，Menu 的 handler 触发
    await press(stdin, 'e');
    expect(menuHandler).toHaveBeenCalledTimes(1);
    expect(gameHandler).not.toHaveBeenCalled();

    // 解绑
    menuHandler.mockClear();
    unblock();

    // 解绑后：按 e → Game 的绑定截获，Menu 不再触发
    await press(stdin, 'e');
    expect(gameHandler).toHaveBeenCalledTimes(1);
    expect(menuHandler).not.toHaveBeenCalled();
  });

  

  it('focus 级屏蔽穿透到屏幕级，解绑后 focus 级拦截', async () => {
    const screenHandler = vi.fn();
    const focusHandler = vi.fn();

    const { kbRef, stdin } = renderKeyboardApi();
    await flush();

    // 屏幕级兜底
    kbRef.current!.boundKeyboard(['e'], screenHandler);
    // focus 级绑定
    kbRef.current!.boundKeyboard(['e'], focusHandler, { focusId: 'inp' });
    // focus 级屏蔽
    const unblockFocus = kbRef.current!.blockedKey(['e'], { focusId: 'inp' });

    // 屏蔽状态：focus 绑定被跳过，冒泡到屏幕级
    await press(stdin, 'e');
    expect(screenHandler).toHaveBeenCalledTimes(1);
    expect(focusHandler).not.toHaveBeenCalled();

    // 解绑
    screenHandler.mockClear();
    unblockFocus();

    // 解绑后：focus 绑定恢复拦截
    await press(stdin, 'e');
    expect(focusHandler).toHaveBeenCalledTimes(1);
    expect(screenHandler).not.toHaveBeenCalled();
  });



  it('只移除指定键，同层其他 blockedKey 不受影响', async () => {
    const aHandler = vi.fn();
    const bHandler = vi.fn();
    const bottomHandler = vi.fn();

    const { kbRef, stdin } = renderKeyboardApi();
    await flush();

    // 屏幕级兜底（模拟下层）
    kbRef.current!.boundKeyboard(['a'], bottomHandler);
    kbRef.current!.boundKeyboard(['b'], bottomHandler);
    // 本层绑定
    kbRef.current!.boundKeyboard(['a'], aHandler);
    kbRef.current!.boundKeyboard(['b'], bHandler);
    // 屏蔽 a 和 b
    kbRef.current!.blockedKey(['a']);
    const unblockB = kbRef.current!.blockedKey(['b']);

    // 两个键都穿透到下层的 bottomHandler
    await press(stdin, 'a');
    await press(stdin, 'b');
    expect(bottomHandler).toHaveBeenCalledTimes(2);
    expect(aHandler).not.toHaveBeenCalled();
    expect(bHandler).not.toHaveBeenCalled();

    // 解绑 b
    bottomHandler.mockClear();
    unblockB();

    // a 仍然穿透，b 恢复到本层
    await press(stdin, 'a');
    expect(bottomHandler).toHaveBeenCalledTimes(1);
    expect(aHandler).not.toHaveBeenCalled();

    await press(stdin, 'b');
    expect(bHandler).toHaveBeenCalledTimes(1);
    expect(bottomHandler).toHaveBeenCalledTimes(1); // 不再增加
  });
});
