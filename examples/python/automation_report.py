from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True)
class Sale:
    product: str
    category: str
    quantity: int
    unit_price: Decimal

    @property
    def total(self) -> Decimal:
        return self.unit_price * self.quantity


def summarize_sales(sales: list[Sale]) -> dict[str, Decimal]:
    totals: dict[str, Decimal] = {}

    for sale in sales:
        totals[sale.category] = totals.get(sale.category, Decimal("0")) + sale.total

    return totals


if __name__ == "__main__":
    sample_sales = [
        Sale("Rice", "Food", 12, Decimal("24.90")),
        Sale("Coffee", "Food", 8, Decimal("18.50")),
        Sale("Cleaner", "Home", 5, Decimal("12.00")),
    ]

    for category, total in summarize_sales(sample_sales).items():
        print(f"{category}: R$ {total:.2f}")

