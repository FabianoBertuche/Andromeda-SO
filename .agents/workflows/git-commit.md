---
description: Generate conventional commit messages from staged changes
---

# Commit do Git

Vou te ajudar a gerar mensagens de commit claras e convencionais com base nas suas alterações preparadas.

## Regras
- Analise apenas as alterações preparadas (`git diff --staged`)
- Siga o formato de commits convencionais
- Mantenha o assunto com menos de 72 caracteres
- Não faça commit se não houver alterações preparadas

## Etapas

### 1. Analisar as alterações preparadas
Primeiro, verifique o que está preparado:
- Execute `git diff --staged` para ver as alterações
- Execute `git diff --staged --stat` para um resumo
- Identifique o tipo e o escopo das alterações

### 2. Determinar o tipo de commit
Com base nas alterações, selecione o tipo apropriado:

| Tipo | Quando usar |

|------|-------------|

| `feat` | Novo recurso |

| `fix` | Correção de bug |

| `docs` | Somente documentação |

| `style` | Formatação, sem alteração de código |

| `refactor` | Alteração de código que não corrige nem adiciona nada |

| `perf` | Melhoria de desempenho |

| `test` | Adição ou atualização de testes |

| `chore` | Compilação, ferramentas, dependências |

| `ci` | Alterações de CI/CD |

### 3. Identificar o Escopo (Opcional)
Determine se um escopo se aplica:
- Nome do componente (ex.: `auth`, `api`, `ui`)
- Área de funcionalidade (ex.: `login`, `dashboard`)
- Tipo de arquivo (ex.: `deps`, `config`)

### 4. Escrever a Mensagem de Commit
Formato: `<tipo>(<escopo>): <descrição>`

**Regras:**
- Use o modo imperativo ("adicionar" e não "adicionado")
- Não use letra maiúscula na primeira letra
- Não use ponto final
- Seja específico, mas conciso

**Exemplos:**
- `feat(auth): adicionar fluxo de login OAuth2`
- `fix: resolver ponteiro nulo no serviço de usuário`
- `docs: atualizar a documentação da API`
- `refactor(api): extrair lógica de validação`

### 5. Adicionar Corpo (Se Necessário)
Para alterações complexas, adicione um Corpo:
- Deixe uma linha em branco após o assunto
- Explique O QUE e POR QUE, não COMO
- Quebre a linha em 72 caracteres

### 6. Executar Commit
Apresente a mensagem de commit sugerida e pergunte se o usuário deseja:
- Confirmar com esta mensagem
- Modificar a mensagem
- Adicionar mais detalhes no corpo

## Princípios
- Um commit = uma alteração lógica
- Se precisar de "e" na mensagem, considere dividi-la
- Faça referência às issues quando relevante (ex.: `corrige #123`)

## Referência
- [Conventional Commits](https://www.conventionalcommits.org/)
- Execute `git log --oneline -10` para ver o estilo dos commits recentes