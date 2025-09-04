'use server'

import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function generatePromptVariations(
  basePrompt: string,
  instructions: string,
  count: number
): Promise<{ success: boolean; variations?: string[]; error?: string }> {
  try {
    // Validate inputs
    if (!basePrompt || !instructions || count < 1) {
      return {
        success: false,
        error: 'Base prompt, instructions, and count are required'
      }
    }

    if (!process.env.OPENAI_API_KEY) {
      return {
        success: false,
        error: 'OpenAI API key not configured'
      }
    }

    // Create the prompt for GPT-4
    const systemPrompt = `You are a creative AI assistant that generates image prompt variations. 
Your task is to take a base image prompt and create variations following specific instructions.

Rules:
1. Generate exactly ${count} unique variations
2. Each variation should be a complete, descriptive image prompt
3. Follow the variation instructions precisely
4. Maintain the core essence of the base prompt while adding the requested variations
5. Return only the variations, one per line
6. Do not include numbering or bullet points
7. Each variation should be suitable for AI image generation`

    const userPrompt = `Base prompt: "${basePrompt}"

Instructions: "${instructions}"

Generate exactly ${count} variations:`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8, // Higher temperature for more creativity
      max_tokens: 1000
    })

    const response = completion.choices[0]?.message?.content

    if (!response) {
      return {
        success: false,
        error: 'No response from OpenAI'
      }
    }

    // Parse the response into individual variations
    const variations = response
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .slice(0, count) // Ensure we don't exceed the requested count

    // If we didn't get enough variations, pad with the base prompt
    while (variations.length < count) {
      variations.push(`${basePrompt} (variation ${variations.length + 1})`)
    }

    return {
      success: true,
      variations
    }

  } catch (error) {
    console.error('Error generating prompt variations:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate variations'
    }
  }
}