export interface AuditLog {
    id: number;
    user_username: string;
    action: string;
    resource: string;
    ip_address: string;
    timestamp: string;
}
