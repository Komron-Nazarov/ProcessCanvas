import { beforeEach, describe, expect, it } from "vitest";
import { clearServerDraft, loadServerDraft, saveServerDraft } from "./server-draft";

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
  clear() { this.values.clear(); }
}

describe("offline server draft", () => {
  beforeEach(() => { Object.defineProperty(globalThis, "localStorage", { value: new MemoryStorage(), configurable: true }); });

  it("saves, restores and clears a versioned draft", () => {
    saveServerDraft({ processId: "p1", expectedVersion: 4, name: "Offline", nodes: [], edges: [] });
    expect(loadServerDraft()).toMatchObject({ version: 1, processId: "p1", expectedVersion: 4, name: "Offline" });
    clearServerDraft();
    expect(loadServerDraft()).toBeNull();
  });

  it("ignores incompatible legacy data", () => {
    localStorage.setItem("processcanvas:server-draft", JSON.stringify({ version: 99, processId: "p1" }));
    expect(loadServerDraft()).toBeNull();
  });
});
