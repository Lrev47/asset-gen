import { PrismaClient } from '@prisma/client';
import AssetTypeManager from './assetTypeManager';
// import TagLibrary from './tagLibrary';

const prisma = new PrismaClient();

export interface FieldRequirements {
  quantity: number;
  variations: number; // How many variations per prompt
  priority: 'critical' | 'high' | 'medium' | 'low';
  deadline?: Date;
  notes?: string;
  specificInstructions?: string[];
}

export interface CreateFieldData {
  name: string;
  description: string;
  assetTypeId: string;
  requirements: FieldRequirements;
  isImageToImage: boolean;
  sourceFieldId?: string;
}

export class ProjectFieldManager {
  private static instance: ProjectFieldManager;

  static getInstance(): ProjectFieldManager {
    if (!ProjectFieldManager.instance) {
      ProjectFieldManager.instance = new ProjectFieldManager();
    }
    return ProjectFieldManager.instance;
  }

  async createField(projectId: string, fieldData: CreateFieldData) {
    // Validate asset type exists
    const assetTypeManager = AssetTypeManager.getInstance();
    const assetType = await assetTypeManager.getAssetType(fieldData.assetTypeId);
    
    if (!assetType) {
      throw new Error('Asset type not found');
    }

    // Validate source field if image-to-image
    if (fieldData.isImageToImage && fieldData.sourceFieldId) {
      const sourceField = await this.getField(fieldData.sourceFieldId);
      if (!sourceField) {
        throw new Error('Source field not found');
      }
      
      // Ensure source field belongs to same project
      if (sourceField.projectId !== projectId) {
        throw new Error('Source field must belong to the same project');
      }
    }

    const field = await prisma.projectField.create({
      data: {
        projectId,
        name: fieldData.name,
        description: fieldData.description,
        assetTypeId: fieldData.assetTypeId,
        requirements: JSON.stringify(fieldData.requirements),
        isImageToImage: fieldData.isImageToImage,
        sourceFieldId: fieldData.sourceFieldId
      },
      include: {
        assetType: true,
        sourceField: true,
        prompts: true
      }
    });

    return field;
  }

  async getField(fieldId: string) {
    return await prisma.projectField.findUnique({
      where: { id: fieldId },
      include: {
        assetType: true,
        sourceField: true,
        derivedFields: true,
        prompts: {
          include: {
            model: true,
            tags: {
              include: {
                tag: true
              }
            },
            images: true
          },
          orderBy: { version: 'desc' }
        }
      }
    });
  }

  async getProjectFields(projectId: string) {
    return await prisma.projectField.findMany({
      where: { projectId },
      include: {
        assetType: true,
        sourceField: true,
        derivedFields: true,
        prompts: {
          include: {
            model: true,
            tags: {
              include: {
                tag: true
              }
            },
            images: true
          },
          orderBy: { version: 'desc' }
        }
      },
      orderBy: [
        { requirements: 'desc' }, // Priority fields first (stored as JSON, need custom sorting)
        { createdAt: 'asc' }
      ]
    });
  }

  async updateField(fieldId: string, updates: Partial<CreateFieldData>) {
    const existingField = await this.getField(fieldId);
    if (!existingField) {
      throw new Error('Field not found');
    }

    // Validate asset type if being updated
    if (updates.assetTypeId) {
      const assetTypeManager = AssetTypeManager.getInstance();
      const assetType = await assetTypeManager.getAssetType(updates.assetTypeId);
      if (!assetType) {
        throw new Error('Asset type not found');
      }
    }

    // Validate source field if being updated
    if (updates.isImageToImage && updates.sourceFieldId) {
      const sourceField = await this.getField(updates.sourceFieldId);
      if (!sourceField) {
        throw new Error('Source field not found');
      }
      
      if (sourceField.projectId !== existingField.projectId) {
        throw new Error('Source field must belong to the same project');
      }
    }

    return await prisma.projectField.update({
      where: { id: fieldId },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: updates as any,
      include: {
        assetType: true,
        sourceField: true,
        derivedFields: true,
        prompts: {
          include: {
            model: true,
            tags: {
              include: {
                tag: true
              }
            },
            images: true
          },
          orderBy: { version: 'desc' }
        }
      }
    });
  }

  async deleteField(fieldId: string) {
    const field = await this.getField(fieldId);
    if (!field) {
      throw new Error('Field not found');
    }

    // Check if this field is used as source for other fields
    if (field.derivedFields.length > 0) {
      throw new Error('Cannot delete field that is used as source for image-to-image generation');
    }

    await prisma.projectField.delete({
      where: { id: fieldId }
    });
  }

  async duplicateField(fieldId: string, newName?: string) {
    const originalField = await this.getField(fieldId);
    if (!originalField) {
      throw new Error('Field not found');
    }

    const duplicatedField = await prisma.projectField.create({
      data: {
        projectId: originalField.projectId,
        name: newName || `${originalField.name} (Copy)`,
        description: originalField.description,
        assetTypeId: originalField.assetTypeId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        requirements: originalField.requirements as any,
        isImageToImage: false, // Don't copy image-to-image relationships
        sourceFieldId: null
      },
      include: {
        assetType: true,
        prompts: true
      }
    });

    return duplicatedField;
  }

  async getFieldsByAssetType(projectId: string, assetTypeId: string) {
    return await prisma.projectField.findMany({
      where: {
        projectId,
        assetTypeId
      },
      include: {
        assetType: true,
        prompts: {
          include: {
            model: true,
            images: true
          }
        }
      }
    });
  }

