import os
import re
import json
import asyncio
from typing import List, Optional
from openai import AsyncOpenAI
from ..models.models import AuditFinding, AuditReport, AuditRequest
import time

class AuditService:
    @staticmethod
    async def analyze_code(request: AuditRequest) -> AuditReport:
        # Priority 1: OpenRouter (Free Tier Support)
        or_key = os.getenv("OPENROUTER_API_KEY")
        if or_key:
            return await AuditService._analyze_with_ai(
                request, 
                or_key, 
                base_url="https://openrouter.ai/api/v1",
                model="google/gemini-2.0-flash-lite-preview-02-05:free"
            )

        # Priority 2: Standard OpenAI
        oa_key = os.getenv("OPENAI_API_KEY")
        if oa_key:
            return await AuditService._analyze_with_ai(request, oa_key)
            
        # Fallback: Heuristic
        return await AuditService._analyze_with_heuristic(request)

    @staticmethod
    async def _analyze_with_ai(request: AuditRequest, api_key: str, base_url: Optional[str] = None, model: str = "gpt-4o-mini") -> AuditReport:
        client = AsyncOpenAI(
            api_key=api_key,
            base_url=base_url
        )
        
        system_prompt = """
        You are Vektor, a world-class Solana smart contract security auditor. 
        Your goal is to identify critical, high, and medium vulnerabilities in the provided Rust/Anchor code.
        
        Focus on:
        1. Missing Signer/Ownership checks.
        2. Integer Overflow/Underflow (lack of checked math).
        3. CPI vulnerabilities (Reentrancy, stale account data).
        4. Logic errors in access control.
        
        Return ONLY a JSON object with this structure:
        {
            "overall_score": number (0-100),
            "summary": "High-level audit summary",
            "findings": [
                {
                    "title": "Short title",
                    "description": "Brief technical explanation",
                    "severity": "Critical|High|Medium|Low",
                    "remediation": "How to fix it",
                    "line_start": number,
                    "line_end": number,
                    "code_snippet": "Relevant code line"
                }
            ]
        }
        """

        # Supplemental headers for OpenRouter
        extra_headers = {}
        if base_url and "openrouter.ai" in base_url:
            extra_headers = {
                "HTTP-Referer": "https://vektor.security",
                "X-Title": "Vektor Security Auditor"
            }

        try:
            response = await client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Analyze this Solana contract: \n\n{request.code}"}
                ],
                response_format={"type": "json_object"},
                extra_headers=extra_headers
            )
            
            content = response.choices[0].message.content
            if not content:
                raise ValueError("Empty response from AI")
                
            data = json.loads(content)
            findings = [AuditFinding(**f) for f in data["findings"]]
            
            return AuditReport(
                id=str(int(time.time())),
                timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                contract_name=request.contract_name,
                overall_score=data["overall_score"],
                summary=data["summary"],
                findings=findings,
                raw_code=request.code
            )
        except Exception as e:
            print(f"AI Audit failed ({model}): {e}. Falling back to heuristic.")
            return await AuditService._analyze_with_heuristic(request)

    @staticmethod
    async def _analyze_with_heuristic(request: AuditRequest) -> AuditReport:
        await asyncio.sleep(1.5)
        
        findings = []
        code_lines = request.code.split('\n')
        
        vulnerabilities = [
            {"title": "Missing Signer Check", "pattern": r"(?i)signer", "severity": "Critical", "remediation": "Add signer check."},
            {"title": "Missing Ownership Check", "pattern": r"(?i)owner", "severity": "High", "remediation": "Verify account owner."},
            {"title": "Integer Overflow", "pattern": r"[\+\-\*\/]", "severity": "High", "remediation": "Use checked math."},
            {"title": "Reentrancy", "pattern": r"(?i)lamports", "severity": "Critical", "remediation": "Update state before external calls."}
        ]

        found_types = set()
        for i, line in enumerate(code_lines):
            for v in vulnerabilities:
                if re.search(v["pattern"], line) and v["title"] not in found_types:
                    findings.append(AuditFinding(
                        title=v["title"],
                        description=f"Potential {v['title']} issue detected on line {i+1}.",
                        severity=v["severity"],
                        remediation=v["remediation"],
                        line_start=i + 1,
                        line_end=i + 1,
                        code_snippet=line.strip()
                    ))
                    found_types.add(v["title"])

        base_score = 100 - (len(findings) * 15)
        return AuditReport(
            id=str(int(time.time())),
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            contract_name=request.contract_name,
            overall_score=max(0, base_score),
            summary=f"Heuristic audit complete. Found {len(findings)} issues.",
            findings=findings,
            raw_code=request.code
        )
