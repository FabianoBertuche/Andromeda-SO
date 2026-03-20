import { Prisma } from "@prisma/client";

export const softDeleteExtension = Prisma.defineExtension({
    name: 'softDelete',
    query: {
        $allModels: {
            async findMany({ model, operation, args, query }) {
                if (supportsSoftDelete(model)) {
                    args.where = { ...args.where, deletedAt: null };
                }
                return query(args);
            },
            async findFirst({ model, operation, args, query }) {
                if (supportsSoftDelete(model)) {
                    args.where = { ...args.where, deletedAt: null };
                }
                return query(args);
            },
            async findUnique({ model, operation, args, query }) {
                if (supportsSoftDelete(model)) {
                    args.where = { ...args.where, deletedAt: null };
                }
                return query(args);
            },
            async count({ model, operation, args, query }) {
                if (supportsSoftDelete(model)) {
                    args.where = { ...args.where, deletedAt: null };
                }
                return query(args);
            },
            async delete({ model, operation, args, query }) {
                if (supportsSoftDelete(model)) {
                    return (Prisma.getExtensionContext(this) as any).update({
                        ...args,
                        data: { deletedAt: new Date() },
                    });
                }
                return query(args);
            },
            async deleteMany({ model, operation, args, query }) {
                if (supportsSoftDelete(model)) {
                    return (Prisma.getExtensionContext(this) as any).updateMany({
                        ...args,
                        data: { deletedAt: new Date() },
                    });
                }
                return query(args);
            },
        },
    },
    model: {
        $allModels: {
            async restore<T, A>(
                this: T,
                args: Prisma.Exact<A, Prisma.Args<T, 'update'>>
            ): Promise<Prisma.Result<T, A, 'update'>> {
                const context = Prisma.getExtensionContext(this) as any;
                return context.update({
                    ...args,
                    data: { deletedAt: null },
                });
            },
        },
    },
});

function supportsSoftDelete(model: string): boolean {
    const modelsWithSoftDelete = [
        'SandboxProfile',
        'AgentSandboxConfig',
        'SandboxExecution',
        'MemoryEntry',
        'MemoryPolicy',
        'KnowledgeCollection',
        'KnowledgeDocument',
        'KnowledgeChunk',
        'CommunicationSession',
        'CommunicationMessage',
        'User'
    ];
    return modelsWithSoftDelete.includes(model);
}
