from __future__ import annotations

import argparse
import sqlite3
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from pathlib import Path


DATABASE_PATH = Path(__file__).with_name("market.db")


@dataclass(frozen=True)
class Product:
    id: int
    name: str
    category: str
    price: Decimal
    quantity: int
    minimum_quantity: int


def connect() -> sqlite3.Connection:
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database() -> None:
    with connect() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                price TEXT NOT NULL,
                quantity INTEGER NOT NULL DEFAULT 0,
                minimum_quantity INTEGER NOT NULL DEFAULT 5
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS sales (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL,
                total TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (product_id) REFERENCES products (id)
            )
            """
        )


def add_product(name: str, category: str, price: Decimal, quantity: int, minimum_quantity: int) -> None:
    with connect() as connection:
        connection.execute(
            """
            INSERT INTO products (name, category, price, quantity, minimum_quantity)
            VALUES (?, ?, ?, ?, ?)
            """,
            (name, category, str(price), quantity, minimum_quantity),
        )


def list_products() -> list[Product]:
    with connect() as connection:
        rows = connection.execute(
            """
            SELECT id, name, category, price, quantity, minimum_quantity
            FROM products
            ORDER BY category, name
            """
        ).fetchall()

    return [
        Product(
            id=row["id"],
            name=row["name"],
            category=row["category"],
            price=Decimal(row["price"]),
            quantity=row["quantity"],
            minimum_quantity=row["minimum_quantity"],
        )
        for row in rows
    ]


def register_sale(product_id: int, quantity: int) -> Decimal:
    with connect() as connection:
        row = connection.execute(
            "SELECT id, name, price, quantity FROM products WHERE id = ?",
            (product_id,),
        ).fetchone()

        if row is None:
            raise ValueError("Product not found.")

        current_quantity = row["quantity"]
        if quantity <= 0:
            raise ValueError("Sale quantity must be greater than zero.")
        if current_quantity < quantity:
            raise ValueError(f"Not enough stock. Available quantity: {current_quantity}.")

        total = Decimal(row["price"]) * quantity
        connection.execute(
            "UPDATE products SET quantity = quantity - ? WHERE id = ?",
            (quantity, product_id),
        )
        connection.execute(
            """
            INSERT INTO sales (product_id, quantity, total, created_at)
            VALUES (?, ?, ?, ?)
            """,
            (product_id, quantity, str(total), datetime.now().isoformat(timespec="seconds")),
        )

    return total


def low_stock_products() -> list[Product]:
    return [product for product in list_products() if product.quantity <= product.minimum_quantity]


def sales_summary() -> list[sqlite3.Row]:
    with connect() as connection:
        return connection.execute(
            """
            SELECT
                products.category,
                COUNT(sales.id) AS sales_count,
                SUM(sales.quantity) AS units_sold,
                SUM(CAST(sales.total AS REAL)) AS revenue
            FROM sales
            JOIN products ON products.id = sales.product_id
            GROUP BY products.category
            ORDER BY revenue DESC
            """
        ).fetchall()


def seed_database() -> None:
    if list_products():
        return

    add_product("Rice 5kg", "Food", Decimal("24.90"), 20, 5)
    add_product("Coffee 500g", "Food", Decimal("18.50"), 10, 4)
    add_product("Beans 1kg", "Food", Decimal("8.90"), 18, 6)
    add_product("Cleaner", "Home", Decimal("12.00"), 6, 3)
    add_product("Soap", "Home", Decimal("3.50"), 30, 8)


def print_products(products: list[Product]) -> None:
    if not products:
        print("No products found.")
        return

    for product in products:
        print(
            f"{product.id:>2} | {product.name:<18} | {product.category:<10} | "
            f"R$ {product.price:>7.2f} | stock: {product.quantity:>3} | min: {product.minimum_quantity}"
        )


def print_summary() -> None:
    rows = sales_summary()
    if not rows:
        print("No sales registered yet.")
        return

    for row in rows:
        revenue = Decimal(str(row["revenue"] or 0))
        print(
            f"{row['category']:<10} | sales: {row['sales_count']:>3} | "
            f"units: {row['units_sold']:>3} | revenue: R$ {revenue:.2f}"
        )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Market automation system with SQLite.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("init", help="Create database tables.")
    subparsers.add_parser("seed", help="Insert sample products.")
    subparsers.add_parser("list", help="List registered products.")
    subparsers.add_parser("low-stock", help="List products below minimum stock.")
    subparsers.add_parser("summary", help="Show sales summary by category.")

    add = subparsers.add_parser("add-product", help="Register a new product.")
    add.add_argument("name")
    add.add_argument("category")
    add.add_argument("price", type=Decimal)
    add.add_argument("quantity", type=int)
    add.add_argument("--minimum", type=int, default=5)

    sale = subparsers.add_parser("sell", help="Register a sale and update stock.")
    sale.add_argument("product_id", type=int)
    sale.add_argument("quantity", type=int)

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    initialize_database()

    if args.command == "init":
        print(f"Database ready: {DATABASE_PATH}")
    elif args.command == "seed":
        seed_database()
        print("Sample products ready.")
    elif args.command == "list":
        print_products(list_products())
    elif args.command == "low-stock":
        print_products(low_stock_products())
    elif args.command == "summary":
        print_summary()
    elif args.command == "add-product":
        add_product(args.name, args.category, args.price, args.quantity, args.minimum)
        print("Product added.")
    elif args.command == "sell":
        total = register_sale(args.product_id, args.quantity)
        print(f"Sale registered. Total: R$ {total:.2f}")


if __name__ == "__main__":
    main()

