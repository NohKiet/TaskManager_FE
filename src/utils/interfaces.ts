// --- 1. Users Interface ---
export interface IUser {
    user_id: number;
    username: string;
    email: string;
    full_name: string;
    role: 'group leader' | 'member';
    created_at: string; // Sử dụng string cho TIMESTAMP/DateTime
    is_active: boolean;
}

// --- 2. Tasks Interface ---
export interface ITask {
    task_id: number;
    title: string;
    description: string;
    start_date: string; // Sử dụng string cho Date
    due_date: string;
    completed_date: string | null;
    status: 'pending' | 'in progress' | 'completed' | 'on hold';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    category: string;
    created_at: string;
    updated_at: string;
    is_trashed: boolean;
}

// --- 3. TaskAssignment Interface ---
export interface ITaskAssignment {
    assignment_id: number;
    user_id: number;
    task_id: number;
    assigned_date: string;
}

// --- 4. Comments Interface ---
export interface IComment {
    comment_id: number;
    user_id: number;
    task_id: number;
    parent_comment_id: number | null;
    text: string;
    created_at: string;
}

// --- 5. Notifications Interface ---
export interface INotification {
    notification_id: number;
    user_id: number;
    task_id: number | null;
    message: string;
    type: 'reminder' | 'update' | 'assignment' | 'comment';
    created_at: string;
    sent_at: string | null;
    is_read: boolean;
}