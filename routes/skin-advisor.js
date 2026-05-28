const express = require('express');

const router = express.Router();

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const SYSTEM_TEXT_ONLY =
  "You are a professional skincare consultant for FloreceS. Analyze the user's skin concern and respond with: 1. A brief skin assessment (2-3 sentences). 2. 3 specific product recommendations (cleanser, treatment, moisturizer) with reasons. 3. A simple morning + night routine suggestion. Keep responses warm, concise, and encouraging. Format using clear sections with emoji headers.";

const SYSTEM_TEXT_IMAGE =
  "You are a professional skincare consultant for FloreceS. Analyze the user's skin concern and/or uploaded skin photo and respond with: 1. A brief skin assessment (2-3 sentences). 2. 3 specific product recommendations (cleanser, treatment, moisturizer) with reasons. 3. A simple morning + night routine suggestion. Keep responses warm, concise, and encouraging. Format using clear sections with emoji headers.";

function buildRequestBody({ text, hasImage, imageBase64, mimeType }) {
  const systemText = hasImage ? SYSTEM_TEXT_IMAGE : SYSTEM_TEXT_ONLY;
  const parts = [];

  if (hasImage && imageBase64) {
    parts.push({
      inline_data: {
        mime_type: mimeType || 'image/jpeg',
        data: imageBase64
      }
    });
  }

  parts.push({ text: text || 'Please analyze my skin and suggest a routine.' });

  return {
    system_instruction: {
      parts: [{ text: systemText }]
    },
    contents: [
      {
        role: 'user',
        parts
      }
    ]
  };
}

function extractReply(data) {
  if (!data.candidates || !data.candidates.length) {
    const blockReason =
      data.promptFeedback?.blockReason ||
      data.promptFeedback?.safetyRatings?.[0]?.category;
    return {
      error: blockReason
        ? `Your request could not be processed (${blockReason}). Try a different photo or description.`
        : 'No response was generated. The image may have been blocked — try another photo or add more text.'
    };
  }

  const parts = data.candidates[0]?.content?.parts;
  if (!parts || !parts.length || !parts[0].text) {
    return { error: 'The advisor returned an empty response. Please try again.' };
  }

  return { reply: parts[0].text };
}

router.post('/', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: 'Skin Advisor is not configured. Set GEMINI_API_KEY in your .env file.'
    });
  }

  const { text, hasImage, imageBase64, mimeType } = req.body || {};
  const trimmedText = typeof text === 'string' ? text.trim() : '';
  const imageProvided = Boolean(hasImage && imageBase64);

  if (!trimmedText && !imageProvided) {
    return res.status(400).json({
      error: 'Please provide a message or upload a skin photo.'
    });
  }

  const allowedMime = ['image/jpeg', 'image/png', 'image/webp'];
  if (imageProvided && mimeType && !allowedMime.includes(mimeType)) {
    return res.status(400).json({ error: 'Image must be JPG, PNG, or WEBP.' });
  }

  const body = buildRequestBody({
    text: trimmedText,
    hasImage: imageProvided,
    imageBase64,
    mimeType
  });

  try {
    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      const message =
        data.error?.message || data.message || 'Gemini API request failed.';
      return res.status(response.status >= 500 ? 502 : 400).json({ error: message });
    }

    const result = extractReply(data);
    if (result.error) {
      return res.status(422).json({ error: result.error });
    }

    return res.json({ reply: result.reply });
  } catch (err) {
    console.error('Skin Advisor error:', err.message);
    return res.status(500).json({
      error: 'Unable to reach the AI service. Please try again shortly.'
    });
  }
});

module.exports = router;
