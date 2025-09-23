import { CacheManager, CACHE_KEYS } from '../utils/cache';
import { apiService, type ApiResponse, type Project, type ProjectDetails } from '../service';

/**
 * Enhanced API service with caching capabilities
 */
export class CachedApiService {

    /**
     * Get projects with caching (5 minutes cache)
     */
    static async getProjects(forceRefresh: boolean = false): Promise<ApiResponse<Project[]>> {
        try {
            // Check cache first unless force refresh is requested
            if (!forceRefresh) {
                const cachedProjects = CacheManager.get<Project[]>(CACHE_KEYS.PROJECTS);
                if (cachedProjects) {
                    console.log('📋 Loaded projects from cache');
                    return {
                        status: 'success',
                        data: cachedProjects,
                        message: 'Projects loaded from cache'
                    } as ApiResponse<Project[]>;
                }
            }

            console.log('🔄 Fetching projects from API...');
            const response = await apiService.getProjects();

            if (apiService.isSuccess(response)) {
                // Cache the successful response
                CacheManager.set(CACHE_KEYS.PROJECTS, response.data);
                console.log(`✅ Cached ${response.data.length} projects`);
            }

            return response;
        } catch (error) {
            console.error('❌ Error in cached getProjects:', error);
            throw error;
        }
    }

    /**
     * Get project details with caching (5 minutes cache)
     */
    static async getProject(projectId: string, forceRefresh: boolean = false): Promise<ApiResponse<ProjectDetails>> {
        try {
            const cacheKey = CACHE_KEYS.PROJECT_DETAILS(projectId);

            // Check cache first unless force refresh is requested
            if (!forceRefresh) {
                const cachedProject = CacheManager.get<ProjectDetails>(cacheKey);
                if (cachedProject) {
                    console.log(`📋 Loaded project ${projectId} from cache`);
                    return {
                        status: 'success',
                        data: cachedProject,
                        message: 'Project loaded from cache'
                    } as ApiResponse<ProjectDetails>;
                }
            }

            console.log(`🔄 Fetching project ${projectId} from API...`);
            const response = await apiService.getProject(projectId);

            if (apiService.isSuccess(response)) {
                // Cache the successful response
                CacheManager.set(cacheKey, response.data);
                console.log(`✅ Cached project ${projectId} details`);
            }

            return response;
        } catch (error) {
            console.error(`❌ Error in cached getProject for ${projectId}:`, error);
            throw error;
        }
    }

    /**
     * Get team details with caching (5 minutes cache)
     */
    static async getTeamDetails(teamId: number, projectId: string, forceRefresh: boolean = false): Promise<any> {
        try {
            const cacheKey = CACHE_KEYS.TEAM_DETAILS(teamId.toString(), projectId);

            // Check cache first unless force refresh is requested
            if (!forceRefresh) {
                const cachedTeam = CacheManager.get<any>(cacheKey);
                if (cachedTeam) {
                    console.log(`📋 Loaded team ${teamId} from cache`);
                    return {
                        status: 'success',
                        data: cachedTeam,
                        message: 'Team loaded from cache'
                    };
                }
            }

            console.log(`🔄 Fetching team ${teamId} from API...`);
            const response = await apiService.getTeamDetails(teamId, projectId);

            if (apiService.isSuccess(response)) {
                // Cache the successful response
                CacheManager.set(cacheKey, response.data);
                console.log(`✅ Cached team ${teamId} details`);
            }

            return response;
        } catch (error) {
            console.error(`❌ Error in cached getTeamDetails for team ${teamId}:`, error);
            throw error;
        }
    }

    /**
     * Clear all cache
     */
    static clearAllCache(): void {
        CacheManager.clearAll();
    }

    /**
     * Clear specific cache
     */
    static clearProjectsCache(): void {
        CacheManager.remove(CACHE_KEYS.PROJECTS);
    }

    static clearProjectCache(projectId: string): void {
        CacheManager.remove(CACHE_KEYS.PROJECT_DETAILS(projectId));
    }

    static clearTeamCache(teamId: string, projectId: string): void {
        CacheManager.remove(CACHE_KEYS.TEAM_DETAILS(teamId, projectId));
    }

    /**
     * Get cache status for debugging
     */
    static getCacheStatus(): {
        projects: any;
        taskStatus: any;
    } {
        return {
            projects: CacheManager.getInfo(CACHE_KEYS.PROJECTS),
            taskStatus: CacheManager.getInfo(CACHE_KEYS.TASK_STATUS),
        };
    }

    // Proxy other methods that don't need caching
    static async addTask(teamId: number, projectId: string, taskData: any) {
        const result = await apiService.addTask(teamId, projectId, taskData);

        // Clear related caches when adding tasks
        if (apiService.isSuccess(result)) {
            this.clearTeamCache(teamId.toString(), projectId);
            this.clearProjectCache(projectId);
            console.log('🧹 Cleared team and project cache after adding task');
        }

        return result;
    }

    static async createProject(projectData: any) {
        const result = await apiService.createProject(projectData);

        // Clear projects cache when creating new project
        if (apiService.isSuccess(result)) {
            this.clearProjectsCache();
            console.log('🧹 Cleared projects cache after creating project');
        }

        return result;
    }

    // Other utility methods
    static isSuccess = apiService.isSuccess;
    static getErrorMessage = apiService.getErrorMessage;
}