import ModelManager from './modelManager';
import AssetTypeManager from './assetTypeManager';
import TagLibrary from './tagLibrary';

export class ServiceInitializer {
  private static initialized = false;

  static async initialize() {
    if (ServiceInitializer.initialized) {
      return;
    }

    console.log('🚀 Initializing Asset Generator Services...');

    try {
      // Initialize AI Model Manager
      console.log('📦 Setting up AI models...');
      const modelManager = ModelManager.getInstance();
      await modelManager.initialize();

      // Initialize Asset Type Manager
      console.log('🎨 Setting up asset types...');
      const assetTypeManager = AssetTypeManager.getInstance();
      await assetTypeManager.initialize();

      // Initialize Tag Library
      console.log('🏷️  Setting up tag library...');
      const tagLibrary = TagLibrary.getInstance();
      await tagLibrary.initialize();

      ServiceInitializer.initialized = true;
      console.log('✅ All services initialized successfully!');

    } catch (error) {
      console.error('❌ Failed to initialize services:', error);
      throw error;
    }
  }

  static async reset() {
    ServiceInitializer.initialized = false;
    await ServiceInitializer.initialize();
  }

  static isInitialized() {
    return ServiceInitializer.initialized;
  }
}

export default ServiceInitializer;