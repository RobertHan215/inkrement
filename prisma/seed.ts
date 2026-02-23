import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding database...");

    // 创建测试学生
    const student = await prisma.user.upsert({
        where: { id: "dev-student-001" },
        update: {},
        create: {
            id: "dev-student-001",
            phone: "13800000001",
            role: "student",
            grade: "预初",
            name: "测试学生",
        },
    });
    console.log(`  ✅ Student: ${student.name} (${student.phone})`);

    // 创建测试家长
    const parent = await prisma.user.upsert({
        where: { id: "dev-parent-001" },
        update: {},
        create: {
            id: "dev-parent-001",
            phone: "13800000002",
            role: "parent",
            name: "测试家长",
        },
    });
    console.log(`  ✅ Parent: ${parent.name} (${parent.phone})`);

    // 创建测试管理员
    const admin = await prisma.user.upsert({
        where: { id: "dev-admin-001" },
        update: {},
        create: {
            id: "dev-admin-001",
            phone: "13800000003",
            role: "admin",
            name: "管理员",
        },
    });
    console.log(`  ✅ Admin: ${admin.name} (${admin.phone})`);

    // 关联家长和学生
    await prisma.parentChild.upsert({
        where: {
            parentId_studentId: {
                parentId: parent.id,
                studentId: student.id,
            },
        },
        update: {},
        create: {
            parentId: parent.id,
            studentId: student.id,
            inviteCode: "ABC123",
        },
    });
    console.log(`  ✅ Parent-Child link: ${parent.name} → ${student.name}`);

    // 创建默认 AI 配置（使用环境变量中的 key）
    const modules = [
        {
            module: "chinese_writing",
            provider: "qwen",
            modelName: "qwen-max",
        },
        {
            module: "classical_reading",
            provider: "qwen",
            modelName: "qwen-max",
        },
        {
            module: "english_writing",
            provider: "qwen",
            modelName: "qwen-max",
        },
        {
            module: "english_reading",
            provider: "qwen",
            modelName: "qwen-plus",
        },
        { module: "ocr", provider: "qwen", modelName: "qwen-vl-max" },
    ];

    for (const mod of modules) {
        await prisma.aiConfig.upsert({
            where: { module: mod.module },
            update: {},
            create: {
                module: mod.module,
                provider: mod.provider,
                modelName: mod.modelName,
                apiKey: process.env.QWEN_API_KEY || "placeholder-key",
                baseUrl: process.env.QWEN_BASE_URL,
                temperature: 0.7,
            },
        });
    }
    console.log(`  ✅ AI configs: ${modules.length} modules configured`);

    console.log("\n🎉 Seed completed!");
}

main()
    .catch((e) => {
        console.error("Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
