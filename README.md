# Vektor

Vektor is an AI-powered security auditor specifically designed for Solana smart contracts. It thinks like an attacker to identify vulnerabilities before they can be exploited.

## Features
- **Attacker-Mindset UI**: High-intensity Red (#ff4444) theme designed to pinpoint vulnerabilities.
- **Integrated Audit Workspace**: A unified `/audit` route for code editing and real-time reporting.
- **Monaco Editor**: Professional grade code editor with Solana syntax highlighting.
- **Audit History**: Persistent session-based history tracking.
- **PDF Export**: Generate professional security audit reports.
- **Mobile Optimized**: Tab-based navigation for auditing from any device.

## Vulnerability Classes Detected
1. **Missing Ownership Checks**
2. **Missing Signer Checks**
3. **Integer Overflow/Underflow**
4. **Account Reload after CPI**
5. **Reentrancy Attacks**
6. **Insecure Randomness**
7. **Arbitrary Signed Program Invocation**
8. **Invalid Account Data Validation**

## Tech Stack
- **Frontend**: Next.js, Tailwind CSS, Lucide React
- **Backend**: Python FastAPI, OpenAI or OpenRouter (Free AI)
- **Monorepo**: Single repository architecture

## Local Setup

### Backend Setup
1. `cd backend`
2. `python -m venv venv`
3. `source venv/bin/activate`
4. `pip install -r requirements.txt`
5. `python app/main.py`

### Frontend Setup
1. `cd frontend`
2. `npm install`
3. `npm run dev`

## How It Works
1. Upload or paste your Solana smart contract code.
2. Vektor processes the code through our AI security engine.
3. Our "Attacker Thought Pattern" identifies potential weaknesses.
4. Review the detailed report with line-specific references and remediation steps.

## Hackathon Submission — Solana Frontier 2026
Vektor is built with the goal of making Solana the most secure ecosystem in crypto. By leveraging AI to automate the heavy lifting of security audits, we empower developers to build with confidence.

## Training Vektor (Free AI)
To use Vektor with a completely free AI model:
1. Get a free API key from [OpenRouter.ai](https://openrouter.ai).
2. Add `OPENROUTER_API_KEY` to your Render environment variables.
3. Vektor will automatically use `Gemini 2.0 Flash Lite` for zero-cost audits.
*Developed by mal4crypt*
