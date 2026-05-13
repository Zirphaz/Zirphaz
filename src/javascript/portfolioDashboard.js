const projects = [
  {
    id: "market-automation",
    name: "Market automation system",
    area: "Automation",
    status: "In progress",
    stack: ["Python", "SQL", "JSON"],
    impact: "Organizes records, stock checks and operational data.",
  },
  {
    id: "apartment-system",
    name: "Apartment management system",
    area: "Internal Systems",
    status: "Prototype",
    stack: ["Python", "SQL", "CustomTkinter"],
    impact: "Centralizes apartment records, maintenance and search workflows.",
  },
  {
    id: "portfolio",
    name: "Professional portfolio",
    area: "Web",
    status: "Published",
    stack: ["HTML", "CSS", "JavaScript"],
    impact: "Presents skills, contact channels and career positioning.",
  },
  {
    id: "ue5-movement",
    name: "UE5 movement systems",
    area: "Simulation",
    status: "Prototype",
    stack: ["Unreal Engine 5", "C++", "Lua"],
    impact: "Tests train and ship movement logic for interactive environments.",
  },
];

export function groupByArea(items = projects) {
  return items.reduce((groups, project) => {
    const current = groups[project.area] ?? [];

    return {
      ...groups,
      [project.area]: [...current, project],
    };
  }, {});
}

export function getTechnologyUsage(items = projects) {
  return items.reduce((usage, project) => {
    project.stack.forEach((technology) => {
      usage[technology] = (usage[technology] ?? 0) + 1;
    });

    return usage;
  }, {});
}

export function filterProjectsByStatus(status, items = projects) {
  return items.filter((project) => project.status.toLowerCase() === status.toLowerCase());
}

export function buildPortfolioSummary(items = projects) {
  const technologies = Object.keys(getTechnologyUsage(items)).sort();

  return {
    totalProjects: items.length,
    areas: Object.keys(groupByArea(items)).sort(),
    technologies,
    publishedProjects: filterProjectsByStatus("Published", items).length,
  };
}

export default projects;

