# Project 8: L'Oreal Chatbot

Build a branded L'Oreal beauty chatbot that can answer product questions, suggest routines, and provide recommendations while staying on-topic.

## What This Project Includes

- L'Oreal logo and branded visual styling
- Chat UI with user and assistant message bubbles
- Latest user question display above the chat
- Multi-turn conversation history (including user name context)
- Safety behavior for off-topic requests
- Cloudflare Worker integration to protect your API key

## 1) Branding + Font Direction

The page uses a black, gold, and ivory palette inspired by L'Oreal's premium brand identity.

For typography inspiration, review the Monotype case study:

- https://www.monotype.com/resources/case-studies/loreal

## 2) Create secrets.js for Local Testing

Create a local file named secrets.js in the project root. This file is already referenced in index.html.

It should look like this:

```js
const OPENAI_API_KEY = "YOUR_OPENAI_API_KEY_HERE";
const CLOUDFLARE_WORKER_URL = "YOUR_WORKER_URL_HERE";
```

Important:

- Use your real key temporarily for local testing.
- Keep this file out of public repos.
- After Cloudflare deployment, use the worker URL and no longer call OpenAI directly from the browser.

## 3) OpenAI Request Format

Use Chat Completions with a messages array and read the response from:

- data.choices[0].message.content

Model used in this project:

- gpt-4o

## 4) Cloudflare Worker Setup (Secure API Key)

1. Create a new Cloudflare Worker.
2. Paste the helper script from RESOURCE_cloudflare-worker.js.
3. In Worker settings, add a secret named OPENAI_API_KEY.
4. Deploy the worker.
5. Copy the worker URL and paste it into secrets.js as CLOUDFLARE_WORKER_URL.

The frontend now sends chat requests to the worker endpoint when the worker URL is configured.

## 5) Test Checklist

1. Ask a beauty-related question about L'Oreal products.
2. Ask an unrelated question (for example, about sports) and confirm it politely refuses.
3. Say: My name is Maya. Then ask another question and confirm context feels natural.
4. Confirm your latest question appears above the chat window.
5. Confirm messages appear as separate user/assistant bubbles.
