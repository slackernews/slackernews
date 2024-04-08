// mockUsers.ts
let dailyUsers = 50; 
let monthlyUsers = 50;

function updateDailyUsersCount() {
    const randInt = (max: number) => Math.floor(Math.random() * max);

    if (dailyUsers < 50) {
        dailyUsers += randInt(5);
    } else if (dailyUsers > 120) {
        dailyUsers -= randInt(5);
    } else {
        const direction = randInt(2); // 0 or 1
        const magnitude = randInt(5);
        dailyUsers += (direction === 1 ? magnitude : -magnitude);
    }
}

function updateMonthlyUsersCount() {
    const randInt = (max: number) => Math.floor(Math.random() * max);

    if (monthlyUsers < 50) {
        monthlyUsers += randInt(5);
    } else if (monthlyUsers > 120) {
        monthlyUsers -= randInt(5);
    } else {
        const direction = randInt(2); // 0 or 1
        const magnitude = randInt(5);
        monthlyUsers += (direction === 1 ? magnitude : -magnitude);
    }
}

// Simulate daily active users count based on the logic
export async function dailyActiveUsers(): Promise<number> {
    updateDailyUsersCount();
    return dailyUsers;
}

// Simulate monthly active users count, using a simple aggregation logic
export async function monthlyActiveUsers(): Promise<number> {
    updateMonthlyUsersCount();
    return monthlyUsers;
}

