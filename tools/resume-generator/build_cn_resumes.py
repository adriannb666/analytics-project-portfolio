from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK, WD_TAB_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from pypdf import PdfReader
import pypdfium2 as pdfium
from PIL import Image, ImageDraw

ROOT = Path(__file__).parent
OUT = ROOT / 'output' / '中国大陆校招'
QA = ROOT / 'tmp' / 'cn_resumes'
OUT.mkdir(parents=True, exist_ok=True)
QA.mkdir(parents=True, exist_ok=True)
NAME = '张逸天'
CONTACT = '+1 555-0100  |  your.name@example.com  |  现居美国波士顿'
pdfmetrics.registerFont(TTFont('CN', 'C:/Windows/Fonts/simsun.ttc', subfontIndex=0))
pdfmetrics.registerFont(TTFont('CNBold', 'C:/Windows/Fonts/simhei.ttf'))
pdfmetrics.registerFontFamily('CN', normal='CN', bold='CNBold', italic='CN', boldItalic='CNBold')

def section(name): return ('section', name, '')
def row(left, right=''): return ('row', left, right)
def line(text): return ('line', text, '')
def bullet(label, text): return ('bullet', label, text)

EDU = [
    section('教育背景'),
    row('波士顿大学 Boston University｜Metropolitan College', '预计2027.12完成课程'),
    line('应用商业分析｜理学硕士（M.S.）　奖学金：10,000美元'),
    line('相关课程：商业分析、Python与SQL、战略管理'),
    row('Kenyon College（美国）', '2026.05毕业'),
    line('应用数学｜学士（B.A.）　相关课程：回归分析、统计建模、优化、动态规划'),
    line('竞赛荣誉：2026 ABA@BU Hackathon Winner｜获奖团队 League of Page 成员'),
]

CITIC = [
    row('中信银行｜国际业务实习生', '2026.08｜南京'),
    bullet('方案比较', '在导师指导下分析六个月进口融资案例，对比境外融资、外币存款与远期合约，评估融资经济性及汇率风险。'),
]
TEN_DATA = [
    row('TEN Assets Management Limited｜研究助理', '2025.05—2025.07｜香港／深圳'),
    bullet('研究交付', '使用Bloomberg整理公司、行业及市场数据，完成特斯拉、美团、波音、Coinbase、Circle的5份研究报告及演示材料，并在投资会议中汇报。'),
]
NANJING = [
    row('南京银行｜公司银行实习生', '2026.05—2026.07｜南京'),
    bullet('数据与材料', '维护Excel台账、整理企业客户资料，制作PowerPoint材料，支持部门日常运营。'),
]
AI = [
    row('Superbrain AI Incubator｜战略与运营实习生', '2024.06—2024.08｜上海'),
    line('上海交通大学产业研究院旗下创业项目'),
    bullet('项目协同', '协调Apple Vision Pro应用Realmfy与大模型机器狗Mindog的人力、排期、任务分工及进度跟进。'),
    bullet('产品推进', '将AI教育目标转化为产品需求，支持Realmfy迭代与App Store上线，参与Mindog商业化讨论。'),
]
HACK_DATA = [
    row('人才招聘与雇主对标分析｜Python', '2026.10｜ABA@BU Hackathon'),
    bullet('数据分析', '分析三家咨询公司的504条招聘广告与1,245条员工评论，使用Python整理数据、按关键词筛选文本，分别计算各来源的主题提及率。'),
    bullet('业务呈现', '结合原文案例与图表展示，提出培训与首个项目衔接、保障可用学习时间两项建议；所在团队获评Winner。'),
]
HACK_CONSULT = [
    row('人才招聘与雇主对标分析', '2026.10｜ABA@BU Hackathon'),
    bullet('同行对标', '基于504条招聘广告及1,245条员工评论，比较Accenture、Booz Allen Hamilton与Capgemini的雇主宣传与员工反馈。'),
    bullet('建议汇报', '面向招聘管理场景呈现数据发现与同行案例，支持培训与项目匹配、保障学习时间两项建议；所在团队获评Winner。'),
]
LOAN = [
    row('贷款审批预测｜MATLAB', '2026年春季'),
    bullet('模型构建', '两人合作构建最小二乘分类模型，进行类别编码、数值标准化及80／20分层训练测试划分。'),
    bullet('模型评估', '通过测试集、混淆矩阵、RMSE与变量移除分析评价模型表现及信用评分的贡献。'),
]
FLEET = [
    row('航空机队与航线优化｜MATLAB', '2024.09'),
    bullet('优化决策', '三人合作建立线性与混合整数规划模型，在1.6亿美元案例预算和航线、飞行时长约束下，推荐成本1.54亿美元的10架机队，模型日利润为163,600美元。'),
]
CREATOR = [
    row('AD Market Research｜创始人', '2026.01—至今'),
    line('独立内容创作：2022.10—至今'),
    bullet('用户运营', '开展用户引导与社群互动，90人获客群体的首周留存率为61.1%。'),
    bullet('内容传播', '制作研究与科普内容；截至2026年9月，抖音、小红书及微信视频号累计获赞107.7万次。'),
]
TEN_INVEST = [
    row('TEN Assets Management Limited｜研究助理', '2025.05—2025.07｜香港／深圳'),
    bullet('公司研究', '研究特斯拉、美团、波音、Coinbase及Circle的商业模式、竞争格局、增长驱动、风险与催化因素，完成5份投资研究报告及演示材料。'),
    bullet('信息整合', '使用Bloomberg整理公司、行业及市场数据，并在投资会议中汇报研究发现。'),
]
CSC = [
    row('中信建投证券｜投资顾问实习生', '2024.05—2024.06｜南京'),
    bullet('市场研究', '跟踪宏观经济、股票市场与行业主题，收集市场数据并制作客户演示材料，支持投资顾问沟通。'),
]
BITCOIN = [
    row('比特币组合再平衡｜毕业设计', ''),
    bullet('配置建模', '将资产配置建模为有限时域马尔可夫决策过程，设置11档组合权重，以60日滚动收益估计和贝尔曼逆向递推权衡收益、风险与交易成本。'),
    bullet('策略评估', '在2024—2025年验证区间对比动态配置与买入持有策略，分析组合净值及回撤表现。'),
]
GOLD = [
    row('黄金与比特币交易策略｜Python', '2024.12'),
    bullet('历史回测', '三人合作开发EMA策略，结合VaR／CVaR组合约束，计入黄金1%、比特币2%的交易费用，开展2016—2021年历史模拟。'),
    bullet('风险收益', '模拟初始资金1,000美元、期末13,236美元；最大回撤约47%，买入持有约81%，但策略期末资产低于买入持有基准。'),
]

