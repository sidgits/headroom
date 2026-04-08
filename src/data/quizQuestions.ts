export interface QuizAnswer {
  id: string;
  text: string;
}

export interface QuizQuestionData {
  id: number;
  question: string;
  answers: QuizAnswer[];
}

export const quizQuestions: QuizQuestionData[] = [
  {
    id: 1,
    question: "When you're deep in focused work and something urgent interrupts you, what actually happens?",
    answers: [
      { id: "A", text: "I protect my focus and deal with it when I'm ready" },
      { id: "B", text: "I switch immediately and pick up where I left off easily" },
      { id: "C", text: "I switch but lose the thread — recovery takes longer than the interruption itself" },
      { id: "D", text: "It depends — who's asking and how urgent it is both matter" },
    ],
  },
  {
    id: 2,
    question: "Where does your best thinking happen?",
    answers: [
      { id: "A", text: "Alone, uninterrupted, with enough time to go deep" },
      { id: "B", text: "In dialogue — ideas sharpen when I work through them with others" },
      { id: "C", text: "Under mild pressure — a deadline or constraint actually helps me focus" },
      { id: "D", text: "I don't have a strong preference — I adapt to whatever the situation is" },
    ],
  },
  {
    id: 3,
    question: "You're handed a complex problem with no clear precedent and high stakes. Your gut reaction is:",
    answers: [
      { id: "A", text: "Energised — no template means I can shape it myself" },
      { id: "B", text: "Cautious but engaged — I'll define the structure before diving in" },
      { id: "C", text: "Uncomfortable — I work better when the brief is clear" },
      { id: "D", text: "Neutral — I've learned to work with whatever I'm handed" },
    ],
  },
  {
    id: 4,
    question: "Your most satisfying work moments have involved:",
    answers: [
      { id: "A", text: "Solving something genuinely hard that nobody else had figured out" },
      { id: "B", text: "Executing something complex at pace and getting it right" },
      { id: "C", text: "Helping someone get unstuck or move faster" },
      { id: "D", text: "Delivering reliably on work I knew I could handle well" },
    ],
  },
  {
    id: 5,
    question: "At the end of a genuinely productive week, what tells you it was productive?",
    answers: [
      { id: "A", text: "I moved something important forward that actually matters" },
      { id: "B", text: "I cleared everything on my list" },
      { id: "C", text: "I learned something or got genuinely better at something" },
      { id: "D", text: "People needed me and I came through" },
    ],
  },
  {
    id: 6,
    question: "Which of these feels most uncomfortably true about your work right now?",
    answers: [
      { id: "A", text: "I'm busy but I'm not growing" },
      { id: "B", text: "I have the capacity but not the challenge" },
      { id: "C", text: "I know what good looks like but I can't seem to find it" },
      { id: "D", text: "I'm not sure what would make work feel genuinely fulfilling" },
    ],
  },
];

export const roles = [
  { id: "builder", label: "Builder / Maker", description: "Code, design, craft" },
  { id: "advisor", label: "Advisor / Strategist", description: "Thinking, writing, consulting" },
  { id: "lead", label: "Lead / Manager", description: "Coordinating people and outcomes" },
  { id: "founder", label: "Founder / Executive", description: "Everything at once" },
  { id: "freelancer", label: "Freelancer / Independent", description: "Multiple clients or projects" },
];
