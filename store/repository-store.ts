import { create } from 'zustand';

// Data types
export interface RepoData {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  open_issues_count: number;
  default_branch: string;
}

export interface VelocityData {
  sprint: string;
  estimated: number;
  actual: number;
}

export interface IssueTypeData {
  type: string;
  count: number;
  color: string;
}

export interface EngineerWorkloadData {
  name: string;
  coding: number;
  review: number;
  meetings: number;
  documentation: number;
}

export interface ProductivityData {
  week: string;
  coding: number;
  meetings: number;
}

export interface BurndownData {
  date: string;
  open: number;
  closed: number;
}

interface RepositoryState {
  // Repository details
  repository: RepoData | null;
  isLoadingRepository: boolean;
  repositoryError: string | null;
  
  // Organization details
  organizationDetails: any;
  organizationRepositories: any[];
  isLoadingOrganization: boolean;
  organizationError: string | null;
  
  // Analytics data
  velocityData: VelocityData[];
  issueTypeData: IssueTypeData[];
  engineerWorkloadData: EngineerWorkloadData[];
  productivityData: ProductivityData[];
  burndownData: BurndownData[];
  
  // Actions
  setRepository: (repo: RepoData | null) => void;
  setIsLoadingRepository: (loading: boolean) => void;
  setRepositoryError: (error: string | null) => void;
  setOrganizationDetails: (details: any) => void;
  setOrganizationRepositories: (repos: any[]) => void;
  setIsLoadingOrganization: (loading: boolean) => void;
  setOrganizationError: (error: string | null) => void;
  setVelocityData: (data: VelocityData[]) => void;
  setIssueTypeData: (data: IssueTypeData[]) => void;
  setEngineerWorkloadData: (data: EngineerWorkloadData[]) => void;
  setProductivityData: (data: ProductivityData[]) => void;
  setBurndownData: (data: BurndownData[]) => void;
  generateSampleAnalyticsData: () => void;
  resetState: () => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const useRepositoryStore = create<RepositoryState>((set) => ({
  // Repository details
  repository: null,
  isLoadingRepository: false,
  repositoryError: null,
  
  // Organization details
  organizationDetails: null,
  organizationRepositories: [],
  isLoadingOrganization: false,
  organizationError: null,
  
  // Analytics data
  velocityData: [],
  issueTypeData: [],
  engineerWorkloadData: [],
  productivityData: [],
  burndownData: [],
  
  // Actions
  setRepository: (repository) => set({ repository }),
  setIsLoadingRepository: (isLoadingRepository) => set({ isLoadingRepository }),
  setRepositoryError: (repositoryError) => set({ repositoryError }),
  setOrganizationDetails: (organizationDetails) => set({ organizationDetails }),
  setOrganizationRepositories: (organizationRepositories) => set({ organizationRepositories }),
  setIsLoadingOrganization: (isLoadingOrganization) => set({ isLoadingOrganization }),
  setOrganizationError: (organizationError) => set({ organizationError }),
  setVelocityData: (velocityData) => set({ velocityData }),
  setIssueTypeData: (issueTypeData) => set({ issueTypeData }),
  setEngineerWorkloadData: (engineerWorkloadData) => set({ engineerWorkloadData }),
  setProductivityData: (productivityData) => set({ productivityData }),
  setBurndownData: (burndownData) => set({ burndownData }),
  
  generateSampleAnalyticsData: () => {
    // Team Velocity data
    const velocitySampleData: VelocityData[] = [
      { sprint: "Sprint 1", estimated: 45, actual: 40 },
      { sprint: "Sprint 2", estimated: 50, actual: 52 },
      { sprint: "Sprint 3", estimated: 55, actual: 48 },
      { sprint: "Sprint 4", estimated: 60, actual: 58 },
      { sprint: "Sprint 5", estimated: 65, actual: 70 },
      { sprint: "Sprint 6", estimated: 70, actual: 68 }
    ];
    
    // Issue Type breakdown data
    const issueTypeSampleData: IssueTypeData[] = [
      { type: "Bug", count: 35, color: "#FF8042" },
      { type: "Feature", count: 45, color: "#0088FE" },
      { type: "Documentation", count: 15, color: "#00C49F" },
      { type: "Enhancement", count: 25, color: "#FFBB28" },
      { type: "Test", count: 10, color: "#8884d8" }
    ];
    
    // Engineer workload data
    const engineerSampleData: EngineerWorkloadData[] = [
      { name: "Alex", coding: 35, review: 15, meetings: 10, documentation: 5 },
      { name: "Blake", coding: 25, review: 20, meetings: 15, documentation: 10 },
      { name: "Casey", coding: 40, review: 10, meetings: 12, documentation: 8 },
      { name: "Dana", coding: 30, review: 25, meetings: 8, documentation: 12 },
      { name: "Jamie", coding: 20, review: 30, meetings: 16, documentation: 14 }
    ];
    
    // Productivity balance data
    const productivitySampleData: ProductivityData[] = [
      { week: "Week 1", coding: 30, meetings: 10 },
      { week: "Week 2", coding: 25, meetings: 15 },
      { week: "Week 3", coding: 35, meetings: 12 },
      { week: "Week 4", coding: 20, meetings: 18 },
      { week: "Week 5", coding: 28, meetings: 14 },
      { week: "Week 6", coding: 32, meetings: 8 }
    ];
    
    // Burndown data
    const burndownSampleData: BurndownData[] = [
      { date: "Week 1", open: 25, closed: 5 },
      { date: "Week 2", open: 20, closed: 10 },
      { date: "Week 3", open: 15, closed: 15 },
      { date: "Week 4", open: 12, closed: 18 },
      { date: "Week 5", open: 8, closed: 22 },
      { date: "Week 6", open: 5, closed: 25 }
    ];
    
    set({
      velocityData: velocitySampleData,
      issueTypeData: issueTypeSampleData,
      engineerWorkloadData: engineerSampleData,
      productivityData: productivitySampleData,
      burndownData: burndownSampleData
    });
  },
  
  resetState: () => set({
    repository: null,
    isLoadingRepository: false,
    repositoryError: null,
    velocityData: [],
    issueTypeData: [],
    engineerWorkloadData: [],
    productivityData: [],
    burndownData: []
  })
}));
