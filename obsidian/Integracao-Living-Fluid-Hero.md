---
tags: [area/frontend, projeto/obyron-neural, tipo/tarefa]
---

# Integração do Componente Living Fluid Hero

## Descrição
Implementação de uma hero section dinâmica 3D utilizando React Three Fiber e Framer Motion, adaptada para o design system do Obyron Neural com tema escuro (preto, branco e elemento central roxo/branco) e tipografia JetBrainsSans.

## Conteúdo
O componente `living-fluid-hero.tsx` foi criado no diretório `components/ui` conforme padrão Shadcn UI. Ele utiliza WebGL para renderizar uma esfera fluida interativa, reagindo ao movimento do mouse com shaders customizados. A interface principal foi estilizada para alto contraste, mantendo o fundo preto e elementos textuais/botões em branco, com o efeito 3D em tons de roxo e branco.

Passos documentados:
1. Adaptação dos shaders (cores `uColorA` e `uColorB`).
2. Aplicação de classes Tailwind para forçar tema escuro (`bg-black`, `text-white`).
3. Uso da fonte `JetBrainsSans` para os textos e UI.

## Relacionamentos
- [[Guia de UI e Componentes]]
- [[Design System Obyron Neural]]

## Subtópicos
- [[Shaders WebGL e React Three Fiber]]
- [[Estrutura de Componentes Shadcn]]
