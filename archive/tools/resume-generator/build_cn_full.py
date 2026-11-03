from pathlib import Path
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from build_cn_resumes import section, row, line, bullet, NAME, CONTACT

ROOT=Path(__file__).parent
OUT=ROOT/'output'/'中国大陆校招完整版'
QA=ROOT/'tmp'/'cn_full'
OUT.mkdir(parents=True,exist_ok=True)
QA.mkdir(parents=True,exist_ok=True)

EDU=[
    section('教育背景与竞赛荣誉'),
    row('波士顿大学 Boston University', '预计2027.12完成课程'),
    line('应用商业分析｜理学硕士（M.S.）'),
    line('奖学金：10,000美元；相关课程：商业分析、Python与SQL、战略管理。'),
    row('凯尼恩学院 Kenyon College（美国）','2026.05毕业'),
    line('应用数学｜学士（B.A.）；相关课程：回归分析、统计建模、优化、动态规划。'),
    line('竞赛荣誉：2026年波士顿大学 ABA 黑客松冠军｜League of Page 团队。'),
]
CITIC=[
    row('中信银行｜国际业务实习生','2026.08｜南京'),
    bullet('融资分析','在导师指导下分析六个月进口融资案例，对比境外融资、外币存款与远期合约，评估产品经济性与客户汇率风险。'),
    bullet('客户支持','跟踪外汇市场变化与企业套保选择，整理客户问题答复及客户活动材料，支持业务沟通。'),
]
NANJING=[
    row('南京银行｜公司业务部实习生','2026.05—2026.07｜南京'),
    bullet('风险审查支持','跟随带教参与公司及机构客户信用风险审查与评级相关工作，协助整理客户材料与分析信息。'),
    bullet('信息管理','维护Excel台账、整理企业客户资料，制作PowerPoint材料，为部门日常运营提供数据与文档支持。'),
]
TEN=[
    row('壹拾资产管理｜研究助理','2025.05—2025.07｜香港／深圳'),
    bullet('公司研究','研究特斯拉、美团、波音、Coinbase和Circle的商业模式、竞争格局、增长驱动、风险及催化因素，完成5份研究报告及演示材料。'),
    bullet('信息整合','使用彭博终端整理公司、行业及市场数据，形成研究材料，并在投资会议中汇报研究发现。'),
]
AI=[
    row('超脑AI孵化器｜战略与运营实习生','2024.06—2024.08｜上海'),
    line('上海交通大学产业研究院旗下创业项目'),
    bullet('项目协同','围绕Apple Vision Pro应用Realmfy与大模型机器狗Mindog，协调人员安排、任务分工、排期与进度跟进。'),
    bullet('产品推进','将AI教育目标转化为产品需求，支持Realmfy迭代及App Store上线，参与Mindog商业化讨论。'),
    bullet('课程与需求','参与AI教育课程内容设计，将学习目标与项目要求衔接，支持产品团队理解教育使用场景。'),
]
CSC=[
    row('中信建投证券｜投资顾问实习生','2024.05—2024.06｜南京'),
    bullet('市场跟踪','围绕宏观经济、股票市场走势与行业主题收集市场信息，为投资顾问讨论准备资料。'),
    bullet('客户材料','整理市场数据并制作面向客户的演示材料，支持投资观点与市场信息的呈现。'),
]
LOAN=[
    row('贷款审批预测｜MATLAB','2026年春季'),
    bullet('建模流程','两人合作构建最小二乘分类模型，使用独热编码处理类别变量、Z-score标准化数值变量，采用80／20分层划分训练集与测试集，并以0.5阈值生成审批分类。'),
    bullet('效果评估','通过测试集、混淆矩阵、RMSE与变量移除分析评价模型表现及信用评分的贡献。'),
]
FLEET=[
    row('航空机队与航线优化｜MATLAB','2024.09'),
    bullet('资源配置','三人合作建立线性与混合整数规划模型，将1.6亿美元案例预算分配到飞机采购与四条航线，考虑服务需求及飞行时长约束。'),
    bullet('方案比较','比较连续解与整数解，推荐采购10架飞机、成本1.54亿美元的方案；模型日利润为163,600美元，属于案例测算结果。'),
]
MONTE=[
    row('数值算法蒙特卡洛分析｜R','2025年秋季'),
    bullet('模拟评估','三人合作研究平方根迭代算法，在R中以最多20万次抽样估计期望平方误差，对比固定初始值与随输入成比例的初始值两类方案。'),
    bullet('条件比较','分别设置均值为10和250的指数输入分布，在1—3次迭代条件下搜索近似最优初始值，比较输入尺度、初始化方式与迭代次数对误差的影响。'),
]
SCHEDULE=[
    row('沼气厂施工排程分析｜MATLAB','2025.05'),
    bullet('计划建模','三人合作对15项活动进行前推、后推与时差分析，建立施工任务的依赖关系与时间安排。'),
    bullet('关键路径','在修正依赖关系假设后，计算得到38周工期与两条关键路径，识别影响整体排程的关键任务。'),
]
HACK_DATA=[
    row('人才招聘与雇主对标分析｜Python','2026.10｜黑客松冠军'),
    bullet('文本分析','基于Accenture、Booz Allen Hamilton和Capgemini的504条招聘广告及1,245条员工评论，整理数据并以关键词和正则表达式筛选主题，分别统计各来源的提及率。'),
    bullet('解释与呈现','围绕职业发展、工作安排与薪酬福利核对原文和同行案例，参与呈现招聘广告、员工评论与案例对比，支持培训与首个项目衔接、保障学习时间两项建议。'),
]
HACK_CONSULT=[
    row('人才招聘与雇主对标分析','2026.10｜黑客松冠军'),
    bullet('问题拆解','比较Accenture、Booz Allen Hamilton和Capgemini的504条招聘广告与1,245条员工评论，区分雇主宣传、员工反馈和分析判断，识别值得进一步核查的人才培养问题。'),
    bullet('建议沟通','面向招聘管理场景呈现图表及同行案例，支持培训与首个项目衔接、保障可用学习时间两项建议；解释样本岗位、地区和日期差异对结论的限制。'),
]
BTC=[
    row('比特币组合再平衡｜毕业设计',''),
    bullet('决策建模','将组合配置表示为有限时域马尔可夫决策过程，设置11档组合权重，以60日滚动收益估计及贝尔曼逆向递推权衡预期收益、风险与交易成本。'),
    bullet('策略比较','在2024—2025年验证区间对比动态配置与买入持有，分析组合净值和回撤表现，评估配置策略的风险收益取舍。'),
]
GOLD=[
    row('黄金与比特币交易策略｜Python','2024.12'),
    bullet('回测设计','三人合作开发EMA策略，结合VaR／CVaR组合约束，纳入黄金1%、比特币2%的交易费用，开展2016—2021年历史模拟。'),
    bullet('结果解释','模拟资金由1,000美元增至13,236美元；最大回撤约47%，买入持有约81%。买入持有期末资产约48,179美元，高于策略终值，展示降低回撤与期末收益之间的取舍。'),
]

