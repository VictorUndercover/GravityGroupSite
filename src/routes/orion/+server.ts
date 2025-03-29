import type { RequestHandler } from '@sveltejs/kit';
import OpenAI from 'openai';
// import { OPENAI_API_KEY } from '$env/static/private';

const openai = new OpenAI({
  apiKey: 'sk-dummy-api-key-for-build-only',
});

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { message } = await request.json();

    if (!message) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: message }],
      max_tokens: 300,
    });

    return new Response(
      JSON.stringify({ response: completion.choices[0].message.content }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    return new Response(
      JSON.stringify({ error: "OpenAI API error" }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}; 