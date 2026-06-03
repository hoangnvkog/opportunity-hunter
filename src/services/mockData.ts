export interface Opportunity {
  id: string;
  title: string;
  description: string;
  frequency: number;
  severity: number;
  buyingIntent: number;
  score: number;
  category: string;
  source: string;
  createdAt: Date;
}

export function getMockOpportunities(): Opportunity[] {
  return [
    {
      id: "1",
      title: "AI-Powered Customer Support Tool",
      description: "Automated customer support using AI to handle common queries and reduce response times.",
      frequency: 85,
      severity: 90,
      buyingIntent: 75,
      score: 83,
      category: "Customer Service",
      source: "Reddit",
      createdAt: new Date("2026-05-15"),
    },
    {
      id: "2",
      title: "Project Management for Remote Teams",
      description: "Simplified project management tool specifically designed for distributed teams.",
      frequency: 72,
      severity: 85,
      buyingIntent: 68,
      score: 75,
      category: "Productivity",
      source: "App Reviews",
      createdAt: new Date("2026-05-12"),
    },
    {
      id: "3",
      title: "Social Media Analytics Platform",
      description: "Comprehensive analytics platform for small businesses to track social media performance.",
      frequency: 65,
      severity: 78,
      buyingIntent: 82,
      score: 75,
      category: "Marketing",
      source: "Reddit",
      createdAt: new Date("2026-05-10"),
    },
    {
      id: "4",
      title: "E-commerce Inventory Manager",
      description: "Smart inventory management system that predicts demand and automates reordering.",
      frequency: 58,
      severity: 88,
      buyingIntent: 70,
      score: 72,
      category: "E-commerce",
      source: "App Reviews",
      createdAt: new Date("2026-05-08"),
    },
    {
      id: "5",
      title: "Personal Finance Tracker",
      description: "AI-powered personal finance app that provides budgeting insights and savings recommendations.",
      frequency: 92,
      severity: 75,
      buyingIntent: 85,
      score: 84,
      category: "Finance",
      source: "Reddit",
      createdAt: new Date("2026-05-05"),
    },
    {
      id: "6",
      title: "Healthcare Appointment Scheduler",
      description: "Automated appointment scheduling system for medical practices with SMS reminders.",
      frequency: 68,
      severity: 92,
      buyingIntent: 65,
      score: 75,
      category: "Healthcare",
      source: "App Reviews",
      createdAt: new Date("2026-05-01"),
    },
  ];
}

export function getCategoryCount(category: string): number {
  const categories = ["Customer Service", "Productivity", "Marketing", "E-commerce", "Finance", "Healthcare"];
  const baseCounts = [12, 18, 15, 10, 22, 8];
  
  const index = categories.indexOf(category);
  if (index >= 0) {
    return baseCounts[index] + Math.floor(Math.random() * 5);
  }
  return Math.floor(Math.random() * 20);
}
