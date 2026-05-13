package src.java;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

public class PortfolioAutomationService {
    public enum Status {
        PLANNED,
        IN_PROGRESS,
        PUBLISHED
    }

    public record PortfolioProject(
            String name,
            String area,
            List<String> stack,
            Status status,
            LocalDate updatedAt
    ) {
        public boolean usesTechnology(String technology) {
            return stack.stream().anyMatch(item -> item.equalsIgnoreCase(technology));
        }
    }

    public Map<String, Integer> countProjectsByArea(List<PortfolioProject> projects) {
        Map<String, Integer> totals = new TreeMap<>();

        for (PortfolioProject project : projects) {
            totals.merge(project.area(), 1, Integer::sum);
        }

        return totals;
    }

    public List<PortfolioProject> findByTechnology(List<PortfolioProject> projects, String technology) {
        return projects.stream()
                .filter(project -> project.usesTechnology(technology))
                .sorted(Comparator.comparing(PortfolioProject::updatedAt).reversed())
                .toList();
    }

    public List<PortfolioProject> publishedProjects(List<PortfolioProject> projects) {
        return projects.stream()
                .filter(project -> project.status() == Status.PUBLISHED)
                .sorted(Comparator.comparing(PortfolioProject::name))
                .toList();
    }
}

