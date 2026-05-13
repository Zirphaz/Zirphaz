const projects = [
  {
    name: "Market automation system",
    area: "Automation",
    stack: ["Python", "SQL", "JSON"],
    status: "In progress",
  },
  {
    name: "Professional portfolio",
    area: "Web",
    stack: ["HTML", "CSS", "JavaScript"],
    status: "Published",
  },
  {
    name: "UE5 movement system",
    area: "Simulation",
    stack: ["Unreal Engine 5", "C++", "Lua"],
    status: "Prototype",
  },
];

export function groupProjectsByArea(items = projects) {
  return items.reduce((groups, project) => {
    const current = groups[project.area] ?? [];
    return {
      ...groups,
      [project.area]: [...current, project],
    };
  }, {});
}

export function listTechnologies(items = projects) {
  return [...new Set(items.flatMap((project) => project.stack))].sort();
}

export default projects;

