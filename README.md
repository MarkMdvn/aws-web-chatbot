# Embeddable AI Web Chatbot Assistant

<img src="https://github.com/MarkMdvn/aws-web-chatbot/blob/main/docs/assets/3-both-cases.jpg" alt="Overview" width="700"/>


## Project Overview

This repository contains the source code for a reusable, full-stack AI Chatbot Assistant, designed to be easily embedded into any website. The project manifests as a familiar chat bubble in the bottom-right corner of the screen, providing visitors with an intuitive way to ask questions and receive context-aware answers about the webpage's content.

The architecture is built for scalability and ease of deployment, combining a modern Next.js frontend with a serverless Python backend on AWS. The core intelligence is powered by the **OpenAI Assistants API**, allowing for sophisticated, stateful conversations. This project serves as a template for creating and deploying specialized chatbots that can be configured with a unique OpenAI Assistant ID and deployed seamlessly to cloud platforms like AWS Amplify.

<img src="https://github.com/MarkMdvn/aws-web-chatbot/blob/main/docs/assets/1-example-alcamancha.png" alt="Overview" width="700"/>


## System Architecture

The application operates on a serverless model, ensuring a cost-effective and highly scalable solution. The data flow is orchestrated to handle conversational context:

1.  **Frontend (Next.js):** A visitor on the host website clicks the chat bubble and sends a message. The Next.js component captures the message and calls a secure backend endpoint.
2.  **API Gateway:** Amazon API Gateway receives the request and triggers the AWS Lambda function, acting as a secure proxy.
3.  **AWS Lambda (Python):** This function serves as the orchestrator. It receives the user's message and the conversation thread ID (if one exists). It then interacts with the specified **OpenAI Assistant** using the official API, passing the message to the correct thread.
4.  **OpenAI Assistants API:** OpenAI manages the conversation thread, loads the necessary context, and generates a relevant response using the pre-configured Assistant.
5.  **Return Flow:** The response is sent back to the Lambda function, then through API Gateway to the Next.js frontend. The chat UI updates in real-time, displaying the assistant's answer.

<img src="https://github.com/MarkMdvn/aws-web-chatbot/blob/main/docs/assets/2-example-epoint.png" alt="Overview" width="700"/>


## Technology Stack

### Frontend

  * **Framework:** Next.js / React
  * **Language:** TypeScript
  * **Styling:** Tailwind CSS
  * **State Management:** React Hooks

### Backend

  * **Cloud Provider:** Amazon Web Services (AWS)
  * **Serverless Compute:** AWS Lambda (Python 3.x runtime)
  * **API Layer:** Amazon API Gateway
  * **Core Logic:** Python

### AI Integration

  * **Service:** OpenAI Assistants API

## Core Features

  * **Embeddable Chat Bubble:** A clean, familiar UI component that can be integrated into any website.
  * **Powered by OpenAI Assistants:** Leverages the power of custom-trained OpenAI Assistants for specialized knowledge.
  * **Stateful Conversations:** Maintains conversation history and context for follow-up questions.
  * **Easy Configuration:** Simply requires an OpenAI Assistant ID and API Key to be fully functional.
  * **Serverless & Scalable:** No servers to manage; automatically scales with user demand.
  * **Ready for Amplify Deployment:** Streamlined for easy deployment and hosting on AWS Amplify.


