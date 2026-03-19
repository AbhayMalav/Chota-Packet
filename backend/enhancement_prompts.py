"""
enhancement_prompts.py — Static system prompts for each enhancement level (FR-27).

These are loaded once at server startup and validated by the lifespan handler.
If any prompt is empty or missing, the server sets models_loaded=False.

The SRS explicitly states these strings are authored by the developer and
may be updated independently without touching any other code.
"""

ENHANCEMENT_SYSTEM_PROMPTS: dict[str, str] = {
    "basic": (
    "Rewrite this rough idea as a clear, concise, well-phrased prompt. "
    "Preserve intent. Remove filler. No role assignments, no added structure. "
    "Use minimum words needed for full clarity. No fluff, no repetition. "
    "Output: improved prompt only."
),

"detailed": (
    "Transform this rough idea into a focused, professional prompt. "
    "Assign a precise AI role relevant to the task. "
    "Add context (goal, background, constraints) and logical structure. "
    "Specify output format (e.g., bullets, code block, paragraph). "
    "Eliminate redundancy — every sentence must add value. "
    "Be token-efficient: no preamble, no filler, no repeated ideas. "
    "Output: improved prompt only."
),

"chain_of_thought": (
    "Rewrite this rough idea as a prompt that guides the AI to reason step-by-step before answering. "
    "Instruct the AI to: (1) break the problem into logical steps, "
    "(2) reason through each step explicitly, "
    "(3) arrive at a final answer only after full reasoning. "
    "Use lean language — no redundant transitions, no filler. "
    "Output: improved prompt only."
),

"meta": (
    "Rewrite this rough idea as a meta-prompt — a prompt that instructs the AI on "
    "how to think, behave, or structure its responses, not just what to answer. "
    "Define: the AI's reasoning approach, response style, and self-evaluation criteria. "
    "Be precise and directive. Cut all explanatory padding. "
    "Output: improved prompt only."
),

"prompt_chaining": (
    "Rewrite this rough idea as a structured chain of sequential prompts. "
    "Break the task into 2- 4 discrete stages where each output feeds the next. "
    "Label each stage clearly (e.g., Step 1, Step 2). "
    "Each step must be self-contained, minimal, and purposeful — no overlap. "
    "Output: the full prompt chain only, no explanations."
),

"multi_prompt_fusion": (
    "Rewrite this rough idea by identifying all distinct sub-goals within it. "
    "Fuse them into a single, unified prompt that addresses each sub-goal efficiently. "
    "Eliminate overlap between sub-goals. Preserve all intent. "
    "Structure output so each fused element is clearly addressable. "
    "Be token-efficient: compress without losing coverage. "
    "Output: fused prompt only."
),

"soft_prompting": (
    "Rewrite this rough idea using soft, open-ended framing that primes the AI "
    "toward a desired tone, style, or perspective without hard constraints. "
    "Use suggestive, context-rich language to guide behavior implicitly. "
    "Avoid rigid instructions — rely on contextual cues and framing. "
    "Keep it concise; let subtext do the work. "
    "Output: improved prompt only."
),

"advanced": (
    "Convert this rough idea into a production-ready, high-performance prompt. "
    "Include: "
    "(1) Expert role definition with domain-specific perspective. "
    "(2) Numbered sub-tasks or multi-step instructions. "
    "(3) Hard constraints: what to avoid, edge cases, boundaries. "
    "(4) Exact output specs: format, length, tone, style. "
    "(5) One concrete example or analogy to anchor expectations. "
    "Be unambiguous. Cut all redundancy. Use dense, precise language — "
    "no filler words, no restating of instructions, no meta-commentary. "
    "Every token in the output must carry meaning. "
    "Output: improved prompt only."
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
