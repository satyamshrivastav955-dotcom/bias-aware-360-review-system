import pptxgen from "pptxgenjs";
import path from "node:path";

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "Team Claude's Plan";
pptx.subject = "INNOVA HACK Chapter-1 Agentic AI pitch";
pptx.title = "Bias-Aware 360 Review Desk";
pptx.company = "Team Claude's Plan";
pptx.lang = "en-US";
pptx.theme = {
  headFontFace: "Aptos Display",
  bodyFontFace: "Aptos",
  lang: "en-US",
};
pptx.defineSlideMaster({
  title: "MASTER",
  background: { color: "F7F5EF" },
  objects: [
    { line: { x: 0.55, y: 7.08, w: 12.23, h: 0, line: { color: "CBC7BE", width: 0.7 } } },
    { text: { text: "BIAS-AWARE 360 REVIEW DESK", options: { x: 0.62, y: 7.12, w: 4.3, h: 0.18, fontFace: "Aptos", fontSize: 7.5, bold: true, color: "6D6962", charSpacing: 1.2, margin: 0 } } },
    { text: { text: "INNOVA HACK · AGENTIC AI", options: { x: 9.6, y: 7.12, w: 3.1, h: 0.18, fontFace: "Aptos", fontSize: 7.5, bold: true, color: "6D6962", align: "right", charSpacing: 1.2, margin: 0 } } },
  ],
  slideNumber: { x: 12.48, y: 7.1, w: 0.35, h: 0.18, color: "6D6962", fontFace: "Aptos", fontSize: 7.5, align: "right" },
});

const C = { bg: "F7F5EF", surface: "FFFFFF", ink: "151515", muted: "68645D", rule: "CBC7BE", orange: "E7782B", orangeSoft: "FBE6D4", blue: "2563EB", blueSoft: "DBEAFE", red: "A32727", redSoft: "FCE4E4", green: "167A45", greenSoft: "DDF4E7", amber: "8B5B08", amberSoft: "FFF0BF", slate: "334155" };
const root = process.cwd();
const img = (name) => path.join(root, "shots", name);

function addTitle(slide, eyebrow, title, subtitle) {
  slide.addText(eyebrow.toUpperCase(), { x: 0.65, y: 0.43, w: 4.8, h: 0.22, fontSize: 8.5, bold: true, color: C.orange, charSpacing: 1.5, margin: 0 });
  slide.addText(title, { x: 0.65, y: 0.72, w: 12.0, h: 0.62, fontSize: 28, bold: true, color: C.ink, margin: 0, breakLine: false, fit: "shrink" });
  if (subtitle) slide.addText(subtitle, { x: 0.68, y: 1.43, w: 11.6, h: 0.38, fontSize: 12, color: C.muted, margin: 0, fit: "shrink" });
}
function pill(slide, text, x, y, color=C.ink, fill=C.surface) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 1.68, h: 0.35, rectRadius: 0.06, fill: { color: fill }, line: { color: C.rule, width: 0.7 } });
  slide.addText(text, { x: x+0.08, y: y+0.08, w: 1.52, h: 0.16, fontSize: 8.5, bold: true, color, align: "center", margin: 0, fit: "shrink" });
}
function card(slide, x, y, w, h, title, body, accent=C.orange, fill=C.surface) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { color: C.rule, width: 0.8 }, shadow: { type: "outer", color: "000000", opacity: 0.08, blur: 1, angle: 45, distance: 1 } });
  slide.addShape(pptx.ShapeType.rect, { x, y, w: 0.07, h, fill: { color: accent }, line: { color: accent } });
  slide.addText(title, { x: x+0.28, y: y+0.23, w: w-0.5, h: 0.33, fontSize: 15, bold: true, color: C.ink, margin: 0, fit: "shrink" });
  slide.addText(body, { x: x+0.28, y: y+0.72, w: w-0.5, h: h-0.92, fontSize: 10.5, color: C.muted, breakLine: false, valign: "top", margin: 0, fit: "shrink", bullet: body.includes("\n") ? { type: "bullet" } : undefined, paraSpaceAfterPt: 7 });
}
function picture(slide, file, x, y, w, h, border=true) {
  slide.addImage({ path: file, x, y, w, h, sizing: "contain" });
  if (border) slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.06, fill: { color: "FFFFFF", transparency: 100 }, line: { color: C.rule, width: 0.9 } });
}
function metric(slide, x, y, value, label, note, color=C.green) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 2.3, h: 1.35, rectRadius: 0.08, fill: { color: C.surface }, line: { color: C.rule, width: 0.8 } });
  slide.addText(value, { x: x+0.18, y: y+0.18, w: 1.95, h: 0.45, fontSize: 25, bold: true, color, margin: 0, fit: "shrink" });
  slide.addText(label, { x: x+0.18, y: y+0.71, w: 1.95, h: 0.23, fontSize: 10, bold: true, color: C.ink, margin: 0, fit: "shrink" });
  slide.addText(note, { x: x+0.18, y: y+1.02, w: 1.95, h: 0.18, fontSize: 7.5, color: C.muted, margin: 0, fit: "shrink" });
}

