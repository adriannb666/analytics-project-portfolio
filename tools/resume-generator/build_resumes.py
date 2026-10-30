from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pypdf import PdfReader
import pypdfium2 as pdfium
from PIL import Image, ImageOps, ImageDraw

ROOT = Path(__file__).parent
OUT = ROOT / 'output' / 'pdf'
QA = ROOT / 'tmp' / 'pdfs'
OUT.mkdir(parents=True, exist_ok=True)
QA.mkdir(parents=True, exist_ok=True)
FONTDIR = Path('C:/Windows/Fonts')
for name, filename in [('Resume', 'calibri.ttf'), ('ResumeBold', 'calibrib.ttf'), ('ResumeItalic', 'calibrii.ttf')]:
    pdfmetrics.registerFont(TTFont(name, str(FONTDIR / filename)))
pdfmetrics.registerFontFamily('Resume', normal='Resume', bold='ResumeBold', italic='ResumeItalic', boldItalic='ResumeBold')

W, H = 612, 792
LEFT, RIGHT = 39, 573
WIDTH = RIGHT - LEFT
INK = colors.HexColor('#17212B')

class Resume:
    def __init__(self, path, title):
        self.c = canvas.Canvas(str(path), pagesize=(W, H))
        self.c.setTitle('Yitian Zhang | ' + title)
        self.c.setAuthor('Yitian Zhang')
        self.y = H - 33
        self.lowest = H
        self.body = ParagraphStyle('body', fontName='Resume', fontSize=10, leading=11.8, textColor=INK)
        self.c.setFillColor(INK)
        self.c.setFont('ResumeBold', 21)
        self.c.drawCentredString(W / 2, self.y - 17, 'YITIAN ZHANG')
        self.y -= 32
        self.c.setFont('Resume', 9.5)
        self.c.drawCentredString(W / 2, self.y, 'Boston, MA  |  +1 555-0100  |  your.name@example.com')
        self.y -= 10

    def para(self, text, indent=0, size=None, after=0):
        st = self.body if size is None else ParagraphStyle('s', parent=self.body, fontSize=size, leading=size+1.8)
        p = Paragraph(text, st)
        _, height = p.wrap(WIDTH - indent, H)
        p.drawOn(self.c, LEFT + indent, self.y - height)
        self.y -= height + after
        self.lowest = min(self.lowest, self.y)

    def row(self, left, right='', bold=False, size=10):
        font = 'ResumeBold' if bold else 'Resume'
        self.c.setFillColor(INK)
        self.c.setFont(font, size)
        self.c.drawString(LEFT, self.y-size, left)
        if right:
            assert pdfmetrics.stringWidth(left, font, size)+pdfmetrics.stringWidth(right, font, size)+12 < WIDTH, (left,right)
            self.c.drawRightString(RIGHT, self.y-size, right)
        self.y -= size + 2.1
        self.lowest = min(self.lowest,self.y)

    def section(self, title):
        self.y -= 7
        self.row(title, bold=True, size=10.6)
        self.c.setStrokeColor(colors.HexColor('#9AA3AB'))
        self.c.setLineWidth(.45)
        self.c.line(LEFT, self.y-1, RIGHT, self.y-1)
        self.y -= 5

    def bullet(self, text):
        self.c.setFillColor(INK)
        self.c.setFont('Resume', 10)
        self.c.drawString(LEFT+1, self.y-9.6, '\u2022')
        self.para(escape(text), indent=11, after=1.6)

    def job(self, company, location, role, dates, bullets, note=None):
        self.row(company, location, bold=True)
        self.row(role, dates)
        if note: self.para('<i>'+escape(note)+'</i>', size=9.2, after=1)
        for t in bullets: self.bullet(t)
        self.y -= 3

    def project(self, title, label, bullets):
        self.row(title, label, bold=True)
        for t in bullets: self.bullet(t)
        self.y -= 2

    def education(self):
        self.section('EDUCATION')
        self.row('BOSTON UNIVERSITY, Metropolitan College', 'Boston, MA', bold=True)
        self.para('M.S. in Applied Business Analytics | Expected coursework completion: Dec 2027')
        self.para('<b>Honors: 2026 ABA@BU Hackathon Winner</b> | Team League of Page')
        self.para('Scholarship: $10,000 | Coursework: Business Analytics, Python and SQL, Strategic Management', size=9.5)
        self.y -= 4
        self.row('KENYON COLLEGE', 'Gambier, OH', bold=True)
        self.para('B.A. in Applied Mathematics | May 2026')
        self.para('Coursework: Regression Analysis, Statistical Modeling, Optimization, Dynamic Programming', size=9.5)

    def finish(self):
        assert self.lowest >= 31, f'Content too low: {self.lowest}'
        self.c.showPage()
        self.c.save()
        return self.lowest

