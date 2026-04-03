/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const latestQuestion = document.getElementById("latestQuestion");
const sendBtn = document.getElementById("sendBtn");

/* Config
   - Add CLOUDFLARE_WORKER_URL in secrets.js after deployment.
   - OPENAI_API_KEY is only for temporary local testing.
*/
const workerUrl =
  typeof CLOUDFLARE_WORKER_URL !== "undefined" ? CLOUDFLARE_WORKER_URL : "";
const openAiKey = typeof OPENAI_API_KEY !== "undefined" ? OPENAI_API_KEY : "";

/* Chatbot rules so the assistant stays on-topic */
const systemPrompt = `You are the L'Oreal Beauty Advisor.
Only answer questions about L'Oreal products, beauty routines, ingredients, shade matching, haircare, skincare, makeup, fragrance, and beauty recommendations.
If a question is outside beauty or unrelated to L'Oreal, politely refuse and redirect the user back to L'Oreal beauty help.
Be concise, friendly, and practical.
If the user has shared their name or preferences earlier in the chat, use that context naturally in your answer.`;

/* Conversation history keeps multi-turn context */
const messages = [{ role: "system", content: systemPrompt }];
let userName = "";

/* Simple keyword check to avoid unnecessary API calls for unrelated topics */
const beautyKeywords = [
  "loreal",
  "l'oreal",
  "product",
  "routine",
  "skincare",
  "makeup",
  "hair",
  "haircare",
  "fragrance",
  "beauty",
  "serum",
  "cleanser",
  "moisturizer",
  "foundation",
  "mascara",
  "shampoo",
  "conditioner",
  "spf",
  "sunscreen",
  "skin",
  "shade",
];

function isBeautyRelated(question) {
  const lowerQuestion = question.toLowerCase();
  return beautyKeywords.some((word) => lowerQuestion.includes(word));
}

function getPoliteRefusal() {
  return "I can help with L'Oreal beauty topics like skincare, makeup, haircare, fragrance, routines, and product recommendations. Please ask a beauty-related question.";
}

function addMessageToWindow(role, text) {
  const msg = document.createElement("div");
  msg.classList.add("msg", role);
  msg.textContent = text;
  chatWindow.appendChild(msg);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function updateLatestQuestion(questionText) {
  latestQuestion.textContent = `Latest question: ${questionText}`;
}

function storeNameIfProvided(question) {
  const nameMatch = question.match(
    /(?:my name is|i am|i'm)\s+([a-zA-Z][a-zA-Z\-\s']{1,30})/i,
  );
  if (nameMatch && nameMatch[1]) {
    userName = nameMatch[1].trim();
  }
}

async function sendToCloudflareWorker(messagesPayload) {
  const response = await fetch(workerUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages: messagesPayload }),
  });

  if (!response.ok) {
    throw new Error("Cloudflare Worker request failed.");
  }

  return response.json();
}

async function sendDirectlyToOpenAi(messagesPayload) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: messagesPayload,
      max_completion_tokens: 300,
    }),
  });

  if (!response.ok) {
    throw new Error("OpenAI API request failed.");
  }

  return response.json();
}

async function fetchAssistantReply(messagesPayload) {
  const canUseWorker = workerUrl && !workerUrl.includes("YOUR_WORKER_URL_HERE");

  if (canUseWorker) {
    return sendToCloudflareWorker(messagesPayload);
  }

  if (openAiKey && !openAiKey.includes("YOUR_OPENAI_API_KEY_HERE")) {
    return sendDirectlyToOpenAi(messagesPayload);
  }

  throw new Error(
    "Missing API config. Add CLOUDFLARE_WORKER_URL or OPENAI_API_KEY in secrets.js.",
  );
}

/* Initial assistant greeting */
addMessageToWindow(
  "ai",
  "Hello! I am your L'Oreal Beauty Advisor. Ask me about products, routines, or recommendations.",
);

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const question = userInput.value.trim();
  if (!question) {
    return;
  }

  updateLatestQuestion(question);
  addMessageToWindow("user", question);
  userInput.value = "";
  sendBtn.disabled = true;

  storeNameIfProvided(question);

  const userMessage = userName
    ? `${question}\n\nUser context: Their name is ${userName}.`
    : question;

  messages.push({ role: "user", content: userMessage });

  if (!isBeautyRelated(question)) {
    const refusal = getPoliteRefusal();
    messages.push({ role: "assistant", content: refusal });
    addMessageToWindow("ai", refusal);
    sendBtn.disabled = false;
    return;
  }

  try {
    const data = await fetchAssistantReply(messages);
    const reply = data.choices[0].message.content;

    messages.push({ role: "assistant", content: reply });
    addMessageToWindow("ai", reply);
  } catch (error) {
    addMessageToWindow(
      "ai",
      "I could not connect right now. Please check your Cloudflare Worker URL and API setup, then try again.",
    );
    console.error(error);
  } finally {
    sendBtn.disabled = false;
  }
});
