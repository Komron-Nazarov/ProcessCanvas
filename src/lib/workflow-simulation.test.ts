import { describe, expect, it } from "vitest";
import { getWorkflowTemplates } from "@/data/workflow-templates";
import { nextSimulationNode } from "./workflow-simulation";

describe("workflow simulation", () => {
  it("follows ordinary and condition branches", () => {
    const template = getWorkflowTemplates("en")[1];
    expect(nextSimulationNode("leave-start", template.edges)).toBe("leave-check");
    expect(nextSimulationNode("leave-condition", template.edges, "yes")).toBe("leave-record");
    expect(nextSimulationNode("leave-condition", template.edges, "no")).toBe("leave-rework");
  });

  it("stops safely when no route exists", () => {
    expect(nextSimulationNode("missing", [])).toBeNull();
  });
});
