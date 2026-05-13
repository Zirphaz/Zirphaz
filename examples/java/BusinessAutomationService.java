package examples.java;

import java.util.List;
import java.util.Map;
import java.util.TreeMap;

public class BusinessAutomationService {
    public record Task(String department, String description, int priority) {
    }

    public Map<String, Integer> countTasksByDepartment(List<Task> tasks) {
        Map<String, Integer> totals = new TreeMap<>();

        for (Task task : tasks) {
            totals.merge(task.department(), 1, Integer::sum);
        }

        return totals;
    }

    public List<Task> findHighPriorityTasks(List<Task> tasks) {
        return tasks.stream()
                .filter(task -> task.priority() >= 8)
                .toList();
    }
}

