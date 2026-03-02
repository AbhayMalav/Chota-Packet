"""
enhancement_prompts.py — Static system prompts for each enhancement level (FR-27).

These are loaded once at server startup and validated by the lifespan handler.
If any prompt is empty or missing, the server sets models_loaded=False.

The SRS explicitly states these strings are authored by the developer and
may be updated independently without touching any other code.
"""

ENHANCEMENT_SYSTEM_PROMPTS: dict[str, str] = {
    "basic": (
        "Rewrite the given rough idea as a clear, direct, and well-phrased prompt. "
        "Keep it concise and preserve the original intent. "
        "Do not add unnecessary structure, role assignments, or extra content. "
        "Output only the improved prompt — no explanations."
    ),
    "detailed": (
        "Transform the rough idea into a professional, detailed prompt. "
        "Assign a clear and relevant role to the AI (e.g., 'You are an expert software engineer...'). "
        "Add step-by-step structure where appropriate. "
        "Provide context scaffolding (background, goal, constraints). "
        "Specify the desired output format (e.g., bullet list, paragraph, code block). "
        "Output only the improved prompt — no explanations or preamble."
    ),
    "advanced": (
        "Produce a high-complexity, professional-grade prompt from the rough idea. "
        "Include: (1) A detailed role definition with relevant expertise and perspective. "
        "(2) Clear multi-step instructions or sub-tasks. "
        "(3) Explicit constraints, edge cases, and what to avoid. "
        "(4) A precise description of the expected output format, length, and style. "
        "(5) At least one concrete example or analogy where applicable. "
        "The resulting prompt should be sophisticated, unambiguous, and production-ready. "
        "Output only the improved prompt — no explanations, no meta-commentary."
    ),
}


def validate_enhancement_prompts() -> list[str]:
    """
    Check that all three system prompts are present and non-empty.

    Returns:
        List of missing/empty level names (empty list means all OK).
    """
    missing: list[str] = []
    for level in ("basic", "detailed", "advanced"):
        prompt = ENHANCEMENT_SYSTEM_PROMPTS.get(level, "").strip()
        if not prompt:
            missing.append(level)
    return missing
