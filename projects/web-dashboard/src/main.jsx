import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const metrics = [
  { label: "Revenue", value: "R$ 8.420", change: "+12%", tone: "positive" },
  { label: "Orders", value: "184", change: "+18", tone: "positive" },
  { label: "Low stock", value: "7", change: "Needs action", tone: "warning" },
  { label: "Active projects", value: "4", change: "+1", tone: "neutral" },
];

const sales = [
  { category: "Food", revenue: 4820, units: 126 },
  { category: "Home", revenue: 2140, units: 54 },
  { category: "Cleaning", revenue: 1460, units: 38 },
];

const stockAlerts = [
  { product: "Coffee 500g", category: "Food", quantity: 4, minimum: 5 },
  { product: "Cleaner", category: "Home", quantity: 3, minimum: 4 },
  { product: "Beans 1kg", category: "Food", quantity: 5, minimum: 6 },
];

const projects = [
  {
    name: "Market automation",
    status: "In progress",
    stack: "Python, SQLite",
    progress: 72,
  },
  {
    name: "Apartment management",
    status: "Planning",
    stack: "Python, SQL",
    progress: 42,
  },
  {
    name: "Portfolio website",
    status: "Published",
    stack: "HTML, CSS, JavaScript",
    progress: 100,
  },
  {
    name: "UE5 movement prototype",
    status: "Prototype",
    stack: "UE5, Unity, C++, Lua",
    progress: 64,
  },
];

function MetricCard({ metric }) {
  return (
    <article className="metric-card">
      <span>{metric.label}</span>
      <strong>{metric.value}</strong>
      <small className={metric.tone}>{metric.change}</small>
    </article>
  );
}

function SalesPanel() {
  const totalRevenue = sales.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p>Sales</p>
          <h2>Revenue by category</h2>
        </div>
        <strong>R$ {totalRevenue.toLocaleString("pt-BR")}</strong>
      </div>

      <div className="sales-list">
        {sales.map((item) => {
          const width = `${Math.round((item.revenue / totalRevenue) * 100)}%`;

          return (
            <article className="sales-row" key={item.category}>
              <div>
                <strong>{item.category}</strong>
                <span>{item.units} units</span>
              </div>
              <div className="bar">
                <span style={{ width }} />
              </div>
              <strong>R$ {item.revenue.toLocaleString("pt-BR")}</strong>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function StockAlerts() {
  return (
    <section className="panel compact-panel">
      <div className="panel-heading">
        <div>
          <p>Stock</p>
          <h2>Attention list</h2>
        </div>
      </div>

      <div className="alert-list">
        {stockAlerts.map((item) => (
          <article className="alert-row" key={item.product}>
            <div>
              <strong>{item.product}</strong>
              <span>{item.category}</span>
            </div>
            <small>
              {item.quantity}/{item.minimum}
            </small>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProjectList() {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p>Projects</p>
          <h2>Current work</h2>
        </div>
      </div>

      <div className="project-list">
        {projects.map((project) => (
          <article className="project-row" key={project.name}>
            <div>
              <strong>{project.name}</strong>
              <span>{project.stack}</span>
            </div>
            <div className="progress" aria-label={`${project.progress}% complete`}>
              <span style={{ width: `${project.progress}%` }} />
            </div>
            <small>{project.status}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span>SF</span>
          <div>
            <strong>Business Panel</strong>
            <small>React dashboard</small>
          </div>
        </div>
        <nav>
          <a href="#overview">Overview</a>
          <a href="#sales">Sales</a>
          <a href="#stock">Stock</a>
          <a href="#projects">Projects</a>
        </nav>
      </aside>

      <main id="overview">
        <header className="hero">
          <div>
            <p>React dashboard</p>
            <h1>Business control panel for sales, stock and project tracking.</h1>
          </div>
          <a href="https://github.com/Zirphaz/Zirphaz" target="_blank" rel="noreferrer">
            View repository
          </a>
        </header>

        <section className="metrics-grid">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </section>

        <section className="content-grid">
          <div className="primary-column" id="sales">
            <SalesPanel />
            <ProjectList />
          </div>
          <div id="stock">
            <StockAlerts />
          </div>
        </section>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
