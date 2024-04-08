// UserStatistics.ts
class UserStatistics {
    async getDailyUsers(): Promise<number> {
        const { dailyActiveUsers } = process.env.METRICS_DEMO_MODE === 'true' 
            ? await import('../demo/mockUsers')
            : await import('../user');
        return dailyActiveUsers();
    }

    async getMonthlyUsers(): Promise<number> {
        const { monthlyActiveUsers } = process.env.METRICS_DEMO_MODE === 'true' 
            ? await import('../demo/mockUsers')
            : await import('../user');
        return monthlyActiveUsers();
    }
}

export default UserStatistics;
