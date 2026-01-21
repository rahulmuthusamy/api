const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.APIKEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// --- Generate Task List from User Goal ---
async function generateTask(req, res) {
    const { goal } = req.body;

    if (!goal) {
        return res.status(400).json({ error: 'Goal is required.' });
    }

    try {
        const prompt = `Break down the following high-level goal into 5-7 actionable to-do list items,
      and assign a priority (High, Medium, Low) to each.
      Respond only with a JSON array of objects, like this:
      [
        { "task": "Example Task 1", "priority": "High" },
        { "task": "Example Task 2", "priority": "Medium" }
      ]

      Goal: ${goal}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const parsedTasks = JSON.parse(text.replace(/```json|```/g, '').trim());
        res.json(parsedTasks);

    } catch (error) {
        console.error('Error generating tasks with Gemini:', error);
        res.status(500).json({ error: 'Failed to generate tasks using AI.' });
    }
}

// --- Generate Form Schema Dynamically from Goal ---
async function generateFormSchemaController(req, res) {
    const { userGoal } = req.body;

    if (!userGoal) {
        return res.status(400).json({ error: 'User goal is required.' });
    }

    try {
        const schema = await generateFormSchema(userGoal);
        res.json(schema);
    } catch (error) {
        console.error('Error generating form schema:', error);
        res.status(500).json({ error: error.message });
    }
}

// --- Simulated Form Submission Handler ---
function dynamicFormSave(req, res) {
    const { formName, formData } = req.body;

    if (!formName || !formData) {
        return res.status(400).json({ error: 'Form name and data are required.' });
    }

    console.log('\n--- Received Form Submission ---');
    console.log(`Form Name: ${formName}`);
    console.log('Submitted Data:', JSON.stringify(formData, null, 2));
    console.log('--------------------------------');

    res.status(200).json({ message: 'Form data received (not saved).' });
}

// --- Helper: Generate Form Schema ---
async function generateFormSchema(userGoal) {
    const prompt = `
    The user wants to create a form for: "${userGoal}".
    Based on this goal, generate a JSON object that describes the necessary form fields.
    Each field should have:
    - 'id' (camelCase unique string)
    - 'label' (human-readable string)
    - 'type' (e.g., 'text', 'number', 'email', 'date', 'textarea', 'select', 'checkbox')
    - 'required' (boolean)
    - 'placeholder' (optional string)
    - 'options' (array of strings, only for 'select' type)
    - 'validators' (optional array of strings, e.g., 'email', 'min:X', 'max:Y', 'minLength:Z', 'maxLength:W', 'pastDate', 'futureDate').

    Provide a concise and accurate JSON response, suitable for direct parsing by a frontend application.

    Now, generate the JSON for: "${userGoal}"
    Only return the JSON object.
  `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Remove Markdown and extract JSON
    text = text.replace(/```json|```/g, '').trim();
    const startIndex = text.indexOf('{');
    const endIndex = text.lastIndexOf('}');
    if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
        throw new Error('Could not parse valid JSON object from AI response.');
    }

    const jsonString = text.substring(startIndex, endIndex + 1);
    return JSON.parse(jsonString);
}

const sessions = {}; // session-based memory (can use Redis or DB later)

const chatWithGemini = async (req, res) => {
    const { sessionId, userMessage } = req.body;

    if (!userMessage || !sessionId) {
        return res.status(400).json({ error: 'sessionId and userMessage are required' });
    }

    try {
        const prevHistory = sessions[sessionId] || [];

        const chat = model.startChat({ history: prevHistory });

        const result = await chat.sendMessage(userMessage);
        const response = await result.response;
        const reply = await response.text();

        // Update history
        prevHistory.push({ role: 'user', parts: userMessage });
        prevHistory.push({ role: 'model', parts: reply });
        sessions[sessionId] = prevHistory;

        res.json({ reply });
    } catch (error) {
        console.error('Gemini API Error:', error);
        res.status(500).json({ error: 'Failed to get response from Gemini' });
    }
};


// --- Export Routes for Use in Express Router ---
module.exports = {
    generateTask,
    generateFormSchemaController,
    dynamicFormSave,
    chatWithGemini
};
