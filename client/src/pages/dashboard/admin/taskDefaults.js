export function emptyTask(taskNumber) {
  return {
    taskNumber,
    title: `Project ${taskNumber}`,
    description: "",
    instructions: "",
    submissionType: "link",
    dueInDays: 7,
    points: 20,
  };
}

export function defaultTasks() {
  return [1, 2, 3, 4, 5].map(emptyTask);
}

export function emptyProgram() {
  return {
    title: "",
    domain: "",
    duration: "2 Months",
    stipend: "Unpaid",
    description: "",
    skills: "",
    isActive: true,
    tasks: defaultTasks(),
  };
}
