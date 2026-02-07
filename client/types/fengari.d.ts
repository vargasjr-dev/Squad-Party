// Type declarations for fengari (Lua interpreter for JavaScript)
// https://github.com/AverageHelper/fengari-types

declare module "fengari" {
  export function to_luastring(str: string): Uint8Array;
  export function to_jsstring(luaString: Uint8Array): string;

  export const lua: {
    LUA_OK: number;
    LUA_TNIL: number;
    LUA_TBOOLEAN: number;
    LUA_TNUMBER: number;
    LUA_TSTRING: number;
    LUA_TTABLE: number;
    LUA_TFUNCTION: number;

    lua_getglobal(L: LuaState, name: Uint8Array): number;
    lua_getfield(L: LuaState, index: number, name: Uint8Array): number;
    lua_setfield(L: LuaState, index: number, name: Uint8Array): void;
    lua_settable(L: LuaState, index: number): void;
    lua_gettable(L: LuaState, index: number): number;

    lua_pushnil(L: LuaState): void;
    lua_pushboolean(L: LuaState, b: number): void;
    lua_pushnumber(L: LuaState, n: number): void;
    lua_pushstring(L: LuaState, s: Uint8Array): void;
    lua_newtable(L: LuaState): void;

    lua_toboolean(L: LuaState, index: number): number;
    lua_tonumber(L: LuaState, index: number): number;
    lua_tojsstring(L: LuaState, index: number): string;

    lua_type(L: LuaState, index: number): number;
    lua_isnil(L: LuaState, index: number): boolean;
    lua_isfunction(L: LuaState, index: number): boolean;

    lua_pop(L: LuaState, n: number): void;
    lua_remove(L: LuaState, index: number): void;
    lua_pcall(
      L: LuaState,
      nargs: number,
      nresults: number,
      msgh: number,
    ): number;
    lua_next(L: LuaState, index: number): number;
    lua_close(L: LuaState): void;
  };

  export const lauxlib: {
    luaL_newstate(): LuaState;
    luaL_dostring(L: LuaState, s: Uint8Array): number;
    luaL_loadstring(L: LuaState, s: Uint8Array): number;
  };

  export const lualib: {
    luaL_openlibs(L: LuaState): void;
  };

  // Opaque type for Lua state
  export interface LuaState {
    readonly __brand: unique symbol;
  }
}
