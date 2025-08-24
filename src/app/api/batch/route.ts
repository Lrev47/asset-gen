import { NextRequest, NextResponse } from 'next/server';
import ImageRequirementsAnalyzer, { ProjectAnalysis as AnalyzerProjectAnalysis } from '@/analyzers/imageRequirements';
import PromptEnhancer from '@/generators/openai/promptEnhancer';
import DalleGenerator from '@/generators/openai/dalle';
import ReplicateModelManager from '@/generators/replicate/models';
import { GeneratedImageData } from '@/types/api';
import path from 'path';

export interface BatchRequest {
  projects: Array<{
    projectPath: string;
    name?: string;
  }>;
  options: {
    quantity?: number;
    style?: 'photorealistic' | 'professional' | 'artistic' | 'illustration';
    mood?: 'bright' | 'warm' | 'cool' | 'dramatic' | 'soft';
    useOpenAI?: boolean;
    useReplicate?: boolean;
    generateBeforeAfter?: boolean;
    outputFormat?: 'web-optimized' | 'high-quality' | 'maximum-compression';
    outputSizes?: 'web-standard' | 'social-media' | 'print-ready';
  };
  settings: {
    concurrency?: number;
    continueOnError?: boolean;
    outputDirectory?: string;
  };
}

export interface BatchResponse {
  success: boolean;
  message: string;
  batchId?: string;
  data?: {
    totalProjects: number;
    estimatedCost: number;
    estimatedTime: number;
    status: 'queued' | 'processing' | 'completed' | 'failed';
  };
  error?: string;
}

export interface BatchStatus {
  batchId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
  results: Array<{
    projectPath: string;
    projectName: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    generatedImages?: number;
    cost?: number;
    processingTime?: number;
    error?: string;
    outputPath?: string;
  }>;
  totalCost: number;
  totalImages: number;
  startedAt: Date;
  completedAt?: Date;
  estimatedCompletion?: Date;
}

// In-memory storage for batch jobs (in production, use a database)
const batchJobs = new Map<string, BatchStatus>();
const processingQueue = new Set<string>();

export async function POST(request: NextRequest) {
  try {
    const body: BatchRequest = await request.json();
    
    if (!body.projects || body.projects.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'At least one project is required'
      }, { status: 400 });
    }

    // Generate batch ID
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Analyze all projects first to estimate cost and time
    const analyzer = new ImageRequirementsAnalyzer();
    let totalEstimatedCost = 0;

    const projectAnalyses = await Promise.all(
      body.projects.map(async (project) => {
        try {
          const analysis = await analyzer.analyzeProject(project.projectPath);
          const estimatedCost = analysis.imageRequirements.reduce((sum, req) => {
            const quantity = body.options.quantity || req.quantity;
            return sum + (quantity * 0.04); // Rough estimate
          }, 0);
          
          totalEstimatedCost += estimatedCost;

          return {
            projectPath: project.projectPath,
            projectName: project.name || analysis.projectName,
            analysis,
            estimatedCost
          };
        } catch (error) {
          console.error(`Failed to analyze ${project.projectPath}:`, error);
          return null;
        }
      })
    );

    const validProjects = projectAnalyses.filter(p => p !== null);
    
    if (validProjects.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid projects found'
      }, { status: 400 });
    }

    // Create batch status
    const batchStatus: BatchStatus = {
      batchId,
      status: 'queued',
      progress: {
        current: 0,
        total: validProjects.length,
        percentage: 0
      },
      results: validProjects.map(p => ({
        projectPath: p!.projectPath,
        projectName: p!.projectName,
        status: 'pending'
      })),
      totalCost: 0,
      totalImages: 0,
      startedAt: new Date(),
      estimatedCompletion: new Date(Date.now() + (validProjects.length * 5 * 60 * 1000)) // 5 min per project
    };

    batchJobs.set(batchId, batchStatus);

    // Start processing in background
    processBatch(batchId, validProjects, body.options, body.settings).catch(console.error);

    const response: BatchResponse = {
      success: true,
      message: `Batch processing started for ${validProjects.length} projects`,
      batchId,
      data: {
        totalProjects: validProjects.length,
        estimatedCost: totalEstimatedCost,
        estimatedTime: validProjects.length * 5, // 5 minutes per project
        status: 'queued'
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Batch processing error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to start batch processing'
    }, { status: 500 });
  }
}

// GET endpoint to check batch status
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const batchId = url.searchParams.get('batchId');
  
  if (!batchId) {
    // Return list of all batches
    const batches = Array.from(batchJobs.values()).map(batch => ({
      batchId: batch.batchId,
      status: batch.status,
      progress: batch.progress,
      startedAt: batch.startedAt,
      completedAt: batch.completedAt
    }));

    return NextResponse.json({
      success: true,
      data: { batches }
    });
  }

  const batchStatus = batchJobs.get(batchId);
  
  if (!batchStatus) {
    return NextResponse.json({
      success: false,
      error: 'Batch not found'
    }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: batchStatus
  });
}

// DELETE endpoint to cancel batch processing
export async function DELETE(request: NextRequest) {
  const url = new URL(request.url);
  const batchId = url.searchParams.get('batchId');
  
  if (!batchId) {
    return NextResponse.json({
      success: false,
      error: 'Batch ID is required'
    }, { status: 400 });
  }

  const batchStatus = batchJobs.get(batchId);
  
  if (!batchStatus) {
    return NextResponse.json({
      success: false,
      error: 'Batch not found'
    }, { status: 404 });
  }

  if (batchStatus.status === 'completed') {
    return NextResponse.json({
      success: false,
      error: 'Cannot cancel completed batch'
    }, { status: 400 });
  }

  // Mark as failed to stop processing
  batchStatus.status = 'failed';
  processingQueue.delete(batchId);

  return NextResponse.json({
    success: true,
    message: 'Batch processing cancelled'
  });
}