DATA = EDU + [section('项目经历')] + HACK_DATA + LOAN + FLEET + [section('实习经历')] + CITIC + NANJING + TEN_DATA + [section('创业与实践')] + CREATOR + [
    section('专业技能'),
    line('编程与分析：Python（数据整理、文本筛选、可视化）、MATLAB、R；SQL基础'),
    line('分析方法：回归、模型评估、描述性分析、线性优化、蒙特卡洛模拟'),
    line('办公与语言：Excel、PowerPoint、Bloomberg；中文母语，英语可用于工作沟通与汇报'),
]
CONSULT = EDU + [section('实习经历')] + CITIC + TEN_INVEST + AI + [section('项目经历')] + HACK_CONSULT + FLEET + [section('创业与实践')] + CREATOR + [
    section('专业技能'),
    line('研究与协同：公司研究、同行对标、融资方案比较、项目协调、线性优化'),
    line('工具与语言：Excel、PowerPoint、Bloomberg、MATLAB、R；Python文本分析、SQL基础；英语工作沟通'),
]
INVEST = EDU + [section('实习经历')] + TEN_INVEST + CITIC + [
    bullet('客户支持', '分析外汇市场与企业套保选择，准备客户问题答复及客户活动材料。'),
] + CSC + [section('研究项目')] + BITCOIN + GOLD + [section('独立研究与实践'),
    row('AD Market Research｜创始人', '2026.01—至今'),
    line('独立内容创作：2022.10—至今'),
    bullet('研究传播', '围绕美股、宏观经济与数字资产开展独立研究，发布市场分析与科普内容，负责研究内容及社群交流。'),
    section('专业技能'),
    line('研究方法：商业模式与竞争分析、催化因素梳理、外汇风险分析、资产配置、回撤分析'),
    line('工具与语言：Bloomberg、Excel、PowerPoint、MATLAB、R；Python项目应用、SQL基础；英语工作沟通'),
    line('其他经历：南京银行公司银行实习（2026.05—2026.07），维护Excel台账、整理企业客户资料。'),
]

def set_font(run, name='宋体', size=10.5, bold=False):
    run.font.name='Calibri'
    run.font.size=Pt(size)
    run.font.bold=bold
    run.font.color.rgb=RGBColor(0,0,0)
    run._element.get_or_add_rPr().get_or_add_rFonts().set(qn('w:eastAsia'),name)

