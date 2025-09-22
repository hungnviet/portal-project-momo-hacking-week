// API Response types based on the backend implementation
interface ApiResponse<T> {
    status: 'success' | 'error';
    message: string;
    errorCode: string | null;
    data: T | null;
}

interface Project {
    projectId: string;
    projectName: string;
    projectDesc: string;
    status: 'Planning' | 'In Progress' | 'Completed' | 'Overdue';
    progress: number;
    teamNameList: string[];
}

interface CreateProjectRequest {
    projectName: string;
    projectDesc: string;
    startDate: string;
    endDate: string;
    teams: Array<{
        teamName: string;
        teamDesc: string;
        PODomain: string;
        type: number;
    }>;
}

interface CreateProjectResponse {
    projectId: number;
    projectName: string;
    teams: Array<{
        teamId: number;
        teamName: string;
    }>;
}

interface Comment {
    id: number;
    projectid: number;
    comment: string;
    created_at: string;
}

interface AddCommentRequest {
    time?: string;
    content: string;
}

interface AddCommentResponse {
    commentId: number;
    projectId: number;
    content: string;
    createdAt: string;
}

interface AddTaskRequest {
    type: 'jiraTicket' | 'rowSheet';
    url: string;
}

interface AddTaskResponse {
    taskId: number;
}

interface TeamDetails {
    teamId: number;
    teamName: string;
    teamDesc: string;
    teamProgress: number;
    teamPODomain: string;
}

interface TaskData {
    type: 'rowSheet' | 'jiraTicket' | 'unknown';
    url: string;
    taskDesc: string;
    taskStatus: string;
    taskAssignee: string;
}

interface TeamApiResponse {
    teamId: number;
    teamDesc: string;
    assignee: string;
    progress: number;
    taskList: TaskData[];
}

interface ProjectDetails {
    projectId: number;
    projectName: string;
    projectDesc: string;
    status: 'Planning' | 'In Progress' | 'Completed' | 'Overdue';
    progress: number;
    comments: Comment[];
    teamList: TeamDetails[];
}

/**
 * Service class for making API calls to the backend
 */
class ApiService {
    private baseUrl: string;

    constructor() {
        // Use the current origin for API calls
        this.baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    }

    /**
     * Generic method for making HTTP requests with proper error handling
     */
    private async makeRequest<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        try {
            const url = `${this.baseUrl}/api${endpoint}`;
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
                ...options,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data as ApiResponse<T>;
        } catch (error) {
            console.error(`API request failed for ${endpoint}:`, error);

            // Return a standardized error response
            return {
                status: 'error',
                message: error instanceof Error ? error.message : 'Unknown error occurred',
                errorCode: 'REQUEST_FAILED',
                data: null
            };
        }
    }

    /**
     * Fetch all projects with their teams and progress information
     * @param poDomain Optional PO domain filter
     * @returns Promise containing projects data or error
     */
    async getProjects(poDomain?: string): Promise<ApiResponse<Project[]>> {
        let endpoint = '/projects';

        // Add query parameter if poDomain is provided
        if (poDomain) {
            endpoint += `?PODomain=${encodeURIComponent(poDomain)}`;
        }

        return this.makeRequest<Project[]>(endpoint);
    }

    /**
     * Create a new project with teams
     * @param projectData Project creation data including teams
     * @returns Promise containing created project data or error
     */
    async createProject(projectData: CreateProjectRequest): Promise<ApiResponse<CreateProjectResponse>> {
        return this.makeRequest<CreateProjectResponse>('/project', {
            method: 'POST',
            body: JSON.stringify(projectData)
        });
    }

    /**
     * Fetch detailed project information by project ID
     * @param projectId The ID of the project to retrieve
     * @returns Promise containing project details or error
     */
    async getProject(projectId: string | number): Promise<ApiResponse<ProjectDetails>> {
        const endpoint = `/project?projectId=${encodeURIComponent(projectId)}`;
        return this.makeRequest<ProjectDetails>(endpoint);
    }

    /**
     * Fetch comments for a specific project
     * @param projectId The ID of the project to get comments for
     * @returns Promise containing comments array or error
     */
    async getComments(projectId: string | number): Promise<ApiResponse<Comment[]>> {
        const endpoint = `/comment?projectId=${encodeURIComponent(projectId)}`;
        return this.makeRequest<Comment[]>(endpoint);
    }

    /**
     * Add a new comment to a project
     * @param projectId The ID of the project to add comment to
     * @param commentData Comment data including content
     * @returns Promise containing created comment data or error
     */
    async addComment(
        projectId: string | number,
        commentData: AddCommentRequest
    ): Promise<ApiResponse<AddCommentResponse>> {
        const endpoint = `/comment?projectId=${encodeURIComponent(projectId)}`;
        return this.makeRequest<AddCommentResponse>(endpoint, {
            method: 'POST',
            body: JSON.stringify(commentData)
        });
    }

    /**
     * Fetch team details with tasks and progress for a specific team and project
     * @param teamId The ID of the team to retrieve
     * @param projectId The ID of the project to retrieve team details for
     * @returns Promise containing team details with tasks or error
     */
    async getTeamDetails(
        teamId: string | number,
        projectId: string | number
    ): Promise<ApiResponse<TeamApiResponse>> {
        const endpoint = `/team?teamId=${encodeURIComponent(teamId)}&projectId=${encodeURIComponent(projectId)}`;
        return this.makeRequest<TeamApiResponse>(endpoint);
    }

    /**
     * Add a single task to a specific team and project
     * @param teamId The ID of the team to add task to
     * @param projectId The ID of the project to add task to
     * @param taskData Task data including type and URL
     * @returns Promise containing added task data or error
     */
    async addTask(
        teamId: string | number,
        projectId: string | number,
        taskData: AddTaskRequest
    ): Promise<ApiResponse<AddTaskResponse>> {
        const endpoint = `/task?teamId=${encodeURIComponent(teamId)}&projectId=${encodeURIComponent(projectId)}`;
        return this.makeRequest<AddTaskResponse>(endpoint, {
            method: 'POST',
            body: JSON.stringify(taskData)
        });
    }

    /**
     * Utility method to check if API response was successful
     */
    isSuccess<T>(response: ApiResponse<T>): response is ApiResponse<T> & { status: 'success'; data: T } {
        return response.status === 'success' && response.data !== null;
    }

    /**
     * Get error message from API response
     */
    getErrorMessage<T>(response: ApiResponse<T>): string {
        if (response.status === 'error') {
            return response.message || 'An unknown error occurred';
        }
        return '';
    }
}

// Export a singleton instance
export const apiService = new ApiService();

// Export the class for testing or creating new instances if needed
export { ApiService };

// Export types for use in components
export type {
    ApiResponse,
    Project,
    CreateProjectRequest,
    CreateProjectResponse,
    ProjectDetails,
    Comment,
    TeamDetails,
    TaskData,
    TeamApiResponse,
    AddCommentRequest,
    AddCommentResponse,
    AddTaskRequest,
    AddTaskResponse
};