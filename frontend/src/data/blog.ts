export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  category: string;
  date: string;
  readTime: string;
  cover: string;
  body: { heading: string; paragraphs: string[] }[];
};

export const posts: BlogPost[] = [
  {
    slug: "best-resume-tips",
    title: "12 Best Resume Tips That Land Interviews in 2025",
    description: "Recruiter-tested resume tips that pass ATS, capture attention in 6 seconds, and prove impact with metrics.",
    category: "Resume Tips",
    date: "2025-02-04",
    readTime: "8 min",
    cover: "/blog-cover-1.jpg",
    body: [
      {
        heading: "Lead every bullet with a verb and a number",
        paragraphs: [
          "Recruiters scan for impact in seconds. Replace 'Responsible for X' with 'Led X resulting in Y%'. Numbers make claims credible and force you to think about the business outcome you delivered.",
          "If you don't have a metric, estimate one defensibly: team size, frequency, dollar value, time saved.",
        ],
      },
      {
        heading: "Tailor keywords to each job description",
        paragraphs: [
          "Most companies use an ATS to pre-filter resumes. Mirror exact phrasing from the job posting in your skills section, summary, and bullets — then back it up with proof.",
        ],
      },
      {
        heading: "One page if under 10 years experience",
        paragraphs: [
          "Density beats length. A focused, well-edited one-pager outperforms a meandering two-pager almost every time.",
        ],
      },
    ],
  },
  {
    slug: "how-to-pass-ats",
    title: "How to Pass an ATS Resume Scan (Step-by-Step)",
    description: "Exactly how applicant tracking systems parse your CV — and the formatting, keyword, and structure rules to follow.",
    category: "ATS Tips",
    date: "2025-01-22",
    readTime: "10 min",
    cover: "/blog-cover-2.jpg",
    body: [
      {
        heading: "Use a single-column, text-based layout",
        paragraphs: [
          "Two-column layouts and graphics confuse parsers. Stick to a clean single column with standard section headings: Summary, Experience, Education, Skills.",
        ],
      },
      {
        heading: "Save as PDF — but make sure it's selectable text",
        paragraphs: [
          "Image-based PDFs are invisible to most parsers. After exporting, try selecting the text. If you can't, re-export from a text-based source.",
        ],
      },
      {
        heading: "Match 60–70% of the job description's keywords",
        paragraphs: [
          "You don't need every keyword — but the top recurring skills should appear in your skills list and at least one experience bullet, in the same form the JD uses (e.g. 'TypeScript' not 'TS').",
        ],
      },
    ],
  },
  {
    slug: "interview-questions-2025",
    title: "The 15 Interview Questions You'll Be Asked in 2025",
    description: "The most common behavioral and technical interview questions in 2025 — with frameworks to answer each.",
    category: "Interview",
    date: "2025-01-10",
    readTime: "12 min",
    cover: "/blog-cover-3.jpg",
    body: [
      {
        heading: "Tell me about yourself — the 60-second pitch",
        paragraphs: [
          "Structure: present role → 2 most relevant accomplishments → why this role. Practice it out loud until it sounds conversational, not rehearsed.",
        ],
      },
      {
        heading: "Use STAR for every behavioral question",
        paragraphs: [
          "Situation, Task, Action, Result. Spend 70% of your answer on Action and Result — the parts that prove you, not the context.",
        ],
      },
    ],
  },
];

export const categories = ["All", "Resume Tips", "ATS Tips", "Interview", "Career Growth"];