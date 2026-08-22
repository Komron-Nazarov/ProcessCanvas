import { describe, expect, it } from "vitest";
import { getWorkflowTemplates } from "@/data/workflow-templates";
import { createWorkflowFile, parseWorkflowFile, serializeWorkflowFile, workflowFilename } from "./workflow-file";

describe("workflow files", () => {
  it("round-trips a versioned workflow and strips selection state", () => {
    const template = getWorkflowTemplates("ru")[1];
    const source = serializeWorkflowFile(template.name, template.nodes.map((node) => ({ ...node, selected: true })), template.edges, "2026-08-22T00:00:00.000Z");
    const parsed = parseWorkflowFile(source);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.workflow.name).toBe(template.name);
    expect(parsed.value.workflow.nodes).toHaveLength(template.nodes.length);
    expect(parsed.value.workflow.nodes[0].selected).toBeUndefined();
  });

  it.each([
    ["not-json", "invalid_json"],
    [JSON.stringify({ format: "processcanvas", version: 99 }), "unsupported_version"],
    [JSON.stringify({ format: "other", version: 1 }), "invalid_structure"],
  ])("rejects an unsafe input", (source, error) => {
    expect(parseWorkflowFile(source)).toEqual({ ok: false, error });
  });

  it("rejects edges that point outside the imported workflow", () => {
    const template = getWorkflowTemplates("en")[0];
    const file = createWorkflowFile(template.name, template.nodes, [{ id: "bad", source: template.nodes[0].id, target: "missing" }]);
    expect(parseWorkflowFile(JSON.stringify(file))).toEqual({ ok: false, error: "invalid_structure" });
  });

  it("creates a safe filename", () => {
    expect(workflowFilename("  Отпуск / 2026  ")).toBe("отпуск-2026.processcanvas.json");
  });
});
