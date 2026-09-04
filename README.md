# DreamHome Agent

AI-powered, WebMCP-enabled real estate discovery platform where humans and AI agents work together to find, compare, and evaluate homes.

## 🚀 Overview

DreamHome Agent lets users describe their ideal home in natural language. An AI agent then uses structured WebMCP tools to search properties, analyze options, and perform supported actions.

The goal is to make real-estate discovery faster, more intelligent, and more agent-friendly while keeping humans in control of important decisions.

## ✨ Features

- 🔎 Natural-language property search
- 🏠 Property details and matching
- ⚖️ Compare multiple properties
- 💰 Affordability and mortgage calculations
- 📍 Nearby amenities and neighborhood discovery
- 🗺️ OpenStreetMap + Leaflet map integration
- ❤️ Save and retrieve favorite properties
- 📅 Request property viewings
- 📩 Seller contact with human approval
- 🤖 AI-powered agent workflow
- 🔌 WebMCP tool integration
- 🔐 Human-in-the-loop safety for consequential actions

## 🧩 WebMCP

WebMCP is the core of DreamHome Agent.

Instead of requiring an AI agent to guess how to navigate the website, DreamHome Agent exposes structured tools through the WebMCP API.

Example:

```javascript
document.modelContext.registerTool({
  name: "search_homes",
  description: "Search available properties based on user requirements",
  inputSchema: {
    // structured input schema
  },
  execute: async (input) => {
    // execute property search
WebMCP Tools
DreamHome Agent provides tools for:
search_homes
get_property_details
compare_properties
search_neighborhood
calculate_affordability
save_property
get_saved_properties
create_viewing_request
contact_seller
get_user_preferences
For sensitive actions such as contacting a seller, the agent requires human approval before completing the action.
🛠️ Built With
TypeScript
React
Vite
Node.js
Express
Google Gemini
WebMCP
PostgreSQL
Drizzle ORM
OpenStreetMap
Leaflet
Zod
💻 Getting Started
1. Clone the repository
git clone https://github.com/AyeshaAshrafChandio/dreamhome_agent.git


cd dreamhome-agent
2. Install dependencies
npm install
3. Configure environment variables
Create a .env file and add the required environment variables.
Never commit API keys, passwords, database credentials, or other secrets to the repository.
4. Run the development server
npm run dev
🧪 Testing WebMCP
For Chrome WebMCP testing:
Open Google Chrome.
Go to:
chrome://flags/#enable-webmcp-testing
Enable WebMCP testing.
Relaunch Chrome.
Open the deployed DreamHome Agent application.
Try prompts such as:
Find modern 3-bedroom homes in Austin under $700,000 with parking.
Compare the top three properties.
Save property #1 to my favorites.
Contact the seller for the best match.
The final seller-contact action requires human approval.
🎯 Hackathon
Built for The WebMCP Challenge.
DreamHome Agent explores how web applications can become more useful when humans and AI agents can interact with the same structured capabilities.
👤 Creator
Hasnain — Solo Creator
Concept, product planning, development, WebMCP integration, AI-agent workflows, testing, and project submission.
📄 License
This project is open source under the MIT License.
  }
});
