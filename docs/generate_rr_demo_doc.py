"""
Generate RR Decision Intelligence Platform — Demo Documentation PDF
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os
from datetime import date

# ── Output path ──────────────────────────────────────────────────
OUT = os.path.join(os.path.dirname(__file__), "RR_Demo_Platform_Documentation.pdf")

# ── Brand colours ────────────────────────────────────────────────
RR_PINK    = colors.HexColor("#E8175D")
RR_BLUE    = colors.HexColor("#14336B")
RR_NAVY    = colors.HexColor("#06081A")
RR_GOLD    = colors.HexColor("#F7C948")
RR_LIGHT   = colors.HexColor("#EEF2FF")
RR_MUTED   = colors.HexColor("#7B8DB8")
WHITE      = colors.white
GREY_LINE  = colors.HexColor("#D1D5DB")
DARK_TEXT  = colors.HexColor("#1E293B")
GREEN_OK   = colors.HexColor("#10B981")
RED_WARN   = colors.HexColor("#EF4444")

W, H = A4
MARGIN = 18 * mm

# ── Styles ───────────────────────────────────────────────────────
def styles():
    base = ParagraphStyle
    return {
        "cover_title": base("cover_title",
            fontSize=32, textColor=WHITE, leading=36,
            fontName="Helvetica-Bold", alignment=TA_CENTER, spaceAfter=6),
        "cover_sub": base("cover_sub",
            fontSize=13, textColor=RR_LIGHT, leading=18,
            fontName="Helvetica", alignment=TA_CENTER, spaceAfter=4),
        "cover_label": base("cover_label",
            fontSize=8, textColor=RR_MUTED, leading=12,
            fontName="Helvetica", alignment=TA_CENTER, spaceAfter=2,
            letterSpacing=1.5),
        "section_head": base("section_head",
            fontSize=14, textColor=RR_PINK, leading=18,
            fontName="Helvetica-Bold", spaceBefore=14, spaceAfter=6),
        "sub_head": base("sub_head",
            fontSize=10, textColor=RR_BLUE, leading=14,
            fontName="Helvetica-Bold", spaceBefore=8, spaceAfter=4),
        "body": base("body",
            fontSize=9, textColor=DARK_TEXT, leading=14,
            fontName="Helvetica", spaceAfter=4),
        "body_bold": base("body_bold",
            fontSize=9, textColor=DARK_TEXT, leading=14,
            fontName="Helvetica-Bold", spaceAfter=4),
        "muted": base("muted",
            fontSize=8, textColor=RR_MUTED, leading=12,
            fontName="Helvetica", spaceAfter=3),
        "bullet": base("bullet",
            fontSize=9, textColor=DARK_TEXT, leading=13,
            fontName="Helvetica", leftIndent=12, spaceAfter=3,
            bulletIndent=0),
        "table_head": base("table_head",
            fontSize=8, textColor=WHITE, leading=11,
            fontName="Helvetica-Bold", alignment=TA_CENTER),
        "table_cell": base("table_cell",
            fontSize=8, textColor=DARK_TEXT, leading=11,
            fontName="Helvetica", alignment=TA_LEFT),
        "table_cell_c": base("table_cell_c",
            fontSize=8, textColor=DARK_TEXT, leading=11,
            fontName="Helvetica", alignment=TA_CENTER),
        "footer": base("footer",
            fontSize=7, textColor=RR_MUTED, leading=10,
            fontName="Helvetica", alignment=TA_CENTER),
        "pink_label": base("pink_label",
            fontSize=7, textColor=RR_PINK, leading=10,
            fontName="Helvetica-Bold", letterSpacing=1.2,
            spaceAfter=2),
    }

S = styles()

# ── Helper: pink rule ─────────────────────────────────────────────
def pink_rule():
    return HRFlowable(width="100%", thickness=1.5, color=RR_PINK, spaceAfter=6, spaceBefore=2)

def grey_rule():
    return HRFlowable(width="100%", thickness=0.5, color=GREY_LINE, spaceAfter=4, spaceBefore=4)

def bullet(text):
    return Paragraph(f"• &nbsp; {text}", S["bullet"])

# ── Table style factory ───────────────────────────────────────────
def base_table_style(header_bg=RR_BLUE):
    return TableStyle([
        ("BACKGROUND",   (0,0), (-1,0),  header_bg),
        ("TEXTCOLOR",    (0,0), (-1,0),  WHITE),
        ("FONTNAME",     (0,0), (-1,0),  "Helvetica-Bold"),
        ("FONTSIZE",     (0,0), (-1,0),  8),
        ("ALIGN",        (0,0), (-1,0),  "CENTER"),
        ("BOTTOMPADDING",(0,0), (-1,0),  6),
        ("TOPPADDING",   (0,0), (-1,0),  6),
        ("ROWBACKGROUNDS",(0,1),(-1,-1), [colors.white, colors.HexColor("#F8F9FF")]),
        ("FONTNAME",     (0,1), (-1,-1), "Helvetica"),
        ("FONTSIZE",     (0,1), (-1,-1), 8),
        ("TOPPADDING",   (0,1), (-1,-1), 5),
        ("BOTTOMPADDING",(0,1), (-1,-1), 5),
        ("LEFTPADDING",  (0,0), (-1,-1), 7),
        ("RIGHTPADDING", (0,0), (-1,-1), 7),
        ("GRID",         (0,0), (-1,-1), 0.4, GREY_LINE),
        ("VALIGN",       (0,0), (-1,-1), "MIDDLE"),
    ])

# ── Cover page block ─────────────────────────────────────────────
def cover_block():
    elems = []

    # Navy banner background using Table trick
    cover_data = [[""]]
    cover_tbl = Table(cover_data, colWidths=[W - 2*MARGIN], rowHeights=[52*mm])
    cover_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), RR_NAVY),
        ("ROUNDEDCORNERS", [8]),
    ]))

    # We'll just use spacer + paragraphs on top
    elems.append(Spacer(1, 8*mm))
    elems.append(Paragraph("CONFIDENTIAL DEMO DOCUMENTATION", S["cover_label"]))
    elems.append(Spacer(1, 3*mm))
    elems.append(Paragraph("Rajasthan Royals", S["cover_title"]))
    elems.append(Paragraph("Decision Intelligence Platform", S["cover_sub"]))
    elems.append(Spacer(1, 2*mm))
    elems.append(Paragraph("IPL 2026 · Front-Office Analytics", S["cover_label"]))
    elems.append(Spacer(1, 6*mm))
    elems.append(pink_rule())
    elems.append(Spacer(1, 3*mm))

    # Meta row
    meta = [
        ["Prepared for", "Rajasthan Royals Analytics Team"],
        ["Platform version", "RR Demo v1.0"],
        ["Date", date.today().strftime("%B %d, %Y")],
        ["Access URL", "http://[your-render-url]/rr_login.html"],
        ["Access code", "royals2026"],
        ["Data coverage", "IPL 2017–2025 · 1,169 matches · 350,000+ deliveries"],
    ]
    meta_tbl = Table(meta, colWidths=[50*mm, W - 2*MARGIN - 50*mm])
    meta_tbl.setStyle(TableStyle([
        ("FONTNAME",     (0,0), (0,-1), "Helvetica-Bold"),
        ("FONTNAME",     (1,0), (1,-1), "Helvetica"),
        ("FONTSIZE",     (0,0), (-1,-1), 9),
        ("TEXTCOLOR",    (0,0), (0,-1), RR_BLUE),
        ("TEXTCOLOR",    (1,0), (1,-1), DARK_TEXT),
        ("BOTTOMPADDING",(0,0), (-1,-1), 5),
        ("TOPPADDING",   (0,0), (-1,-1), 5),
        ("LINEBELOW",    (0,0), (-1,-2), 0.3, GREY_LINE),
    ]))
    elems.append(meta_tbl)
    elems.append(Spacer(1, 6*mm))
    return elems

# ── Section 1: What was built ────────────────────────────────────
def section_what_built():
    elems = []
    elems.append(Paragraph("1. What Was Built", S["section_head"]))
    elems.append(pink_rule())
    elems.append(Paragraph(
        "The RR Decision Intelligence Platform is a front-office analytics tool built specifically "
        "for Rajasthan Royals. It converts publicly available ball-by-ball IPL data into "
        "decision-grade intelligence covering auction strategy, in-season match planning, "
        "player scouting, salary valuation, and matchup analysis.",
        S["body"]))
    elems.append(Spacer(1, 3*mm))

    # Architecture table
    rows = [
        ["Layer", "Description", "Status"],
        ["Data Pipeline",     "build_dashboard_data.py generates the full JS payload from Cricsheet ball-by-ball CSVs", "✓ Live"],
        ["RR Landing Hub",    "rr_hub.html — branded entry point with next-match card, fixture strip, squad overview", "✓ Live"],
        ["Match Planning",    "Opponent-aware SWOT + phase tactical brief for all 14 RR 2026 fixtures", "✓ Live"],
        ["Salary Value Lab",  "Fair salary vs contract for RR squad; Salary Value Index + gap in ₹Cr", "✓ Live"],
        ["Matchup Intel",     "Ball-by-ball H2H batter vs bowler with direct dismissal weighting", "✓ Live"],
        ["Auction War Room",  "Shared-league simulation; 500 Monte Carlo auction paths", "✓ Live"],
        ["Batter Diagnostics","Phase/pressure/venue/bowling-family breakdown; no fake tracking claims", "✓ Live"],
        ["Phase Studio",      "Bayesian-shrunk phase impact leaderboard — powerplay / middle / death", "✓ Live"],
        ["Password Gate",     "rr_login.html — branded login with sessionStorage auth", "✓ Live"],
    ]
    tbl = Table(rows, colWidths=[38*mm, 100*mm, 22*mm])
    style = base_table_style()
    style.add("ALIGN", (2,1), (2,-1), "CENTER")
    style.add("TEXTCOLOR", (2,1), (2,-1), GREEN_OK)
    style.add("FONTNAME", (2,1), (2,-1), "Helvetica-Bold")
    tbl.setStyle(style)
    elems.append(tbl)
    elems.append(Spacer(1, 4*mm))
    return elems

# ── Section 2: Demo access ────────────────────────────────────────
def section_access():
    elems = []
    elems.append(Paragraph("2. Demo Access & Flow", S["section_head"]))
    elems.append(pink_rule())

    elems.append(Paragraph("Entry Point", S["sub_head"]))
    elems.append(Paragraph(
        "Send this single URL to the RR contact. Everything flows from here.", S["body"]))

    access_data = [
        ["Item", "Value"],
        ["Login URL", "http://[your-render-url]/rr_login.html"],
        ["Access Code", "royals2026"],
        ["Session behaviour", "Persists for browser tab; clears on close"],
        ["Wrong password", "Card shake animation + error message"],
        ["Direct hub access", "Auto-redirects to login if no active session"],
    ]
    tbl = Table(access_data, colWidths=[45*mm, W - 2*MARGIN - 45*mm])
    tbl.setStyle(base_table_style())
    elems.append(tbl)
    elems.append(Spacer(1, 4*mm))

    elems.append(Paragraph("Recommended Demo Walkthrough", S["sub_head"]))
    steps = [
        "<b>Step 1 — Login:</b> Open rr_login.html, enter 'royals2026'. Land on the RR-branded hub.",
        "<b>Step 2 — Hub overview:</b> Show the next-match card (RR vs CSK, Mar 30, Guwahati) and full fixture strip.",
        "<b>Step 3 — Match Planning:</b> Click 'Open Match Intelligence Brief'. Page auto-selects RR vs CSK, RR lens. Walk through SWOT, tactics (Sandeep Sharma vs CSK top-order), Guwahati venue profile (avg 168.1).",
        "<b>Step 4 — Salary Value Lab:</b> Click 'Open Value Lab'. Defaults to RR squad with Jaiswal selected. Highlight Sandeep Sharma SVI 350 — paid ₹4 Cr, model fair value ₹14 Cr.",
        "<b>Step 5 — Matchup Intelligence:</b> Show Jaiswal vs Rahul Chahar / Noor Ahmad head-to-head using ball-by-ball evidence.",
    ]
    for s in steps:
        elems.append(bullet(s))
    elems.append(Spacer(1, 4*mm))
    return elems

# ── Section 3: RR Squad Salary Table ─────────────────────────────
def section_salary():
    elems = []
    elems.append(Paragraph("3. RR Squad — Salary Valuation Summary", S["section_head"]))
    elems.append(pink_rule())
    elems.append(Paragraph(
        "Model-implied fair salary versus 2026 contract. Salary Value Index (SVI) = 100 × Fair / Current. "
        "SVI > 100 means the player is undervalued relative to model output.",
        S["body"]))
    elems.append(Spacer(1, 2*mm))

    rows = [
        ["Player", "Role", "Salary (₹Cr)", "Fair Value (₹Cr)", "Gap (₹Cr)", "SVI", "Verdict"],
        ["Yashaswi Jaiswal",   "Opening Bat",     "18.0", "9.7",  "−8.3", "54",  "Overvalued"],
        ["Ravindra Jadeja",    "All-Rounder",     "14.0", "14.1", "+0.1", "101", "Fair Value"],
        ["Riyan Parag",        "Bat / Captain",   "14.0", "6.6",  "−7.4", "47",  "Overvalued"],
        ["Dhruv Jurel",        "WK / Bat",        "14.0", "4.8",  "−9.2", "34",  "Overvalued"],
        ["Jofra Archer",       "Pace",            "12.5", "9.6",  "−2.9", "77",  "Overvalued"],
        ["Shimron Hetmyer",    "Bat",             "11.0", "13.4", "+2.4", "122", "Undervalued"],
        ["Tushar Deshpande",   "Pace",            "6.5",  "4.1",  "−2.4", "63",  "Overvalued"],
        ["Sandeep Sharma",     "Pace",            "4.0",  "14.0", "+10.0","350", "Undervalued ★"],
        ["Sam Curran",         "All-Rounder",     "2.4",  "4.4",  "+2.0", "182", "Undervalued"],
        ["Kwena Maphaka",      "Pace",            "1.5",  "1.4",  "−0.1", "94",  "Fair Value"],
        ["Vaibhav Suryavanshi","Bat",             "1.1",  "1.4",  "+0.3", "127", "Fair Value"],
        ["Donovan Ferreira",   "Bat",             "1.0",  "0.9",  "−0.1", "92",  "Fair Value"],
    ]
    col_w = [40*mm, 24*mm, 20*mm, 22*mm, 18*mm, 12*mm, 24*mm]
    tbl = Table(rows, colWidths=col_w)
    style = base_table_style(RR_BLUE)
    # Colour verdict column
    for i, row in enumerate(rows[1:], start=1):
        verdict = row[6]
        if "Undervalued" in verdict:
            style.add("TEXTCOLOR", (6,i), (6,i), GREEN_OK)
            style.add("FONTNAME",  (6,i), (6,i), "Helvetica-Bold")
        elif "Overvalued" in verdict:
            style.add("TEXTCOLOR", (6,i), (6,i), RED_WARN)
        # Highlight Sandeep Sharma row
        if "Sandeep" in row[0]:
            style.add("BACKGROUND", (0,i), (-1,i), colors.HexColor("#F0FDF4"))
    tbl.setStyle(style)
    elems.append(tbl)
    elems.append(Spacer(1, 2*mm))
    elems.append(Paragraph(
        "★ Sandeep Sharma (SVI 350) is the standout finding: RR contracted him at ₹4 Cr against a "
        "model-implied fair value of ₹14 Cr — a +₹10 Cr surplus for RR. This is the demo's "
        "strongest opening hook for a salary-valuation conversation.",
        S["muted"]))
    elems.append(Spacer(1, 4*mm))
    return elems

# ── Section 4: RR 2026 Fixture Schedule ──────────────────────────
def section_fixtures():
    elems = []
    elems.append(Paragraph("4. RR IPL 2026 — Full Fixture Schedule", S["section_head"]))
    elems.append(pink_rule())

    rows = [
        ["#", "Date", "Opponent", "Venue", "City", "H/A", "Time"],
        ["1",  "Mar 30", "CSK",  "Barsapara Stadium",            "Guwahati",  "Home Alt", "7:30 PM"],
        ["2",  "Apr 4",  "GT",   "Narendra Modi Stadium",        "Ahmedabad", "Away",     "7:30 PM"],
        ["3",  "Apr 7",  "MI",   "Barsapara Stadium",            "Guwahati",  "Home Alt", "7:30 PM"],
        ["4",  "Apr 10", "RCB",  "Barsapara Stadium",            "Guwahati",  "Home Alt", "7:30 PM"],
        ["5",  "Apr 13", "SRH",  "Rajiv Gandhi Intl Stadium",    "Hyderabad", "Away",     "7:30 PM"],
        ["6",  "Apr 19", "KKR",  "Eden Gardens",                 "Kolkata",   "Away",     "3:30 PM"],
        ["7",  "Apr 22", "LSG",  "BRSABVE Stadium",              "Lucknow",   "Away",     "7:30 PM"],
        ["8",  "Apr 25", "SRH",  "Sawai Mansingh Stadium",       "Jaipur",    "Home",     "7:30 PM"],
        ["9",  "Apr 28", "PBKS", "PCA Stadium",                  "Mullanpur", "Away",     "7:30 PM"],
        ["10", "May 1",  "DC",   "Sawai Mansingh Stadium",       "Jaipur",    "Home",     "3:30 PM"],
        ["11", "May 9",  "GT",   "Sawai Mansingh Stadium",       "Jaipur",    "Home",     "7:30 PM"],
        ["12", "May 17", "DC",   "Arun Jaitley Stadium",         "Delhi",     "Away",     "7:30 PM"],
        ["13", "May 19", "LSG",  "Sawai Mansingh Stadium",       "Jaipur",    "Home",     "7:30 PM"],
        ["14", "May 24", "MI",   "Wankhede Stadium",             "Mumbai",    "Away",     "3:30 PM"],
    ]
    col_w = [8*mm, 16*mm, 14*mm, 52*mm, 22*mm, 18*mm, 18*mm]
    tbl = Table(rows, colWidths=col_w)
    style = base_table_style()
    # Highlight match 1 (RR vs CSK — next match)
    style.add("BACKGROUND", (0,1), (-1,1), colors.HexColor("#FFF1F5"))
    style.add("FONTNAME",   (0,1), (-1,1), "Helvetica-Bold")
    style.add("TEXTCOLOR",  (0,1), (-1,1), RR_PINK)
    # Home badge colour
    for i, row in enumerate(rows[1:], start=1):
        if row[5] == "Home":
            style.add("TEXTCOLOR", (5,i), (5,i), GREEN_OK)
            style.add("FONTNAME",  (5,i), (5,i), "Helvetica-Bold")
    tbl.setStyle(style)
    elems.append(tbl)
    elems.append(Spacer(1, 2*mm))
    elems.append(Paragraph(
        "Highlighted row = next upcoming fixture (RR vs CSK, March 30). "
        "Platform auto-selects this match when match_planning.html?team=RR is opened.",
        S["muted"]))
    elems.append(Spacer(1, 4*mm))
    return elems

# ── Section 5: Match Intelligence — RR vs CSK ────────────────────
def section_match_intel():
    elems = []
    elems.append(Paragraph("5. Match Intelligence Brief — RR vs CSK (Mar 30)", S["section_head"]))
    elems.append(pink_rule())

    elems.append(Paragraph("Venue Profile — Barsapara Stadium, Guwahati", S["sub_head"]))
    venue_data = [
        ["Metric", "Value", "Note"],
        ["Average innings total", "168.1", "Control venue — not a free-scoring ground"],
        ["Innings in sample",     "10",    "Limited historical sample; treat as directional"],
        ["Strategic implication", "—",     "Emphasise control, field placement, matchup discipline over blind acceleration"],
    ]
    tbl = Table(venue_data, colWidths=[45*mm, 22*mm, W - 2*MARGIN - 67*mm])
    tbl.setStyle(base_table_style())
    elems.append(tbl)
    elems.append(Spacer(1, 3*mm))

    elems.append(Paragraph("RR Active Core — Key Players", S["sub_head"]))
    core_data = [
        ["Role",          "Player",              "Note"],
        ["Lead bat",      "Yashaswi Jaiswal",    "Primary batting anchor; highest impact score in RR squad"],
        ["No.2 bat",      "Riyan Parag",         "Second scoring pillar; captain — sets tempo"],
        ["Finisher",      "Shimron Hetmyer",     "Death-overs specialist; undervalued (SVI 122)"],
        ["Lead bowler",   "Sandeep Sharma",      "Opens bowling; strongest matchup vs CSK top-order. SVI 350."],
        ["Pace threat",   "Jofra Archer",        "Powerplay wicket-taker; key vs Ruturaj Gaikwad"],
        ["Spin",          "Ravi Bishnoi",        "Middle-overs spin anchor"],
    ]
    tbl = Table(core_data, colWidths=[28*mm, 42*mm, W - 2*MARGIN - 70*mm])
    tbl.setStyle(base_table_style())
    elems.append(tbl)
    elems.append(Spacer(1, 3*mm))

    elems.append(Paragraph("CSK Threats to Watch", S["sub_head"]))
    threat_data = [
        ["Player",          "Threat",           "RR Counter"],
        ["Rahul Chahar",    "Spin in middle overs vs RR batters", "Use Jaiswal as matchup lever in death batting"],
        ["Noor Ahmad",      "Left-arm wrist spin — danger vs right-handers", "Left-hander Hetmyer at no.4/5 preferred"],
        ["Ruturaj Gaikwad", "Consistent powerplay scorer", "Archer over-for-over in PP — primary wicket target"],
        ["MS Dhoni",        "Death-overs finisher", "Bishnoi + Sandeep Sharma to cramp his off-side options"],
    ]
    tbl = Table(threat_data, colWidths=[36*mm, 60*mm, W - 2*MARGIN - 96*mm])
    tbl.setStyle(base_table_style())
    elems.append(tbl)
    elems.append(Spacer(1, 4*mm))
    return elems

# ── Section 6: Commercial context ────────────────────────────────
def section_commercial():
    elems = []
    elems.append(Paragraph("6. Commercial Context", S["section_head"]))
    elems.append(pink_rule())

    elems.append(Paragraph("Why This Matters to RR", S["sub_head"]))
    elems.append(Paragraph(
        "Rajasthan Royals explicitly discloses 'Analytics and Trial Expenses' as a named line "
        "item in their audited accounts (FY2025: ₹15.79 Crores, +18.7% YoY). "
        "Over 52% of that spend goes to offshore vendors. "
        "This platform offers a domestic, franchise-specific alternative at a fraction of that cost.",
        S["body"]))
    elems.append(Spacer(1, 3*mm))

    budget_data = [
        ["Metric", "Value", "Source"],
        ["RR analytics budget (FY25)", "₹15.79 Crores",  "Audited P&L — Royal Multisport Pvt Ltd"],
        ["YoY growth",                 "+18.7%",          "FY24: ₹13.29 Cr → FY25: ₹15.79 Cr"],
        ["Offshore share",             "52.8%",           "Note 33 — Foreign currency spend"],
        ["Related-party vendor",       "₹1.91 Cr (Blenheim Chalcot IT)", "Note 29 — new in FY25"],
        ["Suggested entry contract",   "₹50–150 Lakhs/season", "3–10% of current analytics budget"],
    ]
    tbl = Table(budget_data, colWidths=[55*mm, 50*mm, W - 2*MARGIN - 105*mm])
    tbl.setStyle(base_table_style())
    elems.append(tbl)
    elems.append(Spacer(1, 3*mm))

    elems.append(Paragraph("Pitch Positioning", S["sub_head"]))
    points = [
        "Selling the <b>modeling layer and product surface</b>, not the underlying Cricsheet data — which RR already has access to.",
        "Strongest entry modules: <b>Auction War Room + Salary Value Lab</b> (auction edge, RTM decisions) and <b>Match Planning</b> (in-season tactical prep).",
        "Competitive moat: <b>decision-usefulness framing</b> — prescriptive intelligence, not descriptive stats.",
        "Scalable: payloads rebuild from source; adding new modules or custom RR data feeds is straightforward.",
    ]
    for p in points:
        elems.append(bullet(p))
    elems.append(Spacer(1, 4*mm))
    return elems

# ── Section 7: Next steps ─────────────────────────────────────────
def section_next():
    elems = []
    elems.append(Paragraph("7. Next Steps", S["section_head"]))
    elems.append(pink_rule())

    next_data = [
        ["Priority", "Action",                          "Effort"],
        ["1 — Immediate", "Deploy to Render (live URL to send RR)", "Low"],
        ["2 — Week 1",    "Add bowler diagnostics (symmetric to batter scouting)", "Medium"],
        ["3 — Week 1",    "Add PDF/PNG export for match briefs", "Low"],
        ["4 — Week 2",    "Wire CricAPI for live scores on rr_hub.html", "Low"],
        ["5 — Week 2",    "Polish UI to full commercial grade",  "Medium"],
        ["6 — Outreach",  "LinkedIn cold outreach to RR Head of Analytics / Performance Analyst", "—"],
    ]
    tbl = Table(next_data, colWidths=[38*mm, 98*mm, 24*mm])
    tbl.setStyle(base_table_style())
    elems.append(tbl)
    elems.append(Spacer(1, 4*mm))
    return elems

# ── Footer ────────────────────────────────────────────────────────
def footer_para():
    return [
        grey_rule(),
        Paragraph(
            f"Rajasthan Royals Decision Intelligence Platform · Demo Documentation · "
            f"Prepared {date.today().strftime('%B %d, %Y')} · Confidential",
            S["footer"]),
    ]

# ── Build PDF ─────────────────────────────────────────────────────
def build():
    doc = SimpleDocTemplate(
        OUT,
        pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=MARGIN,  bottomMargin=MARGIN,
        title="RR Decision Intelligence Platform — Demo Documentation",
        author="Piyush Zaware",
        subject="Rajasthan Royals Analytics Demo",
    )

    story = []
    story += cover_block()
    story += section_what_built()
    story += section_access()
    story += section_salary()
    story += section_fixtures()
    story += section_match_intel()
    story += section_commercial()
    story += section_next()
    story += footer_para()

    doc.build(story)
    print(f"PDF written → {OUT}")

if __name__ == "__main__":
    build()
