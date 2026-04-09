# Vektor

Vektor is an AI-powered security auditor specifically designed for Solana smart contracts. It thinks like an attacker to identify vulnerabilities before they can be exploited.

## Features
- **AI-Powered Audits**: Advanced AI model trained on Solana security patterns.
- **Vulnerability Detection**: Detects all major Solana-specific vulnerability classes.
- **Audit History**: Keep track of your past audits.
- **PDF Export**: Generate detailed PDF reports for your projects.
- **Line References**: Pinpoint exactly where the issues are in your code.
- **Mobile Responsive**: Audit on the go.

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
- **Backend**: Python FastAPI, OpenAI API (or compatible model)
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

---
*Developed by mal4crypt*
