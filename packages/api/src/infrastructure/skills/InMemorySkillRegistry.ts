import { Skill, SkillRegistry } from "@andromeda/core";

export class InMemorySkillRegistry implements SkillRegistry {
    private skills: Map<string, Skill> = new Map();

    async register(skill: Skill): Promise<void> {
        this.skills.set(skill.getId(), skill);
    }

    async findById(id: string): Promise<Skill | null> {
        return this.skills.get(id) || null;
    }

    async findByName(name: string): Promise<Skill | null> {
        return Array.from(this.skills.values()).find(s => s.getName() === name) || null;
    }

    async listAll(): Promise<Skill[]> {
        return Array.from(this.skills.values());
    }

    async searchByCapability(query: string): Promise<Skill[]> {
        const lowerQuery = query.toLowerCase();
        return Array.from(this.skills.values()).filter(s =>
            lowerQuery.includes(s.getName().toLowerCase()) ||
            lowerQuery.includes(s.getDescription().toLowerCase())
        );
    }
}
