export interface ResumeBasicInfo {
  id?: number;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  dateOfBirth: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  objective: string | null;
  predictedLevel: string | null;
  predictedIndustry: string | null;
}

export interface ResumeSkill {
  id?: number;
  skillName: string;
  category: "TECHNICAL" | "SOFT" | "LANGUAGE" | "TOOL" | string;
  proficiencyLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT" | string;
  yearsOfExperience: number | null;
}

export interface ResumeExperience {
  id?: number;
  companyName: string;
  position: string;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  description: string;
  achievements: string | null;
  displayOrder: number;
}

export interface ResumeEducation {
  id?: number;
  institutionName: string;
  degree: string | null;
  fieldOfStudy: string | null;
  startDate: string | null;
  endDate: string | null;
  gpa: number | null;
  description: string | null;
  displayOrder: number;
}

export interface ResumeCertification {
  id?: number;
  name: string;
  issuingOrganization: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  credentialUrl: string | null;
}

export interface ResumeProject {
  id?: number;
  name: string;
  role: string;
  technologies: string;
  description: string;
  url: string | null;
  startDate: string | null;
  endDate: string | null;
}

export interface ResumeLanguage {
  id?: number;
  language: string;
  proficiency: "BASIC" | "CONVERSATIONAL" | "PROFESSIONAL" | "NATIVE" | string;
}

export interface Resume {
  id: number;
  fileUrl: string;
  contentType: string;
  fileSize: number;
  extractedText: string | null;
  parsedData: string; // Chuỗi JSON chứa thông tin GeminiParsedData
  parseStatus: "PENDING" | "PROCESSING" | "DONE" | "FAILED";
  basicInfo: ResumeBasicInfo | null;
  skills: ResumeSkill[];
  experiences: ResumeExperience[];
  educations: ResumeEducation[];
  certifications: ResumeCertification[];
  projects: ResumeProject[];
  languages: ResumeLanguage[];
  createdAt?: string;
  updatedAt?: string;
}

export interface GeminiParsedData {
  total_score: number;
  stage1_detection: {
    name: string;
    level: string;
    industry: string;
  };
  stage2_core: {
    score: number;
    ats_format: {
      score: number;
      details: string[];
    };
    professional_foundation: {
      score: number;
      details: string[];
    };
    content_quality: {
      score: number;
      details: string[];
    };
  };
  stage3_in_depth: {
    score: number;
    experience_eval: {
      score: number;
      details: string[];
    };
    technical_evidence: {
      score: number;
      details: string[];
    };
    projects: {
      score: number;
      details: string[];
    };
    certs: {
      score: number;
      details: string[];
    };
  };
  stage4_bonus: {
    score: number;
    details: string[];
  };
  strengths: string[];
  priority_actions: {
    action: string;
    priority: "Cao" | "Trung bình" | "Thấp" | string;
  }[];
  sub_tips?: {
    [key: string]: string | null;
  };
  score_gaps?: {
    section: string;
    current: number;
    max: number;
    lost: number;
    tip: string;
  }[];
}
