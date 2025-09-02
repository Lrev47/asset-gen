import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const tagData = [
  // IMAGE TAG CATEGORIES
  {
    category: {
      name: 'Composition',
      slug: 'composition',
      mediaTypes: ['image'],
      description: 'How elements are arranged in the frame',
      position: 1
    },
    tags: [
      { name: 'Rule of Thirds', slug: 'rule-of-thirds', value: 'rule of thirds composition' },
      { name: 'Centered', slug: 'centered', value: 'centered composition' },
      { name: 'Diagonal', slug: 'diagonal', value: 'diagonal composition' },
      { name: 'Symmetrical', slug: 'symmetrical', value: 'symmetrical composition' },
      { name: 'Off-Center', slug: 'off-center', value: 'off-center composition' },
      { name: 'Leading Lines', slug: 'leading-lines', value: 'leading lines composition' },
    ]
  },
  {
    category: {
      name: 'Aesthetic Style',
      slug: 'aesthetic',
      mediaTypes: ['image'],
      description: 'Overall visual style and approach',
      position: 2
    },
    tags: [
      { name: 'Minimalist', slug: 'minimalist', value: 'minimalist style' },
      { name: 'Maximalist', slug: 'maximalist', value: 'maximalist style' },
      { name: 'Vintage', slug: 'vintage', value: 'vintage aesthetic' },
      { name: 'Modern', slug: 'modern', value: 'modern aesthetic' },
      { name: 'Retro', slug: 'retro', value: 'retro style' },
      { name: 'Cyberpunk', slug: 'cyberpunk', value: 'cyberpunk aesthetic' },
      { name: 'Art Deco', slug: 'art-deco', value: 'art deco style' },
      { name: 'Bauhaus', slug: 'bauhaus', value: 'bauhaus style' },
    ]
  },
  {
    category: {
      name: 'Mood & Atmosphere',
      slug: 'mood',
      mediaTypes: ['image', 'video'],
      description: 'Emotional tone and feeling',
      position: 3
    },
    tags: [
      { name: 'Cheerful', slug: 'cheerful', value: 'cheerful mood' },
      { name: 'Melancholic', slug: 'melancholic', value: 'melancholic atmosphere' },
      { name: 'Dramatic', slug: 'dramatic', value: 'dramatic mood' },
      { name: 'Serene', slug: 'serene', value: 'serene atmosphere' },
      { name: 'Energetic', slug: 'energetic', value: 'energetic mood' },
      { name: 'Mysterious', slug: 'mysterious', value: 'mysterious atmosphere' },
      { name: 'Cozy', slug: 'cozy', value: 'cozy feeling' },
      { name: 'Professional', slug: 'professional', value: 'professional atmosphere' },
    ]
  },
  {
    category: {
      name: 'Lighting',
      slug: 'lighting',
      mediaTypes: ['image', 'video'],
      description: 'Light quality and direction',
      position: 4
    },
    tags: [
      { name: 'Golden Hour', slug: 'golden-hour', value: 'golden hour lighting' },
      { name: 'Studio Lighting', slug: 'studio-lighting', value: 'professional studio lighting' },
      { name: 'Natural Light', slug: 'natural-light', value: 'natural lighting' },
      { name: 'Neon', slug: 'neon', value: 'neon lighting' },
      { name: 'Dramatic Shadows', slug: 'dramatic-shadows', value: 'dramatic shadow lighting' },
      { name: 'Soft Light', slug: 'soft-light', value: 'soft diffused lighting' },
      { name: 'High Key', slug: 'high-key', value: 'high key lighting' },
      { name: 'Low Key', slug: 'low-key', value: 'low key lighting' },
    ]
  },
  {
    category: {
      name: 'Color Palette',
      slug: 'color',
      mediaTypes: ['image', 'video'],
      description: 'Color scheme and treatment',
      position: 5
    },
    tags: [
      { name: 'Monochrome', slug: 'monochrome', value: 'monochrome color scheme' },
      { name: 'Warm Colors', slug: 'warm-colors', value: 'warm color palette' },
      { name: 'Cool Colors', slug: 'cool-colors', value: 'cool color palette' },
      { name: 'Pastel', slug: 'pastel', value: 'pastel colors' },
      { name: 'Vibrant', slug: 'vibrant', value: 'vibrant colors' },
      { name: 'Desaturated', slug: 'desaturated', value: 'desaturated colors' },
      { name: 'High Contrast', slug: 'high-contrast', value: 'high contrast colors' },
    ]
  },
  
  // VIDEO TAG CATEGORIES
  {
    category: {
      name: 'Camera Shot',
      slug: 'camera-shot',
      mediaTypes: ['video'],
      description: 'Camera framing and angle',
      position: 6
    },
    tags: [
      { name: 'Wide Shot', slug: 'wide-shot', value: 'wide establishing shot' },
      { name: 'Close-Up', slug: 'close-up', value: 'close-up shot' },
      { name: 'Medium Shot', slug: 'medium-shot', value: 'medium shot' },
      { name: 'Tracking Shot', slug: 'tracking-shot', value: 'tracking camera movement' },
      { name: 'Aerial/Drone', slug: 'aerial-drone', value: 'aerial drone shot' },
      { name: 'POV', slug: 'pov', value: 'point of view shot' },
      { name: 'Low Angle', slug: 'low-angle', value: 'low angle shot' },
      { name: 'High Angle', slug: 'high-angle', value: 'high angle shot' },
    ]
  },
  {
    category: {
      name: 'Video Movement',
      slug: 'movement',
      mediaTypes: ['video'],
      description: 'Motion and camera movement',
      position: 7
    },
    tags: [
      { name: 'Slow Motion', slug: 'slow-motion', value: 'slow motion effect' },
      { name: 'Time-Lapse', slug: 'time-lapse', value: 'time-lapse photography' },
      { name: 'Handheld', slug: 'handheld', value: 'handheld camera movement' },
      { name: 'Smooth/Stabilized', slug: 'stabilized', value: 'smooth stabilized movement' },
      { name: 'Static', slug: 'static', value: 'static camera position' },
      { name: 'Pan', slug: 'pan', value: 'panning camera movement' },
      { name: 'Tilt', slug: 'tilt', value: 'tilting camera movement' },
    ]
  },
  
  // UNIVERSAL TAGS
  {
    category: {
      name: 'Quality & Detail',
      slug: 'quality',
      mediaTypes: ['image', 'video'],
      description: 'Technical quality specifications',
      position: 8
    },
    tags: [
      { name: 'Ultra HD', slug: 'ultra-hd', value: 'ultra high definition, 4K resolution' },
      { name: 'High Detail', slug: 'high-detail', value: 'highly detailed, sharp focus' },
      { name: 'Photorealistic', slug: 'photorealistic', value: 'photorealistic, lifelike' },
      { name: 'Artistic', slug: 'artistic', value: 'artistic interpretation' },
      { name: 'Clean', slug: 'clean', value: 'clean, polished look' },
      { name: 'Textured', slug: 'textured', value: 'rich textures and materials' },
    ]
  }
]

async function seedTags() {
  console.log('🌱 Seeding tag system...')
  
  try {
    for (const categoryData of tagData) {
      // Create category
      const category = await prisma.tagCategory.create({
        data: categoryData.category
      })
      
      console.log(`📁 Created category: ${category.name}`)
      
      // Create tags for this category
      for (let i = 0; i < categoryData.tags.length; i++) {
        const tagData = categoryData.tags[i]
        if (!tagData) continue
        
        await prisma.tag.create({
          data: {
            name: tagData.name,
            slug: tagData.slug,
            value: tagData.value,
            mediaTypes: category.mediaTypes,
            position: i + 1,
            categoryId: category.id
          }
        })
      }
      
      console.log(`   ✅ Added ${categoryData.tags.length} tags`)
    }
    
    const totalCategories = await prisma.tagCategory.count()
    const totalTags = await prisma.tag.count()
    
    console.log(`\n🎉 Tag system seeded successfully!`)
    console.log(`📊 Created ${totalCategories} categories and ${totalTags} tags`)
    
  } catch (error) {
    console.error('❌ Error seeding tags:', error)
    throw error
  }
}

// Run the seed function
seedTags()
  .then(() => {
    console.log('✅ Seeding completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })