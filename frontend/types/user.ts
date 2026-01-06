export interface User {
    id: number;
    username: string;
    email: string;
    department: string;
    clearance_level: string;
    phone_number?: string;
    is_staff?: boolean;
    is_active?: boolean;
}