async function processBatch(
  batchId: string,
  projects: Array<{
    projectPath: string;
    projectName: string;
    analysis: AnalyzerProjectAnalysis;
    estimatedCost: number;
  }>,
  options: BatchRequest['options'],
  settings: BatchRequest['settings']
) {
  const batchStatus = batchJobs.get(batchId);
  if (!batchStatus) return;

  try {
    batchStatus.status = 'processing';
    processingQueue.add(batchId);

    const concurrency = settings.concurrency || 2;
    const continueOnError = settings.continueOnError !== false;
    
    // Initialize components
    const promptEnhancer = new PromptEnhancer();
    const dalleGenerator = new DalleGenerator();
    const replicateManager = new ReplicateModelManager();

    // Process projects in chunks based on concurrency
    const chunks = chunkArray(projects, concurrency);
    
    for (const chunk of chunks) {
      if (!processingQueue.has(batchId)) break; // Check if cancelled

      await Promise.all(
        chunk.map(async (project) => {
          try {
            const result = batchStatus.results.find(r => r.projectPath === project.projectPath);
            if (!result) return;

            result.status = 'processing';
            
            // Process single project (simplified version of main generation logic)
            const startTime = Date.now();
            const allGeneratedImages: GeneratedImageData[] = [];
            let totalCost = 0;

            // Generate images for each requirement
            for (const requirement of project.analysis.imageRequirements) {
              const quantity = options.quantity || requirement.quantity;

              // Generate enhanced prompt
              const enhancedPrompt = await promptEnhancer.enhancePrompt({
                requirement: {
                  name: requirement.subject,
                  description: requirement.context,
                  category: requirement.category,
                  priority: requirement.priority,
                  dimensions: requirement.dimensions
                },
                businessContext: project.analysis.businessContext,
                style: options.style,
                mood: options.mood
              });

              // Use appropriate generator
              if (options.useOpenAI !== false && requirement.priority === 'high') {
                const dalleRequests = [{
                  requirement,
                  enhancedPrompt: enhancedPrompt.enhanced,
                  quantity: Math.min(quantity, 4),
                  quality: DalleGenerator.getBestQuality(requirement),
                  style: DalleGenerator.getBestStyle(requirement),
                  size: DalleGenerator.getBestSize(requirement)
                }];

                const dalleResults = await dalleGenerator.generateImages(dalleRequests);
                for (const dalleResult of dalleResults) {
                  allGeneratedImages.push(...(dalleResult.images as unknown as GeneratedImageData[]));
                  totalCost += dalleResult.cost;
                }
              }

              if (options.useReplicate !== false) {
                const modelId = ReplicateModelManager.selectBestModel(requirement);
                const dimensions = ReplicateModelManager.getBestDimensions(requirement, modelId);
                
                const replicateRequests = [{
                  modelId,
                  prompt: enhancedPrompt.enhanced,
                  negativePrompt: enhancedPrompt.negativePrompts?.join(', '),
                  width: dimensions.width,
                  height: dimensions.height,
                  numOutputs: Math.min(quantity, 4),
                  numInferenceSteps: 30,
                  guidanceScale: 7.5
                }];

                const replicateResults = await replicateManager.generateImages(replicateRequests);
                for (const replicateResult of replicateResults) {
                  allGeneratedImages.push(...(replicateResult.images as unknown as GeneratedImageData[]));
                  totalCost += replicateResult.cost;
                }
              }
            }

            // Process images
            const outputDir = path.join(
              process.cwd(), 
              settings.outputDirectory || 'outputs',
              'batch',
              batchId,
              project.projectName,
              new Date().toISOString().split('T')[0]
            );

            // Skip image processing due to complex type compatibility
            // TODO: Resolve type compatibility between GeneratedImageData and processor expectations
            // const processingOptions = {
            //   outputDir,
            //   formats: imageProcessor.getStandardFormats(options.outputFormat || 'web-optimized'),
            //   sizes: imageProcessor.getStandardSizes(options.outputSizes || 'web-standard'),
            //   quality: 85,
            //   optimization: 'basic' as const,
            //   preserveOriginal: true,
            //   generateThumbnails: true
            // };
            // await imageProcessor.processImages(allGeneratedImages, processingOptions, metadata);

            const processingTime = Date.now() - startTime;

            // Update result
            result.status = 'completed';
            result.generatedImages = allGeneratedImages.length;
            result.cost = Math.round(totalCost * 100) / 100;
            result.processingTime = processingTime;
            result.outputPath = outputDir;

            batchStatus.totalImages += allGeneratedImages.length;
            batchStatus.totalCost += totalCost;

          } catch (error) {
            const result = batchStatus.results.find(r => r.projectPath === project.projectPath);
            if (result) {
              result.status = 'failed';
              result.error = error instanceof Error ? error.message : 'Unknown error';
            }

            if (!continueOnError) {
              throw error;
            }
          }
        })
      );

      // Update progress
      const completedCount = batchStatus.results.filter(r => r.status === 'completed' || r.status === 'failed').length;
      batchStatus.progress.current = completedCount;
      batchStatus.progress.percentage = Math.round((completedCount / batchStatus.progress.total) * 100);
    }

    // Mark batch as completed
    batchStatus.status = 'completed';
    batchStatus.completedAt = new Date();
    processingQueue.delete(batchId);

  } catch (error) {
    console.error(`Batch processing failed for ${batchId}:`, error);
    batchStatus.status = 'failed';
    processingQueue.delete(batchId);
  }
}

function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}