# LLM provider port

`idea` and `judgement` (and any other module that calls models) depend on an LLM port. Concrete vendors/models are adapters under `app/adapters/llm`. Judges may use different models or independent contexts behind the same port; rule-based verifiers can sit beside LLM adapters.

**Considered options:** one vendor SDK wired directly in services; rules-only with LLM bolted on later without a port.

**Why:** TOPIC explicitly allows different LLMs, independent judge contexts, and rule+LLM mixes. A port keeps module services testable and swappable without rewriting workflow code.
