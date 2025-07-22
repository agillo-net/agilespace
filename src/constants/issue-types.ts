export interface IssueTypeCategory {
  name: string;
  color: string;
  description: string;
  children: IssueTypeSubcategory[];
}

export interface IssueTypeSubcategory {
  name: string;
  color: string;
  description: string;
}

export const ISSUE_TYPE_HIERARCHY: Record<string, IssueTypeCategory> = {
  Meeting: {
    name: "Meeting",
    color: "#3B82F6",
    description: "Various types of meetings and discussions",
    children: [
      { name: "Demo", color: "#10B981", description: "Product demonstrations" },
      {
        name: "Daily Stand-up",
        color: "#F59E0B",
        description: "Daily team sync meetings",
      },
      {
        name: "Retrospective",
        color: "#EF4444",
        description: "Sprint retrospectives",
      },
      {
        name: "Sprint Planning",
        color: "#8B5CF6",
        description: "Sprint planning sessions",
      },
      {
        name: "Backlog Refinement",
        color: "#06B6D4",
        description: "Backlog grooming sessions",
      },
      {
        name: "Design Review",
        color: "#84CC16",
        description: "Design review meetings",
      },
      {
        name: "Technical Planning",
        color: "#F97316",
        description: "Technical planning sessions",
      },
      {
        name: "Casual Meeting",
        color: "#6B7280",
        description: "Informal discussions",
      },
      {
        name: "PM Follow-up and Sync",
        color: "#EC4899",
        description: "PM sync meetings",
      },
    ],
  },
  Development: {
    name: "Development",
    color: "#059669",
    description: "Development and technical work",
    children: [
      {
        name: "Bugs",
        color: "#DC2626",
        description: "Bug fixes and debugging",
      },
      {
        name: "Feature Development",
        color: "#2563EB",
        description: "New feature development",
      },
      {
        name: "Code Review",
        color: "#7C3AED",
        description: "Code review activities",
      },
      { name: "Testing", color: "#D97706", description: "Testing and QA work" },
      {
        name: "Documentation",
        color: "#059669",
        description: "Documentation writing",
      },
    ],
  },
  "Project Management": {
    name: "Project Management",
    color: "#7C2D12",
    description: "Project management activities",
    children: [
      { name: "Scrum", color: "#1E40AF", description: "Scrum ceremonies" },
      {
        name: "Product Issues",
        color: "#BE185D",
        description: "Product-related issues",
      },
      {
        name: "Planning",
        color: "#0891B2",
        description: "Project planning activities",
      },
      {
        name: "Coordination",
        color: "#7C3AED",
        description: "Team coordination tasks",
      },
    ],
  },
};

// Helper function to get all categories
export function getCategories(): string[] {
  return Object.keys(ISSUE_TYPE_HIERARCHY);
}

// Helper function to get subcategories for a category
export function getSubcategories(category: string): IssueTypeSubcategory[] {
  return ISSUE_TYPE_HIERARCHY[category]?.children || [];
}

// Helper function to get category data
export function getCategory(category: string): IssueTypeCategory | undefined {
  return ISSUE_TYPE_HIERARCHY[category];
}

// Helper function to find subcategory within a category
export function findSubcategory(
  category: string,
  subcategoryName: string
): IssueTypeSubcategory | undefined {
  return ISSUE_TYPE_HIERARCHY[category]?.children.find(
    (sub) => sub.name === subcategoryName
  );
}

// Helper function to get all issue types as flat array
export function getAllIssueTypes(): Array<{
  category: string;
  subcategory: IssueTypeSubcategory;
}> {
  const result: Array<{
    category: string;
    subcategory: IssueTypeSubcategory;
  }> = [];

  Object.entries(ISSUE_TYPE_HIERARCHY).forEach(([categoryName, category]) => {
    category.children.forEach((subcategory) => {
      result.push({
        category: categoryName,
        subcategory,
      });
    });
  });

  return result;
}