ENTRE_DATA=[
    section('创业与内容运营'),
    row('AD市场研究｜创始人','2026.01—至今'),
    line('独立内容创作：2022.10—至今'),
    bullet('用户运营','开展新用户引导与社群互动，90人获客群体的首周留存率为61.1%；围绕研究内容组织用户沟通与日常参与。'),
    bullet('合作运营','对接数字资产平台合作并开展用户引导；相关引荐用户累计交易量超过3.3亿美元，为平台合作与社群运营提供业务实践。'),
    bullet('内容成果','制作市场研究与科普内容；截至2026年9月，抖音获赞52.8万、小红书49.3万、微信视频号5.6万，合计107.7万次。'),
]
ENTRE_CONSULT=[
    section('创业与商业实践'),
    row('AD市场研究｜创始人','2026.01—至今'),
    line('独立内容创作：2022.10—至今'),
    bullet('业务运营','运营金融市场与数字资产研究内容平台，负责研究内容、用户引导及社群互动，衔接内容传播与用户交流。'),
    bullet('合作拓展','对接数字资产平台合作，相关引荐用户累计交易量超过3.3亿美元；负责合作推广、用户引导与内容沟通。'),
    bullet('用户留存','在90人获客群体中记录到61.1%的首周留存率，运营内容覆盖新用户引导、研究内容沟通及社群互动。'),
    bullet('内容传播','截至2026年9月，抖音、小红书、微信视频号分别累计获赞52.8万、49.3万和5.6万次，合计107.7万次。'),
]
ENTRE_INVEST=[
    section('独立研究与内容实践'),
    row('AD市场研究｜创始人','2026.01—至今'),
    line('独立内容创作：2022.10—至今'),
    bullet('研究方向','围绕美股、宏观经济与数字资产开展独立研究，发布市场分析及科普内容，负责研究内容整理与社群交流。'),
    bullet('研究呈现','组织Weekly Watchlist等市场观察材料的中文化与图文呈现，保留关键价位、多空情景及对应图表，支持社群阅读与讨论。'),
    bullet('传播成果','截至2026年9月，抖音、小红书、微信视频号分别累计获赞52.8万、49.3万和5.6万次，合计107.7万次；以内容制作和社群交流支持研究信息传播。'),
]

