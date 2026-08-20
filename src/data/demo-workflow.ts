import type { Locale } from "@/i18n/types";
import type { Workflow, WorkflowNodeData, WorkflowNodeType } from "@/types/workflow";

const defaults: Record<Locale, Record<WorkflowNodeType, WorkflowNodeData>> = {
  ru: {
    start: { label: "Начало", description: "Точка запуска процесса", assignee: "", duration: "" },
    task: { label: "Новая задача", description: "Опишите ожидаемый результат", assignee: "Не назначен", duration: "1 день" },
    approval: { label: "Согласование", description: "Проверить и принять решение", assignee: "Руководитель", duration: "4 часа" },
    condition: { label: "Условие", description: "Выберите путь по заданному правилу", assignee: "", duration: "" },
    end: { label: "Завершение", description: "Процесс завершён", assignee: "", duration: "" },
  },
  en: {
    start: { label: "Start", description: "Entry point for this process", assignee: "", duration: "" },
    task: { label: "New task", description: "Describe the expected outcome", assignee: "Unassigned", duration: "1 day" },
    approval: { label: "Approval", description: "Review and make a decision", assignee: "Manager", duration: "4 hours" },
    condition: { label: "Condition", description: "Choose a path based on a rule", assignee: "", duration: "" },
    end: { label: "End", description: "Process completed", assignee: "", duration: "" },
  },
};

export function getNodeDefaults(locale: Locale, type: WorkflowNodeType): WorkflowNodeData {
  return { ...defaults[locale][type] };
}

export function createDemoWorkflow(locale: Locale): Workflow {
  const ru = locale === "ru";
  return {
    id: "purchase-approval",
    name: ru ? "Согласование закупки" : "Purchase approval",
    status: "draft",
    updatedAt: new Date().toISOString(),
    nodes: [
      { id: "start", type: "start", position: { x: 40, y: 190 }, data: { label: ru ? "Заявка получена" : "Request received", description: ru ? "Обнаружена потребность в закупке" : "A purchase need is identified", assignee: "", duration: "" } },
      { id: "create", type: "task", position: { x: 270, y: 190 }, data: { label: ru ? "Оформить заявку" : "Create purchase request", description: ru ? "Указать поставщика, позиции и обоснование" : "Add vendor, items and business reason", assignee: ru ? "Инициатор" : "Requester", duration: ru ? "30 минут" : "30 min" } },
      { id: "manager", type: "approval", position: { x: 540, y: 190 }, data: { label: ru ? "Согласование руководителя" : "Manager approval", description: ru ? "Проверить необходимость и доступный бюджет" : "Validate need and available budget", assignee: ru ? "Руководитель отдела" : "Department manager", duration: ru ? "4 часа" : "4 hours" } },
      { id: "limit", type: "condition", position: { x: 820, y: 180 }, data: { label: ru ? "Сумма выше лимита?" : "Amount above limit?", description: ru ? "Отправить заявки свыше 50 000 сомони директору" : "Route purchases above $5,000", assignee: "", duration: "" } },
      { id: "director", type: "approval", position: { x: 1090, y: 75 }, data: { label: ru ? "Согласование директора" : "Director approval", description: ru ? "Одобрить крупную закупку" : "Approve high-value purchase", assignee: ru ? "Финансовый директор" : "Finance director", duration: ru ? "1 день" : "1 day" } },
      { id: "approved", type: "task", position: { x: 1090, y: 300 }, data: { label: ru ? "Подтвердить одобрение" : "Mark as approved", description: ru ? "Уведомить инициатора и отдел закупок" : "Notify requester and procurement", assignee: ru ? "Отдел закупок" : "Procurement", duration: ru ? "15 минут" : "15 min" } },
      { id: "end", type: "end", position: { x: 1380, y: 190 }, data: { label: ru ? "Закупка согласована" : "Purchase approved", description: ru ? "Заявка готова к оформлению заказа" : "Request is ready for ordering", assignee: "", duration: "" } },
    ],
    edges: [
      { id: "e-start-create", source: "start", target: "create", type: "smoothstep" },
      { id: "e-create-manager", source: "create", target: "manager", type: "smoothstep" },
      { id: "e-manager-limit", source: "manager", target: "limit", type: "smoothstep" },
      { id: "e-limit-director", source: "limit", sourceHandle: "yes", target: "director", label: ru ? "Да" : "Yes", type: "smoothstep" },
      { id: "e-limit-approved", source: "limit", sourceHandle: "no", target: "approved", label: ru ? "Нет" : "No", type: "smoothstep" },
      { id: "e-director-end", source: "director", target: "end", type: "smoothstep" },
      { id: "e-approved-end", source: "approved", target: "end", type: "smoothstep" },
    ],
  };
}
