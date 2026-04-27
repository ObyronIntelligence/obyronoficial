# Configuração de Cores no Graph View do Obsidian

## Como configurar as cores do Graph View

O Obsidian NÃO permite configurar cores do Graph View via CSS.
As cores são configuradas diretamente na interface do Graph View.

### Passo a passo:

1. **Abra o Graph View**: `Ctrl + G` (ou clique no ícone de grafo no painel lateral)

2. **Abra as configurações do grafo**: Clique no ícone de **engrenagem (⚙️)** no canto superior direito do Graph View

3. **Na seção "Groups"**, clique em **"New group"** para cada regra abaixo:

### Grupos de Cores Recomendados

| # | Query (filtro)                    | Cor Hex   | Cor Visual     | Descrição                    |
|---|-----------------------------------|-----------|----------------|------------------------------|
| 1 | `tag:#pessoas`                    | `#fbbf24` | 🟡 Amarelo     | Pessoas (família, amigos)    |
| 2 | `tag:#conhecimentos`              | `#3b82f6` | 🔵 Azul        | Base de conhecimento         |
| 3 | `tag:#projetos`                   | `#10b981` | 🟢 Verde       | Projetos e trabalhos         |
| 4 | `tag:#família`                    | `#ec4899` | 🩷 Rosa        | Membros da família           |
| 5 | `tag:#amigos`                     | `#f97316` | 🟠 Laranja     | Amigos                       |
| 6 | `tag:#habilidades`                | `#06b6d4` | 🩵 Ciano       | Habilidades e skills         |
| 7 | `tag:#linguagens-de-programação`  | `#8b5cf6` | 🟣 Roxo        | Linguagens de programação    |
| 8 | `tag:#automobilismo`              | `#ef4444` | 🔴 Vermelho    | Automobilismo e carros       |
| 9 | `tag:#obyron`                     | `#a855f7` | 💜 Roxo Brilho | Notas do sistema Obyron      |
| 10| `path:Obyron/Conversas`           | `#64748b` | ⚪ Cinza       | Logs de conversas            |

### Cores Extras (adicione conforme novas categorias surgirem)

| Query (filtro)            | Cor Hex   | Cor Visual     |
|---------------------------|-----------|----------------|
| `tag:#música`             | `#d946ef` | Magenta        |
| `tag:#saúde`              | `#22d3ee` | Aqua           |
| `tag:#finanças`           | `#84cc16` | Lima           |
| `tag:#estudos`            | `#0ea5e9` | Azul Sky       |
| `tag:#ideias`             | `#fcd34d` | Amarelo Claro  |

### Dicas Importantes

- **Ordem importa**: Grupos mais específicos devem ficar ACIMA dos mais genéricos
- As tags são geradas automaticamente pelo Obyron ao criar notas estruturadas
- Cada nota recebe tags hierárquicas (ex: `#obyron, #pessoas, #família`)
- O Graph View colore o nó pela **primeira regra que ele casar** (de cima para baixo)

### Como o sistema funciona

Quando você diz ao Obyron algo como:
> "Anota que minha mãe se chama Maria e gosta de cozinhar"

O sistema cria automaticamente:
```
Arquivo: Obyron/Pessoas/Família/Maria.md
Tags: [obyron, pessoas, família]
cssclass: folder-pessoas
```

No Graph View, essa nota será colorida de **amarelo** porque casa com `tag:#pessoas`.
Todas as notas dentro de "Pessoas" compartilham essa tag e terão a mesma cor.