DATA_P1=EDU+[section('实习经历')]+CITIC+NANJING+TEN+AI
DATA_P2=[section('分析与建模项目')]+HACK_DATA+LOAN+FLEET+MONTE+ENTRE_DATA+[
    section('专业技能'),
    line('编程工具：Python（数据整理、文本筛选、可视化）、MATLAB、R；SQL基础。'),
    line('分析方法：回归、方差分析、模型评估、线性与混合整数规划、蒙特卡洛模拟、动态规划。'),
    line('业务工具与语言：Excel、PowerPoint、彭博终端；中文母语，英语可用于工作沟通和汇报。'),
]
CONSULT_P1=EDU+[section('实习经历')]+CITIC+NANJING+TEN+AI
CONSULT_P2=[section('商业分析与决策项目')]+HACK_CONSULT+FLEET+SCHEDULE+LOAN+ENTRE_CONSULT+[
    section('专业技能'),
    line('研究与决策：公司研究、同行对标、融资方案比较、线性优化、关键路径分析。'),
    line('项目与工具：任务协调、进度跟进、需求转化；Excel、PowerPoint、彭博终端、MATLAB、R。'),
    line('编程与语言：Python文本分析、SQL基础；中文母语，英语可用于工作沟通与研究汇报。'),
]
INVEST_P1=EDU+[section('金融与研究实习')]+TEN+[
    bullet('行业交流','参加彭博举办的私募基金论坛，接触机构投资研究与市场交流场景。'),
]+CITIC+CSC+NANJING+[
    row('超脑AI孵化器｜战略与运营实习生','2024.06—2024.08｜上海'),
    bullet('科技产品实践','参与上海交通大学产业研究院旗下创业项目，支持Realmfy应用开发协调与上线，参与Mindog机器狗商业化讨论，接触AI产品的需求转化和商业推进。'),
]
INVEST_P2=[section('投资与风险研究项目')]+BTC+GOLD+LOAN+MONTE+ENTRE_INVEST+[
    section('专业技能'),
    line('研究框架：商业模式、竞争格局、增长驱动、风险与催化因素；融资方案和外汇风险比较。'),
    line('量化方法：资产配置、动态规划、回测评估、回撤分析、VaR／CVaR约束、回归与模型评估。'),
    line('工具与语言：彭博终端、Excel、PowerPoint、MATLAB、R；Python项目应用、SQL基础；英语工作沟通。'),
]

JOBS=[
    ('张逸天_商业与数据分析_校招完整版','商业分析／数据分析','应用数学本科、应用商业分析硕士在读，具备银行与资产管理实习经历。项目覆盖文本分析、分类评估、资源优化及模拟分析，注重将分析结果转化为业务解释。',DATA_P1,DATA_P2),
    ('张逸天_咨询与战略_校招完整版','管理咨询／战略分析','具备数学与商业分析背景，参与公司研究、融资方案比较及AI产品项目协调。结合同行对标、定量决策与内容运营经历，支持问题拆解、方案沟通和项目推进。',CONSULT_P1,CONSULT_P2),
    ('张逸天_投资研究_校招完整版','投资研究／行业研究','应用数学本科、商业分析硕士在读，具备资产管理、银行与证券机构实习经历。关注公司商业模式、风险与催化因素，并通过资产配置和策略回测项目分析风险收益取舍。',INVEST_P1,INVEST_P2),
]

