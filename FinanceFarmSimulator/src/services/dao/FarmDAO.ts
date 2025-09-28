import { Farm } from '../../models/Game';

export interface FarmDAO {
  create(farm: Farm): Promise<Farm>;
  findById(id: string): Promise<Farm | null>;
  findFarmByUserId(userId: string): Promise<Farm | null>;
  update(id: string, farm: Partial<Farm>): Promise<Farm | null>;
  delete(id: string): Promise<boolean>;
}

// Mock implementation for development
export class MockFarmDAO implements FarmDAO {
  private farms: Map<string, Farm> = new Map();

  async create(farm: Farm): Promise<Farm> {
    this.farms.set(farm.id, farm);
    return farm;
  }

  async findById(id: string): Promise<Farm | null> {
    return this.farms.get(id) || null;
  }

  async findFarmByUserId(userId: string): Promise<Farm | null> {
    for (const farm of this.farms.values()) {
      if (farm.userId === userId) {
        return farm;
      }
    }
    return null;
  }

  async update(id: string, updates: Partial<Farm>): Promise<Farm | null> {
    const existing = this.farms.get(id);
    if (!existing) return null;

    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.farms.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.farms.delete(id);
  }
}