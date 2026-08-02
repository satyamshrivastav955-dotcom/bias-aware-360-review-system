import { AppHeader } from "@/components/app-header";

const submissions = [
  ["Priya Sharma", "The Future of Backend Architecture: Scaling for Growth", "Aug 12, 2026", "Under Review", "High Priority"],
  ["Rohan Verma", "User Research: Uncovering Bias in Product Design", "Aug 11, 2026", "Pending Audit", "Medium Priority"],
  ["Anya Patel", "Ethical AI: A Framework for Content Moderation", "Aug 10, 2026", "New", "High Priority"],
  ["David Lee", "Refactoring Legacy Code: Best Practices and Pitfalls", "Aug 09, 2026", "Approved", "Low Priority"],
  ["Maria Garcia", "Accessibility in Modern Web Development", "Aug 08, 2026", "Changes Requested", "Medium Priority"],
];

const tone = (value: string) => value.toLowerCase().replaceAll(" ", "-");

export default function SubmissionsPage() {
  return <div className="app-shell"><AppHeader /><main className="submissions-layout">
    <section className="page-content">
      <div className="page-intro"><div><h1>Editorial Submissions</h1></div><div className="cycle-card"><span>▣</span><div><small>Active cycle</small><strong>August 2026</strong></div></div></div>
      <div className="filter-row"><select aria-label="Status"><option>Status: All</option></select><select aria-label="Priority"><option>Priority: All</option></select><select aria-label="Sort submissions"><option>Sort by: Date Submitted</option></select><label className="search-field"><span>⌕</span><input placeholder="Search submissions" /></label></div>
      <div className="submission-table"><div className="submission-head"><span>Author</span><span>Title</span><span>Date Submitted</span><span>Status</span><span>Priority</span></div>{submissions.map((item, index) => <article className={index === 0 ? "submission-row featured" : "submission-row"} key={item[0]}><span>{item[0]}</span><strong>{item[1]}</strong><span>{item[2]}</span><span><i className={`pill ${tone(item[3])}`}>{item[3]}</i></span><span><i className={`pill ${tone(item[4])}`}>{item[4]}</i></span></article>)}</div>
      <div className="pagination">Page 1 of 12 <button disabled>‹</button><button>›</button></div>
    </section>
  </main></div>;
}