def fmt(run,size=11.5,bold=False,cn='宋体'):
    run.font.name='Calibri'; run.font.size=Pt(size); run.font.bold=bold
    run.font.color.rgb=RGBColor(0,0,0)
    run._element.get_or_add_rPr().get_or_add_rFonts().set(qn('w:eastAsia'),cn)

def put(d,item):
    kind,a,b=item
    p=d.add_paragraph(); f=p.paragraph_format
    if kind=='section':
        f.space_before=Pt(10); f.space_after=Pt(6); f.keep_with_next=True
        fmt(p.add_run(a),12.5,True,'黑体')
        bs=OxmlElement('w:pBdr'); v=OxmlElement('w:bottom')
        for k,t in [('val','single'),('sz','4'),('space','3'),('color','999999')]:v.set(qn('w:'+k),t)
        bs.append(v); p._p.get_or_add_pPr().append(bs)
    elif kind=='row':
        f.space_before=Pt(6); f.space_after=Pt(2); f.keep_with_next=True
        f.tab_stops.add_tab_stop(Cm(17.7),WD_TAB_ALIGNMENT.RIGHT)
        fmt(p.add_run(a),11.5,True,'黑体')
        if b:fmt(p.add_run('\t'+b),9.5)
    elif kind=='bullet':
        f.left_indent=Pt(10); f.first_line_indent=Pt(-10); f.space_after=Pt(3)
        fmt(p.add_run('• '+a+'：'),11.5,True)
        fmt(p.add_run(b))
    else:
        fmt(p.add_run(a),10.5)

def build(stem,goal,profile,p1,p2):
    d=Document(); s=d.sections[0]
    s.page_width=Cm(21);s.page_height=Cm(29.7)
    s.top_margin=Cm(1.45);s.bottom_margin=Cm(1.45)
    s.left_margin=Cm(1.65);s.right_margin=Cm(1.65)
    s.header_distance=Cm(.7);s.footer_distance=Cm(.7)
    norm=d.styles['Normal']; norm.font.name='Calibri';norm.font.size=Pt(11.5)
    norm.element.get_or_add_rPr().get_or_add_rFonts().set(qn('w:eastAsia'),'宋体')
    norm.paragraph_format.line_spacing=Pt(17)
    norm.paragraph_format.space_after=Pt(0);norm.paragraph_format.widow_control=False
    for v in d.styles:
        if v.type==1 and v.element.find(qn('w:pPr')) is not None:
            for border in list(v.element.xpath('./w:pPr/w:pBdr')):border.getparent().remove(border)
    p=d.add_paragraph(style='Title');p.alignment=WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.line_spacing=Pt(27);p.paragraph_format.space_before=Pt(0);p.paragraph_format.space_after=Pt(3)
    fmt(p.add_run(NAME),21,True,'黑体')
    p=d.add_paragraph();p.alignment=WD_ALIGN_PARAGRAPH.CENTER
    fmt(p.add_run('求职意向：'+goal),11.5,True,'黑体')
    p=d.add_paragraph();p.alignment=WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after=Pt(4);fmt(p.add_run(CONTACT),9.5)
    p=d.add_paragraph();p.alignment=WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after=Pt(4)
    fmt(p.add_run('LinkedIn：linkedin.com/in/yitian-zhang1219/'),9.5)
    p=d.add_paragraph();p.paragraph_format.space_after=Pt(2)
    fmt(p.add_run(profile),10.5)
    for item in p1:put(d,item)
    p=d.add_paragraph();p.paragraph_format.space_after=Pt(0)
    p.paragraph_format.page_break_before=True
    fmt(p.add_run(NAME+'｜'+goal+'｜项目与能力'),11,True,'黑体')
    for item in p2:
        put(d,item)
        if goal!='管理咨询／战略分析':
            f=d.paragraphs[-1].paragraph_format
            f.space_after=Pt((f.space_after.pt if f.space_after else 0)+1)
    foot=s.footer.paragraphs[0];foot.alignment=WD_ALIGN_PARAGRAPH.RIGHT
    fmt(foot.add_run(NAME+'　'),9)
    field=OxmlElement('w:fldSimple');field.set(qn('w:instr'),'PAGE')
    foot._p.append(field)
    d.core_properties.author=NAME;d.core_properties.title=NAME+' '+goal+' 校招简历'
    d.save(OUT/(stem+'.docx'))
    print(stem)

if __name__=='__main__':
    for j in JOBS:build(*j)
