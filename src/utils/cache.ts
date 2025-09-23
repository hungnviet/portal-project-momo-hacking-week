// Cache utility for API responses
export interface CacheItem<T> {
    data: T;
    timestamp: number;
    expiresIn: number; // Duration in milliseconds
}

export class CacheManager {
    private static readonly DEFAULT_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

    /**
     * Set data in cache with expiration
     */
    static set<T>(key: string, data: T, expiresIn: number = this.DEFAULT_CACHE_DURATION): void {
        try {
            const cacheItem: CacheItem<T> = {
                data,
                timestamp: Date.now(),
                expiresIn
            };
            localStorage.setItem(key, JSON.stringify(cacheItem));
            console.log(`📦 Cached data for key: ${key} (expires in ${expiresIn / 1000}s)`);
        } catch (error) {
            console.warn('Failed to save to cache:', error);
        }
    }

    /**
     * Get data from cache if not expired
     */
    static get<T>(key: string): T | null {
        try {
            const cachedData = localStorage.getItem(key);
            if (!cachedData) {
                console.log(`📪 No cache found for key: ${key}`);
                return null;
            }

            const cacheItem: CacheItem<T> = JSON.parse(cachedData);
            const now = Date.now();
            const isExpired = (now - cacheItem.timestamp) > cacheItem.expiresIn;

            if (isExpired) {
                console.log(`⏰ Cache expired for key: ${key}`);
                this.remove(key);
                return null;
            }

            const remainingTime = Math.round((cacheItem.expiresIn - (now - cacheItem.timestamp)) / 1000);
            console.log(`📋 Cache hit for key: ${key} (expires in ${remainingTime}s)`);
            return cacheItem.data;
        } catch (error) {
            console.warn('Failed to read from cache:', error);
            this.remove(key);
            return null;
        }
    }

    /**
     * Remove specific item from cache
     */
    static remove(key: string): void {
        try {
            localStorage.removeItem(key);
            console.log(`🗑️ Removed cache for key: ${key}`);
        } catch (error) {
            console.warn('Failed to remove from cache:', error);
        }
    }

    /**
     * Clear all cache items
     */
    static clearAll(): void {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith('cache_')) {
                    localStorage.removeItem(key);
                }
            });
            console.log('🧹 Cleared all cache');
        } catch (error) {
            console.warn('Failed to clear cache:', error);
        }
    }

    /**
     * Check if cache exists and is valid
     */
    static isValid(key: string): boolean {
        return this.get(key) !== null;
    }

    /**
     * Get cache info (timestamp, expiry)
     */
    static getInfo(key: string): { timestamp: Date; expiresAt: Date; isExpired: boolean } | null {
        try {
            const cachedData = localStorage.getItem(key);
            if (!cachedData) return null;

            const cacheItem: CacheItem<any> = JSON.parse(cachedData);
            const timestamp = new Date(cacheItem.timestamp);
            const expiresAt = new Date(cacheItem.timestamp + cacheItem.expiresIn);
            const isExpired = Date.now() > (cacheItem.timestamp + cacheItem.expiresIn);

            return { timestamp, expiresAt, isExpired };
        } catch (error) {
            return null;
        }
    }
}

// Cache keys constants
export const CACHE_KEYS = {
    PROJECTS: 'cache_projects',
    PROJECT_DETAILS: (projectId: string) => `cache_project_${projectId}`,
    TEAM_DETAILS: (teamId: string, projectId: string) => `cache_team_${teamId}_${projectId}`,
    TASK_STATUS: 'cache_task_status',
} as const;