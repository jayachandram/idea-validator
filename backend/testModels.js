// Replace with your actual Gemini API key
const API_KEY = "AIzaSyCx3QPURdxJDtsNI3aqTk_dTsNR_6mf9OE";

async function listModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        console.log("✅ Models available to your API key:\n");

        // Filter and print only the model names and their supported generation methods
        data.models.forEach(model => {
            console.log(`Model Name: ${model.name}`);
            console.log(`Supported Methods: ${model.supportedGenerationMethods.join(", ")}`);
            console.log("---");
        });

    } catch (error) {
        console.error("❌ Error fetching models:", error);
    }
}

listModels();