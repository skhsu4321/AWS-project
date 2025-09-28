import { Crop } from '../../models/Game';

export interface CropDAO {
  create(crop: Crop): Promise<Crop>;
  findById(id: string): Promise<Crop | null>;
  findByUserId(userId: string): Promise<Crop[]>;
  findByGoalId(goalId: string): Promise<Crop[]>;
  update(id: string, crop: Partial<Crop>): Promise<Crop | null>;
  delete(id: string): Promise<boolean>;
}

// Mock implementation for development
export class MockCropDAO implements CropDAO {
  private crops: Map<string, Crop> = new Map();

  async create(crop: Crop): Promise<Crop> {
    this.crops.set(crop.id, crop);
    return crop;
  }

  async findById(id: string): Promise<Crop | null> {
    return this.crops.get(id) || null;
  }

  async findByUserId(userId: string): Promise<Crop[]> {
    const result: Crop[] = [];
    for (const crop of this.crops.values()) {
      if (crop.userId === userId) {
        result.push(crop);
      }
    }
    return result;
  }

  async findByGoalId(goalId: string): Promise<Crop[]> {
    const result: Crop[] = [];
    for (const crop of this.crops.values()) {
      if (crop.goalId === goalId) {
        result.push(crop);
      }
    }
    return result;
  }

  async update(id: string, updates: Partial<Crop>): Promise<Crop | null> {
    const existing = this.crops.get(id);
    if (!existing) return null;

    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.crops.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.crops.delete(id);
  }
}