import sys
import json
import os
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

# --- CONFIGURAÇÕES ---
BASE_DIR = os.getcwd()
LOGO_PATH = os.path.join(BASE_DIR, "assets", "logoPET.png")
PASTA_SAIDA = os.path.join(BASE_DIR, "pdf_gerados")

# --- CORES LEGAIS ---
COR_FUNDO_PAGINA = colors.HexColor("#F4F4F0")
COR_AZUL_PRINCIPAL = colors.HexColor("#00569d")
COR_AZUL_CLARO = colors.HexColor("#D6E4F0")
COR_LARANJA = colors.HexColor("#E86C00")
COR_TEXTO_CINZA = colors.HexColor("#333333")
COR_BRANCO = colors.white

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

def desenhar_fundo(canvas, doc):
    """Desenha o fundo em todas as páginas"""
    canvas.saveState()
    canvas.setFillColor(COR_FUNDO_PAGINA)
    canvas.rect(0, 0, A4[0], A4[1], fill=1, stroke=0)
    canvas.restoreState()

def criar_card_info(label, valor, style_label, style_valor):
    """Cria uma pequena tabela para um par Label/Valor"""
    return Table(
        [[Paragraph(label, style_label)], [Paragraph(valor, style_valor)]],
        colWidths=['100%'],
        style=TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), COR_BRANCO),
            ('TOPPADDING', (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
            ('LEFTPADDING', (0,0), (-1,-1), 10),
            ('RIGHTPADDING', (0,0), (-1,-1), 10),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('ROUNDEDCORNERS', [4, 4, 4, 4]),
        ])
    )

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
        rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30
    )
    
    styles = getSampleStyleSheet()

    # Cabecalho
    style_header_title = ParagraphStyle('HeaderTitle', parent=styles['Heading1'], fontSize=18, textColor=COR_AZUL_PRINCIPAL, alignment=TA_LEFT, fontName="Helvetica-Bold")
    style_header_sub = ParagraphStyle('HeaderSub', parent=styles['Normal'], fontSize=10, textColor=COR_TEXTO_CINZA, alignment=TA_LEFT)

    # Títulos de Seção
    style_sec_title = ParagraphStyle('SecTitle', parent=styles['Heading2'], fontSize=14, textColor=COR_AZUL_PRINCIPAL, spaceBefore=15, spaceAfter=8, fontName="Helvetica-Bold")
    
    # Texto Geral
    style_label = ParagraphStyle('Label', parent=styles['Normal'], fontSize=8, textColor=colors.gray, fontName="Helvetica-Bold")
    style_conteudo = ParagraphStyle('Conteudo', parent=styles['Normal'], fontSize=10, textColor=COR_TEXTO_CINZA, leading=12)
    style_destaque_laranja = ParagraphStyle('Laranja', parent=styles['Normal'], fontSize=10, textColor=COR_LARANJA, fontName="Helvetica-Bold")

    story = []

    # --- LÓGICA DE RESGATE DE DADOS ---
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

    # --- CABEÇALHO ---
    logo_elem = Spacer(1, 1)
    if os.path.exists(LOGO_PATH):
        logo_elem = Image(LOGO_PATH, width=40, height=40)

    txt_topo = [
        Paragraph(f"PACIENTE: {dados.get('nome', 'N/A').upper()}", style_header_title),
        Paragraph(f"CPF: {dados.get('cpf', 'N/A')} | Gerado em: {datetime.now().strftime('%d/%m/%Y %H:%M')}", style_header_sub)
    ]

    tabela_topo = Table([[logo_elem, txt_topo]], colWidths=[50, 450])
    tabela_topo.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 15),
        ('LINEBELOW', (0,0), (-1,-1), 2, COR_AZUL_CLARO),
    ]))
    story.append(tabela_topo)
    story.append(Spacer(1, 15))

    # ==========================================================
    # 1. PERFIL DO PACIENTE & ANAMNESE
    # ==========================================================
    story.append(Paragraph("🩺 Perfil Clínico e Estilo de Vida", style_sec_title))

    # Cria cards para o grid
    card1 = criar_card_info("FAIXA ETÁRIA", get_dado("faixa_etaria"), style_label, style_conteudo)
    card2 = criar_card_info("SEXO", get_dado("sexo"), style_label, style_conteudo)
    card3 = criar_card_info("ALIMENTAÇÃO", get_dado("alimentacao"), style_label, style_conteudo)
    card4 = criar_card_info("ATIVIDADE FÍSICA", get_dado("atividade_fisica"), style_label, style_conteudo)

    # Tabela Grid 2x2
    tabela_perfil = Table([
        [card1, card2],
        [card3, card4]
    ], colWidths=['48%', '48%'])
    
    tabela_perfil.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(tabela_perfil)
    story.append(Spacer(1, 10))

    # Histórico Médico
    texto_historico = f"""
    <b>Comorbidades:</b> {get_dado('comorbidades')}<br/>
    <b>Histórico Familiar:</b> {get_dado('historico_familiar')}<br/>
    <b>Medicamentos (Uso Diário):</b> {get_dado('medicamento_uso_diario_qual')}
    """
    
    tabela_hist = Table([[Paragraph(texto_historico, style_conteudo)]], colWidths=['100%'])
    tabela_hist.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), COR_BRANCO),
        ('BOX', (0,0), (-1,-1), 1, COR_AZUL_CLARO),
        ('PADDING', (0,0), (-1,-1), 12),
        ('ROUNDEDCORNERS', [8, 8, 8, 8]),
    ]))
    story.append(tabela_hist)
    
    # Linha do Tempo
    story.append(Spacer(1, 15))
    story.append(Paragraph("⏱️ Janela de Tempo", style_sec_title))
    
    tempo_sintomas = get_dado('tempo_inicio_sintomas')
    tempo_hospital = get_dado('tempo_chegada_hospital')

    # Cria visual de seta com células coloridas
    tbl_tempo = Table([
        [
            Paragraph("INÍCIO SINTOMAS", style_label), 
            Paragraph("", style_label), 
            Paragraph("CHEGADA HOSPITAL", style_label)
        ],
        [
            Paragraph(f"<b>{tempo_sintomas}</b>", style_conteudo),
            Paragraph(" ➤ ", ParagraphStyle('Seta', fontSize=20, textColor=COR_LARANJA, alignment=TA_CENTER)),
            Paragraph(f"<b>{tempo_hospital}</b>", style_conteudo)
        ]
    ], colWidths=['40%', '20%', '40%'])
    
    tbl_tempo.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BACKGROUND', (0,0), (0,1), COR_AZUL_CLARO),
        ('BACKGROUND', (2,0), (2,1), COR_AZUL_CLARO),
        ('BOX', (0,0), (0,1), 0.5, COR_AZUL_PRINCIPAL),
        ('BOX', (2,0), (2,1), 0.5, COR_AZUL_PRINCIPAL),
        ('PADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(tbl_tempo)


    # ==========================================================
    # 2. EVOLUÇÃO PROFISSIONAL
    # ==========================================================
    profs = dados.get('profissional', [])
    if profs:
        story.append(Spacer(1, 10))
        story.append(Paragraph(f"👨‍⚕️ Atendimentos Profissionais ({len(profs)})", style_sec_title))
        
        for p in profs:
            # Dados
            data = formatar_data_iso(p.get('data_atendimento'))
            prof_nome = formatar_valor(p.get('nome_profissional'))
            tipo = formatar_valor(p.get('tipo_atendimento'))
            sinais = formatar_valor(p.get('sinais_vitais'))
            evolucao = formatar_valor(p.get('evolucao_paciente'))
            desfecho = formatar_valor(p.get('desfecho'))
            
            # Conteúdo do Card
            conteudo_card = [
                [Paragraph(f"{data} | <b>{prof_nome}</b> ({tipo})", style_destaque_laranja)],
                [Paragraph(f"<b>Sinais Vitais:</b> {sinais}", style_conteudo)],
                [Paragraph(f"<b>Evolução:</b> {evolucao}", style_conteudo)],
            ]
            
            if desfecho != " - ":
                conteudo_card.append([Paragraph(f"⚠️ <b>Desfecho:</b> {desfecho}", style_destaque_laranja)])

            tabela_prof = Table(conteudo_card, colWidths=['100%'])
            tabela_prof.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), COR_BRANCO),
                ('LEFTPADDING', (0,0), (-1,-1), 15),
                ('RIGHTPADDING', (0,0), (-1,-1), 15),
                ('TOPPADDING', (0,0), (-1,-1), 8),
                ('BOTTOMPADDING', (0,0), (-1,-1), 8),
                ('LINEBEFORE', (0,0), (0,-1), 4, COR_AZUL_PRINCIPAL), 
                ('LINEBELOW', (0,0), (-1,-2), 0.5, colors.lightgrey),
            ]))
            story.append(tabela_prof)
            story.append(Spacer(1, 8))


    # ==========================================================
    # 3. RELATOS DA FAMÍLIA
    # ==========================================================
    fams = dados.get('familia', [])
    if fams:
        story.append(Spacer(1, 10))
        story.append(Paragraph(f"🏠 Relatos Familiares ({len(fams)})", style_sec_title))
        
        for f in fams:
            parentesco = formatar_valor(f.get('grau_parentesco'))
            obs = formatar_valor(f.get('observacoes_gerais'))
            alerta = formatar_valor(f.get('sinais_alerta'))
            
            texto_fam = f"""
            <b>Fonte:</b> {parentesco}<br/>
            <b>Observações:</b> {obs}<br/>
            """
            
            linhas = [[Paragraph(texto_fam, style_conteudo)]]
            if alerta != " - ":
                linhas.append([Paragraph(f"<b>Sinais de Alerta:</b> {alerta}", style_destaque_laranja)])

            tabela_fam = Table(linhas, colWidths=['100%'])
            tabela_fam.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), COR_BRANCO),
                ('BOX', (0,0), (-1,-1), 0.5, colors.grey),
                ('PADDING', (0,0), (-1,-1), 10),
            ]))
            story.append(tabela_fam)
            story.append(Spacer(1, 5))

    doc.build(story, onFirstPage=desenhar_fundo, onLaterPages=desenhar_fundo)
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