citic = 'Compared offshore financing, foreign-currency deposits, and forward contracts for a six-month import-financing case with a mentor, evaluating financing economics and foreign-exchange risk.'
ten = 'Researched business models, competitive positioning, growth drivers, risks, and catalysts for Tesla, Meituan, Boeing, Coinbase, and Circle; produced five investment reports and presentations.'
platform = 'Developed digital-asset platform partnerships associated with $330M+ in cumulative trading volume from referred users; managed research content, community engagement, and onboarding.'
retention = 'Managed user onboarding and community engagement; recorded 61.1% first-week retention in a 90-member acquisition cohort.'
content = 'Created content generating 1,077,000 cumulative likes across Douyin, Xiaohongshu, and WeChat Channels as of Sep 2026.'

def entrepreneurship(r, investment=False):
    r.row('AD MARKET RESEARCH', 'Jan 2026 - Present', bold=True)
    r.row('Founder')
    r.para('Independent Content Creator | Oct 2022 - Present', size=9.5, after=1)
    if investment:
        r.bullet('Founded an independent research platform covering U.S. equities, macroeconomics, and digital assets; publish market analysis and educational content.')
    if investment:
        r.bullet('Built digital-asset platform partnerships associated with $330M+ in cumulative referred trading volume; managed research content and community engagement.')
    else:
        r.bullet(retention)
        r.bullet(platform)
    if not investment: r.bullet(content)

paths=[]
def make_analytics():
    p=OUT/'Yitian_Zhang_Business_DataAnalytics_Resume_Targeted.pdf'
    r=Resume(p,'Business and Data Analytics')
    r.education()
    r.section('SELECTED ANALYTICAL PROJECTS')
    r.project('Talent Acquisition & Employer Benchmarking', '2026 ABA@BU Hackathon Winner', [
        'Used Python to prepare and screen 504 job postings and 1,245 employee reviews across three consulting firms; calculated theme mention rates separately for each source.',
        'Examined source passages and presented charts and peer examples supporting recommendations on training-to-project alignment and usable learning time.'
    ])
    r.project('Loan Approval Prediction', 'MATLAB | Spring 2026', [
        'Co-developed a least-squares classification model in a two-person team using categorical encoding, numeric standardization, and an 80/20 stratified train-test split.',
        'Evaluated classification accuracy against a majority-class baseline and tested the contribution of credit score through ablation analysis.'
    ])
    r.project('Airline Fleet and Route Optimization', 'MATLAB | Sep 2024', [
        'Collaborated in a three-person team on linear and mixed-integer models for a $160M fleet-planning case; recommended a $154M fleet with $163,600 modeled daily profit under route and flight-time constraints.'
    ])
    r.section('RELEVANT EXPERIENCE')
    r.job('CHINA CITIC BANK','Nanjing, China','International Business Intern','Aug 2026',[citic])
    r.job('TEN ASSETS MANAGEMENT LIMITED','Hong Kong and Shenzhen','Research Assistant','May - Jul 2025',[
        'Synthesized Bloomberg company, industry, and market data into five reports and presentations covering Tesla, Meituan, Boeing, Coinbase, and Circle; communicated findings in investment meetings.'
    ])
    r.job('BANK OF NANJING','Nanjing, China','Corporate Banking Intern','May - Jul 2026',[
        'Maintained Excel trackers, organized corporate-client documentation, and prepared PowerPoint materials supporting departmental operations.'
    ])
    r.section('ENTREPRENEURSHIP')
    entrepreneurship(r)
    r.section('TECHNICAL SKILLS')
    r.para('<b>Programming:</b> Python (data preparation, text screening, visualization), MATLAB, R; SQL (basic)',size=9.5)
    r.para('<b>Methods:</b> Regression, model evaluation, linear optimization, descriptive analysis, Monte Carlo simulation',size=9.5)
    r.para('<b>Business tools:</b> Excel, PowerPoint, Bloomberg Terminal',size=9.5)
    r.para('<b>Languages:</b> Mandarin Chinese (native), English (professional)',size=9.5)
    paths.append((p,r.finish()))

def make_consulting():
    p=OUT/'Yitian_Zhang_ConsultingStrategy_Resume_Targeted.pdf'
    r=Resume(p,'Consulting and Strategy')
    r.education()
    r.section('PROFESSIONAL EXPERIENCE')
    r.job('CHINA CITIC BANK','Nanjing, China','International Business Intern','Aug 2026',[citic])
    r.job('TEN ASSETS MANAGEMENT LIMITED','Hong Kong and Shenzhen','Research Assistant','May - Jul 2025',[
        'Compared business models, competitive positioning, and growth risks across Tesla, Meituan, Boeing, Coinbase, and Circle; delivered five research reports and presentations.',
        'Used Bloomberg company and industry data to support analysis; presented findings in investment meetings.'
    ])
    r.job('SUPERBRAIN AI INCUBATOR','Shanghai, China','Strategy and Operations Intern','Jun - Aug 2024',[
        'Coordinated staffing, schedules, task ownership, and follow-up across Realmfy, an Apple Vision Pro app, and Mindog, an LLM-enabled robotic dog.',
        'Translated AI education objectives into product requirements; supported Realmfy development and App Store launch and contributed to Mindog commercialization discussions.'
    ],note="Startup project under Shanghai Jiao Tong University's Industrial Research Institute")
    r.section('ENTREPRENEURSHIP AND LEADERSHIP')
    entrepreneurship(r)
    r.section('SELECTED PROJECTS')
    r.project('Talent Acquisition & Employer Benchmarking', '2026 ABA@BU Hackathon Winner', [
        'Benchmarked employer messaging and employee accounts across three consulting firms using 504 job postings and 1,245 reviews to assess early-career talent support.',
        'Presented findings and peer cases for a talent-acquisition audience, supporting two priorities: training-to-project alignment and usable learning time.'
    ])
    r.project('Airline Fleet and Route Optimization','MATLAB | Sep 2024',[
        'Co-developed linear and mixed-integer models in a three-person team for a $160M fleet-planning case; recommended 10 aircraft costing $154M with $163,600 modeled daily profit under route and flight-time constraints.'
    ])
    r.section('SKILLS')
    r.para('<b>Methods:</b> Peer benchmarking, company research, financing comparison, linear optimization, project coordination',size=9.5)
    r.para('<b>Tools:</b> Excel, PowerPoint, Bloomberg Terminal, MATLAB, R; Python (text analysis); SQL (basic)',size=9.5)
    r.para('<b>Languages:</b> Mandarin Chinese (native), English (professional)',size=9.5)
    paths.append((p,r.finish()))