// 1
{
  const s = pptx.addSlide("MASTER");
  s.background = { color: C.bg };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 7.02, fill: { color: C.ink }, line: { color: C.ink } });
  s.addText("AGENTIC AI · PS-2", { x: 0.75, y: 0.65, w: 3.1, h: 0.25, color: "F9B27D", bold: true, fontSize: 10, charSpacing: 1.7, margin: 0 });
  s.addText("Bias-Aware 360°\nReview Desk", { x: 0.73, y: 1.2, w: 6.2, h: 1.55, color: "FFFFFF", bold: true, fontSize: 37, breakLine: false, margin: 0, fit: "shrink" });
  s.addText("Evidence-cited performance reviews with an independent bias audit and an enforced human approval gate.", { x: 0.78, y: 3.02, w: 5.65, h: 0.9, color: "CDD2D8", fontSize: 16, breakLine: false, margin: 0, fit: "shrink" });
  pill(s, "NEXT.JS 15", 0.78, 4.45, "FFFFFF", "293039");
  pill(s, "n8n + GEMINI", 2.58, 4.45, "FFFFFF", "293039");
  pill(s, "SUPABASE", 4.38, 4.45, "FFFFFF", "293039");
  s.addText("Team Claude's Plan", { x: 0.78, y: 5.35, w: 3.8, h: 0.3, color: "FFFFFF", fontSize: 14, bold: true, margin: 0 });
  s.addText("INNOVA HACK Chapter-1", { x: 0.78, y: 5.78, w: 3.8, h: 0.25, color: "AAB2BA", fontSize: 10, margin: 0 });
  picture(s, img("pg-home.png"), 7.05, 0.73, 5.63, 5.75, false);
  s.addShape(pptx.ShapeType.roundRect, { x: 7.05, y: 0.73, w: 5.63, h: 5.75, rectRadius: 0.1, fill: { color: "FFFFFF", transparency: 100 }, line: { color: "515B66", width: 1 } });
}
// 2
{
  const s = pptx.addSlide("MASTER"); addTitle(s, "The problem", "A performance review can amplify weak evidence", "Managers must synthesize scattered feedback under time pressure—exactly where unsupported narratives can become official records.");
  card(s, 0.7, 2.1, 3.65, 3.55, "Scattered evidence", "Self-assessment\nManager feedback\nPeer comments\nGoals and project outcomes", C.orange);
  card(s, 4.83, 2.1, 3.65, 3.55, "High-stakes synthesis", "A single vague or recent opinion can outweigh objective outcomes. Traditional AI summarizers may make the narrative sound more confident—not more true.", C.red);
  card(s, 8.96, 2.1, 3.65, 3.55, "Missing accountability", "Without citations, a separate audit, and a human decision gate, reviewers cannot explain where a conclusion came from or why it was approved.", C.blue);
  s.addText("Design principle", { x: 0.73, y: 6.15, w: 1.4, h: 0.2, fontSize: 8.5, bold: true, color: C.orange, charSpacing: 1.2, margin: 0 });
  s.addText("The system should refuse unsupported certainty, not merely generate polished prose.", { x: 2.0, y: 6.06, w: 9.8, h: 0.4, fontSize: 16, bold: true, color: C.ink, margin: 0, fit: "shrink" });
}
// 3
{
  const s = pptx.addSlide("MASTER"); addTitle(s, "Our solution", "A review pipeline with independent checks", "Two agents perform different jobs; deterministic validators and a human approver constrain both.");
  const nodes = [
    ["1", "Evidence", "Self · manager · peers · goals · outcomes", C.orangeSoft, C.orange],
    ["2", "Synthesis agent", "Specific report claims with source IDs", C.blueSoft, C.blue],
    ["3", "Validation", "Whitelist citations; drop uncited claims", "EEEDE8", C.slate],
    ["4", "Bias-audit agent", "5 failure categories + severity + reasoning", C.redSoft, C.red],
    ["5", "Human gate", "Edit · acknowledge · reject · approve", C.greenSoft, C.green],
  ];
  nodes.forEach((n,i)=>{
    const x=0.55+i*2.55;
    s.addShape(pptx.ShapeType.roundRect,{x,y:2.3,w:2.18,h:2.45,rectRadius:0.08,fill:{color:n[3]},line:{color:n[4],width:1.2}});
    s.addShape(pptx.ShapeType.ellipse,{x:x+0.18,y:2.52,w:0.48,h:0.48,fill:{color:n[4]},line:{color:n[4]}});
    s.addText(n[0],{x:x+0.18,y:2.63,w:0.48,h:0.16,color:"FFFFFF",fontSize:9,bold:true,align:"center",margin:0});
    s.addText(n[1],{x:x+0.18,y:3.22,w:1.8,h:0.42,fontSize:14,bold:true,color:C.ink,margin:0,fit:"shrink"});
    s.addText(n[2],{x:x+0.18,y:3.82,w:1.8,h:0.57,fontSize:9.2,color:C.muted,margin:0,fit:"shrink"});
    if(i<nodes.length-1) s.addShape(pptx.ShapeType.chevron,{x:x+2.23,y:3.2,w:0.28,h:0.48,fill:{color:C.rule},line:{color:C.rule}});
  });
  s.addText("Agentic, not autonomous", { x: 0.7, y: 5.42, w: 2.3, h: 0.28, fontSize: 13, bold: true, color: C.orange, margin: 0 });
  s.addText("The system can gather, reason, audit, and recommend—but it cannot finalize a harmful review without an explicit human action recorded in the audit trail.", { x: 3.0, y: 5.36, w: 9.3, h: 0.65, fontSize: 13, color: C.ink, margin: 0, fit: "shrink" });
}
// 4
{
  const s = pptx.addSlide("MASTER"); addTitle(s, "Evidence grounding", "Every conclusion is inspectable", "A claim is useful only when the reviewer can trace it back to the original sentence or objective record.");
  picture(s, img("6-drawer.png"), 0.68, 2.02, 7.35, 4.45);
  card(s, 8.35, 2.02, 4.25, 1.28, "Claim-level citations", "Every report claim carries one or more canonical source IDs.", C.orange);
  card(s, 8.35, 3.55, 4.25, 1.28, "Deterministic resolution", "Missing or invented IDs are surfaced; citations are not trusted merely because the model emitted them.", C.blue);
  card(s, 8.35, 5.08, 4.25, 1.28, "Fail-closed audit", "Missing, duplicate, malformed, or unknown audit references stop generation instead of appearing clean.", C.red);
}
// 5
{
  const s = pptx.addSlide("MASTER"); addTitle(s, "Bias detection", "The second agent audits the first", "It reviews every claim against all source evidence—not just the sources selected by the synthesis agent.");
  const cats=[
    ["Unsupported claim","No concrete support",C.redSoft,C.red],
    ["Recency bias","Recent period dominates",C.amberSoft,C.amber],
    ["Single-source bias","One subjective voice",C.orangeSoft,C.orange],
    ["Vague language","No observable detail","EEF2F6",C.slate],
    ["Contradiction","Objective evidence conflicts",C.blueSoft,C.blue],
  ];
  cats.forEach((c,i)=>card(s,0.7+(i%3)*4.13,2.0+Math.floor(i/3)*1.62,3.72,1.28,c[0],c[1],c[3],c[2]));
  s.addShape(pptx.ShapeType.roundRect,{x:8.96,y:3.62,w:3.72,h:1.28,rectRadius:0.08,fill:{color:C.greenSoft},line:{color:C.green,width:1}});
  s.addText("Independent signal",{x:9.23,y:3.86,w:3.15,h:0.25,fontSize:14,bold:true,color:C.ink,margin:0});
  s.addText("A non-LLM pre-check measures source concentration, time coverage, and peer-voice balance.",{x:9.23,y:4.25,w:3.05,h:0.42,fontSize:9.2,color:C.muted,margin:0,fit:"shrink"});
  s.addText("Why two signals?",{x:0.73,y:5.65,w:2.2,h:0.28,fontSize:14,bold:true,color:C.orange,margin:0});
  s.addText("Model-based semantic review catches harmful wording; deterministic arithmetic catches skewed evidence distribution. Neither is presented as a standalone fairness verdict.",{x:2.72,y:5.55,w:9.6,h:0.65,fontSize:13,color:C.ink,margin:0,fit:"shrink"});
}
// 6
{
  const s = pptx.addSlide("MASTER"); addTitle(s, "Human in the loop", "Approval is a server-enforced decision", "The interface does not merely suggest review—the backend refuses unresolved high-severity approval attempts.");
  picture(s, img("10-blocked.png"), 0.68, 2.0, 7.55, 4.45);
  card(s, 8.55, 2.0, 4.05, 1.22, "1 · Inspect", "Open original citations and flag reasoning.", C.blue);
  card(s, 8.55, 3.43, 4.05, 1.22, "2 · Decide", "Amend, explicitly acknowledge, or reject. Editing alone does not clear the original flag.", C.orange);
  card(s, 8.55, 4.86, 4.05, 1.22, "3 · Record", "Actor, timestamp, action, field-level diff, and acknowledged references enter the audit trail.", C.green);
  s.addText("HTTP 422",{x:9.02,y:6.22,w:1.25,h:0.28,fontSize:16,bold:true,color:C.red,margin:0});
  s.addText("unresolved_high_severity_flags",{x:10.18,y:6.24,w:2.2,h:0.24,fontSize:9,bold:true,color:C.muted,margin:0,fit:"shrink"});
}
// 7
{
  const s = pptx.addSlide("MASTER"); addTitle(s, "Measured performance", "We expose misses instead of claiming perfection", "Benchmark v1 compares captured outputs with human-adjudicated labels on 39 synthetic claims.");
  metric(s,0.72,2.05,"100%","Precision","0 false positives",C.green);
  metric(s,3.2,2.05,"66.7%","Recall","2 false negatives",C.amber);
  metric(s,5.68,2.05,"80.0%","Overall F1","balanced score",C.blue);
  metric(s,8.16,2.05,"83.3%","Macro F1","represented classes",C.blue);
  metric(s,10.64,2.05,"100%","Citation resolution","all IDs resolve",C.green);
  picture(s,img("pg-audit-reports.png"),0.72,3.72,6.75,2.72);
  s.addShape(pptx.ShapeType.roundRect,{x:7.82,y:3.72,w:4.78,h:2.72,rectRadius:0.08,fill:{color:C.surface},line:{color:C.rule,width:0.8}});
  s.addText("Known weaknesses",{x:8.12,y:4.02,w:3.9,h:0.3,fontSize:16,bold:true,color:C.ink,margin:0});
  s.addText([
    {text:"2 missed vague-praise claims",options:{bullet:{type:"bullet"},breakLine:true}},
    {text:"No labeled recency-bias cases yet",options:{bullet:{type:"bullet"},breakLine:true}},
    {text:"No labeled unsupported-claim cases yet",options:{bullet:{type:"bullet"},breakLine:true}},
    {text:"Captured run; repeated-run consistency remains future work",options:{bullet:{type:"bullet"}}},
  ],{x:8.15,y:4.53,w:3.95,h:1.45,fontSize:11,color:C.muted,margin:0.03,paraSpaceAfterPt:9,fit:"shrink"});
  s.addText("Judge takeaway: the dashboard is both evidence and a product safety mechanism—it directs prompt tuning to measurable failure modes.",{x:8.13,y:6.04,w:3.95,h:0.28,fontSize:9.2,bold:true,color:C.orange,margin:0,fit:"shrink"});
}
// 8
{
  const s = pptx.addSlide("MASTER"); addTitle(s, "Governance & privacy", "Implemented controls—and explicit boundaries", "We distinguish actual safeguards from production controls that remain outside the hackathon scope.");
  const done=["Server-only n8n webhook URL","Employee-scoped audit proxy","Runtime request/response validation","Synthetic demo and benchmark data","Field-level approval diffs","Honest governance disclosures"];
  const next=["Authentication and role-based access","No live report persistence in localStorage","Consent and retention policy","Employee export / erasure workflow","Database RLS and append-only permissions","Signed server-to-server workflow requests"];
  s.addShape(pptx.ShapeType.roundRect,{x:0.7,y:2.05,w:5.85,h:3.95,rectRadius:0.08,fill:{color:C.greenSoft},line:{color:C.green,width:1}});
  s.addText("Implemented in the prototype",{x:1.0,y:2.35,w:4.9,h:0.35,fontSize:18,bold:true,color:C.green,margin:0});
  s.addText(done.map(t=>({text:t,options:{bullet:{type:"bullet"},breakLine:true}})),{x:1.0,y:2.98,w:4.95,h:2.35,fontSize:12,color:C.ink,margin:0.03,paraSpaceAfterPt:10,fit:"shrink"});
  s.addShape(pptx.ShapeType.roundRect,{x:6.82,y:2.05,w:5.85,h:3.95,rectRadius:0.08,fill:{color:C.amberSoft},line:{color:"D2A846",width:1}});
  s.addText("Required before production",{x:7.12,y:2.35,w:4.9,h:0.35,fontSize:18,bold:true,color:C.amber,margin:0});
  s.addText(next.map(t=>({text:t,options:{bullet:{type:"bullet"},breakLine:true}})),{x:7.12,y:2.98,w:4.95,h:2.35,fontSize:12,color:C.ink,margin:0.03,paraSpaceAfterPt:10,fit:"shrink"});
  s.addText("Responsible AI means making limitations inspectable—not hiding them behind a polished demo.",{x:1.1,y:6.33,w:11.0,h:0.34,fontSize:16,bold:true,color:C.ink,align:"center",margin:0,fit:"shrink"});
}
// 9
{
  const s = pptx.addSlide("MASTER"); addTitle(s, "90-second demo", "Show the complete safety loop", "Use the biased Arjun scenario to demonstrate grounding, detection, human control, and accountability.");
  const steps=[
    ["01","Generate", "Open Arjun Mehta and generate the draft."],
    ["02","Trace", "Open a citation to show original source text."],
    ["03","Detect", "Find “consistently misses deadlines” contradicted by outcomes."],
    ["04","Block", "Attempt approval; show the server refusal."],
    ["05","Decide", "Amend or acknowledge after review, then approve."],
    ["06","Audit", "Open the final audit trail and evaluation page."],
  ];
  steps.forEach((st,i)=>{
    const col=i%3,row=Math.floor(i/3),x=0.7+col*4.15,y=2.02+row*1.8;
    s.addShape(pptx.ShapeType.roundRect,{x,y,w:3.72,h:1.42,rectRadius:0.08,fill:{color:C.surface},line:{color:C.rule,width:0.8}});
    s.addText(st[0],{x:x+0.2,y:y+0.2,w:0.5,h:0.25,fontSize:12,bold:true,color:C.orange,margin:0});
    s.addText(st[1],{x:x+0.85,y:y+0.19,w:2.5,h:0.27,fontSize:15,bold:true,color:C.ink,margin:0});
    s.addText(st[2],{x:x+0.85,y:y+0.65,w:2.52,h:0.43,fontSize:9.5,color:C.muted,margin:0,fit:"shrink"});
  });
  s.addShape(pptx.ShapeType.roundRect,{x:0.7,y:5.85,w:11.99,h:0.55,rectRadius:0.06,fill:{color:C.ink},line:{color:C.ink}});
  s.addText("Live demo: bias-aware-360-review-system.vercel.app",{x:0.98,y:6.03,w:6.1,h:0.2,fontSize:11,bold:true,color:"FFFFFF",margin:0});
  s.addText("Backup: captured reports keep the full journey available offline",{x:7.0,y:6.03,w:5.35,h:0.2,fontSize:9.5,color:"CFD4DA",align:"right",margin:0,fit:"shrink"});
}
// 10
{
  const s = pptx.addSlide("MASTER");
  s.addShape(pptx.ShapeType.rect,{x:0,y:0,w:13.33,h:7.02,fill:{color:C.ink},line:{color:C.ink}});
  s.addText("WHY THIS PROJECT STANDS OUT",{x:0.75,y:0.72,w:4.2,h:0.25,fontSize:9,bold:true,color:"F9B27D",charSpacing:1.6,margin:0});
  s.addText("A review people can\nquestion before it counts.",{x:0.73,y:1.23,w:7.1,h:1.45,fontSize:35,bold:true,color:"FFFFFF",margin:0,fit:"shrink"});
  s.addText("Grounded",{x:0.78,y:3.32,w:1.65,h:0.32,fontSize:16,bold:true,color:"FFFFFF",margin:0});
  s.addText("Every claim links to evidence.",{x:0.78,y:3.83,w:2.75,h:0.32,fontSize:11,color:"BEC5CC",margin:0});
  s.addText("Agentic",{x:4.08,y:3.32,w:1.65,h:0.32,fontSize:16,bold:true,color:"FFFFFF",margin:0});
  s.addText("Synthesis and audit are independent roles.",{x:4.08,y:3.83,w:2.75,h:0.5,fontSize:11,color:"BEC5CC",margin:0,fit:"shrink"});
  s.addText("Accountable",{x:7.38,y:3.32,w:1.85,h:0.32,fontSize:16,bold:true,color:"FFFFFF",margin:0});
  s.addText("Human decisions and changes are recorded.",{x:7.38,y:3.83,w:2.75,h:0.5,fontSize:11,color:"BEC5CC",margin:0,fit:"shrink"});
  s.addText("Measurable",{x:10.68,y:3.32,w:1.85,h:0.32,fontSize:16,bold:true,color:"FFFFFF",margin:0});
  s.addText("Precision, recall, F1, and misses are visible.",{x:10.68,y:3.83,w:2.0,h:0.5,fontSize:11,color:"BEC5CC",margin:0,fit:"shrink"});
  s.addShape(pptx.ShapeType.line,{x:0.78,y:4.92,w:11.85,h:0,line:{color:"46515B",width:1}});
  s.addText("From scattered feedback to an inspectable decision—without pretending AI should be the final authority.",{x:0.78,y:5.38,w:10.7,h:0.7,fontSize:18,bold:true,color:"FFFFFF",margin:0,fit:"shrink"});
  s.addText("Thank you",{x:10.85,y:6.3,w:1.8,h:0.25,fontSize:11,bold:true,color:"F9B27D",align:"right",margin:0});
}

const output = path.join(root, "Bias-Aware-360-Review-Hackathon-Pitch.pptx");
await pptx.writeFile({ fileName: output });
console.log(output);
