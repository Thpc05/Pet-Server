# 1. Começamos com uma imagem leve que já tem Python (é mais difícil instalar Python no Node do que Node no Python)
FROM python:3.9-slim

# 2. Instalar dependências do sistema necessárias para compilar coisas
RUN apt-get update && apt-get install -u -y \
  nodejs \
  npm \
  && rm -rf /var/lib/apt/lists/*

# 3. Definir pasta de trabalho
WORKDIR /app

# 4. Copiar e instalar dependências do Python (Pandas, Reportlab, etc)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copiar e instalar dependências do Node
COPY package*.json ./
RUN npm install

# 6. Copiar o resto do código do projeto
COPY . .

# 7. Expor a porta (ajuste conforme sua API, geralmente 3000 ou a var PORT)
EXPOSE 3000

# 8. Comando para iniciar o Node
CMD ["node", "server.js"]