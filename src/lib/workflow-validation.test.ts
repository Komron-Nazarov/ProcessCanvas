import { describe, expect, it } from "vitest";
import { getWorkflowTemplates } from "@/data/workflow-templates";
import { validateWorkflow } from "./workflow-validation";

describe("workflow validation and templates", () => {
  it.each(["ru", "en"] as const)("ships three valid %s templates", (locale) => {
    const templates = getWorkflowTemplates(locale);
    expect(templates).toHaveLength(3);
    for (const template of templates) {
      const result = validateWorkflow(template.nodes, template.edges);
      expect(result.issues, template.id).toEqual([]);
    }
  });

  it("finds missing branches and unreachable nodes", () => {
    const template = getWorkflowTemplates("en")[1];
    const edges = template.edges.filter((edge) => edge.sourceHandle !== "no");
    const result = validateWorkflow(template.nodes, edges);
    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.code === "condition_branches")).toBe(true);
    expect(result.issues.some((issue) => issue.code === "unreachable")).toBe(true);
  });
});
