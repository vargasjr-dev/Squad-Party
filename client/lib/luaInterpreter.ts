import * as fengari from "fengari";

const { lua, lauxlib, lualib } = fengari;

export interface GameState {
  score: number;
  timeRemaining: number;
  currentChallenge: string;
  currentAnswer: string;
  isPlaying: boolean;
  wrongGuesses: number;
  maxWrongGuesses: number;
  hints: string[];
  [key: string]: any;
}

export interface LuaGameInterface {
  init: () => GameState;
  start: (state: GameState) => GameState;
  onInput: (
    state: GameState,
    input: string,
  ) => { state: GameState; correct: boolean; points: number };
  getNextChallenge: (state: GameState) => GameState;
  getHint?: (state: GameState) => string;
}

export class LuaInterpreter {
  private L: any;
  private initialized = false;

  constructor() {
    this.L = lauxlib.luaL_newstate();
    lualib.luaL_openlibs(this.L);
  }

  loadScript(luaCode: string): boolean {
    try {
      const status = lauxlib.luaL_dostring(
        this.L,
        fengari.to_luastring(luaCode),
      );
      if (status !== lua.LUA_OK) {
        const errorMsg = lua.lua_tojsstring(this.L, -1);
        console.error("Lua load error:", errorMsg);
        lua.lua_pop(this.L, 1);
        return false;
      }
      this.initialized = true;
      return true;
    } catch (error) {
      console.error("Lua execution error:", error);
      return false;
    }
  }

  callFunction(funcPath: string, ...args: any[]): any {
    if (!this.initialized) {
      console.error("Lua not initialized");
      return null;
    }

    try {
      const parts = funcPath.split(".");

      lua.lua_getglobal(this.L, fengari.to_luastring(parts[0]));

      for (let i = 1; i < parts.length; i++) {
        if (lua.lua_isnil(this.L, -1)) {
          console.error(`Lua: ${parts.slice(0, i).join(".")} is nil`);
          lua.lua_pop(this.L, 1);
          return null;
        }
        lua.lua_getfield(this.L, -1, fengari.to_luastring(parts[i]));
        lua.lua_remove(this.L, -2);
      }

      if (!lua.lua_isfunction(this.L, -1)) {
        console.error(`Lua: ${funcPath} is not a function`);
        lua.lua_pop(this.L, 1);
        return null;
      }

      for (const arg of args) {
        this.pushValue(arg);
      }

      const status = lua.lua_pcall(this.L, args.length, 1, 0);
      if (status !== lua.LUA_OK) {
        const errorMsg = lua.lua_tojsstring(this.L, -1);
        console.error("Lua call error:", errorMsg);
        lua.lua_pop(this.L, 1);
        return null;
      }

      const result = this.getValue(-1);
      lua.lua_pop(this.L, 1);
      return result;
    } catch (error) {
      console.error("Lua call exception:", error);
      return null;
    }
  }

  private pushValue(value: any): void {
    if (value === null || value === undefined) {
      lua.lua_pushnil(this.L);
    } else if (typeof value === "boolean") {
      lua.lua_pushboolean(this.L, value ? 1 : 0);
    } else if (typeof value === "number") {
      lua.lua_pushnumber(this.L, value);
    } else if (typeof value === "string") {
      lua.lua_pushstring(this.L, fengari.to_luastring(value));
    } else if (typeof value === "object") {
      lua.lua_newtable(this.L);
      for (const [k, v] of Object.entries(value)) {
        lua.lua_pushstring(this.L, fengari.to_luastring(k));
        this.pushValue(v);
        lua.lua_settable(this.L, -3);
      }
    }
  }

  private getValue(index: number): any {
    const type = lua.lua_type(this.L, index);

    switch (type) {
      case lua.LUA_TNIL:
        return null;
      case lua.LUA_TBOOLEAN:
        return lua.lua_toboolean(this.L, index) !== 0;
      case lua.LUA_TNUMBER:
        return lua.lua_tonumber(this.L, index);
      case lua.LUA_TSTRING:
        return lua.lua_tojsstring(this.L, index);
      case lua.LUA_TTABLE:
        return this.getTable(index);
      default:
        return null;
    }
  }

  private getTable(index: number): any {
    const result: any = {};
    let isArray = true;
    let arrayIndex = 1;

    lua.lua_pushnil(this.L);
    while (lua.lua_next(this.L, index < 0 ? index - 1 : index) !== 0) {
      const keyType = lua.lua_type(this.L, -2);
      let key: string | number;

      if (keyType === lua.LUA_TNUMBER) {
        key = lua.lua_tonumber(this.L, -2);
        if (key !== arrayIndex) {
          isArray = false;
        }
        arrayIndex++;
      } else {
        key = lua.lua_tojsstring(this.L, -2);
        isArray = false;
      }

      result[key] = this.getValue(-1);
      lua.lua_pop(this.L, 1);
    }

    if (isArray && Object.keys(result).length > 0) {
      return Object.values(result);
    }
    return result;
  }

  destroy(): void {
    if (this.L) {
      lua.lua_close(this.L);
      this.L = null;
    }
  }
}

export function createGameRunner(luaCode: string): LuaGameInterface | null {
  const interpreter = new LuaInterpreter();

  if (!interpreter.loadScript(luaCode)) {
    interpreter.destroy();
    return null;
  }

  return {
    init: () => {
      const result = interpreter.callFunction("Game.init");
      return result || getDefaultState();
    },
    start: (state: GameState) => {
      const result = interpreter.callFunction("Game.start", state);
      return result || state;
    },
    onInput: (state: GameState, input: string) => {
      const result = interpreter.callFunction("Game.onInput", state, input);
      if (result && typeof result === "object") {
        return {
          state: result.state || result,
          correct: result.correct ?? false,
          points: result.points ?? 0,
        };
      }
      return { state, correct: false, points: 0 };
    },
    getNextChallenge: (state: GameState) => {
      const result = interpreter.callFunction("Game.getNextChallenge", state);
      return result || state;
    },
    getHint: (state: GameState) => {
      const result = interpreter.callFunction("Game.getHint", state);
      return typeof result === "string" ? result : "";
    },
  };
}

function getDefaultState(): GameState {
  return {
    score: 0,
    timeRemaining: 60,
    currentChallenge: "",
    currentAnswer: "",
    isPlaying: false,
    wrongGuesses: 0,
    maxWrongGuesses: 6,
    hints: [],
  };
}
