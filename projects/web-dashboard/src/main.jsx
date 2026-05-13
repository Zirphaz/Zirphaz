import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const metrics = [
  { label: "Revenue", value: "R$ 8.420", change: "+12%" },
  { label: "Orders", value: "184", change: "+18" },
  { label: "Low stock", value: "7", change: "-3" },
  { label: "Active projects", value: "4", change: "+1" },
];

const sales = [
  { category: "Food", revenue: 4820, units: 126 },
  { category: "Home", revenue: 2140, units: 54 },
  { category: "Cleaning", revenue: 1460, units: 38 },
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
      <small>{metric.change}</small>
    </article>
  );
}

function SalesTable() {
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

      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Units</th>
            <th>Revenue</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((item) => (
            <tr key={item.category}>
              <td>{item.category}</td>
              <td>{item.units}</td>
              <td>R$ {item.revenue.toLocaleString("pt-BR")}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
    <main>
      <header className="hero">
        <div>
          <p>React dashboard</p>
          <h1>Business control panel for sales, stock and project tracking.</h1>
        </div>
      </header>

      <section className="metrics-grid">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </section>

      <section className="content-grid">
        <SalesTable />
        <ProjectList />
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);