def make_docx(stem, intention, items):
    d=Document()
    sec=d.sections[0]
    sec.page_width=Cm(21); sec.page_height=Cm(29.7)
    sec.top_margin=Cm(1.25); sec.bottom_margin=Cm(1.25)
    sec.left_margin=Cm(1.45); sec.right_margin=Cm(1.45)
    normal=d.styles['Normal']
    normal.font.name='Calibri'; normal.font.size=Pt(10.5)
    normal.element.get_or_add_rPr().get_or_add_rFonts().set(qn('w:eastAsia'),'宋体')
    normal.paragraph_format.space_after=Pt(0)
    normal.paragraph_format.line_spacing=Pt(14.5)
    normal.paragraph_format.widow_control=False
    for style in ['Title','Heading 1']:
        d.styles[style].font.color.rgb=RGBColor(0,0,0)
    for border in list(d.styles['Title'].element.xpath('./w:pPr/w:pBdr')):
        border.getparent().remove(border)
    p=d.add_paragraph(style='Title'); p.alignment=WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before=Pt(0); p.paragraph_format.space_after=Pt(3)
    p.paragraph_format.line_spacing=Pt(25)
    set_font(p.add_run(NAME),'黑体',20,True)
    p=d.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER
    set_font(p.add_run('求职意向：'+intention),'黑体',10.5,True)
    p=d.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after=Pt(3)
    set_font(p.add_run(CONTACT),size=9)
    for kind,a,b in items:
        p=d.add_paragraph()
        f=p.paragraph_format
        if kind=='section':
            f.space_before=Pt(5); f.space_after=Pt(3); f.keep_with_next=True
            set_font(p.add_run(a),'黑体',11,True)
            borders=OxmlElement('w:pBdr'); border=OxmlElement('w:bottom')
            for k,v in [('val','single'),('sz','4'),('space','2'),('color','A0A0A0')]:border.set(qn('w:'+k),v)
            borders.append(border); p._p.get_or_add_pPr().append(borders)
        elif kind=='row':
            f.space_before=Pt(2); f.keep_with_next=True
            f.tab_stops.add_tab_stop(Cm(18.1),WD_TAB_ALIGNMENT.RIGHT)
            set_font(p.add_run(a),'黑体',10.5,True)
            if b:set_font(p.add_run('\t'+b),size=9)
        elif kind=='bullet':
            f.left_indent=Pt(9); f.first_line_indent=Pt(-9)
            set_font(p.add_run('• '+a+'：'),bold=True)
            set_font(p.add_run(b))
        else:
            set_font(p.add_run(a),size=10)
    d.core_properties.title=NAME+' '+intention+' 校招简历'
    d.core_properties.author=NAME
    d.save(OUT/(stem+'.docx'))

def make_pdf(stem,intention,items):
    path=OUT/(stem+'.pdf')
    c=canvas.Canvas(str(path),pagesize=A4)
    c.setTitle(NAME+' '+intention+' 校招简历'); c.setAuthor(NAME)
    w,h=A4; left=41.1; right=w-left; width=right-left
    y=h-35.4
    c.setFont('CNBold',20); c.drawCentredString(w/2,y-18,NAME); y-=30
    c.setFont('CNBold',10.5); c.drawCentredString(w/2,y,'求职意向：'+intention); y-=15
    c.setFont('CN',9); c.drawCentredString(w/2,y,CONTACT); y-=9
    st=ParagraphStyle('CN',fontName='CN',fontSize=10.5,leading=14.5,wordWrap='CJK')
    small=ParagraphStyle('small',parent=st,fontSize=10,leading=14.5)
    for kind,a,b in items:
        if kind=='section':
            y-=7; c.setFont('CNBold',11); c.drawString(left,y-11,a); y-=16
            c.setStrokeColorRGB(.63,.63,.63); c.setLineWidth(.4); c.line(left,y,right,y); y-=4
        elif kind=='row':
            y-=2
            assert pdfmetrics.stringWidth(a,'CNBold',10.5)+pdfmetrics.stringWidth(b,'CN',9)+8 < width,(a,b)
            c.setFont('CNBold',10.5); c.drawString(left,y-10.5,a)
            c.setFont('CN',9); c.drawRightString(right,y-10.5,b); y-=14.5
        else:
            text=('<b>'+escape(a)+'：</b>'+escape(b)) if kind=='bullet' else escape(a)
            indent=9 if kind=='bullet' else 0
            if indent:
                c.setFont('CN',9); c.drawString(left,y-9.5,'•')
            p=Paragraph(text,st if indent else small)
            _,ph=p.wrap(width-indent,h)
            p.drawOn(c,left+indent,y-ph); y-=ph
    assert y>32,(stem,y)
    c.showPage(); c.save()
    pdf=PdfReader(path)
    assert len(pdf.pages)==1
    txt=pdf.pages[0].extract_text()
    assert '2026 ABA@BU Hackathon Winner' in txt
    assert '2027.12' in txt and '504' in txt if stem!='校招简历_投资研究' else '2027.12' in txt
    doc=pdfium.PdfDocument(str(path)); im=doc[0].render(scale=1.7).to_pil().convert('RGB')
    im.save(QA/(stem+'.png'))
    print(stem, 'PDF: 1 page; bottom:',round(y,1))

JOBS=[('校招简历_商业与数据分析','商业分析／数据分析',DATA),('校招简历_咨询与战略','管理咨询／战略分析',CONSULT),('校招简历_投资研究','投资研究／行业研究',INVEST)]
if __name__=='__main__':
    for stem,intention,items in JOBS:
        make_docx(stem,intention,items)
        make_pdf(stem,intention,items)
