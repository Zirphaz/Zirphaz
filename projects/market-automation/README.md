# Automacao para Mercado

Sistema pensado para apoiar a organizacao de rotinas internas de um mercado, com foco em registros, consultas, estoque e informacoes operacionais.

## Objetivo

Reduzir tarefas repetitivas e centralizar informacoes importantes para facilitar o acompanhamento da operacao no dia a dia.

## Funcionalidades

- Cadastro e consulta de produtos.
- Controle simples de estoque.
- Registro de movimentacoes.
- Relatorios por categoria.
- Alertas de baixo estoque.
- Banco SQLite local.

## Tecnologias relacionadas

- Python
- SQLite
- argparse

## Codigo relacionado

- [app.py](app.py)
- [automation_report.py](../../examples/python/automation_report.py)

## Como rodar

```bash
python app.py init
python app.py seed
python app.py list
python app.py sell 1 2
python app.py summary
python app.py low-stock
```

## Status

Primeira versao funcional em linha de comando. O sistema ja cadastra produtos, consulta estoque, registra venda, atualiza quantidade e gera resumo por categoria.