def make_investment():
    p=OUT/'Yitian_Zhang_InvestmentResearch_Resume_Targeted.pdf'
    r=Resume(p,'Investment Research')
    r.education()
    r.section('INVESTMENT AND FINANCIAL EXPERIENCE')
    r.job('TEN ASSETS MANAGEMENT LIMITED','Hong Kong and Shenzhen','Research Assistant','May - Jul 2025',[
        ten,'Used Bloomberg company, industry, and market data to support research; presented findings in investment meetings.'
    ])
    r.job('CHINA CITIC BANK','Nanjing, China','International Business Intern','Aug 2026',[
        citic,'Analyzed foreign-exchange developments and corporate hedging alternatives; prepared responses to client questions and materials for customer events.'
    ])
    r.job('CSC FINANCIAL','Nanjing, China','Investment Advisory Intern','May - Jun 2024',[
        'Researched macroeconomic developments, equity-market trends, and sector themes; collected market data and prepared client-facing presentations supporting investment advisory discussions.'
    ])
    r.section('INDEPENDENT RESEARCH AND ENTREPRENEURSHIP')
    entrepreneurship(r,investment=True)
    r.section('SELECTED RESEARCH PROJECTS')
    r.project('Bitcoin Portfolio Rebalancing','Capstone',[
        'Modeled allocation as a finite-horizon Markov decision process with 11 portfolio weights and 60-day rolling return estimates; used backward Bellman recursion to balance expected returns, risk, and trading costs.',
        'Compared the learned allocation policy with buy-and-hold over a 2024-2025 validation period, examining portfolio equity and drawdowns.'
    ])
    r.project('Gold and Bitcoin Trading Strategy','Python | Dec 2024',[
        'Co-developed an EMA trading strategy in a three-person team, combining VaR/CVaR portfolio constraints with 1% gold and 2% Bitcoin transaction fees in a 2016-2021 historical simulation.',
        'Reported a simulated ending value of $13,236 from $1,000; maximum drawdown was approximately 47% versus 81% for buy-and-hold, with lower terminal wealth than the benchmark.'
    ])
    r.section('ADDITIONAL EXPERIENCE AND SKILLS')
    r.para('<b>Bank of Nanjing:</b> Corporate Banking Intern | May - Jul 2026; Excel tracking and client documentation.',size=9.5)
    r.para('<b>Research:</b> Business models, competitive positioning, catalysts, FX risk, portfolio allocation, drawdown analysis',size=9.5)
    r.para('<b>Tools:</b> Bloomberg Terminal, Excel, PowerPoint, MATLAB, R; Python (project use); SQL (basic)',size=9.5)
    r.para('<b>Languages:</b> Mandarin Chinese (native), English (professional)',size=9.5)
    paths.append((p,r.finish()))

make_analytics()
make_consulting()
make_investment()
thumbnails=[]
for path,low in paths:
    reader=PdfReader(path)
    assert len(reader.pages)==1
    text=reader.pages[0].extract_text()
    assert '2026 ABA@BU Hackathon Winner' in text
    assert 'Team League of Page' in text
    assert 'Expected coursework completion: Dec 2027' in text
    assert 'YITIAN ZHANG' in text
    assert 'Languages:' in text
    pdf=pdfium.PdfDocument(str(path))
    image=pdf[0].render(scale=1.6).to_pil().convert('RGB')
    image.save(QA/(path.stem+'.png'))
    thumb=image.copy()
    thumb.thumbnail((612,792))
    thumbnails.append(thumb)
    print(f'{path.name}: 1 page; bottom={low:.1f}pt; award verified')
sheet=Image.new('RGB',(3*632,832),'#DDE2E6')
draw=ImageDraw.Draw(sheet)
for i,(thumb,label) in enumerate(zip(thumbnails,['Business / Data Analytics','Consulting / Strategy','Investment Research'])):
    sheet.paste(thumb,(i*632+10,30))
    draw.text((i*632+12,10),label,fill='black')
sheet.save(QA/'review_all.png')
