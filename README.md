# Dissolução do NaCl em Água — versão sem JSmol

Esta é a versão mais segura para GitHub Pages.

## Por que esta versão foi feita

As versões com JSmol podem travar no carregamento em GitHub Pages quando há bloqueio de CDN, problema de inicialização do applet, dependência de jQuery ou falha no carregamento dos arquivos `j2s`.

Esta versão remove completamente esse risco:

- sem JSmol;
- sem CDN;
- sem jQuery;
- sem bibliotecas externas;
- sem arquivos `.xyz`;
- apenas `index.html`, `style.css`, `script.js` e `.nojekyll`.

## Recursos

- Animação molecular em Canvas/JavaScript puro.
- Cristal iônico 3D didático.
- Água polar se aproximando.
- Íons de superfície se separando.
- Zoom de Na⁺ hidratado.
- Zoom de Cl⁻ hidratado.
- Simulação quantitativa conceitual:
  - massa de sal;
  - massa de água;
  - temperatura;
  - agitação;
  - tamanho do grão;
  - capacidade máxima;
  - dissolvido agora;
  - ainda sólido agora;
  - excesso no equilíbrio;
  - saturação atual;
  - concentração aproximada;
  - condutividade relativa.
- Gráficos de cinética e solubilidade.
- Quiz formativo com feedback imediato.

## Como publicar no GitHub Pages

Publique os arquivos diretamente na raiz do repositório:

```text
index.html
style.css
script.js
README.md
.nojekyll
```

Não coloque dentro de uma pasta extra.

## Configuração recomendada

Em **Settings → Pages**:

- Source: Deploy from a branch
- Branch: main
- Folder: /root

## Observação didática

A animação é um modelo visual simplificado. Ela não é uma simulação de dinâmica molecular real, mas representa corretamente a sequência conceitual: cristal iônico, água polar, dissociação, hidratação e íons móveis.
