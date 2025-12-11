import sys
import json
import os
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, HRFlowable, KeepTogether
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

# --- CONFIGURAÇÕES ---
BASE_DIR = os.getcwd()
LOGO_PATH = os.path.join(BASE_DIR, "assets", "logoPET.png")
PASTA_SAIDA = os.path.join(BASE_DIR, "pdf_gerados")

# --- FUNÇÕES AUXILIARES ---

def formatar_data_iso(data_iso):
    """Converte '2025-12-11T15:30:00...' para '11/12/2025 15:30'"""
    if not data_iso or data_iso == " - ":
        return " - "
    try:
        dt = datetime.fromisoformat(data_iso[:19])
        return dt.strftime("%d/%m/%Y às %H:%M")
    except:
        return data_iso

def formatar_valor(valor):
    """Trata listas (arrays) transformando em string, e trata Nulos"""
    if valor is None or valor == "":
        return " - "
    if isinstance(valor, list):
        return ", ".join(str(v) for v in valor)
    if isinstance(valor, bool):
        return "Sim" if valor else "Não"
    return str(valor)

def gerar_pdf(dados):
    # 1. Cria diretório e define nome
    if not os.path.exists(PASTA_SAIDA):
        os.makedirs(PASTA_SAIDA)

    nome_limpo = str(dados.get('nome', 'Paciente')).replace(' ', '_')
    cpf_limpo = str(dados.get('cpf', '000')).replace('.', '').replace('-', '')
    hora_atual = datetime.now().strftime("%H%M%S")
    
    nome_arquivo = f"Relatorio_{nome_limpo}_{cpf_limpo}_{hora_atual}.pdf"
    caminho_completo = os.path.join(PASTA_SAIDA, nome_arquivo)

    # 2. Configura Documento
    doc = SimpleDocTemplate(
        caminho_completo, 
        pagesize=A4, 
        rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=20
    )
    
    styles = getSampleStyleSheet()
    story = []

    # --- ESTILOS ---
    style_titulo = ParagraphStyle(
        name="Titulo", fontSize=20, alignment=1, textColor=colors.HexColor("#007BFF"), spaceAfter=20, fontName="Helvetica-Bold"
    )
    style_subtitulo = ParagraphStyle(
        name="Subtitulo", fontSize=14, leading=18, textColor=colors.HexColor("#0056b3"), spaceBefore=12, spaceAfter=6, fontName="Helvetica-Bold"
    )
    style_label = ParagraphStyle(
        name="Label", fontSize=10, leading=14, fontName="Helvetica-Bold", textColor=colors.black
    )
    style_texto = ParagraphStyle(
        name="Texto", fontSize=10, leading=14, fontName="Helvetica", textColor=colors.black
    )
    style_alerta = ParagraphStyle(
        name="Alerta", fontSize=10, leading=14, fontName="Helvetica-Bold", textColor=colors.red
    )

    # --- LÓGICA DE RESGATE DE DADOS (CORREÇÃO) ---
    # Prepara o formulário da família para busca secundária
    dados_familia = {}
    if dados.get('familia') and isinstance(dados.get('familia'), list) and len(dados.get('familia')) > 0:
        dados_familia = dados.get('familia')[0]

    def get_dado(chave):
        """Procura na raiz (Paciente). Se não achar, procura na Família."""
        valor = dados.get(chave)
        if (valor is None or valor == "" or valor == []) and dados_familia:
            valor = dados_familia.get(chave)
        return formatar_valor(valor)
    # ---------------------------------------------

    # --- CABEÇALHO ---
    if os.path.exists(LOGO_PATH):
        try:
            img = Image(LOGO_PATH, width=50, height=50)
            img.hAlign = "CENTER"
            story.append(img)
            story.append(Spacer(1, 10))
        except:
            pass

    story.append(Paragraph(f"Prontuário Digital: {dados.get('nome', 'N/A')}", style_titulo))
    
    # Dados Topo
    story.append(Paragraph(f"<b>CPF:</b> {dados.get('cpf', 'N/A')} | <b>Gerado em:</b> {datetime.now().strftime('%d/%m/%Y %H:%M')}", style_texto))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CCCCCC"), spaceBefore=10, spaceAfter=10))

    # ==========================================================
    # 1. PERFIL DO PACIENTE & ANAMNESE
    # ==========================================================
    story.append(Paragraph("1. Perfil Clínico e Anamnese", style_subtitulo))
    
    # Grid de informações básicas (Usa get_dado para buscar em qualquer lugar)
    dados_perfil = [
        ("Faixa Etária", "faixa_etaria"),
        ("Sexo", "sexo"),
        ("Alimentação", "alimentacao"),
        ("Atividade Física", "atividade_fisica"),
    ]
    
    texto_perfil = []
    for label, chave in dados_perfil:
        texto_perfil.append(f"<b>{label}:</b> {get_dado(chave)}")
    story.append(Paragraph(" | ".join(texto_perfil), style_texto))
    story.append(Spacer(1, 8))

    # Histórico Médico
    story.append(Paragraph(f"<b>Comorbidades Prévias:</b> {get_dado('comorbidades')}", style_texto))
    story.append(Paragraph(f"<b>Histórico Familiar:</b> {get_dado('historico_familiar')}", style_texto))
    story.append(Paragraph(f"<b>Medicamentos de Uso Diário:</b> {get_dado('medicamento_uso_diario_qual')}", style_texto))
    
    # Linha do Tempo
    story.append(Spacer(1, 8))
    story.append(Paragraph("<b>Janela de Tempo (Relatada):</b>", style_label))
    
    # Aqui estava o problema: agora ele busca na família se não achar no paciente
    tempo_sintomas = get_dado('tempo_inicio_sintomas')
    tempo_hospital = get_dado('tempo_chegada_hospital')
    
    story.append(Paragraph(f"Início Sintomas: {tempo_sintomas}  ->  Chegada Hospital: {tempo_hospital}", style_texto))


    # ==========================================================
    # 2. EVOLUÇÃO PROFISSIONAL
    # ==========================================================
    profs = dados.get('profissional', [])
    if profs and isinstance(profs, list):
        story.append(Paragraph(f"2. Atendimentos Profissionais ({len(profs)})", style_subtitulo))
        
        for i, p in enumerate(profs):
            bloco_prof = []
            bloco_prof.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#007BFF"), spaceBefore=5, spaceAfter=5))
            
            data_atend = formatar_data_iso(p.get('data_atendimento'))
            nome_prof = formatar_valor(p.get('nome_profissional'))
            tipo_atend = formatar_valor(p.get('tipo_atendimento'))
            
            bloco_prof.append(Paragraph(f"<b>Data:</b> {data_atend} | <b>Profissional:</b> {nome_prof} ({tipo_atend})", style_label))
            bloco_prof.append(Spacer(1, 4))
            
            if p.get('sinais_vitais'):
                bloco_prof.append(Paragraph(f"<b>Sinais Vitais:</b> {formatar_valor(p.get('sinais_vitais'))}", style_texto))
            
            if p.get('evolucao_paciente'):
                bloco_prof.append(Paragraph(f"<b>Evolução Clínica:</b> {formatar_valor(p.get('evolucao_paciente'))}", style_texto))
            
            meds = formatar_valor(p.get('ajustes_medicacao') or p.get('medicamentos_utilizados'))
            if meds != " - ":
                bloco_prof.append(Paragraph(f"<b>Medicação/Ajustes:</b> {meds}", style_texto))

            desfecho = formatar_valor(p.get('desfecho'))
            sequelas = formatar_valor(p.get('sequelas'))
            
            txt_desfecho = f"<b>Desfecho:</b> {desfecho}"
            if sequelas != " - ":
                txt_desfecho += f" | <b>Sequelas Observadas:</b> {sequelas}"
            
            bloco_prof.append(Spacer(1, 4))
            bloco_prof.append(Paragraph(txt_desfecho, style_alerta if desfecho == 'Óbito' else style_label))
            
            story.append(KeepTogether(bloco_prof))


    # ==========================================================
    # 3. RELATOS DA FAMÍLIA
    # ==========================================================
    fams = dados.get('familia', [])
    if fams and isinstance(fams, list):
        story.append(Paragraph(f"3. Relatos Familiares/Acompanhantes ({len(fams)})", style_subtitulo))
        
        for f in fams:
            bloco_fam = []
            bloco_fam.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey, spaceBefore=5, spaceAfter=5))
            
            parentesco = formatar_valor(f.get('grau_parentesco'))
            bloco_fam.append(Paragraph(f"<b>Relato de:</b> {parentesco}", style_label))
            
            if f.get('sinais_alerta'):
                 bloco_fam.append(Paragraph(f"<b>Sinais de Alerta Notados:</b> {formatar_valor(f.get('sinais_alerta'))}", style_alerta))
            
            if f.get('humor_paciente'):
                 bloco_fam.append(Paragraph(f"<b>Humor do Paciente:</b> {formatar_valor(f.get('humor_paciente'))}", style_texto))
            
            if f.get('observacoes_gerais'):
                 bloco_fam.append(Paragraph(f"<b>Observações:</b> <i>{formatar_valor(f.get('observacoes_gerais'))}</i>", style_texto))
            
            story.append(KeepTogether(bloco_fam))

    # Rodapé
    story.append(Spacer(1, 30))
    story.append(Paragraph("Documento gerado para fins de acompanhamento clínico.", 
        ParagraphStyle(name="Footer", fontSize=8, alignment=1, textColor=colors.grey)))

    doc.build(story)
    return caminho_completo

# --- EXECUÇÃO ---
if __name__ == "__main__":
    try:
        input_data = sys.stdin.read()
        if not input_data:
            print(json.dumps({"status": "erro", "mensagem": "Sem dados de entrada"}))
            sys.exit(1)

        dados_json = json.loads(input_data)
        caminho = gerar_pdf(dados_json)

        print(json.dumps({"status": "sucesso", "arquivos": [caminho]}))

    except Exception as e:
        print(json.dumps({"status": "erro", "mensagem": str(e)}))
        sys.exit(1)