import { AppHeader } from "@/components/app-header";

const reviewers = [
  ["Anya Sharma", "Senior Content Analyst", "Gender Bias", "AS"],
  ["David Lee", "AI Ethics Specialist", "Cultural Sensitivity", "DL"],
  ["Syan Cang", "AI Ethics Specialist", "Racial Equity", "SC"],
  ["David Saure", "Senior Content Analyst", "Racial Equity", "DS"],
  ["Maya Nair", "Senior Content Analyst", "Gender Bias", "MN"],
  ["Arjun Mehta", "AI Ethics Specialist", "Cultural Sensitivity", "AM"],
  ["Sana Iqbal", "AI Ethics Specialist", "Racial Equity", "SI"],
  ["Neha Kapoor", "Senior Content Analyst", "Racial Equity", "NK"],
];

export default function ReviewersPage() {
  return <div className="app-shell"><AppHeader /><main className="directory-page"><h1>Reviewers Directory</h1><div className="directory-filters"><label className="search-field"><span>⌕</span><input placeholder="Search reviewers..." /></label><select aria-label="Filter by specialty"><option>Specialty</option></select></div><section className="reviewer-grid">{reviewers.map(([name, role, specialty, initials], index) => <article className="reviewer-card" key={name}><div className="reviewer-heading"><span className={`reviewer-avatar avatar-${index % 4}`}>{initials}</span><div><h2>{name}</h2><p>{role}</p></div></div><div className="reviewer-detail"><span>Area of Expertise</span><b>{specialty}</b></div><div className="reviewer-score"><div><span>Current Score</span><strong>4.9 / 5.0</strong></div><i><em /></i></div><p className="reviewer-quote">“Consistently identifies subtle bias in complex texts.”</p></article>)}</section></main></div>;
}
