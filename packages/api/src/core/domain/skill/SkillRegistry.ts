import { Skill } from "./Skill";

export interface SkillRegistry {
    register(skill: Skill): Promise<void>;
    findById(id: string): Promise<Skill | null>;
    findByName(name: string): Promise<Skill | null>;
    listAll(): Promise<Skill[]>;
    searchByCapability(query: string): Promise<Skill[]>;
}
