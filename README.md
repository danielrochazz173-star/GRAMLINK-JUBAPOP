# JubaPop Gramlink

Single page para a Juventude Batista em Ponte Preta. Os cards sao carregados do Google Sheets via API key e links podem apontar para PDFs no Google Drive.

## Conexao com a planilha (sem dor de cabeca)

### 1) Estruture as abas

Crie duas abas:

**LINKS** (colunas na primeira linha):
- titulo
- data (YYYY-MM-DD)
- imagem (URL)
- link (URL)
- tipo (jornal, evento, link)

**PDF** (colunas na primeira linha):
- data (YYYY-MM-DD ou DD/MM/YYYY)
- link (URL do Google Drive)
- tema (texto curto)

### 2) Deixe a planilha publica

Compartilhar > Qualquer pessoa com o link > Leitor.

### 3) Pegue uma API key do Google Sheets

1. Acesse https://console.cloud.google.com/
2. Ative a Google Sheets API.
3. Crie uma API key em APIs & Services > Credentials.
4. (Opcional) Restrinja por dominio do GitHub Pages.

### 4) Configure o app

Edite o arquivo [app.js](app.js) e preencha:

- `apiKey`
- `sheetId`
- `linksRange` (ex: `LINKS!A1:E`)
- `pdfRange` (ex: `PDF!A1:C`)

Quando a data da aba PDF for igual a hoje, o site mostra o botao "Jornal de hoje".

## PDFs no Google Drive

1. Suba o PDF no Drive.
2. Clique em "Compartilhar" e marque "Qualquer pessoa com o link".
3. Cole o link na coluna `link` da aba PDF.
4. Preencha o `tema` para aparecer no "Jornal de hoje".

## Deploy no GitHub Pages

1. No GitHub, abra Settings > Pages.
2. Selecione a branch `main` e pasta `/root`.
3. Salve e aguarde o link publico.

Pronto. Quando atualizar a planilha, o site reflete na hora.