  async getFieldsByPriority(projectId: string, priority: 'critical' | 'high' | 'medium' | 'low') {
    // Note: Since requirements is JSON, we need to filter in application code
    const allFields = await this.getProjectFields(projectId);
    
    return allFields.filter(field => {
      const requirements = field.requirements as unknown as FieldRequirements;
      return requirements.priority === priority;
    });
  }

  async getImageToImageChain(fieldId: string) {
    const field = await this.getField(fieldId);
    if (!field) return null;

    const chain = [];
    let currentField = field;

    // Go up the chain to find the root
    while (currentField.sourceField) {
      currentField = await this.getField(currentField.sourceField.id) || currentField;
      chain.unshift(currentField);
    }

    // Add the current field
    chain.push(field);

    // Add all derived fields
    const addDerivedFields = async (parentField: Record<string, unknown>) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const derivedFields = parentField.derivedFields as any[];
      if (Array.isArray(derivedFields)) {
        for (const derivedField of derivedFields) {
          const fullDerivedField = await this.getField(derivedField.id);
          if (fullDerivedField) {
            chain.push(fullDerivedField);
            await addDerivedFields(fullDerivedField);
          }
        }
      }
    };

    await addDerivedFields(field);

    return chain;
  }

  async getProjectStatistics(projectId: string) {
    const fields = await this.getProjectFields(projectId);
    
    const stats = {
      totalFields: fields.length,
      fieldsByPriority: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      },
      fieldsByAssetType: {} as Record<string, number>,
      totalPrompts: 0,
      totalImages: 0,
      fieldsWithPrompts: 0,
      fieldsWithImages: 0,
      imageToImageFields: 0,
      estimatedCost: 0
    };

    for (const field of fields) {
      const requirements = field.requirements as unknown as FieldRequirements;
      stats.fieldsByPriority[requirements.priority]++;
      
      const assetTypeName = field.assetType.name;
      stats.fieldsByAssetType[assetTypeName] = (stats.fieldsByAssetType[assetTypeName] || 0) + 1;
      
      stats.totalPrompts += field.prompts.length;
      
      if (field.prompts.length > 0) {
        stats.fieldsWithPrompts++;
      }
      
      for (const prompt of field.prompts) {
        stats.totalImages += prompt.images.length;
        if (prompt.estimatedCost) {
          stats.estimatedCost += prompt.estimatedCost;
        }
      }
      
      if (field.prompts.some(p => p.images.length > 0)) {
        stats.fieldsWithImages++;
      }
      
      if (field.isImageToImage) {
        stats.imageToImageFields++;
      }
    }

    return stats;
  }

  async reorderFields(projectId: string, fieldOrders: { fieldId: string; order: number }[]) {
    // Update the created timestamp to reflect new order
    for (const { fieldId, order } of fieldOrders) {
      const baseTime = new Date('2000-01-01T00:00:00Z').getTime();
      const newTime = new Date(baseTime + (order * 1000));
      
      await prisma.projectField.update({
        where: { id: fieldId },
        data: {
          createdAt: newTime
        }
      });
    }
  }

  async generateSuggestedFields(projectType: string) {
    // This would use AI to suggest fields based on project type and description
    // For now, return predefined suggestions based on project type
    const suggestions = this.getDefaultFieldsForProjectType(projectType);
    
    return suggestions;
  }

  private getDefaultFieldsForProjectType(projectType: string): CreateFieldData[] {
    const baseFields: Record<string, CreateFieldData[]> = {
      'e-commerce': [
        {
          name: 'Hero Banner',
          description: 'Main homepage banner showcasing key products',
          assetTypeId: 'hero-banner',
          requirements: {
            quantity: 3,
            variations: 2,
            priority: 'critical'
          },
          isImageToImage: false
        },
        {
          name: 'Product Photos',
          description: 'Professional product photography',
          assetTypeId: 'product-shot',
          requirements: {
            quantity: 10,
            variations: 3,
            priority: 'high'
          },
          isImageToImage: false
        },
        {
          name: 'Category Banners',
          description: 'Banners for different product categories',
          assetTypeId: 'hero-banner',
          requirements: {
            quantity: 5,
            variations: 1,
            priority: 'medium'
          },
          isImageToImage: false
        }
      ],
      'saas': [
        {
          name: 'Hero Section',
          description: 'Landing page hero showcasing the product',
          assetTypeId: 'hero-banner',
          requirements: {
            quantity: 2,
            variations: 3,
            priority: 'critical'
          },
          isImageToImage: false
        },
        {
          name: 'Feature Illustrations',
          description: 'UI illustrations explaining key features',
          assetTypeId: 'ui-illustration',
          requirements: {
            quantity: 6,
            variations: 2,
            priority: 'high'
          },
          isImageToImage: false
        },
        {
          name: 'Team Photos',
          description: 'Professional team member photos',
          assetTypeId: 'profile-picture',
          requirements: {
            quantity: 8,
            variations: 1,
            priority: 'medium'
          },
          isImageToImage: false
        }
      ],
      'portfolio': [
        {
          name: 'Portfolio Showcase',
          description: 'Gallery images showcasing work',
          assetTypeId: 'gallery-image',
          requirements: {
            quantity: 15,
            variations: 2,
            priority: 'high'
          },
          isImageToImage: false
        },
        {
          name: 'Profile Photo',
          description: 'Professional headshot',
          assetTypeId: 'profile-picture',
          requirements: {
            quantity: 1,
            variations: 3,
            priority: 'critical'
          },
          isImageToImage: false
        }
      ]
    };

    return baseFields[projectType] || [];
  }
}

export default ProjectFieldManager;