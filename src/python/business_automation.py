from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from enum import Enum


class TaskStatus(Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    DONE = "done"


@dataclass(frozen=True)
class InventoryItem:
    sku: str
    name: str
    category: str
    quantity: int
    unit_cost: Decimal

    @property
    def total_cost(self) -> Decimal:
        return self.unit_cost * self.quantity


@dataclass(frozen=True)
class OperationTask:
    title: str
    department: str
    due_date: date
    priority: int
    status: TaskStatus = TaskStatus.OPEN

    @property
    def is_urgent(self) -> bool:
        return self.priority >= 8 and self.status != TaskStatus.DONE


class BusinessAutomation:
    def inventory_value_by_category(self, items: list[InventoryItem]) -> dict[str, Decimal]:
        totals: dict[str, Decimal] = {}

        for item in items:
            totals[item.category] = totals.get(item.category, Decimal("0")) + item.total_cost

        return totals

    def low_stock_items(self, items: list[InventoryItem], minimum_quantity: int = 5) -> list[InventoryItem]:
        return [item for item in items if item.quantity <= minimum_quantity]

    def urgent_tasks(self, tasks: list[OperationTask]) -> list[OperationTask]:
        return sorted(
            [task for task in tasks if task.is_urgent],
            key=lambda task: (task.due_date, -task.priority),
        )

    def task_summary_by_department(self, tasks: list[OperationTask]) -> dict[str, dict[str, int]]:
        summary: dict[str, dict[str, int]] = {}

        for task in tasks:
            department = summary.setdefault(
                task.department,
                {"open": 0, "in_progress": 0, "done": 0},
            )
            department[task.status.value] += 1

        return summary


if __name__ == "__main__":
    automation = BusinessAutomation()
    inventory = [
        InventoryItem("FOOD-001", "Rice", "Food", 12, Decimal("24.90")),
        InventoryItem("FOOD-002", "Coffee", "Food", 4, Decimal("18.50")),
        InventoryItem("HOME-001", "Cleaner", "Home", 5, Decimal("12.00")),
    ]

    print(automation.inventory_value_by_category(inventory))
    print([item.name for item in automation.low_stock_items(inventory)])

