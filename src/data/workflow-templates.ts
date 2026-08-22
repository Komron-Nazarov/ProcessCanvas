import { createDemoWorkflow } from "@/data/demo-workflow";
import type { Locale } from "@/i18n/types";
import type { WorkflowEdge, WorkflowNode } from "@/types/workflow";

export type WorkflowTemplate = { id: string; name: string; description: string; nodes: WorkflowNode[]; edges: WorkflowEdge[] };
const edge = (id: string, source: string, target: string, sourceHandle?: "yes" | "no", label?: string): WorkflowEdge => ({ id, source, target, sourceHandle, label, type: "smoothstep" });

export function getWorkflowTemplates(locale: Locale): WorkflowTemplate[] {
  const ru = locale === "ru"; const purchase = createDemoWorkflow(locale);
  const leaveNodes: WorkflowNode[] = [
    { id: "leave-start", type: "start", position: { x: 30, y: 170 }, data: { label: ru ? "Запрос создан" : "Request created", description: ru ? "Сотрудник запрашивает отпуск" : "Employee requests leave", assignee: "", duration: "" } },
    { id: "leave-check", type: "task", position: { x: 270, y: 170 }, data: { label: ru ? "Проверить даты" : "Check dates", description: ru ? "Проверить остаток дней и замещение" : "Check allowance and coverage", assignee: ru ? "HR" : "HR", duration: ru ? "2 часа" : "2 hours" } },
    { id: "leave-approve", type: "approval", position: { x: 520, y: 170 }, data: { label: ru ? "Решение руководителя" : "Manager decision", description: ru ? "Согласовать отсутствие" : "Approve the absence", assignee: ru ? "Руководитель" : "Manager", duration: ru ? "1 день" : "1 day" } },
    { id: "leave-condition", type: "condition", position: { x: 790, y: 160 }, data: { label: ru ? "Одобрено?" : "Approved?", description: ru ? "Зафиксировать результат" : "Record the decision", assignee: "", duration: "" } },
    { id: "leave-record", type: "task", position: { x: 1050, y: 70 }, data: { label: ru ? "Оформить отпуск" : "Record leave", description: ru ? "Обновить календарь и уведомить команду" : "Update calendar and notify team", assignee: "HR", duration: ru ? "1 час" : "1 hour" } },
    { id: "leave-rework", type: "task", position: { x: 1050, y: 280 }, data: { label: ru ? "Уточнить запрос" : "Revise request", description: ru ? "Предложить другие даты" : "Suggest alternative dates", assignee: ru ? "Сотрудник" : "Employee", duration: ru ? "1 день" : "1 day" } },
    { id: "leave-end", type: "end", position: { x: 1320, y: 170 }, data: { label: ru ? "Запрос завершён" : "Request completed", description: ru ? "Результат сохранён" : "Decision recorded", assignee: "", duration: "" } },
  ];
  const onboardingNodes: WorkflowNode[] = [
    { id: "hire-start", type: "start", position: { x: 30, y: 180 }, data: { label: ru ? "Кандидат принят" : "Candidate accepted", description: ru ? "Офер подтверждён" : "Offer accepted", assignee: "", duration: "" } },
    { id: "hire-docs", type: "task", position: { x: 280, y: 180 }, data: { label: ru ? "Собрать документы" : "Collect documents", description: ru ? "Подготовить кадровые документы" : "Prepare employment documents", assignee: "HR", duration: ru ? "1 день" : "1 day" } },
    { id: "hire-access", type: "task", position: { x: 540, y: 80 }, data: { label: ru ? "Создать доступы" : "Create access", description: ru ? "Почта и рабочие системы" : "Email and work systems", assignee: "IT", duration: ru ? "4 часа" : "4 hours" } },
    { id: "hire-place", type: "task", position: { x: 540, y: 290 }, data: { label: ru ? "Подготовить место" : "Prepare workplace", description: ru ? "Оборудование и пропуск" : "Equipment and badge", assignee: ru ? "Офис" : "Office", duration: ru ? "1 день" : "1 day" } },
    { id: "hire-brief", type: "approval", position: { x: 820, y: 180 }, data: { label: ru ? "План адаптации" : "Onboarding plan", description: ru ? "Подтвердить задачи первой недели" : "Approve first-week plan", assignee: ru ? "Руководитель" : "Manager", duration: ru ? "2 часа" : "2 hours" } },
    { id: "hire-end", type: "end", position: { x: 1090, y: 180 }, data: { label: ru ? "Первый день готов" : "Ready for day one", description: ru ? "Сотрудник может начать работу" : "Employee can start", assignee: "", duration: "" } },
  ];
  return [
    { id: "purchase", name: purchase.name, description: ru ? "Заявка, согласования по лимиту и завершение закупки." : "Request, threshold approvals and purchase completion.", nodes: purchase.nodes, edges: purchase.edges },
    { id: "leave", name: ru ? "Оформление отпуска" : "Leave request", description: ru ? "Проверка дат, решение руководителя и фиксация результата." : "Date review, manager decision and recorded result.", nodes: leaveNodes, edges: [edge("l1", "leave-start", "leave-check"), edge("l2", "leave-check", "leave-approve"), edge("l3", "leave-approve", "leave-condition"), edge("l4", "leave-condition", "leave-record", "yes", ru ? "Да" : "Yes"), edge("l5", "leave-condition", "leave-rework", "no", ru ? "Нет" : "No"), edge("l6", "leave-record", "leave-end"), edge("l7", "leave-rework", "leave-end")] },
    { id: "onboarding", name: ru ? "Приём нового сотрудника" : "Employee onboarding", description: ru ? "Документы, доступы, рабочее место и план адаптации." : "Documents, access, workplace and onboarding plan.", nodes: onboardingNodes, edges: [edge("h1", "hire-start", "hire-docs"), edge("h2", "hire-docs", "hire-access"), edge("h3", "hire-docs", "hire-place"), edge("h4", "hire-access", "hire-brief"), edge("h5", "hire-place", "hire-brief"), edge("h6", "hire-brief", "hire-end")] },
  ];
}
