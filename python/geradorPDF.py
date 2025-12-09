import sys
import json
import os
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, HRFlowable, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

# --- CONFIGURAÇÕES ---
# Ajuste o caminho da logo conforme sua estrutura de pastas no Docker
BASE_DIR = os.getcwd()
LOGO_PATH = os.path.join(BASE_DIR, "assets", "logoPET.png")
PASTA_SAIDA = os.path.join(BASE_DIR, "pdf_gerados")

def gerar_pdf(dados):
    # 1. Cria a pasta de saída se não existir
    if not os.path.exists(PASTA_SAIDA):
        os.makedirs(PASTA_SAIDA)

    # 2. Define o nome do arquivo
    nome_limpo = str(dados.get('nome', 'SemNome')).replace(' ', '_')
    cpf_limpo = str(dados.get('cpf', '000')).replace('.', '').replace('-', '')
    hora_atual = datetime.now().strftime("%H%M%S")
    
    nome_arquivo = f"{nome_limpo}_{cpf_limpo}_{hora_atual}.pdf"
    caminho_completo = os.path.join(PASTA_SAIDA, nome_arquivo)

    # 3. Configura o Documento
    doc = SimpleDocTemplate(
        caminho_completo, 
        pagesize=A4, 
        rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=18
    )
    
    styles = getSampleStyleSheet()
    story = []

    # Estilos Personalizados
    estilo_titulo = ParagraphStyle(
        name="TituloPrincipal", 
        fontSize=18, 
        alignment=1, # Center
        textColor=colors.HexColor("#1583c9"), 
        spaceAfter=12
    )
    estilo_secao = ParagraphStyle(
        name="Secao", 
        fontSize=14, 
        leading=16, 
        spaceAfter=6, 
        textColor=colors.HexColor("#1583c9"),
        fontName="Helvetica-Bold"
    )
    estilo_campo = ParagraphStyle(
        name="Campo", 
        fontSize=10, 
        leading=12, 
        spaceAfter=4
    )

    # --- CABEÇALHO ---
    if os.path.exists(LOGO_PATH):
        try:
            img = Image(LOGO_PATH)
            img.drawHeight = 60
            img.drawWidth = 60
            img.hAlign = "CENTER"
            story.append(img)
            story.append(Spacer(1, 10))
        except Exception:
            pass # Se der erro na imagem, segue sem ela

    story.append(Paragraph("<b>PET Saúde Digital - Ficha do Paciente</b>", estilo_titulo))
    story.append(Paragraph(f"<b>Nome:</b> {dados.get('nome', 'Não informado')}", styles["Normal"]))
    story.append(Paragraph(f"<b>CPF:</b> {dados.get('cpf', 'Não informado')}", styles["Normal"]))
    story.append(Spacer(1, 12))

    # --- FUNÇÃO AUXILIAR PARA BLOCOS ---
    def adicionar_bloco(titulo, campos_dict, origem_dados):
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#1583c9"), spaceBefore=6, spaceAfter=6))
        story.append(Paragraph(titulo, estilo_secao))
        story.append(Spacer(1, 4))
        
        for label, chave in campos_dict.items():
            valor = origem_dados.get(chave, " - ")
            if valor is None or valor == "":
                valor = " - "
            story.append(Paragraph(f"<b>{label}:</b> {valor}", estilo_campo))
        
        story.append(Spacer(1, 8))

    # --- DADOS CLÍNICOS (Do Paciente) ---
    # Mapeia Label -> Chave no JSON
    adicionar_bloco("Identificação Básica", {
        "Sexo": "sexo",
        "Faixa Etária": "faixa_etaria",
        "Tipo de Usuário": "tipo_usuario",
        "Data de Registro": "data_registro" # Se vier automático do Mongo, pode precisar formatar a data
    }, dados)

    adicionar_bloco("Dados Clínicos Gerais", {
        "Data Início Sintomas": "data_inicio_sintomas",
        "Data AVC": "data_avc",
        "Tipo de AVC": "tipo_avc",
        "Janela Terapêutica": "admissao_janela_terapeutica",
        "Trombólise": "trombolise",
        "Trombectomia": "trombectomia"
    }, dados)

    adicionar_bloco("Medicamentos e Intervenções", {
        "Medicamentos": "medicamentos_utilizados",
        "Ventilação Mecânica": "ventilacao_mecanica",
        "Tempo Ventilação": "tempo_ventilacao",
        "Intubado": "intubado",
        "Traqueostomizado": "traqueostomizado"
    }, dados)

    adicionar_bloco("Fatores de Risco e Comorbidades", {
        "Comorbidades": "comorbidades",
        "Histórico Familiar": "historico_familiar",
        "Medicamento Uso Diário": "medicamento_uso_diario"
    }, dados)

    adicionar_bloco("Hábitos e Estilo de Vida", {
        "Alimentação": "alimentacao",
        "Atividade Física": "atividade_fisica",
        "Tabagismo": "tabagismo",
        "Álcool": "alcool"
    }, dados)

    # --- FAMILIARES (Lista) ---
    familiares = dados.get('familia', [])
    if familiares and isinstance(familiares, list) and len(familiares) > 0:
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#1F497D"), spaceBefore=10))
        story.append(Paragraph("Familiares Cadastrados", estilo_secao))
        
        for fam in familiares:
            txt_fam = f"<b>Grau:</b> {fam.get('grau_parentesco', 'N/A')} | <b>Cuidador:</b> {fam.get('cuidador_externo', 'N/A')}"
            story.append(Paragraph(txt_fam, styles["Normal"]))
            story.append(Spacer(1, 4))

    # --- PROFISSIONAIS (Lista) ---
    profissionais = dados.get('profissional', [])
    if profissionais and isinstance(profissionais, list) and len(profissionais) > 0:
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#1F497D"), spaceBefore=10))
        story.append(Paragraph("Registros Profissionais", estilo_secao))
        
        for prof in profissionais:
            txt_prof = f"<b>ID:</b> {prof.get('id_profissional', 'N/A')} | <b>Data:</b> {prof.get('createdAt', 'N/A')}"
            story.append(Paragraph(txt_prof, styles["Normal"]))
            story.append(Spacer(1, 4))

    # --- RODAPÉ ---
    story.append(Spacer(1, 20))
    story.append(Paragraph("Relatório gerado automaticamente pelo sistema PET Saúde Digital.", 
                           ParagraphStyle(name="Footer", fontSize=8, alignment=1, textColor=colors.gray)))

    # Gera o PDF
    doc.build(story)
    return caminho_completo

if __name__ == "__main__":
    try:
        # Lê o JSON da entrada padrão (enviado pelo Node.js)
        input_data = sys.stdin.read()
        
        if not input_data:
            print(json.dumps({"status": "erro", "mensagem": "Nenhum dado recebido pelo Python"}))
            sys.exit(1)

        # Converte para Dicionário Python
        dados_json = json.loads(input_data)

        # Gera o PDF
        caminho = gerar_pdf(dados_json)

        # Retorna o JSON de sucesso para o Node ler
        print(json.dumps({
            "status": "sucesso", 
            "arquivos": [caminho]
        }))

    except Exception as e:
        # Retorna erro formatado em JSON para o Node não travar
        print(json.dumps({
            "status": "erro", 
            "mensagem": str(e)
        }))
        sys.exit(1)