import { prisma } from "./db";

// Seed 测试用户 ID（开发模式使用）
const DEV_STUDENT_ID = "dev-student-001";
const DEV_PARENT_ID = "dev-parent-001";
const DEV_ADMIN_ID = "dev-admin-001";

export type UserRole = "student" | "parent" | "admin";

export interface CurrentUser {
    id: string;
    phone: string;
    role: UserRole;
    grade: string | null;
    name: string | null;
}

/**
 * 获取当前用户
 * 开发模式：返回 Seed 用户（可通过 role 参数切换）
 * 生产模式：从 NextAuth session 获取（Phase 5 实现）
 */
export async function getCurrentUser(
    role: UserRole = "student"
): Promise<CurrentUser> {
    if (process.env.NODE_ENV === "development") {
        return getDevUser(role);
    }

    // TODO: Phase 5 - 从 NextAuth session 获取真实用户
    throw new Error("Production auth not implemented yet");
}

async function getDevUser(role: UserRole): Promise<CurrentUser> {
    const idMap: Record<UserRole, string> = {
        student: DEV_STUDENT_ID,
        parent: DEV_PARENT_ID,
        admin: DEV_ADMIN_ID,
    };

    const user = await prisma.user.findUnique({
        where: { id: idMap[role] },
    });

    if (!user) {
        throw new Error(
            `Dev user not found for role "${role}". Run: npx prisma db seed`
        );
    }

    return {
        id: user.id,
        phone: user.phone,
        role: user.role as UserRole,
        grade: user.grade,
        name: user.name,
    };
}

/**
 * 检查用户是否有权限访问资源
 */
export function requireRole(user: CurrentUser, ...roles: UserRole[]): void {
    if (!roles.includes(user.role)) {
        throw new Error(`Access denied. Required roles: ${roles.join(", ")}`);
    }
}

/**
 * 获取目标学生 ID
 * 学生 → 自己的 ID
 * 家长 → 关联孩子的 ID
 */
export async function getStudentId(user: CurrentUser): Promise<string> {
    if (user.role === "student") return user.id;
    if (user.role === "parent") {
        const link = await prisma.parentChild.findFirst({
            where: { parentId: user.id },
            select: { studentId: true },
        });
        if (!link) throw new Error("No child linked to this parent");
        return link.studentId;
    }
    // admin 也可以看所有学生，未来扩展
    throw new Error("Cannot resolve student ID for role: " + user.role);
}
