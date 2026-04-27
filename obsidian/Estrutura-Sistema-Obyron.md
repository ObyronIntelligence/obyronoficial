---
tags: [area/arquitetura, projeto/obyron-neural, tipo/conhecimento]
---

# Estrutura do Sistema Obyron Neural v2

## Descrição
Reestruturação completa do Obyron Neural. O sistema agora opera como um assistente de voz ao estilo Jarvis, com interface visual imersiva (orbe 3D reativa a som), reconhecimento e síntese de fala, e conexão direta com Obsidian via REST API.

## Conteúdo

### Páginas
1. **Landing** (`/`) — Apresentação premium com feature cards e CTA para inicializar
2. **Neural** (`/neural`) — Interface Jarvis: orbe 3D + voz bidirecional

### Módulos
1. **CORE**: Orquestrador de agentes LangChain (Planner → Executor → Critic)
2. **MEMORY**: Obsidian REST API (plugin Local REST API) + Supabase Vector (RAG)
3. **ACTIONS**: Registry de ações executáveis via linguagem natural
4. **VOICE**: SpeechRecognition + SpeechSynthesis + AudioAnalyzer (WebAudio API)
5. **INTERFACE**: Landing + Orbe 3D reativa + Painel de configurações

### Fluxo de Voz
```
Usuário fala → SpeechRecognition (pt-BR)
  → API /neural (texto)
    → ObsidianMemory.retrieveContext (RAG)
    → ObyronOrchestrator.runTask (LangChain)
  ← Resposta texto
← SpeechSynthesis (fala a resposta)
← Orbe reage ao áudio em tempo real
```

## Relacionamentos
- [[Integracao-Living-Fluid-Hero]]
- [[Voice Engine e Web Audio API]]

## Subtópicos
- [[Obsidian Local REST API]]
- [[Shaders WebGL Reativos a Som]]
- [[Pipeline de Agentes LangChain]]
