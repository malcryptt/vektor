import os

class BadgeService:
    @staticmethod
    def generate_badge_svg(score: int) -> str:
        color = "#ff4444" if score < 70 else "#ffcc00" if score < 90 else "#00ff88"
        text = "CRITICAL" if score < 70 else "WARNING" if score < 90 else "SECURE"
        
        return f"""
        <svg width="200" height="40" viewBox="0 0 200 40" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#1a1a1a;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#0a0a0a;stop-opacity:1" />
                </linearGradient>
            </defs>
            <rect width="200" height="40" rx="10" fill="url(#grad)" stroke="{color}" stroke-width="2"/>
            <text x="15" y="25" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="white">VEKTOR AUDIT</text>
            <line x1="110" y1="10" x2="110" y2="30" stroke="white" stroke-opacity="0.2" stroke-width="1"/>
            <text x="120" y="25" font-family="Arial, sans-serif" font-size="12" font-weight="black" fill="{color}">{score}% {text}</text>
        </svg>
        """
