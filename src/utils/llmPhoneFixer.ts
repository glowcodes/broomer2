export async function getLLMPhoneSuggestion(
  phoneNumber: string,
  apiKey: string
): Promise<string | null> {
  const prompt = `
You are an expert Kenyan phone number correction engine.
You will be given a raw phone number that may contain human errors.

Your job:
1. Analyse it.
2. Auto-correct it to the MOST LIKELY valid Kenyan mobile number format.
3. If multiple interpretations are possible, choose the simplest plausible one.
4. If it CANNOT be fixed into a valid number, return "INVALID".

Valid outputs must be ONLY one of the following formats and only have 13 characters:
- +2547XXXXXXXX
- +2541XXXXXXXX

Common mistakes you must fix:
- Double format numbers: +25470712345690 → +254707123456
- Country code + local appended: 2540707123456 → +254707123456
- Extra zeros: 00707123456 → +254707123456
- Missing zero: 712345678 → +254712345678
- Repeated country codes: 254254707123456
- Concatenated numbers: 07071234560707123456 → pick the first valid block
- Spaces, symbols, garbage characters

Only provide suggestions for mistakes that can be confidently categorized 
as human errors and that be fixed to be valid Kenyan numbers
Don't autofill
Return ONLY the corrected phone number (no explanations).

Here is the raw input:
"${phoneNumber}"
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 50
      })
    });

    if (!response.ok) {
      console.error('LLM API error:', response.status);
      return null;
    }

    const data = await response.json();
    const suggestion = data.choices[0]?.message?.content?.trim();
    
    if (!suggestion || suggestion === 'INVALID') {
      return null;
    }

    // Validate the suggestion format
    if (suggestion.length === 13 && (suggestion.startsWith('+2547') || suggestion.startsWith('+2541'))) {
      return suggestion;
    }

    return null;
  } catch (error) {
    console.error('Error calling LLM:', error);
    return null;
  }
}
